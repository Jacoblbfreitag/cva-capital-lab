/**
 * SA-CCR exposure value (EAD) for netting sets of vanilla interest rate swaps.
 * CRR3 Art. 274–280a. A TypeScript port of src/cvacap/sa_ccr.py in the thesis repo.
 *
 *   EAD = α · (RC + PFE),   PFE = multiplier · AddOn,   AddOn = SF · EffNot
 *
 * Money in EUR millions, time in years. One currency, so one hedging set.
 */

export const ALPHA = 1.4; //            Art. 274(2)
export const R_SUPERVISORY = 0.05; //   Art. 279b(1)(a): supervisory discount rate
export const SF_IR = 0.005; //          Art. 280a(2): interest rate supervisory factor, 0.5 %
export const FLOOR_M = 0.05; //         Art. 278(3)
const ONE_BUSINESS_YEAR = 250; //       business-day convention (a modelling choice in the thesis)
const TEN_DAYS = 10 / ONE_BUSINESS_YEAR;

export interface Swap {
  notional: number;
  maturity: number;
  start?: number;
  receiveFixed: boolean;
}

/** Art. 279a(1)(c): +1 for a payer swap (long the rate), −1 for a receiver swap. */
export const supervisoryDelta = (receiveFixed: boolean) => (receiveFixed ? -1 : 1);

/** Art. 279b(1)(a): SD = (e^{−R·S} − e^{−R·E}) / R, floored at ten business days. */
export function supervisoryDuration(start: number, end: number): number {
  const sd = (Math.exp(-R_SUPERVISORY * start) - Math.exp(-R_SUPERVISORY * end)) / R_SUPERVISORY;
  return Math.max(sd, TEN_DAYS);
}

/** Art. 279c(1)(a): unmargined MF = √(min(M, 1)/1). */
export const maturityFactorUnmargined = (m: number) => Math.sqrt(Math.min(Math.max(m, TEN_DAYS), 1));

/** Art. 279c(1)(b): margined MF = 1.5 · √(MPoR / 1 year). Default MPoR is 10 business days (Art. 285(2)(b)). */
export const maturityFactorMargined = (mporDays = 10) => 1.5 * Math.sqrt(mporDays / ONE_BUSINESS_YEAR);

/** Art. 280a(3) Table 2: bucket 1 (≤1y), 2 (1–5y), 3 (>5y). */
export const maturityBucket = (end: number) => (end <= 1 ? 1 : end <= 5 ? 2 : 3);

/** Art. 280a(3): EffNot = √(D1² + D2² + D3² + 1.4·D1·D2 + 1.4·D2·D3 + 0.6·D1·D3). */
export function effectiveNotional(d1: number, d2: number, d3: number): number {
  return Math.sqrt(d1 * d1 + d2 * d2 + d3 * d3 + 1.4 * d1 * d2 + 1.4 * d2 * d3 + 0.6 * d1 * d3);
}

export interface SaCcrBreakdown {
  rows: { swap: Swap; delta: number; sd: number; adjNotional: number; mf: number; riskPosition: number; bucket: number }[];
  buckets: [number, number, number];
  effNotional: number;
  addOn: number;
  rc: number;
  multiplier: number;
  pfe: number;
  ead: number;
}

/** Art. 278(3): multiplier = min(1, Floor + (1 − Floor)·exp(z / (2(1 − Floor)·AddOn))) when z < 0. */
export function multiplier(z: number, addOn: number): number {
  if (z >= 0) return 1;
  if (addOn <= 0) return FLOOR_M;
  return Math.min(1, FLOOR_M + (1 - FLOOR_M) * Math.exp(z / (2 * (1 - FLOOR_M) * addOn)));
}

/** Everything SA-CCR computes for one netting set, step by step. `cmv` is the current market value. */
export function saCcr(trades: Swap[], opts: { margined?: boolean; mporDays?: number; cmv?: number } = {}): SaCcrBreakdown {
  const cmv = opts.cmv ?? 0;
  const mfMargined = opts.margined ? maturityFactorMargined(opts.mporDays ?? 10) : null;
  const buckets: [number, number, number] = [0, 0, 0];
  const rows = trades.map((swap) => {
    const delta = supervisoryDelta(swap.receiveFixed);
    const sd = supervisoryDuration(swap.start ?? 0, swap.maturity);
    const adjNotional = swap.notional * sd;
    const mf = mfMargined ?? maturityFactorUnmargined(swap.maturity);
    const riskPosition = delta * adjNotional * mf;
    const bucket = maturityBucket(swap.maturity);
    buckets[bucket - 1] += riskPosition;
    return { swap, delta, sd, adjNotional, mf, riskPosition, bucket };
  });
  const effNotional = effectiveNotional(...buckets);
  const addOn = SF_IR * effNotional;
  const rc = Math.max(cmv, 0); // Art. 275(1), no collateral
  const mult = multiplier(cmv, addOn);
  const pfe = mult * addOn;
  const ead = ALPHA * (rc + pfe);
  const out = { rows, buckets, effNotional, addOn, rc, multiplier: mult, pfe, ead };
  // Art. 274(3): a margined set never exceeds the same set without margin.
  if (opts.margined) {
    const unmargined = saCcr(trades, { cmv });
    if (unmargined.ead < ead) return { ...out, ead: unmargined.ead };
  }
  return out;
}

export const ead = (trades: Swap[], opts?: { margined?: boolean; mporDays?: number; cmv?: number }) => saCcr(trades, opts).ead;
