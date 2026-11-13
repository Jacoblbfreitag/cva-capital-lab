import { useState } from 'react';
import { Chart, line, palette } from '../components/Chart';
import { Stats, Toggle, num } from '../components/Controls';
import { Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways, TryThis } from '../components/Lesson';
import { cell, headline, results, type Approach, type Scope } from '../data/results';

type Regime = 'basel' | 'eu' | 'eu-opt';
const regimeOpts: { value: Regime; label: string }[] = [
  { value: 'basel', label: 'Basel scope' },
  { value: 'eu', label: 'EU, no opt-in' },
  { value: 'eu-opt', label: 'EU, opt-in' },
];
const split = (r: Regime): [Scope, boolean] => (r === 'basel' ? ['basel', false] : ['eu', r === 'eu-opt']);
const name = (a: Approach) => (a === 'ba_cva' ? 'BA-CVA' : 'SA-CVA');
const color = (a: Approach) => (a === 'ba_cva' ? palette[0] : palette[1]);

export default function Hedging() {
  const [regime, setRegime] = useState<Regime>('basel');
  const [tenor, setTenor] = useState<'five' | 'matched'>('five');
  const [scope, optIn] = split(regime);
  const src = tenor === 'five' ? results.hedgeLadder : results.matchedTenor;
  const ladderTrace = (a: Approach) => {
    const rows = cell(src, scope, a, optIn);
    return line(rows.map((r) => r.hedge_ratio!), rows.map((r) => r.total_capital), name(a), { mode: 'lines+markers', line: { color: color(a) } });
  };
  const at = (a: Approach, h: number) => cell(src, scope, a, optIn).find((r) => r.hedge_ratio === h)!;

  const [nlTenor, setNlTenor] = useState<'five_year' | 'matched'>('five_year');
  const [nlRegime, setNlRegime] = useState<Regime>('basel');
  const [nlScope, nlOpt] = split(nlRegime);
  const nl = (a: Approach) =>
    results.notionalLadder
      .filter((r) => r.tenor_mode === nlTenor && r.scope === nlScope && r.opt_in === nlOpt && r.approach === a)
      .sort((x, y) => x.notional_target - y.notional_target);
  const best = (a: Approach) => nl(a).reduce((m, r) => (r.total_capital < m.total_capital ? r : m));

  const [swRegime, setSwRegime] = useState<Regime>('basel');
  const [swScope, swOpt] = split(swRegime);
  const sweep = (a: Approach) => results.tenorSweep.filter((r) => r.scope === swScope && r.opt_in === swOpt && r.approach === a).sort((x, y) => x.hedge_tenor! - y.hedge_tenor!);
  const fixed = (a: Approach, n: number) =>
    results.fixedNotional.filter((r) => r.allocation === 'exposure' && r.approach === a && r.notional_target === n).sort((x, y) => x.hedge_tenor! - y.hedge_tenor!);

  return (
    <article>
      <LessonHeader id="hedging" />

      <Section title="1. The hedge ladder">
        <InPlainWords>
          The thesis buys a CDS on every counterparty and raises the size step by step, from no hedge to a full one. "Hedge ratio 1" means
          the CDS fully offsets what each approach measures: SNH = SCVA under BA-CVA, or the vertex credit spread delta under SA-CVA. Total
          capital is the CVA charge plus any market-risk charge on hedges that are not recognised.
        </InPlainWords>
        <div className="sector-picker">
          <Toggle label="Regime" value={regime} onChange={setRegime} options={regimeOpts} />
          <Toggle label="CDS tenor" value={tenor} onChange={setTenor} options={[{ value: 'five', label: '5-year' }, { value: 'matched', label: 'Matched to the longest trade' }]} />
        </div>
        <Stats
          items={[
            { label: 'BA-CVA unhedged → full', value: `${num(at('ba_cva', 0).total_capital, 2)} → ${num(at('ba_cva', 1).total_capital, 2)}` },
            { label: 'SA-CVA unhedged → full', value: `${num(at('sa_cva', 0).total_capital, 2)} → ${num(at('sa_cva', 1).total_capital, 2)}` },
            { label: 'Relief from a full hedge', value: `BA ${num((1 - at('ba_cva', 1).total_capital / at('ba_cva', 0).total_capital) * 100, 0)}% · SA ${num((1 - at('sa_cva', 1).total_capital / at('sa_cva', 0).total_capital) * 100, 0)}%` },
          ]}
        />
        <Chart data={[ladderTrace('ba_cva'), ladderTrace('sa_cva')]} x="Hedge ratio" y="Total capital (EUR m)" />
        <TryThis
          items={[
            'Basel scope, 5-year CDS: BA-CVA falls in a straight line to 2.12. SA-CVA barely moves, from 10.54 to 8.92.',
            'Switch to matched tenors. BA-CVA is identical: the sizing holds r fixed, and BA-CVA has no tenor of its own. SA-CVA halves.',
            'EU, no opt-in: BA-CVA bottoms out at 4.14. The CDS on exempt names save nothing and carry 2.35 of FRTB charge.',
            'EU with opt-in: BA-CVA is back at the Basel floor, while SA-CVA is higher than without the opt-in.',
          ]}
        />
      </Section>

      <Section title="2. Equal notional: over-hedging and the V">
        <p>
          The ladder above gives each approach the notional <em>it</em> needs. Experiment B2 gives both the same total CDS notional instead,
          split across counterparties by exposure, and asks where each approach is cheapest.
        </p>
        <div className="sector-picker">
          <Toggle label="Regime" value={nlRegime} onChange={setNlRegime} options={regimeOpts} />
          <Toggle label="CDS tenor" value={nlTenor} onChange={setNlTenor} options={[{ value: 'five_year', label: '5-year' }, { value: 'matched', label: 'Matched' }]} />
        </div>
        <Chart
          data={(['ba_cva', 'sa_cva'] as const).flatMap((a) => [
            line(nl(a).map((r) => r.notional_target), nl(a).map((r) => r.total_capital), `${name(a)} total`, { line: { color: color(a) } }),
            line(nl(a).map((r) => r.notional_target), nl(a).map((r) => r.frtb_charge), `${name(a)} market-risk part`, { line: { color: color(a), dash: 'dot' } }),
            { x: [best(a).notional_target], y: [best(a).total_capital], mode: 'markers', type: 'scatter', name: `${name(a)} minimum`, marker: { color: color(a), size: 11, symbol: 'diamond' } },
          ]) as never}
          x="Total CDS notional (EUR m)"
          y="EUR m"
        />
        <Stats
          items={[
            { label: 'BA-CVA best', value: `${num(best('ba_cva').total_capital, 2)}`, hint: `at €${best('ba_cva').notional_target}m` },
            { label: 'SA-CVA best', value: `${num(best('sa_cva').total_capital, 2)}`, hint: `at €${best('sa_cva').notional_target}m` },
          ]}
        />
        <Example title="Why BA-CVA is a V">
          BA-CVA capital depends on |1 − r|. Past full recognition, every extra euro of CDS <em>adds</em> capital at the same rate the
          earlier euros removed it. Because matched tenors differ by counterparty, r is not uniform on this ladder, so the bottom
          of the V stays a little above the β floor. SA-CVA flattens out early: once the spread delta is offset, more CDS only adds the
          hedging disallowance, and in the EU without opt-in, market-risk charge.
        </Example>
      </Section>

      <Section title="3. Tenor: fixed recognition vs fixed notional">
        <div className="grid-2">
          <div>
            <h3>(a) Notional re-solved for a full hedge at each tenor</h3>
            <Toggle value={swRegime} onChange={setSwRegime} options={regimeOpts} />
            <Chart
              data={(['ba_cva', 'sa_cva'] as const).map((a) => line(sweep(a).map((r) => r.hedge_tenor!), sweep(a).map((r) => r.total_capital), name(a), { mode: 'lines+markers', line: { color: color(a) } }))}
              x="CDS tenor (years)"
              y="Total capital (EUR m)"
              height={300}
            />
          </div>
          <div>
            <h3>(b) Same €50m / €100m notional for both, Basel</h3>
            <Chart
              data={[50, 100].flatMap((n, i) =>
                (['ba_cva', 'sa_cva'] as const).map((a) =>
                  line(fixed(a, n).map((r) => r.hedge_tenor!), fixed(a, n).map((r) => r.total_capital), `${name(a)} €${n}m`, { mode: 'lines+markers', line: { color: color(a), dash: i ? 'dash' : 'solid' } }),
                ),
              )}
              x="CDS tenor (years)"
              y="Total capital (EUR m)"
              height={300}
            />
          </div>
        </div>
        <p>
          In (a) BA-CVA is flat at the floor: re-solving the notional holds r = 1, and BA-CVA has no other tenor dimension. SA-CVA is best at
          {' '}{headline.tenorBestSAyears} years ({headline.tenorBestSA} EUR m), the last vertex of the Art. 383e(1) grid. At 15 years it is worse again, because there
          is no vertex beyond 10y. In (b) the notional is fixed, so a longer CDS raises r through M·DF. BA-CVA falls with tenor until r
          overshoots 1, which is where the €100m line turns up.
        </p>
      </Section>

      <Section title="4. Market-risk charge per euro of relief">
        <p>When hedges on exempt names are not recognised, the FRTB charge is the price of hedging. At equal notional it is the same under both approaches, so compare per euro of CVA relief (experiment B2, EU without opt-in):</p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th></th><th>5-year CDS</th><th>Matched tenor</th></tr></thead>
            <tbody>
              <tr><td>BA-CVA: € market-risk charge per € CVA relief</td><td>0.44</td><td>0.30</td></tr>
              <tr><td>SA-CVA: € market-risk charge per € CVA relief</td><td>0.21</td><td>0.15</td></tr>
            </tbody>
          </table>
        </div>
        <Note>
          BA-CVA pays more market-risk charge per euro of relief because its relief per unit of notional is smaller. It still ends up cheaper
          overall, because its relief comes on a much larger hedgeable share of the charge.
        </Note>
      </Section>

      <Section title="5. One counterparty's decision path">
        <div className="tree">
          <div className="tree-node">Counterparty c</div>
          <div className="tree-q">Excluded under Art. 382(4)?</div>
          <div className="tree-branches">
            <div className="tree-col">
              <div className="tree-lbl">yes</div>
              <div className="tree-q">Hedged?</div>
              <div className="tree-branches">
                <div className="tree-col"><div className="tree-lbl">no</div><div className="tree-out">No charge; reported only (Art. 382(4b))</div></div>
                <div className="tree-col">
                  <div className="tree-lbl">yes</div>
                  <div className="tree-q">Opt in (Art. 382(4a))?</div>
                  <div className="tree-branches">
                    <div className="tree-col"><div className="tree-lbl">no</div><div className="tree-out bad">CDS charged under FRTB (Art. 386(5)); no CVA relief</div></div>
                    <div className="tree-col"><div className="tree-lbl">yes</div><div className="tree-out">Into the CVA charge →</div></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tree-col">
              <div className="tree-lbl">no</div>
              <div className="tree-q">In the CVA charge: which approach (Art. 382a(3))?</div>
              <div className="tree-branches">
                <div className="tree-col"><div className="tree-out">SA-CVA: the CDS cuts the spread delta; IR delta and vega stay</div></div>
                <div className="tree-col"><div className="tree-out good">BA-CVA: the CDS cuts the charge down to the β floor</div></div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Takeaways
        items={[
          'BA-CVA rewards a CDS strongly and linearly, from 8.47 to 2.12 EUR m in Basel scope.',
          'SA-CVA rewards it weakly with 5-year CDS (10.54 → 8.92) and better with matched tenors (→ 4.57), but never below its floor.',
          'At equal notional BA-CVA is V-shaped: over-hedging is penalised at the same rate as under-hedging.',
          'Without the opt-in, the hedges on exempt names make hedging in the EU less attractive than in Basel scope.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why does matching the CDS tenor change SA-CVA but not BA-CVA on the hedge ladder?',
            options: [
              'BA-CVA ignores hedges',
              'The ladder re-sizes notional to hold r fixed, and BA-CVA sees a hedge only through r; SA-CVA sees each vertex separately',
              'Matched CDS are not eligible for BA-CVA',
              'SA-CVA uses SA-CCR',
            ],
            answer: 1,
            why: 'BA-CVA reads r_hc·RW·M·B·DF, a single number. SA-CVA maps the CDS delta onto five vertices, so the tenor decides which ones are hedged.',
          },
          {
            q: 'In EU scope without opt-in, why is BA-CVA at full hedge 4.14 instead of the 2.12 floor?',
            options: ['The exemptions raise the floor', 'The CDS on exempt names save nothing and add 2.35 of market-risk charge', 'DS_CVA changes', 'SA-CCR changes'],
            answer: 1,
            why: 'CVA charge 1.78 + FRTB charge 2.35 ≈ 4.14 EUR m.',
          },
        ]}
      />
      <LessonFooter id="hedging" />
    </article>
  );
}
