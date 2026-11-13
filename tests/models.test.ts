/**
 * The TypeScript models must reproduce the thesis. BA-CVA is deterministic, so it is checked against the
 * frozen numbers to the third decimal; SA-CVA is rebuilt from the frozen sensitivities and checked
 * against the frozen capital split.
 */
import { describe, expect, it } from 'vitest';
import { portfolio } from '../src/data/portfolio';
import { cell, headline, results, saCvaFromSensitivities, sensitivities } from '../src/data/results';
import { BETA, closedForm, discountFactor, effectiveMaturity, kReduced, kTotal, notionalForRecognition, riskWeight, scva, scvaC, snhC } from '../src/models/baCva';
import { regulatoryCva, simulateExposure } from '../src/models/exposure';
import { CCS_RISK_WEIGHTS, R_DISALLOWANCE, ccsBucket, ccsGamma, ccsRho } from '../src/models/saCva';
import { ead, effectiveNotional, maturityFactorMargined, saCcr, supervisoryDuration } from '../src/models/saCcr';

const all = portfolio;
const eu = portfolio.filter((c) => !c.exemptEu);

describe('SA-CCR (Art. 274–280a)', () => {
  it('single 10y unmargined swap: EAD = 1.4 · 0.005 · N · SD · 1', () => {
    const sd = (1 - Math.exp(-0.5)) / 0.05;
    expect(supervisoryDuration(0, 10)).toBeCloseTo(sd, 12);
    expect(ead([{ notional: 100, maturity: 10, receiveFixed: true }])).toBeCloseTo(1.4 * 0.005 * 100 * sd, 10);
  });
  it('a payer and a receiver in the same bucket net to zero', () => {
    expect(ead([{ notional: 100, maturity: 7, receiveFixed: true }, { notional: 100, maturity: 7, receiveFixed: false }])).toBeCloseTo(0, 12);
  });
  it('effective notional matches the Art. 280a(3) formula', () => {
    expect(effectiveNotional(1, 2, 3)).toBeCloseTo(Math.sqrt(1 + 4 + 9 + 1.4 * 2 + 1.4 * 6 + 0.6 * 3), 12);
  });
  it('daily margin: MF = 1.5·√(10/250) = 0.3, and margin lowers the EAD', () => {
    expect(maturityFactorMargined()).toBeCloseTo(0.3, 12);
    const t = [{ notional: 150, maturity: 5, receiveFixed: true }];
    expect(saCcr(t, { margined: true }).ead).toBeCloseTo(0.3 * ead(t), 10);
  });
});

describe('BA-CVA (Art. 384) reproduces the thesis', () => {
  it('DF and Art. 162 maturity', () => {
    expect(discountFactor(0)).toBe(1);
    expect(discountFactor(10)).toBeCloseTo((1 - Math.exp(-0.5)) / 0.5, 12);
    expect(effectiveMaturity([200, 100], [10, 5])).toBeCloseTo(25 / 3, 12);
    expect(effectiveMaturity([10], [0.5])).toBe(0.5); // floored at 1, then capped at the longest trade
  });
  it('risk weights: unrated uses the CQS 4–6 column', () => {
    expect(riskWeight('financial', 1)).toBe(0.05);
    expect(riskWeight('financial', 4)).toBe(0.12);
    expect(riskWeight('other', null)).toBe(0.12);
  });
  it(`Basel scope, unhedged: ${headline.baselBA}`, () => {
    expect(kReduced(all.map(scva))).toBeCloseTo(8.47335, 4);
  });
  it(`EU scope, unhedged: ${headline.euBA}`, () => {
    expect(kReduced(eu.map(scva))).toBeCloseTo(7.13261, 4);
  });
  it('with no hedges the full version equals the reduced version', () => {
    const s = all.map(scva);
    expect(kTotal(s, s.map(() => 0), s.map(() => 0))).toBeCloseTo(kReduced(s), 12);
  });
  it('closed form K_reduced·(β + (1−β)|1−r|) holds, and over- and under-hedging cost the same', () => {
    const s = all.map(scva);
    const k = kReduced(s);
    for (const r of [0, 0.3, 0.8, 1, 1.4]) expect(kTotal(s, s.map((x) => r * x), s.map(() => 0))).toBeCloseTo(closedForm(k, r), 10);
    expect(closedForm(k, 1)).toBeCloseTo(BETA * k, 12);
    expect(closedForm(k, 1)).toBeCloseTo(2.11834, 4); // the β floor
    expect(closedForm(k, 0.6)).toBeCloseTo(closedForm(k, 1.4), 12);
  });
  it('the frozen hedge ladder lies on the closed form', () => {
    const k = kReduced(all.map(scva));
    for (const row of cell(results.hedgeLadder, 'basel', 'ba_cva')) expect(row.total_capital).toBeCloseTo(closedForm(k, row.hedge_ratio ?? 0), 6);
  });
  it('a direct CDS sized by notionalForRecognition hits the target ratio', () => {
    const c = all[0];
    const s = scva(c);
    const n = notionalForRecognition(s, 0.7, 0.05, 5);
    expect(snhC([{ relation: 'direct', rwH: 0.05, maturity: 5, notional: n }]) / s).toBeCloseTo(0.7, 12);
    expect(scvaC(0.05, [{ ead: 1, maturity: 1 }])).toBeCloseTo((0.05 / 1.4) * discountFactor(1), 12);
  });
});

