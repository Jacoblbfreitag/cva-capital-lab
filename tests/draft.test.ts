/**
 * The content added for the thesis draft of 20 Nov 2026 must agree with the thesis: the rational EU cell and its
 * gap macros (numbers.tex), the equal-notional comparison of experiment E2b, the Pillar 3 reconciliation of
 * Appendix F, and the references of the defence question bank.
 */
import { describe, expect, it } from 'vitest';
import { choices, defenceQuestions, flashcards, openItems } from '../src/data/defence';
import { banks, cva2Rows, fxRates, readings } from '../src/data/pillar3';
import { equalNotionalGaps, headline, rationalCell } from '../src/data/results';
import { lessons } from '../src/lessons';

describe('rational EU cell (experiment F endpoints) against numbers.tex', () => {
  const m = rationalCell('matched', 1);
  const f = rationalCell('five_year', 1);
  it('matched tenor, full hedge: BA 1.78, SA 3.13, gaps 2.45 → 1.35, 45.01 % removed', () => {
    expect(m.eu.ba).toBeCloseTo(headline.euRatBAfullMatched, 2);
    expect(m.eu.sa).toBeCloseTo(headline.euRatSAfullMatched, 2);
    expect(m.basel.gap).toBeCloseTo(headline.baselGapFullMatched, 2);
    expect(m.eu.gap).toBeCloseTo(headline.euRatGapFullMatched, 2);
    expect(100 * (1 - m.eu.gap / m.basel.gap)).toBeCloseTo(headline.euRatGapCutPctMatched, 1);
  });
  it('five-year tenor, full hedge: SA 7.35, gaps 6.80 → 5.57, 18.16 % removed', () => {
    expect(f.eu.sa).toBeCloseTo(headline.euRatSAfull5y, 2);
    expect(f.basel.gap).toBeCloseTo(headline.baselGapFull5y, 2);
    expect(f.eu.gap).toBeCloseTo(headline.euRatGapFull5y, 2);
    expect(100 * (1 - f.eu.gap / f.basel.gap)).toBeCloseTo(headline.euRatGapCutPct5y, 1);
  });
  it('unhedged gaps 2.07 → 1.48', () => {
    const u = rationalCell('matched', 0);
    expect(u.basel.gap).toBeCloseTo(headline.baselGapUnhedged, 2);
    expect(u.eu.gap).toBeCloseTo(headline.euGapUnhedged, 2);
  });
  it('the rational BA-CVA is the β floor on the names in the calculation: 0.25 × 7.13', () => {
    expect(m.eu.ba).toBeCloseTo(0.25 * 7.132605, 4);
    expect(m.eu.gap).toBeGreaterThan(0); // narrowed, not reversed
  });
});

describe('equal-notional comparison (E2b, exposure basis, Basel scope)', () => {
  const g = equalNotionalGaps();
  it('covers 3 notionals × 5 tenors, and BA-CVA is cheaper in every cell', () => {
    expect(g).toHaveLength(15);
    expect(g.every((x) => x.gap > 0)).toBe(true);
  });
  it('the closest cell is 50 EUR m of 7-year CDS, about 0.09 EUR m apart', () => {
    const c = g.reduce((a, b) => (b.gap < a.gap ? b : a));
    expect([c.notional, c.tenor]).toEqual([50, 7]);
    expect(c.gap).toBeCloseTo(0.09, 2);
  });
});

describe('Pillar 3 (Ch. 7, Appendix F)', () => {
  it('EUR conversions match Table 7.1 to 0.1', () => {
    for (const b of banks) {
      const words = b.reported.split(' ');
      const [amount, unit] = [Number(b.reported.replace(/[^\d.]/g, '')), words[words.length - 2]];
      const eur = unit === 'EUR' ? amount : amount / fxRates[unit as 'DKK' | 'SEK' | 'NOK'];
      expect(Math.abs(eur - b.eurM), b.bank).toBeLessThan(0.06);
    }
  });
  it('the reading each bank is assigned reproduces its printed EU CVA2 total; BNP Paribas fits none', () => {
    for (const r of cva2Rows) {
      const fits = (['A', 'B', 'C'] as const).filter((k) => Math.abs(readings[k](r.u, r.h) - r.total) < 1);
      expect(fits, r.bank).toEqual(r.reading === 'none' ? [] : [r.reading]);
    }
  });
  it('counts: four mixers, three full BA-CVA, four reduced BA-CVA, one unclassified', () => {
    const n = (a: string) => banks.filter((b) => b.approach === a).length;
    expect([n('mixed'), n('full-ba'), n('reduced-ba'), n('unclear')]).toEqual([4, 3, 4, 1]);
  });
});

describe('defence question bank', () => {
  const ids = new Set(lessons.map((l) => l.id));
  it('every question belongs to a lesson or to General, and every lesson with a Defence corner has questions', () => {
    expect(defenceQuestions.filter((q) => q.topic !== 'general' && !ids.has(q.topic))).toEqual([]);
    for (const id of ['thesis', 'cva', 'sa-ccr', 'ba-cva', 'sa-cva', 'exemptions', 'hedging', 'results', 'pillar3']) {
      expect(defenceQuestions.some((q) => q.topic === id), id).toBe(true);
    }
  });
  it('has no duplicate questions and no empty entries', () => {
    expect(new Set(defenceQuestions.map((q) => q.q)).size).toBe(defenceQuestions.length);
    expect(choices.every((c) => c.why && c.moves && c.where)).toBe(true);
    expect(openItems.length).toBeGreaterThan(0);
    expect(flashcards.length).toBeGreaterThan(10);
  });
});
