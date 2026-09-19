import BadgeCard from '../components/BadgeCard';
import LevelProgress from '../components/LevelProgress';
import PersonalBest from '../components/PersonalBest';
import { EmptyState, Spinner } from '../components/ScoreCard';
import StreakCard from '../components/StreakCard';
import { ALL_BADGES } from '../config/theme';
import { useApp } from '../context/AppContext';

export default function Achievements() {
  const { detail } = useApp();
  if (!detail) return <Spinner label="Loading achievements…" />;

  const earned = new Set(detail.badges.map((b) => b.badgeName));
  const byName = new Map(detail.badges.map((b) => [b.badgeName, b]));

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
            <BadgeCard key={n} name={n} earned={earned.has(n)} earnedAt={byName.get(n)?.earnedAt} />
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
