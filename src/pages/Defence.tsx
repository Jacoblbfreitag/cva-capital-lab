import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Toggle } from '../components/Controls';
import { DefenceCard, InPlainWords, LessonFooter, LessonHeader, Note, Section, Takeaways } from '../components/Lesson';
import { choiceKindLabels, choices, defenceQuestions, flashcards, openItems, type ChoiceKind } from '../data/defence';
import { headline } from '../data/results';
import { lessons } from '../lessons';

const topicLabel = (t: string) => (t === 'general' ? 'General' : `M${lessons.find((l) => l.id === t)?.number ?? '?'}`);

export default function Defence() {
  const [kind, setKind] = useState<'all' | ChoiceKind>('all');
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState<'all' | 'core' | 'hard'>('all');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const qs = defenceQuestions.filter((x) => (topic === 'all' || x.topic === topic) && (level === 'all' || x.level === level));
  const shownChoices = choices.filter((c) => kind === 'all' || c.kind === kind);
  const topics = ['all', ...new Set(defenceQuestions.map((x) => x.topic))];

  return (
    <article>
      <LessonHeader id="defence" />

      <Section title="1. The answer in one minute">
        <InPlainWords>
          <p>
            <strong>Choice of approach.</strong> The Art. 382(4) exclusions leave the ranking unchanged, except at the highest excluded shares. BA-CVA stays
            cheaper hedged and unhedged at the assumed σ. But the exclusions remove {headline.euRatGapCutPctMatched.toFixed(0)} % of SA-CVA's disadvantage at a
            full matched hedge ({headline.baselGapFullMatched} → {headline.euRatGapFullMatched} EUR m), because vega-heavy names leave SA-CVA while BA-CVA, already at
            its floor, loses only a quarter of their stand-alone charges.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Incentive to hedge.</strong> The exclusions create a hedging cliff on the names they cover. A CDS on an excluded name earns no relief and, on
            the thesis's reading, attracts a Title IV charge, so its capital incentive is negative. The opt-in removes the cliff only in favour of BA-CVA
            ({headline.euBAnoOptInFull} → {headline.euBAoptInFull}), while it raises SA-CVA ({headline.euSAnoOptInFull} → {headline.euSAoptInFull}). Under SA-CVA the incentive
            to hedge is weak in any case, because a CDS cannot reach the interest rate delta and vega charges.
          </p>
        </InPlainWords>
        <Note title="Three qualifiers to say before anyone asks">
          (1) The unhedged ranking turns on the uncalibrated σ (break-even ≈ {headline.sigmaCrossBp.toFixed(0)} bp). (2) The hedged comparison is at zero hedging cost
          and unequal notionals (129 vs 23 EUR m of CDS); at a common notional BA-CVA still wins, by as little as 0.09 EUR m (<Link to="/hedging">Module 6</Link>).
          (3) “Basel scope” is CRR3 without the exclusions, not MAR50.
        </Note>
      </Section>

      <Section title="2. What the 20 Nov 2026 draft changed">
        <p>If you last studied this app before the latest draft, these are the points that moved. No number moved: the results are still the v0.8 freeze.</p>
        <ul className="changelog">
          <li><strong>The EU baseline is now the rational cell</strong> (only in-scope names hedged). The old EU hedged cells, with every name hedged, are the “economic-hedge case”. A review panel found that those cells hedged excluded names, a strategy Ch. 4 rules out.</li>
          <li><strong>New headline:</strong> the exclusions narrow the SA − BA gap by 45 % at a full matched hedge (18 % at 5y; unhedged {headline.baselGapUnhedged} → {headline.euGapUnhedged}). The earlier line, that the exemptions “reinforce BA-CVA”, is gone.</li>
          <li><strong>The opt-in returns both approaches to the Basel level</strong>, not only BA-CVA. The claim that “the opt-in reverses the effect only under BA-CVA” was wrong.</li>
          <li><strong>Readings are labelled as readings:</strong> Title IV on hedges of excluded names; opt-in per counterparty and for hedged names only; EAD from SA-CCR “as assumed here”.</li>
          <li><strong>P1 and P2 are “mechanism verified numerically”</strong>, not “confirmed”: they follow from the formulas. P3 is confirmed in the economic-hedge case.</li>
          <li><strong>The discount scalar is no longer listed as an EU departure</strong>: in Art. 384(3) it sits inside the unhedged term, as in the Basel formula.</li>
          <li><strong>Regulatory precision:</strong> the simplified approach is tied to Art. 273a(2)/(4); Art. 386(4) frees only hedges entered into with third parties; points (aa) and (b) of Art. 382(4) in full, with Art. 382(4c).</li>
          <li><strong>New chapters:</strong> Ch. 2 background (with the Basel history), Ch. 7 Pillar 3 evidence (<Link to="/pillar3">Module 8</Link>) and Ch. 8 discussion: seven limitations, policy, the Art. 382(4b) report and an opt-in under BA-CVA for an SA-CVA bank (<Link to="/results">Module 7</Link>).</li>
        </ul>
      </Section>

      <Section title="3. Every choice the regulation does not settle">
        <p>
          An examiner will test whether you know which statements rest on the CRR3 text, which on a <em>reading</em> of it, and which on an assumption or a
          data constraint. For each one, know the reason, and which conclusion it could move.
        </p>
        <Toggle
          label="Kind"
          value={kind}
          onChange={setKind}
          options={[{ value: 'all', label: 'All' }, ...(Object.keys(choiceKindLabels) as ChoiceKind[]).map((k) => ({ value: k, label: choiceKindLabels[k] }))]}
        />
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Kind</th><th>Choice</th><th>Why</th><th>What it could move</th><th>Where</th></tr></thead>
            <tbody>
              {shownChoices.map((c) => (
                <tr key={c.choice}>
                  <td><span className={`kind-tag ${c.kind}`}>{choiceKindLabels[c.kind]}</span></td>
                  <td><strong>{c.choice}</strong></td><td>{c.why}</td><td>{c.moves}</td><td className="muted">{c.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. The question bank">
        <p className="muted">
          {defenceQuestions.length} questions. “Hostile examiner” questions follow the brief of the thesis's devil's-advocate reviewer: the weakest claims, the
          alternative explanations and the places where a result could flip. Where the honest answer includes a concession, it is shown under “Concede”.
        </p>
        <div className="defence-filters">
          <label className="select-label">
            Module
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All modules' : t === 'general' ? 'General' : `${topicLabel(t)} · ${lessons.find((l) => l.id === t)?.title}`}
                </option>
              ))}
            </select>
          </label>
          <Toggle value={level} onChange={setLevel} options={[{ value: 'all', label: 'All' }, { value: 'core', label: 'Expect it' }, { value: 'hard', label: 'Hostile' }]} />
        </div>
        {qs.map((x) => (
          <DefenceCard key={x.q} {...x} topicLabel={topicLabel(x.topic)} />
        ))}
      </Section>

      <Section title="5. Numbers to know">
        <p className="muted">Say the number before you click. EUR m unless stated.</p>
        <div className="flashcards">
          {flashcards.map((f, i) => {
            const open = revealed.has(i);
            return (
              <button
                type="button"
                key={f.label}
                className="flashcard"
                onClick={() => setRevealed((s) => { const n = new Set(s); if (open) n.delete(i); else n.add(i); return n; })}
              >
                <div className="fc-label">{f.label}</div>
                {open ? <div className="fc-value">{f.value}</div> : <div className="fc-hidden">? ? ?</div>}
                {open && <div className="fc-context">{f.context}</div>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="6. Open points in the draft">
        <p>These are known to the author and flagged in the draft. An examiner reading a version with them still in could raise them, so have the answer ready.</p>
        <div className="table-wrap">
          <table className="data wrap">
            <thead><tr><th>Open point</th><th>What to say</th><th>Where</th></tr></thead>
            <tbody>
              {openItems.map((o) => (
                <tr key={o.item}><td>{o.item}</td><td>{o.say}</td><td className="muted">{o.where}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Takeaways
        items={[
          'Lead with the two-part answer, and give the three qualifiers before you are asked: σ, unequal notionals at zero hedging cost, and what “Basel scope” means.',
          'Keep readings and assumptions apart. The Title IV treatment of excluded hedges is a reading, and the 45 % narrowing does not depend on it.',
          'Concede what the thesis does not show: no swaption hedges, no calibrated σ, a stylised book with one dominant name, and Pillar 3 data that can only be consistent.',
          'Every number traces to a run folder and a macro. Say so when asked how you know a number is right.',
        ]}
      />
      <LessonFooter id="defence" />
    </article>
  );
}
