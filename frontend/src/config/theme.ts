import type { OutcomeKey } from '../types';

export const OUTCOMES: Array<{
  key: OutcomeKey; label: string; tagline: string; color: string; soft: string; bar: string;
}> = [
  { key: 'stronger', label: 'STRONGER', tagline: 'Grip, power, body control', color: '#2563EB', soft: 'bg-blue-50', bar: 'bg-blue-500' },
  { key: 'fitter', label: 'FITTER', tagline: 'Stamina, endurance, coordination', color: '#16A34A', soft: 'bg-green-50', bar: 'bg-green-500' },
  { key: 'faster', label: 'FASTER', tagline: 'Speed, agility, reaction', color: '#F59E0B', soft: 'bg-amber-50', bar: 'bg-amber-500' },
  { key: 'champs', label: 'CHAMPS', tagline: 'Challenges, progression, goals', color: '#8B5CF6', soft: 'bg-violet-50', bar: 'bg-violet-500' },
];

export const outcomeMeta = (key: OutcomeKey) => OUTCOMES.find((o) => o.key === key) ?? OUTCOMES[0];

export const badgeLabel = (name: string): { label: string; icon: string } => {
  const map: Record<string, { label: string; icon: string }> = {
    'first-challenge': { label: 'First Challenge', icon: '🏅' },
    'streak-7': { label: '7-Day Streak', icon: '🔥' },
    'speed-master': { label: 'Speed Master', icon: '⚡' },
    'strength-starter': { label: 'Strength Starter', icon: '💪' },
    'endurance-star': { label: 'Endurance Star', icon: '🌀' },
    'agility-ace': { label: 'Agility Ace', icon: '🎯' },
    'personal-best': { label: 'Personal Best', icon: '🏆' },
  };
  return map[name] ?? { label: name, icon: '🎖️' };
};

export const ALL_BADGES = ['first-challenge', 'streak-7', 'speed-master', 'strength-starter', 'endurance-star', 'agility-ace', 'personal-best'];
