import { useState, useMemo, useEffect } from 'react';
import { calculerCoutEmployeur, calculerSalaireNet } from '../../lib/salaire-engine';
import ShareButtons from '../ui/ShareButtons';

function fmtDH(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const isRound = rounded === Math.floor(rounded);
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: isRound ? 0 : 2,
  }).format(rounded) + ' DH';
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function fmtDHSimple(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export default function CoutEmployeur() {
  const [brutMensuel, setBrutMensuel] = useState('8000');
  const [displayValue, setDisplayValue] = useState('8000');

  const brutNum = Number(brutMensuel) || 0;

  const cout = useMemo(() => calculerCoutEmployeur(brutNum), [brutNum]);
  const salaire = useMemo(() => calculerSalaireNet(brutNum, 0), [brutNum]);

  const handleChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    setDisplayValue(cleaned);
    setBrutMensuel(cleaned);
  };

  const handleBlur = () => {
    const num = Number(displayValue) || 0;
    setDisplayValue(num === 0 ? '0' : String(num));
  };

  // Read URL state on mount (query params + legacy hash fallback)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let b = searchParams.get('brut');

    if (!b) {
      const hashStr = window.location.hash.replace(/^#/, '');
      if (hashStr) {
        const hashParams = new URLSearchParams(hashStr);
        b = hashParams.get('brut');
      }
    }

    if (b) { setBrutMensuel(b); setDisplayValue(b); }
  }, []);

  // Debounced URL query param update
  useEffect(() => {
    if (brutNum > 0) {
      const timeout = setTimeout(() => {
        window.history.replaceState(null, '', `${window.location.pathname}?brut=${brutNum}`);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [brutNum]);

  const totalEmployeurPct = brutNum > 0 ? cout.cnssEmployeurMensuel / brutNum : 0;

  const shareText = brutNum > 0
    ? `Le coût total employeur pour un salaire de ${fmtDHSimple(brutNum)} DH brut au Maroc est de ${fmtDHSimple(cout.coutTotalMensuel)} DH/mois. Calculez le vôtre :`
    : '';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="brut-employeur" className="block text-sm font-medium text-gray-700">
          Salaire brut mensuel
        </label>
        <div className="relative">
          <input
            id="brut-employeur"
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
      </div>

      {/* Hero result */}
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">
          Coût total employeur mensuel
        </p>
        <p className="mt-1 text-4xl font-bold text-brand md:text-5xl">
          {fmtDH(cout.coutTotalMensuel)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          soit {fmtDH(cout.coutTotalAnnuel)} par an
        </p>
      </div>

      {/* Visual breakdown */}
      {brutNum > 0 && (
        <div className="space-y-2">
          <div className="flex h-8 overflow-hidden rounded-full">
            <div
              className="flex items-center justify-center bg-brand text-xs font-medium text-white transition-all"
              style={{ width: `${(brutNum / cout.coutTotalMensuel) * 100}%` }}
            >
              Brut
            </div>
            <div
              className="flex items-center justify-center bg-amber-500 text-xs font-medium text-white transition-all"
              style={{ width: `${(cout.cnssEmployeurMensuel / cout.coutTotalMensuel) * 100}%` }}
            >
              CNSS
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-brand" />
              Salaire brut : {fmtDH(brutNum)}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Charges patronales : {fmtDH(cout.cnssEmployeurMensuel)} ({fmtPct(totalEmployeurPct)})
            </span>
          </div>
        </div>
      )}

      {/* Employer CNSS detail */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left font-medium text-gray-500">Cotisation patronale</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Taux</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Mensuel</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Annuel</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 text-gray-600">Allocations familiales</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">6,40%</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.allocationsFamiliales)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.allocationsFamiliales * 12)}</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 text-gray-600">Prestations sociales</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">1,05%</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.prestationsSociales)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.prestationsSociales * 12)}</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 text-gray-600">AMO patronale</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">4,11%</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.amo)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.amo * 12)}</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 text-gray-600">Retraite patronale</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">7,93%</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.retraite)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.retraite * 12)}</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 text-gray-600">Formation professionnelle</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">1,60%</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.formationProfessionnelle)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtDH(cout.cnssEmployeurDetail.formationProfessionnelle * 12)}</td>
            </tr>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="px-4 py-2 font-semibold text-charcoal">Total charges patronales</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtPct(totalEmployeurPct)}</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtDH(cout.cnssEmployeurMensuel)}</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtDH(cout.cnssEmployeurAnnuel)}</td>
            </tr>
            <tr className="bg-emerald-50">
              <td className="px-4 py-2 font-bold text-charcoal" colSpan={2}>Coût total employeur</td>
              <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{fmtDH(cout.coutTotalMensuel)}</td>
              <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-700">{fmtDH(cout.coutTotalAnnuel)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* What employee actually receives */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-2 font-semibold text-charcoal">Ce que le salarié reçoit</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Salaire net mensuel</p>
            <p className="text-lg font-bold text-brand">{fmtDH(salaire.netMensuel)}</p>
          </div>
          <div>
            <p className="text-gray-500">Salaire net annuel</p>
            <p className="text-lg font-bold text-brand">{fmtDH(salaire.netAnnuel)}</p>
          </div>
        </div>
      </div>

      {brutNum > 0 && <ShareButtons shareText={shareText} />}
    </div>
  );
}
