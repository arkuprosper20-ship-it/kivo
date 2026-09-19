/** Frontend age helpers (mirror backend/src/utils/age.ts). */

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

export const ageOfProfile = (p: { age: number; dob?: string }): number =>
  p.dob ? ageFromDob(p.dob, p.age) : p.age;

export const isMinorAge = (age: number): boolean => age < 16;

/** Adult (16+) profiles get performance tone; under-16 get playful tone. */
export const isAdultProfile = (p: { age: number; dob?: string }): boolean => ageOfProfile(p) >= 16;
