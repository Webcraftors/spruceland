import { addDays, subDays } from "date-fns";

export type ScaleType = "Platform" | "Bench" | "Floor" | "Retail POS" | "Crane" | "Weighbridge" | "Hopper" | "Axle";
export type ServiceCadence = "Monthly" | "Quarterly" | "Bi-Annual" | "Annual" | "Ad-hoc";
export type PaymentStatus = "Paid" | "Pending" | "Overdue";

export interface Branch {
  name: string;
  city: string;
  province: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  primaryContact: { name: string; phone: string; email: string };
  cadence: ServiceCadence;
  lastServiced: string; // ISO
  nextServiceDue: string; // ISO
  scales: { type: ScaleType; count: number }[];
  branches: Branch[];
  paymentStatus: PaymentStatus;
  outstandingZMW: number;
  monthlyRevenueZMW: number;
  office: "Lusaka" | "Ndola";
  activeProject?: {
    title: string;
    stage: string;
    weeksInStage: number;
    lead: string;
    subcontractor?: string;
    startedOn: string;
  };
  notes?: string;
}

const today = new Date();
const iso = (d: Date) => d.toISOString();

const provinces = ["Lusaka","Copperbelt","Central","Southern","Eastern","Western","Northern","Muchinga","North-Western","Luapula"];

function yaleloBranches(): Branch[] {
  const lusaka = Array.from({ length: 26 }, (_, i) => ({ name: `Yalelo Depot L${i + 1}`, city: "Lusaka", province: "Lusaka" }));
  const others = provinces.slice(1).map((p) => ({ name: `Yalelo ${p} Hub`, city: p === "Copperbelt" ? "Ndola" : p, province: p }));
  return [...lusaka, ...others];
}

function pnpBranches(): Branch[] {
  const areas = ["East Park","Manda Hill","Levy Junction","Kabulonga","Woodlands","Cosmopolitan","Arcades","Downtown","Chelston","Chilenje","Northmead","Makeni","Chirundu Rd"];
  return areas.map((a) => ({ name: `Pick n Pay ${a}`, city: "Lusaka", province: "Lusaka" }));
}

