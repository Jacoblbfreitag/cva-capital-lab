/**
 * Defence preparation. Everything here restates the thesis draft of 20 Nov 2026 (cva-capital-crr3, commit 8b2bae3),
 * its experiment_spec.md and LAB_NOTEBOOK.md; no new claims. Numbers are numbers.tex macros.
 *
 *   DefenceQuestion.topic: a lesson id from src/lessons.ts ("Defence corner" on that page) or 'general'
 *   level: 'core'  = expect it from any examiner
 *          'hard'  = the hostile version (the devil's advocate of the review panel)
 *   a:     what to say, in about a minute; `weak` is the honest part of the answer you should concede
 *   where: the place in the thesis that carries the answer
 */
export interface DefenceQuestion {
  topic: string;
  level: 'core' | 'hard';
  q: string;
  a: string;
  weak?: string;
  where?: string;
}

export const defenceQuestions: DefenceQuestion[] = [
  // ── Module 0: the thesis ──
  {
    topic: 'thesis',
    level: 'core',
    q: 'Answer your research question in two sentences.',
    a: 'First, the Art. 382(4) exclusions leave the ranking unchanged except at the highest excluded shares: BA-CVA stays cheaper hedged and unhedged at the assumed σ, but the exclusions remove 45 % of SA-CVA’s disadvantage at a full matched hedge (gap 2.45 → 1.35 EUR m), because vega-heavy names leave SA-CVA while BA-CVA loses only their stand-alone charges. Second, the exclusions create a hedging cliff on the names they cover: a CDS on an excluded name earns no relief and, on the thesis’s reading, attracts a Title IV charge, so the capital incentive to hedge those names is negative; the opt-in removes the cliff, but only in favour of BA-CVA.',
    where: 'Ch. 8 §8.1',
  },
  {
    topic: 'thesis',
    level: 'core',
    q: 'What is the contribution? Who did this before?',
    a: 'A full, reproducible computation of both CRR3 approaches on one book, with the EU-specific exclusions, the opt-in and the Art. 386(5) treatment switched on and off, and the institution’s choice of approach and hedge written as an optimisation (Ch. 4). The EU exclusions have no Basel counterpart, so the Basel literature does not cover them. Every number traces to a run folder with a manifest.',
    weak: 'The literature review (Ch. 1) is still a placeholder, so the “nobody did this” claim is not yet backed by a search in the text. Prepare two or three names of related work before the defence.',
    where: 'Ch. 1 (placeholder), Ch. 4',
  },
  {
    topic: 'thesis',
    level: 'hard',
    q: 'Your experiment spec has hypotheses H1–H3. The thesis talks about P1–P4. What happened to H1?',
    a: 'H1 said SA-CVA would be cheaper than BA-CVA for any bank that hedges more than a modest share. It was written before interest rate vega was in the model. Once Art. 383b(2) vega is included (22 Oct 2026), H1 fails: the SA-CVA floor that a CDS cannot reach (4.03 EUR m) lies above the BA-CVA floor (2.12). The predictions P1–P4 are derived from the model of Ch. 4 and are what the results test. The hypotheses are to be reworded with the supervisor.',
    weak: 'Say plainly that H1 was falsified by a correction of the model, not by the data. Hiding it is worse than stating it.',
    where: 'Ch. 1 todo; LAB_NOTEBOOK 2026-10-22',
  },
  {
    topic: 'thesis',
    level: 'hard',
    q: 'P1 and P2 follow from the formulas. Why run a simulation to “confirm” algebra?',
    a: 'Agreed: the thesis now says P1 and P2 are mechanisms verified numerically, not tested (§4.5, Table 6.2). What the computation adds is the size. The algebra says SA-CVA has a floor of K_IR + K_vega. Whether that floor lies above or below the BA-CVA floor depends on the book and on σ, and that comparison (4.03 against 2.12 EUR m) decides the hedged ranking.',
    where: 'Ch. 4 §4.5; Ch. 6 Table 6.2',
  },
  {
    topic: 'thesis',
    level: 'core',
    q: 'What does the bank optimise, and which of its parameters are calibrated?',
    a: 'The cost of capital κ times total capital (SA-CVA set + BA-CVA set + the Title IV charge on hedges of excluded names not opted in), plus a fixed cost F if any name is under SA-CVA, plus a running cost ψ per unit of CDS notional. Choices: notionals B_c, opt-in set O, SA-CVA set S. κ, F and ψ are not calibrated; the results are capital numbers, so effectively ψ = 0 and F = 0 in every comparison.',
    weak: 'Because ψ = 0, “hedged capital” comparisons ignore that BA-CVA buys far more CDS. Have the equal-notional answer ready (Module 6).',
    where: 'Ch. 4 §4.1',
  },

  // ── Module 1: CVA ──
  {
    topic: 'cva',
    level: 'core',
    q: 'Why did CVA become a capital charge at all?',
    a: 'Basel III (BCBS 2011, para. 14(b)) states that CVA risk, the mark-to-market loss on CVA, was a greater source of losses in the crisis than outright defaults, and the default-risk charge did not cover it. Basel III added a CVA charge with an advanced (bond VaR) and a standardised method. The 2015 review gave three motivations for replacing it: it ignored the exposure component and its hedges, it had fallen behind accounting practice, and it was inconsistent with the new market-risk framework. The replacement (2017, amended 2020, now MAR50) has SA-CVA and BA-CVA.',
    where: 'Ch. 2 §2.3',
  },
  {
    topic: 'cva',
    level: 'core',
    q: 'State the CVA formula you use and its three assumptions.',
    a: 'CVA = LGD ∫ discounted EE dPD. Unilateral (own default ignored), exposure independent of default (no wrong-way risk), and risk-neutral PD from credit spreads. In the code it is discretised on the quarterly grid with survival S(t) = exp(−s(t)·t/LGD), LGD = 0.40 for every name, proxy spreads at the five Art. 383e(1) vertices.',
    where: 'Ch. 2 eq. 2.1; Ch. 5 §5.6',
  },
  {
    topic: 'cva',
    level: 'hard',
    q: 'Art. 383a(1)(e) requires the capability to model wrong-way risk. You assume independence. Is your SA-CVA even compliant?',
    a: 'It is a stated limitation. Wrong-way risk would raise exposure where default is likely, so SA-CVA would probably rise, as with a higher σ; it cannot enter BA-CVA for an SA-CCR institution. That direction favours BA-CVA in the unhedged comparison, so the omission does not flatter the main finding. Whether the CDS hedge also becomes less effective is an argument, not a result.',
    where: 'Ch. 8 §8.2, last limitation',
  },
  {
    topic: 'cva',
    level: 'hard',
    q: 'Why one-factor Hull–White with a = 0.03 and σ = 80 bp? Neither is calibrated.',
    a: 'Both are assumptions, stated as such. No public swaption volatility file was available, so σ cannot be implied. σ is anchored historically: the Hull–White σ implied by daily changes in ECB AAA spot rates is 62.8 bp at 1y and 81.3 bp at 2y (Jan 2023–Aug 2026), 46.1 bp over the last 12 months, so 80 bp is at the upper end. For a, an earlier claim that 0.03 was “inside the range reported” was found unsupported and withdrawn; Puetter & Renzitti (2020) report negative EUR mean reversion in spring 2020. Both are varied ×0.5 and ×1.5 in Appendix B.',
    weak: 'A historical σ is not an implied σ; implied usually exceeds realised. The comparison bounds the assumption, it does not calibrate it.',
    where: 'Ch. 5 §5.4; experiment_spec.md',
  },

  // ── Module 2: SA-CCR ──
  {
    topic: 'sa-ccr',
    level: 'core',
    q: 'Why does BA-CVA not move at all when you change σ, a or the curve?',
    a: 'Because the thesis assumes an institution that uses SA-CCR for the exposure value, and SA-CCR has no exposure model inside. Art. 384(2) takes EAD from the methods of Title II, Chapter 6, which include the internal model method, so this is “as assumed here”, not a rule. An IMM bank’s BA-CVA would move with its model.',
    where: 'Ch. 5 §5.4–5.5 (reworded 20 Nov)',
  },
  {
    topic: 'sa-ccr',
    level: 'hard',
    q: 'You use 250 business days a year. Where does that come from?',
    a: 'Art. 279c(1) counts in OneBusinessYear under “the relevant business day convention” and leaves the convention to the institution. 250 fixes the ten-business-day floors and the MPoR in years. It is listed among the modelling choices without a regulatory citation.',
    where: 'Ch. 5 §5.5; experiment_spec.md',
  },

  // ── Module 3: BA-CVA ──
  {
    topic: 'ba-cva',
    level: 'core',
    q: 'Derive your closed form for hedged BA-CVA and say when it holds.',
    a: 'With direct hedges (r_hc = 1, so HMA = 0), no index hedges, and the same recognition ratio r = SNH_c/SCVA_c for every name, (1 − r) factors out of both sums of K_hedged, so K_hedged = |1 − r|·K_reduced/DS. Then K_total = β K_reduced + DS(1 − β)K_hedged = K_reduced(β + (1 − β)|1 − r|). Linear down to β K_reduced at r = 1, symmetric beyond. A test reproduces it to 10⁻⁹ on the E2b grid.',
    where: 'Ch. 3 §3.4 (Proposition and Corollary); Ch. 6 §6.3',
  },
  {
    topic: 'ba-cva',
    level: 'hard',
    q: 'Is the 0.65 discount scalar an EU departure from Basel? Does it apply to the reduced version?',
    a: 'The 20 Nov draft no longer lists it as a departure. Art. 384(3) places DS_CVA inside BACVA_csr-unhedged, so the full version without hedges equals the reduced version, which is the same result the Basel formula gives. The EBA was asked in 2023 (Q&A 2023_6899) and rejected the question because CRR3 was then being drafted, so the reading rests on the text alone. The Pillar 3 reconciliation of EU CVA2 finds banks printing the rows three different ways (readings A, B, C); B is the literal text.',
    where: 'Ch. 3 §3.7; Ch. 5 §5.5; Appendix F',
  },
  {
    topic: 'ba-cva',
    level: 'hard',
    q: 'Why compute M_NS under Art. 162(2) when Art. 162(1) lets a bank use a flat 2.5 years?',
    a: 'Art. 384(2) says M_NS is calculated “in accordance with Article 162” and caps it at the longest contractual remaining maturity, a cap that only has content under Art. 162(2). So the thesis applies that paragraph. The 2.5-year variant is not ruled out and is not computed. With swaps of 3–15 years it would lower every M_NS and every SCVA_c.',
    weak: 'Not computed. A lower SCVA_c lowers BA-CVA, unhedged and at the floor, so the direction is more likely to widen than to close BA-CVA’s lead, but that is inference, not a result.',
    where: 'Ch. 5 §5.5',
  },

  // ── Module 4: SA-CVA ──
  {
    topic: 'sa-cva',
    level: 'core',
    q: 'Why is vega in your SA-CVA at all? Swaps and CDS have no implied volatility.',
    a: 'Art. 383b(2), second subparagraph, asks for the vega of the aggregate CVA to “volatilities used in the exposure model to simulate risk factors”. The exposure model’s σ is such a volatility. The model bumps σ by 1 % relative (Art. 383j) and re-simulates with common random numbers. One net vega per currency (Art. 383c(6)), RW 100 % (Art. 383k(5)). An earlier version omitted vega on exactly the ground in your question; that was a mistake, corrected on 22 Oct 2026.',
    where: 'Ch. 5 §5.7; LAB_NOTEBOOK 2026-10-22',
  },
  {
    topic: 'sa-cva',
    level: 'hard',
    q: 'Vega is 32 % of unhedged SA-CVA and it is driven by a parameter you did not calibrate. Is your whole result about σ?',
    a: 'The unhedged ranking is: at half σ SA-CVA requires 4.22 against BA-CVA 7.13, and the break-even is about 66 bp, between the historical anchors. The thesis says so. The hedged ranking is not: at half σ fully hedged SA-CVA still requires 2.49 against the BA-CVA floor of 2.12, and at 1.5σ 6.74. So the claim that BA-CVA is cheaper once the bank hedges survives ±50 % on σ.',
    weak: 'The margin at half σ is small (2.49 vs 2.12), and the robustness runs use 10 000 paths and the opt-in cell, not the baseline.',
    where: 'Ch. 6 §6.7; Appendix B',
  },
  {
    topic: 'sa-cva',
    level: 'hard',
    q: 'Art. 383b(2) also requires the interest rate delta of every eligible hedge. You leave out the CDS’s rate delta.',
    a: 'Correct, it is a departure from the regulation and is listed as a limitation. For a par CDS the rate delta is small. The same omission makes the Title IV charge a lower bound by that one term.',
    where: 'experiment_spec.md; Ch. 5 §5.10',
  },
  {
    topic: 'sa-cva',
    level: 'core',
    q: 'Why does matching the CDS tenor halve hedged SA-CVA but leave BA-CVA unchanged?',
    a: 'SA-CVA maps sensitivities onto the five credit spread vertices; a 5-year CDS offsets the 5-year vertex and leaves the long vertices of 10–15-year swaps open, so full-hedge SA-CVA is 8.92 at 5y and 4.57 matched. BA-CVA sees a hedge only through r_hc·RW·M·B·DF, one number per name; the ladder re-solves the notional to hold r fixed, so the tenor has no effect at fixed recognition.',
    where: 'Ch. 6 §6.3–6.4',
  },

  // ── Module 5: exemptions ──
  {
    topic: 'exemptions',
    level: 'core',
    q: 'What is the “rational cell” and why did it become the EU baseline?',
    a: 'EU scope, no opt-in, with only the names in the calculation hedged. A capital-minimising bank without the opt-in would not buy a CDS it cannot recognise, so this is the cell Ch. 4 predicts. The review panel found that the old EU hedged cells hedged the excluded names too, a strategy Ch. 4 rules out. Those cells are now the “economic-hedge case” (all names hedged), and Table 6.1 has both. In the rational cell at a full matched hedge, BA-CVA is 1.78 and SA-CVA 3.13 EUR m.',
    where: 'Ch. 6 §6.1–6.2, Table 6.1; LAB_NOTEBOOK 2026-11-20 (T1/T2)',
  },
  {
    topic: 'exemptions',
    level: 'core',
    q: 'Why do the exclusions narrow SA-CVA’s disadvantage?',
    a: 'At a full hedge BA-CVA sits at its floor, β = 25 % of K_reduced, so removing nine names saves only a quarter of their diversified charge: 2.12 → 1.78. SA-CVA loses their whole unhedgeable vega and rate delta: 4.57 → 3.13, of which vega 3.38 → 2.20. The gap falls from 2.45 to 1.35 EUR m (−45 %) at the matched tenor, and from 6.80 to 5.57 (−18 %) at five years. Unhedged it falls from 2.07 to 1.48.',
    where: 'Ch. 6 §6.2',
  },
  {
    topic: 'exemptions',
    level: 'hard',
    q: 'Title IV on a CDS that hedges an excluded name: where in the regulation does it say that?',
    a: 'Nowhere directly, and the draft now calls it a reading wherever it appears. Art. 386(4) frees from Title IV eligible hedges entered into with third parties and included in the calculation; Art. 386(5) puts positions not recognised as eligible hedges under Title IV. A CDS that would be eligible but references a name outside the calculation falls between them. A different reading turns the first half of P3 into neutrality.',
    weak: 'The headline gap result (2.45 → 1.35) does not depend on this reading: the rational cell carries no hedge on excluded names, so no Title IV charge at all. Only the economic-hedge case and the opt-in comparison do.',
    where: 'Ch. 3 §3.6; Ch. 8 §8.2, fifth limitation',
  },
  {
    topic: 'exemptions',
    level: 'core',
    q: 'Does the opt-in reverse the exemption effect only under BA-CVA?',
    a: 'No, and the draft corrected this (review finding T3). With every name hedged, the opt-in returns both approaches to the Basel level: BA-CVA 2.12 → 4.14 → 2.12 and SA-CVA 8.92 → 8.08 → 8.92 EUR m (5y). It lowers BA-CVA, because recognising the hedges removes the Title IV charge, and raises SA-CVA, because the names bring vega a CDS cannot offset.',
    where: 'Ch. 6 §6.2',
  },
  {
    topic: 'exemptions',
    level: 'hard',
    q: 'If the rational bank hedges only in-scope names and gets 1.78, below the opt-in cell’s 2.12, why would anyone opt in?',
    a: 'The capital-minimising bank does not. The opt-in matters only to a bank that hedges excluded names for another reason, such as the accounting volatility of CVA (§4.3). For that bank the condition is ΔK_CVA(c in, hedged) < K_MR(hedge): under BA-CVA it holds (4.14 → 2.12), under SA-CVA it fails (8.08 → 8.92). ING’s Pillar 3 report describes exactly such hedges that serve accounting rather than capital.',
    where: 'Ch. 4 §4.3; Ch. 7 §7.3',
  },
  {
    topic: 'exemptions',
    level: 'hard',
    q: 'An SA-CVA bank could opt the excluded name in under BA-CVA. Did you consider that?',
    a: 'Yes, in §8.3, but not computed. Art. 382(4a) admits any approach of Art. 382a(1), and Art. 382a(3)(a) allows different approaches per counterparty, so the SA-CVA cost of the opt-in need not be borne. Whether a supervisor accepts that split is left open. Opting in under SA-CVA would also need the Art. 383(1) permission to cover the name.',
    where: 'Ch. 8 §8.3',
  },
  {
    topic: 'exemptions',
    level: 'hard',
    q: 'Per counterparty or all-or-nothing: how do you read the opt-in?',
    a: 'Per counterparty, and only for hedged names, because Art. 382(4a) does not say and leaves the detail to the institution’s policies. That reading is the one most favourable to the institution. Under an all-or-nothing reading the opt-in would also pull in unhedged excluded names and cost more, so the asymmetry between the approaches would probably widen. Untested.',
    where: 'Ch. 4 §4.1; Ch. 8 §8.3',
  },
  {
    topic: 'exemptions',
    level: 'hard',
    q: 'Pension fund E carries 40.65 % of total SCVA and you keep it in scope. Isn’t your result about one name?',
    a: 'It is conditional on that name, and Ch. 5 says so. The legal argument: point (c) applies only while the EMIR Art. 89(1) transition runs; it ended 18 June 2021, extended by two delegated regulations to 18 June 2023. Legacy trades stay exempt for life, but this swap is a new trade at the 2026 calibration date. Were it exempt, the excluded share would rise from 25.45 % by its 40.65 %, beyond the top of the experiment C ladder (59.35 %), where the results say nothing.',
    where: 'Ch. 5 §5.2; Ch. 8 §8.2',
  },
  {
    topic: 'exemptions',
    level: 'hard',
    q: 'What does the Art. 382(4b) report show a supervisor, and is it your Basel-scope figure?',
    a: 'It shows the requirement on the excluded transactions alone, under the approach the bank would have used. It is not the whole-book Basel-scope figure, and not the difference between whole-book requirements with and without the exclusions, because both approaches aggregate through square roots. It says nothing about hedges of those names or their Title IV charge, so the hedging cliff stays invisible.',
    weak: 'Ch. 5 §5.2 still says that the Basel-scope figure is the one Art. 382(4b) requires. The draft flags that sentence with a todo as probably wrong. If asked, agree and give the correct reading.',
    where: 'Ch. 8 §8.3; Ch. 5 §5.2 todo',
  },

  // ── Module 6: hedging ──
  {
    topic: 'hedging',
    level: 'hard',
    q: 'At a hedge ratio of one BA-CVA buys 129 EUR m of CDS and SA-CVA 23. At zero hedging cost, isn’t BA-CVA cheaper only because it buys five times the protection for free?',
    a: 'Equal h is not equal notional, and §6.8 now says the comparison is at zero hedging cost and unequal notionals. Two answers. Structurally, the SA-CVA floor (K_IR + K_vega = 4.03) lies above the BA-CVA floor (2.12) whatever notional is bought, because no CDS reaches it. Empirically, at a common notional (experiment E2b, 50/100/150 EUR m, five tenors, exposure basis) BA-CVA is cheaper in every cell; the closest is 0.09 EUR m at 50 EUR m of 7-year CDS.',
    weak: 'With a positive running cost ψ, BA-CVA’s larger notional costs more, so its lead in total cost would shrink. ψ is not calibrated, so the thesis cannot say by how much.',
    where: 'Ch. 5 §5.8; Ch. 6 §6.3, §6.8',
  },
  {
    topic: 'hedging',
    level: 'core',
    q: 'Why is over-hedging penalised under BA-CVA?',
    a: 'K_hedged nets SCVA_c against SNH_c inside a square; once SNH_c > SCVA_c the residual grows again. With a uniform r, capital is K_reduced(β + (1 − β)|1 − r|): r = 1 + d costs exactly what r = 1 − d costs. So the optimal hedge is the corner at full recognition (P1).',
    where: 'Ch. 6 §6.3, Corollary',
  },
  {
    topic: 'hedging',
    level: 'core',
    q: 'Why the exposure basis and not the SCVA basis for the fixed-notional designs?',
    a: 'The exposure basis splits notional pro rata to Σ M·EAD·DF, the Art. 384(2) exposure term before the risk weight. Because SCVA_c and SNH_c carry the same RW_c, it gives every name the same recognition ratio, so one r can be read off a cell and the closed form applies. It isolates the tenor. The SCVA basis confounds tenor with the 0.5 %–12 % risk-weight spread and is run as a robustness variant. Neither is prescribed, and the SCVA basis is not the more realistic one.',
    where: 'experiment_spec.md; Ch. 5 §5.8',
  },
  {
    topic: 'hedging',
    level: 'hard',
    q: 'You assume every CDS is cleared through a CCP. None of your names even has a CDS market.',
    a: 'Stated as a limitation. The cleared assumption takes the CDS out of the CVA charge (Art. 382(3)) and gives it no SA-CCR exposure; the CCP trade-exposure charge (2 % under Art. 306(1)(a)) is not computed. Bilateral hedges would sit in the CVA charge themselves, so hedged capital would rise under both approaches, BA-CVA more because it buys more notional (129 vs 23), and the gap would narrow. Not tested.',
    where: 'Ch. 8 §8.2, fourth limitation',
  },
  {
    topic: 'hedging',
    level: 'hard',
    q: 'Real CVA desks hedge with index CDS. You hedge each name with its own single-name CDS.',
    a: 'Third limitation. Art. 384(2) Table 2 recognises related and same-sector hedges at correlations of 100 %, 80 % and 50 %, and the mismatch term HMA then keeps BA-CVA above its floor, which breaks the P1 corner. Hedged BA-CVA would rise and the gap to SA-CVA would narrow, although SA-CVA carries basis risk too. Five of six full BA-CVA banks in Ch. 7 report mainly index CDS. Not tested.',
    where: 'Ch. 8 §8.2; Ch. 7 §7.3',
  },

  // ── Module 7: results ──
  {
    topic: 'results',
    level: 'core',
    q: 'Mixing the approaches gains nothing. Why?',
    a: 'Experiment F searches all 2^n splits (131 072 in Basel scope) in 24 cells, because both charges aggregate through square roots and do not separate. In every cell the best split is all BA-CVA, gain 0.00 %. SA-CVA vega is spread across names roughly in proportion to their CVA, so no name has an SA-CVA charge small enough relative to its BA-CVA charge to be worth moving. A fixed cost F would only widen the gap.',
    where: 'Ch. 6 §6.6; Appendix D',
  },
  {
    topic: 'results',
    level: 'core',
    q: 'Which single extension is most likely to overturn your result?',
    a: 'Hedging the exposure component. Art. 386(2)(b) makes swaptions and swaps eligible SA-CVA hedges of exposure variability, while Art. 386(3) gives BA-CVA only CDS. A vega hedge would have to remove roughly half of the 4.03 EUR m SA-CVA floor before SA-CVA fell below the 2.12 BA-CVA floor. That is arithmetic from two figures, and because the thesis bumps σ rather than a swaption volatility, how well a swaption offsets it is unknown. The second candidate is a calibrated σ.',
    where: 'Ch. 8 §8.2 (second limitation), §8.4',
  },
  {
    topic: 'results',
    level: 'hard',
    q: '“Basel scope” is CRR3 with the exclusions switched off. That is not Basel.',
    a: 'Right, and §8.1 says so: Basel scope isolates the effect of Art. 382(4) and is not MAR50. The other EU–Basel differences (credit quality steps instead of IG/HY, the multiplier m_CVA = 1) are not isolated, because the MAR50 checks in Ch. 3 are still open.',
    weak: 'Two MAR50 checks are open todos in Ch. 3 and must not be answered from memory. If pressed, say they are checks against the text still to be made.',
    where: 'Ch. 8 §8.1; Ch. 3 §3.7',
  },
  {
    topic: 'results',
    level: 'hard',
    q: 'Do the exemptions work as intended?',
    a: 'The thesis does not judge them against intent, because the stated rationale is not yet sourced (todo: the recitals of Regulation (EU) 2024/1623). It judges internal consistency. The exclusions lower unhedged capital as designed. The opt-in is consistent for BA-CVA users, not for SA-CVA users. And against the Basel review’s aim of reducing the incentive “to leave some of their risks unhedged” (BCBS 2015, p. 2), the exclusions work the other way on the names they cover.',
    where: 'Ch. 8 §8.1, §8.3',
  },
  {
    topic: 'results',
    level: 'hard',
    q: 'Your robustness numbers do not match your baseline table. Why?',
    a: 'They use a different cell and fewer paths: EU scope with the opt-in, the matched-tenor hedge and 10 000 paths, one factor at a time. Unhedged SA-CVA is 8.63 there against 8.61 in Table 6.1. Monte Carlo noise at 10 000 paths is 1.46 %. §6.7 and Appendix B now say this explicitly.',
    where: 'Ch. 6 §6.7; Appendix B',
  },

  // ── Module 8: Pillar 3 ──
  {
    topic: 'pillar3',
    level: 'core',
    q: 'What do the Pillar 3 disclosures tell us about your predictions?',
    a: 'Nothing conclusive, and Ch. 7 is written to say so: the disclosures can be consistent or inconsistent with a prediction, never confirm it. They show one date’s choices and amounts but omit the capital under the approach not chosen, the effect of hedges, the fixed cost and the exempted counterparties. Two banks that report no hedging (Nykredit, Handelsbanken) sit at P1’s first corner. Four banks mix approaches, which the model does not find optimal; the disclosures cannot say why. No bank discloses the Art. 382(4b) amount, as expected, because it goes to supervisors.',
    where: 'Ch. 7 §7.3–7.4',
  },
  {
    topic: 'pillar3',
    level: 'hard',
    q: 'Four of twelve banks mix SA-CVA and BA-CVA. Your model says mixing never pays. Isn’t it refuted?',
    a: 'The banks split on different lines than the model. Nordea puts IMM netting sets under SA-CVA and SA-CCR netting sets under BA-CVA; BNP Paribas uses SA-CVA where it has permission; ING falls back to BA-CVA “for regulatory or technical reasons”. The model splits per counterparty by capital on one SA-CCR book with no IMM. The P4 result is about this book. The pattern neither confirms nor refutes P4.',
    where: 'Ch. 7 §7.3; Appendix F',
  },
  {
    topic: 'pillar3',
    level: 'hard',
    q: 'Danske applies a multiplier of 1.1. Doesn’t that contradict your m_CVA = 1?',
    a: 'No. Art. 383b(8) sets m_CVA = 1 and lets the competent authority raise it where the institution’s regulatory CVA model shows deficiencies. Danske’s note does not say who set it or why. A multiplier above one would raise the SA-CVA requirement and its floor; the thesis runs no such case, so this is an argument, not a result.',
    where: 'Ch. 7 §7.3',
  },
  {
    topic: 'pillar3',
    level: 'core',
    q: 'Why convert at the 31 Dec 2025 ECB rates and ignore the 2024 comparatives?',
    a: 'One observation date for all banks; ECB euro reference rates for that date (1 EUR = 7.4689 DKK = 10.8215 SEK = 11.8430 NOK); EUR reporters unconverted. The 2024 comparatives predate CRR3. Sydbank uses the pre-CRR3 layout and cannot be classified; DNB applied CRR3 from 1 April 2025, so its year straddles the change.',
    where: 'Ch. 7 §7.1',
  },

  // ── General (Module 9) ──
  {
    topic: 'general',
    level: 'core',
    q: 'How do I know your numbers are right?',
    a: 'Each regulatory formula is a pure function named after the formula, each parameter cites its article from the consolidated CRR3 text in refs/crr3/, and nothing comes from Basel. 117 tests include hand-calculation vectors. Results are frozen at v0.8 and every run stores a manifest (commit, config hashes, seed, package versions). make_figures.py reads only those runs and emits every number in the thesis as a LaTeX macro, so no number is retyped. Appendix E maps every output to its run folder.',
    where: 'Ch. 5 §5.1; Appendix E',
  },
  {
    topic: 'general',
    level: 'hard',
    q: 'You used language models to draft chapters. Whose thesis is this?',
    a: 'Be ready to answer this one honestly in your own words. The lab notebook records how the drafts were produced, that every regulatory statement was checked against refs/crr3/, every number is a generated macro, every new source was verified before merging, and which drafting choices you made and approved. Check your university’s rules on declaring AI assistance before the defence.',
    weak: 'This is a question about your process, not about CVA. The examiners will want to hear that you can explain and defend every line yourself.',
    where: 'LAB_NOTEBOOK.md, 20 Nov 2026 entries',
  },
  {
    topic: 'general',
    level: 'hard',
    q: 'Why the EUR AAA government curve as the risk-free curve? Art. 383c ranks OIS and swap curves first.',
    a: 'A data constraint, not an application of Art. 383c(5): no public swap or OIS curve was in the raw data. A bank could not rely on the sovereign curve for EUR, because swap data are not insufficient. The curve is shifted ±100 bp in the robustness block. DKK is discounted on the EUR curve because of the peg.',
    where: 'experiment_spec.md; Ch. 5 §5.3',
  },
];

