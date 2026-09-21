#!/usr/bin/env node
/**
 * typo-nbsp.mjs — espaces insécables dans le HTML construit (RECETTE-SITE.md §10.3).
 *
 * Un chiffre ne doit jamais se retrouver en fin de ligne, séparé de son unité ou de ses
 * milliers : « 55 | % », « 20 | 921 $ ». Les textes rédigés à la main utilisent une espace
 * normale ; plutôt que de corriger des milliers de passages, on la remplace après le build.
 *   - toutes langues : chiffre + espace + (%, €, $, CHF, h, milliers) → espace insécable
 *   - français       : espace avant « : ; ? ! » et à l'intérieur de « » → espace insécable
 * Sont laissés intacts : attributs, <script>, <style>, <pre>, <textarea>, et le contenu des
 * <astro-island> (React compare son rendu au HTML servi lors de l'hydratation).
 *
 * En mode --check, signale aussi les décimales écrites avec un point dans une langue à virgule
 * (fr-FR, fr-CA, fr-CH, de-DE, es, nl…) : « 13.18 € », « 18.3 mois », « 0.5 maand » viennent d'un
 * paramètre inséré brut (`{A.x}`) ou d'un `toFixed`, avec ou sans unité derrière. Le point reste correct en anglais et en suisse allemand (de-CH).
 * fr-CH : virgule (décision du 2026-09-18, RECETTE §4).
 * En français, signale aussi les mots écrits sans leurs accents (« fiscalite », « epargne »,
 * « interets », « a partir de ») : trouvé sur 129 guides sur 208 d'epargnemalin.fr le 2026-09-19 ;
 * et les accents ajoutés à tort (« vià », « centrès », « succèssion »).
 *
 * Usage : node scripts/typo-nbsp.mjs [dist]         (appelé par `npm run build`)
 *         node scripts/typo-nbsp.mjs [dist] --check  (compte sans modifier, code 1 si reste)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || 'dist';
const CHECK = process.argv.includes('--check');
const NB = ' ';

const UNIT = /(\d) (?=(?:%|€|\$|CHF|Fr\.|h\b|\d{3}(?!\d)))/g;
const FR_BEFORE = / (?=[:;?!»])/g;
const FR_AFTER = /« /g;

async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    // node_modules contient des .html de documentation : ils ne font pas partie du site
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') yield* walk(p); }
    else if (e.name.endsWith('.html')) yield p;
  }
}

function fix(html) {
  const fr = /<html[^>]*\blang="fr/i.test(html);
  // Langue à virgule décimale : on corrige aussi le séparateur dans le texte visible.
  // Réécrire 106 appels à `toFixed()` site par site ne tenait pas ; la correction se
  // fait donc ici, sur le seul texte que le lecteur voit (rightetf.com, 2026-09-21).
  const { lang } = dotDecimals(html);
  const virgule = lang && !/^(en|ja|ko|zh|th|he|hi|bn|ar|ms|id)|^de-CH|^it-CH/i.test(lang);
  let skip = 0, count = 0, decimales = 0;
  const out = html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      const m = part.match(/^<(\/?)(script|style|pre|textarea|astro-island|code|kbd)\b/i);
      if (m) skip += m[1] ? -1 : (part.endsWith('/>') ? 0 : 1);
      return part;
    }
    if (skip > 0 || !part.trim()) return part;
    let t = part.replace(UNIT, (_, d) => (count++, d + NB));
    if (fr) t = t.replace(FR_BEFORE, () => (count++, NB)).replace(FR_AFTER, () => (count++, '«' + NB));
    if (virgule) {
      t = t.replace(DOT_DECIMAL, (m) => {
        decimales++;
        return m.replace('.', ',');
      });
    }
    return t;
  }).join('');
  return { out, count, decimales };
}

// Toute décimale à point, unité ou non (« 13.18 € », « 0.5 maand », « divisé par 111.8 »),
// sauf numéros d'articles et de documents (« art. 22.2 », « artikel 11.7a », « Mémento 2.01 »), dates,
// numéros de section (« 8.1 Responsable »), cylindrées (« 1.5 TSI ») et normes (« ECE 22.05 »).
const DOT_DECIMAL = /(?<![\d.,’'\w])(?<!(?:art\.?|artikel|Art\.?|§|Abs\.?|al\.|Form\.?|art[ií]culos?|Art[ií]culos?|articles?|Articles?|artigos?|Artigos?)\s?)(?<!\d\.\d[\d.a-z)]*,?\s(?:y|e|et|and|und|o|ou)\s)(?<!(?:Mémento|Merkblatt|Memento)[^\d]{0,14})(?<!(?:ECE|norme|\^|Ducato|\d\.\d\d ou|version|TLS|ETH|RGAA|WCAG|HTTP|Web)\s?)(?:\d{1,3}(?:['’]\d{3})+|\d+)\.\d{1,2}(?![\d.\w])(?!\s(?:[A-Z][a-zé]|TSI|TDI|TFSI|TCe|PureTech|BlueHDi|dCi|HDi|THP|hybride|essence|diesel|ou\s\d))/g;
/** Texte réellement lu par le visiteur : hors script, style et code. */
function texteVisible(html) {
  let skip = 0;
  return html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      const m = part.match(/^<(\/?)(script|style|pre|textarea|astro-island|code|kbd)\b/i);
      if (m) skip += m[1] ? -1 : (part.endsWith('/>') ? 0 : 1);
      return ' ';
    }
    return skip > 0 ? ' ' : part;
  }).join('');
}

