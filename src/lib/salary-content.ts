/**
 * Salary Content Generator - Produces UNIQUE text for each salary page.
 * Every function uses exact calculated values to ensure inter-page uniqueness.
 * All text is in French with Unicode escapes for accented characters.
 */

import { calculerSalaireNet, SMIG_MENSUEL, TRANCHES_IR, type DecompositionSalaire } from './salaire-engine';
import { formatDH, formatDHArrondi } from './format';

// ── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

/** Variation index: returns a deterministic number 0-N based on salary amount */
function varIdx(amount: number, mod: number): number {
  return ((amount * 7 + 13) % mod);
}

// ── Career roles per EXACT salary ────────────────────────────────────────────

const CAREER_POOLS: Record<string, string[][]> = {
  smig: [
    ['agent de s\u00e9curit\u00e9 dans une r\u00e9sidence priv\u00e9e', 'employ\u00e9 polyvalent en restauration rapide', 'ouvrier dans une usine textile \u00e0 Tanger'],
    ['agent d\'accueil dans un h\u00f4tel \u00e9conomique', 'manutentionnaire en entrep\u00f4t logistique', 'femme/homme de m\u00e9nage en entreprise'],
    ['vendeur en boutique de pr\u00eat-\u00e0-porter', 'livreur pour une plateforme locale', 'aide-cuisinier dans un restaurant de quartier'],
    ['agent de nettoyage dans un centre commercial', 'standardiste dans un cabinet m\u00e9dical', 'pr\u00e9parateur de commandes en grande surface'],
  ],
  bas: [
    ['assistant administratif dans une PME \u00e0 Casablanca', 'secr\u00e9taire m\u00e9dicale en clinique priv\u00e9e', 'technicien de maintenance d\u00e9butant'],
    ['employ\u00e9 de banque au guichet', 'assistant comptable en cabinet', 'animateur commercial en grande distribution'],
    ['r\u00e9ceptionniste d\'h\u00f4tel 3 \u00e9toiles', 'assistant juridique en \u00e9tude notariale', 'technicien informatique helpdesk'],
    ['op\u00e9rateur en centre d\'appels francophone', 'assistant qualit\u00e9 dans l\'agroalimentaire', 'gestionnaire de stock en pharmacie'],
  ],
  moyen: [
    ['comptable confirm\u00e9 en PME industrielle', 'commercial terrain dans le secteur pharmaceutique', 'infirmier dipl\u00f4m\u00e9 en clinique priv\u00e9e'],
    ['technicien sup\u00e9rieur en \u00e9lectricit\u00e9 industrielle', 'charg\u00e9 de client\u00e8le bancaire', 'coordinateur logistique chez un transitaire'],
    ['responsable administratif dans l\'h\u00f4tellerie', 'analyste cr\u00e9dit junior en banque', 'chef d\'\u00e9quipe en production industrielle'],
    ['graphiste senior en agence de communication', 'gestionnaire de paie en cabinet d\'expertise', 'superviseur en centre d\'appels'],
    ['contr\u00f4leur qualit\u00e9 dans l\'automobile', 'formateur technique en organisme de formation', 'chef de rayon en grande distribution'],
  ],
  cadre: [
    ['ing\u00e9nieur d\u00e9veloppeur full-stack avec 3 ans d\'exp\u00e9rience', 'responsable marketing digital', 'chef de projet BTP'],
    ['auditeur confirm\u00e9 en cabinet Big Four', 'responsable achats dans l\'industrie', 'architecte junior en bureau d\'\u00e9tudes'],
    ['pharmacien assistant en officine', 'chef de produit dans la grande consommation', 'responsable ressources humaines en PME'],
    ['ing\u00e9nieur qualit\u00e9 dans l\'a\u00e9ronautique', 'contr\u00f4leur de gestion industriel', 'chef de projet IT en ESN'],
    ['responsable communication dans le secteur bancaire', 'ing\u00e9nieur proc\u00e9d\u00e9s dans la chimie', 'juriste d\'entreprise en droit des affaires'],
  ],
  superieur: [
    ['directeur commercial r\u00e9gional', 'directeur des op\u00e9rations en logistique', 'expert-comptable associ\u00e9 en cabinet'],
    ['directeur de d\u00e9partement IT dans une banque', 'manager senior en conseil strat\u00e9gique', 'directeur d\'usine dans l\'automobile'],
    ['directeur marketing dans le secteur t\u00e9l\u00e9com', 'responsable transformation digitale', 'directeur technique dans l\'a\u00e9ronautique'],
    ['m\u00e9decin sp\u00e9cialiste salari\u00e9 en clinique', 'directeur juridique de groupe', 'country manager pour une multinationale'],
  ],
  direction: [
    ['directeur g\u00e9n\u00e9ral d\'une filiale de multinationale', 'directeur financier (CFO) d\'un groupe industriel', 'associ\u00e9 g\u00e9rant de cabinet d\'avocats d\'affaires'],
    ['pr\u00e9sident de holding familiale', 'directeur g\u00e9n\u00e9ral d\'une banque r\u00e9gionale', 'directeur de zone Afrique dans l\'FMCG'],
    ['vice-pr\u00e9sident strat\u00e9gie d\'un groupe minier', 'directeur des ressources humaines d\'un groupe bancaire', 'managing director d\'un fonds d\'investissement'],
    ['directeur g\u00e9n\u00e9ral d\u00e9l\u00e9gu\u00e9 d\'une cha\u00eene h\u00f4teli\u00e8re', 'directeur associ\u00e9 d\'un cabinet de conseil international', 'directeur du d\u00e9veloppement d\'un promoteur immobilier'],
  ],
};

// ── Regional data ────────────────────────────────────────────────────────────

interface CityData {
  name: string;
  loyerMoyen2ch: number;
  transport: number;
  alimentation: number;
  coutVieIndex: number;
}