/** Modelling choices the regulation does not settle, with the reason and what they could move. */
export type ChoiceKind = 'reading' | 'assumption' | 'data' | 'design';

export const choiceKindLabels: Record<ChoiceKind, string> = {
  reading: 'Reading of the regulation',
  assumption: 'Model assumption',
  data: 'Data constraint',
  design: 'Experimental design',
};

export interface Choice {
  kind: ChoiceKind;
  choice: string;
  why: string;
  moves: string;
  where: string;
}

export const choices: Choice[] = [
  { kind: 'reading', choice: 'A CDS on an excluded, non-opted-in name falls under Title IV', why: 'Art. 386(4) frees only eligible hedges included in the calculation; Art. 386(5) charges non-recognised positions. Neither addresses an eligible CDS on a name outside the calculation.', moves: 'First half of P3 (would become neutrality); the economic-hedge cells and the opt-in comparison. Not the rational cell.', where: 'Ch. 3 §3.6; Ch. 5 §5.10' },
  { kind: 'reading', choice: 'The opt-in applies per counterparty, to hedged names only', why: 'Art. 382(4a) does not say; per counterparty is the reading most favourable to the institution.', moves: 'P3; an all-or-nothing opt-in would pull in unhedged names and probably widen the BA/SA asymmetry.', where: 'Ch. 4 §4.1; Ch. 8 §8.3' },
  { kind: 'reading', choice: 'DS_CVA = 0.65 sits inside the unhedged term (Art. 384(3))', why: 'The literal text; the EBA declined to rule (Q&A 2023_6899). The full version without hedges then equals the reduced version.', moves: 'Level of BA-CVA if read differently; the Pillar 3 reconciliation shows banks print EU CVA2 three ways.', where: 'Ch. 5 §5.5; Appendix F' },
  { kind: 'reading', choice: 'M_NS from Art. 162(2), capped at the longest remaining maturity', why: 'The Art. 384(2) cap only has content under Art. 162(2). The flat M = 2.5 y of Art. 162(1) is not ruled out.', moves: 'Every SCVA_c and so every BA-CVA number; the 2.5-y variant is not computed.', where: 'Ch. 5 §5.5' },
  { kind: 'reading', choice: 'Pension fund E is in scope (new trade after the EMIR transition)', why: 'Art. 382(4)(c) applies only during the EMIR Art. 89(1) transition, which ended in 2021, extended to 18 June 2023; the swap is a new trade in 2026.', moves: 'The excluded share (25.45 % → about 66 % if exempt), beyond the tested ladder; every EU result.', where: 'Ch. 5 §5.2' },
  { kind: 'reading', choice: 'Sovereign N in SA-CVA bucket 1 (Member State), Third-country sovereign P in bucket 13', why: 'Art. 383p(1) Table 1 buckets by type of counterparty.', moves: 'SA-CVA credit spread delta only.', where: 'Ch. 5 §5.7' },
  { kind: 'reading', choice: 'Interest rate vega to the Hull–White σ (Art. 383b(2), 383j)', why: 'σ is the only volatility the exposure model uses to simulate risk factors; the model is not calibrated to swaptions.', moves: 'A third of unhedged SA-CVA and the SA-CVA floor; the unhedged ranking.', where: 'Ch. 5 §5.7' },
  { kind: 'assumption', choice: 'The institution uses SA-CCR for EAD', why: 'Art. 384(2) admits the methods of Title II Ch. 6; SA-CCR is the standardised choice. It makes BA-CVA independent of the exposure model.', moves: 'Why BA-CVA is flat in every robustness row; an IMM bank would differ.', where: 'Ch. 5 §5.4–5.5' },
  { kind: 'assumption', choice: 'One-factor Hull–White, a = 0.03, σ = 80 bp', why: 'Simple, exact discretisation, θ(t) fits the curve exactly. No swaption data, so both are assumptions; σ anchored historically (46–81 bp).', moves: 'SA-CVA only; the unhedged ranking turns at σ ≈ 66 bp.', where: 'Ch. 5 §5.4' },
  { kind: 'assumption', choice: 'Every CDS is cleared through a qualifying CCP', why: 'Keeps the hedges out of the CVA charge (Art. 382(3)) and out of SA-CCR; the CCP trade-exposure charge is not computed.', moves: 'Hedged capital (understated cost); BA-CVA more than SA-CVA.', where: 'Ch. 8 §8.2' },
  { kind: 'assumption', choice: 'Single-name CDS referencing each counterparty directly (r_hc = 1)', why: 'Isolates the recognition mechanism; HMA and IH vanish so the closed form holds.', moves: 'The P1 corner and hedged BA-CVA; index or proxy hedges would raise it.', where: 'Ch. 5 §5.5; Ch. 8 §8.2' },
  { kind: 'assumption', choice: 'Exposure and credit spread independent (no wrong-way risk)', why: 'Keeps the CVA integral factorised; Art. 383a(1)(e) only requires the capability.', moves: 'SA-CVA level, probably upwards.', where: 'Ch. 2 §2.2; Ch. 8 §8.2' },
  { kind: 'assumption', choice: 'Proxy spreads by rating, sector and region; LGD 0.40 for every name', why: 'No stylised name has an observable CDS spread (Art. 383a(2)(b)); 0.40 is the senior unsecured convention.', moves: 'SA-CVA credit spread delta; spreads ×0.5/×1.5 in Appendix B.', where: 'Ch. 5 §5.6' },
  { kind: 'assumption', choice: 'CDS interest rate delta left out', why: 'Small for a par CDS. A departure from Art. 383b(2), first subparagraph.', moves: 'SA-CVA slightly; Title IV charge is a lower bound by that term.', where: 'experiment_spec.md' },
  { kind: 'assumption', choice: 'κ, F and ψ uncalibrated (so ψ = F = 0 in the numbers)', why: 'The thesis reports capital, not cost of capital.', moves: 'Every “cheaper” statement once hedging costs money; BA-CVA buys more notional.', where: 'Ch. 4 §4.1; Ch. 8 §8.4' },
  { kind: 'data', choice: 'EUR AAA government spot curve as the risk-free curve', why: 'No public swap or OIS curve in the raw data; Art. 383c ranks OIS and swap curves first.', moves: 'Exposure levels; ±100 bp shift in Appendix B.', where: 'Ch. 5 §5.3' },
  { kind: 'data', choice: 'OneBusinessYear = 250 days', why: 'Art. 279c(1) leaves the convention to the institution.', moves: 'Ten-day floors and MPoR in years; negligible.', where: 'Ch. 5 §5.5' },
  { kind: 'design', choice: 'A stylised 17-name book, swaps at inception, one netting set each, one margined', why: 'Built so that each exemption letter applies to some names and not others; full control of every input.', moves: 'Everything book-dependent, especially P4.', where: 'Ch. 5 §5.2' },
  { kind: 'design', choice: 'Rational EU cell: only in-scope names hedged', why: 'Ch. 4: a capital-minimising bank without the opt-in buys no hedge it cannot recognise.', moves: 'The EU baseline and the 45 % gap narrowing.', where: 'Ch. 6 §6.1; experiment F' },
  { kind: 'design', choice: 'Hedge ratio = recognition ratio under BA-CVA, share of vertex delta under SA-CVA', why: 'Each approach sized by what it measures; so equal h is not equal notional (129 vs 23 EUR m).', moves: 'Any cross-approach comparison at a given h.', where: 'Ch. 5 §5.8' },
  { kind: 'design', choice: 'Exposure basis for fixed-notional designs (SCVA basis as robustness)', why: 'Rating-blind, so one r per cell and the closed form applies; isolates the tenor.', moves: 'E2b and B2 optima.', where: 'experiment_spec.md' },
  { kind: 'design', choice: 'Exhaustive search over all 2^n splits (experiment F)', why: 'Square-root aggregation is not separable, and 131 072 splits are cheap enough to search exactly.', moves: 'Nothing: the result is exact for this book.', where: 'Ch. 5 §5.9' },
  { kind: 'design', choice: '200 000 paths, quarterly grid to 15 y, seed 20260831', why: 'From the convergence table; aggregate CVA standard error 0.28 %; seed = calibration date, in every manifest.', moves: 'Noise only (1.46 % at 10 000 paths).', where: 'Ch. 5 §5.4' },
];

