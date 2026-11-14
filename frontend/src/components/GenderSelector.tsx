'use client';
import clsx from 'clsx';

const options = [
  { value: 'ANY', label: 'Anyone', icon: '👥' },
  { value: 'MALE', label: 'Male', icon: '👨' },
  { value: 'FEMALE', label: 'Female', icon: '👩' },
];

interface GenderSelectorProps {
  value: string;
  onChange: (v: string) => void;
}

export default function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
            value === opt.value
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
              : 'bg-white/5 text-surface-400 border border-white/10 hover:bg-white/10'
          )}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