describe('SA-CVA (Art. 383b) rebuilt from the frozen sensitivities', () => {
  const basel = results.scope.find((r) => r.scope === 'basel' && r.approach === 'sa_cva')!;
  const euRow = results.scope.find((r) => r.scope === 'eu' && r.approach === 'sa_cva')!;
  it('correlations', () => {
    expect(ccsRho(false, false)).toBeCloseTo(0.45, 12);
    expect(ccsGamma(4, 15)).toBe(1);
    expect(ccsGamma(4, 5)).toBe(0.05);
  });
  it(`Basel scope, unhedged: ${headline.baselSA} split into CCS / IR / vega`, () => {
    const r = saCvaFromSensitivities(all.map((c) => c.name));
    expect(r.kCcs).toBeCloseTo(basel.k_ccs!, 4);
    expect(r.kIr).toBeCloseTo(basel.k_ir!, 4);
    expect(r.kVega).toBeCloseTo(basel.k_ir_vega!, 4);
    expect(r.total).toBeCloseTo(10.5436, 3);
  });
  it(`EU scope, unhedged: ${headline.euSA}`, () => {
    const r = saCvaFromSensitivities(eu.map((c) => c.name));
    expect(r.total).toBeCloseTo(euRow.total_capital, 4);
  });
  it('a perfect CDS strip leaves IR delta + vega + the hedging disallowance', () => {
    const r = saCvaFromSensitivities(all.map((c) => c.name), 1);
    expect(r.kIr + r.kVega).toBeCloseTo(basel.k_ir! + basel.k_ir_vega!, 5);
    // Fully hedged, every WS is 0, so S_b = 0 and K_CCS = √(Σ_b R Σ_k (WS_k^hdg)²): no correlations left.
    let sq = 0;
    for (const c of all) for (const s of sensitivities.ccs.get(c.name)!) sq += (CCS_RISK_WEIGHTS[ccsBucket(c)] * s) ** 2;
    expect(r.kCcs).toBeCloseTo(Math.sqrt(R_DISALLOWANCE * sq), 10);
    expect(r.kCcs).toBeLessThan(0.1 * basel.k_ccs!);
    expect(r.total).toBeGreaterThan(headline.betaFloor);
  });
});

describe('Exposure model', () => {
  const p = { f: 0.025, a: 0.03, sigma: 0.008 };
  const swap = { notional: 100, maturity: 10, receiveFixed: true };
  const prof = simulateExposure(p, swap, 1500, 1);
  it('EE starts and ends at zero and humps in between', () => {
    expect(prof.ee[0]).toBeCloseTo(0, 6);
    expect(prof.ee[prof.ee.length - 1]).toBe(0);
    expect(Math.max(...prof.ee)).toBeGreaterThan(1);
  });
  it('PFE ≥ EE; CVA grows with the spread and with σ', () => {
    prof.ee.forEach((e, i) => expect(prof.pfe[i]).toBeGreaterThanOrEqual(e - 1e-9));
    const c1 = regulatoryCva(prof.t, prof.dee, 0.01);
    expect(regulatoryCva(prof.t, prof.dee, 0.02)).toBeGreaterThan(c1);
    const hi = simulateExposure({ ...p, sigma: 0.012 }, swap, 1500, 1);
    expect(regulatoryCva(hi.t, hi.dee, 0.01)).toBeGreaterThan(c1 * 1.3);
  });
});
