import type { DecompositionSalaire } from '../../lib/salaire-engine';

interface PanelResultatProps {
  resultat: DecompositionSalaire;
  showEmployeur?: boolean;
}

function fmtDH(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const isRound = rounded === Math.floor(rounded);
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: isRound ? 0 : 2,
  }).format(rounded) + ' DH';
}

function fmtPct(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

export default function PanelResultat({ resultat, showEmployeur = true }: PanelResultatProps) {
  const {
    brutAnnuel,
    netAnnuel,
    netMensuel,
    irAnnuel,
    cnssAnnuel,
    tauxEffectifTotal,
    tauxEffectifIR,
  } = resultat;

  return (
    <div className="space-y-6">
      {/* Hero result */}
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">
          Votre salaire net mensuel
        </p>
        <p className="mt-1 text-4xl font-bold text-brand md:text-5xl">
          {fmtDH(netMensuel)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {fmtDH(netAnnuel)} net par an
        </p>
      </div>

      {/* Breakdown bar */}
      <BarreDecomposition resultat={resultat} />

      {/* Detail table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <tbody>
            <LigneTableau label="Salaire brut annuel" value={fmtDH(brutAnnuel)} bold />
            <LigneTableau
              label="Cotisations CNSS (salarie)"
              value={`-${fmtDH(cnssAnnuel)}`}
              sublabel={fmtPct(resultat.tauxEffectifCNSS)}
              negative
            />

            {/* CNSS detail */}
            <LigneTableau
              label="  - Prestations sociales"
              value={`-${fmtDH(resultat.cnssDetail.prestationsSociales * 12)}`}
              indent
            />
            <LigneTableau
              label="  - AMO"
              value={`-${fmtDH(resultat.cnssDetail.amo * 12)}`}
              indent
            />
            <LigneTableau
              label="  - Retraite"
              value={`-${fmtDH(resultat.cnssDetail.retraite * 12)}`}
              indent
            />

            <LigneTableau
              label="Revenu brut imposable"
              value={fmtDH(resultat.irDetail.revenuBrutImposable)}
            />
            <LigneTableau
              label="Frais professionnels (20%)"
              value={`-${fmtDH(resultat.irDetail.fraisProfessionnels)}`}
              negative
            />
            <LigneTableau
              label="Revenu net imposable"
              value={fmtDH(resultat.irDetail.revenuNetImposable)}
            />
            {resultat.irDetail.deductionFamille > 0 && (
              <LigneTableau
                label="Deductions familiales"
                value={`-${fmtDH(resultat.irDetail.deductionFamille)}`}
                negative
              />
            )}
            <LigneTableau
              label="IR (Impot sur le Revenu)"
              value={`-${fmtDH(irAnnuel)}`}
              sublabel={`Taux effectif : ${fmtPct(tauxEffectifIR)}`}
              negative
            />

            <LigneTableau
              label="Salaire net annuel"
              value={fmtDH(netAnnuel)}
              bold
              highlight
            />
            <LigneTableau
              label="Salaire net mensuel"
              value={fmtDH(netMensuel)}
              bold
              highlight
            />
            <LigneTableau
              label="Retenue totale effective"
              value={fmtPct(tauxEffectifTotal)}
            />
          </tbody>
        </table>
      </div>

      {/* Employer cost */}
      {showEmployeur && resultat.coutEmployeurAnnuel > 0 && (
        <details className="rounded-lg border border-gray-200">
          <summary className="cursor-pointer px-4 py-3 font-medium text-charcoal">
            Cout total employeur : {fmtDH(resultat.coutEmployeurMensuel)}/mois
          </summary>
          <div className="border-t border-gray-200 px-4 py-3 text-sm">
            <table className="w-full">
              <tbody>
                <LigneTableau label="Salaire brut" value={fmtDH(resultat.brutMensuel)} />
                <LigneTableau label="Allocations familiales (6,40%)" value={`+${fmtDH(resultat.cnssEmployeurDetail.allocationsFamiliales)}`} />
                <LigneTableau label="Prestations sociales (1,05%)" value={`+${fmtDH(resultat.cnssEmployeurDetail.prestationsSociales)}`} />
                <LigneTableau label="AMO patronale (4,11%)" value={`+${fmtDH(resultat.cnssEmployeurDetail.amo)}`} />
                <LigneTableau label="Retraite patronale (7,93%)" value={`+${fmtDH(resultat.cnssEmployeurDetail.retraite)}`} />
                <LigneTableau label="Formation professionnelle (1,6%)" value={`+${fmtDH(resultat.cnssEmployeurDetail.formationProfessionnelle)}`} />
                <LigneTableau label="Total charges patronales" value={fmtDH(resultat.cnssEmployeurDetail.total)} bold />
                <LigneTableau label="Cout total employeur" value={fmtDH(resultat.coutEmployeurMensuel)} bold highlight />
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

function BarreDecomposition({ resultat }: { resultat: DecompositionSalaire }) {
  const { brutAnnuel, cnssAnnuel, irAnnuel, netAnnuel } = resultat;
  if (brutAnnuel <= 0) return null;

  const pctCNSS = (cnssAnnuel / brutAnnuel) * 100;
  const pctIR = (irAnnuel / brutAnnuel) * 100;
  const pctNet = (netAnnuel / brutAnnuel) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-8 overflow-hidden rounded-full">
        <div
          className="flex items-center justify-center bg-amber-500 text-xs font-medium text-white transition-all"
          style={{ width: `${pctCNSS}%` }}
          title={`CNSS : ${pctCNSS.toFixed(1)}%`}
        >
          {pctCNSS > 5 && 'CNSS'}
        </div>
        <div
          className="flex items-center justify-center bg-red-500 text-xs font-medium text-white transition-all"
          style={{ width: `${pctIR}%` }}
          title={`IR : ${pctIR.toFixed(1)}%`}
        >
          {pctIR > 5 && 'IR'}
        </div>
        <div
          className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
          style={{ width: `${pctNet}%` }}
          title={`Net : ${pctNet.toFixed(1)}%`}
        >
          Net
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> CNSS {pctCNSS.toFixed(1)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> IR {pctIR.toFixed(1)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Net {pctNet.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function LigneTableau({
  label,
  value,
  sublabel,
  bold,
  negative,
  highlight,
  indent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  bold?: boolean;
  negative?: boolean;
  highlight?: boolean;
  indent?: boolean;
}) {
  return (
    <tr
      className={[
        'border-b border-gray-100',
        highlight ? 'bg-emerald-50' : '',
      ].join(' ')}
    >
      <td
        className={[
          'px-4 py-2',
          bold ? 'font-semibold text-charcoal' : 'text-gray-600',
          indent ? 'pl-8 text-xs' : '',
        ].join(' ')}
      >
        {label}
        {sublabel && (
          <span className="ml-2 text-xs text-gray-400">({sublabel})</span>
        )}
      </td>
      <td
        className={[
          'px-4 py-2 text-right tabular-nums',
          bold ? 'font-semibold' : '',
          negative ? 'text-red-600' : '',
          highlight ? 'text-emerald-700 font-bold' : 'text-charcoal',
        ].join(' ')}
      >
        {value}
      </td>
    </tr>
  );
}