export const CLIENTS: Client[] = [
  {
    id: "pnp",
    name: "Pick n Pay Zambia",
    industry: "Retail",
    primaryContact: { name: "Bumblebee", phone: "+260 977 100 001", email: "bumblebee@picknpay.co.zm" },
    cadence: "Monthly",
    lastServiced: iso(subDays(today, 22)),
    nextServiceDue: iso(addDays(today, 8)),
    scales: [{ type: "Retail POS", count: 78 }, { type: "Bench", count: 26 }, { type: "Platform", count: 13 }],
    branches: pnpBranches(),
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 185000,
    office: "Lusaka",
    notes: "13 Lusaka outlets. Monthly preventive maintenance across all retail POS lanes.",
  },
  {
    id: "yalelo",
    name: "Yalelo",
    industry: "Aquaculture",
    primaryContact: { name: "Chola Mumba", phone: "+260 966 200 020", email: "chola.mumba@yalelo.com" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 60)),
    nextServiceDue: iso(addDays(today, 32)),
    scales: [{ type: "Platform", count: 42 }, { type: "Floor", count: 18 }, { type: "Hopper", count: 6 }, { type: "Weighbridge", count: 2 }],
    branches: yaleloBranches(),
    paymentStatus: "Pending",
    outstandingZMW: 62000,
    monthlyRevenueZMW: 145000,
    office: "Lusaka",
    notes: "26 outlets in Lusaka plus one hub in each of the other 9 provinces.",
  },
  {
    id: "chilanga",
    name: "Chilanga Cement",
    industry: "Cement & Construction",
    primaryContact: { name: "Kelvin Sinyangwe", phone: "+260 977 555 010", email: "kelvin.s@chilangacement.com" },
    cadence: "Annual",
    lastServiced: iso(subDays(today, 305)),
    nextServiceDue: iso(addDays(today, 60)),
    scales: [{ type: "Weighbridge", count: 3 }, { type: "Platform", count: 5 }],
    branches: [{ name: "Chilanga Plant", city: "Chilanga", province: "Lusaka" }, { name: "Ndola Depot", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Pending",
    outstandingZMW: 240000,
    monthlyRevenueZMW: 90000,
    office: "Lusaka",
    activeProject: {
      title: "New 80T Weighbridge Installation",
      stage: "Civils",
      weeksInStage: 5,
      lead: "Martin Zulu",
      subcontractor: "Kalulu Civils Ltd",
      startedOn: iso(subDays(today, 42)),
    },
    notes: "Weighbridge programme underway. Civils week 5 — foundation cure complete, pit forming next.",
  },
  {
    id: "kcm",
    name: "Konkola Copper Mines (KCM)",
    industry: "Mining",
    primaryContact: { name: "Regina Banda", phone: "+260 966 700 400", email: "regina.banda@kcm.co.zm" },
    cadence: "Bi-Annual",
    lastServiced: iso(subDays(today, 120)),
    nextServiceDue: iso(addDays(today, 60)),
    scales: [{ type: "Weighbridge", count: 4 }, { type: "Crane", count: 3 }, { type: "Platform", count: 12 }],
    branches: [{ name: "Chingola Mine", city: "Chingola", province: "Copperbelt" }, { name: "Nchanga Plant", city: "Chingola", province: "Copperbelt" }],
    paymentStatus: "Overdue",
    outstandingZMW: 410000,
    monthlyRevenueZMW: 220000,
    office: "Ndola",
  },
  {
    id: "bonaventure",
    name: "Bonaventure",
    industry: "Logistics",
    primaryContact: { name: "Ireen Chulu", phone: "+260 955 320 110", email: "ireen@bonaventure.co.zm" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 85)),
    nextServiceDue: iso(addDays(today, 5)),
    scales: [{ type: "Weighbridge", count: 1 }, { type: "Platform", count: 4 }],
    branches: [{ name: "Bonaventure Depot", city: "Lusaka", province: "Lusaka" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 48000,
    office: "Lusaka",
  },
  {
    id: "kachema",
    name: "Kachema Meats",
    industry: "Food Processing",
    primaryContact: { name: "Given Tembo", phone: "+260 977 880 700", email: "given@kachema.com" },
    cadence: "Monthly",
    lastServiced: iso(subDays(today, 15)),
    nextServiceDue: iso(addDays(today, 15)),
    scales: [{ type: "Bench", count: 22 }, { type: "Floor", count: 6 }, { type: "Retail POS", count: 14 }],
    branches: [{ name: "Kachema Kabwata", city: "Lusaka", province: "Lusaka" }, { name: "Kachema Chelston", city: "Lusaka", province: "Lusaka" }, { name: "Kachema Ndola", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 62000,
    office: "Lusaka",
  },
  {
    id: "natbrew",
    name: "National Breweries",
    industry: "Beverage",
    primaryContact: { name: "Mwansa Kapya", phone: "+260 966 411 220", email: "mwansa.kapya@natbrew.co.zm" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 70)),
    nextServiceDue: iso(addDays(today, 20)),
    scales: [{ type: "Platform", count: 14 }, { type: "Floor", count: 8 }, { type: "Weighbridge", count: 1 }],
    branches: [{ name: "Natbrew Lusaka", city: "Lusaka", province: "Lusaka" }, { name: "Natbrew Ndola", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Overdue",
    outstandingZMW: 118000,
    monthlyRevenueZMW: 96000,
    office: "Ndola",
  },
  {
    id: "sabo",
    name: "Sabo Cement",
    industry: "Cement",
    primaryContact: { name: "Fred Lungu", phone: "+260 977 010 445", email: "fred@sabo.co.zm" },
    cadence: "Bi-Annual",
    lastServiced: iso(subDays(today, 150)),
    nextServiceDue: iso(addDays(today, 30)),
    scales: [{ type: "Weighbridge", count: 2 }, { type: "Platform", count: 3 }],
    branches: [{ name: "Sabo Plant", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Pending",
    outstandingZMW: 76000,
    monthlyRevenueZMW: 54000,
    office: "Ndola",
  },
  {
    id: "zambeef",
    name: "Zambeef Products PLC",
    industry: "Agri & Meat",
    primaryContact: { name: "Natasha Phiri", phone: "+260 966 511 700", email: "n.phiri@zambeef.co.zm" },
    cadence: "Monthly",
    lastServiced: iso(subDays(today, 25)),
    nextServiceDue: iso(addDays(today, 5)),
    scales: [{ type: "Bench", count: 30 }, { type: "Floor", count: 12 }, { type: "Retail POS", count: 40 }],
    branches: [{ name: "Zambeef Lusaka", city: "Lusaka", province: "Lusaka" }, { name: "Zambeef Mongu", city: "Mongu", province: "Western" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 130000,
    office: "Lusaka",
  },
  {
    id: "parmalat",
    name: "Parmalat Zambia",
    industry: "Dairy",
    primaryContact: { name: "Kondwani Mulenga", phone: "+260 955 700 990", email: "k.mulenga@parmalat.co.zm" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 40)),
    nextServiceDue: iso(addDays(today, 50)),
    scales: [{ type: "Platform", count: 10 }, { type: "Floor", count: 5 }],
    branches: [{ name: "Parmalat Plant", city: "Lusaka", province: "Lusaka" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 72000,
    office: "Lusaka",
  },
  {
    id: "zpc",
    name: "Zambezi Portland Cement",
    industry: "Cement",
    primaryContact: { name: "Emmanuel Musonda", phone: "+260 977 300 020", email: "e.musonda@zpc.co.zm" },
    cadence: "Annual",
    lastServiced: iso(subDays(today, 340)),
    nextServiceDue: iso(addDays(today, 25)),
    scales: [{ type: "Weighbridge", count: 2 }, { type: "Platform", count: 4 }],
    branches: [{ name: "ZPC Plant", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Pending",
    outstandingZMW: 95000,
    monthlyRevenueZMW: 60000,
    office: "Ndola",
  },
  {
    id: "superior",
    name: "Superior Milling",
    industry: "Milling",
    primaryContact: { name: "Chansa Bwalya", phone: "+260 966 220 010", email: "chansa@superiormilling.co.zm" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 55)),
    nextServiceDue: iso(addDays(today, 35)),
    scales: [{ type: "Platform", count: 8 }, { type: "Hopper", count: 3 }, { type: "Weighbridge", count: 1 }],
    branches: [{ name: "Superior Ndola", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 58000,
    office: "Ndola",
  },
  {
    id: "zamsugar",
    name: "Zambia Sugar",
    industry: "Sugar",
    primaryContact: { name: "Beatrice Nyirenda", phone: "+260 955 660 020", email: "b.nyirenda@zamsugar.co.zm" },
    cadence: "Bi-Annual",
    lastServiced: iso(subDays(today, 140)),
    nextServiceDue: iso(addDays(today, 45)),
    scales: [{ type: "Weighbridge", count: 3 }, { type: "Platform", count: 9 }, { type: "Axle", count: 2 }],
    branches: [{ name: "Nakambala Estate", city: "Mazabuka", province: "Southern" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 140000,
    office: "Lusaka",
  },
  {
    id: "mpongwe",
    name: "Mpongwe Milling",
    industry: "Milling",
    primaryContact: { name: "Isaac Nkonde", phone: "+260 977 890 040", email: "isaac@mpongwe.co.zm" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 80)),
    nextServiceDue: iso(addDays(today, 12)),
    scales: [{ type: "Platform", count: 6 }, { type: "Hopper", count: 2 }],
    branches: [{ name: "Mpongwe Mill", city: "Mpongwe", province: "Copperbelt" }],
    paymentStatus: "Overdue",
    outstandingZMW: 44000,
    monthlyRevenueZMW: 40000,
    office: "Ndola",
  },
  {
    id: "dhl",
    name: "DHL Zambia",
    industry: "Logistics",
    primaryContact: { name: "Priscilla Chanda", phone: "+260 966 100 700", email: "p.chanda@dhl.com" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 35)),
    nextServiceDue: iso(addDays(today, 55)),
    scales: [{ type: "Bench", count: 12 }, { type: "Platform", count: 5 }],
    branches: [{ name: "DHL Airport", city: "Lusaka", province: "Lusaka" }, { name: "DHL Ndola", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 38000,
    office: "Lusaka",
  },
  {
    id: "fqm",
    name: "First Quantum Minerals",
    industry: "Mining",
    primaryContact: { name: "David Mwale", phone: "+260 977 200 555", email: "david.mwale@fqml.com" },
    cadence: "Bi-Annual",
    lastServiced: iso(subDays(today, 110)),
    nextServiceDue: iso(addDays(today, 70)),
    scales: [{ type: "Weighbridge", count: 5 }, { type: "Crane", count: 2 }, { type: "Platform", count: 10 }],
    branches: [{ name: "Kansanshi Mine", city: "Solwezi", province: "North-Western" }, { name: "Sentinel Mine", city: "Kalumbila", province: "North-Western" }],
    paymentStatus: "Pending",
    outstandingZMW: 320000,
    monthlyRevenueZMW: 260000,
    office: "Ndola",
  },
  {
    id: "indeni",
    name: "Indeni Petroleum",
    industry: "Petroleum",
    primaryContact: { name: "Grace Chibale", phone: "+260 966 020 707", email: "grace.chibale@indeni.co.zm" },
    cadence: "Annual",
    lastServiced: iso(subDays(today, 300)),
    nextServiceDue: iso(addDays(today, 40)),
    scales: [{ type: "Weighbridge", count: 2 }, { type: "Platform", count: 3 }],
    branches: [{ name: "Indeni Refinery", city: "Ndola", province: "Copperbelt" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 46000,
    office: "Ndola",
  },
  {
    id: "afgri",
    name: "AFGRI Zambia",
    industry: "Agri Inputs",
    primaryContact: { name: "Timothy Mbewe", phone: "+260 955 141 800", email: "timothy@afgri.co.zm" },
    cadence: "Quarterly",
    lastServiced: iso(subDays(today, 65)),
    nextServiceDue: iso(addDays(today, 25)),
    scales: [{ type: "Platform", count: 7 }, { type: "Hopper", count: 2 }, { type: "Weighbridge", count: 1 }],
    branches: [{ name: "AFGRI Lusaka", city: "Lusaka", province: "Lusaka" }],
    paymentStatus: "Paid",
    outstandingZMW: 0,
    monthlyRevenueZMW: 44000,
    office: "Lusaka",
  },
];

export function clientById(id: string) { return CLIENTS.find(c => c.id === id); }
