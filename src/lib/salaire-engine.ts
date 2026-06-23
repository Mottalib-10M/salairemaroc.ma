/**
 * Moroccan Salary Calculation Engine (2026)
 *
 * Pure functions, no side effects. All amounts in MAD (Dirhams).
 * Implements CNSS contributions (employee + employer), IR (Impôt sur le Revenu),
 * professional expenses deduction, and family deductions.
 *
 * Sources:
 * - Direction Générale des Impôts (DGI): barème IR
 * - CNSS: taux de cotisation
 * - Code du Travail marocain: SMIG
 */

// ── Constants ─────────────────────────────────────────────────────────────

/** CNSS monthly ceiling for capped contributions */
export const CNSS_PLAFOND_MENSUEL = 6_000;
export const CNSS_PLAFOND_ANNUEL = CNSS_PLAFOND_MENSUEL * 12;

/** SMIG 2026 */
export const SMIG_MENSUEL = 3_111.39;
export const SMIG_HORAIRE = 15.55;

/** Professional expenses deduction: 20% of gross, max 30,000 DH/year */
export const FRAIS_PRO_TAUX = 0.20;
export const FRAIS_PRO_PLAFOND_ANNUEL = 30_000;

/** Family deduction: 360 DH/year per dependent, max 6 dependents */
export const DEDUCTION_FAMILLE_PAR_PERSONNE = 360;
export const MAX_DEPENDANTS = 6;

// ── CNSS Rates ────────────────────────────────────────────────────────────

/** Employee CNSS contribution rates */
export const CNSS_SALARIE = {
  /** Prestations sociales (court terme) - capped */
  prestationsSociales: 0.0052,
  /** AMO (Assurance Maladie Obligatoire) - uncapped */
  amo: 0.0226,
  /** Prestations long terme (retraite) - capped */
  retraite: 0.0396,
} as const;

/** Total employee rate */
export const CNSS_SALARIE_TOTAL = 0.0674;

/** Employer CNSS contribution rates */
export const CNSS_EMPLOYEUR = {
  /** Allocations familiales - uncapped */
  allocationsFamiliales: 0.0640,
  /** Prestations sociales - capped */
  prestationsSociales: 0.0105,
  /** AMO patronale - uncapped */
  amo: 0.0411,
  /** Prestations long terme (retraite) - capped */
  retraite: 0.0793,
  /** Taxe de formation professionnelle - uncapped */
  formationProfessionnelle: 0.016,
} as const;

// ── IR Brackets (Annual) ──────────────────────────────────────────────────

export interface TrancheIR {
  min: number;
  max: number;    // Infinity for the last bracket
  taux: number;
}

export const TRANCHES_IR: TrancheIR[] = [
  { min: 0,       max: 30_000,   taux: 0.00 },
  { min: 30_000,  max: 50_000,   taux: 0.10 },
  { min: 50_000,  max: 60_000,   taux: 0.20 },
  { min: 60_000,  max: 80_000,   taux: 0.30 },
  { min: 80_000,  max: 180_000,  taux: 0.34 },
  { min: 180_000, max: Infinity,  taux: 0.38 },
];

// ── Types ─────────────────────────────────────────────────────────────────

export interface DetailCNSS {
  prestationsSociales: number;
  amo: number;
  retraite: number;
  total: number;
}

export interface DetailCNSSEmployeur {
  allocationsFamiliales: number;
  prestationsSociales: number;
  amo: number;
  retraite: number;
  formationProfessionnelle: number;
  total: number;
}

export interface DetailIR {
  revenuBrutImposable: number;
  fraisProfessionnels: number;
  revenuNetImposable: number;
  deductionFamille: number;
  baseImposable: number;
  irBrut: number;
  deductionsFamiliales: number;
  irNet: number;
  tauxEffectif: number;
  detailTranches: { tranche: TrancheIR; montantImpose: number; impot: number }[];
}

export interface DecompositionSalaire {
  brutMensuel: number;
  brutAnnuel: number;

  // CNSS employee
  cnssDetail: DetailCNSS;
  cnssAnnuel: number;
  cnssMensuel: number;

  // IR
  irDetail: DetailIR;
  irAnnuel: number;
  irMensuel: number;

  // Net
  netAnnuel: number;
  netMensuel: number;

  // Employer side
  cnssEmployeurDetail: DetailCNSSEmployeur;
  cnssEmployeurAnnuel: number;
  coutEmployeurMensuel: number;
  coutEmployeurAnnuel: number;

  // Rates
  tauxEffectifTotal: number;
  tauxEffectifIR: number;
  tauxEffectifCNSS: number;
}

// ── CNSS Calculation ──────────────────────────────────────────────────────

