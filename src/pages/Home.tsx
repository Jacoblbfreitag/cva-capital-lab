import { Link } from 'react-router-dom';
import { lessons } from '../lessons';
import { headline } from '../data/results';

export function Home() {
  return (
    <div className="home">
      <header className="hero">
        <h1>CVA Capital Lab</h1>
        <p>
          An interactive explainer of the MSc thesis <em>CVA Capital under CRR3: EU Exemptions, the Choice between SA-CVA
          and BA-CVA, and the Incentive to Hedge</em> (cand.polit., University of Copenhagen, 2026). It walks from what
          CVA is to the thesis's results. Every formula is rebuilt in this app's code from the CRR3 text, and every result
          comes with a chart you can push around.
        </p>
      </header>

      <section className="section answer">
        <h2>The answer in one paragraph</h2>
        <p>
          On the thesis's book of 17 swap counterparties, <strong>BA-CVA is the cheaper approach</strong> with or without
          hedges. Unhedged, SA-CVA costs {headline.baselSA} against {headline.baselBA} EUR m. About a third of that is
          interest rate vega, which the exposure model's volatility drives. Fully hedged with CDS, BA-CVA falls to its supervisory floor of{' '}
          {headline.betaFloor} EUR m, while SA-CVA cannot go below its interest rate and vega charges, about {headline.matchedSAfloor} EUR m.
          The EU exemptions lower both charges. But a CDS bought on an <em>excluded</em> counterparty adds a market-risk charge and
          saves nothing, unless the bank opts that counterparty back in. The opt-in pays under BA-CVA and costs capital under SA-CVA.
        </p>
      </section>

      <section className="section">
        <h2>How to use this</h2>
        <ol className="how">
          <li>
            <strong>Short on time? Read <Link to="/thesis">Module 0</Link>.</strong> It is the whole thesis on one page.
          </li>
          <li>
            <strong>Go in order for the full story.</strong> Modules 1–2 are the ingredients (CVA, exposure, SA-CCR). Modules 3–4
            are the two capital approaches. Modules 5–7 are the thesis's own contribution: exemptions, hedging incentives and results.
          </li>
          <li>
            <strong>Do the "Try this" boxes.</strong> Predict what a chart will do before you move the slider.
          </li>
          <li>
            <strong>Live vs frozen numbers.</strong> SA-CCR and BA-CVA are recomputed live in your browser from the portfolio.
            SA-CVA needs 200 000 Monte Carlo paths, so its charts read the thesis's frozen run. The app re-aggregates those
            sensitivities with the Art. 383b formulas, and the tests check that both reproduce the thesis to the third decimal.
          </li>
          <li>
            <strong>Forgot a term?</strong> Look it up in the <Link to="/glossary">glossary</Link>.
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>Modules</h2>
        <div className="cards">
          {lessons.map((l) => (
            <Link key={l.id} to={l.path} className="card">
              <div className="card-num">Module {l.number}</div>
              <div className="card-title">{l.title}</div>
              <div className="card-summary">{l.summary}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Map of the course</h2>
        <div className="roadmap">
          <div><strong>Ingredients</strong><span>CVA · expected exposure · Hull–White · SA-CCR</span></div>
          <div><strong>Two capital approaches</strong><span>BA-CVA (Art. 384) · SA-CVA (Art. 383)</span></div>
          <div><strong>The EU twist</strong><span>Art. 382(4) exemptions · opt-in · Art. 386(5) market-risk charge</span></div>
          <div><strong>Incentives &amp; results</strong><span>Hedge ladder · tenor · mixing approaches · robustness</span></div>
        </div>
        <p className="muted">
          Regulatory source: Regulation (EU) 575/2013 as amended by (EU) 2024/1623 (CRR3), Title VI Art. 382–386 and the
          SA-CCR articles 274–280a. Basel MAR50 is cited in the thesis for comparison only. No parameter in this app comes from it.
        </p>
      </section>
    </div>
  );
}
