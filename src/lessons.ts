/** The course outline. Add a lesson here and it appears in the sidebar and overview. */
export interface LessonInfo {
  id: string;
  number: number;
  path: string;
  title: string;
  summary: string;
  goals: string[];
}

export const lessons: LessonInfo[] = [
  {
    id: 'thesis',
    number: 0,
    path: '/thesis',
    title: 'Start here: the thesis in one page',
    summary: 'The research question, why CVA capital matters, the three choices a bank makes, and the four answers.',
    goals: [
      'State the research question and why it matters for EU banks',
      'Name the two CRR3 approaches (BA-CVA, SA-CVA) and the Art. 382(4) exemptions',
      'Describe the stylised book of 17 counterparties the thesis uses',
      'Summarise the four predictions and how each fared',
    ],
  },
  {
    id: 'cva',
    number: 1,
    path: '/cva',
    title: 'CVA and counterparty exposure',
    summary: 'What credit valuation adjustment is, how a swap’s exposure evolves, and the regulatory CVA of Art. 383a.',
    goals: [
      'Explain CVA as the price of counterparty default risk',
      'Read an expected exposure (EE) and PFE profile of a swap',
      'Compute regulatory CVA from EE, the credit spread and LGD',
      'Explain why CVA risk (the variability of CVA) needs its own capital charge',
    ],
  },
  {
    id: 'sa-ccr',
    number: 2,
    path: '/sa-ccr',
    title: 'SA-CCR: the exposure value BA-CVA uses',
    summary: 'The supervisory formula that turns a netting set of swaps into an exposure at default, with no simulation.',
    goals: [
      'Compute adjusted notional, supervisory delta and maturity factor for a swap',
      'Aggregate risk positions across maturity buckets into the add-on',
      'Explain why netting and margin lower the exposure value',
      'Explain why SA-CCR makes BA-CVA independent of the exposure model',
    ],
  },
  {
    id: 'ba-cva',
    number: 3,
    path: '/ba-cva',
    title: 'BA-CVA: the basic approach',
    summary: 'Risk weights, the stand-alone charge, the reduced and full versions, and the thesis’s closed form for hedging.',
    goals: [
      'Compute SCVA_c from the risk weight, maturity, EAD and discount factor',
      'Aggregate counterparties with the ρ = 0.5 single-factor formula',
      'Recognise CDS hedges through SNH_c and explain the β = 0.25 floor',
      'Derive K_total = K_reduced · (β + (1 − β)|1 − r|) and read its V shape',
    ],
  },
  {
    id: 'sa-cva',
    number: 4,
    path: '/sa-cva',
    title: 'SA-CVA: the standardised approach',
    summary: 'CVA sensitivities, risk weights, buckets and correlations, and the floor that a CDS cannot remove.',
    goals: [
      'Explain the three risk classes in the book: credit spread delta, interest rate delta and vega',
      'Turn sensitivities into weighted sensitivities, bucket capital and class capital',
      'Explain the hedging disallowance R = 0.01',
      'Show why K_IR + K_vega is a floor under SA-CVA whatever CDS notional is bought',
    ],
  },
  {
    id: 'exemptions',
    number: 5,
    path: '/exemptions',
    title: 'The EU exemptions and the opt-in',
    summary: 'Art. 382(4) takes some counterparties out of the charge; Art. 382(4a) lets a bank put hedged ones back.',
    goals: [
      'Name the exemption letters and which counterparties of the book they cover',
      'Compare Basel scope and EU scope under both approaches',
      'Explain why hedging an excluded counterparty adds a market-risk charge (Art. 386(5))',
      'Explain why the opt-in helps BA-CVA and hurts SA-CVA',
    ],
  },
  {
    id: 'hedging',
    number: 6,
    path: '/hedging',
    title: 'The incentive to hedge',
    summary: 'How much capital a CDS saves under each approach, and how the tenor and the notional of the hedge matter.',
    goals: [
      'Read the hedge ladder for both approaches and both scopes',
      'Explain why the tenor matters for SA-CVA but enters BA-CVA only through r',
      'Explain why over-hedging is penalised under BA-CVA',
      'Compare the market-risk charge per euro of CVA relief',
    ],
  },
  {
    id: 'results',
    number: 7,
    path: '/results',
    title: 'Results, robustness and limits',
    summary: 'The four predictions against the results, mixing the approaches, model risk from σ, and what could change the answer.',
    goals: [
      'State which approach is cheaper with and without hedges, and why',
      'Explain why mixing the approaches gains nothing for this book',
      'Explain why the unhedged ranking depends on σ but the hedged ranking does not',
      'Name the limitations and what further work could change',
    ],
  },
];