const CITIES_DATA: CityData[] = [
  { name: 'Casablanca', loyerMoyen2ch: 4500, transport: 800, alimentation: 2500, coutVieIndex: 130 },
  { name: 'Rabat', loyerMoyen2ch: 4000, transport: 700, alimentation: 2300, coutVieIndex: 120 },
  { name: 'Marrakech', loyerMoyen2ch: 3200, transport: 600, alimentation: 2000, coutVieIndex: 105 },
  { name: 'Tanger', loyerMoyen2ch: 3500, transport: 650, alimentation: 2100, coutVieIndex: 110 },
  { name: 'F\u00e8s', loyerMoyen2ch: 2500, transport: 500, alimentation: 1800, coutVieIndex: 90 },
  { name: 'Agadir', loyerMoyen2ch: 2800, transport: 550, alimentation: 1900, coutVieIndex: 95 },
  { name: 'Oujda', loyerMoyen2ch: 2000, transport: 400, alimentation: 1600, coutVieIndex: 80 },
  { name: 'K\u00e9nitra', loyerMoyen2ch: 2200, transport: 450, alimentation: 1700, coutVieIndex: 85 },
];

// ── IR Bracket names ─────────────────────────────────────────────────────────

const IR_BRACKET_NAMES = [
  'exon\u00e9r\u00e9e (0%)',
  'premi\u00e8re tranche (10%)',
  'deuxi\u00e8me tranche (20%)',
  'troisi\u00e8me tranche (30%)',
  'quatri\u00e8me tranche (34%)',
  'cinqui\u00e8me tranche (38%)',
];

// ── Main content functions ───────────────────────────────────────────────────

/**
 * getBandContext: Salary-specific context with ratio to SMIG/median, daily/hourly net,
 * IR bracket position, inter-salary comparisons.
 */
export function getBandContext(amount: number, result: DecompositionSalaire): string {
  const ratioSMIG = round2(amount / SMIG_MENSUEL);
  const medianMaroc = 5200;
  const ratioMedian = round2(amount / medianMaroc);
  const netDaily = round2(result.netMensuel / 22);
  const netHourly = round2(result.netMensuel / (22 * 8));
  const netWeekly = round2(result.netMensuel * 12 / 52);

  // Determine which IR bracket the salary falls in
  const rni = result.irDetail.revenuNetImposable;
  let bracketIdx = 0;
  for (let i = TRANCHES_IR.length - 1; i >= 0; i--) {
    if (rni > TRANCHES_IR[i].min) {
      bracketIdx = i;
      break;
    }
  }
  const bracketName = IR_BRACKET_NAMES[bracketIdx];
  const marginalRate = TRANCHES_IR[bracketIdx].taux;

  // Compare to adjacent salaries
  const lowerAmount = amount - 500;
  const higherAmount = amount + 500;
  const lowerResult = calculerSalaireNet(lowerAmount, 0);
  const higherResult = calculerSalaireNet(higherAmount, 0);
  const gainVsLower = round2(result.netMensuel - lowerResult.netMensuel);
  const gainVsHigher = round2(higherResult.netMensuel - result.netMensuel);

  const v = varIdx(amount, 3);

  const sentences: string[] = [];

  if (v === 0) {
    sentences.push(
      `Un salaire brut de ${formatDH(amount)} repr\u00e9sente ${ratioSMIG} fois le SMIG marocain actuel (${formatDH(SMIG_MENSUEL)}).`
    );
    sentences.push(
      `Par rapport au salaire m\u00e9dian national estim\u00e9 \u00e0 ${formatDH(medianMaroc)}, ce montant est ${ratioMedian} fois sup\u00e9rieur, ce qui positionne ce salaire dans ${ratioMedian < 1 ? 'la moiti\u00e9 inf\u00e9rieure' : ratioMedian < 1.5 ? 'la tranche m\u00e9diane' : 'la tranche sup\u00e9rieure'} de la distribution salariale marocaine.`
    );
    sentences.push(
      `En termes de revenu net r\u00e9el, le salari\u00e9 per\u00e7oit ${formatDH(netDaily)} par jour ouvr\u00e9 (sur 22 jours), soit ${formatDH(netHourly)} par heure de travail effectif (base 8h/jour).`
    );
  } else if (v === 1) {
    sentences.push(
      `Avec ${formatDH(amount)} brut mensuel, le salari\u00e9 se situe \u00e0 un ratio de ${ratioSMIG}x par rapport au SMIG en vigueur (${formatDH(SMIG_MENSUEL)} en 2026).`
    );
    sentences.push(
      `Ce niveau de r\u00e9mun\u00e9ration correspond \u00e0 ${ratioMedian} fois le salaire m\u00e9dian marocain de ${formatDH(medianMaroc)}, pla\u00e7ant le b\u00e9n\u00e9ficiaire ${ratioMedian < 1 ? 'en dessous de la moyenne nationale' : ratioMedian < 1.5 ? 'dans la moyenne nationale' : 'au-dessus de la majorit\u00e9 des salari\u00e9s'}.`
    );
    sentences.push(
      `Ramen\u00e9 \u00e0 la semaine, le salaire net repr\u00e9sente ${formatDH(netWeekly)}, et \u00e0 l'heure de travail, environ ${formatDH(netHourly)} net.`
    );
  } else {
    sentences.push(
      `Le montant de ${formatDH(amount)} brut \u00e9quivaut \u00e0 ${ratioSMIG} SMIG marocains (r\u00e9f\u00e9rence 2026 : ${formatDH(SMIG_MENSUEL)}/mois).`
    );
    sentences.push(
      `Compar\u00e9 au salaire m\u00e9dian de ${formatDH(medianMaroc)}, ce brut repr\u00e9sente un multiplicateur de ${ratioMedian}x \u2014 ${ratioMedian < 1 ? 'insuffisant pour couvrir le co\u00fbt de la vie dans les grandes villes' : ratioMedian < 1.5 ? 'suffisant pour un niveau de vie correct' : 'permettant un confort financier notable'}.`
    );
    sentences.push(
      `Sur une base journali\u00e8re (22 jours ouvr\u00e9s), le net per\u00e7u est de ${formatDH(netDaily)}/jour, soit ${formatDH(netHourly)} de l\u2019heure.`
    );
  }

  sentences.push(
    `Le revenu net imposable annuel de ${formatDH(rni)} place ce salaire dans la ${bracketName} du bar\u00e8me IR marocain, avec un taux marginal de ${(marginalRate * 100).toFixed(0)}%.`
  );

  sentences.push(
    `\u00c0 titre de comparaison, un salaire de ${formatDHArrondi(lowerAmount)} brut g\u00e9n\u00e8re un net inf\u00e9rieur de ${formatDH(gainVsLower)}/mois, tandis qu\u2019un passage \u00e0 ${formatDHArrondi(higherAmount)} brut apporterait ${formatDH(gainVsHigher)} suppl\u00e9mentaires en net mensuel.`
  );

  return sentences.join(' ');
}

