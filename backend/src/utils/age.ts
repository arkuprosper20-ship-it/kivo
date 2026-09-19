/** Age utilities: DOB-driven classification for the age-based account system. */

export function ageFromDob(dob: string | undefined, fallbackAge = 0): number {
  if (!dob) return fallbackAge;
  const d = new Date(dob + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return fallbackAge;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return Math.max(0, age);
}

export type AgeGroup = 'under8' | '8-12' | '13-15' | '16-18' | '18plus';

export function ageGroup(age: number): AgeGroup {
  if (age < 8) return 'under8';
  if (age <= 12) return '8-12';
  if (age <= 15) return '13-15';
  if (age <= 18) return '16-18';
  return '18plus';
}

/** Under-16 profiles are parent-managed; 16+ are independent. */
export const isMinor = (age: number) => age < 16;

/** Intensity scaling factor by age group (workout minutes / difficulty). */
export function intensityFor(age: number): number {
  switch (ageGroup(age)) {
    case 'under8': return 0.6;
    case '8-12': return 0.8;
    case '13-15': return 1;
    case '16-18': return 1.1;
    case '18plus': return 1.2;
  }
}
