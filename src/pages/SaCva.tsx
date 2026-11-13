import { useMemo, useState } from 'react';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { portfolio } from '../data/portfolio';
import { cell, headline, results, saCvaFromSensitivities, sensitivities } from '../data/results';
import { closedForm, kReduced, scva } from '../models/baCva';
import { CCS_RISK_WEIGHTS, CCS_VERTICES, IR_RISK_WEIGHTS, IR_VERTICES, ccsBucket } from '../models/saCva';

export default function SaCva() {
  const [scope, setScope] = useState<'basel' | 'eu'>('basel');
  const cps = scope === 'basel' ? portfolio : portfolio.filter((c) => !c.exemptEu);
  const names = cps.map((c) => c.name);
  const base = useMemo(() => saCvaFromSensitivities(names), [scope]);
  const kRed = useMemo(() => kReduced(cps.map(scva)), [scope]);

  const [cp, setCp] = useState('Pension fund E');
  const [h, setH] = useState(0);
  const hs = linspace(0, 1, 21);
  const sweep = useMemo(() => hs.map((x) => saCvaFromSensitivities(names, x)), [scope]);
  const now = saCvaFromSensitivities(names, h);

  const irAgg = IR_VERTICES.map((_, i) => cps.reduce((s, c) => s + (sensitivities.ir.get(c.name)?.[i] ?? 0), 0));
  const vegaRows = cps.map((c) => ({ name: c.name, v: sensitivities.vega.get(c.name) ?? 0 })).sort((a, b) => b.v - a.v);

  const stack = (k: 'kCcs' | 'kIr' | 'kVega', name: string, color: string) =>
    line(hs, sweep.map((r) => r[k]), name, { stackgroup: 'one', line: { color, width: 0.5 }, fillcolor: color + 'cc' });

  const five = cell(results.hedgeLadder, 'basel', 'sa_cva').filter((r) => [0, 0.5, 0.8, 1].includes(r.hedge_ratio ?? -1));
  const matched = cell(results.matchedTenor, 'basel', 'sa_cva');
  const bar = (rows: typeof five, k: 'k_ccs' | 'k_ir' | 'k_ir_vega', name: string, color: string, xaxis: string) => ({
    type: 'bar', name, x: rows.map((r) => `h = ${r.hedge_ratio}`), y: rows.map((r) => r[k]), marker: { color }, xaxis, yaxis: 'y', showlegend: xaxis === 'x',
  });

  return (
    <article>
      <LessonHeader id="sa-cva" />

      <Section title="1. The idea">
        <InPlainWords>
          SA-CVA works like a risk report. The bank bumps each market input of its CVA model by a small amount and records how
          much CVA moves. These are the <Term name="Sensitivity">sensitivities</Term>. The regulation then gives each sensitivity a{' '}
          <Term name="Risk weight">risk weight</Term> (how far that input can move in a bad period) and correlations (how inputs move
          together), and adds everything up with square roots. The risk a hedge offsets drops out. The risk it does not touch stays.
        </InPlainWords>
        <TexBlock>{String.raw`\mathrm{WS}_k = \mathrm{RW}_k\,(s_k^{\mathrm{CVA}} - s_k^{\mathrm{hdg}}),\qquad K_b = \sqrt{\sum_k \mathrm{WS}_k^2 + \sum_{k\neq l}\rho_{kl}\mathrm{WS}_k\mathrm{WS}_l + R\sum_k (\mathrm{WS}^{\mathrm{hdg}}_k)^2}`}</TexBlock>
        <TexBlock>{String.raw`K = m_{\mathrm{CVA}}\sqrt{\sum_b K_b^2 + \sum_{b\neq c}\gamma_{bc}S_bS_c},\qquad S_b = \max\bigl(-K_b, \min(\textstyle\sum_{k\in b}\mathrm{WS}_k, K_b)\bigr)`}</TexBlock>
        <TexBlock>{String.raw`K_{\mathrm{SA}} = K_{\mathrm{CCS}} + K_{\mathrm{IR}} + K_{\mathrm{vega}}`}</TexBlock>
        <Symbols
          items={[
            [String.raw`s_k`, 'Art. 383i: (CVA after a 1 bp bump − CVA) / 0.0001, at each vertex k.'],
            [String.raw`\mathrm{CCS}`, 'Counterparty credit spread delta: 5 vertices per name (0.5/1/3/5/10y), Art. 383e(1). Risk weight 0.5–12 % by bucket.'],
            [String.raw`\mathrm{IR}`, 'Interest rate delta: 5 vertices (1/2/5/10/30y) for EUR, risk weights 1.11–0.74 %, Art. 383k.'],
            [String.raw`\mathrm{vega}`, 'Interest rate vega: CVA change for a 1 % relative bump of the model volatility, risk weight 100 %, Art. 383j, 383k(5).'],
            [String.raw`R = 0.01`, 'Hedging disallowance (Art. 383b(7)): 1 % of the squared hedge sensitivities stays in the charge even for a perfect hedge.'],
            [String.raw`\rho_{kl},\ \gamma_{bc}`, 'Correlations within a bucket (same name 100 %/90 % across tenors, different names 50 %) and across buckets (Art. 383r).'],
          ]}
        />
      </Section>

      <Section title="2. The book's sensitivities">
        <div className="grid-2">
          <div>
            <label className="select-label">
              Counterparty
              <select value={cp} onChange={(e) => setCp(e.target.value)}>
                {portfolio.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            <Chart
              data={[{ type: 'bar', x: CCS_VERTICES.map((v) => `${v}y`), y: sensitivities.ccs.get(cp), name: 'CCS delta', marker: { color: palette[0] } } as never]}
              x="Credit spread vertex"
              y="EUR m per unit spread"
              height={260}
            />
            <p className="muted">
              Bucket {ccsBucket(portfolio.find((c) => c.name === cp)!)}, risk weight {pct(CCS_RISK_WEIGHTS[ccsBucket(portfolio.find((c) => c.name === cp)!)], 1)}.
              Short vertices can be negative: a wider short spread brings defaults forward, when exposure is still small.
            </p>
          </div>
          <div>
            <Chart
              data={[{ type: 'bar', x: IR_VERTICES.map((v) => `${v}y`), y: irAgg, name: 'IR delta', marker: { color: palette[2] } } as never]}
              x="Interest rate vertex (aggregate over the scope)"
              y="EUR m per unit rate"
              height={260}
            />
            <p className="muted">Risk weights {IR_RISK_WEIGHTS.map((w) => pct(w, 2)).join(' / ')}.</p>
          </div>
        </div>
        <Chart
          data={[{ type: 'bar', x: vegaRows.map((r) => r.name), y: vegaRows.map((r) => r.v), marker: { color: palette[4] }, name: 'vega' } as never]}
          y="Vega (EUR m per 100 % vol)"
          height={300}
          layout={{ xaxis: { tickangle: -40 }, showlegend: false }}
        />
        <Example title="Why the vega charge is so large">
          A 1 % relative bump in σ raises exposure by about 1 %, so the vega sensitivity is close to the CVA itself (the aggregate vega is
          {' '}{num(headline.baselSAvega, 2)} against an aggregate CVA of {headline.cvaAggregate}). With a 100 % risk weight and a single EUR bucket, the
          vega charge is that whole number: {headline.baselSAvega} EUR m, {headline.baselSAvegaSharePct} % of unhedged SA-CVA in Basel scope.
        </Example>
      </Section>

      <Section title="3. Aggregation, live">
        <Toggle value={scope} onChange={setScope} options={[{ value: 'basel', label: 'Basel scope' }, { value: 'eu', label: 'EU scope' }]} />
        <Stats
          items={[
            { label: 'K_CCS (credit spread delta)', value: num(base.kCcs, 3) },
            { label: 'K_IR (rate delta)', value: num(base.kIr, 3) },
            { label: 'K_vega', value: num(base.kVega, 3) },
            { label: 'SA-CVA total', value: num(base.total, 3), hint: scope === 'basel' ? `thesis ${headline.baselSA}` : `thesis ${headline.euSA}` },
            { label: 'BA-CVA (for comparison)', value: num(kRed, 3) },
          ]}
        />
        <Note>
          Without vega, SA-CVA would be {num(base.kCcs + base.kIr, 2)} and would undercut BA-CVA. Vega, which Art. 383b(2) requires through
          the volatility of the exposure model, is what makes unhedged SA-CVA the dearer approach. The thesis added it in the v0.8 freeze.
        </Note>
      </Section>

      <Section title="4. Hedging with CDS: the floor">
        <p>
          A CDS has a credit spread sensitivity, but almost no interest rate or volatility sensitivity. Here the hedge is an idealised
          CDS strip that offsets a share h of the credit spread delta at <em>every</em> vertex. That is the best case for SA-CVA.
        </p>
        <Playground controls={<Slider label="Share of CCS delta hedged h" value={h} min={0} max={1} step={0.05} onChange={setH} format={(v) => pct(v, 0)} />}>
          <Stats
            items={[
              { label: 'SA-CVA', value: num(now.total, 3) },
              { label: 'of which K_IR + K_vega', value: num(now.kIr + now.kVega, 3), hint: 'untouched' },
              { label: 'BA-CVA at r = h', value: num(closedForm(kRed, h), 3) },
            ]}
          />
          <Chart
            data={[
              stack('kVega', 'Vega', palette[4]),
              stack('kIr', 'IR delta', palette[2]),
              stack('kCcs', 'CCS delta', palette[0]),
              line(hs, hs.map((x) => closedForm(kRed, x)), 'BA-CVA (closed form)', { line: { color: palette[3], width: 3 } }),
              { x: [h], y: [now.total], mode: 'markers', type: 'scatter', name: 'You', marker: { size: 11, color: '#000' } },
            ] as never}
            x="Share hedged"
            y="Capital (EUR m)"
          />
        </Playground>
        <TryThis
          items={[
            'Push h to 100 %. CCS delta drops to a small residual, the hedging disallowance (about 7 % of its unhedged level, because the disallowance term has no correlations in it). IR delta and vega do not move.',
            'Compare with the red BA-CVA line. Without hedges the two are close. Fully hedged, BA-CVA lands at its floor, far below SA-CVA.',
            'Switch to EU scope in Section 3 and come back. The gap narrows (fewer names carry vega) but does not close.',
          ]}
        />
        <TexBlock>{String.raw`K_{\mathrm{SA}} \;\geq\; K_{\mathrm{IR}} + K_{\mathrm{vega}} \quad\text{whatever the CDS notional}`}</TexBlock>
        <p>
          This is prediction <strong>P2</strong>. The SA-CVA floor is set by the risks a CDS does not hedge, not by a supervisory parameter. For SA-CVA to win once
          both approaches hedge, the thesis needs K<sub>SA</sub><sup>min</sup> + F/κ &lt; β·K<sub>reduced</sub>. Here the left side is at least {headline.matchedSAfloor} and the right side is {headline.betaFloor}.
        </p>
      </Section>

      <Section title="5. Real CDS: the tenor matters">
        <p>
          A real CDS loads mainly on the vertices up to its maturity. A 5-year CDS sized to offset the 5-year vertex leaves the 10-year
          vertex of long swaps open. The thesis's experiments B (5-year CDS) and E1 (CDS matched to each counterparty's longest trade) show
          the difference (frozen run, Basel scope):
        </p>
        <Chart
          data={[
            bar(five, 'k_ir_vega', 'Vega', palette[4], 'x'),
            bar(five, 'k_ir', 'IR delta', palette[2], 'x'),
            bar(five, 'k_ccs', 'CCS delta', palette[0], 'x'),
            bar(matched, 'k_ir_vega', 'Vega', palette[4], 'x2'),
            bar(matched, 'k_ir', 'IR delta', palette[2], 'x2'),
            bar(matched, 'k_ccs', 'CCS delta', palette[0], 'x2'),
          ] as never}
          y="SA-CVA (EUR m)"
          height={340}
          layout={{
            barmode: 'stack',
            xaxis: { domain: [0, 0.48], title: { text: '(a) 5-year CDS' } },
            xaxis2: { domain: [0.52, 1], title: { text: '(b) matched tenor' }, anchor: 'y' } as never,
          }}
        />
        <p>
          Fully hedged, SA-CVA is {headline.baselSAfullHedge5y} EUR m with 5-year CDS and {headline.matchedSAfullHedge} with matched tenors. Across tenors, the
          best uniform tenor is {headline.tenorBestSAyears} years ({headline.tenorBestSA}), the last vertex. Even then the gap to BA-CVA ({headline.betaFloor}) is about{' '}
          {headline.matchedSAminusBA} EUR m that no single-name CDS can remove.
        </p>
        <CodeRef file="src/models/saCva.ts">Port of src/cvacap/sa_cva.py. The tests rebuild K_CCS, K_IR and K_vega from the frozen sensitivities and match the thesis to 10⁻⁴.</CodeRef>
      </Section>

      <Takeaways
        items={[
          'SA-CVA = credit spread delta + interest rate delta + interest rate vega, each aggregated with risk weights and correlations.',
          `Unhedged, SA-CVA is ${headline.baselSA} vs BA-CVA ${headline.baselBA} EUR m (Basel scope); vega is a third of it.`,
          'A CDS reduces only the credit spread delta, and the R = 0.01 disallowance keeps a residual.',
          `So SA-CVA has a floor, K_IR + K_vega ≈ ${headline.matchedSAfloor}, above the BA-CVA floor of ${headline.betaFloor}.`,
          'The hedge tenor matters for SA-CVA through the vertex grid. Matching it halves the hedged charge, but cannot close the gap.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'What does the hedging disallowance R = 0.01 do?',
            options: ['Caps the hedge notional at 1 %', 'Keeps 1 % of the squared hedge sensitivities in K_b, so even a perfect hedge leaves a residual', 'Charges the CDS premium', 'Removes vega'],
            answer: 1,
            why: 'R·Σ(WS^hdg)² stays inside the square root. With WS = 0 after a perfect hedge, K_b = √R · √Σ(WS^hdg)² = 0.1 · √Σ(WS^hdg)².',
          },
          {
            q: 'Why does the vega charge not fall when the bank buys more CDS?',
            options: ['CDS have no volatility sensitivity in the exposure model', 'Vega is floored by Art. 383j', 'CDS are not eligible for SA-CVA', 'Vega is charged only on exempt names'],
            answer: 0,
            why: 'The CDS value does not depend on the interest rate volatility, so s^hdg = 0 for vega (Art. 383e(2) also has no CCS vega).',
          },
        ]}
      />
      <LessonFooter id="sa-cva" />
    </article>
  );
}
