import { useState, useEffect, useRef } from 'react';

type ModeSalaire = 'mensuel' | 'annuel';

interface ChampSalaireProps {
  id: string;
  label?: string;
  value: string;
  onChange: (monthlyValue: string) => void;
  suffix?: string;
  helpText?: string;
  showToggle?: boolean;
}

export default function ChampSalaire({
  id,
  label = 'Salaire brut mensuel',
  value,
  onChange,
  suffix = 'DH',
  showToggle = true,
}: ChampSalaireProps) {
  const [mode, setMode] = useState<ModeSalaire>('mensuel');
  const [annuel, setAnnuel] = useState(() =>
    String(Math.round(Number(value) * 12 * 100) / 100)
  );
  const lastSentMensuel = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);

  // Sync annual from monthly when value changes externally
  useEffect(() => {
    if (mode === 'annuel' && value === lastSentMensuel.current) return;
    const num = Number(value) || 0;
    setAnnuel(String(Math.round(num * 12 * 100) / 100));
    lastSentMensuel.current = value;
    if (mode === 'mensuel') {
      setDisplayValue(value);
    }
  }, [value]);

  // Update display when mode changes
  useEffect(() => {
    if (mode === 'mensuel') {
      setDisplayValue(value);
    } else {
      setDisplayValue(annuel);
    }
  }, [mode]);

  const handleChange = (val: string) => {
    // Allow only numbers, dots, and commas
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    setDisplayValue(cleaned);

    if (mode === 'mensuel') {
      lastSentMensuel.current = cleaned;
      onChange(cleaned);
      setAnnuel(String(Math.round((Number(cleaned) || 0) * 12 * 100) / 100));
    } else {
      const mensuelCalc = String(Math.round(((Number(cleaned) || 0) / 12) * 100) / 100);
      lastSentMensuel.current = mensuelCalc;
      setAnnuel(cleaned);
      onChange(mensuelCalc);
    }
  };

  const handleBlur = () => {
    // Strip leading zeros
    const num = Number(displayValue) || 0;
    const cleaned = num === 0 ? '0' : String(num);
    setDisplayValue(cleaned);
    if (mode === 'mensuel') {
      onChange(cleaned);
    }
  };

  const mensuelNum = Number(value) || 0;
  const annuelNum = mensuelNum * 12;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-14 text-right text-charcoal shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {suffix}
          </span>
        </div>
        {showToggle && (
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            {(['mensuel', 'annuel'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {m === 'mensuel' ? '/mois' : '/an'}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        {mode === 'mensuel'
          ? `${annuelNum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH/an`
          : `${mensuelNum.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH/mois`}
      </p>
    </div>
  );
}
