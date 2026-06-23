/**
 * Utilitaires de formatage des nombres marocains.
 * Utilise l'espace comme séparateur de milliers, la virgule comme séparateur décimal.
 * Devise : DH (Dirham marocain).
 */

/**
 * Formate un montant en Dirhams : "5 000 DH" (pas de décimales pour les nombres ronds, 2 décimales sinon)
 */
export function formatDH(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const isRound = rounded === Math.floor(rounded);
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: isRound ? 0 : 2,
  }).format(rounded);
  return `${formatted} DH`;
}

/**
 * Formate un montant en Dirhams avec toujours 2 décimales : "5 000,50 DH"
 */
export function formatDHPrecis(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} DH`;
}

/**
 * Formate un montant en Dirhams arrondi à l'entier le plus proche : "5 000 DH"
 */
export function formatDHArrondi(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${formatted} DH`;
}

/**
 * Formate un nombre simple : "5 000,50"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formate un nombre arrondi : "5 000"
 */
export function formatNumberArrondi(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Formate un pourcentage : "12,34%"
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formate un pourcentage à partir d'un décimal (0.1234 -> "12,34%")
 */
export function formatPercentFromDecimal(value: number): string {
  return formatPercent(value);
}

/**
 * Formate un montant pour affichage dans les URLs et titres : "5 000"
 */
export function formatAmountTitle(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
