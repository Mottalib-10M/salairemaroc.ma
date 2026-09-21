#!/usr/bin/env node
/**
 * accents-code.mjs — rétablit les accents dans le TEXTE des fichiers de code (.astro, .ts,
 * .tsx), sans jamais toucher au code lui-même (RECETTE §10.3).
 *
 * Le 2026-09-19, une première version à base d'expressions régulières a renommé une variable
 * (`region` → `région`) et une balise (`<select>` → `<sélect>`) sur cartegrisesimple.fr :
 * une apostrophe de texte avait été prise pour un début de chaîne. D'où ce second outil, qui
 * s'appuie sur l'analyseur TypeScript :
 *   - .ts / .tsx : seuls les JsxText et les chaînes (y compris les parties littérales des
 *     gabarits `…${x}…`) qui contiennent une espace sont corrigés ; jamais les imports, les
 *     clés d'objet, ni les attributs techniques (href, className, id, key, slug…).
 *   - .astro : l'arbre vient de l'analyseur officiel (@astrojs/compiler, positions en
 *     octets) ; le texte entre balises et les attributs de texte (title, alt, aria-label,
 *     placeholder, content) sont corrigés ; dans les expressions {…} et le frontmatter, seules
 *     les chaînes le sont ; <script> et <style> ne sont jamais touchés. (Une version maison
 *     prenait l'apostrophe de « l'épargne » pour une chaîne et sautait la fin du fichier.)
 *
 * Le dictionnaire (mot sans accent → mot accentué, sans ambiguïté) est produit par
 * accents-fr.py --map ; ce script n'applique que ce qu'il contient. Il traite aussi le Markdown
 * et le MDX (texte, frontmatter title/description, valeurs de texte des composants).
 *
 * Usage : node accents-code.mjs <dossier-src> <map.json> [--dry]
 *         (NODE_PATH doit donner accès au paquet `typescript`)
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');

const [root, mapFile] = process.argv.slice(2);
const DRY = process.argv.includes('--dry');
const MAP = JSON.parse(readFileSync(mapFile, 'utf8'));
const LOCUTIONS = [
  [/\ba partir d/g, 'à partir d'], [/\bA partir d/g, 'À partir d'], [/\bau[ -]dela\b/g, 'au-delà'],
  [/\bAu[ -]dela\b/g, 'Au-delà'], [/\ba l'exception\b/g, "à l'exception"], [/\bgrace a\b/g, 'grâce à'],
  [/\bjusqu'a\b/g, "jusqu'à"], [/\bpar rapport a\b/g, 'par rapport à'], [/\bquant a\b/g, 'quant à'],
  [/\bc'est-a-dire\b/g, "c'est-à-dire"], [/\bpeut-etre\b/g, 'peut-être'],
];
const WORD = /(?<![\p{L}\p{N}_/#.@-])(?<!&[a-zA-Z]{2,8};)(?<!&#\d{2,5};)(\p{L}+)(?![\p{L}\p{N}_/@]|\.[a-z])/gu;
// --prepositions : « a la » → « à la » et « a l' » → « à l' », sauf avoir + nom (« le vendeur a
// l'obligation », « il a la possibilité »). Validé à la relecture sur cartegrisesimple.fr (2026-09-19).
const PREPS = process.argv.includes('--prepositions');
// Locutions et règles de contexte : français seulement (« a partir de » est correct en portugais).
const FR = !process.argv.includes('--lang') || process.argv[process.argv.indexOf('--lang') + 1] === 'fr';
const AVOIR_NOM = "(?:obligation|discipline|charge|mainmise|nationalité|majorité|propriété du|avantage|inconvénient|habitude|air|intention|occasion|autorisation|accord|exclusivité|initiative|usage|option|opportunité|ambition|expérience|honneur|impression|possibilité|responsabilité|priorité|garde|parole|chance|capacité|faculté|liberté|main|certitude|garantie)";
const SUJET = "(?:il|elle|on|qui|Il|Elle|On|Qui|y)";
let words = 0;
// « detaille » : verbe devant un déterminant (« ce guide détaille les règles »), adjectif sinon
// (« un article détaillé »). Les pluriels sont toujours des adjectifs.
const DETAIL = /(?<![\p{L}-])([Dd])etaill(e|es|ee|ees)(?![\p{L}-])(\s+(\p{L}+))?/gu;
const DET_NEXT = /^(les|la|le|l|chaque|comment|pour|en|ici|tous|toutes|ce|ces|cette|un|une|des|votre|vos|son|sa|ses|leur|leurs)$/i;
function fixText(t) {
  if (!FR) return t.replace(WORD, (w) => {
    const r = MAP[w.toLowerCase()]; if (!r) return w; words++;
    if (w === w.toUpperCase() && w.length > 1) return r.toUpperCase();
    return w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
  });
  t = t.replace(DETAIL, (m, d, end, rest, next) => {
    words++;
    const D = d === 'D' ? 'D' : 'd';
    const tail = rest || '';
    if (end === 'e' && next && DET_NEXT.test(next.replace(/[’']$/, ''))) return `${D}étaille${tail}`;
    return `${D}étaill${{ e: 'é', es: 'és', ee: 'ée', ees: 'ées' }[end]}${tail}`;
  });
  for (const [a, b] of LOCUTIONS) t = t.replace(a, () => (words++, b));
  // Noms ambigus avec un participe (épargne/épargné, agréé/agrée) : nom après un déterminant.
  // « epargne » : participe après avoir (« avait epargne », « rien epargne », « chaque euro
  // epargne ») → épargné ; partout ailleurs le nom ou le verbe conjugué → épargne.
  t = t.replace(/(?<=\b(?:avait|avoir|ai|as|a|ont|avons|avez|rien|euro|été|déjà)\s)epargne(?![\p{L}])/gu, () => (words++, 'épargné'));
  t = t.replace(/(?<![\p{L}/_-])(E|e)pargne(s?)(?![\p{L}/_-])/gu, (m, e, pl) => (words++, `${e === 'E' ? 'É' : 'é'}pargne${pl}`));
  // nécessité (nom, après un déterminant ou « en cas de ») / nécessite (verbe, ailleurs)
  t = t.replace(/(?<![\p{L}])(la|de|sans|par|une) necessite(?![\p{L}])/gu, (m, d) => (words++, `${d} nécessité`));
  t = t.replace(/(?<![\p{L}])necessite(?![\p{L}])/gu, () => (words++, 'nécessite'));
  // équipe : toujours le nom dans ces textes, sauf après être (« est equipe de »)
  t = t.replace(/(?<![\p{L}]|(?:est|sont|être|bien|mal) )(E|e)quipe(s?)(?![\p{L}])/gu, (m, e, pl) => (words++, `${e === 'E' ? 'É' : 'é'}quipe${pl}`));
  // résumé (« en résumé ») / résume (verbe : « se résume », « résume parfaitement »)
  t = t.replace(/(?<![\p{L}])([Ee]n) resume(?![\p{L}])/gu, (m, e) => (words++, `${e} résumé`));
  t = t.replace(/(?<![\p{L}])resume(?= (?:pas|parfaitement|bien|à|a) )/gu, () => (words++, 'résume'));
  if (PREPS) {
    // « a la » peut être coupé par un retour à la ligne dans le JSX, et l'apostrophe écrite &apos;
    t = t.replace(new RegExp(`(?<![\\p{L}'’;-])(${SUJET}\\s)?a(\\s+)(la|l'|l’|l&apos;)(?![\\p{L}])`, 'gu'), (m, suj, sp, art, off, str) => {
      if (suj) return m;                                         // « il a la … » : verbe
      const nextWord = str.slice(off + m.length).match(/^[\s*_]*(\p{L}+)/u)?.[1] || '';   // « a la **flat tax** »
      if (new RegExp(`^${AVOIR_NOM}$`, 'u').test(nextWord)) return m;   // « a l'obligation »
      words++; return `à${sp}${art}`;
    });
  }
  if (PREPS) {
    // « a » suivi d'un infinitif est toujours la préposition (« a éviter » → « à éviter ») :
    // le verbe avoir n'est jamais suivi d'un infinitif. Quelques adjectifs en -er font exception.
    t = t.replace(/(?<![\p{L}'’-])a (?=(\p{L}+er)(?![\p{L}]))/gu, (m, _n, off, str) => {
      const next = str.slice(off + 2).match(/^\p{L}+/u)[0].toLowerCase();
      if (/^(premier|dernier|cher|léger|entier|hier|super|fer|mer|hiver|amer|fier|hier|particulier|singulier|régulier|foyer|loyer|dossier|métier|marcher|quartier|panier|cahier|courrier|clavier|papier|chantier|banquier|boucher|conseiller|héritier|créancier|rentier|bailleur|trésorier|pier|laser|manager|leader|poster|user|power)$/.test(next)) return m;
      words++; return 'à ';
    });
  }
  return t.replace(WORD, (w) => {
    const lw = w.toLowerCase(); const r = MAP[lw];
    if (!r) return w;
    words++;
    if (w === w.toUpperCase() && w.length > 1) return r.toUpperCase();
    return w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
  });
}

const SKIP_ATTR = /^(href|src|class|className|id|key|slug|path|url|icon|type|lang|rel|target|for|htmlFor|as|name|role|method|action|variant|size|color|data-[\w-]+|client:\w+|set:html|is:\w+)$/;
const SKIP_PROP = /^(href|src|slug|path|url|id|key|icon|type|className|class|color|variant|lang|href\w*|image|img|logo|file|route|pattern|format|currency|locale|unit|code|kind)$/;

/** Corrige les littéraux de texte d'un morceau de code TS/TSX ; renvoie le code modifié. */
function fixCode(code, tsx = true) {
  const sf = ts.createSourceFile('x.tsx', code, ts.ScriptTarget.Latest, true, tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const propName = (n) => {
    const p = n.parent;
    if (p && ts.isPropertyAssignment(p) && p.initializer === n) return p.name.getText(sf).replace(/['"]/g, '');
    if (p && ts.isJsxAttribute(p)) return p.name.getText(sf);
    if (p && ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent)) return p.parent.name.getText(sf);
    return null;
  };
  const visit = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isJsxText(n)) {
      const t = n.getText(sf); const f = fixText(t);
      if (f !== t) edits.push([n.getStart(sf), n.getEnd(), f]);
    } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      const p = n.parent;
      const isKey = p && (ts.isPropertyAssignment(p) || ts.isPropertySignature?.(p)) && p.name === n;
      const pn = propName(n);
      const raw = n.getText(sf);
      if (!isKey && !(pn && (SKIP_ATTR.test(pn) || SKIP_PROP.test(pn))) && / /.test(raw) && !/^['"`](\/|https?:|#(?!#)|\.)\S*['"`]?$/.test(raw)
          && !(p && (ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p)))) {
        const f = fixText(raw);
        if (f !== raw) edits.push([n.getStart(sf), n.getEnd(), f]);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  edits.sort((a, b) => b[0] - a[0]);
  let out = code;
  for (const [s, e, f] of edits) out = out.slice(0, s) + f + out.slice(e);
  return out;
}

/** Corrige les chaînes d'un fragment de JS (pas forcément complet) avec l'analyseur lexical. */
function fixJsFragment(code) {
  const sc = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, code);
  const edits = []; const sig = []; const tpl = [];
  for (let k = sc.scan(); k !== ts.SyntaxKind.EndOfFileToken; k = sc.scan()) {
    if (k === ts.SyntaxKind.CloseBraceToken && tpl.length) { k = sc.reScanTemplateToken(false); if (k === ts.SyntaxKind.TemplateTail) tpl.pop(); }
    if (k === ts.SyntaxKind.TemplateHead) tpl.push(1);
    if (k === ts.SyntaxKind.WhitespaceTrivia || k === ts.SyntaxKind.NewLineTrivia || k === ts.SyntaxKind.SingleLineCommentTrivia || k === ts.SyntaxKind.MultiLineCommentTrivia) continue;
    const isStr = k === ts.SyntaxKind.StringLiteral || k === ts.SyntaxKind.NoSubstitutionTemplateLiteral
      || k === ts.SyntaxKind.TemplateHead || k === ts.SyntaxKind.TemplateMiddle || k === ts.SyntaxKind.TemplateTail;
    if (isStr) {
      const raw = sc.getTokenText();
      const key = sig.length >= 2 && sig[sig.length - 1][0] === ts.SyntaxKind.ColonToken ? sig[sig.length - 2][1].replace(/['"]/g, '') : null;
      const afterImport = sig.some(([kk]) => kk === ts.SyntaxKind.ImportKeyword) && sig.length < 8;
      if (/ /.test(raw) && !/^['"`](\/|https?:|#(?!#)|\.)\S*['"`]?$/.test(raw) && !(key && (SKIP_PROP.test(key) || SKIP_ATTR.test(key))) && !afterImport) {
        const f = fixText(raw);
        if (f !== raw) edits.push([sc.getTokenStart(), sc.getTokenEnd(), f]);
      }
    }
    sig.push([k, sc.getTokenText()]); if (sig.length > 8) sig.shift();
  }
  edits.sort((a, b) => b[0] - a[0]);
  let out = code;
  for (const [s0, e0, f] of edits) out = out.slice(0, s0) + f + out.slice(e0);
  return out;
}

const TEXT_ATTRS = new Set(['title', 'alt', 'aria-label', 'placeholder', 'content', 'description', 'label']);
let astroParse = null;
function fixAstro(src) {
  if (!astroParse) astroParse = createRequire(join(process.cwd(), 'package.json'))('@astrojs/compiler/sync').parse;
  const buf = Buffer.from(src, 'utf8');
  const { ast } = astroParse(src, { position: true });
  const edits = [];                                   // [début octet, fin octet, texte]
  const seg = (a, b) => buf.subarray(a, b).toString('utf8');
  const walk = (n, inExpr) => {
    if (n.type === 'frontmatter') {
      const a = n.position.start.offset + 3, b = n.position.end.offset - 3;
      const code = seg(a, b); const f = fixCode(code, false);
      if (f !== code) edits.push([a, b, f]);
      return;
    }
    if (n.type === 'element' && /^(script|style)$/i.test(n.name)) return;
    if (n.type === 'text' && n.position?.end) {
      const a = n.position.start.offset, b = n.position.end.offset; const t = seg(a, b);
      const f = inExpr ? fixJsFragment(t) : fixText(t);
      if (f !== t) edits.push([a, b, f]);
      return;
    }
    for (const at of n.attributes || []) {
      if (!at.position) continue;
      const a0 = at.position.start.offset;
      if (at.kind === 'quoted' && TEXT_ATTRS.has(at.name)) {
        const raw = at.raw; const i = buf.indexOf(Buffer.from(raw, 'utf8'), a0);
        if (i >= 0) { const f = raw[0] + fixText(raw.slice(1, -1)) + raw.slice(-1); if (f !== raw) edits.push([i, i + Buffer.byteLength(raw), f]); }
      } else if (at.kind === 'expression' && at.value) {
        const i = buf.indexOf(Buffer.from(at.value, 'utf8'), a0);
        if (i >= 0 && !SKIP_ATTR.test(at.name)) { const f = fixJsFragment(at.value); if (f !== at.value) edits.push([i, i + Buffer.byteLength(at.value), f]); }
      }
    }
    for (const c of n.children || []) walk(c, n.type === 'expression' ? true : (n.type === 'element' || n.type === 'component' || n.type === 'fragment' || n.type === 'custom-element') ? false : inExpr);
  };
  walk(ast, false);
  edits.sort((x, y) => y[0] - x[0]);
  let out = buf;
  for (const [a, b, f] of edits) out = Buffer.concat([out.subarray(0, a), Buffer.from(f, 'utf8'), out.subarray(b)]);
  return out.toString('utf8');
}


// Markdown / MDX : le corps (hors blocs et extraits de code, URL, cibles de liens), les champs
// title/description/excerpt du frontmatter, et dans les composants MDX (<CalloutBox title="…">,
// <ComparisonTable rows={…}>) seulement les valeurs de texte, jamais les attributs techniques.
// accents-fr.py traitait déjà le Markdown, mais sans les règles de contexte ci-dessus
// (« capacité d'epargne », « a éviter ») : relu sur epargnemalin.fr le 2026-09-19.
function fixTag(tag) {
  return tag.replace(/([\w:-]+)=("([^"]*)"|\{)/g, (m, name, v, str, off) => {
    if (SKIP_ATTR.test(name)) return m;
    if (str !== undefined) return `${name}="${fixText(str)}"`;
    return m;                                        // les {…} sont traités ci-dessous
  }).replace(/=\{([\s\S]*)\}(?=[\s/>])/g, (m, expr) => `={${fixJsFragment(expr)}}`);
}
function fixMd(src) {
  let fm = '', body = src;
  if (src.startsWith('---')) {
    const e = src.indexOf('\n---', 3) + 4;
    let key = '';
    fm = src.slice(0, e).split('\n').map((l) => {
      const k = l.match(/^([\w-]+):(.*)$/);
      if (k) { key = k[1]; return /^(title|description|excerpt|summary)$/.test(key) ? `${key}:${fixText(k[2])}` : l; }
      // listes de texte du frontmatter : sources citées, questions de FAQ
      if (/^(sources|faq|keyPoints)$/.test(key)) return l.replace(/^(\s+(?:-\s+)?(?:(?:question|answer|title|description):\s*)?)(.+)$/, (m, a, b) => a + fixText(b));
      return l;
    }).join('\n');
    body = src.slice(e);
  }
  const TOKEN = /(```[\s\S]*?```|`[^`\n]*`|\]\([^)]*\)|https?:\/\/\S+|<\/?[A-Za-z][^<>]*?(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^<>]*?)*\/?>|\{[^{}\n]*\})/;
  return fm + body.split(TOKEN).map((part, i) => {
    if (i % 2 === 0) return fixText(part);
    if (/^<[A-Za-z]/.test(part)) return fixTag(part);
    return part;
  }).join('');
}

let files = 0;
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (!/^(node_modules|dist|\.astro|\.next|out)$/.test(e)) walk(p); continue; }
    const x = extname(p);
    if (!['.astro', '.ts', '.tsx', '.md', '.mdx'].includes(x) || p.endsWith('.d.ts')) continue;
    const src = readFileSync(p, 'utf8');
    const before = words;
    const out = x === '.astro' ? fixAstro(src) : /\.mdx?$/.test(x) ? fixMd(src) : fixCode(src, x === '.tsx');
    if (out !== src) { files++; if (!DRY) writeFileSync(p, out); }
    else words = before;
  }
};
if (statSync(root).isFile()) {                  // un seul fichier (ex. src/i18n/fr.ts)
  const x = extname(root); const src = readFileSync(root, 'utf8');
  const out = x === '.astro' ? fixAstro(src) : /\.mdx?$/.test(x) ? fixMd(src) : fixCode(src, x === '.tsx');
  if (out !== src) { files++; if (!DRY) writeFileSync(root, out); }
} else walk(root);
console.log(`accents-code: ${words} correction(s) dans ${files} fichier(s)${DRY ? ' (simulation)' : ''}`);
