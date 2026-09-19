import { describe, expect, it } from 'vitest';
import { ageFromDob, ageGroup, isMinor } from '../src/utils/age';
import { evaluateDifficulty } from '../src/services/scoring/difficulty';
import { improvementPercent } from '../src/services/scoring/improvement';
import { kivoScore, updateOutcomes } from '../src/services/scoring/kivoScore';
import { calculateScore, normalizeAgility, normalizeBalance, normalizeEndurance, normalizePower, normalizeReaction, normalizeRope } from '../src/services/scoring/normalize';
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
  it('new challenges nudge their primary outcome', () => {
    const base = { stronger: 60, fitter: 60, faster: 60, champs: 60 };
    expect(updateOutcomes(base, 'power-pulse', 85).stronger).toBeGreaterThan(60);
    expect(updateOutcomes(base, 'endurance-quest', 85).fitter).toBeGreaterThan(60);
    expect(updateOutcomes(base, 'balance-master', 85).champs).toBeGreaterThan(60);
  });
});

describe('new challenges', () => {
  it('power: 65 reps/30s scores in the 80s', () => {
    const s = normalizePower(65, 30);
    expect(s).toBeGreaterThanOrEqual(75);
    expect(s).toBeLessThanOrEqual(97);
  });
  it('endurance: 85 steps/45s scores in the 80s', () => {
    const s = normalizeEndurance(85, 45, 1);
    expect(s).toBeGreaterThanOrEqual(75);
    expect(s).toBeLessThanOrEqual(97);
  });
  it('balance: 200ms error scores in the 80s', () => {
    const s = normalizeBalance(200, 94);
    expect(s).toBeGreaterThanOrEqual(75);
    expect(s).toBeLessThanOrEqual(97);
  });
  it('calculateScore routes the new ids', () => {
    expect(calculateScore('power-pulse', { reps: 65, durationSec: 30 })).toBe(normalizePower(65, 30));
    expect(calculateScore('endurance-quest', { steps: 85, durationSec: 45, errors: 1 })).toBe(normalizeEndurance(85, 45, 1));
    expect(calculateScore('balance-master', { avgErrorMs: 200, accuracy: 94 })).toBe(normalizeBalance(200, 94));
  });
});

describe('adaptive difficulty', () => {
  const mk = (scores: number[]) => scores.map((score, i) => ({
    id: `a${i}`, childId: 'c', challengeId: 'reaction-rush', score, raw: {},
    improvement: 0, isPersonalBest: false, xpEarned: 10, createdAt: new Date().toISOString(),
  }));
  it('excellent + improving goes up', () => {
    expect(evaluateDifficulty(mk([86, 90, 94]), 'reaction-rush')).toBe('up');
  });
  it('average holds steady', () => {
    expect(evaluateDifficulty(mk([70, 72, 71]), 'reaction-rush')).toBe('same');
  });
  it('weak or declining eases off', () => {
    expect(evaluateDifficulty(mk([48, 45, 44]), 'reaction-rush')).toBe('down');
    expect(evaluateDifficulty(mk([80, 70, 60]), 'reaction-rush')).toBe('down');
  });
});

describe('age classification', () => {
  it('under-16 is minor, 16+ is not', () => {
    expect(isMinor(10)).toBe(true);
    expect(isMinor(15)).toBe(true);
    expect(isMinor(16)).toBe(false);
    expect(isMinor(28)).toBe(false);
  });
  it('age groups bucket correctly', () => {
    expect(ageGroup(6)).toBe('under8');
    expect(ageGroup(10)).toBe('8-12');
    expect(ageGroup(14)).toBe('13-15');
    expect(ageGroup(17)).toBe('16-18');
    expect(ageGroup(28)).toBe('18plus');
  });
  it('ageFromDob computes whole years', () => {
    const ten = new Date();
    ten.setFullYear(ten.getFullYear() - 10);
    expect(ageFromDob(ten.toISOString().slice(0, 10), 0)).toBe(10);
  });
});
