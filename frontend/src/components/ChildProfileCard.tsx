import type { Child } from '../types';

export default function ChildProfileCard({ child }: { child: Child }) {
  return (
    <div className="kivo-card flex items-center gap-4">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-3xl font-display text-3xl font-extrabold text-white"
        style={{ background: `linear-gradient(135deg, ${child.avatarColor}, ${child.avatarColor}99)` }}
        aria-hidden="true"
      >
        {child.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-2xl font-extrabold truncate">{child.name}</h3>
        <p className="text-sm font-semibold text-slate-500">
          Age {child.age} · {child.height}cm · {child.fitnessLevel}
        </p>
        {child.favoriteActivities.length > 0 && (
          <p className="mt-1 truncate text-xs font-semibold text-slate-400">❤️ {child.favoriteActivities.join(' · ')}</p>
        )}
      </div>
    </div>
  );
}
