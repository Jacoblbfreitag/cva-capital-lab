/**
 * The Pillar 3 evidence of thesis Chapter 7 and Appendix F (cva-capital-crr3, draft of 20 Nov 2026), as at
 * 31 December 2025. Copied from Table 7.1 and Table F.1; the thesis verified every row against the banks'
 * documents (thesis/pillar3_sources.md, all VERIFIED 20.11.2026). These are the banks' own figures, not model output.
 */
export type ApproachDisclosed = 'mixed' | 'full-ba' | 'reduced-ba' | 'unclear';

export interface Pillar3Bank {
  bank: string;
  nordic: boolean;
  approach: ApproachDisclosed;
  approachText: string;
  reported: string;
  eurM: number;
  /** For combining banks: amount under SA-CVA and under BA-CVA, in the reporting currency. */
  split?: { sa: number; ba: number; unit: string };
  hedging?: string;
  source: string;
}

export const approachLabels: Record<ApproachDisclosed, string> = {
  mixed: 'SA-CVA + BA-CVA (mixed)',
  'full-ba': 'Full BA-CVA',
  'reduced-ba': 'Reduced BA-CVA',
  unclear: 'Not stated in CRR3 terms',
};

export const fxRates = { DKK: 7.4689, SEK: 10.8215, NOK: 11.843 };

export const banks: Pillar3Bank[] = [
  { bank: 'Danske Bank', nordic: true, approach: 'mixed', approachText: 'SA + full BA', reported: '2 158 DKK m', eurM: 288.9, split: { sa: 1715, ba: 443, unit: 'DKK m' }, hedging: 'Recognised notionals mainly index CDS; EU CVA3 note: “applies a multiplier of 1.1”.', source: 'EU OV1 rows 10, 10a, 10b; approach p. 28' },
  { bank: 'Nordea', nordic: true, approach: 'mixed', approachText: 'SA + BA, split by exposure method', reported: '455 EUR m', eurM: 455, split: { sa: 310, ba: 144, unit: 'EUR m' }, hedging: 'Single-name CDS 63 and index CDS 45 EUR m (p. 124).', source: 'Table 4, EU OV1, p. 76; approach pp. 42–43' },
  { bank: 'Nykredit', nordic: true, approach: 'reduced-ba', approachText: 'Reduced BA', reported: '1 002 DKK m', eurM: 134.2, hedging: '“Nykredit does not hedge CVA risk.”', source: 'Table 3.4, p. 16 (not an EBA template)' },
  { bank: 'Jyske Bank', nordic: true, approach: 'reduced-ba', approachText: 'Reduced BA', reported: '2 584.6 DKK m', eurM: 346.0, hedging: 'Hedging not considered under the reduced approach; requirement covers financial counterparties only, plus a “capital addition” for non-financials.', source: 'EU OV1 rows 10 and EU 10b; text p. 20' },
  { bank: 'Sydbank', nordic: true, approach: 'unclear', approachText: 'Pre-CRR3 layout', reported: '400.2 DKK m', eurM: 53.6, source: 'EU OV1 row EU 8b' },
  { bank: 'SEB', nordic: true, approach: 'full-ba', approachText: 'Full BA', reported: '9 104 SEK m', eurM: 841.3, hedging: 'Recognised notionals mainly index CDS.', source: 'Table 44, EU OV1, p. 67' },
  { bank: 'Swedbank', nordic: true, approach: 'full-ba', approachText: 'Full BA', reported: '2 853 SEK m', eurM: 263.6, hedging: 'Mainly index CDS; states it has no permission to use SA-CVA (p. 85).', source: 'EU OV1, p. 6' },
  { bank: 'Handelsbanken', nordic: true, approach: 'reduced-ba', approachText: 'Reduced BA', reported: '2 176 SEK m', eurM: 201.1, hedging: '“does not currently engage in active hedging of CVA risk”.', source: 'EU OV1, p. 5 (rows 9–12)' },
  { bank: 'DNB', nordic: true, approach: 'reduced-ba', approachText: 'Reduced BA', reported: '3 476 NOK m', eurM: 293.5, hedging: 'EU CVA2 and CVA3 empty; nothing else on hedging. CRR3 from 1 April 2025.', source: 'Report p. 74; OV1 rows 10a, 10b' },
  { bank: 'Deutsche Bank', nordic: false, approach: 'full-ba', approachText: 'Full BA', reported: '2 591 EUR m', eurM: 2591, hedging: 'Mainly index CDS. Attributes a 69 EUR m rise to “the introduction of the new Basic Approach under CRR3”.', source: 'EU OV1, p. 51' },
  { bank: 'BNP Paribas', nordic: false, approach: 'mixed', approachText: 'SA + reduced BA + full BA', reported: '3 902 EUR m', eurM: 3902, split: { sa: 1674, ba: 2228, unit: 'EUR m' }, hedging: 'Mainly index CDS; SA-CVA only where permission is granted.', source: 'Table 17, EU OV1, p. 393' },
  { bank: 'ING', nordic: false, approach: 'mixed', approachText: 'SA + reduced BA', reported: '2 720 EUR m', eurM: 2720, split: { sa: 2184, ba: 535, unit: 'EUR m' }, hedging: 'EU CVA3: “other derivatives classified as CVA risk hedges” 52 615 of 59 425 EUR m; separate books for non-eligible hedges, capitalised under market risk.', source: 'EU OV1, p. 6' },
];

