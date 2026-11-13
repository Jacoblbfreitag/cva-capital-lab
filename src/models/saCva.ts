/**
 * SA-CVA, the standardised approach: aggregation of CVA sensitivities into capital.
 * CRR3 Art. 383b(5)–(8) with the tables of Art. 383k–383m (interest rate) and 383p–383r (counterparty
 * credit spread). A TypeScript port of src/cvacap/sa_cva.py in the thesis repo.
 *
 *   WS_k  = RW_k · s_k^CVA − RW_k · s_k^hedge                         weighted sensitivity, Art. 383b(5)–(6)
 *   K_b   = √( WSᵀ ρ WS + R · Σ (WS_k^hedge)² )                       bucket capital, Art. 383b(7)
 *   S_b   = max(−K_b, min(Σ WS_k, K_b))
 *   K     = m_CVA · √( Σ K_b² + Σ_{b≠c} γ_bc S_b S_c )                risk class capital, Art. 383b(8)
 *   K_SA  = K_CCS + K_IR + K_vega                                      Art. 383(3)
 *
 * The sensitivities themselves need a Monte Carlo exposure model; the app uses the thesis's frozen ones.
 */
import type { CounterpartySpec, Sector } from '../data/portfolio';

export const R_DISALLOWANCE = 0.01; // Art. 383b(7): hedging disallowance
export const M_CVA = 1; //            Art. 383b(8)

export const CCS_VERTICES = [0.5, 1, 3, 5, 10]; // Art. 383e(1)
export const IR_VERTICES = [1, 2, 5, 10, 30]; //  Art. 383c(1)

type Matrix = number[][];
const quadForm = (v: number[], m: Matrix) => v.reduce((s, vi, i) => s + vi * v.reduce((t, vj, j) => t + m[i][j] * vj, 0), 0);

/** Art. 383b(7). */
export function bucketCapital(ws: number[], wsHedge: number[], rho: Matrix): number {
  const q = quadForm(ws, rho) + R_DISALLOWANCE * wsHedge.reduce((s, x) => s + x * x, 0);
  return Math.sqrt(Math.max(q, 0));
}

/** Art. 383b(8): S_b. */
export const sB = (ws: number[], kb: number) => Math.max(-kb, Math.min(ws.reduce((a, b) => a + b, 0), kb));

/** Art. 383b(8): K over buckets. */
export function riskClassCapital(kbs: number[], sbs: number[], gamma: Matrix): number {
  let q = kbs.reduce((s, k) => s + k * k, 0);
  for (let b = 0; b < kbs.length; b++) for (let c = 0; c < kbs.length; c++) if (b !== c) q += gamma[b][c] * sbs[b] * sbs[c];
  return M_CVA * Math.sqrt(Math.max(q, 0));
}

// ── Counterparty credit spread (CCS) class ──────────────────────────────────

/** Art. 383p(1) Table 1: risk weight per bucket (the same at every vertex). */
export const CCS_RISK_WEIGHTS: Record<number, number> = {
  1: 0.005, 2: 0.005, 3: 0.01, 4: 0.05, 5: 0.03, 6: 0.03, 7: 0.02, 8: 0.015, 9: 0.01, 11: 0.05, 12: 0.015,
  13: 0.02, 14: 0.04, 15: 0.12, 16: 0.07, 17: 0.085, 18: 0.055, 19: 0.05, 20: 0.12, 21: 0.05,
};

const HIGH: Record<Sector, number> = { sovereign: 2, regional: 3, financial: 4, materials: 5, consumer: 6, technology: 7, health: 8, other: 11 };
const LOW: Record<Sector, number> = { sovereign: 13, regional: 14, financial: 15, materials: 16, consumer: 17, technology: 18, health: 19, other: 20 };

/** Art. 383p(1) Table 1: bucket by sector and credit quality; EU central governments are bucket 1. */
export function ccsBucket(c: Pick<CounterpartySpec, 'sector' | 'cqs' | 'memberState'>): number {
  if (c.memberState) return 1;
  return c.cqs !== null && c.cqs <= 3 ? HIGH[c.sector] : LOW[c.sector];
}

/** Art. 383q(1): ρ = ρ_tenor · ρ_name (· ρ_quality, always 1 within a bucket here). */
export const ccsRho = (sameVertex: boolean, sameName: boolean) => (sameVertex ? 1 : 0.9) * (sameName ? 1 : 0.5);

