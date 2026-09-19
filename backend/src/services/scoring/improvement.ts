/**
 * Personal improvement only — never rank children against each other.
 * For higher-is-better metrics (score, jumps): (curr-prev)/prev*100.
 * For lower-is-better metrics (time): (prev-curr)/prev*100.
 */
export function improvementPercent(previous: number, current: number, lowerIsBetter = false): number {
  if (!previous || previous <= 0) return 0;
  const pct = lowerIsBetter
    ? ((previous - current) / previous) * 100
    : ((current - previous) / previous) * 100;
  return Math.round(pct * 10) / 10;
}