/**
 * getCareerDescription: UNIQUE Moroccan job roles per exact salary
 */
export function getCareerDescription(amount: number, rangeCategory: string): string {
  const pool = CAREER_POOLS[rangeCategory] || CAREER_POOLS['moyen'];
  const idx = varIdx(amount, pool.length);
  const roles = pool[idx];

  const v = varIdx(amount, 4);
  const introVariants = [
    `Au Maroc, un salaire brut de ${formatDH(amount)} correspond typiquement aux profils suivants : ${roles[0]}, ${roles[1]}, ou encore ${roles[2]}.`,
    `Les professionnels percevant ${formatDH(amount)} brut par mois exercent g\u00e9n\u00e9ralement en tant que ${roles[0]}, ${roles[1]}, ou ${roles[2]}.`,
    `Ce niveau de r\u00e9mun\u00e9ration de ${formatDH(amount)} brut est caract\u00e9ristique de postes comme ${roles[0]}, ${roles[1]}, ainsi que ${roles[2]}.`,
    `Avec ${formatDH(amount)} de salaire brut mensuel, on retrouve des m\u00e9tiers tels que ${roles[0]}, ${roles[1]}, et ${roles[2]}.`,
  ];

  const experienceVariants: Record<string, string[]> = {
    smig: [
      `Ces postes ne n\u00e9cessitent g\u00e9n\u00e9ralement pas de dipl\u00f4me sp\u00e9cifique et sont accessibles d\u00e8s le baccalaur\u00e9at, voire sans qualification formelle.`,
      `L\u2019acc\u00e8s \u00e0 ces emplois est possible sans exp\u00e9rience pr\u00e9alable, avec une formation sur le terrain de quelques semaines.`,
    ],
    bas: [
      `Un dipl\u00f4me de type Bac+2 (BTS, DUT) ou une licence professionnelle est g\u00e9n\u00e9ralement requis, avec 1 \u00e0 3 ans d\u2019exp\u00e9rience.`,
      `Ces fonctions exigent habituellement un Bac+2/3 et une premi\u00e8re exp\u00e9rience de 1 \u00e0 2 ans dans le domaine concern\u00e9.`,
    ],
    moyen: [
      `Un Bac+3 \u00e0 Bac+5 combin\u00e9 \u00e0 3-5 ans d\u2019exp\u00e9rience professionnelle est le profil type pour ce niveau salarial.`,
      `Ces postes requièrent typiquement un dipl\u00f4me sup\u00e9rieur (licence ou master) et une exp\u00e9rience de 4 \u00e0 7 ans.`,
    ],
    cadre: [
      `Il s\u2019agit de postes de cadre n\u00e9cessitant un Bac+5 (\u00e9cole d\u2019ing\u00e9nieurs, \u00e9cole de commerce, master sp\u00e9cialis\u00e9) et 5 \u00e0 8 ans d\u2019exp\u00e9rience.`,
      `Ce niveau correspond \u00e0 des cadres confirm\u00e9s titulaires d\u2019un dipl\u00f4me de grande \u00e9cole et justifiant de 5 \u00e0 10 ans de carri\u00e8re.`,
    ],
    superieur: [
      `Ces fonctions de cadre sup\u00e9rieur exigent un parcours acad\u00e9mique d\u2019excellence (MBA, grandes \u00e9coles) et plus de 10 ans d\u2019exp\u00e9rience \u00e0 responsabilit\u00e9.`,
      `Seuls les profils ayant 12-15 ans d\u2019exp\u00e9rience, souvent avec un MBA ou un parcours international, acc\u00e8dent \u00e0 ce niveau.`,
    ],
    direction: [
      `Les postes de direction \u00e0 ce niveau de r\u00e9mun\u00e9ration sont r\u00e9serv\u00e9s aux professionnels cumulant 15+ ans d\u2019exp\u00e9rience, un r\u00e9seau solide et un track record prouv\u00e9 de gestion P&L.`,
      `Ce sont des positions de top management accessibles apr\u00e8s 15 \u00e0 20 ans de carri\u00e8re, souvent avec une exp\u00e9rience internationale et un MBA de premier plan.`,
    ],
  };

  const expPool = experienceVariants[rangeCategory] || experienceVariants['moyen'];
  const expIdx = varIdx(amount, expPool.length);

  return introVariants[v % introVariants.length] + ' ' + expPool[expIdx];
}

/**
 * getTaxTips: IR optimization with calculated savings for that salary
 */
