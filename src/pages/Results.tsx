import { useState } from 'react';
import { Chart, line, palette } from '../components/Chart';
import { Stats, Toggle, num } from '../components/Controls';
import { Link } from 'react-router-dom';
import { CodeRef, DefenceCorner, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways } from '../components/Lesson';
import { headline, results } from '../data/results';

const variations: { value: string; label: string; unit: (v: number | string) => string }[] = [
  { value: 'hull_white_sigma', label: 'Hull–White σ', unit: (v) => `${Math.round(Number(v) * 1e4)} bp` },
  { value: 'hull_white_a', label: 'Mean reversion a', unit: (v) => String(v) },
  { value: 'curve_shift_bp', label: 'Curve shift', unit: (v) => `${v} bp` },
  { value: 'credit_spreads', label: 'Credit spreads ×', unit: (v) => `×${v}` },
  { value: 'monte_carlo', label: 'MC paths', unit: (v) => `${Number(v).toLocaleString('en')}` },
  { value: 'ds_cva_whatif', label: 'DS_CVA (what-if)', unit: (v) => String(v) },
];

// The seven limitations of Ch. 8 §8.2 and the dot matrix of Figure 8.1.
const conclusions = ['Unhedged ranking', 'P1 corner', 'P2 SA dearer hedged', 'P3 excluded name', 'P4 no gain from mix', 'Hedged capital level'];
const limitations: { name: string; hits: number[]; direction: string; evidence: string }[] = [
  { name: 'Uncalibrated σ', hits: [0, 2, 3], direction: 'Lower σ shrinks vega and favours SA-CVA unhedged (break-even ≈ 66 bp). Hedged ranking survives ±50 % (2.49 vs 2.12 at half σ). Would also make the SA-CVA opt-in less costly.', evidence: 'Run (Appendix B); the opt-in effect is not run.' },
  { name: 'No vega hedges', hits: [2, 4, 5], direction: 'Swaptions are eligible for SA-CVA only (Art. 386(2)(b) vs 386(3)). A vega hedge would need to cut about half of the 4.03 floor to beat 2.12.', evidence: 'Arithmetic from two figures; not run.' },
  { name: 'No CDS market for the names', hits: [1, 2, 5], direction: 'Index or proxy CDS (Table 2: 100/80/50 %) keep BA-CVA above its floor; hedged BA-CVA rises, gap narrows.', evidence: 'Argument; not tested.' },
  { name: 'Cleared-hedge assumption', hits: [2, 5], direction: 'Bilateral CDS sit in the CVA charge; BA-CVA rises more (129 vs 23 EUR m notional), gap narrows.', evidence: 'Argument; not tested.' },
  { name: 'Title IV reading', hits: [3], direction: 'Another reading removes the cost of hedging an excluded name: the first half of P3 becomes neutrality.', evidence: 'A reading; the rational-cell result does not depend on it.' },
  { name: 'Stylised book, Pension fund E', hits: [3, 4], direction: 'Pension fund E is 40.65 % of Σ SCVA; exempting it puts the book beyond the tested ladder (59.35 %).', evidence: 'Conditional; P4 should not be carried beyond this book.' },
  { name: 'Wrong-way risk', hits: [0, 5], direction: 'Probably raises SA-CVA (not BA-CVA under SA-CCR), favouring BA-CVA unhedged.', evidence: 'Argument; not a result.' },
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
            <strong>Part one, the choice of approach.</strong> The Art. 382(4) exclusions leave the ranking unchanged, except at the highest excluded shares.
            BA-CVA stays cheaper than SA-CVA, hedged and unhedged, at the assumed σ. The exclusions do narrow SA-CVA's disadvantage, from{' '}
            {headline.baselGapFullMatched} to {headline.euRatGapFullMatched} EUR m at a full matched hedge, because vega-heavy names leave SA-CVA while BA-CVA loses only
            their stand-alone charges. Unhedged, the ranking turns on σ, which the thesis does not settle.
          </p>
          <p>
            <strong>Part two, the incentive to hedge.</strong> The exclusions create a hedging cliff on the names they cover. A CDS on an excluded name earns no
            relief and, on the thesis's reading, attracts the Title IV charge, while leaving it unhedged costs nothing. The opt-in removes the cliff only in favour of
            BA-CVA ({headline.euBAnoOptInFull} → {headline.euBAoptInFull}), and raises SA-CVA. Under SA-CVA the incentive is weak in any case: a matched-tenor CDS leaves the
            rate delta and vega in place, so the permission and fixed cost of Art. 383(1) buy no capital advantage for this book.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Against the aim of the Basel review</strong>, to reduce the incentive “to leave some of their risks unhedged” (BCBS 2015, p. 2), the exclusions
            work in the opposite direction on the names they cover.
          </p>
        </InPlainWords>
        <Note title="What the earlier version of this page said">
          It said that the EU exemptions “reinforce BA-CVA”, and that a bank that hedges and opts in ends at the BA-CVA floor. The 20 Nov draft corrects both. The
          exclusions narrow SA-CVA's disadvantage. The cheapest EU cell is the rational one, with excluded names left unhedged and no opt-in, at{' '}
          {headline.euRatBAfullMatched} EUR m under BA-CVA, below the opt-in's {headline.euBAoptInFull}.
        </Note>
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
          These runs use EU scope with the opt-in, the matched-tenor hedge and 10 000 paths, so they are not the baseline of Table 6.1: unhedged SA-CVA is{' '}
          {headline.robBaseSAzero} here against {headline.euSA} there. BA-CVA moves by {num(0, 2)} % across every exposure-model factor, because under SA-CCR, as assumed
          here, the exposure value does not come from the simulation. SA-CVA moves by{' '}
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

      <Section title="5. Seven limitations, and what each could move">
        <p>
          Chapter 8 states each limitation with the conclusion it could change, the direction, and whether the results support that direction or it is only an argument.
          In the map (Figure 8.1 of the thesis) a dot means the limitation <em>could</em> move the conclusion, not that it does.
        </p>
        <div className="table-wrap">
          <table className="data limit-map">
            <thead>
              <tr><th>Limitation</th>{conclusions.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {limitations.map((l) => (
                <tr key={l.name}>
                  <td>{l.name}</td>
                  {conclusions.map((c, i) => <td key={c}>{l.hits.includes(i) ? '●' : ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Limitation</th><th>Direction</th><th>Evidence</th></tr></thead>
            <tbody>
              {limitations.map((l) => (
                <tr key={l.name}><td><strong>{l.name}</strong></td><td>{l.direction}</td><td>{l.evidence}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Several of these weigh against SA-CVA: σ sets the size of its vega charge, and the missing vega hedges are the ones that would reduce it. Two weigh the
          other way. Index or proxy hedges and bilateral CDS would both raise hedged BA-CVA more than SA-CVA and narrow the gap.
        </p>
      </Section>

      <Section title="6. Policy: do the provisions do what their design implies?">
        <p>
          The draft cannot judge the exclusions against their stated intent, because it has not yet sourced it (the recitals of Regulation (EU) 2024/1623). Chapter 8
          therefore judges internal consistency only:
        </p>
        <ul>
          <li><strong>The exclusions lower unhedged capital, as designed.</strong></li>
          <li><strong>The opt-in is consistent for BA-CVA users, not for SA-CVA users.</strong> For an SA-CVA bank it raises the requirement, because the vega a CDS cannot hedge comes in. That is a feature of the design, not of the calibration, although its size rests on σ.</li>
          <li><strong>The SA-CVA cost need not be borne.</strong> The bank could opt the name in under BA-CVA (Art. 382(4a) with 382a(3)(a)). Not computed, and supervisory acceptance is open.</li>
          <li><strong>The supervisor's view is partial.</strong> The Art. 382(4b) report covers the excluded transactions alone, says nothing about their hedges, and is not the whole-book effect of the exclusions (<Link to="/exemptions">Module 5</Link>, Section 7).</li>
        </ul>
        <Note title="Further research the thesis names">
          (1) Calibrate σ, and the mean reversion with it, to swaption prices, bumping implied volatilities; the euro mean reversion was negative in spring 2020. (2) Admit
          swaptions and swaps as exposure hedges under Art. 386(2)(b), which tests directly whether the SA-CVA floor can fall below the BA-CVA floor. (3) Index and proxy CDS
          at the Table 2 correlations, and the counterparty risk of the hedge. (4) Wrong-way risk, a larger multi-currency book with options, and calibrated κ and F.
          (5) Supervisory data from the Art. 382(4b) reports, if they became available.
        </Note>
      </Section>

      <Section title="7. Reproducibility">
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
          'BA-CVA is the cheaper approach for this book with and without hedges at the assumed σ. The exclusions narrow SA-CVA’s disadvantage by 45 % (full matched hedge) without reversing it.',
          'Mixing the approaches gains nothing: the best split is all BA-CVA in all 24 cells.',
          'Unhedged, the ranking depends on σ (break-even ≈ 66 bp). Hedged, it does not.',
          'Recognising interest rate hedges under SA-CVA, or a calibrated lower σ, are the two things most likely to change the answer.',
          'The opt-in is internally consistent for BA-CVA users only, and the Art. 382(4b) report cannot show the hedging cliff.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why does BA-CVA not move at all in the robustness runs on σ, a and the curve?',
            options: ['It uses a fixed CVA', 'Its exposure comes from SA-CCR, not from the simulation', 'It is floored', 'It only uses credit spreads'],
            answer: 1,
            why: 'The thesis assumes an SA-CCR institution, and SA-CCR has no exposure model inside. Art. 384(2) also admits the other methods of Title II Ch. 6, so this is “as assumed here”.',
          },
          {
            q: 'Which extension would most likely help SA-CVA?',
            options: ['A higher σ', 'More CDS notional', 'Recognised interest rate swap or swaption hedges of the exposure component', 'More exempt counterparties under BA-CVA'],
            answer: 2,
            why: 'They would attack K_IR and K_vega, the floor a CDS cannot reach.',
          },
        ]}
      />
      <DefenceCorner id="results" />
      <LessonFooter id="results" />
    </article>
  );
}
