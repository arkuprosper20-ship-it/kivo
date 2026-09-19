import { GOALS } from '../config/theme';

export default function GoalSelect({ value, onChange, label = 'WHAT DO YOU WANT TO IMPROVE?' }: {
  value: string[]; onChange: (g: string[]) => void; label?: string;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((g) => g !== id) : [...value, id].slice(0, 6));

  return (
    <div>
      <span className="kivo-label">{label}</span>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
        {GOALS.map((g) => {
          const on = value.includes(g.id);
          return (
            <button
              key={g.id} type="button" onClick={() => toggle(g.id)} aria-pressed={on}
              className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm font-bold transition-all ${
                on ? 'border-kivo-600 bg-kivo-50 text-kivo-800 shadow-pop' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">{g.icon}</span>
              {g.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