export function getTaxTips(amount: number, result: DecompositionSalaire): string {
  const irMensuel = result.irMensuel;
  const irAnnuel = result.irAnnuel;

  // Calculate savings with dependents
  const result1dep = calculerSalaireNet(amount, 1);
  const result3dep = calculerSalaireNet(amount, 3);
  const savings1 = round2(result1dep.netMensuel - result.netMensuel);
  const savings3 = round2(result3dep.netMensuel - result.netMensuel);

  // RECORE (retraite compl\u00e9mentaire) deduction potential
  const retraiteComplementaire = Math.min(amount * 0.06, 50000 / 12);
  const potentialSavings = round2(retraiteComplementaire * TRANCHES_IR[varIdx(amount, 3) + 2]?.taux || 0.2);

  const v = varIdx(amount, 3);

  const paragraphs: string[] = [];

  if (v === 0) {
    paragraphs.push(
      `Pour un salaire brut de ${formatDH(amount)}, l\u2019imp\u00f4t sur le revenu s\u2019\u00e9l\u00e8ve \u00e0 ${formatDH(irMensuel)} par mois, soit ${formatDH(irAnnuel)} annuellement. Plusieurs leviers permettent de r\u00e9duire cette charge fiscale de mani\u00e8re l\u00e9gale.`
    );
    paragraphs.push(
      `Premi\u00e8re optimisation : la d\u00e9claration des personnes \u00e0 charge. En d\u00e9clarant votre conjoint, vous \u00e9conomisez ${formatDH(savings1)} net de plus par mois. Avec 3 personnes \u00e0 charge (conjoint + 2 enfants), le gain mensuel atteint ${formatDH(savings3)}, soit ${formatDH(savings3 * 12)} sur l\u2019ann\u00e9e.`
    );
  } else if (v === 1) {
    paragraphs.push(
      `Votre IR mensuel de ${formatDH(irMensuel)} (total annuel : ${formatDH(irAnnuel)}) peut \u00eatre optimis\u00e9 par des dispositifs fiscaux sp\u00e9cifiques au droit marocain.`
    );
    paragraphs.push(
      `La d\u00e9duction pour charge de famille repr\u00e9sente 360 DH/an par personne \u00e0 charge (maximum 6). Concr\u00e8tement, d\u00e9clarer 1 personne \u00e0 charge vous fait gagner ${formatDH(savings1)}/mois, et 3 personnes \u00e0 charge rapportent ${formatDH(savings3)}/mois suppl\u00e9mentaires.`
    );
  } else {
    paragraphs.push(
      `Avec ${formatDH(irAnnuel)} d\u2019IR annuel pour un brut de ${formatDH(amount)}, la pression fiscale reste \u00e0 ${pct(result.tauxEffectifIR)}. Voici comment l\u2019all\u00e9ger concr\u00e8tement.`
    );
    paragraphs.push(
      `Strat\u00e9gie 1 : d\u00e9clarer les ayants droit. L\u2019ajout d\u2019un conjoint augmente votre net de ${formatDH(savings1)}/mois. Avec conjoint et 2 enfants, vous r\u00e9cup\u00e9rez ${formatDH(savings3)}/mois, soit un gain annuel de ${formatDH(savings3 * 12)}.`
    );
  }

  paragraphs.push(
    `Strat\u00e9gie compl\u00e9mentaire : la souscription \u00e0 un plan d\u2019\u00e9pargne retraite (CIMR, plan compl\u00e9mentaire) permet de d\u00e9duire jusqu\u2019\u00e0 ${formatDH(retraiteComplementaire)}/mois de votre base imposable, g\u00e9n\u00e9rant une \u00e9conomie d\u2019imp\u00f4t estim\u00e9e \u00e0 ${formatDH(potentialSavings)}/mois pour votre tranche.`
  );

  paragraphs.push(
    `Enfin, les int\u00e9r\u00eats sur pr\u00eat immobilier sont d\u00e9ductibles (plafond 10% du RNI), ce qui pour un salaire de ${formatDH(amount)} brut, peut repr\u00e9senter une d\u00e9duction suppl\u00e9mentaire significative si vous \u00eates propri\u00e9taire ou en cours d\u2019acquisition.`
  );

  return paragraphs.join(' ');
}

/**
 * buildFaqs: 6 DIFFERENT FAQs per salary with exact calculations
 */
