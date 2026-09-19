import { useEffect, useState } from 'react';
import BadgeCard from '../components/BadgeCard';
import LevelProgress from '../components/LevelProgress';
import PersonalBest from '../components/PersonalBest';
import { EmptyState, ErrorState, Spinner } from '../components/ScoreCard';
import StreakCard from '../components/StreakCard';
import { ALL_BADGES, badgeLabel } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { BadgeProgress } from '../types';

export default function Achievements() {
  const { detail, child } = useApp();
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!child) return;
    api.get<{ badgeProgress: BadgeProgress[] }>(`/children/${child.id}/achievements`)
      .then((r) => setProgress(r.badgeProgress || []))
      .catch((e) => setErr(e.message));
  }, [child]);

  if (err && !detail) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!detail) return <Spinner label="Loading achievements…" />;

  const earned = new Set(detail.badges.map((b) => b.badgeName));
  const byName = new Map(detail.badges.map((b) => [b.badgeName, b]));
  const progByName = new Map(progress.map((p) => [p.name, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Achievements 🏅</h1>
        <p className="mt-1 font-semibold text-slate-500">Every badge is proof you beat yesterday's you.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LevelProgress level={detail.level} xp={detail.xpTotal} progress={detail.levelProgress} />
        <StreakCard days={detail.streak.currentDays} />
      </div>

      <section aria-label="Badges">
        <h2 className="mb-3 font-display text-xl font-extrabold">
          Badges · {detail.badges.length}/{ALL_BADGES.length}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ALL_BADGES.map((n) => (
            <div key={n}>
              <BadgeCard name={n} earned={earned.has(n)} earnedAt={byName.get(n)?.earnedAt} />
              {!earned.has(n) && progByName.get(n) && (
                <div className="mt-1.5 px-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar"
                    aria-valuenow={progByName.get(n)!.current} aria-valuemin={0} aria-valuemax={progByName.get(n)!.target}
                    aria-label={`${badgeLabel(n).label} progress`}>
                    <div className="h-full rounded-full bg-kivo-500"
                      style={{ width: `${(progByName.get(n)!.current / Math.max(1, progByName.get(n)!.target)) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-center text-[11px] font-bold text-slate-500">
                    {progByName.get(n)!.current}/{progByName.get(n)!.target}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Personal records">
        <h2 className="mb-3 font-display text-xl font-extrabold">Personal records</h2>
        {detail.personalBests.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detail.personalBests.map((pb) => (
              <PersonalBest key={pb.challengeId} pb={pb} />
            ))}
          </div>
        ) : (
          <EmptyState title="No records yet" hint="Complete challenges to set personal records!" />
        )}
      </section>
    </div>
  );
}