/**
 * Calculate detailed CNSS employee contributions for a monthly gross salary.
 */
export function calculerCotisationsCNSSSalarie(brutMensuel: number): DetailCNSS {
  const base = Math.max(0, brutMensuel);
  const basePlafonnee = Math.min(base, CNSS_PLAFOND_MENSUEL);

  const prestationsSociales = basePlafonnee * CNSS_SALARIE.prestationsSociales;
  const amo = base * CNSS_SALARIE.amo; // deplafonné
  const retraite = basePlafonnee * CNSS_SALARIE.retraite;
  const total = prestationsSociales + amo + retraite;

  return { prestationsSociales, amo, retraite, total };
}

/**
 * Calculate detailed CNSS employer contributions for a monthly gross salary.
 */
export function calculerCotisationsCNSSEmployeur(brutMensuel: number): DetailCNSSEmployeur {
  const base = Math.max(0, brutMensuel);
  const basePlafonnee = Math.min(base, CNSS_PLAFOND_MENSUEL);

  const allocationsFamiliales = base * CNSS_EMPLOYEUR.allocationsFamiliales; // deplafonné
  const prestationsSociales = basePlafonnee * CNSS_EMPLOYEUR.prestationsSociales;
  const amo = base * CNSS_EMPLOYEUR.amo; // deplafonné
  const retraite = basePlafonnee * CNSS_EMPLOYEUR.retraite;
  const formationProfessionnelle = base * CNSS_EMPLOYEUR.formationProfessionnelle; // deplafonné
  const total = allocationsFamiliales + prestationsSociales + amo + retraite + formationProfessionnelle;

  return { allocationsFamiliales, prestationsSociales, amo, retraite, formationProfessionnelle, total };
}

// ── IR Calculation ────────────────────────────────────────────────────────

/**
 * Calculate progressive IR on the annual taxable income.
 * Returns gross IR before family deductions.
 */
export function calculerIRProgressif(baseImposableAnnuelle: number): {
  irBrut: number;
  detailTranches: { tranche: TrancheIR; montantImpose: number; impot: number }[];
} {
  if (baseImposableAnnuelle <= 0) {
    return {
      irBrut: 0,
      detailTranches: TRANCHES_IR.map(t => ({ tranche: t, montantImpose: 0, impot: 0 })),
    };
  }

  const detailTranches: { tranche: TrancheIR; montantImpose: number; impot: number }[] = [];
  let irBrut = 0;
  let restant = baseImposableAnnuelle;

  for (const tranche of TRANCHES_IR) {
    if (restant <= 0) {
      detailTranches.push({ tranche, montantImpose: 0, impot: 0 });
      continue;
    }

    const largeurTranche = tranche.max === Infinity
      ? restant
      : Math.min(tranche.max - tranche.min, restant);

    const montantImpose = Math.max(0, largeurTranche);
    const impot = montantImpose * tranche.taux;

    detailTranches.push({ tranche, montantImpose, impot });
    irBrut += impot;
    restant -= montantImpose;
  }

  return { irBrut, detailTranches };
}

/**
 * Full IR calculation including professional expenses and family deductions.
 */
export function calculerIR(
  brutAnnuel: number,
  cnssAnnuel: number,
  nbDependants: number = 0,
): DetailIR {
  // Step 1: Revenu brut imposable = brut annuel - CNSS employee annuel
  const revenuBrutImposable = Math.max(0, brutAnnuel - cnssAnnuel);

  // Step 2: Frais professionnels = 20% of revenuBrutImposable, capped at 30,000 DH/year
  const fraisProfessionnels = Math.min(
    revenuBrutImposable * FRAIS_PRO_TAUX,
    FRAIS_PRO_PLAFOND_ANNUEL,
  );

  // Step 3: Revenu net imposable
  const revenuNetImposable = Math.max(0, revenuBrutImposable - fraisProfessionnels);

  // Step 4: Apply progressive brackets to get IR brut
  const { irBrut, detailTranches } = calculerIRProgressif(revenuNetImposable);

  // Step 5: Family deductions (360 DH per dependent, max 6)
  const nbDependantsClamped = Math.min(Math.max(0, Math.floor(nbDependants)), MAX_DEPENDANTS);
  const deductionFamille = nbDependantsClamped * DEDUCTION_FAMILLE_PAR_PERSONNE;

  // Step 6: IR net = IR brut - family deductions (cannot be negative)
  const irNet = Math.max(0, irBrut - deductionFamille);

  // Effective rate
  const tauxEffectif = brutAnnuel > 0 ? irNet / brutAnnuel : 0;

  return {
    revenuBrutImposable,
    fraisProfessionnels,
    revenuNetImposable,
    deductionFamille,
    baseImposable: revenuNetImposable,
    irBrut,
    deductionsFamiliales: deductionFamille,
    irNet,
    tauxEffectif,
    detailTranches,
  };
}