/** What each prediction can and cannot learn from the disclosures (Ch. 7 §7.3). */
export const evidenceByPrediction: { p: string; seen: string; missing: string; verdict: string }[] = [
  { p: 'P1 · corner hedging under BA-CVA', seen: 'Four banks use reduced BA-CVA; Nykredit and Handelsbanken state they do not hedge. Six full BA-CVA banks report hedge notionals, five mainly index CDS.', missing: 'Recognition ratios, the cost of hedging and the capital saving.', verdict: 'The two non-hedgers sit at P1’s first corner: consistent, not a test.' },
  { p: 'P2 · a floor under SA-CVA', seen: 'SA-CVA only at four banks, never alone; Swedbank lacks permission; Danske applies m_CVA = 1.1; ING shows non-CDS “other derivatives” as CVA hedges.', missing: 'The capital under the approach not chosen, the fixed cost F, what the other derivatives hedge.', verdict: 'Neither confirms nor refutes.' },
  { p: 'P3 · excluded counterparties', seen: 'No bank cites Art. 382(4) or discloses the Art. 382(4b) amount; four describe a narrower scope. ING capitalises non-eligible hedges under market risk.', missing: 'The excluded counterparties, their hedges and any opt-in.', verdict: 'Title IV capital on an unrecognised hedge is shown at one bank, but not for a hedge of an excluded name.' },
  { p: 'P4 · combination', seen: 'Danske, Nordea, BNP Paribas and ING mix, splitting by exposure method (IMM vs SA-CCR) or permission coverage.', missing: 'Why they mix; the model splits per counterparty by capital.', verdict: 'Mixing occurs where the model finds no gain; the disclosures cannot say why.' },
];

/** The thesis's own reconciliation of EU CVA2 rows (Table F.1); U and H are the printed rows without and with hedges. */
export const cva2Rows: { bank: string; unit: string; u: number; h: number; total: number; reading: 'A' | 'B' | 'C' | 'none' }[] = [
  { bank: 'Danske Bank', unit: 'DKK m', u: 91, h: 42, total: 35, reading: 'A' },
  { bank: 'Deutsche Bank', unit: 'EUR m', u: 706, h: 189, total: 207, reading: 'A' },
  { bank: 'Nordea', unit: 'EUR m', u: 18, h: 14, total: 12, reading: 'B' },
  { bank: 'Swedbank', unit: 'SEK m', u: 336, h: 296, total: 228, reading: 'B' },
  { bank: 'SEB', unit: 'SEK m', u: 1129, h: 590, total: 725, reading: 'C' },
  { bank: 'BNP Paribas', unit: 'EUR m', u: 388, h: 185, total: 157, reading: 'none' },
];

const BETA = 0.25;
const DS = 0.65;
/** The three readings of how the discount scalar enters the printed EU CVA2 rows (Appendix F). */
export const readings = {
  A: (u: number, h: number) => DS * (BETA * u + (1 - BETA) * h), // both rows printed before the scalar
  B: (u: number, h: number) => BETA * u + DS * (1 - BETA) * h, // literal Art. 384(2)/(3): scalar already inside U
  C: (u: number, h: number) => BETA * u + (1 - BETA) * h, // both rows after the scalar, or no scalar
};
