/**
 * The thesis's stylised portfolio: 17 counterparties, one or two EUR interest rate swaps each.
 * Copied from config/portfolio.yaml in cva-capital-crr3. Money in EUR millions, maturities in years.
 * Every swap is at inception (market value 0, no collateral) unless the netting set is margined.
 */

/** The eight sector rows of CRR3 Art. 384(2) Table 1 (short keys; full labels below). */
export type Sector = 'sovereign' | 'regional' | 'financial' | 'materials' | 'consumer' | 'technology' | 'health' | 'other';

export const sectorLabels: Record<Sector, string> = {
  sovereign: 'Central government, central banks, MDBs',
  regional: 'Regional government, local authorities, PSEs',
  financial: 'Financial sector entities',
  materials: 'Basic materials, energy, industrials, agriculture',
  consumer: 'Consumer goods and services, transport',
  technology: 'Technology, telecommunications',
  health: 'Health care, utilities, professional services',
  other: 'Other sector',
};

export interface Trade {
  notional: number;
  maturity: number;
  receiveFixed: boolean;
}

export interface NettingSetSpec {
  trades: Trade[];
  margined?: boolean;
}

export interface CounterpartySpec {
  name: string;
  sector: Sector;
  /** Credit quality step 1–6, or null for "not rated". */
  cqs: number | null;
  /** Excluded from the EU charge under Art. 382(4); the letter is in `exemptBasis`. */
  exemptEu: boolean;
  exemptBasis?: '(a)' | '(b)' | '(d)';
  /** Central government of a Member State: SA-CVA bucket 1 (Art. 383p Table 1). */
  memberState?: boolean;
  /** Credit spreads in bp at the Art. 383e(1) vertices 0.5 / 1 / 3 / 5 / 10 years. */
  spreadsBp: [number, number, number, number, number];
  nettingSets: NettingSetSpec[];
  note?: string;
}

const irs = (notional: number, maturity: number, receiveFixed = true): Trade => ({ notional, maturity, receiveFixed });

export const portfolio: CounterpartySpec[] = [
  { name: 'Bank A', sector: 'financial', cqs: 1, exemptEu: false, spreadsBp: [25, 30, 40, 50, 65], nettingSets: [{ trades: [irs(200, 10), irs(100, 5, false)] }], note: 'A receiver and a payer swap in one netting set: they partly offset.' },
  { name: 'Bank B', sector: 'financial', cqs: 2, exemptEu: false, spreadsBp: [35, 40, 55, 70, 90], nettingSets: [{ margined: true, trades: [irs(150, 5)] }], note: 'Daily variation margin, so a 10-day margin period of risk.' },
  { name: 'Insurer C', sector: 'financial', cqs: 3, exemptEu: false, spreadsBp: [60, 70, 90, 110, 140], nettingSets: [{ trades: [irs(120, 12)] }] },
  { name: 'Hedge fund D', sector: 'financial', cqs: 5, exemptEu: false, spreadsBp: [250, 280, 350, 400, 450], nettingSets: [{ trades: [irs(60, 3)] }] },
  { name: 'Group insurance subsidiary', sector: 'financial', cqs: 2, exemptEu: true, exemptBasis: '(b)', spreadsBp: [35, 40, 55, 70, 90], nettingSets: [{ trades: [irs(90, 7)] }], note: 'Intragroup trade with an EU financial counterparty.' },
  { name: 'Pension fund E', sector: 'financial', cqs: 2, exemptEu: false, spreadsBp: [35, 40, 55, 70, 90], nettingSets: [{ trades: [irs(300, 15)] }], note: 'A new trade: the EMIR pension-fund transition has expired, so letter (c) no longer applies.' },
  { name: 'Industrial F', sector: 'materials', cqs: 3, exemptEu: true, exemptBasis: '(a)', spreadsBp: [70, 80, 100, 120, 150], nettingSets: [{ trades: [irs(100, 7)] }] },
  { name: 'Industrial G', sector: 'materials', cqs: 5, exemptEu: true, exemptBasis: '(a)', spreadsBp: [300, 330, 400, 450, 500], nettingSets: [{ trades: [irs(80, 5)] }] },
  { name: 'Energy H', sector: 'materials', cqs: 3, exemptEu: false, spreadsBp: [70, 80, 100, 120, 150], nettingSets: [{ trades: [irs(120, 10), irs(50, 4)] }], note: 'Above the EMIR clearing threshold (NFC+), so not exempt.' },
  { name: 'Retailer I', sector: 'consumer', cqs: 4, exemptEu: true, exemptBasis: '(a)', spreadsBp: [180, 200, 250, 290, 330], nettingSets: [{ trades: [irs(70, 6)] }] },
  { name: 'Shipping J', sector: 'consumer', cqs: 6, exemptEu: true, exemptBasis: '(a)', spreadsBp: [500, 550, 650, 700, 750], nettingSets: [{ trades: [irs(40, 8)] }] },
  { name: 'Telecom K', sector: 'technology', cqs: 3, exemptEu: false, spreadsBp: [70, 80, 100, 120, 150], nettingSets: [{ trades: [irs(110, 9)] }], note: 'Above the EMIR clearing threshold (NFC+), so not exempt.' },
  { name: 'Utility L', sector: 'health', cqs: 2, exemptEu: true, exemptBasis: '(a)', spreadsBp: [40, 45, 60, 75, 95], nettingSets: [{ trades: [irs(150, 12)] }] },
  { name: 'Unrated SME M', sector: 'other', cqs: null, exemptEu: true, exemptBasis: '(a)', spreadsBp: [350, 380, 450, 500, 550], nettingSets: [{ trades: [irs(25, 4)] }] },
  { name: 'Sovereign N', sector: 'sovereign', cqs: 1, memberState: true, exemptEu: true, exemptBasis: '(d)', spreadsBp: [10, 12, 18, 25, 35], nettingSets: [{ trades: [irs(250, 10)] }] },
  { name: 'Municipality O', sector: 'regional', cqs: 1, exemptEu: true, exemptBasis: '(d)', spreadsBp: [15, 18, 25, 32, 42], nettingSets: [{ trades: [irs(60, 15)] }], note: '0 % risk weight under Art. 115(2).' },
  { name: 'Third-country sovereign P', sector: 'sovereign', cqs: 4, exemptEu: false, spreadsBp: [200, 220, 270, 310, 350], nettingSets: [{ trades: [irs(50, 6)] }], note: 'CQS 4: no 0 % risk weight, so letter (d) does not apply.' },
];

export const exemptionLetters: Record<string, string> = {
  '(a)': 'Non-financial counterparty below the EMIR clearing threshold',
  '(b)': 'Intragroup transaction with an EU financial counterparty',
  '(c)': 'Pension scheme arrangement (EMIR transition, now expired for new trades)',
  '(d)': 'Counterparty with a 0 % risk weight (EU central or regional government)',
};

export const totalNotional = (c: CounterpartySpec) => c.nettingSets.flatMap((n) => n.trades).reduce((s, t) => s + t.notional, 0);
export const longestMaturity = (c: CounterpartySpec) => Math.max(...c.nettingSets.flatMap((n) => n.trades).map((t) => t.maturity));