export function buildFaqs(amount: number, result: DecompositionSalaire): { question: string; answer: string }[] {
  const netMensuel = result.netMensuel;
  const irMensuel = result.irMensuel;
  const cnssMensuel = result.cnssMensuel;
  const amountStr = formatDH(amount);

  // Calculate various scenarios
  const result2dep = calculerSalaireNet(amount, 2);
  const result4dep = calculerSalaireNet(amount, 4);
  const raiseResult = calculerSalaireNet(amount * 1.1, 0);
  const netGainRaise = round2(raiseResult.netMensuel - result.netMensuel);

  const lowerAmount = amount > 3000 ? amount - 1000 : amount;
  const lowerResult = calculerSalaireNet(lowerAmount, 0);
  const higherAmount = amount + 1000;
  const higherResult = calculerSalaireNet(higherAmount, 0);

  const v = varIdx(amount, 6);

  // Pool of 12 FAQ templates - select 6 based on amount
  const allFaqs = [
    {
      question: `Quel est le montant exact du salaire net pour ${amountStr} brut au Maroc en 2026 ?`,
      answer: `Pour un salaire brut mensuel de ${amountStr}, le salaire net est de ${formatDH(netMensuel)} apr\u00e8s d\u00e9duction de ${formatDH(cnssMensuel)} de cotisations CNSS et ${formatDH(irMensuel)} d\u2019imp\u00f4t sur le revenu. Le taux de pr\u00e9l\u00e8vement global est de ${pct(result.tauxEffectifTotal)}.`,
    },
    {
      question: `Comment est calcul\u00e9e la CNSS sur un salaire de ${amountStr} ?`,
      answer: `La CNSS sur ${amountStr} brut se d\u00e9compose en : prestations sociales ${formatDH(result.cnssDetail.prestationsSociales)} (0,52% plafonn\u00e9), AMO ${formatDH(result.cnssDetail.amo)} (2,26% d\u00e9plafonn\u00e9), et retraite ${formatDH(result.cnssDetail.retraite)} (3,96% plafonn\u00e9 \u00e0 6 000 DH). Total CNSS : ${formatDH(cnssMensuel)}/mois soit ${formatDH(result.cnssAnnuel)}/an.`,
    },
    {
      question: `Combien gagne-t-on net avec ${amountStr} brut et 2 enfants \u00e0 charge ?`,
      answer: `Avec 2 personnes \u00e0 charge (mari\u00e9, 1 enfant par exemple), le salaire net passe \u00e0 ${formatDH(result2dep.netMensuel)}/mois au lieu de ${formatDH(netMensuel)} pour un c\u00e9libataire. L\u2019\u00e9conomie est de ${formatDH(round2(result2dep.netMensuel - netMensuel))}/mois gr\u00e2ce \u00e0 la d\u00e9duction familiale de 720 DH/an.`,
    },
    {
      question: `Quel est le co\u00fbt total employeur pour un salaire de ${amountStr} brut ?`,
      answer: `L\u2019employeur paie ${formatDH(result.coutEmployeurMensuel)}/mois au total : ${amountStr} de salaire brut + ${formatDH(result.cnssEmployeurDetail.total)} de charges patronales. Les charges comprennent les allocations familiales (${formatDH(result.cnssEmployeurDetail.allocationsFamiliales)}), l\u2019AMO patronale (${formatDH(result.cnssEmployeurDetail.amo)}), la retraite (${formatDH(result.cnssEmployeurDetail.retraite)}), et la formation professionnelle (${formatDH(result.cnssEmployeurDetail.formationProfessionnelle)}).`,
    },
    {
      question: `Une augmentation de 10% sur ${amountStr} brut, combien en net ?`,
      answer: `Passer de ${amountStr} \u00e0 ${formatDH(amount * 1.1)} brut (+10%) g\u00e9n\u00e8re un gain net de ${formatDH(netGainRaise)}/mois, soit ${formatDH(netGainRaise * 12)}/an. Le gain net est inf\u00e9rieur \u00e0 10% en raison de la progressivit\u00e9 de l\u2019IR : chaque dirham suppl\u00e9mentaire est impos\u00e9 au taux marginal de la tranche concern\u00e9e.`,
    },
    {
      question: `${amountStr} brut : quelle diff\u00e9rence avec ${formatDHArrondi(higherAmount)} ?`,
      answer: `La diff\u00e9rence nette entre ${amountStr} et ${formatDHArrondi(higherAmount)} brut est de ${formatDH(round2(higherResult.netMensuel - netMensuel))}/mois. Sur ${formatDHArrondi(higherAmount)}, l\u2019IR passe \u00e0 ${formatDH(higherResult.irMensuel)}/mois (contre ${formatDH(irMensuel)}), car une partie suppl\u00e9mentaire du revenu entre dans une tranche d\u2019imposition plus \u00e9lev\u00e9e.`,
    },
    {
      question: `Peut-on vivre confortablement avec ${amountStr} brut \u00e0 Casablanca ?`,
      answer: `Avec un net de ${formatDH(netMensuel)}, vivre \u00e0 Casablanca suppose un budget loyer de ${formatDHArrondi(netMensuel * 0.35)} (35% du net), transport de ${formatDHArrondi(netMensuel * 0.1)}, et alimentation de ${formatDHArrondi(netMensuel * 0.25)}. Il reste environ ${formatDHArrondi(netMensuel * 0.3)} pour \u00e9pargne et loisirs. ${netMensuel > 6000 ? 'Ce budget est g\u00e9rable pour un c\u00e9libataire.' : 'Ce budget est serr\u00e9, surtout pour une famille.'}`,
    },
    {
      question: `Quelles sont les tranches IR appliqu\u00e9es sur ${amountStr} brut ?`,
      answer: `Pour ${amountStr} brut, le revenu net imposable annuel est de ${formatDH(result.irDetail.revenuNetImposable)}. L\u2019IR est calcul\u00e9 par tranches : ${result.irDetail.detailTranches.filter(t => t.impot > 0).map(t => `${formatDH(t.montantImpose)} \u00e0 ${(t.tranche.taux * 100).toFixed(0)}% = ${formatDH(t.impot)}`).join(', ')}. IR brut total : ${formatDH(result.irDetail.irBrut)}/an.`,
    },
    {
      question: `${amountStr} brut avec 4 personnes \u00e0 charge : quel net ?`,
      answer: `Avec 4 personnes \u00e0 charge (conjoint + 3 enfants), le salaire net monte \u00e0 ${formatDH(result4dep.netMensuel)}/mois, soit ${formatDH(round2(result4dep.netMensuel - netMensuel))} de plus qu\u2019un c\u00e9libataire. La d\u00e9duction annuelle est de ${4 * 360} DH, r\u00e9duisant l\u2019IR mensuel \u00e0 ${formatDH(result4dep.irMensuel)}.`,
    },
    {
      question: `Quelle est la diff\u00e9rence entre ${amountStr} brut et ${formatDHArrondi(lowerAmount)} brut ?`,
      answer: `${amountStr} brut donne ${formatDH(netMensuel)} net/mois, tandis que ${formatDHArrondi(lowerAmount)} brut donne ${formatDH(lowerResult.netMensuel)} net/mois. La diff\u00e9rence de ${formatDH(round2(netMensuel - lowerResult.netMensuel))}/mois s\u2019explique par l\u2019augmentation proportionnelle de la CNSS et de l\u2019IR sur les ${formatDHArrondi(amount - lowerAmount)} suppl\u00e9mentaires.`,
    },
    {
      question: `Combien d\u2019heures de travail repr\u00e9sente le net de ${amountStr} brut ?`,
      answer: `Le net mensuel de ${formatDH(netMensuel)} sur 176 heures l\u00e9gales (22 jours \u00d7 8h) donne un taux horaire net de ${formatDH(round2(netMensuel / 176))}. Pour atteindre le SMIG net (${formatDH(calculerSalaireNet(SMIG_MENSUEL, 0).netMensuel)}), il faudrait ${round2(calculerSalaireNet(SMIG_MENSUEL, 0).netMensuel / (netMensuel / 176))} heures de travail au taux horaire de ${amountStr} brut.`,
    },
    {
      question: `${amountStr} brut : combien d\u2019imp\u00f4t en moins avec un cr\u00e9dit immobilier ?`,
      answer: `Les int\u00e9r\u00eats de pr\u00eat habitat sont d\u00e9ductibles du revenu imposable (plafonn\u00e9s \u00e0 10% du RNI). Pour ${amountStr} brut, si vous payez 2 000 DH/mois d\u2019int\u00e9r\u00eats, la d\u00e9duction annuelle de ${formatDH(Math.min(24000, result.irDetail.revenuNetImposable * 0.1))} peut r\u00e9duire votre IR d\u2019environ ${formatDH(round2(Math.min(24000, result.irDetail.revenuNetImposable * 0.1) * TRANCHES_IR[Math.min(bracketIdx(result), 5)].taux))}/an.`,
    },
  ];

  // Select 6 FAQs based on salary amount for uniqueness
  const startIdx = v;
  const selected: typeof allFaqs = [];
  for (let i = 0; i < 6; i++) {
    selected.push(allFaqs[(startIdx + i * 2) % allFaqs.length]);
  }

  return selected;
}