function dotDecimals(html) {
  const lang = (html.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] || '';
  if (/^(en|ja|ko|zh|th|he|hi|bn|ar|ms|id)|^de-CH|^it-CH/i.test(lang)) return { lang, hits: [] };   // point décimal : anglais, japonais, coréen, chinois, thaï, hébreu, hindi, bengali, arabe (chiffres latins), malais, indonésien, suisse allemand et italien (CLDR)
  const text = texteVisible(html);
  // Numéro de version (« iDrive 8.5 », « Safety Sense 3.0 », « Blade 2.0 », « mise à jour
  // logicielle 3.5 », « un 2.0 turbo ») : nom propre ou « version / logicielle / un » juste avant,
  // et aucune unité juste après. Une vraie mesure (« Batterie 77.5 kWh ») garde son unité.
  const hits = [];
  for (const m of text.matchAll(DOT_DECIMAL)) {
    const before = text.slice(Math.max(0, m.index - 30), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 8);
    const version = /(?:\b[A-Za-z]*[A-Z][\w-]*|\b(?:version|logicielle|logiciel|un|une|le|la|PM))\s?$/.test(before)
      && !/^\s?(?:kWh|kW|km|kg|ch|€|%|L\b|m\b|min|h\b|s\b|ct|mm|cm|t\b|g\b|pouces|ans|mois|euros|fois|x\b)/.test(after);
    if (!version) hits.push(m[0]);
  }
  return { lang, hits };
}