// ── Main Calculation Functions ────────────────────────────────────────────

/**
 * Complete salary decomposition from monthly gross salary.
 */
export function calculerSalaireNet(
  brutMensuel: number,
  nbDependants: number = 0,
): DecompositionSalaire {
  const brut = Math.max(0, brutMensuel);
  const brutAnnuel = brut * 12;

  // CNSS employee (monthly then annualized)
  const cnssDetail = calculerCotisationsCNSSSalarie(brut);
  const cnssAnnuel = cnssDetail.total * 12;
  const cnssMensuel = cnssDetail.total;

  // IR
  const irDetail = calculerIR(brutAnnuel, cnssAnnuel, nbDependants);
  const irAnnuel = irDetail.irNet;
  const irMensuel = irAnnuel / 12;

  // Net
  const netAnnuel = brutAnnuel - cnssAnnuel - irAnnuel;
  const netMensuel = netAnnuel / 12;

  // Employer CNSS
  const cnssEmployeurDetail = calculerCotisationsCNSSEmployeur(brut);
  const cnssEmployeurAnnuel = cnssEmployeurDetail.total * 12;
  const coutEmployeurMensuel = brut + cnssEmployeurDetail.total;
  const coutEmployeurAnnuel = coutEmployeurMensuel * 12;

  // Rates
  const tauxEffectifTotal = brutAnnuel > 0 ? (cnssAnnuel + irAnnuel) / brutAnnuel : 0;
  const tauxEffectifIR = brutAnnuel > 0 ? irAnnuel / brutAnnuel : 0;
  const tauxEffectifCNSS = brutAnnuel > 0 ? cnssAnnuel / brutAnnuel : 0;

  return {
    brutMensuel: brut,
    brutAnnuel,
    cnssDetail,
    cnssAnnuel,
    cnssMensuel,
    irDetail,
    irAnnuel,
    irMensuel,
    netAnnuel,
    netMensuel,
    cnssEmployeurDetail,
    cnssEmployeurAnnuel,
    coutEmployeurMensuel,
    coutEmployeurAnnuel,
    tauxEffectifTotal,
    tauxEffectifIR,
    tauxEffectifCNSS,
  };
}

/**
 * Reverse calculation: find gross salary from desired net salary using binary search.
 */
export function calculerBrutDepuisNet(
  netCible: number,
  nbDependants: number = 0,
  tolerance: number = 0.5,
  maxIterations: number = 100,
): DecompositionSalaire {
  if (netCible <= 0) return calculerSalaireNet(0, nbDependants);

  // Initial bounds: net cannot exceed gross, so gross >= net
  let low = netCible * 0.8;
  let high = netCible * 2.5;

  // Ensure high is high enough
  let resultHigh = calculerSalaireNet(high, nbDependants);
  while (resultHigh.netMensuel < netCible && high < netCible * 10) {
    high *= 2;
    resultHigh = calculerSalaireNet(high, nbDependants);
  }

  let bestResult = resultHigh;
  let iterations = 0;

  while (iterations < maxIterations) {
    const mid = (low + high) / 2;
    const result = calculerSalaireNet(mid, nbDependants);
    bestResult = result;

    if (Math.abs(result.netMensuel - netCible) < tolerance) {
      return result;
    }

    if (result.netMensuel < netCible) {
      low = mid;
    } else {
      high = mid;
    }
    iterations++;
  }

  return bestResult;
}

/**
 * Calculate total employer cost from monthly gross salary.
 */
export function calculerCoutEmployeur(brutMensuel: number): {
  brutMensuel: number;
  brutAnnuel: number;
  cnssEmployeurDetail: DetailCNSSEmployeur;
  cnssEmployeurMensuel: number;
  cnssEmployeurAnnuel: number;
  coutTotalMensuel: number;
  coutTotalAnnuel: number;
} {
  const brut = Math.max(0, brutMensuel);
  const cnssEmployeurDetail = calculerCotisationsCNSSEmployeur(brut);

  return {
    brutMensuel: brut,
    brutAnnuel: brut * 12,
    cnssEmployeurDetail,
    cnssEmployeurMensuel: cnssEmployeurDetail.total,
    cnssEmployeurAnnuel: cnssEmployeurDetail.total * 12,
    coutTotalMensuel: brut + cnssEmployeurDetail.total,
    coutTotalAnnuel: (brut + cnssEmployeurDetail.total) * 12,
  };
}