function bracketIdx(result: DecompositionSalaire): number {
  const rni = result.irDetail.revenuNetImposable;
  let idx = 0;
  for (let i = TRANCHES_IR.length - 1; i >= 0; i--) {
    if (rni > TRANCHES_IR[i].min) {
      idx = i;
      break;
    }
  }
  return idx;
}

/**
 * getRaiseSimulation: Impact of salary raise with exact DH numbers
 */
export function getRaiseSimulation(amount: number, result: DecompositionSalaire): string {
  const raises = [0.05, 0.10, 0.15, 0.20];
  const v = varIdx(amount, 2);

  const lines: string[] = [];

  if (v === 0) {
    lines.push(
      `Simulons l\u2019impact d\u2019une augmentation de salaire \u00e0 partir de ${formatDH(amount)} brut. Chaque augmentation de brut ne se traduit pas int\u00e9gralement en net en raison de la progressivit\u00e9 de l\u2019IR et des cotisations CNSS.`
    );
  } else {
    lines.push(
      `Quel gain net r\u00e9el obtenir avec une augmentation ? Voici la simulation d\u00e9taill\u00e9e \u00e0 partir de votre salaire actuel de ${formatDH(amount)} brut (net actuel : ${formatDH(result.netMensuel)}).`
    );
  }

  for (const r of raises) {
    const newBrut = round2(amount * (1 + r));
    const newResult = calculerSalaireNet(newBrut, 0);
    const gainBrut = round2(newBrut - amount);
    const gainNet = round2(newResult.netMensuel - result.netMensuel);
    const efficiency = round2((gainNet / gainBrut) * 100);

    lines.push(
      `\u2022 +${(r * 100).toFixed(0)}% (${formatDH(newBrut)} brut) : net de ${formatDH(newResult.netMensuel)}, gain net de ${formatDH(gainNet)}/mois (${formatDH(gainNet * 12)}/an). Efficacit\u00e9 : ${efficiency}% du gain brut converti en net.`
    );
  }

  lines.push(
    `On observe que l\u2019efficacit\u00e9 diminue l\u00e9g\u00e8rement avec les augmentations plus importantes, car une part croissante du revenu suppl\u00e9mentaire est impos\u00e9e aux tranches IR sup\u00e9rieures.`
  );

  return lines.join(' ');
}

/**
 * getBudgetBreakdown: Budget allocation varying by income level
 */
export function getBudgetBreakdown(netMensuel: number, amount: number): string {
  const v = varIdx(amount, 3);

  // Budget percentages vary by income level
  let loyerPct: number, transportPct: number, alimentationPct: number, epargePct: number, loisirsPct: number, diversPct: number;

  if (netMensuel < 4000) {
    loyerPct = 0.40; transportPct = 0.12; alimentationPct = 0.30; epargePct = 0.03; loisirsPct = 0.05; diversPct = 0.10;
  } else if (netMensuel < 6000) {
    loyerPct = 0.35; transportPct = 0.10; alimentationPct = 0.28; epargePct = 0.07; loisirsPct = 0.08; diversPct = 0.12;
  } else if (netMensuel < 9000) {
    loyerPct = 0.30; transportPct = 0.08; alimentationPct = 0.25; epargePct = 0.12; loisirsPct = 0.10; diversPct = 0.15;
  } else if (netMensuel < 15000) {
    loyerPct = 0.28; transportPct = 0.07; alimentationPct = 0.20; epargePct = 0.18; loisirsPct = 0.12; diversPct = 0.15;
  } else {
    loyerPct = 0.25; transportPct = 0.05; alimentationPct = 0.15; epargePct = 0.25; loisirsPct = 0.15; diversPct = 0.15;
  }

  const loyer = round2(netMensuel * loyerPct);
  const transport = round2(netMensuel * transportPct);
  const alimentation = round2(netMensuel * alimentationPct);
  const epargne = round2(netMensuel * epargePct);
  const loisirs = round2(netMensuel * loisirsPct);
  const divers = round2(netMensuel * diversPct);

  const intros = [
    `Avec un salaire net de ${formatDH(netMensuel)}, voici une r\u00e9partition budg\u00e9taire recommand\u00e9e adapt\u00e9e au co\u00fbt de la vie marocain :`,
    `Comment g\u00e9rer ${formatDH(netMensuel)} net par mois au Maroc ? Voici un budget type r\u00e9aliste :`,
    `Budget mensuel sugg\u00e9r\u00e9 pour un salaire net de ${formatDH(netMensuel)} au Maroc, bas\u00e9 sur les moyennes de co\u00fbt de vie 2026 :`,
  ];

  const lines: string[] = [intros[v]];

  lines.push(
    `\u2022 Loyer et charges : ${formatDH(loyer)} (${(loyerPct * 100).toFixed(0)}%) \u2014 ${loyer < 3000 ? 'studio ou colocation en p\u00e9riph\u00e9rie' : loyer < 5000 ? 'appartement 2 pi\u00e8ces en quartier r\u00e9sidentiel' : 'appartement confortable en centre-ville ou villa'}`
  );
  lines.push(
    `\u2022 Alimentation et courses : ${formatDH(alimentation)} (${(alimentationPct * 100).toFixed(0)}%) \u2014 ${alimentation < 2000 ? 'budget serr\u00e9, march\u00e9s locaux privil\u00e9gi\u00e9s' : alimentation < 3000 ? 'budget \u00e9quilibr\u00e9 entre march\u00e9 et supermarch\u00e9' : 'budget confortable avec restaurants occasionnels'}`
  );
  lines.push(
    `\u2022 Transport : ${formatDH(transport)} (${(transportPct * 100).toFixed(0)}%) \u2014 ${transport < 500 ? 'transport en commun exclusivement' : transport < 800 ? 'mix transport en commun et taxi' : 'v\u00e9hicule personnel (carburant + entretien)'}`
  );
  lines.push(
    `\u2022 \u00c9pargne : ${formatDH(epargne)} (${(epargePct * 100).toFixed(0)}%) \u2014 ${epargne < 500 ? '\u00e9pargne de pr\u00e9caution minimale' : epargne < 1500 ? 'constitution progressive d\u2019un matelas de s\u00e9curit\u00e9' : 'investissement r\u00e9gulier (OPCVM, assurance-vie, immobilier)'}`
  );
  lines.push(
    `\u2022 Loisirs et sorties : ${formatDH(loisirs)} (${(loisirsPct * 100).toFixed(0)}%)`
  );
  lines.push(
    `\u2022 Divers (sant\u00e9, habillement, impr\u00e9vus) : ${formatDH(divers)} (${(diversPct * 100).toFixed(0)}%)`
  );

  lines.push(
    `Total allou\u00e9 : ${formatDH(round2(loyer + transport + alimentation + epargne + loisirs + divers))}. ${epargne > 1000 ? 'Ce budget permet de constituer une \u00e9pargne significative sur le long terme.' : 'L\u2019objectif prioritaire devrait \u00eatre d\u2019augmenter la part d\u2019\u00e9pargne d\u00e8s que possible.'}`
  );

  return lines.join(' ');
}

