const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, Math.round(v)));

/**
 * Rope Rush: jumps in durationSec. Level curve L1=20 … L5=50+speed.
 * 60s reference: 50 jumps => ~100. Shorter sessions scale pro-rata.
 */
export function normalizeRope(jumps: number, durationSec = 60): number {
  const perMinute = durationSec > 0 ? (jumps / durationSec) * 60 : 0;
  if (perMinute <= 0) return 5;
  // 10 jumps/min => ~30, 30 => ~68, 42 => ~84, 50 => ~92, 60+ => 100
  const score = 12 + perMinute * 1.6 - Math.max(0, perMinute - 50) * 0.4;
  return clamp(score);
}

/**
 * Reaction Rush: avgMs (lower better) blended with accuracy.
 * ~500ms/100% => ~97, 820ms/94% => ~88, 940ms/88% => ~78.
 */
export function normalizeReaction(avgMs: number, accuracy = 100): number {
  const speed = 132 - avgMs / 19; // 500ms->106, 820->89, 940->82.5
  const acc = Math.min(100, Math.max(0, accuracy));
  return clamp(speed * 0.72 + acc * 0.28);
}

/**
 * Agility Command: seconds (lower better) blended with accuracy, errors penalised.
 * 14.2s/92%/1err => ~84, 16.4s/84%/2err => ~74.
 */
export function normalizeAgility(seconds: number, accuracy = 100, errors = 0): number {
  const time = 122 - seconds * 2.6; // 14.2s->85, 16.4->79.4
  const acc = Math.min(100, Math.max(0, accuracy));
  return clamp(time * 0.7 + acc * 0.3 - errors * 1.5);
}

export function calculateScore(challengeId: string, raw: Record<string, number>): number {
  switch (challengeId) {
    case 'rope-rush':
      return normalizeRope(raw.jumps || 0, raw.durationSec || 60);
    case 'reaction-rush':
      return normalizeReaction(raw.avgMs ?? 1200, raw.accuracy ?? 0);
    case 'agility-command':
      return normalizeAgility(raw.seconds ?? 60, raw.accuracy ?? 0, raw.errors ?? 0);
    default:
      return clamp(raw.score || 50);
  }
}
