import { useState } from 'react';
import { Chart, line, palette } from '../components/Chart';
import { Stats, Toggle, num } from '../components/Controls';
import { CodeRef, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways } from '../components/Lesson';
import { headline, results } from '../data/results';

const variations: { value: string; label: string; unit: (v: number | string) => string }[] = [
  { value: 'hull_white_sigma', label: 'Hull–White σ', unit: (v) => `${Math.round(Number(v) * 1e4)} bp` },
  { value: 'hull_white_a', label: 'Mean reversion a', unit: (v) => String(v) },
  { value: 'curve_shift_bp', label: 'Curve shift', unit: (v) => `${v} bp` },
  { value: 'credit_spreads', label: 'Credit spreads ×', unit: (v) => `×${v}` },
  { value: 'monte_carlo', label: 'MC paths', unit: (v) => `${Number(v).toLocaleString('en')}` },
  { value: 'ds_cva_whatif', label: 'DS_CVA (what-if)', unit: (v) => String(v) },
];

export default function Results() {
  const [variation, setVariation] = useState('hull_white_sigma');
  const rows = results.robustness.filter((r) => r.variation === variation);
  const values = [...new Set(rows.map((r) => String(r.value)))];
  const v = variations.find((x) => x.value === variation)!;
  const pick = (val: string, a: 'ba_cva' | 'sa_cva', h: number) => rows.find((r) => String(r.value) === val && r.approach === a && r.hedge_ratio === h)?.total_capital ?? null;
  const label = (val: string) => v.unit(val);
  const robChart = [
    { type: 'bar', name: 'BA-CVA unhedged', x: values.map(label), y: values.map((x) => pick(x, 'ba_cva', 0)), marker: { color: palette[0] } },
    { type: 'bar', name: 'SA-CVA unhedged', x: values.map(label), y: values.map((x) => pick(x, 'sa_cva', 0)), marker: { color: palette[1] } },
    { type: 'bar', name: 'BA-CVA full hedge', x: values.map(label), y: values.map((x) => pick(x, 'ba_cva', 1)), marker: { color: palette[0], opacity: 0.5 } },
    { type: 'bar', name: 'SA-CVA full hedge', x: values.map(label), y: values.map((x) => pick(x, 'sa_cva', 1)), marker: { color: palette[1], opacity: 0.5 } },
  ];

  // σ break-even: SA-CVA unhedged is close to linear in σ.
  const sig = results.robustness.filter((r) => r.variation === 'hull_white_sigma' && r.approach === 'sa_cva').sort((a, b) => Number(a.value) - Number(b.value));
  const saU = sig.filter((r) => r.hedge_ratio === 0);
  const saF = sig.filter((r) => r.hedge_ratio === 1);
  const baU = results.robustness.find((r) => r.variation === 'baseline' && r.approach === 'ba_cva' && r.hedge_ratio === 0)!.total_capital;
  const baF = results.robustness.find((r) => r.variation === 'baseline' && r.approach === 'ba_cva' && r.hedge_ratio === 1)!.total_capital;
  const bpx = (rs: typeof saU) => rs.map((r) => Number(r.value) * 1e4);

  const [mixScope, setMixScope] = useState<'basel' | 'eu' | 'eu-opt'>('basel');
  const [mixTenor, setMixTenor] = useState<'five_year' | 'matched'>('matched');
  const mix = results.mixed
    .filter((r) => r.tenor_mode === mixTenor && r.scope === (mixScope === 'basel' ? 'basel' : 'eu') && r.opt_in === (mixScope === 'eu-opt'))
    .sort((a, b) => a.hedge_ratio - b.hedge_ratio);

  return (
    <article>
      <LessonHeader id="results" />

      <Section title="1. The answer to the research question">
        <InPlainWords>
          <p>
            <strong>Choice of approach.</strong> For this book BA-CVA is cheaper, unhedged and hedged. The exemptions do not change the
            order. They lower both charges, and SA-CVA by a little more because exempt names carry vega.
          </p>
          <p>
            <strong>Incentive to hedge.</strong> BA-CVA gives a strong, linear incentive to buy CDS, up to exactly full recognition and no
            further. SA-CVA gives a weak one, limited to the credit spread part of the charge. In the EU, a hedge on an exempt counterparty
            carries a capital <em>penalty</em> unless the bank opts in. The opt-in removes the penalty under BA-CVA and costs vega under SA-CVA.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>So</strong> the EU exemptions reinforce BA-CVA. A bank that hedges, and opts in its hedged exempt names, ends up at the BA-CVA
            floor of {headline.betaFloor} EUR m, against {headline.matchedSAfullHedge} for the same strategy under SA-CVA. Only at the far end of the
            exempt-share ladder (about 59 % of the book exempt, no opt-in) does SA-CVA become the cheaper approach.
          </p>
        </InPlainWords>
      </Section>

      <Section title="2. Mixing the approaches (Art. 382a(3))">
        <p>
          CRR3 allows some counterparties under SA-CVA and the rest under BA-CVA. The charges do not separate, because each
          aggregates through square roots and correlations. So experiment F searches <strong>every</strong> split, 2<sup>17</sup> = 131 072
          in Basel scope, in 24 cells.
        </p>
        <div className="sector-picker">
          <Toggle value={mixScope} onChange={setMixScope} options={[{ value: 'basel', label: 'Basel' }, { value: 'eu', label: 'EU, no opt-in' }, { value: 'eu-opt', label: 'EU, opt-in' }]} />
          <Toggle value={mixTenor} onChange={setMixTenor} options={[{ value: 'five_year', label: '5-year CDS' }, { value: 'matched', label: 'Matched tenor' }]} />
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Hedge ratio</th><th>All BA-CVA</th><th>All SA-CVA</th><th>Best mix</th><th>Names in SA-CVA</th><th>Gain</th></tr></thead>
            <tbody>
              {mix.map((r) => (
                <tr key={r.hedge_ratio}>
                  <td>{r.hedge_ratio}</td><td>{num(r.pure_ba_cva, 3)}</td><td>{num(r.pure_sa_cva, 3)}</td><td>{num(r.best_mixed, 3)}</td>
                  <td>{r.n_sa} of {r.n_counterparties}</td><td>{num(r.gain_vs_best_pure_pct, 1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          In every cell the cheapest split is <strong>all BA-CVA</strong>, and the gain from mixing is 0.0 %. SA-CVA vega is spread across names
          roughly in proportion to their CVA, so no counterparty has an SA-CVA charge small enough, relative to its BA-CVA charge, to be worth
          moving. Prediction <strong>P4</strong>'s condition is not met. A fixed cost F of running SA-CVA would only widen the gap.
        </p>
      </Section>

      <Section title="3. Robustness: which numbers depend on the model?">
        <Toggle label="Vary one factor (EU scope, opt-in, matched-tenor CDS, 10 000 paths)" value={variation} onChange={setVariation} options={variations.map(({ value, label }) => ({ value, label }))} />
        <Chart data={robChart as never} y="Total capital (EUR m)" height={340} layout={{ barmode: 'group' }} />
        <Note>
          BA-CVA moves by {num(0, 2)} % across every exposure-model factor, because Art. 384(2) takes its exposure from SA-CCR. SA-CVA moves by{' '}
          {headline.robSigmaLowPct} % and +{headline.robSigmaHighPct} % when σ is halved or raised by half. Monte Carlo noise is small by comparison: {headline.mcStdPct} % at
          10 000 paths. The DS_CVA row is a what-if: Art. 384(2) fixes it at 0.65.
        </Note>
      </Section>

      <Section title="4. The σ break-even">
        <Chart
          data={[
            line(bpx(saU), saU.map((r) => r.total_capital), 'SA-CVA unhedged', { mode: 'lines+markers', line: { color: palette[1] } }),
            line(bpx(saF), saF.map((r) => r.total_capital), 'SA-CVA full hedge', { mode: 'lines+markers', line: { color: palette[1], dash: 'dash' } }),
            line([40, 120], [baU, baU], 'BA-CVA unhedged', { line: { color: palette[0] } }),
            line([40, 120], [baF, baF], 'BA-CVA full hedge (β floor)', { line: { color: palette[0], dash: 'dash' } }),
            { type: 'scatter', mode: 'markers+text', x: [headline.sigmaHist1yBp, headline.sigmaHist2yBp], y: [0.6, 0.6], text: ['1y hist.', '2y hist.'], textposition: 'top center', marker: { symbol: 'triangle-up', size: 11, color: palette[5] }, name: 'Historical σ anchors' },
          ] as never}
          x="Hull–White σ (bp a year)"
          y="Total capital (EUR m)"
          height={340}
        />
        <Stats
          items={[
            { label: 'Unhedged break-even σ', value: `≈${headline.sigmaCrossBp} bp`, hint: 'SA-CVA = BA-CVA' },
            { label: 'Historical 1y / 2y', value: `${headline.sigmaHist1yBp} / ${headline.sigmaHist2yBp} bp` },
            { label: 'Baseline σ', value: '80 bp' },
          ]}
        />
        <Example title="What this means">
          The <em>unhedged</em> ranking is not robust. The break-even σ sits between the two historical anchors, so a plausible calibration could
          make SA-CVA cheaper before hedging. The <em>hedged</em> ranking is robust. The BA-CVA floor does not move with σ, and even at 40 bp
          fully hedged SA-CVA ({num(saF[0].total_capital, 2)}) stays above it ({num(baF, 2)}).
        </Example>
      </Section>

      <Section title="5. Limitations and what could change the answer">
        <ul>
          <li><strong>Uncalibrated volatility.</strong> No public EUR swaption volatility file was available, so σ = 80 bp is assumed. It sets the size of the vega charge.</li>
          <li><strong>CDS as the only hedge.</strong> Art. 386(2)(b) would also recognise interest rate swaps and swaptions as hedges of the exposure component under SA-CVA. They could lower K<sub>IR</sub> and K<sub>vega</sub>, the very floor that decides the comparison.</li>
          <li><strong>A stylised book.</strong> 17 counterparties, EUR swaps only, at inception, almost no collateral. A book dominated by hedgeable credit spread delta could favour SA-CVA or a mix.</li>
          <li><strong>One reading of Art. 384(3).</strong> DS_CVA is applied inside the reduced formula, as the transcribed text and the Basel calibration have it. The EBA declined to confirm this for CRR2 (Q&amp;A 2023_6899).</li>
          <li><strong>The incentive is about capital only.</strong> CDS premia net out at par. Bid-offer, funding and the fixed cost F of SA-CVA are in the objective but not quantified.</li>
        </ul>
        <p>Both main limitations weigh against SA-CVA: the first sets the size of its vega charge, and the second rules out the hedges that would reduce it.</p>
      </Section>

      <Section title="6. Reproducibility">
        <p>
          The thesis pipeline (<code>python scripts/reproduce.py</code>) reruns pytest, the exposure engine, the 32-cell baseline, experiments A–F and the
          robustness block in about seven minutes. Every result folder carries a manifest with the git SHA, the config hashes, the seed and the
          package versions. This app was built from thesis commit <code>{results.source.thesis_commit.slice(0, 7)}</code>, run{' '}
          <code>{results.source.run}</code>.
        </p>
        <CodeRef file="scripts/export_results.py">Copies the frozen results into src/data/results/. The tests in tests/models.test.ts check that the app's own BA-CVA and SA-CVA reproduce them.</CodeRef>
      </Section>

      <Takeaways
        items={[
          'BA-CVA is the cheaper approach for this book with and without hedges, and the exemptions reinforce that.',
          'Mixing the approaches gains nothing: the best split is all BA-CVA in all 24 cells.',
          'Unhedged, the ranking depends on σ (break-even ≈ 66 bp). Hedged, it does not.',
          'Recognising interest rate hedges under SA-CVA, or a calibrated lower σ, are the two things most likely to change the answer.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why does BA-CVA not move at all in the robustness runs on σ, a and the curve?',
            options: ['It uses a fixed CVA', 'Its exposure comes from SA-CCR, not from the simulation', 'It is floored', 'It only uses credit spreads'],
            answer: 1,
            why: 'Art. 384(2) takes EAD from SA-CCR, which has no exposure model inside.',
          },
          {
            q: 'Which extension would most likely help SA-CVA?',
            options: ['A higher σ', 'More CDS notional', 'Recognised interest rate swap or swaption hedges of the exposure component', 'More exempt counterparties under BA-CVA'],
            answer: 2,
            why: 'They would attack K_IR and K_vega, the floor a CDS cannot reach.',
          },
        ]}
      />
      <LessonFooter id="results" />
    </article>
  );
}