/**
 * getUniqueComparisons: Comparisons to adjacent salaries
 */
export function getUniqueComparisons(amount: number, result: DecompositionSalaire): string {
  const allComparisons = [
    { diff: -1000, label: formatDHArrondi(amount - 1000) },
    { diff: -500, label: formatDHArrondi(amount - 500) },
    { diff: 500, label: formatDHArrondi(amount + 500) },
    { diff: 1000, label: formatDHArrondi(amount + 1000) },
    { diff: 2000, label: formatDHArrondi(amount + 2000) },
    { diff: 3000, label: formatDHArrondi(amount + 3000) },
    { diff: 4000, label: formatDHArrondi(amount + 4000) },
  ];
  const comparisons = allComparisons.filter(c => amount + c.diff >= 3000).slice(0, 5);

  const v = varIdx(amount, 2);
  const lines: string[] = [];

  if (v === 0) {
    lines.push(
      `Pour mieux situer un salaire de ${formatDH(amount)} brut, comparons-le aux niveaux de r\u00e9mun\u00e9ration voisins :`
    );
  } else {
    lines.push(
      `Voici comment ${formatDH(amount)} brut se compare aux salaires adjacents en termes de net, d\u2019IR et de taux de retenue :`
    );
  }

  for (const c of comparisons) {
    const compAmount = amount + c.diff;
    const compResult = calculerSalaireNet(compAmount, 0);
    const diffNet = round2(compResult.netMensuel - result.netMensuel);
    const sign = diffNet >= 0 ? '+' : '';

    lines.push(
      `\u2022 ${c.label} brut \u2192 ${formatDH(compResult.netMensuel)} net (${sign}${formatDH(diffNet)}/mois vs ${formatDH(amount)}), IR : ${pct(compResult.tauxEffectifIR)}, retenue totale : ${pct(compResult.tauxEffectifTotal)}`
    );
  }

  const diffHighest = comparisons[comparisons.length - 1];
  if (diffHighest) {
    const topResult = calculerSalaireNet(amount + diffHighest.diff, 0);
    lines.push(
      `L\u2019\u00e9cart de net entre ${formatDH(amount)} et ${diffHighest.label} brut est de ${formatDH(round2(topResult.netMensuel - result.netMensuel))}/mois. Cet \u00e9cart refl\u00e8te la progressivit\u00e9 du syst\u00e8me fiscal marocain o\u00f9 chaque tranche suppl\u00e9mentaire est davantage tax\u00e9e.`
    );
  }

  return lines.join(' ');
}

/**
 * getRegionalContext: Cost of living comparison across Moroccan cities
 */
export function getRegionalContext(amount: number, netMensuel: number): string {
  const v = varIdx(amount, 3);

  // Select 4 cities based on salary amount for variation
  const startCity = varIdx(amount, CITIES_DATA.length);
  const selectedCities: CityData[] = [];
  for (let i = 0; i < 4; i++) {
    selectedCities.push(CITIES_DATA[(startCity + i) % CITIES_DATA.length]);
  }

  const lines: string[] = [];

  const intros = [
    `Le pouvoir d\u2019achat de ${formatDH(netMensuel)} net varie consid\u00e9rablement selon la ville marocaine. Voici comment ce salaire se traduit en niveau de vie selon la localisation :`,
    `Avec ${formatDH(netMensuel)} de salaire net mensuel, votre niveau de vie d\u00e9pend fortement de votre ville de r\u00e9sidence. Analyse comparative :`,
    `O\u00f9 vivre au Maroc avec ${formatDH(netMensuel)} net ? Le co\u00fbt de la vie varie de 80 \u00e0 130 (indice 100 = moyenne nationale). D\u00e9tail par ville :`,
  ];

  lines.push(intros[v]);

  for (const city of selectedCities) {
    const adjustedPower = round2(netMensuel * (100 / city.coutVieIndex));
    const loyerRatio = round2((city.loyerMoyen2ch / netMensuel) * 100);
    const resteVivre = round2(netMensuel - city.loyerMoyen2ch - city.transport - city.alimentation);

    lines.push(
      `\u2022 ${city.name} (indice co\u00fbt de vie : ${city.coutVieIndex}/100) : loyer moyen 2 chambres ${formatDH(city.loyerMoyen2ch)} (${loyerRatio}% du net), transport ${formatDH(city.transport)}, alimentation ${formatDH(city.alimentation)}. Reste \u00e0 vivre : ${formatDH(resteVivre)}. Pouvoir d\u2019achat \u00e9quivalent : ${formatDH(adjustedPower)}.`
    );
  }

  const cheapest = selectedCities.reduce((a, b) => a.coutVieIndex < b.coutVieIndex ? a : b);
  const mostExpensive = selectedCities.reduce((a, b) => a.coutVieIndex > b.coutVieIndex ? a : b);

  lines.push(
    `Conclusion : avec ${formatDH(netMensuel)} net, le reste \u00e0 vivre \u00e0 ${cheapest.name} est sup\u00e9rieur de ${formatDH(round2((netMensuel - cheapest.loyerMoyen2ch - cheapest.transport - cheapest.alimentation) - (netMensuel - mostExpensive.loyerMoyen2ch - mostExpensive.transport - mostExpensive.alimentation)))} par rapport \u00e0 ${mostExpensive.name}, soit un \u00e9cart significatif qui peut orienter un choix de carri\u00e8re ou de mobilit\u00e9.`
  );

  return lines.join(' ');
}

