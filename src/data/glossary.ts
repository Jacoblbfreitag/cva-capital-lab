/**
 * Glossary of terms used in the course.
 * To add a term, add an entry here — the Glossary page sorts and indexes it automatically.
 *   module:  lesson id from src/lessons.ts where the term is taught
 *   formula: optional LaTeX (rendered with KaTeX)
 *   related: other glossary terms (exact `term` names) to link to
 */
export interface GlossaryEntry {
  term: string;
  aka?: string[];
  definition: string;
  formula?: string;
  module?: string;
  related?: string[];
}

export const glossary: GlossaryEntry[] = [
  // ── The thesis ──
  {
    term: 'CRR3',
    aka: ['Capital Requirements Regulation', 'Regulation (EU) 2024/1623'],
    definition: 'The EU Capital Requirements Regulation (575/2013) as amended by Regulation (EU) 2024/1623, the EU implementation of the final Basel III reforms. Title VI (Art. 381–386) sets the own funds requirement for CVA risk.',
    module: 'thesis',
    related: ['BA-CVA', 'SA-CVA', 'Art. 382(4) exemptions'],
  },
  {
    term: 'Basel scope',
    definition: 'In the thesis: every counterparty in the CVA charge, as under the Basel standard (MAR50), which has no EU-style exemptions.',
    module: 'thesis',
    related: ['EU scope'],
  },
  {
    term: 'EU scope',
    definition: 'In the thesis: the CVA charge with the Art. 382(4) exempt counterparties removed. Nine of the 17 counterparties are exempt.',
    module: 'exemptions',
    related: ['Basel scope', 'Art. 382(4) exemptions', 'Opt-in'],
  },
  {
    term: 'Own funds requirement',
    aka: ['Capital requirement', 'K'],
    definition: 'The amount of capital a bank must hold, in euros. The thesis reports all charges as own funds requirements in EUR millions, not as risk-weighted exposure amounts (RWA = 12.5 × K).',
    module: 'thesis',
  },

  // ── CVA and exposure ──
  {
    term: 'CVA',
    aka: ['Credit valuation adjustment'],
    definition: 'The market value of counterparty default risk on a derivative: the expected loss from the counterparty defaulting while the trade is worth something to the bank. It is deducted from the trade’s value.',
    formula: String.raw`\mathrm{CVA} = \mathrm{LGD}\sum_k (S_{k-1}-S_k)\,\tfrac{\mathrm{dEE}_{k-1}+\mathrm{dEE}_k}{2}`,
    module: 'cva',
    related: ['CVA risk', 'Expected exposure', 'LGD'],
  },
  {
    term: 'CVA risk',
    definition: 'The risk of losses from changes in CVA, caused by moves in counterparty credit spreads and in the exposure (interest rates, volatility). In 2007–09 these mark-to-market losses exceeded actual default losses. It is what the CVA capital charge covers.',
    module: 'cva',
    related: ['CVA', 'BA-CVA', 'SA-CVA'],
  },
  {
    term: 'Expected exposure',
    aka: ['EE', 'dEE'],
    definition: 'The average, over simulated scenarios, of max(value of the netting set, 0) at a future date. dEE is the discounted version that enters the CVA formula.',
    module: 'cva',
    related: ['Potential future exposure', 'CVA'],
  },
  {
    term: 'Potential future exposure',
    aka: ['PFE'],
    definition: 'A high quantile (here 95 %) of the future exposure distribution at a date. In SA-CCR, "PFE" is instead the supervisory add-on term.',
    module: 'cva',
    related: ['Expected exposure', 'SA-CCR'],
  },
  {
    term: 'LGD',
    aka: ['Loss given default', 'LGD_MKT'],
    definition: 'The share of the exposure lost if the counterparty defaults. Art. 383a uses the market-consensus LGD implied by CDS. The thesis uses 40 % for every name.',
    module: 'cva',
  },
  {
    term: 'Hull–White model',
    aka: ['HW1F', 'G1++'],
    definition: 'A one-factor Gaussian short-rate model, dr = (θ(t) − a·r)dt + σ dW, fitted exactly to today’s curve. The thesis uses a = 0.03 and σ = 0.008 (80 bp) to simulate swap exposures on 200 000 paths.',
    module: 'cva',
    related: ['Expected exposure', 'Vega'],
  },
  {
    term: 'Credit spread',
    definition: 'The extra yield (or CDS premium) a counterparty pays for its credit risk. The regulatory CVA model reads it at five vertices, 0.5/1/3/5/10 years, and turns it into survival probabilities S(t) = exp(−s·t/LGD).',
    module: 'cva',
    related: ['CDS', 'Vertex'],
  },
  {
    term: 'Netting set',
    definition: 'A group of trades with one counterparty under a legally enforceable netting agreement. Their values offset, so exposure is measured on the net.',
    module: 'sa-ccr',
    related: ['SA-CCR', 'EAD'],
  },

  // ── SA-CCR ──
  {
    term: 'SA-CCR',
    aka: ['Standardised approach for counterparty credit risk'],
    definition: 'The supervisory formula of CRR3 Art. 274–280f that computes the exposure value of a netting set from notional, maturity and direction, with no simulation. BA-CVA takes its EAD from SA-CCR.',
    formula: String.raw`\mathrm{EAD} = 1.4\,(\mathrm{RC} + \text{multiplier}\cdot\mathrm{AddOn})`,
    module: 'sa-ccr',
    related: ['EAD', 'Supervisory duration', 'Maturity factor'],
  },
  {
    term: 'EAD',
    aka: ['Exposure at default', 'Exposure value'],
    definition: 'The exposure amount a capital formula uses for a netting set. Under SA-CCR, α = 1.4 times replacement cost plus potential future exposure.',
    module: 'sa-ccr',
    related: ['SA-CCR'],
  },
  {
    term: 'Supervisory duration',
    aka: ['SD'],
    definition: 'Art. 279b: the duration of an interest rate trade at a fixed 5 % rate, (e^{−0.05S} − e^{−0.05E})/0.05. It turns notional into adjusted notional.',
    module: 'sa-ccr',
  },
  {
    term: 'Maturity factor',
    aka: ['MF'],
    definition: 'Art. 279c: scales the add-on for the horizon over which exposure can build up. 1 for unmargined trades longer than a year, 1.5·√(MPoR/250) for margined ones (0.3 with a 10-day MPoR).',
    module: 'sa-ccr',
    related: ['Margin period of risk'],
  },
  {
    term: 'Margin period of risk',
    aka: ['MPoR'],
    definition: 'The time between the last margin exchange and closing out a defaulted counterparty. At least 10 business days for OTC derivatives with daily margin (Art. 285(2)(b)).',
    module: 'sa-ccr',
  },

  // ── BA-CVA ──
  {
    term: 'BA-CVA',
    aka: ['Basic approach'],
    definition: 'The basic approach for CVA risk, CRR3 Art. 384. A supervisory formula built on risk weights by sector and rating and SA-CCR exposure. The reduced version ignores hedges. The full version recognises CDS hedges subject to the β floor.',
    formula: String.raw`K_{\mathrm{total}} = \beta K_{\mathrm{reduced}} + \mathrm{DS}(1-\beta)K_{\mathrm{hedged}}`,
    module: 'ba-cva',
    related: ['SCVA', 'Beta floor', 'Recognition ratio', 'SA-CVA'],
  },
  {
    term: 'SCVA',
    aka: ['Stand-alone CVA charge', 'SCVA_c'],
    definition: 'The BA-CVA charge of one counterparty on its own: risk weight × Σ maturity × EAD × discount factor, divided by α = 1.4.',
    formula: String.raw`\mathrm{SCVA}_c = \tfrac{1}{\alpha}\mathrm{RW}_c\sum_{NS} M_{NS}\,\mathrm{EAD}_{NS}\,\mathrm{DF}_{NS}`,
    module: 'ba-cva',
    related: ['BA-CVA', 'Risk weight'],
  },
  {
    term: 'Risk weight',
    aka: ['RW'],
    definition: 'How much capital a unit of exposure or sensitivity attracts. BA-CVA: 0.5–12 % by sector and credit quality (Art. 384(2) Table 1). SA-CVA: per bucket and vertex (Art. 383p, 383k).',
    module: 'ba-cva',
    related: ['Credit quality step', 'Bucket'],
  },
  {
    term: 'Credit quality step',
    aka: ['CQS'],
    definition: 'The EU’s six-step rating scale, mapped from external ratings. CRR3 splits risk weights into CQS 1–3 (investment grade) and CQS 4–6 or unrated, where Basel uses IG/HY.',
    module: 'ba-cva',
  },
  {
    term: 'Discount scalar',
    aka: ['DS_CVA'],
    definition: 'DS_CVA = 0.65 in Art. 384. It scales BA-CVA down. The thesis applies it inside the reduced formula, so the full version with no hedges equals the reduced version.',
    module: 'ba-cva',
  },
  {
    term: 'Beta floor',
    aka: ['β', 'β floor'],
    definition: 'β = 0.25 in Art. 384(2): a quarter of the unhedged BA-CVA charge stays whatever the hedges. On the thesis book the floor is 0.25 × 8.47 = 2.12 EUR m.',
    module: 'ba-cva',
    related: ['BA-CVA', 'Recognition ratio'],
  },
  {
    term: 'Recognition ratio',
    aka: ['r', 'SNH / SCVA'],
    definition: 'SNH_c / SCVA_c: how much of a counterparty’s stand-alone charge its CDS hedges offset. With the same r for every name, BA-CVA = K_reduced·(β + (1 − β)|1 − r|).',
    formula: String.raw`K_{\mathrm{total}} = K_{\mathrm{reduced}}\bigl(\beta + (1-\beta)\lvert 1-r\rvert\bigr)`,
    module: 'ba-cva',
    related: ['SNH', 'Beta floor'],
  },
  {
    term: 'SNH',
    aka: ['SNH_c', 'Single-name hedge recognition'],
    definition: 'Σ_h r_hc · RW_h · M_h · B_h · DF_h, the recognised amount of single-name CDS on counterparty c in BA-CVA. r_hc is 1, 0.8 or 0.5 for a direct, legally related or same-sector proxy hedge.',
    module: 'ba-cva',
    related: ['HMA', 'Recognition ratio'],
  },
  {
    term: 'HMA',
    aka: ['Hedge mismatch'],
    definition: 'Σ_h (1 − r_hc²)(RW_h M_h B_h DF_h)²: a penalty in BA-CVA for hedges that do not reference the counterparty itself. Zero for direct hedges.',
    module: 'ba-cva',
    related: ['SNH'],
  },

  // ── SA-CVA ──
  {
    term: 'SA-CVA',
    aka: ['Standardised approach'],
    definition: 'The standardised approach for CVA risk, CRR3 Art. 383. It aggregates the sensitivities of the bank’s regulatory CVA to market risk factors with prescribed risk weights and correlations. It requires supervisory approval.',
    formula: String.raw`K_{\mathrm{SA}} = K_{\mathrm{CCS}} + K_{\mathrm{IR}} + K_{\mathrm{vega}}`,
    module: 'sa-cva',
    related: ['Sensitivity', 'Vega', 'Hedging disallowance', 'BA-CVA'],
  },
  {
    term: 'Sensitivity',
    aka: ['Delta', 's_k'],
    definition: 'How much the aggregate CVA changes for a small bump of one risk factor, divided by the bump: e.g. (CVA(spread + 1 bp) − CVA)/0.0001 (Art. 383i).',
    module: 'sa-cva',
    related: ['Vertex', 'Vega'],
  },
  {
    term: 'Vertex',
    aka: ['Tenor point'],
    definition: 'A maturity at which a curve is bumped. Counterparty credit spread: 0.5/1/3/5/10 years (Art. 383e(1)). Interest rate: 1/2/5/10/30 years (Art. 383c(1)). There is no credit spread vertex beyond 10 years.',
    module: 'sa-cva',
  },
  {
    term: 'Bucket',
    definition: 'A group of risk factors aggregated together before buckets are combined with cross-bucket γ. Credit spread buckets are by sector and quality (Art. 383p Table 1); interest rates have one bucket per currency.',
    module: 'sa-cva',
  },
  {
    term: 'Vega',
    aka: ['Interest rate vega'],
    definition: 'The sensitivity of CVA to the volatility used in the exposure model, for a 1 % relative bump (Art. 383j). Its risk weight is 100 %. It makes up a third of unhedged SA-CVA on the thesis book, and a CDS cannot hedge it.',
    module: 'sa-cva',
    related: ['Hull–White model', 'SA-CVA floor'],
  },
  {
    term: 'Hedging disallowance',
    aka: ['R'],
    definition: 'R = 0.01 in Art. 383b(7): R·Σ(WS^hedge)² stays inside each bucket’s capital, so even a perfect hedge leaves a residual of √R = 10 % of the root sum of squared hedge sensitivities (about 7 % of the unhedged credit spread charge on the thesis book).',
    module: 'sa-cva',
  },
  {
    term: 'SA-CVA floor',
    definition: 'In the thesis: K_IR + K_vega, the part of SA-CVA that single-name CDS cannot reduce. About 4.03 EUR m in Basel scope, above the BA-CVA floor of 2.12.',
    formula: String.raw`K_{\mathrm{SA}} \geq K_{\mathrm{IR}} + K_{\mathrm{vega}}`,
    module: 'sa-cva',
    related: ['Beta floor', 'Vega'],
  },
  {
    term: 'CDS',
    aka: ['Credit default swap'],
    definition: 'A contract that pays the protection buyer the loss on a reference name if it defaults, in exchange for a running premium. Bought single-name CDS are the CVA hedge in the thesis.',
    module: 'hedging',
    related: ['Credit spread', 'SNH'],
  },

  // ── Exemptions ──
  {
    term: 'Art. 382(4) exemptions',
    aka: ['Exempt counterparties', 'Excluded transactions'],
    definition: 'EU-only exclusions from the CVA charge: (a) non-financials below the EMIR clearing threshold, (b) intragroup trades, (c) pension schemes during the EMIR transition, (d) counterparties with a 0 % risk weight. The charge is still computed and reported (Art. 382(4b)).',
    module: 'exemptions',
    related: ['EU scope', 'Opt-in', 'EMIR clearing threshold'],
  },
  {
    term: 'EMIR clearing threshold',
    aka: ['NFC+', 'NFC−'],
    definition: 'The EMIR level of OTC derivative positions above which a non-financial company must clear. Below it (NFC−), its trades are exempt from the CVA charge under Art. 382(4)(a).',
    module: 'exemptions',
  },
  {
    term: 'Opt-in',
    aka: ['Art. 382(4a)'],
    definition: 'CRR3 lets a bank include exempt transactions that it hedges with eligible CVA hedges in the CVA charge, so the hedges are recognised instead of charged under market-risk rules.',
    module: 'exemptions',
    related: ['Market-risk charge', 'Art. 382(4) exemptions'],
  },
  {
    term: 'Market-risk charge',
    aka: ['FRTB charge', 'Title IV charge', 'Art. 386(5)'],
    definition: 'CDS that hedge CVA risk but are not recognised in the CVA charge (e.g. on exempt names without the opt-in) are trading-book positions and attract the FRTB sensitivities-based charge for credit spread risk.',
    module: 'exemptions',
    related: ['Opt-in', 'FRTB'],
  },
  {
    term: 'FRTB',
    aka: ['Fundamental Review of the Trading Book'],
    definition: 'The Basel market-risk framework, in CRR3 Part Three Title IV. Its sensitivities-based method has the same structure as SA-CVA. It is computed under low, medium and high correlation scenarios, and the highest result counts.',
    module: 'exemptions',
  },

  // ── Hedging & results ──
  {
    term: 'Hedge ratio',
    definition: 'In the thesis ladders: the share of what each approach measures that the CDS offsets. Under BA-CVA it equals the recognition ratio r. Under SA-CVA it is the share of the vertex credit spread delta.',
    module: 'hedging',
    related: ['Recognition ratio'],
  },
  {
    term: 'Matched tenor',
    definition: 'A CDS whose maturity equals the longest trade with that counterparty (experiment E1), rather than the standard five years. It halves hedged SA-CVA and leaves BA-CVA unchanged at fixed recognition.',
    module: 'hedging',
    related: ['Vertex'],
  },
  {
    term: 'Mixed approach',
    aka: ['Art. 382a(3)'],
    definition: 'Using SA-CVA for some counterparties and BA-CVA for the rest. Because both charges aggregate through square roots, the split must be searched jointly. On the thesis book the best split is all BA-CVA in every cell.',
    module: 'results',
  },
  {
    term: 'Break-even volatility',
    definition: 'The Hull–White σ at which unhedged SA-CVA equals BA-CVA: about 66 bp, between the historical one-year (63 bp) and two-year (81 bp) anchors.',
    module: 'results',
    related: ['Vega', 'Hull–White model'],
  },
];
