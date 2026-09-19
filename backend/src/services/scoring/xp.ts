/** XP rewards effort + mastery + personal improvement. */
export function xpForScore(score: number, opts?: { isPersonalBest?: boolean; improvement?: number }): number {
  const base = 10 + Math.round(score / 2);
  const pb = opts?.isPersonalBest ? 25 : 0;
  const imp = Math.min(15, Math.max(0, Math.round((opts?.improvement || 0) / 2)));
  return base + pb + imp;
}

/** Level thresholds (cumulative XP). */
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** 0-100 progress toward the next level. */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  const cur = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? cur + 500;
  if (next <= cur) return 100;
  return Math.min(100, Math.max(0, Math.round(((xp - cur) / (next - cur)) * 100)));
}