/**
 * getSMIGComparison: Detailed comparison to SMIG for context
 */
export function getSMIGComparison(amount: number, result: DecompositionSalaire): string {
  const smigResult = calculerSalaireNet(SMIG_MENSUEL, 0);
  const diffNet = round2(result.netMensuel - smigResult.netMensuel);
  const multiplier = round2(result.netMensuel / smigResult.netMensuel);
  const diffIR = round2(result.irMensuel - smigResult.irMensuel);

  const v = varIdx(amount, 2);

  let base = '';
  if (v === 0) {
    base = `Par rapport au SMIG (${formatDH(SMIG_MENSUEL)} brut, ${formatDH(smigResult.netMensuel)} net), un salaire de ${formatDH(amount)} brut offre ${formatDH(diffNet)} de net suppl\u00e9mentaire par mois, soit ${multiplier}x le net du SMIG. La diff\u00e9rence d\u2019IR est de ${formatDH(diffIR)}/mois : le smigard ne paie que ${formatDH(smigResult.irMensuel)} d\u2019IR contre ${formatDH(result.irMensuel)} pour ${formatDH(amount)} brut.`;
  } else {
    base = `Le SMIG marocain 2026 (${formatDH(SMIG_MENSUEL)} brut) donne un net de ${formatDH(smigResult.netMensuel)}/mois. \u00c0 ${formatDH(amount)} brut, le salari\u00e9 per\u00e7oit ${multiplier} fois ce montant en net (${formatDH(result.netMensuel)}), avec un surplus de ${formatDH(diffNet)}/mois. Toutefois, l\u2019IR est ${result.irMensuel > 0 ? formatDH(diffIR) + ' plus \u00e9lev\u00e9' : 'identiquement nul'}, illustrant la progressivit\u00e9 du bar\u00e8me fiscal.`;
  }

  // Additional context for SMIG-level salaries
  if (amount <= 4000) {
    base += ` \u00c0 ce niveau de r\u00e9mun\u00e9ration proche du SMIG, il est essentiel de conna\u00eetre ses droits : le Code du Travail marocain pr\u00e9voit un minimum l\u00e9gal de ${formatDH(SMIG_MENSUEL)} brut pour 191 heures mensuelles. Toute r\u00e9mun\u00e9ration inf\u00e9rieure constitue une infraction passible de sanctions. Le SMIG est r\u00e9vis\u00e9 p\u00e9riodiquement par d\u00e9cret gouvernemental.`;
  } else if (amount <= 6000) {
    base += ` Ce salaire repr\u00e9sente un pouvoir d\u2019achat de ${formatDH(round2(result.netMensuel / smigResult.netMensuel))} SMIG nets, ce qui permet de couvrir les besoins essentiels et de constituer une petite \u00e9pargne dans les villes moyennes du Maroc.`;
  } else {
    base += ` Ce ratio de ${multiplier}x le SMIG net positionne ce salaire dans la cat\u00e9gorie des revenus ${multiplier > 3 ? 'nettement sup\u00e9rieurs' : 'mod\u00e9r\u00e9ment sup\u00e9rieurs'} au plancher l\u00e9gal, offrant un confort financier ${multiplier > 4 ? 'substantiel' : 'notable'} par rapport au minimum vital.`;
  }

  return base;
}

/**
 * getAnnualBreakdown: Yearly perspective with 13th month, primes etc.
 */
export function getAnnualBreakdown(amount: number, result: DecompositionSalaire): string {
  const netAnnuel = result.netAnnuel;
  const brutAnnuel = result.brutAnnuel;
  const totalRetenu = result.cnssAnnuel + result.irAnnuel;

  const v = varIdx(amount, 2);

  const lines: string[] = [];

  if (v === 0) {
    lines.push(
      `Sur une ann\u00e9e compl\u00e8te, ${formatDH(amount)} brut mensuel repr\u00e9sente ${formatDH(brutAnnuel)} brut annuel. Le net annuel per\u00e7u est de ${formatDH(netAnnuel)}, apr\u00e8s retenue de ${formatDH(totalRetenu)} (CNSS : ${formatDH(result.cnssAnnuel)}, IR : ${formatDH(result.irAnnuel)}).`
    );
  } else {
    lines.push(
      `Annualis\u00e9, votre salaire de ${formatDH(amount)} brut produit ${formatDH(netAnnuel)} net sur 12 mois. Les pr\u00e9l\u00e8vements annuels totalisent ${formatDH(totalRetenu)} : ${formatDH(result.cnssAnnuel)} pour la CNSS et ${formatDH(result.irAnnuel)} pour l\u2019IR.`
    );
  }

  // 13th month simulation
  const with13 = round2(netAnnuel + result.netMensuel);
  lines.push(
    `Si votre entreprise verse un 13\u00e8me mois (gratification), votre net annuel total atteindrait environ ${formatDH(with13)}. Certaines conventions collectives marocaines pr\u00e9voient \u00e9galement des primes de rendement (1 \u00e0 3 mois suppl\u00e9mentaires selon les secteurs).`
  );

  // Per-trimester view
  const netTrimestriel = round2(netAnnuel / 4);
  lines.push(
    `Vue trimestrielle : ${formatDH(netTrimestriel)} net par trimestre. Cette perspective est utile pour planifier les d\u00e9penses saisonni\u00e8res (rentr\u00e9e scolaire en septembre : pr\u00e9voir 2 000-5 000 DH, A\u00efd : 1 000-3 000 DH, vacances d\u2019\u00e9t\u00e9 : 3 000-8 000 DH selon le niveau de vie).`
  );

  return lines.join(' ');
}
