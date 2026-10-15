/**
 * Date de mise à jour d'une page : le dernier commit qui a touché son fichier source
 * (route dynamique comprise), jamais la date du build. Une date qui change à chaque
 * déploiement est une fausse fraîcheur, que Google finit par ignorer (RECETTE §8.4).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, string>();
const gitDate = (f: string): string => {
  if (cache.has(f)) return cache.get(f)!;
  let d = '';
  try { d = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { encoding: 'utf8' }).trim(); } catch { /* hors dépôt */ }
  cache.set(f, d);
  return d;
};

export function pageDate(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean);
  const base = join('src/pages', ...segs);
  const cands = [`${base}.astro`, join(base, 'index.astro')];
  if (segs.length) {
    const dir = join('src/pages', ...segs.slice(0, -1));
    if (existsSync(dir)) for (const e of readdirSync(dir)) if (e.startsWith('[') && e.endsWith('.astro')) cands.push(join(dir, e));
  }
  for (const c of cands) if (existsSync(c)) { const d = gitDate(c); if (d) return d; }
  return gitDate('src/pages');
}

/** « 1er octobre 2026 », « 14 octobre 2026 » : la date en toutes lettres, l'ISO restant dans datetime. */
export function dateLongue(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d).replace(/^1 /, '1er ');
}
