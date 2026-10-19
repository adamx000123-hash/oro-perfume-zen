import { describe, expect, it } from 'vitest';
import { parseFragranceProfile, validateFragranceProfile, validPercentage } from '@/lib/catalog';

describe('Optional perfume profiles', () => {
  it('accepts 0 and 100 inclusively and rejects out-of-range percentages', () => {
    expect(validPercentage(0)).toBe(true); expect(validPercentage(100)).toBe(true);
    for (const percentage of [-1, 101, NaN]) expect(() => validateFragranceProfile({ mainAccords: [{ name: 'Citrus', color: 'citrus', percentage }], whenToWear: {} })).toThrow();
  });
  it('enforces the range for all six wearing options', () => {
    for (const option of ['Winter', 'Spring', 'Summer', 'Fall', 'Day', 'Night']) {
      expect(() => validateFragranceProfile({ mainAccords: [], whenToWear: { [option]: -1 } })).toThrow();
      expect(() => validateFragranceProfile({ mainAccords: [], whenToWear: { [option]: 101 } })).toThrow();
    }
  });
  it('preserves blank values separately from visible zero values', () => {
    expect(parseFragranceProfile([{ name: 'Fresh', color: 'fresh', percentage: null }], { Day: 0, Night: null })).toEqual({ mainAccords: [{ name: 'Fresh', color: 'fresh', percentage: null }], whenToWear: { Day: 0, Night: null } });
    expect(parseFragranceProfile(undefined, undefined)).toEqual({ mainAccords: [], whenToWear: {} });
  });
  it('retains accord order and supports deletion without affecting other values', () => {
    const accords = [{ name: 'Woody', color: 'woody', percentage: 90 }, { name: 'Fresh', color: 'fresh', percentage: 50 }];
    expect(parseFragranceProfile(accords, {}).mainAccords.map(a => a.name)).toEqual(['Woody', 'Fresh']);
    expect(parseFragranceProfile(accords.slice(1), {}).mainAccords).toEqual([accords[1]]);
  });
});