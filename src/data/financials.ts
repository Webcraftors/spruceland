// Financial mocks — Spruceland Zambia. Quarterly ~ZMW 3.5M split across Lusaka and Ndola.

export interface MonthPoint { month: string; lusaka: number; ndola: number; }

// 12 months trailing for MRR / ARR / yearly.
export const MONTHLY_REVENUE: MonthPoint[] = [
  { month: "Aug'25", lusaka: 680_000, ndola: 410_000 },
  { month: "Sep'25", lusaka: 705_000, ndola: 425_000 },
  { month: "Oct'25", lusaka: 730_000, ndola: 445_000 },
  { month: "Nov'25", lusaka: 715_000, ndola: 455_000 },
  { month: "Dec'25", lusaka: 690_000, ndola: 420_000 },
  { month: "Jan'26", lusaka: 720_000, ndola: 430_000 },
  { month: "Feb'26", lusaka: 690_000, ndola: 470_000 },
  { month: "Mar'26", lusaka: 780_000, ndola: 510_000 },
  { month: "Apr'26", lusaka: 810_000, ndola: 540_000 },
  { month: "May'26", lusaka: 760_000, ndola: 495_000 },
  { month: "Jun'26", lusaka: 830_000, ndola: 560_000 },
  { month: "Jul'26", lusaka: 795_000, ndola: 520_000 },
];

export const OFFICE_QUARTER = {
  Lusaka: 2_170_000,
  Ndola:  1_395_000,
};

export const PROFIT_MARGIN_PCT = 28.5;

// Recurring service contracts (calibration cadence, maintenance retainers).
export const RECURRING = {
  contractedClients: 14,
  averageMonthlyContractZMW: 78_500,
  // Monthly Recurring Revenue = sum of monthly service contracts.
  mrrZMW: 1_099_000,
};
export const MRR = RECURRING.mrrZMW;
export const ARR = RECURRING.mrrZMW * 12; // annual recurring

export const YEARLY_TARGET_ZMW = 14_500_000;

export interface RevenueBreakdown { client: string; revenueZMW: number; }
export const REVENUE_BY_CLIENT: RevenueBreakdown[] = [
  { client: "First Quantum Minerals", revenueZMW: 780_000 },
  { client: "KCM", revenueZMW: 660_000 },
  { client: "Pick n Pay", revenueZMW: 555_000 },
  { client: "Yalelo", revenueZMW: 435_000 },
  { client: "Zambia Sugar", revenueZMW: 420_000 },
  { client: "Zambeef", revenueZMW: 390_000 },
  { client: "National Breweries", revenueZMW: 288_000 },
  { client: "Chilanga Cement", revenueZMW: 270_000 },
  { client: "Others", revenueZMW: 380_000 },
];

// Mileage per branch — km/month × ZMW rate per km (fuel + maintenance).
export interface MileageBranch {
  branch: "Lusaka" | "Ndola";
  vehicles: number;
  kmPerMonth: number;
  ratePerKmZMW: number;
}
export const MILEAGE_BY_BRANCH: MileageBranch[] = [
  { branch: "Lusaka", vehicles: 4, kmPerMonth: 9_800, ratePerKmZMW: 14 },
  { branch: "Ndola",  vehicles: 3, kmPerMonth: 7_400, ratePerKmZMW: 15 },
];
export const MILEAGE_COST_MONTHLY_ZMW =
  MILEAGE_BY_BRANCH.reduce((s, b) => s + b.kmPerMonth * b.ratePerKmZMW, 0);

export const EXPENSE_CATEGORIES = [
  { name: "Payroll", zmw: 1_200_000 },
  { name: "Parts & Inventory", zmw: 620_000 },
  { name: "Subcontractors", zmw: 340_000 },
  { name: "Fleet & Mileage", zmw: MILEAGE_COST_MONTHLY_ZMW * 3 }, // quarter of mileage
  { name: "Travel & Accommodation", zmw: 210_000 },
  { name: "Overheads", zmw: 210_000 },
];
