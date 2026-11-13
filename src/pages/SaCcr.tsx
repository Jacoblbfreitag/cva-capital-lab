import { useState } from 'react';
import { Chart, line, linspace } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { portfolio } from '../data/portfolio';
import { ead, saCcr, supervisoryDuration, type Swap } from '../models/saCcr';

export default function SaCcr() {
  const [n1, setN1] = useState(200);
  const [m1, setM1] = useState(10);
  const [s1, setS1] = useState<'rec' | 'pay'>('rec');
  const [two, setTwo] = useState<'yes' | 'no'>('yes');
  const [n2, setN2] = useState(100);
  const [m2, setM2] = useState(5);
  const [s2, setS2] = useState<'rec' | 'pay'>('pay');
  const [margined, setMargined] = useState<'no' | 'yes'>('no');

  const trades: Swap[] = [{ notional: n1, maturity: m1, receiveFixed: s1 === 'rec' }];
  if (two === 'yes') trades.push({ notional: n2, maturity: m2, receiveFixed: s2 === 'rec' });
  const b = saCcr(trades, { margined: margined === 'yes' });
  const grossEad = trades.reduce((s, t) => s + ead([t], { margined: margined === 'yes' }), 0);

  const ms = linspace(0.5, 20, 40);
  const curve = [
    line(ms, ms.map((m) => ead([{ notional: 100, maturity: m, receiveFixed: true }])), 'Unmargined'),
    line(ms, ms.map((m) => ead([{ notional: 100, maturity: m, receiveFixed: true }], { margined: true })), 'Daily margin (MPoR 10 days)'),
  ];

  return (
    <article>
      <LessonHeader id="sa-ccr" />

      <Section title="1. Why a formula instead of a simulation">
        <InPlainWords>
          BA-CVA needs an exposure for each netting set but does not trust the bank's own model. So it borrows the{' '}
          <Term name="SA-CCR">standardised approach for counterparty credit risk</Term>: a fixed recipe that turns notional,
          maturity and direction into an <Term name="EAD">exposure at default</Term>. No paths, no volatility, no calibration. That one
          design choice is why, later on, <strong>BA-CVA does not move at all</strong> when the thesis changes the exposure model.
        </InPlainWords>
        <TexBlock>{String.raw`\mathrm{EAD} = \alpha\,(\mathrm{RC} + \mathrm{PFE}),\qquad \mathrm{PFE} = \text{multiplier}\cdot \underbrace{\mathrm{SF}^{IR}\cdot \mathrm{EffNot}}_{\text{AddOn}}`}</TexBlock>
        <TexBlock>{String.raw`\mathrm{EffNot} = \sqrt{D_1^2 + D_2^2 + D_3^2 + 1.4\,D_1D_2 + 1.4\,D_2D_3 + 0.6\,D_1D_3},\qquad D_k = \sum_{i\in k} \delta_i\cdot N_i\,\mathrm{SD}_i\cdot \mathrm{MF}_i`}</TexBlock>
        <Symbols
          items={[
            [String.raw`\alpha = 1.4`, 'Art. 274(2): a supervisory multiplier on top of everything.'],
            [String.raw`\mathrm{RC}`, 'Replacement cost, max(current value − collateral, 0). Zero for a new swap.'],
            [String.raw`\mathrm{SF}^{IR} = 0.5\%`, 'Art. 280a(2): supervisory factor for interest rate trades.'],
            [String.raw`\mathrm{SD} = \frac{e^{-0.05S} - e^{-0.05E}}{0.05}`, 'Art. 279b: supervisory duration, a duration at a 5 % rate. For a 10y swap it is 7.87.'],
            [String.raw`\delta = \pm 1`, 'Art. 279a: +1 for a payer swap (gains when rates rise), −1 for a receiver.'],
            [String.raw`\mathrm{MF}`, 'Art. 279c: maturity factor, 1 for unmargined trades over a year, 1.5·√(MPoR/250) if margined (0.3 for 10 days).'],
            [String.raw`D_1, D_2, D_3`, 'Risk positions summed in maturity buckets ≤1y, 1–5y, >5y. Opposite signs net, fully within a bucket and partly across buckets.'],
          ]}
        />
      </Section>

      <Section title="2. Build a netting set">
        <Playground
          controls={
            <>
              <strong>Trade 1</strong>
              <Toggle value={s1} onChange={setS1} options={[{ value: 'rec', label: 'Receiver' }, { value: 'pay', label: 'Payer' }]} />
              <Slider label="Notional" value={n1} min={10} max={400} step={10} onChange={setN1} format={(v) => `€${v}m`} />
              <Slider label="Maturity" value={m1} min={0.5} max={20} step={0.5} onChange={setM1} format={(v) => `${v}y`} />
              <Toggle label="Second trade" value={two} onChange={setTwo} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
              {two === 'yes' && (
                <>
                  <Toggle value={s2} onChange={setS2} options={[{ value: 'rec', label: 'Receiver' }, { value: 'pay', label: 'Payer' }]} />
                  <Slider label="Notional" value={n2} min={10} max={400} step={10} onChange={setN2} format={(v) => `€${v}m`} />
                  <Slider label="Maturity" value={m2} min={0.5} max={20} step={0.5} onChange={setM2} format={(v) => `${v}y`} />
                </>
              )}
              <Toggle label="Variation margin" value={margined} onChange={setMargined} options={[{ value: 'no', label: 'None' }, { value: 'yes', label: 'Daily' }]} />
            </>
          }
        >
          <Stats
            items={[
              { label: 'Effective notional', value: `€${num(b.effNotional, 1)}m` },
              { label: 'Add-on', value: `€${num(b.addOn, 3)}m`, hint: '0.5 % × EffNot' },
              { label: 'EAD', value: `€${num(b.ead, 3)}m`, hint: '1.4 × (RC + PFE)' },
              { label: 'Netting benefit', value: two === 'yes' ? `${num((1 - b.ead / grossEad) * 100, 1)}%` : '—', hint: 'vs the trades on their own' },
            ]}
          />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Trade</th><th>δ</th><th>SD</th><th>Adj. notional</th><th>MF</th><th>Risk position</th><th>Bucket</th></tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.swap.receiveFixed ? 'Receiver' : 'Payer'} €{r.swap.notional}m {r.swap.maturity}y</td>
                    <td>{r.delta > 0 ? '+1' : '−1'}</td>
                    <td>{num(r.sd, 3)}</td>
                    <td>{num(r.adjNotional, 1)}</td>
                    <td>{num(r.mf, 3)}</td>
                    <td>{num(r.riskPosition, 1)}</td>
                    <td>{r.bucket}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Buckets D₁, D₂, D₃</strong></td>
                  <td colSpan={6}>{b.buckets.map((d) => num(d, 1)).join('  ·  ')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Playground>
        <TryThis
          items={[
            'Make the two trades opposite sides with the same maturity and notional. EAD goes to zero: perfect netting within a bucket.',
            'Now give them the same side. EAD is the sum of the two: no netting.',
            'Put opposite trades in buckets 1 and 3 (e.g. 1y and 10y). The cross-bucket coefficient is only 0.6, so much less nets out.',
            'Switch on daily margin. The maturity factor drops from 1 to 0.3, and so does the EAD.',
          ]}
        />
      </Section>

      <Section title="3. EAD against maturity">
        <Chart data={curve} x="Maturity of a €100m receiver swap (years)" y="EAD (EUR m)" height={300} />
        <p>
          EAD grows with maturity through the supervisory duration, but less than one-for-one because of the 5 % discounting
          inside SD. BA-CVA then multiplies EAD by the effective maturity M and a discount factor DF, so long trades cost far more
          than short ones. That is why the 15-year pension fund swap is the largest single charge in the book.
        </p>
      </Section>

      <Section title="4. The book's netting sets">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Counterparty</th><th>Trades</th><th>Margin</th><th>EAD (€m)</th></tr>
            </thead>
            <tbody>
              {portfolio.map((c) =>
                c.nettingSets.map((ns, i) => (
                  <tr key={c.name + i}>
                    <td>{c.name}</td>
                    <td>{ns.trades.map((t) => `${t.receiveFixed ? 'R' : 'P'} ${t.notional}/${t.maturity}y`).join(', ')}</td>
                    <td>{ns.margined ? 'daily VM' : '—'}</td>
                    <td>{num(saCcr(ns.trades, { margined: ns.margined }).ead, 3)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <Example title="Worked example: Bank A">
          Bank A has a €200m 10y receiver (bucket 3) and a €100m 5y payer (bucket 2). Risk positions: −200 × {num(supervisoryDuration(0, 10), 3)} ={' '}
          {num(-200 * supervisoryDuration(0, 10), 1)} and +100 × {num(supervisoryDuration(0, 5), 3)} = {num(100 * supervisoryDuration(0, 5), 1)}. With
          the 1.4 cross-bucket term they partly offset, and EAD is €{num(ead(portfolio[0].nettingSets[0].trades), 3)}m against €
          {num(ead([portfolio[0].nettingSets[0].trades[0]]) + ead([portfolio[0].nettingSets[0].trades[1]]), 3)}m for the two trades separately.
        </Example>
        <Note>Every swap is at inception with no collateral, so RC = 0 and the multiplier is 1. Bank B is margined daily (MPoR 10 business days, Art. 285(2)(b)).</Note>
        <CodeRef file="src/models/saCcr.ts">A line-by-line port of src/cvacap/sa_ccr.py, each parameter with its CRR3 article.</CodeRef>
      </Section>

      <Takeaways
        items={[
          'SA-CCR turns notional, maturity and direction into EAD with a fixed formula: no simulation, no volatility.',
          'Opposite trades net within a maturity bucket, and partly across buckets.',
          'Daily margin cuts the maturity factor to 0.3, and the EAD with it.',
          'Because BA-CVA takes its exposure from SA-CCR, it is immune to the exposure model, unlike SA-CVA.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'A €100m 7y payer and a €100m 7y receiver with the same counterparty, in one netting set. EAD?',
            options: ['€0', 'Twice the single-swap EAD', 'The single-swap EAD', '1.4 × €100m'],
            answer: 0,
            why: 'Same bucket, opposite deltas: D₃ = 0, so EffNot = 0 and EAD = 0.',
          },
          {
            q: 'If the thesis doubles the Hull–White volatility, BA-CVA…',
            options: ['doubles', 'does not change', 'halves', 'rises by √2'],
            answer: 1,
            why: 'BA-CVA reads EAD from SA-CCR, which has no volatility in it. Its robustness rows are flat at 0.00 %.',
          },
        ]}
      />
      <LessonFooter id="sa-ccr" />
    </article>
  );
}
