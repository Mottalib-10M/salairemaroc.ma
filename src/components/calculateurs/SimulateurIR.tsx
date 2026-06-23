import { useState, useMemo, useEffect } from 'react';
import { calculerIR, calculerCotisationsCNSSSalarie, TRANCHES_IR } from '../../lib/salaire-engine';

function fmtDH(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const isRound = rounded === Math.floor(rounded);
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: isRound ? 0 : 2,
  }).format(rounded) + ' DH';
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + '%';
}

export default function SimulateurIR() {
  const [revenuAnnuel, setRevenuAnnuel] = useState('96000');
  const [displayValue, setDisplayValue] = useState('96000');
  const [dependants, setDependants] = useState(0);

  const revenuNum = Number(revenuAnnuel) || 0;

  const resultat = useMemo(() => {
    const brutAnnuel = revenuNum;
    // Calculate CNSS for monthly equivalent
    const brutMensuel = brutAnnuel / 12;
    const cnssDetail = calculerCotisationsCNSSSalarie(brutMensuel);
    const cnssAnnuel = cnssDetail.total * 12;
    return calculerIR(brutAnnuel, cnssAnnuel, dependants);
  }, [revenuNum, dependants]);

  const handleChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    setDisplayValue(cleaned);
    setRevenuAnnuel(cleaned);
  };

  const handleBlur = () => {
    const num = Number(displayValue) || 0;
    setDisplayValue(num === 0 ? '0' : String(num));
  };

  // Hash URL state
  useEffect(() => {
    const hashStr = window.location.hash.replace(/^#/, '');
    if (!hashStr) return;
    const params = new URLSearchParams(hashStr);
    const r = params.get('revenu');
    if (r) { setRevenuAnnuel(r); setDisplayValue(r); }
    const d = params.get('dep');
    if (d) setDependants(Math.min(6, Math.max(0, Number(d) || 0)));
  }, []);

  useEffect(() => {
    if (revenuNum > 0) {
      const params = new URLSearchParams();
      params.set('revenu', String(revenuNum));
      if (dependants > 0) params.set('dep', String(dependants));
      const timeout = setTimeout(() => {
        window.history.replaceState(null, '', `${window.location.pathname}#${params.toString()}`);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [revenuNum, dependants]);

  // Marginal rate chart data
  const maxRevenu = Math.max(revenuNum * 1.5, 250000);
  const chartPoints = 50;
  const chartData = Array.from({ length: chartPoints + 1 }, (_, i) => {
    const r = (maxRevenu / chartPoints) * i;
    const brutMensuel = r / 12;
    const cnssDetail = calculerCotisationsCNSSSalarie(brutMensuel);
    const cnssAnnuel = cnssDetail.total * 12;
    const ir = calculerIR(r, cnssAnnuel, 0);
    return { revenu: r, taux: ir.tauxEffectif };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="revenu-annuel" className="block text-sm font-medium text-gray-700">
            Salaire brut annuel
          </label>
          <div className="relative">
            <input
              id="revenu-annuel"
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-14 text-right text-charcoal shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              DH
            </span>
          </div>
          <p className="text-xs text-gray-500">
            soit {(revenuNum / 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH/mois
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre de personnes a charge
          </label>
          <div className="mt-1 flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDependants(n)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  dependants === n
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero result */}
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">
          Impot sur le Revenu annuel
        </p>
        <p className="mt-1 text-4xl font-bold text-red-600 md:text-5xl">
          {fmtDH(resultat.irNet)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Taux effectif : {fmtPct(resultat.tauxEffectif)} &middot; soit {fmtDH(resultat.irNet / 12)}/mois
        </p>
      </div>

      {/* IR steps */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-2 font-semibold text-charcoal">Salaire brut annuel</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtDH(revenuNum)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-2 text-gray-600">Cotisations CNSS salarie</td>
              <td className="px-4 py-2 text-right tabular-nums text-red-600">-{fmtDH(revenuNum - resultat.revenuBrutImposable)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-2 text-gray-600">= Revenu brut imposable</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(resultat.revenuBrutImposable)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-2 text-gray-600">Frais professionnels (20%, max 30 000 DH)</td>
              <td className="px-4 py-2 text-right tabular-nums text-red-600">-{fmtDH(resultat.fraisProfessionnels)}</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="px-4 py-2 font-semibold text-charcoal">= Revenu net imposable</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtDH(resultat.revenuNetImposable)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bracket-by-bracket breakdown */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-500">Tranche</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Taux</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Montant impose</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Impot</th>
            </tr>
          </thead>
          <tbody>
            {resultat.detailTranches.map((dt, i) => (
              <tr key={i} className={[
                'border-t border-gray-100',
                dt.montantImpose > 0 ? '' : 'opacity-40',
              ].join(' ')}>
                <td className="px-4 py-2 text-gray-600">
                  {dt.tranche.max === Infinity
                    ? `> ${dt.tranche.min.toLocaleString('fr-FR')} DH`
                    : `${dt.tranche.min.toLocaleString('fr-FR')} - ${dt.tranche.max.toLocaleString('fr-FR')} DH`
                  }
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  {(dt.tranche.taux * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtDH(dt.montantImpose)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-red-600">
                  {fmtDH(dt.impot)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="px-4 py-2 font-semibold text-charcoal" colSpan={3}>IR brut</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold text-red-600">{fmtDH(resultat.irBrut)}</td>
            </tr>
            {resultat.deductionFamille > 0 && (
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-600" colSpan={3}>
                  Deductions pour charges de famille ({dependants} x 360 DH)
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-600">-{fmtDH(resultat.deductionFamille)}</td>
              </tr>
            )}
            <tr className="bg-red-50">
              <td className="px-4 py-2 font-bold text-charcoal" colSpan={3}>IR net a payer</td>
              <td className="px-4 py-2 text-right tabular-nums font-bold text-red-700">{fmtDH(resultat.irNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual: Effective rate progression */}
      <div>
        <h3 className="mb-3 font-semibold text-charcoal">Progression du taux effectif d'IR</h3>
        <div className="relative h-48 rounded-lg border border-gray-200 bg-white p-4">
          <svg viewBox="0 0 500 180" className="h-full w-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 0.1, 0.2, 0.3].map((rate) => (
              <line
                key={rate}
                x1="0" y1={180 - rate * 450} x2="500" y2={180 - rate * 450}
                stroke="#e5e7eb" strokeWidth="1"
              />
            ))}
            {/* Rate curve */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              points={chartData.map((d, i) => {
                const x = (i / chartPoints) * 500;
                const y = 180 - d.taux * 450;
                return `${x},${y}`;
              }).join(' ')}
            />
            {/* Current position marker */}
            {revenuNum > 0 && (
              <circle
                cx={(revenuNum / maxRevenu) * 500}
                cy={180 - resultat.tauxEffectif * 450}
                r="5"
                fill="#0D9488"
                stroke="white"
                strokeWidth="2"
              />
            )}
          </svg>
          <div className="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-gray-400">
            <span>0 DH</span>
            <span>{(maxRevenu / 2).toLocaleString('fr-FR')} DH</span>
            <span>{maxRevenu.toLocaleString('fr-FR')} DH</span>
          </div>
          <div className="absolute left-0 top-4 flex flex-col justify-between text-xs text-gray-400" style={{ height: 'calc(100% - 2rem)' }}>
            <span>30%</span>
            <span>20%</span>
            <span>10%</span>
            <span>0%</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Le point vert indique votre position actuelle : taux effectif de {fmtPct(resultat.tauxEffectif)} pour un brut annuel de {fmtDH(revenuNum)}.
        </p>
      </div>
    </div>
  );
}
