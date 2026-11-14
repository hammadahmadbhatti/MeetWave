'use client';
import { useState, useMemo } from 'react';

const countries = [
  { code: '', name: 'Any Country' },
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' }, { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' }, { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' }, { code: 'RU', name: 'Russia' },
  { code: 'TR', name: 'Turkey' }, { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' }, { code: 'SE', name: 'Sweden' },
  { code: 'AR', name: 'Argentina' }, { code: 'CO', name: 'Colombia' },
  { code: 'TH', name: 'Thailand' }, { code: 'PH', name: 'Philippines' },
  { code: 'EG', name: 'Egypt' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'PK', name: 'Pakistan' }, { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' }, { code: 'UA', name: 'Ukraine' },
  { code: 'ID', name: 'Indonesia' }, { code: 'VN', name: 'Vietnam' },
];

interface CountrySelectorProps {
  value: string;
  onChange: (v: string) => void;
}

export default function CountrySelector({ value, onChange }: CountrySelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() =>
    countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const selected = countries.find((c) => c.code === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between text-surface-300"
      >
        <span>{selected?.code ? `${selected.name}` : 'Any Country'}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full glass rounded-xl overflow-hidden z-50 shadow-2xl">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-surface-500 outline-none border border-white/10 focus:border-brand-500/50"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => { onChange(c.code); setIsOpen(false); setSearch(''); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 text-surface-300 hover:text-white"
              >
                {c.code && <img src={`https://flagcdn.com/16x12/${c.code.toLowerCase()}.png`} alt="" className="w-4 h-3" />}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
