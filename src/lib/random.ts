// Deterministic randomness so seed data and trees look the same every time

export type Random = () => number;

export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

export function hashString(text: string): number {
  let hash = 0;
  for (const char of text) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return hash >>> 0;
}

export function pick<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

export function between(min: number, max: number, random: Random): number {
  return min + random() * (max - min);
}
