/**
 * Centralised navigation data for Header and Footer components.
 * All internal links use trailing slashes to match trailingSlash: 'always'.
 */

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Header nav groupings                                               */
/* ------------------------------------------------------------------ */

export const headerCalcLinks: NavLink[] = [
  { href: '/calculateurs/', label: 'Tous les calculateurs' },
  { href: '/calculateur-salaire-net/', label: 'Brut vers Net' },
  { href: '/calculateur-net-vers-brut/', label: 'Net vers Brut' },
  { href: '/calculateur-cout-employeur/', label: 'Coût Employeur' },
  { href: '/simulateur-ir/', label: 'Simulateur IR' },
];

export const headerGuideLinks: NavLink[] = [
  { href: '/guides/', label: 'Tous les guides' },
  { href: '/guides/smig-maroc/', label: 'SMIG au Maroc' },
  { href: '/guides/comprendre-bulletin-paie/', label: 'Comprendre son bulletin' },
  { href: '/guides/bareme-ir-maroc/', label: 'Barème IR Maroc' },
];

/* ------------------------------------------------------------------ */
/*  Footer nav groupings                                               */
/* ------------------------------------------------------------------ */

export const footerCalcLinks: NavLink[] = [
  { href: '/calculateurs/', label: 'Tous les calculateurs' },
  { href: '/', label: 'Brut vers Net' },
  { href: '/calculateur-net-vers-brut/', label: 'Net vers Brut' },
  { href: '/calculateur-cout-employeur/', label: 'Coût Employeur' },
  { href: '/simulateur-ir/', label: 'Simulateur IR' },
];

export const footerGuideLinks: NavLink[] = [
  { href: '/guides/', label: 'Tous les guides' },
  { href: '/guides/smig-maroc/', label: 'SMIG au Maroc' },
  { href: '/guides/comprendre-bulletin-paie/', label: 'Bulletin de paie' },
  { href: '/guides/bareme-ir-maroc/', label: 'Barème IR' },
  { href: '/glossaire/', label: 'Glossaire' },
  { href: '/actualites/', label: 'Actualites' },
];

export const footerSalaireLinks: NavLink[] = [
  { href: '/salaire/metier/ingenieur/', label: 'Salaire Ingénieur' },
  { href: '/salaire/metier/developpeur/', label: 'Salaire Développeur' },
  { href: '/salaire/metier/medecin/', label: 'Salaire Médecin' },
  { href: '/salaire/ville/casablanca/', label: 'Salaire Casablanca' },
  { href: '/salaire/ville/rabat/', label: 'Salaire Rabat' },
];

export const footerExternalLinks: NavLink[] = [
  { href: 'https://www.tax.gov.ma', label: 'DGI Maroc', external: true },
  { href: 'https://www.cnss.ma', label: 'CNSS', external: true },
  { href: 'https://www.emploi.gov.ma', label: "Ministère de l'Emploi", external: true },
];

export const footerLegalLinks: NavLink[] = [
  { href: '/a-propos/', label: 'À propos' },
  { href: '/methodologie/', label: 'Methodologie' },
  { href: '/contact/', label: 'Contact' },
  { href: '/confidentialite/', label: 'Confidentialité' },
  { href: '/mentions-legales/', label: 'Mentions légales' },
];