// Mots qui n'existent pas sans accent en français correct (liste volontairement sûre : pas de
// « a », « ou », « ete », « du » qui ont un sens sans accent).
// Frontières Unicode : avec \b, JavaScript verrait « tres » dans « mètres ». Un nom de domaine
// (« impots.gouv.fr ») n'est pas une faute. Minuscules seulement : l'accent sur une capitale
// (« Epargne ») est recommandé mais toléré.
const NO_ACCENT = /(?<![\p{L}\p{N}])(epargnes?|epargner|fiscalites?|interets?|strategies?|impots?|annees?|periodes?|detaille(?:e|s|es)?|securite|necessaires?|reel(?:le|s|les)?|deja|tres|apres|beneficiaires?|societes?|systemes?|economies?|precaution|electriques?|vehicules?|resume|credit(?:s)? immobiliers?|prelevements?|deduction|remuneration|independants?|debutants?|methodes?|categories?|reduction|generale?s?|necessite|equipe|etape|etapes|criteres?|specifique|scenario|scenarios|numero|zero|a partir|(?<!\b(?:qui|il|elle|on|n'y|y) )a la|(?<!\b(?:qui|il|elle|on) )a l'|au dela)(?![\p{L}\p{N}]|\.[a-z])/gu;
// Accents ajoutés à tort par un vieux script de correction : « vià », « centrès », « Titrès »,
// « succèssion » (1 012 occurrences sur cartegrisesimple.fr, 2026-09-19). Liste blanche des
// vrais mots en consonne + « rès » ; « è » devant une consonne doublée n'existe pas.
const RES_OK = new Set(['très', 'près', 'après', 'auprès', 'exprès', 'progrès', 'congrès', 'cyprès', 'crès', 'grès']);
const WRONG_ACCENT = /(?<![\p{L}])(vià|và|[\p{L}]*è(?:ss|tt|ll|nn|mm|pp|rr)[\p{L}]*|[\p{L}]*[bcdfgmnprtv]rès)(?![\p{L}])/gu;
function wrongAccents(html) {
  if (!/<html[^>]*\blang="fr/i.test(html)) return [];
  const text = texteVisible(html);
  return (text.match(WRONG_ACCENT) || []).filter((w) => !RES_OK.has(w.toLowerCase()));
}

function missingAccents(html) {
  if (!/<html[^>]*\blang="fr/i.test(html)) return [];
  const text = texteVisible(html).replace(/https?:\/\/\S+/g, ' ');
  const hits = text.match(NO_ACCENT) || [];
  // « a la » est ambigu : « Quelle Audi a la meilleure autonomie ? » est correct.
  // On ne le retient donc que sur une page qui perd déjà d'autres accents, signe
  // d'un texte désaccentué (guidevoitureelectrique.fr, 2026-09-21).
  const ambigu = (m) => /^(a la|a l'|au dela)$/i.test(m.trim());
  return hits.some((m) => !ambigu(m)) ? hits : [];
}

let total = 0, files = 0, dots = 0, corrigees = 0; const dotPages = [];
let accents = 0; const accentPages = [];
for await (const f of walk(dist)) {
  const html = await readFile(f, 'utf8');
  const { out, count, decimales } = fix(html);
  if (count || decimales) { total += count; corrigees += decimales; files++; if (!CHECK) await writeFile(f, out); }
  if (CHECK) {
    const { lang, hits } = dotDecimals(html);
    if (hits.length) { dots += hits.length; dotPages.push(`${f} : ${hits.slice(0, 3).join(', ')}`); }
    const wrong = wrongAccents(html);
    if (wrong.length) { accents += wrong.length; accentPages.push(`${f} : accent faux ${[...new Set(wrong)].slice(0, 4).join(', ')}`); }
    const miss = missingAccents(html);
    if (miss.length) { accents += miss.length; accentPages.push(`${f} : ${[...new Set(miss)].slice(0, 4).join(', ')}`); }
  }
}
console.log(`typo-nbsp: ${total} espace(s) ${CHECK ? 'à corriger' : 'rendue(s) insécable(s)'} dans ${files} page(s)`);
if (!CHECK && corrigees) console.log(`typo-nbsp: ${corrigees} décimale(s) passée(s) à la virgule`);
if (CHECK) {
  console.log(`typo-nbsp: ${dots} décimale(s) avec un point dans une langue à virgule`);
  dotPages.slice(0, 10).forEach((l) => console.log('  ' + l));
  console.log(`typo-nbsp: ${accents} mot(s) français sans accent ou avec un accent faux`);
  accentPages.slice(0, 10).forEach((l) => console.log('  ' + l));
}
if (CHECK && (total || dots || accents)) process.exit(1);
