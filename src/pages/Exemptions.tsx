import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart, line, palette } from '../components/Chart';
import { Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { DefenceCorner, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways, Term, TryThis } from '../components/Lesson';
import { exemptionLetters, portfolio, sectorLabels } from '../data/portfolio';
import { cell, headline, rationalCell, results, saCvaFromSensitivities } from '../data/results';
import { kReduced, scva } from '../models/baCva';

type A = 'ba_cva' | 'sa_cva';

export default function Exemptions() {
  const [exempt, setExempt] = useState<Record<string, boolean>>(() => Object.fromEntries(portfolio.map((c) => [c.name, c.exemptEu])));
  const inScope = portfolio.filter((c) => !exempt[c.name]);
  const allScva = useMemo(() => Object.fromEntries(portfolio.map((c) => [c.name, scva(c)])), []);
  const ba = inScope.length ? kReduced(inScope.map((c) => allScva[c.name])) : 0;
  const sa = inScope.length ? saCvaFromSensitivities(inScope.map((c) => c.name)) : { total: 0, kCcs: 0, kIr: 0, kVega: 0 };
  const share = 1 - inScope.reduce((s, c) => s + allScva[c.name], 0) / Object.values(allScva).reduce((a, b) => a + b, 0);
  const preset = (p: 'eu' | 'basel') => setExempt(Object.fromEntries(portfolio.map((c) => [c.name, p === 'eu' ? c.exemptEu : false])));

  // The rational cell (experiment F's pure endpoints) against Basel scope, along the hedge ratios of F.
  const [tenor, setTenor] = useState<'matched' | 'five_year'>('matched');
  const hs = [0, 0.5, 0.8, 1];
  const rc = hs.map((h) => rationalCell(tenor, h));
  const full = rc[rc.length - 1];
  const gapCut = 1 - full.eu.gap / full.basel.gap;
  const gapChart = [
    { type: 'bar', name: 'Basel scope', x: hs.map((h) => `h = ${h}`), y: rc.map((r) => r.basel.gap), marker: { color: palette[5] } },
    { type: 'bar', name: 'EU scope, excluded names unhedged', x: hs.map((h) => `h = ${h}`), y: rc.map((r) => r.eu.gap), marker: { color: palette[2] } },
  ];

  // Figure 6.1 of the thesis: six groups at the 5-year tenor, total capital incl. the Art. 386(5) charge.
  const pick = (scope: 'basel' | 'eu', a: A, h: number, optIn = false) => cell(results.hedgeLadder, scope, a, optIn).find((r) => r.hedge_ratio === h)!;
  const rat5 = rationalCell('five_year', 1).eu;
  const labels = ['Basel, unhedged', 'EU, unhedged', 'Basel, full hedge', 'EU, full hedge, excluded unhedged', 'EU, all hedged, no opt-in', 'EU, all hedged, opt-in'];
  const cellsFor = (a: A) => {
    const rational = { cva_charge: a === 'ba_cva' ? rat5.ba : rat5.sa, frtb_charge: 0 };
    return [pick('basel', a, 0), pick('eu', a, 0), pick('basel', a, 1), rational, pick('eu', a, 1), pick('eu', a, 1, true)];
  };
  const fig = (['ba_cva', 'sa_cva'] as const).flatMap((a, i) => [
    { type: 'bar', name: `${a === 'ba_cva' ? 'BA' : 'SA'}-CVA: CVA charge`, x: labels, y: cellsFor(a).map((r) => r.cva_charge), offsetgroup: a, marker: { color: palette[i] } },
    { type: 'bar', name: `${a === 'ba_cva' ? 'BA' : 'SA'}-CVA: Title IV charge`, x: labels, y: cellsFor(a).map((r) => r.frtb_charge), offsetgroup: a, base: cellsFor(a).map((r) => r.cva_charge), marker: { color: palette[i], pattern: { shape: '/' }, opacity: 0.55 } },
  ]);

  const ladder = (a: A) => cell(results.hedgeLadder, 'eu', a, false);
  const cs = (a: A, optIn: boolean) =>
    results.exemptShare.filter((r) => r.scope === 'eu' && r.approach === a && r.opt_in === optIn).sort((x, y) => x.exempt_share - y.exempt_share);

  return (
    <article>
      <LessonHeader id="exemptions" />

      <Section title="1. What Art. 382(4) exempts">
        <InPlainWords>
          CRR3 takes the transactions with several kinds of counterparty out of the CVA charge. The thesis treats these exclusions as EU-specific: whether they
          have a Basel counterpart is a MAR50 check still open in the draft. No capital is held against excluded transactions. The bank must still compute what
          they would require and <em>report</em> it to its supervisor (Art. 382(4b)), but it does not disclose that figure. The thesis does not rely on a stated
          purpose of the exclusions: the draft has not yet sourced one (the recitals of Regulation (EU) 2024/1623), so Chapter 8 judges them by internal consistency only.
        </InPlainWords>
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Point</th><th>Who</th><th>In the book</th></tr></thead>
            <tbody>
              {Object.entries(exemptionLetters).map(([l, d]) => (
                <tr key={l}>
                  <td>{l}</td>
                  <td>{d}</td>
                  <td>{portfolio.filter((c) => c.exemptBasis === l).map((c) => c.name).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note title="Edge cases the book is built to show">
          Energy H and Telecom K are corporates <em>above</em> the EMIR clearing threshold, so they stay in. Pension fund E has a new trade after the EMIR
          transition expired (18 June 2021, extended to 18 June 2023), so point (c) no longer applies. Legacy trades stay exempt for life, but this is a 2026
          trade. The choice carries weight: the fund holds {headline.pensionShareSCVA} % of Σ SCVA<sub>c</sub>. Third-country sovereign P is CQS 4 with no 0 % risk
          weight, so point (d) does not apply. In total, the exemptions remove {headline.exemptSharePct} % of Σ SCVA<sub>c</sub>.
        </Note>
      </Section>

      <Section title="2. Design your own exemptions (live, unhedged)">
        <div className="sector-picker">
          <button className="button" type="button" onClick={() => preset('eu')}>CRR3 exemptions</button>
          <button className="button" type="button" onClick={() => preset('basel')}>Exclusions off (“Basel scope”)</button>
        </div>
        <Stats
          items={[
            { label: 'Counterparties in the charge', value: `${inScope.length} of ${portfolio.length}` },
            { label: 'Share of Σ SCVA exempted', value: pct(share, 1) },
            { label: 'BA-CVA', value: num(ba, 3) },
            { label: 'SA-CVA', value: num(sa.total, 3), hint: `vega ${num(sa.kVega, 2)}` },
            { label: 'SA − BA', value: num(sa.total - ba, 3), hint: ba < sa.total ? 'BA-CVA cheaper' : 'SA-CVA cheaper' },
          ]}
        />
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Exempt?</th><th>Counterparty</th><th>Sector</th><th>CQS</th><th>Point</th><th>SCVA_c</th></tr></thead>
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
            `Start from the CRR3 preset: BA-CVA falls from 8.47 to 7.13 and SA-CVA from 10.54 to 8.61. BA-CVA stays cheaper, but the gap narrows from ${headline.baselGapUnhedged} to ${headline.euGapUnhedged}.`,
            'Exempt the pension fund too. It carries the largest vega, so SA-CVA falls faster than BA-CVA. This is the counterfactual the thesis cannot rule out for a legacy trade.',
            'Note what “Basel scope” means here: the CRR3 formulas with the exclusions switched off. It isolates Art. 382(4); it is not the MAR50 standard.',
          ]}
        />
      </Section>

      <Section title="3. The rational cell: the gap narrows, it does not close">
        <p>
          Which EU cell should be compared with Basel once the bank hedges? A capital-minimising bank without the opt-in would not buy a CDS it cannot
          recognise, so it hedges only the names in the calculation. The 20 Nov draft makes this <Term name="Rational cell">rational cell</Term> the EU baseline
          (Table 6.1). Its numbers come from the pure endpoints of experiment F, which hedges exactly that way.
        </p>
        <Toggle label="CDS tenor" value={tenor} onChange={setTenor} options={[{ value: 'matched', label: 'Matched tenor' }, { value: 'five_year', label: '5-year CDS' }]} />
        <Chart data={gapChart as never} y="SA-CVA minus BA-CVA (EUR m)" height={300} layout={{ barmode: 'group' }} />
        <Stats
          items={[
            { label: 'Basel, full hedge', value: `${num(full.basel.sa, 2)} vs ${num(full.basel.ba, 2)}`, hint: 'SA-CVA vs BA-CVA' },
            { label: 'EU rational, full hedge', value: `${num(full.eu.sa, 2)} vs ${num(full.eu.ba, 2)}`, hint: 'SA-CVA vs BA-CVA' },
            { label: 'Gap', value: `${num(full.basel.gap, 2)} → ${num(full.eu.gap, 2)}` },
            { label: 'Disadvantage removed', value: pct(gapCut, 0), hint: tenor === 'matched' ? 'thesis: 45.01 %' : 'thesis: 18.16 %' },
          ]}
        />
        <Example title="Why the exclusions help SA-CVA relatively">
          At a full hedge BA-CVA sits at its floor, β · K<sub>reduced</sub>. Removing the nine excluded names therefore saves only a quarter of their diversified
          charge: 0.25 × (8.47 − 7.13) = 0.34, from {num(full.basel.ba, 2)} to {num(full.eu.ba, 2)}. SA-CVA instead loses their whole unhedgeable charge, above all their
          vega ({headline.baselVegaFullMatched} → {headline.euRatVegaFullMatched} at a full matched hedge), so it falls from {num(full.basel.sa, 2)} to {num(full.eu.sa, 2)}. The gap
          shrinks, but at every hedge ratio and both tenors SA-CVA remains the dearer approach.
        </Example>
        <Note title="This result does not need the Title IV reading">
          The rational cell carries no hedge on an excluded name, so no Art. 386(5) charge appears in it. The 45 % narrowing therefore holds whatever one thinks of
          the reading in Section 4. It does rest on zero hedging cost and on hedge notionals that differ between the approaches (<Link to="/hedging">Module 6</Link>).
        </Note>
      </Section>

      <Section title="4. Hedging an excluded counterparty: the hedging cliff">
        <p>
          A bank may still want to hedge an exempt corporate, for example because its accounting CVA is volatile. That is the{' '}
          <Term name="Economic-hedge case">economic-hedge case</Term>. The CDS reduces no CVA requirement, because the name is outside the charge. On the
          thesis's reading it is also a non-recognised position under Title IV, so it attracts a <Term name="Market-risk charge">market-risk charge</Term>.
        </p>
        <Note title="A reading, not a rule">
          Art. 386(4) frees from Title IV only eligible hedges entered into with third parties and <em>included in the calculation</em>. Art. 386(5) subjects
          positions not recognised as eligible hedges to Title IV. Neither paragraph addresses a CDS that would be eligible but references a counterparty outside the
          calculation. The draft now calls the Title IV treatment a reading everywhere. On another reading the hedge would be capital-neutral, and the first half of P3
          would become neutrality.
        </Note>
        <Chart
          data={[
            line(ladder('ba_cva').map((r) => r.hedge_ratio!), ladder('ba_cva').map((r) => r.cva_charge), 'BA-CVA: CVA charge', { line: { color: palette[0] } }),
            line(ladder('ba_cva').map((r) => r.hedge_ratio!), ladder('ba_cva').map((r) => r.frtb_charge), 'BA-CVA: Title IV charge', { line: { color: palette[0], dash: 'dash' } }),
            line(ladder('sa_cva').map((r) => r.hedge_ratio!), ladder('sa_cva').map((r) => r.cva_charge), 'SA-CVA: CVA charge', { line: { color: palette[1] } }),
            line(ladder('sa_cva').map((r) => r.hedge_ratio!), ladder('sa_cva').map((r) => r.frtb_charge), 'SA-CVA: Title IV charge', { line: { color: palette[1], dash: 'dash' } }),
          ]}
          x="Hedge ratio (every name hedged, 5-year CDS)"
          y="EUR m, EU scope, no opt-in"
          height={320}
        />
        <p>
          At full hedge, BA-CVA carries {headline.frtbPenaltyBA} EUR m of Title IV charge and SA-CVA {headline.frtbPenaltySA}. The difference comes from the notional:
          BA-CVA sizes the CDS to SCVA and buys {headline.hedgeNotionalBA} EUR m in total, while SA-CVA sizes to a spread delta and buys {headline.hedgeNotionalSA}. The Title IV
          charge does not read the CVA approach, so at a common notional it is identical. A test in the thesis repo checks exactly that.
        </p>
      </Section>

      <Section title="5. The opt-in, Art. 382(4a)">
        <p>
          The opt-in is a question only in the economic-hedge case: the rational bank has no hedge on an excluded name to bring in. For a bank that holds such a
          hedge, opting in pays if the CVA capital added is smaller than the Title IV charge removed:
        </p>
        <TexBlock>{String.raw`\Delta K_{\mathrm{CVA}}(c\ \text{in, hedged by}\ \bar B_c) \;<\; K_{\mathrm{MR}}(\bar B_c)`}</TexBlock>
        <p>The right side is the same for both approaches. The left side is not:</p>
        <ul>
          <li><strong>BA-CVA:</strong> a name hedged to r = 1 adds only its share of the β floor. The opt-in takes capital from {headline.euBAnoOptInFull} back to {headline.euBAoptInFull} EUR m.</li>
          <li><strong>SA-CVA:</strong> the name brings its vega, which its CDS cannot offset. The opt-in <em>raises</em> capital from {headline.euSAnoOptInFull} back to {headline.euSAoptInFull} EUR m.</li>
        </ul>
        <Chart data={fig as never} y="Total capital, 5-year tenor (EUR m)" height={400} layout={{ barmode: 'group', xaxis: { tickangle: -20 } }} />
        <Example title="Reading the chart (Figure 6.1 of the thesis)">
          Hatched blocks are the Title IV charge. They appear only in “EU, all hedged, no opt-in”. The opt-in returns <strong>both</strong> approaches to the Basel level,
          lowering BA-CVA and raising SA-CVA. An earlier draft said the opt-in reverses the exemption effect only under BA-CVA; the review panel found that wrong.
          The rational cell (fourth group) is the cheapest EU cell under both approaches, below the opt-in. A capital-minimising bank neither hedges excluded names
          nor opts in.
        </Example>
        <Note title="Two readings to know">
          <strong>Per counterparty, hedged names only.</strong> Art. 382(4a) does not say whether the opt-in works name by name or for all excluded transactions at
          once. The thesis takes the per-name reading, the most favourable to the institution. An all-or-nothing opt-in would also pull in unhedged names and
          probably widen the asymmetry.<br />
          <strong>An SA-CVA bank can opt in under BA-CVA.</strong> Art. 382(4a) admits any approach of Art. 382a(1), and Art. 382a(3)(a) allows different
          approaches per counterparty. So the SA-CVA cost of the opt-in need not be borne. The thesis names this cell in §8.3 but does not compute it, and leaves open whether
          a supervisor would accept the split.
        </Note>
      </Section>

      <Section title="6. How large an excluded share would change the order?">
        <p>Experiment C moves counterparties into the exempt set one at a time, at an 80 % hedge ratio, with <strong>every name hedged</strong> (the economic-hedge case):</p>
        <ExemptShareChart cs={cs} />
        <p className="muted">
          Without the opt-in, BA-CVA gets dearer as the share grows (more hedges fall under Title IV) and SA-CVA cheaper (fewer names carry vega). At {headline.secondSharePct} %
          BA-CVA still requires less (6.12 vs 6.77). At the top of the ladder, {headline.maxExemptSharePct} %, the order reverses ({headline.topShareEUnoOptSA} vs{' '}
          {headline.topShareEUnoOptBA}). With the opt-in BA-CVA stays cheaper ({headline.topShareEUoptBA} vs {headline.topShareEUoptSA}). Experiment D finds one crossing in 51 cells.
        </p>
      </Section>

      <Section title="7. What the supervisor sees: Art. 382(4b)">
        <p>
          Institutions “shall report to their competent authorities the results of the calculations of the own funds requirements for CVA risk for all transactions
          referred to in paragraph 4”, using the approach they would have used. Chapter 8 draws three consequences, which are arguments rather than results:
        </p>
        <ol>
          <li>The supervisor sees the size of the unheld risk and the approach the bank would have applied.</li>
          <li>The text says nothing about hedges of those names or their Title IV charge, so the hedging cliff stays invisible unless hedge data are reported separately.</li>
          <li>
            The figure covers the excluded transactions alone. Both approaches aggregate through square roots, so it is <em>not</em> the difference between whole-book
            requirements with and without the exclusions, which is what this thesis measures.
          </li>
        </ol>
        <p className="muted">
          One sentence in Ch. 5 §5.2 still says that the Basel-scope figure is the Art. 382(4b) figure. The draft flags it as probably wrong, for the reason in point 3.
        </p>
      </Section>

      <Takeaways
        items={[
          'Art. 382(4) excludes small corporates, intragroup trades, pension funds during the EMIR transition and 0 %-weighted public bodies. Here that is 25 % of Σ SCVA.',
          'Unhedged, the exclusions lower both charges and narrow the gap from 2.07 to 1.48 EUR m. In the rational hedged cell the gap falls from 2.45 to 1.35 (−45 %), and BA-CVA stays cheaper.',
          'The mechanism: BA-CVA at its floor loses only a quarter of the excluded names’ charge; SA-CVA loses their whole vega.',
          'On the thesis’s reading, a CDS on an excluded name without the opt-in is pure cost: no relief plus a Title IV charge. That is the hedging cliff.',
          'With every name hedged, the opt-in returns both approaches to the Basel level: BA-CVA down, SA-CVA up.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why is Energy H not exempt even though it is a non-financial corporate?',
            options: ['It is rated CQS 3', 'It is above the EMIR clearing threshold (NFC+)', 'Its swap is too long', 'It is in a different sector'],
            answer: 1,
            why: 'Point (a) covers only non-financial counterparties below the EMIR clearing threshold.',
          },
          {
            q: 'In the rational EU cell at a full matched hedge, BA-CVA falls from 2.12 to 1.78 but SA-CVA from 4.57 to 3.13. Why so different?',
            options: ['DS_CVA applies only to BA-CVA', 'BA-CVA is at its floor, so it saves only β of the excluded charge; SA-CVA loses the names’ unhedgeable vega', 'SA-CVA has more counterparties', 'The Title IV charge'],
            answer: 1,
            why: '0.25 × (8.47 − 7.13) = 0.34 for BA-CVA; SA-CVA vega alone falls from 3.38 to 2.20.',
          },
          {
            q: 'With every name hedged, what does the opt-in do?',
            options: ['Lowers both approaches', 'Returns both to the Basel level: lowers BA-CVA, raises SA-CVA', 'Lowers only SA-CVA', 'Nothing'],
            answer: 1,
            why: 'BA-CVA 4.14 → 2.12 (the Title IV charge goes, the hedges are recognised); SA-CVA 8.08 → 8.92 (vega comes in).',
          },
          {
            q: 'Does the 45 % narrowing of the gap depend on the Title IV reading?',
            options: ['Yes, entirely', 'No: the rational cell has no hedge on an excluded name, so no Title IV charge', 'Only at the 5-year tenor', 'Only with the opt-in'],
            answer: 1,
            why: 'The reading matters only in the economic-hedge case and for the opt-in comparison.',
          },
        ]}
      />
      <DefenceCorner id="exemptions" />
      <LessonFooter id="exemptions" />
    </article>
  );
}

function ExemptShareChart({ cs }: { cs: (a: A, optIn: boolean) => { exempt_share: number; total_capital: number }[] }) {
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
        x="Exempt share of Σ SCVA (%), all names hedged at 80 %"
        y="Total capital (EUR m)"
        height={300}
      />
    </>
  );
}