/** Known open points in the 20 Nov draft that an examiner could find. */
export const openItems: { item: string; say: string; where: string }[] = [
  { item: 'Ch. 1 and Ch. 9 are placeholders; the hypotheses H1–H3 must be reworded (H1 fails with vega).', say: 'The predictions P1–P4 are what the results test; H1 was falsified by the vega correction.', where: 'Ch. 1' },
  { item: 'Ch. 5 §5.2 says the Basel-scope figure is the Art. 382(4b) figure.', say: 'Art. 382(4b) asks for the requirement on the excluded transactions only (flagged as a todo).', where: 'Ch. 5 §5.2' },
  { item: 'Ch. 6 §6.4 still says SA-CVA “would remain the dearer approach even with a fixed cost of zero”.', say: 'True for the floors, but the hedged comparison is at unequal notional and zero hedging cost; cite E2b for equal notional.', where: 'Ch. 6 §6.4' },
  { item: 'Two MAR50 checks in Ch. 3 (credit quality steps vs IG/HY; the Basel SA-CVA multiplier).', say: 'Not isolated in the results; “Basel scope” is CRR3 without the exclusions.', where: 'Ch. 3 §3.7' },
  { item: 'Whether the Art. 382(4) exclusions and the opt-in have a Basel counterpart: a MAR50 todo in Ch. 2.', say: 'The thesis treats them as EU-specific; the check against MAR50 is open.', where: 'Ch. 2 §2.3' },
  { item: 'Stated rationale of the exclusions and the opt-in (recitals of Regulation (EU) 2024/1623) not sourced.', say: 'Hence the policy section judges internal consistency only.', where: 'Ch. 8 §8.3' },
  { item: 'Legal basis of Pillar 3 disclosure (CRR Part Eight) and RWEA = 12.5 × own funds requirement (Art. 92(4)) not in refs/crr3/.', say: 'Both are todos; the 12.5 is the only new number in Ch. 7.', where: 'Ch. 7 §7.1–7.2' },
  { item: 'Ch. 5 is over its page budget (about ten normalsider against seven).', say: 'A length issue, not a content one.', where: 'Ch. 5' },
  { item: 'Textbook citations (Brigo 2013, Green 2015) verified for existence only; Gregory (2020) lacks page numbers.', say: 'Add page numbers or drop them before submission.', where: 'Ch. 2' },
];