/** Art. 383r Table 1: bucket groups and cross-group γ. */
const GROUPS: number[][] = [[1, 2, 3, 13, 14], [4, 15], [5, 16], [6, 17], [7, 18], [8, 19], [9, 10], [11, 20], [12, 21]];
const GAMMA: Matrix = [
  [1.0, 0.1, 0.2, 0.25, 0.2, 0.15, 0.1, 0.0, 0.45],
  [0.1, 1.0, 0.05, 0.15, 0.2, 0.05, 0.2, 0.0, 0.45],
  [0.2, 0.05, 1.0, 0.2, 0.25, 0.05, 0.05, 0.0, 0.45],
  [0.25, 0.15, 0.2, 1.0, 0.25, 0.05, 0.15, 0.0, 0.45],
  [0.2, 0.2, 0.25, 0.25, 1.0, 0.05, 0.2, 0.0, 0.45],
  [0.15, 0.05, 0.05, 0.05, 0.05, 1.0, 0.05, 0.0, 0.45],
  [0.1, 0.2, 0.05, 0.15, 0.2, 0.05, 1.0, 0.0, 0.45],
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
  [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.0, 1.0],
];
export const ccsGamma = (b: number, c: number) => GAMMA[GROUPS.findIndex((g) => g.includes(b))][GROUPS.findIndex((g) => g.includes(c))];

export interface CcsName {
  name: string;
  bucket: number;
  /** CVA sensitivity per Art. 383e(1) vertex (EUR m per unit spread shift). */
  sCva: number[];
  /** Hedge sensitivity per vertex, with the sign that offsets sCva (a perfect hedge has sHedge = −sCva). */
  sHedge?: number[];
}

/** Counterparty credit spread delta capital, with the per-bucket K_b. */
export function ccsCapital(names: CcsName[]): { k: number; byBucket: Record<number, number> } {
  const buckets = [...new Set(names.map((n) => n.bucket))].sort((a, b) => a - b);
  const kbs: number[] = [];
  const sbs: number[] = [];
  for (const b of buckets) {
    const fs = names.filter((n) => n.bucket === b);
    const rw = CCS_RISK_WEIGHTS[b];
    const ws: number[] = [];
    const wsH: number[] = [];
    const who: string[] = [];
    const vtx: number[] = [];
    for (const f of fs)
      f.sCva.forEach((s, v) => {
        const h = f.sHedge?.[v] ?? 0;
        ws.push(rw * (s + h));
        wsH.push(rw * h);
        who.push(f.name);
        vtx.push(v);
      });
    const rho = ws.map((_, i) => ws.map((__, j) => ccsRho(vtx[i] === vtx[j], who[i] === who[j])));
    const kb = bucketCapital(ws, wsH, rho);
    kbs.push(kb);
    sbs.push(sB(ws, kb));
  }
  const gamma = buckets.map((b) => buckets.map((c) => ccsGamma(b, c)));
  return { k: riskClassCapital(kbs, sbs, gamma), byBucket: Object.fromEntries(buckets.map((b, i) => [b, kbs[i]])) };
}

// ── Interest rate (IR) class: one bucket, EUR ──────────────────────────────

export const IR_RISK_WEIGHTS = [0.0111, 0.0093, 0.0074, 0.0074, 0.0074]; // Art. 383k(1) Table 1
export const IR_RHO: Matrix = [ //                                         Art. 383l(1) Table 1
  [1.0, 0.91, 0.72, 0.55, 0.31],
  [0.91, 1.0, 0.87, 0.72, 0.45],
  [0.72, 0.87, 1.0, 0.91, 0.68],
  [0.55, 0.72, 0.91, 1.0, 0.83],
  [0.31, 0.45, 0.68, 0.83, 1.0],
];

/** Interest rate delta capital from the aggregate CVA sensitivity per IR vertex (single currency). */
export function irCapital(sAggregate: number[]): number {
  const ws = sAggregate.map((s, i) => IR_RISK_WEIGHTS[i] * s);
  return bucketCapital(ws, ws.map(() => 0), IR_RHO); // one bucket: K = K_b
}

/** Interest rate vega capital: one net sensitivity, risk weight 100 % (Art. 383c(6), 383k(5)). */
export const vegaCapital = (sVega: number) => Math.abs(sVega);

export interface SaCvaResult {
  kCcs: number;
  kIr: number;
  kVega: number;
  total: number;
}

export const saCvaTotal = (kCcs: number, kIr: number, kVega: number): SaCvaResult => ({ kCcs, kIr, kVega, total: kCcs + kIr + kVega });
