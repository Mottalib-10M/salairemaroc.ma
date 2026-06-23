export interface SalaryPageConfig {
  amount: number;
  slug: string;
  rangeCategory: 'smig' | 'bas' | 'moyen' | 'cadre' | 'superieur' | 'direction';
}

export const SALARY_PAGES: SalaryPageConfig[] = [
  { amount: 3000, slug: '3000-dh-brut-en-net', rangeCategory: 'smig' },
  { amount: 3500, slug: '3500-dh-brut-en-net', rangeCategory: 'smig' },
  { amount: 4000, slug: '4000-dh-brut-en-net', rangeCategory: 'bas' },
  { amount: 4500, slug: '4500-dh-brut-en-net', rangeCategory: 'bas' },
  { amount: 5000, slug: '5000-dh-brut-en-net', rangeCategory: 'bas' },
  { amount: 5500, slug: '5500-dh-brut-en-net', rangeCategory: 'moyen' },
  { amount: 6000, slug: '6000-dh-brut-en-net', rangeCategory: 'moyen' },
  { amount: 6500, slug: '6500-dh-brut-en-net', rangeCategory: 'moyen' },
  { amount: 7000, slug: '7000-dh-brut-en-net', rangeCategory: 'moyen' },
  { amount: 7500, slug: '7500-dh-brut-en-net', rangeCategory: 'moyen' },
  { amount: 8000, slug: '8000-dh-brut-en-net', rangeCategory: 'cadre' },
  { amount: 8500, slug: '8500-dh-brut-en-net', rangeCategory: 'cadre' },
  { amount: 9000, slug: '9000-dh-brut-en-net', rangeCategory: 'cadre' },
  { amount: 9500, slug: '9500-dh-brut-en-net', rangeCategory: 'cadre' },
  { amount: 10000, slug: '10000-dh-brut-en-net', rangeCategory: 'cadre' },
  { amount: 12000, slug: '12000-dh-brut-en-net', rangeCategory: 'superieur' },
  { amount: 15000, slug: '15000-dh-brut-en-net', rangeCategory: 'superieur' },
  { amount: 20000, slug: '20000-dh-brut-en-net', rangeCategory: 'superieur' },
  { amount: 25000, slug: '25000-dh-brut-en-net', rangeCategory: 'direction' },
  { amount: 30000, slug: '30000-dh-brut-en-net', rangeCategory: 'direction' },
];
