// Financial mocks — ~ZMW 3.5M per quarter, split across Lusaka and Ndola offices.

export interface MonthPoint { month: string; lusaka: number; ndola: number; }

export const MONTHLY_REVENUE: MonthPoint[] = [
  { month: "Jan", lusaka: 720_000, ndola: 430_000 },
  { month: "Feb", lusaka: 690_000, ndola: 470_000 },
  { month: "Mar", lusaka: 780_000, ndola: 510_000 },
  { month: "Apr", lusaka: 810_000, ndola: 540_000 },
  { month: "May", lusaka: 760_000, ndola: 495_000 },
  { month: "Jun", lusaka: 830_000, ndola: 560_000 },
  { month: "Jul", lusaka: 795_000, ndola: 520_000 },
];

export const OFFICE_QUARTER = {
  Lusaka: 2_170_000,
  Ndola:  1_395_000,
};

export const PROFIT_MARGIN_PCT = 28.5;

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

export const EXPENSE_CATEGORIES = [
  { name: "Payroll", zmw: 1_200_000 },
  { name: "Parts & Inventory", zmw: 620_000 },
  { name: "Subcontractors", zmw: 340_000 },
  { name: "Fleet & Travel", zmw: 280_000 },
  { name: "Overheads", zmw: 210_000 },
];
