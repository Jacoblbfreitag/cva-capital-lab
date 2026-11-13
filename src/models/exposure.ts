/**
 * Exposure of one interest rate swap under a one-factor Hull–White model, and the regulatory CVA of
 * CRR3 Art. 383a. A small in-browser version of src/cvacap/hull_white.py and reg_cva.py: flat initial
 * curve, a few thousand paths, and the floating leg valued as if it reset on every grid date.
 *
 *   dr = (θ(t) − a·r) dt + σ dW              short rate, fitted to a flat curve at rate f
 *   EE(t)  = E[max(V(t), 0)]                  expected exposure
 *   CVA    = LGD · Σ_k (S_{k−1} − S_k) · (dEE_{k−1} + dEE_k) / 2,   S(t) = exp(−s·t / LGD)
 */
import { makeGaussian } from './math/rng';

export interface HullWhiteParams {
  /** Flat continuously compounded zero rate. */
  f: number;
  /** Mean reversion speed a. */
  a: number;
  /** Short-rate volatility σ (0.008 = 80 bp a year). */
  sigma: number;
}

/** B(t, T) = (1 − e^{−a(T−t)}) / a. */
const B = (a: number, tau: number) => (1 - Math.exp(-a * tau)) / a;

/** V(t,T) of the G1++ bond formula: variance of ∫ x ds between t and T. */
function V(p: HullWhiteParams, tau: number): number {
  const { a, sigma } = p;
  return ((sigma * sigma) / (a * a)) * (tau + (2 / a) * Math.exp(-a * tau) - (1 / (2 * a)) * Math.exp(-2 * a * tau) - 3 / (2 * a));
}

/** Zero-coupon bond P(t, T) given the factor x_t = r_t − φ(t) (flat curve). */
export function bondPrice(p: HullWhiteParams, t: number, T: number, x: number): number {
  const pm = (s: number) => Math.exp(-p.f * s);
  const A = 0.5 * (V(p, T - t) - V(p, T) + V(p, t));
  return (pm(T) / pm(t)) * Math.exp(A - B(p.a, T - t) * x);
}

export interface SwapSpec {
  notional: number;
  maturity: number;
  receiveFixed: boolean;
}

/** Par fixed rate (annual coupons) on the flat curve. */
export function parRate(f: number, maturity: number): number {
  let annuity = 0;
  for (let i = 1; i <= maturity; i++) annuity += Math.exp(-f * i);
  return (1 - Math.exp(-f * maturity)) / annuity;
}

/** Value of the swap at time t on factor value x, to the institution. */
export function swapValue(p: HullWhiteParams, s: SwapSpec, K: number, t: number, x: number): number {
  if (t >= s.maturity) return 0;
  let fixed = 0;
  for (let i = Math.floor(t) + 1; i <= s.maturity; i++) fixed += K * bondPrice(p, t, i, x);
  const floating = 1 - bondPrice(p, t, s.maturity, x);
  const v = s.notional * (fixed - floating);
  return s.receiveFixed ? v : -v;
}

export interface ExposureProfile {
  t: number[];
  ee: number[];
  pfe: number[];
  /** Discounted EE, the input of the CVA formula. */
  dee: number[];
}

/** Simulate the factor exactly on a quarterly grid and collect EE, PFE(95 %) and discounted EE. */
export function simulateExposure(p: HullWhiteParams, s: SwapSpec, nPaths = 2000, seed = 20260831, dt = 0.25): ExposureProfile {
  const steps = Math.round(s.maturity / dt);
  const t = Array.from({ length: steps + 1 }, (_, i) => i * dt);
  const K = parRate(p.f, s.maturity);
  const g = makeGaussian(seed);
  const decay = Math.exp(-p.a * dt);
  const sd = p.sigma * Math.sqrt((1 - Math.exp(-2 * p.a * dt)) / (2 * p.a));
  const values: number[][] = t.map(() => new Array(nPaths));
  const discExp = t.map(() => 0);
  for (let j = 0; j < nPaths; j++) {
    let x = 0;
    let intR = 0; // ∫ r ds along the path, trapezoid
    let rPrev = p.f;
    for (let i = 0; i <= steps; i++) {
      if (i > 0) {
        x = x * decay + sd * g();
        const phi = p.f + ((p.sigma * p.sigma) / (2 * p.a * p.a)) * (1 - Math.exp(-p.a * t[i])) ** 2;
        const r = x + phi;
        intR += 0.5 * (rPrev + r) * dt;
        rPrev = r;
      }
      const v = swapValue(p, s, K, t[i], x);
      values[i][j] = v;
      discExp[i] += Math.exp(-intR) * Math.max(v, 0);
    }
  }
  const ee = values.map((row) => row.reduce((a, v) => a + Math.max(v, 0), 0) / nPaths);
  const pfe = values.map((row) => {
    const sorted = row.slice().sort((a, b) => a - b);
    return Math.max(sorted[Math.floor(0.95 * (nPaths - 1))], 0);
  });
  return { t, ee, pfe, dee: discExp.map((d) => d / nPaths) };
}

/** Art. 383a(1): CVA = LGD · Σ (S_{k−1} − S_k)(dEE_{k−1} + dEE_k)/2 with a flat spread s. */
export function regulatoryCva(t: number[], dee: number[], spread: number, lgd = 0.4): number {
  const S = (u: number) => Math.exp((-spread * u) / lgd);
  let cva = 0;
  for (let k = 1; k < t.length; k++) cva += (S(t[k - 1]) - S(t[k])) * 0.5 * (dee[k - 1] + dee[k]);
  return lgd * cva;
}
