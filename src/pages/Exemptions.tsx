import { useMemo, useState } from 'react';
import { Chart, line, palette } from '../components/Chart';
import { Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways, Term, TryThis } from '../components/Lesson';
import { exemptionLetters, portfolio, sectorLabels } from '../data/portfolio';
import { cell, headline, results, saCvaFromSensitivities } from '../data/results';
import { kReduced, scva } from '../models/baCva';

export default function Exemptions() {
  const [exempt, setExempt] = useState<Record<string, boolean>>(() => Object.fromEntries(portfolio.map((c) => [c.name, c.exemptEu])));
  const inScope = portfolio.filter((c) => !exempt[c.name]);
  const allScva = useMemo(() => Object.fromEntries(portfolio.map((c) => [c.name, scva(c)])), []);
  const ba = inScope.length ? kReduced(inScope.map((c) => allScva[c.name])) : 0;
  const sa = inScope.length ? saCvaFromSensitivities(inScope.map((c) => c.name)) : { total: 0, kCcs: 0, kIr: 0, kVega: 0 };
  const share = 1 - inScope.reduce((s, c) => s + allScva[c.name], 0) / Object.values(allScva).reduce((a, b) => a + b, 0);
  const preset = (p: 'eu' | 'basel' | 'none') =>
    setExempt(Object.fromEntries(portfolio.map((c) => [c.name, p === 'eu' ? c.exemptEu : false])));

  // Five cells of the thesis's exemption figure, total capital incl. the Art. 386(5) charge.
  const pick = (scope: 'basel' | 'eu', approach: 'ba_cva' | 'sa_cva', h: number, optIn = false) =>
    cell(results.hedgeLadder, scope, approach, optIn).find((r) => r.hedge_ratio === h)!;
  const labels = ['Basel, unhedged', 'EU, unhedged', 'Basel, full hedge', 'EU, full hedge, no opt-in', 'EU, full hedge, opt-in'];
  const cellsFor = (a: 'ba_cva' | 'sa_cva') => [pick('basel', a, 0), pick('eu', a, 0), pick('basel', a, 1), pick('eu', a, 1), pick('eu', a, 1, true)];
  const fig = (['ba_cva', 'sa_cva'] as const).flatMap((a, i) => [
    { type: 'bar', name: `${a === 'ba_cva' ? 'BA' : 'SA'}-CVA: CVA charge`, x: labels, y: cellsFor(a).map((r) => r.cva_charge), offsetgroup: a, marker: { color: palette[i] } },
    { type: 'bar', name: `${a === 'ba_cva' ? 'BA' : 'SA'}-CVA: market-risk charge`, x: labels, y: cellsFor(a).map((r) => r.frtb_charge), offsetgroup: a, base: cellsFor(a).map((r) => r.cva_charge), marker: { color: palette[i], pattern: { shape: '/' }, opacity: 0.55 } },
  ]);

  const ladder = (a: 'ba_cva' | 'sa_cva') => cell(results.hedgeLadder, 'eu', a, false);
  const cs = (a: 'ba_cva' | 'sa_cva', optIn: boolean) =>
    results.exemptShare.filter((r) => r.scope === 'eu' && r.approach === a && r.opt_in === optIn).sort((x, y) => x.exempt_share - y.exempt_share);

  return (
    <article>
      <LessonHeader id="exemptions" />

      <Section title="1. What Art. 382(4) exempts">
        <InPlainWords>
          When the EU wrote the CVA charge into law in 2013, it took out several kinds of counterparty that Basel keeps in. The aim was to
          avoid making hedging costlier for the real economy and for the public sector. CRR3 keeps those exemptions. Their trades
          are still computed and reported (Art. 382(4b)), but no capital is held against them.
        </InPlainWords>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Letter</th><th>Who</th><th>In the book</th></tr></thead>
            <tbody>
              {Object.entries(exemptionLetters).map(([l, d]) => (
                <tr key={l}>
                  <td>{l}</td>
                  <td style={{ whiteSpace: 'normal' }}>{d}</td>
                  <td style={{ whiteSpace: 'normal' }}>{portfolio.filter((c) => c.exemptBasis === l).map((c) => c.name).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note title="Edge cases the book is built to show">
          Energy H and Telecom K are corporates <em>above</em> the EMIR clearing threshold, so they stay in. Pension fund E has a new trade
          after the EMIR transition expired, so letter (c) no longer applies. Third-country sovereign P is CQS 4 with no 0 % risk weight,
          so letter (d) does not apply. In total, the exemptions remove {headline.exemptSharePct} % of Σ SCVA<sub>c</sub>.
        </Note>
      </Section>

      <Section title="2. Design your own exemptions (live, unhedged)">
        <div className="sector-picker">
          <button className="button" type="button" onClick={() => preset('eu')}>CRR3 exemptions</button>
          <button className="button" type="button" onClick={() => preset('basel')}>Basel: none</button>
        </div>
        <Stats
          items={[
            { label: 'Counterparties in the charge', value: `${inScope.length} of ${portfolio.length}` },
            { label: 'Share of Σ SCVA exempted', value: pct(share, 1) },
            { label: 'BA-CVA', value: num(ba, 3) },
            { label: 'SA-CVA', value: num(sa.total, 3), hint: `vega ${num(sa.kVega, 2)}` },
            { label: 'Cheaper', value: ba < sa.total ? 'BA-CVA' : 'SA-CVA' },
          ]}
        />
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Exempt?</th><th>Counterparty</th><th>Sector</th><th>CQS</th><th>Letter</th><th>SCVA_c</th></tr></thead>
            <tbody>
              {portfolio.map((c) => (
                <tr key={c.name} className={exempt[c.name] ? 'row-muted' : ''}>
                  <td><input type="checkbox" checked={exempt[c.name]} onChange={(e) => setExempt((x) => ({ ...x, [c.name]: e.target.checked }))} aria-label={`Exempt ${c.name}`} /></td>
                  <td title={c.note}>{c.name}</td>
                  <td>{sectorLabels[c.sector]}</td>
                  <td>{c.cqs ?? 'NR'}</td>
                  <td>{c.exemptBasis ?? '—'}</td>
                  <td>{num(allScva[c.name], 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TryThis
          items={[
            'Start from the CRR3 preset: both charges fall, BA-CVA from 8.47 to 7.13 and SA-CVA from 10.54 to 8.61, and BA-CVA stays cheaper.',
            'Exempt the pension fund too. It carries the largest vega, so SA-CVA falls faster than BA-CVA.',
            'Try to find a set of exemptions that makes SA-CVA cheaper unhedged. The thesis finds the order reverses at about 59 % exempt (experiment C, hedged at 80 %).',
          ]}
        />
      </Section>

      <Section title="3. Hedging an exempt counterparty: Art. 386(5)">
        <p>
          Here is the catch. A bank may still want to hedge an exempt corporate, for example because its accounting CVA is volatile. But
          a CDS that is not recognised as a CVA hedge is a trading-book position, and it attracts a{' '}
          <Term name="Market-risk charge">market-risk charge</Term> under FRTB (Title IV, Art. 386(5)). It saves no CVA capital, because the
          counterparty is outside the charge. The capital incentive to hedge it is <strong>negative</strong>.
        </p>
        <Chart
          data={[
            line(ladder('ba_cva').map((r) => r.hedge_ratio!), ladder('ba_cva').map((r) => r.cva_charge), 'BA-CVA: CVA charge', { line: { color: palette[0] } }),
            line(ladder('ba_cva').map((r) => r.hedge_ratio!), ladder('ba_cva').map((r) => r.frtb_charge), 'BA-CVA: market-risk charge', { line: { color: palette[0], dash: 'dash' } }),
            line(ladder('sa_cva').map((r) => r.hedge_ratio!), ladder('sa_cva').map((r) => r.cva_charge), 'SA-CVA: CVA charge', { line: { color: palette[1] } }),
            line(ladder('sa_cva').map((r) => r.hedge_ratio!), ladder('sa_cva').map((r) => r.frtb_charge), 'SA-CVA: market-risk charge', { line: { color: palette[1], dash: 'dash' } }),
          ]}
          x="Hedge ratio (every counterparty hedged, 5-year CDS)"
          y="EUR m, EU scope, no opt-in"
          height={320}
        />
        <p>
          At full hedge, BA-CVA carries {headline.frtbPenaltyBA} EUR m of market-risk charge and SA-CVA {headline.frtbPenaltySA}. The difference comes from the notional:
          BA-CVA sizes CDS to SCVA and buys {headline.hedgeNotionalBA} EUR m in total, while SA-CVA sizes to a spread delta and buys {headline.hedgeNotionalSA}.
          Per euro of notional the FRTB charge is the same, because it does not read the CVA approach.
        </p>
      </Section>

      <Section title="4. The opt-in, Art. 382(4a)">
        <p>CRR3 lets the bank bring a hedged exempt counterparty back into the CVA charge. It pays if the extra CVA capital is smaller than the market-risk charge it removes:</p>
        <TexBlock>{String.raw`\Delta K_{\mathrm{CVA}}(c\ \text{in, hedged by}\ \bar B_c) \;<\; K_{\mathrm{MR}}(\bar B_c)`}</TexBlock>
        <p>The right side is the same for both approaches. The left side is not:</p>
        <ul>
          <li><strong>BA-CVA:</strong> a counterparty hedged to r = 1 adds only its share of the β floor. The opt-in takes EU-scope capital from {headline.euBAnoOptInFull} to {headline.euBAoptInFull} EUR m.</li>
          <li><strong>SA-CVA:</strong> the counterparty brings its vega, which its CDS cannot offset. The opt-in <em>raises</em> capital from {headline.euSAnoOptInFull} to {headline.euSAoptInFull} EUR m.</li>
        </ul>
        <Chart data={fig as never} y="Total capital (EUR m)" height={380} layout={{ barmode: 'group', xaxis: { tickangle: -15 } }} />
        <Example title="Reading the chart">
          Hatched blocks are the market-risk charge on unrecognised hedges. They appear only in the "EU, full hedge, no opt-in" column. With the opt-in,
          BA-CVA drops back to the Basel floor, while SA-CVA rises to its Basel level. This is prediction <strong>P3</strong>.
        </Example>
      </Section>

      <Section title="5. How large an exempt share would change the order?">
        <p>Experiment C moves counterparties into the exempt set one at a time, at an 80 % hedge ratio (EU scope):</p>
        <ExemptShareChart cs={cs} />
        <p className="muted">
          Without the opt-in, BA-CVA gets dearer as the exempt share grows (more hedges fall under FRTB), and SA-CVA gets cheaper (fewer
          names carry vega). They cross only near the top of the ladder.
        </p>
      </Section>

      <Takeaways
        items={[
          'Art. 382(4) exempts small corporates, intragroup trades, some pension funds and 0 %-weighted sovereigns. Here that is 25 % of Σ SCVA.',
          'The exemptions lower both charges, and BA-CVA stays cheaper unhedged.',
          'A CDS on an exempt name without the opt-in saves nothing and adds an FRTB charge (Art. 386(5)).',
          'The opt-in pays under BA-CVA (the hedge is recognised, down to the floor) and costs capital under SA-CVA (vega comes in).',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why is Energy H not exempt even though it is a non-financial corporate?',
            options: ['It is rated CQS 3', 'It is above the EMIR clearing threshold (NFC+)', 'Its swap is too long', 'It is in a different sector'],
            answer: 1,
            why: 'Letter (a) covers only non-financial counterparties below the EMIR clearing threshold.',
          },
          {
            q: 'Under SA-CVA, opting a hedged exempt counterparty in…',
            options: ['always lowers capital', 'raises capital here, because its vega enters and the CDS cannot offset it', 'has no effect', 'is not allowed'],
            answer: 1,
            why: 'The FRTB charge disappears, but the vega added is larger: 8.08 → 8.92 EUR m at full hedge.',
          },
        ]}
      />
      <LessonFooter id="exemptions" />
    </article>
  );
}

function ExemptShareChart({ cs }: { cs: (a: 'ba_cva' | 'sa_cva', optIn: boolean) => { exempt_share: number; total_capital: number }[] }) {
  const [optIn, setOptIn] = useState<'no' | 'yes'>('no');
  const o = optIn === 'yes';
  return (
    <>
      <Toggle label="Opt-in" value={optIn} onChange={setOptIn} options={[{ value: 'no', label: 'No opt-in' }, { value: 'yes', label: 'Opt-in' }]} />
      <Chart
        data={[
          line(cs('ba_cva', o).map((r) => r.exempt_share * 100), cs('ba_cva', o).map((r) => r.total_capital), 'BA-CVA', { mode: 'lines+markers' }),
          line(cs('sa_cva', o).map((r) => r.exempt_share * 100), cs('sa_cva', o).map((r) => r.total_capital), 'SA-CVA', { mode: 'lines+markers' }),
        ]}
        x="Exempt share of Σ SCVA (%)"
        y="Total capital (EUR m)"
        height={300}
      />
    </>
  );
}
