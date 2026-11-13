/**
 * BA-CVA, the basic approach for CVA risk. CRR3 Art. 384, hedges per Art. 386.
 * A TypeScript port of src/cvacap/ba_cva.py in the thesis repo.
 *
 *   SCVA_c       = (1/α) · RW_c · Σ_NS M_NS · EAD_NS · DF_NS                     stand-alone charge
 *   K_reduced    = DS · √( (ρ Σ SCVA_c)² + (1 − ρ²) Σ SCVA_c² )                   no hedges, Art. 384(3)
 *   K_hedged     = √( (ρ Σ (SCVA_c − SNH_c) − IH)² + (1 − ρ²) Σ (SCVA_c − SNH_c)² + Σ HMA_c )
 *   K_total      = β · K_reduced + DS · (1 − β) · K_hedged                          full version, Art. 384(2)
 *
 * Money in EUR millions (own funds requirement, not RWA).
 */
import type { CounterpartySpec, Sector } from '../data/portfolio';
import { saCcr } from './saCcr';

export const ALPHA = 1.4; //   Art. 384(2)
export const RHO = 0.5; //     Art. 384(2): correlation of counterparty spreads with the systematic factor
export const DS_CVA = 0.65; // Art. 384(2): discount scalar
export const BETA = 0.25; //   Art. 384(2): the share of the unhedged charge that no hedge removes

/** Art. 384(2) Table 1: risk weight by sector, [CQS 1–3, CQS 4–6 and unrated]. */
export const RISK_WEIGHTS: Record<Sector, [number, number]> = {
  sovereign: [0.005, 0.02],
  regional: [0.01, 0.04],
  financial: [0.05, 0.12],
  materials: [0.03, 0.07],
  consumer: [0.03, 0.085],
  technology: [0.02, 0.055],
  health: [0.015, 0.05],
  other: [0.05, 0.12],
};

export function riskWeight(sector: Sector, cqs: number | null): number {
  return cqs !== null && cqs <= 3 ? RISK_WEIGHTS[sector][0] : RISK_WEIGHTS[sector][1];
}

/** Art. 384(2): DF = (1 − e^{−0.05·M}) / (0.05·M), the supervisory discount factor. */
export function discountFactor(m: number): number {
  if (m <= 0) return 1;
  return (1 - Math.exp(-0.05 * m)) / (0.05 * m);
}

/**
 * Art. 384(2) → Art. 162(2): notional-weighted maturity of the netting set, floored at 1 year
 * (10 days if collateralised), capped at the longest trade in the set.
 */
export function effectiveMaturity(notionals: number[], maturities: number[], collateralised = false): number {
  const w = notionals.reduce((s, n, i) => s + n * maturities[i], 0) / notionals.reduce((s, n) => s + n, 0);
  const floor = collateralised ? 10 / 365.25 : 1;
  return Math.min(Math.max(w, floor), Math.max(...maturities));
}

export interface NettingSetInput {
  ead: number;
  maturity: number;
}

/** Art. 384(2): SCVA_c. */
export function scvaC(rw: number, sets: NettingSetInput[]): number {
  return (rw / ALPHA) * sets.reduce((s, ns) => s + ns.maturity * ns.ead * discountFactor(ns.maturity), 0);
}

/** The Art. 384(2) inputs of one counterparty of the portfolio: EAD from SA-CCR, M from Art. 162. */
export function nettingSetInputs(c: CounterpartySpec): NettingSetInput[] {
  return c.nettingSets.map((ns) => ({
    ead: saCcr(ns.trades, { margined: ns.margined }).ead,
    maturity: effectiveMaturity(
      ns.trades.map((t) => t.notional),
      ns.trades.map((t) => t.maturity),
      ns.margined,
    ),
  }));
}

export const scva = (c: CounterpartySpec) => scvaC(riskWeight(c.sector, c.cqs), nettingSetInputs(c));

/** Art. 384(3): reduced version. DS is applied inside, which makes the full version with no hedges equal to it. */
export function kReduced(scvas: number[]): number {
  const sum = scvas.reduce((a, b) => a + b, 0);
  const sq = scvas.reduce((a, b) => a + b * b, 0);
  return DS_CVA * Math.sqrt((RHO * sum) ** 2 + (1 - RHO ** 2) * sq);
}

/** Art. 384(2) Table 2: correlation between the counterparty and the hedge's reference name. */
export const R_HC = { direct: 1, legallyRelated: 0.8, sameSectorRegion: 0.5 } as const;
export type HedgeRelation = keyof typeof R_HC;

export interface SingleNameHedge {
  relation: HedgeRelation;
  rwH: number;
  maturity: number;
  notional: number;
}

/** Art. 384(2): SNH_c = Σ_h r_hc · RW_h · M_h · B_h · DF_h, the recognised part of the hedges. */
export function snhC(hedges: SingleNameHedge[]): number {
  return hedges.reduce((s, h) => s + R_HC[h.relation] * h.rwH * h.maturity * h.notional * discountFactor(h.maturity), 0);
}

/** Art. 384(2): HMA_c = Σ_h (1 − r_hc²)(RW_h · M_h · B_h · DF_h)², the penalty for an imperfect hedge. */
export function hmaC(hedges: SingleNameHedge[]): number {
  return hedges.reduce((s, h) => s + (1 - R_HC[h.relation] ** 2) * (h.rwH * h.maturity * h.notional * discountFactor(h.maturity)) ** 2, 0);
}

/** Art. 384(2): K_hedged (no DS inside). Lists are aligned by counterparty. */
export function kHedged(scvas: number[], snhs: number[], hmas: number[], ih = 0): number {
  const net = scvas.map((s, i) => s - snhs[i]);
  const sum = net.reduce((a, b) => a + b, 0);
  const sq = net.reduce((a, b) => a + b * b, 0);
  const hma = hmas.reduce((a, b) => a + b, 0);
  return Math.sqrt((RHO * sum - ih) ** 2 + (1 - RHO ** 2) * sq + hma);
}

/** Art. 384(2): K_total = β · K_reduced + DS · (1 − β) · K_hedged. */
export function kTotal(scvas: number[], snhs: number[], hmas: number[], ih = 0): number {
  return BETA * kReduced(scvas) + DS_CVA * (1 - BETA) * kHedged(scvas, snhs, hmas, ih);
}

/**
 * The thesis's closed form (Proposition, Chapter 3): with direct hedges, no index hedge and the same
 * recognition ratio r = SNH_c / SCVA_c for every counterparty,
 *   K_total = K_reduced · (β + (1 − β) · |1 − r|).
 */
export const closedForm = (kRed: number, r: number) => kRed * (BETA + (1 - BETA) * Math.abs(1 - r));

/** CDS notional that gives recognition ratio r on a counterparty with stand-alone charge SCVA (direct hedge). */
export function notionalForRecognition(scvaValue: number, r: number, rwH: number, maturity: number): number {
  return (r * scvaValue) / (rwH * maturity * discountFactor(maturity));
}
