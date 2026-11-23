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
    summary: 'The research question, the two-part answer, the three choices a bank makes, and the four predictions with their verdicts.',
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
    summary: 'Art. 382(4) takes some counterparties out of the charge; Art. 382(4a) lets a bank put hedged ones back. The rational cell, the narrowing gap and the hedging cliff.',
    goals: [
      'Name the exemption letters and which counterparties of the book they cover',
      'Compare Basel scope and EU scope under both approaches, unhedged and in the rational hedged cell',
      'Explain why the exclusions narrow SA-CVA’s disadvantage (2.45 → 1.35 EUR m) without reversing it',
      'Explain why, on the thesis’s reading, a CDS on an excluded name attracts a Title IV charge',
      'Explain why the opt-in returns both approaches to the Basel level: down for BA-CVA, up for SA-CVA',
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
    title: 'Results, limitations and policy',
    summary: 'The answer to the research question, mixing the approaches, model risk from σ, the seven limitations and the policy reading of Ch. 8.',
    goals: [
      'Give the two-part answer to the research question',
      'State which approach is cheaper with and without hedges, and why',
      'Explain why mixing the approaches gains nothing for this book',
      'Explain why the unhedged ranking depends on σ but the hedged ranking does not',
      'Name the seven limitations, the conclusion each could move and in which direction',
      'Explain what the Art. 382(4b) report shows a supervisor and what it hides',
    ],
  },
  {
    id: 'pillar3',
    number: 8,
    path: '/pillar3',
    title: 'Evidence from Pillar 3 disclosures',
    summary: 'What nine Nordic and three EU banks disclose about their CVA approach and hedges, and why it can be consistent with a prediction but never confirm it.',
    goals: [
      'Say which of the 12 banks mix the approaches, use full or reduced BA-CVA',
      'Explain why the disclosures cannot test P1–P4 directly',
      'Read the EU CVA2 rows under the three readings of the discount scalar',
      'Use the Pillar 3 quotes (Nykredit, ING, Danske) correctly in a defence answer',
    ],
  },
  {
    id: 'defence',
    number: 9,
    path: '/defence',
    title: 'Defending the thesis',
    summary: 'Every modelling choice and regulatory reading with its reason, the hostile questions with honest answers, the numbers to know and the open points in the draft.',
    goals: [
      'Justify each modelling choice and say which conclusion it could move',
      'Tell a reading of the regulation apart from an assumption of the model',
      'Answer the hardest questions, and concede what the thesis does not show',
      'Know the headline numbers without notes',
    ],
  },
];
