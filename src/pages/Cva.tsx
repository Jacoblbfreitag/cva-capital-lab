import { useMemo, useState } from 'react';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, bp, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, DefenceCorner, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { headline, results } from '../data/results';
import { regulatoryCva, simulateExposure } from '../models/exposure';

export default function Cva() {
  const [sigma, setSigma] = useState(0.008);
  const [a, setA] = useState(0.03);
  const [f, setF] = useState(0.025);
  const [maturity, setMaturity] = useState(10);
  const [side, setSide] = useState<'rec' | 'pay'>('rec');
  const [spread, setSpread] = useState(0.012);
  const [lgd, setLgd] = useState(0.4);
  const notional = 100;

  const prof = useMemo(
    () => simulateExposure({ f, a, sigma }, { notional, maturity, receiveFixed: side === 'rec' }, 2000, 20260831),
    [f, a, sigma, maturity, side],
  );
  const cva = regulatoryCva(prof.t, prof.dee, spread, lgd);
  const peak = Math.max(...prof.ee);
  const spreads = linspace(0, 0.05, 26);

  const [cp, setCp] = useState('Pension fund E');
  const thesisProf = results.exposureProfiles.find((p) => p.counterparty === cp)!;
  const cvaRows = results.regulatoryCva.slice().sort((x, y) => y.cva - x.cva);

  return (
    <article>
      <LessonHeader id="cva" />

      <Section title="1. What CVA is">
        <InPlainWords>
          <p>
            You have a swap with a company, and today it is worth zero. Tomorrow rates move and the swap is worth €3m <em>to you</em>.
            If the company defaults then, you lose most of that €3m. If the swap is worth −€3m to you, its default
            costs you nothing, because you still owe the money.
          </p>
          <p style={{ marginBottom: 0 }}>
            So the risk lives in the <strong>positive</strong> part of the future value, the <Term name="Expected exposure">exposure</Term>.{' '}
            <Term name="CVA">CVA</Term> is the expected loss: exposure × probability of default × loss given default, added up
            over the life of the trade. Banks deduct it from the value of the swap.
          </p>
        </InPlainWords>
        <p>CRR3 Art. 383a prescribes the <em>ingredients</em> of the regulatory CVA (spread-implied default probabilities, a market-consensus LGD, the exposure model) but no functional form. The thesis discretises the unilateral CVA on its quarterly grid as:</p>
        <TexBlock>{String.raw`\mathrm{CVA} = \mathrm{LGD}_{\mathrm{MKT}}\sum_{k=1}^{n}\bigl(S_{k-1} - S_k\bigr)\,\frac{\mathrm{dEE}_{k-1} + \mathrm{dEE}_k}{2},\qquad S_k = \exp\!\Bigl(-\frac{s_k\, t_k}{\mathrm{LGD}_{\mathrm{MKT}}}\Bigr)`}</TexBlock>
        <Symbols
          items={[
            [String.raw`\mathrm{dEE}_k`, 'Discounted expected exposure at time t_k: the average over simulated paths of max(swap value, 0), discounted to today.'],
            [String.raw`S_k`, 'Risk-neutral survival probability to t_k, implied by the counterparty credit spread s_k.'],
            [String.raw`S_{k-1} - S_k`, 'Probability that the counterparty defaults between t_{k−1} and t_k.'],
            [String.raw`\mathrm{LGD}_{\mathrm{MKT}}`, 'Market-consensus loss given default. The thesis uses 40 % for every name (senior unsecured convention).'],
          ]}
        />
      </Section>

      <Section title="2. The exposure of one swap">
        <p>
          The thesis simulates the short rate with a one-factor <Term name="Hull–White model">Hull–White model</Term>, values every swap on
          every path and every quarter, and averages. Below is the same idea for one EUR 100m swap, with 2 000 paths, run in your browser.
        </p>
        <Playground
          controls={
            <>
              <Toggle value={side} onChange={setSide} options={[{ value: 'rec', label: 'Receive fixed' }, { value: 'pay', label: 'Pay fixed' }]} />
              <Slider label="Maturity" value={maturity} min={2} max={15} step={1} onChange={setMaturity} format={(v) => `${v}y`} />
              <Slider label="Rate volatility σ" value={sigma} min={0.002} max={0.016} step={0.001} onChange={setSigma} format={bp} />
              <Slider label="Mean reversion a" value={a} min={0.005} max={0.15} step={0.005} onChange={setA} format={(v) => v.toFixed(3)} />
              <Slider label="Flat rate f" value={f} min={0} max={0.05} step={0.0025} onChange={setF} format={(v) => pct(v, 2)} />
              <Slider label="Credit spread s" value={spread} min={0.001} max={0.05} step={0.001} onChange={setSpread} format={bp} />
              <Slider label="LGD" value={lgd} min={0.2} max={0.8} step={0.05} onChange={setLgd} format={(v) => pct(v, 0)} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Peak EE', value: `€${num(peak, 2)}m`, hint: `${pct(peak / notional, 1)} of notional` },
              { label: 'Regulatory CVA', value: `€${num(cva, 3)}m`, hint: `${num((cva / notional) * 1e4, 1)} bp of notional` },
              { label: 'Default prob. over life', value: pct(1 - Math.exp((-spread * maturity) / lgd), 1) },
            ]}
          />
          <Chart
            data={[
              line(prof.t, prof.ee, 'Expected exposure EE'),
              line(prof.t, prof.pfe, 'PFE (95 %)', { line: { dash: 'dash' } }),
            ]}
            x="Years"
            y="EUR m"
          />
        </Playground>
        <TryThis
          items={[
            'The EE curve is a hump. At first the rate has had no time to move. At the end few payments are left to lose. Exposure peaks about a third of the way in.',
            'Double σ. EE roughly doubles, and so does CVA. In a Gaussian rate model the exposure of an at-the-money swap is close to proportional to σ, which is why SA-CVA vega is so large later.',
            'Raise mean reversion a. Rates wander less far from where they started, so exposure falls, most of all on long swaps.',
            'Switch to pay fixed. In this model the profile is nearly the same: with a flat curve, rising and falling rates are symmetric.',
          ]}
        />
        <CodeRef file="src/models/exposure.ts">The thesis version is src/cvacap/hull_white.py and reg_cva.py: 200 000 paths, the EUR AAA curve of 31 August 2026, semi-annual floating legs and margined netting sets.</CodeRef>
      </Section>

      <Section title="3. Why CVA needs capital: CVA risk">
        <p>
          CVA is a valuation adjustment, so when it moves, the bank books a profit or a loss. It moves when the counterparty's{' '}
          <strong>credit spread</strong> changes and when the <strong>exposure</strong> changes, that is, with interest rates and their
          volatility. The Basel Committee's stated reason for the charge is that CVA risk had been a greater source of losses during the
          crisis than outright defaults (Basel III, 2011, para. 14(b)). That is the risk the CVA capital charge covers.
        </p>
        <Chart data={[line(spreads.map((s) => s * 1e4), spreads.map((s) => regulatoryCva(prof.t, prof.dee, s, lgd)), 'CVA of the swap above')]} x="Credit spread (bp)" y="CVA (EUR m)" height={280} />
        <Note title="Two drivers, two approaches">
          BA-CVA captures only the credit spread side, with a supervisory formula. SA-CVA asks for both sides through
          sensitivities: the CVA delta to credit spreads, to interest rates, and the vega to the exposure model's volatility.
        </Note>
      </Section>

      <Section title="4. From Basel III to CRR3: how the charge got here">
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Year</th><th>Text</th><th>What it did</th></tr></thead>
            <tbody>
              <tr><td>2011</td><td>Basel III (BCBS)</td><td>A first CVA charge: an advanced method on the bank's bond VaR model and a standardised supervisory formula. Credit spread risk only.</td></tr>
              <tr><td>2015</td><td>Review of the CVA framework (consultation)</td><td>Three motivations: the charge ignored the exposure component and its hedges, it had fallen behind accounting practice, and it was inconsistent with the new market-risk framework. The aim was to reduce the incentive “to leave some of their risks unhedged”.</td></tr>
              <tr><td>2017, 2020</td><td>Finalising Basel III; targeted revision</td><td>The replacement with two approaches, SA-CVA (sensitivity-based, on the bank's own CVA model) and BA-CVA (a supervisory formula). Now chapter MAR50 of the Basel Framework.</td></tr>
              <tr><td>2024</td><td>CRR3, Regulation (EU) 2024/1623</td><td>The EU transposition, applying from 2025, keeping the Art. 382(4) exclusions, which the thesis treats as EU-specific, and adding the opt-in of Art. 382(4a). No parameter of the thesis comes from MAR50.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted">
          Chapter 2 of the thesis. The 2015 aim matters at the defence: Chapter 8 sets the hedging cliff that the exclusions create against it.
        </p>
      </Section>

      <Section title="5. The thesis's book">
        <p>
          The thesis runs the same calculation for all 17 counterparties. Their aggregate CVA is €{headline.cvaAggregate}m, with a
          Monte Carlo standard error of 0.3 %. Pick a counterparty to see its frozen exposure profile.
        </p>
        <Playground
          controls={
            <label className="select-label">
              Counterparty
              <select value={cp} onChange={(e) => setCp(e.target.value)}>
                {results.exposureProfiles.map((p) => (
                  <option key={p.counterparty}>{p.counterparty}</option>
                ))}
              </select>
            </label>
          }
        >
          <Chart
            data={[line(thesisProf.t, thesisProf.ee, 'EE', { line: { color: palette[0] } }), line(thesisProf.t, thesisProf.pfe, 'PFE (95 %)', { line: { color: palette[1], dash: 'dash' } })]}
            x="Years"
            y="EUR m"
            height={300}
          />
        </Playground>
        <Chart
          data={[
            {
              type: 'bar',
              orientation: 'h',
              y: cvaRows.map((r) => r.counterparty),
              x: cvaRows.map((r) => r.cva),
              marker: { color: cvaRows.map((r) => (r.exempt_eu ? palette[5] : palette[0])) },
              name: 'CVA',
              hovertemplate: '%{y}: €%{x:.3f}m<extra></extra>',
            } as never,
          ]}
          x="Regulatory CVA (EUR m); grey = exempt in the EU"
          height={460}
          layout={{ yaxis: { autorange: 'reversed' }, margin: { l: 180, r: 16, t: 20, b: 48 }, showlegend: false, hovermode: 'closest' }}
        />
        <Example title="Reading the bars">
          The 15-year pension fund swap dominates: long maturity means a large exposure for a long time. Shipping J has a small
          notional (€40m) but a 700 bp spread, so its CVA is larger than that of the €250m sovereign swap, whose spread is 25 bp.
        </Example>
      </Section>

      <Takeaways
        items={[
          'Exposure is the positive part of the future value. Its expected profile humps over the life of a swap.',
          'CVA = LGD × Σ default probability × discounted EE, with survival implied by the credit spread (Art. 383a).',
          'CVA moves with credit spreads and with exposure (rates and their volatility). Those moves are CVA risk.',
          'In the Hull–White model exposure scales almost one-for-one with σ, so σ will turn out to matter a lot.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why does the EE of a swap fall to zero at maturity?',
            options: ['Rates stop moving', 'No payments are left to lose', 'The counterparty cannot default after maturity', 'Discounting'],
            answer: 1,
            why: 'Each payment date removes a coupon from the remaining value. At maturity nothing is left, so the exposure is zero.',
          },
          {
            q: 'Holding everything else fixed, doubling σ in Hull–White roughly…',
            options: ['halves CVA', 'leaves CVA unchanged', 'doubles CVA', 'quadruples CVA'],
            answer: 2,
            why: 'For an at-the-money swap the value is about Gaussian with standard deviation proportional to σ, so E[max(V,0)] scales with σ.',
          },
        ]}
      />
      <DefenceCorner id="cva" />
      <LessonFooter id="cva" />
    </article>
  );
}
