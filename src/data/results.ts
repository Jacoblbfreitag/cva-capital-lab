/**
 * The thesis's frozen results (cva-capital-crr3, run 20261022T174025Z, v0.8 freeze), exported by
 * scripts/export_results.py. The headline numbers below are the \newcommand macros of
 * thesis/generated/numbers.tex, so the app and the thesis quote the same figures.
 */
import scopeRows from './results/scope.json';
import hedgeLadderRows from './results/hedgeLadder.json';
import matchedTenorRows from './results/matchedTenor.json';
import tenorSweepRows from './results/tenorSweep.json';
import fixedNotionalRows from './results/fixedNotional.json';
import notionalLadderRows from './results/notionalLadder.json';
import exemptShareRows from './results/exemptShare.json';
import mixedRows from './results/mixed.json';
import robustnessRows from './results/robustness.json';
import regulatoryCvaRows from './results/regulatoryCva.json';
import sensCcsRows from './results/sensCcs.json';
import sensIrRows from './results/sensIr.json';
import sensVegaRows from './results/sensVega.json';
import exposureProfileRows from './results/exposureProfiles.json';
import source from './results/source.json';
import { portfolio } from './portfolio';
import { CCS_VERTICES, IR_VERTICES, ccsBucket, ccsCapital, irCapital, saCvaTotal, vegaCapital, type SaCvaResult } from '../models/saCva';

export type Scope = 'basel' | 'eu';
export type Approach = 'ba_cva' | 'sa_cva';

export interface CapitalRow {
  scope: Scope;
  approach: Approach;
  hedge_ratio: number | null;
  opt_in: boolean;
  hedge_tenor: number | null;
  hedge_notional_total: number;
  k_ccs: number | null;
  k_ir: number | null;
  k_ir_vega: number | null;
  cva_charge: number;
  frtb_charge: number;
  total_capital: number;
}

export const results = {
  source,
  scope: scopeRows as CapitalRow[],
  hedgeLadder: hedgeLadderRows as CapitalRow[],
  matchedTenor: matchedTenorRows as CapitalRow[],
  tenorSweep: tenorSweepRows as (CapitalRow & { sizing: string })[],
  fixedNotional: fixedNotionalRows as (CapitalRow & { allocation: string; notional_target: number })[],
  notionalLadder: notionalLadderRows as (CapitalRow & { tenor_mode: string; allocation: string; notional_target: number })[],
  exemptShare: exemptShareRows as (CapitalRow & { exempt_share: number; n_exempt: number })[],
  mixed: mixedRows as {
    scope: Scope; opt_in: boolean; tenor_mode: string; hedge_ratio: number; n_counterparties: number;
    pure_sa_cva: number; pure_ba_cva: number; best_mixed: number; n_sa: number; gain_vs_best_pure_pct: number;
  }[],
  robustness: robustnessRows as {
    variation: string; value: number | string; approach: Approach; hedge_ratio: number; cva_charge: number;
    frtb_charge: number; total_capital: number; pct_change: number;
  }[],
  regulatoryCva: regulatoryCvaRows as { counterparty: string; cva: number; cva_se: number; exempt_eu: boolean; peak_ee: number }[],
  exposureProfiles: exposureProfileRows as { counterparty: string; t: number[]; ee: number[]; pfe: number[] }[],
};

/** Headline numbers, EUR m, from thesis/generated/numbers.tex. */
export const headline = {
  baselBA: 8.47, baselSA: 10.54, euBA: 7.13, euSA: 8.61,
  baselSAdeltaOnly: 7.17, baselSAvega: 3.38, baselSAvegaSharePct: 32.0,
  betaFloor: 2.12,
  baselSAfullHedge5y: 8.92, matchedSAfullHedge: 4.57, matchedSAfloor: 4.03, matchedSAccs: 0.54, matchedSAir: 0.65,
  matchedSAminusBA: 2.45,
  euBAnoOptInFull: 4.14, euSAnoOptInFull: 8.08, euBAoptInFull: 2.12, euSAoptInFull: 8.92,
  frtbPenaltyBA: 2.35, frtbPenaltySA: 0.73, hedgeNotionalBA: 129.22, hedgeNotionalSA: 23.26,
  exemptSharePct: 25.45, tenorBestSA: 5.05, tenorBestSAyears: 10, tenorWorstSA: 10.29,
  sigmaCrossBp: 66.4, sigmaHist1yBp: 62.8, sigmaHist2yBp: 81.3, robSigmaLowPct: -51.1, robSigmaHighPct: 51.5,
  mcStdPct: 1.46, cvaAggregate: 3.36,
};

// ── SA-CVA rebuilt from the frozen sensitivities ──────────────────────────

const ccsBy = new Map<string, number[]>();
for (const r of sensCcsRows as { counterparty: string; vertex_years: number; delta: number }[]) {
  const v = ccsBy.get(r.counterparty) ?? CCS_VERTICES.map(() => 0);
  v[CCS_VERTICES.indexOf(r.vertex_years)] = r.delta;
  ccsBy.set(r.counterparty, v);
}
const irBy = new Map<string, number[]>();
for (const r of sensIrRows as { counterparty: string; vertex_years: number; delta: number }[]) {
  if (r.counterparty.startsWith('AGGREGATE')) continue;
  const v = irBy.get(r.counterparty) ?? IR_VERTICES.map(() => 0);
  v[IR_VERTICES.indexOf(r.vertex_years)] = r.delta;
  irBy.set(r.counterparty, v);
}
const vegaBy = new Map<string, number>();
for (const r of sensVegaRows as { counterparty: string; vega: number }[]) if (!r.counterparty.startsWith('AGGREGATE')) vegaBy.set(r.counterparty, r.vega);

export const sensitivities = { ccs: ccsBy, ir: irBy, vega: vegaBy };

/**
 * SA-CVA for a set of counterparties, with an idealised hedge that offsets a share `h` of every
 * credit spread delta (a perfect CDS strip). Interest rate delta and vega are untouched by a CDS.
 */
export function saCvaFromSensitivities(names: string[], h = 0): SaCvaResult {
  const cps = portfolio.filter((c) => names.includes(c.name));
  const k = ccsCapital(
    cps.map((c) => {
      const s = ccsBy.get(c.name)!;
      return { name: c.name, bucket: ccsBucket(c), sCva: s, sHedge: s.map((x) => -h * x) };
    }),
  ).k;
  const ir = IR_VERTICES.map((_, i) => cps.reduce((sum, c) => sum + (irBy.get(c.name)?.[i] ?? 0), 0));
  const vega = cps.reduce((sum, c) => sum + (vegaBy.get(c.name) ?? 0), 0);
  return saCvaTotal(k, irCapital(ir), vegaCapital(vega));
}

/** Rows of an experiment for one scope / approach / opt-in cell, sorted by hedge ratio. */
export function cell<T extends CapitalRow>(rows: T[], scope: Scope, approach: Approach, optIn = false): T[] {
  return rows
    .filter((r) => r.scope === scope && r.approach === approach && r.opt_in === optIn)
    .sort((a, b) => (a.hedge_ratio ?? 0) - (b.hedge_ratio ?? 0));
}
