import { useState } from 'react';
import { Chart, palette } from '../components/Chart';
import { Stats, Toggle, num } from '../components/Controls';
import { TexBlock } from '../components/Formula';
import { DefenceCorner, Example, InPlainWords, LessonFooter, LessonHeader, Note, Quiz, Section, Takeaways, Term } from '../components/Lesson';
import { approachLabels, banks, cva2Rows, evidenceByPrediction, fxRates, readings, type ApproachDisclosed } from '../data/pillar3';

const approachColor: Record<ApproachDisclosed, string> = { mixed: palette[1], 'full-ba': palette[0], 'reduced-ba': palette[2], unclear: palette[5] };

export default function Pillar3() {
  const [group, setGroup] = useState<'all' | 'nordic'>('nordic');
  const shown = banks.filter((b) => group === 'all' || b.nordic).sort((a, b) => b.eurM - a.eurM);
  const count = (a: ApproachDisclosed) => banks.filter((b) => b.approach === a).length;

  const rweaChart = (Object.keys(approachLabels) as ApproachDisclosed[]).map((a) => ({
    type: 'bar',
    name: approachLabels[a],
    x: shown.map((b) => b.bank),
    y: shown.map((b) => (b.approach === a ? b.eurM : 0)),
    marker: { color: approachColor[a] },
  }));
  const mixers = banks.filter((b) => b.split);
  const splitChart = [
    { type: 'bar', name: 'SA-CVA', x: mixers.map((b) => b.bank), y: mixers.map((b) => (100 * b.split!.sa) / (b.split!.sa + b.split!.ba)), marker: { color: palette[1] } },
    { type: 'bar', name: 'BA-CVA', x: mixers.map((b) => b.bank), y: mixers.map((b) => (100 * b.split!.ba) / (b.split!.sa + b.split!.ba)), marker: { color: palette[0] } },
  ];

  return (
    <article>
      <LessonHeader id="pillar3" />

      <Section title="1. Why look at real banks at all">
        <InPlainWords>
          <p>
            The model of Modules 3–7 says what a capital-minimising bank <em>should</em> do on one stylised book. Chapter 7 asks what real banks{' '}
            <em>do</em>, as far as their public <Term name="Pillar 3">Pillar 3</Term> reports show it. The sample is nine Nordic banks and three large EU
            banks, all at 31 December 2025, the first year-end under CRR3.
          </p>
          <p style={{ marginBottom: 0 }}>
            The chapter has one rule, and it matters at a defence: the disclosures can be <strong>consistent or inconsistent</strong> with a prediction,
            never <strong>confirm</strong> one. They show the approach chosen and its amount, but not the capital under the approach not chosen, the
            effect of hedges, the fixed cost of SA-CVA or the exempted counterparties. The model needs all four.
          </p>
        </InPlainWords>
        <Note title="Conventions">
          Amounts are the <Term name="RWEA">risk-weighted exposure amount</Term> for CVA risk, 12.5 times the own funds requirement. DKK, SEK and NOK are
          converted at the ECB reference rates for 31 Dec 2025 (1 EUR = {fxRates.DKK} DKK = {fxRates.SEK} SEK = {fxRates.NOK} NOK). The 2024 comparatives are
          not used, because they predate CRR3. Every row was checked against the bank's own document on 20 Nov 2026.
        </Note>
      </Section>

      <Section title="2. What the banks disclose">
        <Stats
          items={[
            { label: 'Mix SA-CVA and BA-CVA', value: String(count('mixed')), hint: 'Danske, Nordea, BNP Paribas, ING' },
            { label: 'Full BA-CVA only', value: String(count('full-ba')), hint: 'SEB, Swedbank, Deutsche Bank' },
            { label: 'Reduced BA-CVA only', value: String(count('reduced-ba')), hint: 'Nykredit, Jyske, Handelsbanken, DNB' },
            { label: 'SA-CVA alone', value: '0', hint: 'and no simplified approach' },
          ]}
        />
        <Toggle label="Banks" value={group} onChange={setGroup} options={[{ value: 'nordic', label: 'Nine Nordic banks' }, { value: 'all', label: 'All twelve' }]} />
        <Chart data={rweaChart as never} y="CVA RWEA, EUR m (31 Dec 2025)" height={320} layout={{ barmode: 'stack', xaxis: { tickangle: -25 } }} />
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Bank</th><th>Approach disclosed</th><th>As reported</th><th>EUR m</th><th>On hedging</th><th>Source</th></tr></thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.bank}>
                  <td>{b.bank}</td><td>{b.approachText}</td><td>{b.reported}</td><td>{num(b.eurM, 1)}</td><td>{b.hedging ?? '—'}</td><td className="muted">{b.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">Sydbank's file uses the pre-CRR3 layout, so its amount cannot be assigned to an approach. DNB applied CRR3 from 1 April 2025, so its year straddles the change.</p>
      </Section>

      <Section title="3. The four banks that mix">
        <Chart data={splitChart as never} y="Share of the CVA amount (%)" height={280} layout={{ barmode: 'stack' }} />
        <p>
          SA-CVA carries the larger part at Danske, Nordea and ING, and BA-CVA at BNP Paribas. The banks do <strong>not</strong> describe the split the way
          the model makes it. Experiment F splits per counterparty by capital and finds the best split is always all BA-CVA (P4). The banks split on other lines:
        </p>
        <ul>
          <li><strong>Nordea:</strong> SA-CVA “for netting sets covered by the IMM” and BA-CVA “for the netting sets covered by SA-CCR”, so the split follows the exposure method.</li>
          <li><strong>BNP Paribas:</strong> SA-CVA where it has the permission of the competent authority, BA-CVA on the rest.</li>
          <li><strong>ING:</strong> BA-CVA “In case it is not possible to use the SA-CVA method (e.g., for regulatory or technical reasons)”.</li>
          <li><strong>Danske:</strong> SA-CVA covers most of the portfolio, BA-CVA what the SA-CVA model does not include.</li>
        </ul>
        <Example title="How to use this at the defence">
          If an examiner says “four of twelve banks mix, so your P4 is refuted”, the answer is that the banks split by exposure method or permission
          coverage, which the model does not have: it has one SA-CCR book and no IMM netting sets. P4 is a statement about this book. Mixing in practice is
          consistent with a permission or a fixed cost F driving the choice, but the disclosures cannot separate the two.
        </Example>
      </Section>

      <Section title="4. What each prediction can learn">
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Prediction</th><th>What the reports show</th><th>What they omit</th><th>Verdict</th></tr></thead>
            <tbody>
              {evidenceByPrediction.map((e) => (
                <tr key={e.p}><td>{e.p}</td><td>{e.seen}</td><td>{e.missing}</td><td>{e.verdict}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note title="The Art. 382(4b) amount is not missing by accident">
          No bank discloses what its excluded transactions would require. That is expected, not a disclosure failure: Art. 382(4b) requires the result to
          be <em>reported to the competent authority</em> and says nothing about public disclosure. Only Deutsche Bank comes close to a measured CRR3 effect:
          it attributes a 69 EUR m rise in its CVA own funds requirement to “the introduction of the new Basic Approach under CRR3”, within a year in which the
          requirement fell by 67 to 207 EUR m. That is the bank's own attribution, not the exemption effect the model measures.
        </Note>
      </Section>

      <Section title="5. Three ways to print EU CVA2 (Appendix F)">
        <p>
          Full BA-CVA banks fill template EU CVA2 with a row without hedges, U, a row with hedges, H, and a total. How the
          {' '}<Term name="Discount scalar">discount scalar</Term> DS = 0.65 enters the printed rows is not uniform. The thesis reconciles each bank against three readings:
        </p>
        <TexBlock>{String.raw`\text{A: } \mathrm{DS}\bigl(\beta U + (1-\beta)H\bigr) \qquad \text{B: } \beta U + \mathrm{DS}(1-\beta)H \qquad \text{C: } \beta U + (1-\beta)H`}</TexBlock>
        <p className="muted">
          B is the literal text of Art. 384(2) and 384(3): the unhedged term already contains the scalar, the hedged term does not. A has both rows before the scalar; C has
          both after it, or no scalar at all.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Bank</th><th>U</th><th>H</th><th>Printed total</th><th>A</th><th>B</th><th>C</th><th>Fits</th></tr></thead>
            <tbody>
              {cva2Rows.map((r) => (
                <tr key={r.bank}>
                  <td>{r.bank} ({r.unit})</td><td>{r.u}</td><td>{r.h}</td><td>{r.total}</td>
                  {(['A', 'B', 'C'] as const).map((k) => (
                    <td key={k} className={r.reading === k ? 'ok' : ''}>{num(readings[k](r.u, r.h), 1)}</td>
                  ))}
                  <td>{r.reading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Two banks fit A, two fit B, one fits C, and BNP Paribas fits none: its rows are “intermediate amounts”. So EU CVA2 cannot rank banks by hedge benefit. The
          reading the EBA left open for the earlier text, with the scalar on the hedged term only, gives the same total as B, so the template cannot tell those two apart.
        </p>
      </Section>

      <Takeaways
        items={[
          'Four of 12 banks mix SA-CVA and BA-CVA, three use full BA-CVA and four reduced BA-CVA; none uses SA-CVA alone.',
          'The mixers split by exposure method (IMM vs SA-CCR) or permission coverage, not per counterparty by capital as the model does.',
          'Nykredit and Handelsbanken state that they do not hedge: consistent with the first corner of P1, but no test of it.',
          'No bank discloses the Art. 382(4b) amount, because the article requires reporting to the supervisor, not disclosure.',
          'The disclosures can be consistent or inconsistent with a prediction; in this chapter they never confirm one.',
        ]}
      />
      <Quiz
        questions={[
          {
            q: 'Why can the Pillar 3 reports not confirm P2, the SA-CVA floor?',
            options: ['They are not audited', 'They omit the capital under the approach not chosen and the fixed cost of SA-CVA', 'SA-CVA is not used by any bank', 'They predate CRR3'],
            answer: 1,
            why: 'A bank reports only the approach it uses. Without the counterfactual charge and the cost F, the choice cannot be traced to the floor.',
          },
          {
            q: 'ING writes that “separate books exist for non-eligible hedges, such hedges are capitalized under the market risk framework”. What does that show?',
            options: [
              'That Title IV applies to hedges of excluded counterparties',
              'Art. 386(5) in practice for unrecognised hedges, but not tied to excluded counterparties',
              'That ING opts in under Art. 382(4a)',
              'That ING uses BA-CVA only',
            ],
            answer: 1,
            why: 'The statement is about eligible versus non-eligible hedges. ING ties it to no excluded counterparty, so it does not settle the thesis’s Title IV reading.',
          },
          {
            q: 'Swedbank prints U = 336, H = 296 and a total of 228 SEK m. Which reading fits?',
            options: ['A', 'B, the literal Art. 384(2)/(3)', 'C', 'None'],
            answer: 1,
            why: '0.25 × 336 + 0.65 × 0.75 × 296 = 84 + 144.3 = 228.3.',
          },
        ]}
      />
      <DefenceCorner id="pillar3" />
      <LessonFooter id="pillar3" />
    </article>
  );
}
