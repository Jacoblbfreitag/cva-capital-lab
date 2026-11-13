import { useMemo, useState } from 'react';
import { Chart, line, linspace, palette } from '../components/Chart';
import { Playground, Slider, Stats, Toggle, num, pct } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { CodeRef, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Symbols, Takeaways, Term, TryThis } from '../components/Lesson';
import { portfolio, sectorLabels, type Sector } from '../data/portfolio';
import { BETA, R_HC, RISK_WEIGHTS, closedForm, discountFactor, kReduced, kTotal, nettingSetInputs, riskWeight, scva, type HedgeRelation } from '../models/baCva';

export default function BaCva() {
  const [scope, setScope] = useState<'basel' | 'eu'>('basel');
  const cps = scope === 'basel' ? portfolio : portfolio.filter((c) => !c.exemptEu);
  const rows = useMemo(
    () =>
      cps.map((c) => {
        const ns = nettingSetInputs(c);
        return { c, rw: riskWeight(c.sector, c.cqs), m: ns[0].maturity, ead: ns.reduce((s, x) => s + x.ead, 0), df: discountFactor(ns[0].maturity), scva: scva(c) };
      }),
    [scope],
  );
  const scvas = rows.map((r) => r.scva);
  const kRed = kReduced(scvas);
  const sumScva = scvas.reduce((a, b) => a + b, 0);

  // Hedging playground: CDS sized so that RW_h · M_h · B_h · DF_h = h · SCVA_c for every counterparty.
  const [h, setH] = useState(0.6);
  const [relation, setRelation] = useState<HedgeRelation>('direct');
  const kOf = (hh: number, rel: HedgeRelation) =>
    kTotal(scvas, scvas.map((s) => R_HC[rel] * hh * s), scvas.map((s) => (1 - R_HC[rel] ** 2) * (hh * s) ** 2));
  const hs = linspace(0, 2, 81);
  const kNow = kOf(h, relation);
  const ladder = [
    line(hs, hs.map((x) => kOf(x, 'direct')), 'Direct CDS (r_hc = 1)'),
    line(hs, hs.map((x) => kOf(x, 'legallyRelated')), 'Legally related (0.8)'),
    line(hs, hs.map((x) => kOf(x, 'sameSectorRegion')), 'Same sector & region (0.5)'),
    line([0, 2], [BETA * kRed, BETA * kRed], 'β floor', { line: { dash: 'dot', color: '#5f6b7a' } }),
    { x: [h], y: [kNow], mode: 'markers', type: 'scatter', name: 'You', marker: { size: 11, color: palette[3] } },
  ];

  const tenors = linspace(0.5, 15, 30);

  return (
    <article>
      <LessonHeader id="ba-cva" />

      <Section title="1. The idea">
        <InPlainWords>
          BA-CVA treats every counterparty like a loan of size "maturity × exposure". It multiplies that by a <Term name="Risk weight">risk weight</Term> for the
          counterparty's sector and rating, and adds the counterparties up the way a one-factor credit model would: partly
          correlated, so a diversified book costs less than the sum of its parts. A <Term name="CDS">CDS</Term> bought on the counterparty subtracts from
          its line. One supervisory parameter, the <Term name="Beta floor">β floor</Term> of 25 %, makes sure a hedge can never
          wipe out the charge.
        </InPlainWords>
        <TexBlock>{String.raw`\mathrm{SCVA}_c = \frac{1}{\alpha}\,\mathrm{RW}_c \sum_{NS} M_{NS}\,\mathrm{EAD}_{NS}\,\mathrm{DF}_{NS},\qquad \mathrm{DF} = \frac{1 - e^{-0.05M}}{0.05M}`}</TexBlock>
        <TexBlock>{String.raw`K_{\mathrm{reduced}} = \mathrm{DS}_{\mathrm{CVA}}\sqrt{\Bigl(\rho\sum_c \mathrm{SCVA}_c\Bigr)^2 + (1-\rho^2)\sum_c \mathrm{SCVA}_c^2}`}</TexBlock>
        <Symbols
          items={[
            [String.raw`\mathrm{RW}_c`, 'Art. 384(2) Table 1: risk weight by sector and credit quality step (below).'],
            [String.raw`M_{NS}`, 'Effective maturity (Art. 162): notional-weighted, at least 1 year, at most the longest trade.'],
            [String.raw`\mathrm{EAD}_{NS}`, 'Exposure value from SA-CCR (Module 2).'],
            [String.raw`\alpha = 1.4`, 'Divides out the α already inside SA-CCR EAD.'],
            [String.raw`\rho = 0.5`, 'Correlation of each counterparty’s spread with a common factor: half the book moves together.'],
            [String.raw`\mathrm{DS}_{\mathrm{CVA}} = 0.65`, 'Discount scalar. The thesis applies it inside the reduced formula, as CRR3 Art. 384(3) transcribes it.'],
          ]}
        />
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Sector (Art. 384(2) Table 1)</th><th>CQS 1–3</th><th>CQS 4–6, unrated</th></tr>
            </thead>
            <tbody>
              {(Object.keys(RISK_WEIGHTS) as Sector[]).map((s) => (
                <tr key={s}><td>{sectorLabels[s]}</td><td>{pct(RISK_WEIGHTS[s][0], 1)}</td><td>{pct(RISK_WEIGHTS[s][1], 1)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="2. The book, unhedged (computed live)">
        <Toggle value={scope} onChange={setScope} options={[{ value: 'basel', label: 'Basel scope: all 17' }, { value: 'eu', label: 'EU scope: exempt names removed' }]} />
        <Stats
          items={[
            { label: 'Σ SCVA_c', value: `€${num(sumScva, 3)}m`, hint: 'no diversification' },
            { label: 'K_reduced', value: `€${num(kRed, 3)}m`, hint: scope === 'basel' ? 'thesis: 8.47' : 'thesis: 7.13' },
            { label: 'β floor = 0.25 · K_reduced', value: `€${num(BETA * kRed, 3)}m`, hint: 'lowest reachable with CDS' },
          ]}
        />
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Counterparty</th><th>RW</th><th>M</th><th>EAD</th><th>DF</th><th>SCVA_c</th><th>Share</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.c.name}>
                  <td>{r.c.name}</td>
                  <td>{pct(r.rw, 1)}</td>
                  <td>{num(r.m, 2)}</td>
                  <td>{num(r.ead, 3)}</td>
                  <td>{num(r.df, 3)}</td>
                  <td>{num(r.scva, 3)}</td>
                  <td>{pct(r.scva / sumScva, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Example title="Why K_reduced is smaller than Σ SCVA">
          If all counterparties were perfectly correlated (ρ = 1), the root would be Σ SCVA. With ρ = 0.5 only a quarter of the
          squared sum is systematic. The other three quarters add up as independent squares, which is much smaller for a book of 17
          names. Then DS_CVA = 0.65 scales the result down once more.
        </Example>
      </Section>

      <Section title="3. Hedging with CDS: the full version">
        <TexBlock>{String.raw`K_{\mathrm{hedged}} = \sqrt{\Bigl(\rho\sum_c(\mathrm{SCVA}_c - \mathrm{SNH}_c) - \mathrm{IH}\Bigr)^2 + (1-\rho^2)\sum_c(\mathrm{SCVA}_c - \mathrm{SNH}_c)^2 + \sum_c \mathrm{HMA}_c}`}</TexBlock>
        <TexBlock>{String.raw`K_{\mathrm{total}} = \beta\,K_{\mathrm{reduced}} + \mathrm{DS}_{\mathrm{CVA}}\,(1-\beta)\,K_{\mathrm{hedged}}`}</TexBlock>
        <Symbols
          items={[
            [String.raw`\mathrm{SNH}_c = \sum_h r_{hc}\mathrm{RW}_h M_h B_h \mathrm{DF}_h`, 'The recognised part of the single-name hedges on c.'],
            [String.raw`r_{hc}`, 'Table 2: 100 % if the CDS is on c itself, 80 % on a legally related entity, 50 % on a same-sector, same-region name.'],
            [String.raw`\mathrm{HMA}_c`, 'Hedge mismatch: Σ (1 − r²)(RW M B DF)². Zero for a direct hedge, a penalty for a proxy hedge.'],
            [String.raw`\mathrm{IH}`, 'Index hedges. The thesis uses single-name CDS only.'],
            [String.raw`\beta = 0.25`, 'The part of the unhedged charge no hedge can remove.'],
          ]}
        />
        <Playground
          controls={
            <>
              <Slider label="Hedge size h = RW·M·B·DF / SCVA" value={h} min={0} max={2} step={0.05} onChange={setH} format={(v) => v.toFixed(2)} />
              <Toggle
                label="Hedge reference name"
                value={relation}
                onChange={setRelation}
                options={[{ value: 'direct', label: 'Direct' }, { value: 'legallyRelated', label: 'Related' }, { value: 'sameSectorRegion', label: 'Proxy' }]}
              />
            </>
          }
        >
          <Stats
            items={[
              { label: 'K_total', value: `€${num(kNow, 3)}m` },
              { label: 'Saving vs unhedged', value: pct(1 - kNow / kRed, 1) },
              { label: 'Recognition r = SNH/SCVA', value: num(R_HC[relation] * h, 2) },
            ]}
          />
          <Chart data={ladder as never} x="Hedge size h (same for every counterparty)" y="BA-CVA capital (EUR m)" />
        </Playground>
        <TryThis
          items={[
            'With a direct hedge, move h from 0 to 1. Capital falls in a straight line to the β floor at exactly h = 1.',
            'Keep going to h = 2. Capital climbs back up, symmetrically: over-hedging by 40 % costs the same as under-hedging by 40 %.',
            'Switch to a proxy hedge. Only half the notional is recognised and HMA adds a penalty, so the floor is never reached.',
          ]}
        />
      </Section>

      <Section title="4. The thesis's closed form">
        <p>
          If every hedge is direct (HMA = 0), there are no index hedges, and the recognition ratio r = SNH<sub>c</sub>/SCVA<sub>c</sub> is
          the same for every counterparty, then (1 − r) factors out of both sums. The thesis proves:
        </p>
        <TexBlock>{String.raw`\boxed{K_{\mathrm{total}} = K_{\mathrm{reduced}}\,\bigl(\beta + (1-\beta)\,\lvert 1 - r\rvert\bigr)}`}</TexBlock>
        <p>
          With the numbers: K_total = {num(kRed, 3)} × (0.25 + 0.75·|1 − r|). Each 10 % of recognition saves €{num(0.1 * (1 - BETA) * kRed, 3)}m,
          until r = 1 where capital is {num(closedForm(kRed, 1), 3)}. This is prediction <strong>P1</strong>: the optimal hedge is a corner,
          and the test suite checks every point of the thesis's hedge ladder against this formula to 10⁻⁶.
        </p>
        <Note title="Why DS_CVA disappears">
          K_hedged has no DS of its own; Art. 384(2) applies DS outside it. With HMA = IH = 0 it equals |1 − r| · K_reduced / DS.
          Multiplying by DS·(1 − β) brings back |1 − r|·(1 − β)·K_reduced, so DS cancels.
        </Note>
      </Section>

      <Section title="5. Tenor is a substitute for notional">
        <p>
          BA-CVA sees a CDS only through RW<sub>h</sub>·M<sub>h</sub>·B<sub>h</sub>·DF<sub>h</sub>, and M·DF = (1 − e<sup>−0.05M</sup>)/0.05. A longer CDS
          is recognised more per euro of notional. Two hedges with the same product are identical to BA-CVA, whatever their tenors.
        </p>
        <Chart data={[line(tenors, tenors.map((m) => m * discountFactor(m)), 'M · DF(M)')]} x="CDS tenor (years)" y="Recognition per € notional (÷ RW)" height={260} />
        <p className="muted">From 2.79 at three years to 10.55 at fifteen: a 15-year CDS is recognised 3.8 times as much as a 3-year one of the same notional.</p>
        <CodeRef file="src/models/baCva.ts">Port of src/cvacap/ba_cva.py. Tests reproduce 8.473 (Basel) and 7.133 (EU) EUR m from the portfolio.</CodeRef>
      </Section>

      <Takeaways
        items={[
          'SCVA_c = RW · M · EAD · DF / α per counterparty; ρ = 0.5 aggregates them with diversification; DS = 0.65 scales down.',
          'Live on the book: K_reduced = 8.47 EUR m in Basel scope and 7.13 in EU scope.',
          `CDS hedges cut the charge linearly to the β floor, ${num(BETA * kRed, 2)} EUR m here, and over-hedging is penalised symmetrically.`,
          'Proxy hedges are recognised only partly and add a mismatch penalty.',
          'BA-CVA has no tenor dimension of its own. Tenor matters only through M·DF, as a substitute for notional.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: `K_reduced = 8.47. With direct hedges and r = 0.6 for every name, K_total is about…`,
            options: ['3.39', '4.66', '5.08', '8.47'],
            answer: 1,
            why: '8.47 × (0.25 + 0.75 × 0.4) = 8.47 × 0.55 = 4.66.',
          },
          {
            q: 'Recognition r = 1.4 vs r = 0.6 under the closed form…',
            options: ['1.4 is cheaper', '0.6 is cheaper', 'They cost the same', 'Depends on DS_CVA'],
            answer: 2,
            why: 'Capital depends on |1 − r|, which is 0.4 in both cases.',
          },
          {
            q: 'A bank replaces a 5y CDS by a 10y CDS of the same notional on the same name. Under BA-CVA…',
            options: ['Nothing changes', 'Recognition rises, by M·DF from 4.42 to 7.87', 'Recognition falls', 'The hedge becomes ineligible'],
            answer: 1,
            why: 'SNH is proportional to M·DF = (1 − e^{−0.05M})/0.05, which rises with M.',
          },
        ]}
      />
      <LessonFooter id="ba-cva" />
    </article>
  );
}

