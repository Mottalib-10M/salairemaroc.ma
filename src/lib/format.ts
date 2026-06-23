/**
 * Moroccan number formatting utilities.
 * Uses space as thousands separator, comma as decimal separator.
 * Currency: DH (Dirham marocain).
 */

/**
 * Format amount in Dirhams: "5 000 DH" (no decimals for round numbers, 2 decimals otherwise)
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
 * Format amount in Dirhams with always 2 decimal places: "5 000,50 DH"
 */
export function formatDHPrecis(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} DH`;
}

/**
 * Format amount in Dirhams rounded to nearest integer: "5 000 DH"
 */
export function formatDHArrondi(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${formatted} DH`;
}

/**
 * Format a plain number: "5 000,50"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a plain number rounded: "5 000"
 */
export function formatNumberArrondi(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format a percentage: "12,34%"
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a percentage from a decimal (0.1234 -> "12,34%")
 */
export function formatPercentFromDecimal(value: number): string {
  return formatPercent(value);
}

/**
 * Format amount for display in URLs and titles: "5 000"
 */
export function formatAmountTitle(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
