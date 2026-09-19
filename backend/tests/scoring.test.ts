import { describe, expect, it } from 'vitest';
import { improvementPercent } from '../src/services/scoring/improvement';
import { kivoScore, updateOutcomes } from '../src/services/scoring/kivoScore';
import { calculateScore, normalizeAgility, normalizeReaction, normalizeRope } from '../src/services/scoring/normalize';
import { levelFromXp, levelProgress, xpForScore } from '../src/services/scoring/xp';

describe('normalize', () => {
  it('rope: demo 42 jumps/60s scores in the 80s', () => {
    const s = normalizeRope(42, 60);
    expect(s).toBeGreaterThanOrEqual(78);
    expect(s).toBeLessThanOrEqual(95);
  });
  it('rope: more jumps always score higher', () => {
    expect(normalizeRope(50, 60)).toBeGreaterThan(normalizeRope(30, 60));
    expect(normalizeRope(30, 60)).toBeGreaterThan(normalizeRope(10, 60));
  });
  it('reaction: demo 0.82s/94% scores in the 80s', () => {
    const s = normalizeReaction(820, 94);
    expect(s).toBeGreaterThanOrEqual(80);
    expect(s).toBeLessThanOrEqual(95);
  });
  it('reaction: faster reactions score higher', () => {
    expect(normalizeReaction(600, 95)).toBeGreaterThan(normalizeReaction(940, 88));
  });
  it('agility: demo 14.2s/92% scores in the 80s', () => {
    const s = normalizeAgility(14.2, 92, 1);
    expect(s).toBeGreaterThanOrEqual(78);
    expect(s).toBeLessThanOrEqual(95);
  });
  it('calculateScore routes by challenge id', () => {
    expect(calculateScore('rope-rush', { jumps: 42, durationSec: 60 })).toBe(normalizeRope(42, 60));
    expect(calculateScore('reaction-rush', { avgMs: 820, accuracy: 94 })).toBe(normalizeReaction(820, 94));
  });
});

describe('improvement', () => {
  it('higher-is-better: 35 -> 42 jumps is +20%', () => {
    expect(improvementPercent(35, 42)).toBe(20);
  });
  it('lower-is-better: 0.91 -> 0.82s is about +9.9%', () => {
    expect(improvementPercent(0.91, 0.82, true)).toBeCloseTo(9.9, 1);
  });
  it('zero previous is 0, never NaN', () => {
    expect(improvementPercent(0, 42)).toBe(0);
  });
});

describe('xp and levels', () => {
  it('personal best earns a bonus', () => {
    expect(xpForScore(87, { isPersonalBest: true, improvement: 9.9 })).toBeGreaterThan(xpForScore(87, {}));
  });
  it('level curve: 320 xp is level 3', () => {
    expect(levelFromXp(320)).toBe(3);
  });
  it('levelProgress is 0-100', () => {
    const p = levelProgress(320);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });
});

describe('kivo outcomes', () => {
  it('demo journey moves 62/58/71/40 toward targets', () => {
    let s = { stronger: 62, fitter: 58, faster: 71, champs: 40 };
    s = updateOutcomes(s, 'rope-rush', 84);
    s = updateOutcomes(s, 'reaction-rush', 88);
    s = updateOutcomes(s, 'agility-command', 84);
    expect(s.fitter).toBeGreaterThan(58);
    expect(s.faster).toBeGreaterThan(71);
    expect(s.champs).toBeGreaterThan(40);
    expect(kivoScore(s)).toBeGreaterThan(kivoScore({ stronger: 62, fitter: 58, faster: 71, champs: 40 }));
  });
});
