# CVA Capital Lab

An interactive explainer of the MSc thesis *CVA Capital under CRR3: EU Exemptions, the Choice between SA-CVA and BA-CVA, and the Incentive to Hedge* (cand.polit., University of Copenhagen, 2026).
It starts from what CVA is and goes as far as the thesis's results: which approach is cheaper, what the EU exemptions do, and how much a CDS hedge saves under each approach.
SA-CCR, BA-CVA and the SA-CVA aggregation are rebuilt from the CRR3 text in TypeScript. Every idea comes with a chart you can push around.

**▶ [Open the app](https://jacoblbfreitag.github.io/cva-capital-lab/)**

It is a sibling of [rates-options-lab](https://github.com/Jacoblbfreitag/rates-options-lab) and [energy-commodities-lab](https://github.com/Jacoblbfreitag/energy-commodities-lab) and uses the same lesson format and building blocks.
The research code lives in the thesis repository, `cva-capital-crr3`.

## Modules

| # | Module | What you learn |
|---|--------|----------------|
| 0 | Start here: the thesis in one page | The research question and its two-part answer, the two approaches, the bank's three choices, the four predictions and verdicts |
| 1 | CVA and counterparty exposure | EE and PFE of a swap (live Hull–White Monte Carlo), regulatory CVA of Art. 383a, why CVA risk needs capital, Basel III to CRR3 |
| 2 | SA-CCR | Supervisory duration, delta, maturity factor, bucket netting, margin; the EAD of every netting set in the book |
| 3 | BA-CVA | Risk weights, SCVA, the reduced and full versions, the β floor, the closed form K_reduced·(β + (1−β)\|1−r\|) |
| 4 | SA-CVA | Sensitivities, buckets and correlations; credit spread delta, rate delta and vega; the floor a CDS cannot remove |
| 5 | The EU exemptions and the opt-in | Art. 382(4) points, the rational EU cell and the narrowing SA − BA gap (2.45 → 1.35), the Title IV reading and the hedging cliff, the opt-in, the Art. 382(4b) report |
| 6 | The incentive to hedge | Hedge ladder, equal-notional V shape, the ranking at a common notional, tenor sweeps, market-risk charge per euro of relief |
| 7 | Results, limitations and policy | The answer to the research question, mixing the approaches, σ robustness and break-even, the seven limitations of Ch. 8, policy, reproducibility |
| 8 | Evidence from Pillar 3 disclosures | The CVA approach and hedging of 12 banks at 31 Dec 2025, what each prediction can learn, the three readings of EU CVA2 |
| 9 | Defending the thesis | Every modelling choice and regulatory reading with its reason, a bank of examiner questions with honest answers, numbers to know, open points in the draft |

Each lesson follows the same pattern: a plain-words explanation, the formula with a symbol table, interactive charts, "Try this" exercises,
key takeaways, a short quiz and a **Defence corner** of examiner questions. Hover any underlined term for its definition, or browse the searchable glossary.

The app follows the thesis draft of 20 November 2026 (branch `results/v0.8-vega-mixed-approach`). That draft made the rational EU cell (only the names
in the calculation hedged) the EU baseline, found that the exclusions narrow SA-CVA's disadvantage rather than reinforce BA-CVA, marked the Title IV
treatment of excluded hedges and the per-name opt-in as readings, and added the Pillar 3 and discussion chapters. Module 9 lists every change.

## Live vs frozen numbers

- **Computed live in the browser:** SA-CCR exposure values, every BA-CVA number (unhedged, hedged, any exemption set you tick),
  the SA-CVA aggregation (Art. 383b) applied to the thesis's sensitivities, and a small single-swap Hull–White simulation.
- **Read from the thesis's frozen run:** the 200 000-path sensitivities and exposure profiles, and the experiment grids A–F and the
  robustness block (commit `8b2bae3`, run `20261022T174025Z`, the v0.8 freeze with interest rate vega).

`npm test` checks that the live models reproduce the frozen thesis numbers.

## Running locally

Requires Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:5173/cva-capital-lab/
npm test         # model, glossary and page-render tests
npm run build    # type-check + production build into dist/
```

To refresh the data after a new thesis run (standard-library Python only):

```bash
python scripts/export_results.py ../cva-capital-crr3
```

## Project layout

```
src/
  models/        pure TypeScript, no UI; each parameter cites its CRR3 article
    saCcr.ts         SA-CCR exposure value, Art. 274–280a
    baCva.ts         BA-CVA reduced and full versions, Art. 384; the thesis's closed form
    saCva.ts         SA-CVA aggregation, Art. 383b with the tables of Art. 383k–383r
    exposure.ts      single-swap Hull–White exposure and regulatory CVA, Art. 383a
    math/            normal distribution, seeded RNG (shared with the sibling labs)
  data/
    portfolio.ts     the 17-counterparty book (config/portfolio.yaml in the thesis)
    results.ts       typed access to the frozen results + the headline numbers of numbers.tex
    results/*.json   exported by scripts/export_results.py
    pillar3.ts       the 12 banks of thesis Ch. 7 and the EU CVA2 reconciliation of Appendix F
    defence.ts       examiner questions per module, modelling choices, open points, numbers to know
    glossary.ts
  components/    charts, sliders, formulas, lesson blocks
  pages/         one file per module
scripts/export_results.py   thesis results → src/data/results/*.json
tests/           model checks against the thesis, glossary links, page render smoke test
```

## What the tests check

- SA-CCR: single-swap EAD = 1.4 · 0.005 · N · SD; offsetting trades in one bucket net to zero; margin gives MF = 0.3
- BA-CVA from the portfolio: **8.473** EUR m in Basel scope and **7.133** in EU scope, as in the thesis
- With no hedges the full version equals the reduced version; the closed form holds and over- and under-hedging cost the same
- Every point of the frozen hedge ladder lies on K_reduced·(β + (1−β)|1−r|) to 10⁻⁶
- SA-CVA rebuilt from the frozen sensitivities matches the thesis's K_CCS, K_IR and K_vega to 10⁻⁴ in both scopes
- A perfect CDS strip leaves exactly K_IR + K_vega plus the hedging disallowance residual
- Exposure model: EE humps and ends at zero, PFE ≥ EE, CVA rises with spread and σ
- The rational EU cell reproduces the draft's gap macros: 2.45 → 1.35 EUR m (45.01 % removed) matched, 6.80 → 5.57 (18.16 %) at five years, 2.07 → 1.48 unhedged
- At a common notional (experiment E2b) BA-CVA is cheaper in all 15 cells, closest 0.09 EUR m at 50 EUR m of 7-year CDS
- The Pillar 3 conversions match Table 7.1, and each bank's EU CVA2 reading reproduces its printed total (Appendix F)
- Every glossary link and every `<Term>` in a lesson resolves; every page renders with finite chart data

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to GitHub Pages.
In the repo settings set **Pages → Source** to **GitHub Actions**. The `base` in `vite.config.ts` must match the repo name
(`/cva-capital-lab/`), and the "In the code" links in `src/components/Lesson.tsx` assume the same name.

## Sources

- Regulation (EU) No 575/2013 as amended by Regulation (EU) 2024/1623 (CRR3): Art. 162, 274–285, 382–386, 325e–325ak
- The banks' Pillar 3 reports for 31 December 2025 as cited in thesis Chapter 7 (Danske Bank, Nordea, Nykredit, Jyske Bank, Sydbank, SEB, Swedbank, Handelsbanken, DNB, Deutsche Bank, BNP Paribas, ING)
- BCBS, Basel Framework MAR50 (CVA risk), for comparison only; no parameter in this app comes from it
- J. Hull & A. White, "Pricing Interest-Rate-Derivative Securities", *Review of Financial Studies* (1990)
- J. Gregory, *The xVA Challenge* (Wiley, 4th ed. 2020)

The portfolio is stylised, not a real bank's book, and nothing here is regulatory or investment advice.
