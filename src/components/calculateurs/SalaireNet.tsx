import { useState, useMemo, useEffect } from 'react';
import { calculerSalaireNet } from '../../lib/salaire-engine';
import ChampSalaire from '../ui/ChampSalaire';
import PanelResultat from '../ui/PanelResultat';

interface SalaireNetProps {
  initialBrut?: number;
}

export default function SalaireNet({ initialBrut = 8000 }: SalaireNetProps) {
  const [brutMensuel, setBrutMensuel] = useState(String(initialBrut));
  const [dependants, setDependants] = useState(0);
  const [dirty, setDirty] = useState(false);

  const brutNum = Number(brutMensuel) || 0;

  const resultat = useMemo(
    () => calculerSalaireNet(brutNum, dependants),
    [brutNum, dependants]
  );

  const handleBrutChange = (v: string) => { setDirty(true); setBrutMensuel(v); };
  const handleDependantsChange = (v: number) => { setDirty(true); setDependants(v); };

  // Debounced URL hash state
  useEffect(() => {
    if (!dirty) return;
    const timeout = setTimeout(() => {
      if (brutNum > 0) {
        const params = new URLSearchParams();
        params.set('brut', String(brutNum));
        if (dependants > 0) params.set('dep', String(dependants));
        const newUrl = `${window.location.pathname}#${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [dirty, brutNum, dependants]);

  // Read URL state on mount
  useEffect(() => {
    const hashStr = window.location.hash.replace(/^#/, '');
    if (!hashStr) return;
    const params = new URLSearchParams(hashStr);
    const b = params.get('brut');
    if (b) setBrutMensuel(b);
    const d = params.get('dep');
    if (d) setDependants(Math.min(6, Math.max(0, Number(d) || 0)));
    setDirty(true);
  }, []);

  return (
    <div className="space-y-6">
      <ChampSalaire
        id="brut-mensuel"
        label="Salaire brut mensuel"
        value={brutMensuel}
        onChange={handleBrutChange}
      />

      <div>
        <label htmlFor="dependants" className="block text-sm font-medium text-gray-700">
          Nombre de personnes à charge
        </label>
        <div className="mt-1 flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDependantsChange(n)}
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
        <p className="mt-1 text-xs text-gray-500">
          Déduction de {dependants * 360} DH/an ({dependants} x 360 DH)
        </p>
      </div>

      <PanelResultat resultat={resultat} />
    </div>
  );
}
