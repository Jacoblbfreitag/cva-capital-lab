import { Link } from 'react-router-dom';
import { Chart, palette } from '../components/Chart';
import { Stats } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways, Term } from '../components/Lesson';
import { headline } from '../data/results';
import { portfolio, sectorLabels, totalNotional } from '../data/portfolio';

export default function Thesis() {
  const notional = portfolio.reduce((s, c) => s + totalNotional(c), 0);
  const nExempt = portfolio.filter((c) => c.exemptEu).length;
  const cells = ['Basel scope', 'EU scope'];
  const chart = [
    { x: cells, y: [headline.baselBA, headline.euBA], name: 'BA-CVA', type: 'bar', marker: { color: palette[0] } },
    { x: cells, y: [headline.baselSA, headline.euSA], name: 'SA-CVA', type: 'bar', marker: { color: palette[1] } },
  ];
  return (
    <article>
      <LessonHeader id="thesis" />

      <Section title="1. The question">
        <InPlainWords>
          <p>
            When a bank trades a swap with a company and the company might default, the bank's accounting books a cost for
            that risk: the <Term name="CVA">credit valuation adjustment</Term>. CVA moves every day with credit spreads and
            interest rates, and in 2007–09 those moves caused large losses. So regulators make banks hold capital against{' '}
            <Term name="CVA risk">CVA risk</Term>.
          </p>
          <p style={{ marginBottom: 0 }}>
            The EU's version of the rules, <Term name="CRR3">CRR3</Term>, gives banks two ways to compute that capital and
            exempts several kinds of counterparty that the global Basel standard does not. The thesis asks what those
            exemptions do to a bank's choices.
          </p>
        </InPlainWords>
        <blockquote className="rq">
          How do the EU's exemptions from the CVA capital requirement in CRR3 affect banks' choice between SA-CVA and BA-CVA,
          and what are the consequences for banks' incentives to hedge CVA risk?
        </blockquote>
      </Section>

      <Section title="2. The two approaches">
        <div className="grid-2">
          <div className="mini">
            <h3>BA-CVA, the basic approach (Art. 384)</h3>
            <p>
              A supervisory formula. Each counterparty gets a risk weight by sector and rating. Its exposure comes from
              SA-CCR, a formula with no simulation. CDS hedges are recognised, but a quarter of the unhedged charge always remains
              (the <Term name="Beta floor">β floor</Term>).
            </p>
          </div>
          <div className="mini">
            <h3>SA-CVA, the standardised approach (Art. 383)</h3>
            <p>
              Built on the bank's own CVA model. The bank computes how CVA moves with credit spreads, interest rates and
              volatility (<Term name="Sensitivity">sensitivities</Term>), and the rules turn those into capital, much like the
              market-risk FRTB. It needs supervisory approval and a real exposure model.
            </p>
          </div>
        </div>
        <Note title="The EU twist">
          Art. 382(4) takes the trades of several counterparty types out of the charge: corporates below the EMIR clearing threshold,
          intragroup trades, some pension funds, and sovereigns with a 0 % risk weight. Basel has no such exemptions. CRR3 also lets
          a bank <em>opt</em> a hedged exempt counterparty back in (Art. 382(4a)), and charges market-risk capital on CDS
          that hedge exempt counterparties outside the CVA charge (Art. 386(5)).
        </Note>
      </Section>

      <Section title="3. What the bank decides">
        <p>The thesis models a bank that minimises the cost of its capital through three choices:</p>
        <ol>
          <li><strong>How much CDS protection to buy</strong> on each counterparty, B<sub>c</sub>.</li>
          <li><strong>Which exempt counterparties to opt back in</strong>, O, which is possible only if they are hedged.</li>
          <li><strong>Which counterparties go under SA-CVA</strong>, S, and which under BA-CVA (Art. 382a(3) allows a mix).</li>
        </ol>
        <TexBlock>{String.raw`\min_{B,\,O,\,S}\;\kappa\Bigl[K_{\mathrm{SA}}(S,B) + K_{\mathrm{BA}}(I\setminus S,B) + K_{\mathrm{MR}}\bigl(\{B_c\}_{c\in E\setminus O}\bigr)\Bigr] + F\,\mathbf 1\{S\neq\emptyset\} + \psi\textstyle\sum_c B_c`}</TexBlock>
        <p className="muted">
          κ is the cost of equity, F the fixed cost of running SA-CVA, ψ the running cost per unit of CDS notional. K<sub>MR</sub> is
          the market-risk charge on CDS that hedge exempt counterparties left outside the charge.
        </p>
      </Section>

      <Section title="4. The book">
        <Stats
          items={[
            { label: 'Counterparties', value: String(portfolio.length), hint: `${nExempt} exempt in the EU` },
            { label: 'Swap notional', value: `€${notional.toLocaleString('en')}m`, hint: 'EUR interest rate swaps' },
            { label: 'Sectors', value: String(new Set(portfolio.map((c) => c.sector)).size), hint: 'of the 8 in Art. 384(2)' },
            { label: 'Monte Carlo', value: '200 000', hint: 'Hull–White paths, seed 20260831' },
          ]}
        />
        <p>
          A stylised EU bank's swap book: banks, insurers, a hedge fund and a pension fund; corporates above and below the EMIR
          clearing threshold; a sovereign, a municipality and a third-country sovereign. It is designed so that each exemption
          letter applies to some names and not others. <Link to="/exemptions">Module 5</Link> lists every counterparty.
        </p>
        <p className="muted">Sectors used: {[...new Set(portfolio.map((c) => sectorLabels[c.sector]))].join(' · ')}.</p>
      </Section>

      <Section title="5. The headline numbers">
        <Chart data={chart as never} y="Own funds requirement (EUR m)" height={300} layout={{ barmode: 'group' }} />
        <Stats
          items={[
            { label: 'BA-CVA floor, full hedge', value: `${headline.betaFloor}`, hint: 'EUR m, β · K_reduced' },
            { label: 'SA-CVA, full hedge, matched tenor', value: `${headline.matchedSAfullHedge}`, hint: 'EUR m, Basel scope' },
            { label: 'Vega share of unhedged SA-CVA', value: `${headline.baselSAvegaSharePct}%`, hint: `${headline.baselSAvega} EUR m` },
            { label: 'Market-risk charge, EU, no opt-in', value: `${headline.frtbPenaltyBA}`, hint: 'EUR m, BA-CVA at full hedge' },
          ]}
        />
      </Section>

      <Section title="6. Four predictions, four verdicts">
        <div className="table-wrap">
          <table className="data verdicts">
            <thead>
              <tr><th>Prediction</th><th>Statement</th><th>Result</th></tr>
            </thead>
            <tbody>
              <tr><td>P1 · corner hedging under BA-CVA</td><td>Capital is linear in the recognition ratio down to the floor at r = 1, and symmetric beyond it.</td><td className="ok">Confirmed exactly. The hedge tenor acts only through r.</td></tr>
              <tr><td>P2 · a floor under SA-CVA</td><td>A CDS cannot remove the interest rate delta and vega charges.</td><td className="ok">Confirmed. The floor ({headline.matchedSAfloor}) is above the BA-CVA floor ({headline.betaFloor}).</td></tr>
              <tr><td>P3 · excluded counterparties</td><td>Hedging them without the opt-in only adds capital; the opt-in favours BA-CVA.</td><td className="ok">Confirmed. The opt-in takes BA-CVA to its floor and raises SA-CVA.</td></tr>
              <tr><td>P4 · combining approaches</td><td>A mix beats both pure approaches only if counterparties differ enough.</td><td className="no">Condition not met. The best split is all BA-CVA in every cell.</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Takeaways
        items={[
          'CRR3 offers two CVA approaches. The EU exempts several counterparty types that Basel would charge.',
          'BA-CVA rewards a CDS hedge linearly, down to a floor of 25 % of the unhedged charge.',
          'SA-CVA rewards a CDS only on its credit spread part. Interest rate delta and vega stay, and here they exceed the BA-CVA floor.',
          'A hedge on an exempt counterparty is pure cost unless the bank opts in, and the opt-in pays only under BA-CVA.',
          'Both results rest on an uncalibrated volatility and on CDS as the only hedge. Both choices weigh against SA-CVA.',
        ]}
      />

      <Quiz
        questions={[
          {
            q: 'Under BA-CVA, what is the lowest capital a perfect single-name CDS hedge can reach?',
            options: ['Zero', 'β · K_reduced, a quarter of the unhedged charge', 'The SA-CVA charge', 'DS_CVA · K_reduced'],
            answer: 1,
            why: 'Art. 384(2) keeps β = 0.25 of the reduced charge whatever the hedge, so the floor is 0.25 × 8.47 = 2.12 EUR m.',
          },
          {
            q: 'Why can a CDS not take SA-CVA to its floor of zero?',
            options: ['The CDS is not eligible', 'The CDS hedges credit spread delta only; interest rate delta and vega remain', 'SA-CVA ignores hedges', 'R = 0.01 is too large'],
            answer: 1,
            why: 'A CDS has a credit spread sensitivity but (almost) no rate or volatility sensitivity, so K_IR and K_vega are untouched.',
          },
          {
            q: 'A bank buys a CDS on an exempt corporate and does not opt in. What happens to its capital?',
            options: ['It falls', 'Nothing', 'It rises: the CDS is charged under market-risk rules and saves no CVA capital', 'The counterparty is automatically opted in'],
            answer: 2,
            why: 'Art. 386(5): hedges that are not recognised in the CVA charge go into the market-risk charge, so they only add capital.',
          },
        ]}
      />
      <LessonFooter id="thesis" />
    </article>
  );
}
