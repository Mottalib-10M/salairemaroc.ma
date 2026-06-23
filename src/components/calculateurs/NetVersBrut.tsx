import { useState, useMemo, useEffect } from 'react';
import { calculerBrutDepuisNet } from '../../lib/salaire-engine';
import PanelResultat from '../ui/PanelResultat';

export default function NetVersBrut() {
  const [netCible, setNetCible] = useState('6000');
  const [dependants, setDependants] = useState(0);
  const [displayValue, setDisplayValue] = useState('6000');

  const netNum = Number(netCible) || 0;

  const resultat = useMemo(
    () => calculerBrutDepuisNet(netNum, dependants),
    [netNum, dependants]
  );

  const handleChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    setDisplayValue(cleaned);
    setNetCible(cleaned);
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
    const n = params.get('net');
    if (n) { setNetCible(n); setDisplayValue(n); }
    const d = params.get('dep');
    if (d) setDependants(Math.min(6, Math.max(0, Number(d) || 0)));
  }, []);

  useEffect(() => {
    if (netNum > 0) {
      const params = new URLSearchParams();
      params.set('net', String(netNum));
      if (dependants > 0) params.set('dep', String(dependants));
      const timeout = setTimeout(() => {
        window.history.replaceState(null, '', `${window.location.pathname}#${params.toString()}`);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [netNum, dependants]);

  const fmtDH = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' DH';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="net-cible" className="block text-sm font-medium text-gray-700">
          Salaire net souhaite (mensuel)
        </label>
        <div className="relative">
          <input
            id="net-cible"
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
          {(netNum * 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH/an
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

      {/* Result: required gross */}
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">
          Pour obtenir {fmtDH(netNum)} net/mois, il vous faut un brut de
        </p>
        <p className="mt-1 text-4xl font-bold text-brand md:text-5xl">
          {fmtDH(resultat.brutMensuel)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          soit {fmtDH(resultat.brutAnnuel)} brut par an
        </p>
      </div>

      <PanelResultat resultat={resultat} />
    </div>
  );
}