/** Numbers to know without looking (EUR m unless stated). */
export const flashcards: { label: string; value: string; context: string }[] = [
  { label: 'Unhedged BA-CVA, Basel / EU', value: '8.47 / 7.13', context: 'Table 6.1; the app recomputes both live' },
  { label: 'Unhedged SA-CVA, Basel / EU', value: '10.54 / 8.61', context: 'vega 3.38 (32 %) in Basel scope' },
  { label: 'SA-CVA delta only, Basel', value: '7.17', context: 'would undercut BA-CVA without vega' },
  { label: 'BA-CVA floor (β · K_reduced)', value: '2.12', context: '0.25 × 8.47; EU rational cell 1.78 = 0.25 × 7.13' },
  { label: 'SA-CVA floor, matched (K_IR + K_vega)', value: '4.03', context: '0.65 rate delta + 3.38 vega; CCS left 0.54' },
  { label: 'Full matched hedge, SA − BA gap', value: '2.45 → 1.35', context: 'Basel → EU rational cell, −45 %' },
  { label: 'Full 5y hedge, SA − BA gap', value: '6.80 → 5.57', context: '−18 %' },
  { label: 'Unhedged gap', value: '2.07 → 1.48', context: 'Basel → EU' },
  { label: 'Economic-hedge case, BA-CVA', value: '2.12 → 4.14 → 2.12', context: 'Basel → EU no opt-in → opt-in (5y)' },
  { label: 'Economic-hedge case, SA-CVA', value: '8.92 → 8.08 → 8.92', context: 'the opt-in returns both to Basel' },
  { label: 'Title IV charge at full hedge, BA / SA', value: '2.35 / 0.73', context: 'driven by notional 129.22 vs 23.26' },
  { label: 'Excluded share of Σ SCVA', value: '25.45 %', context: '9 of 17 names; Pension fund E alone is 40.65 %' },
  { label: 'Ranking reverses (all names hedged, h = 0.8)', value: '59.35 %', context: 'SA 5.99 vs BA 7.03; top of ladder C' },
  { label: 'Unhedged break-even σ', value: '≈ 66 bp', context: 'historical 62.8 (1y), 81.3 (2y), 46.1 (last 12 m)' },
  { label: 'σ ×0.5 / ×1.5, unhedged SA-CVA', value: '−51 % / +51 %', context: 'BA-CVA 0.00 %' },
  { label: 'Fully hedged SA-CVA at half σ', value: '2.49', context: 'still above 2.12: hedged ranking holds' },
  { label: 'Gain from mixing approaches', value: '0.00 %', context: 'all BA-CVA in all 24 cells' },
  { label: 'Closest equal-notional gap (E2b)', value: '0.09', context: '50 EUR m of 7-year CDS, Basel scope' },
];
