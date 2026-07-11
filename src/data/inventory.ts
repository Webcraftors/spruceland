export interface InventoryItem {
  id: string;
  name: string;
  category: "Load Cell" | "Indicator" | "Junction Box" | "Cabling" | "Test Weight" | "Printer" | "Spares";
  sku: string;
  onHand: number;
  reorder: number;
  location: "Lusaka" | "Ndola";
  unitCostZMW: number;
}

export const INVENTORY: InventoryItem[] = [
  { id: "inv-1",  name: "Zemic H8C 2t Load Cell", category: "Load Cell", sku: "LC-H8C-2T", onHand: 22, reorder: 10, location: "Lusaka", unitCostZMW: 3200 },
  { id: "inv-2",  name: "Zemic HM9B 30t Load Cell", category: "Load Cell", sku: "LC-HM9B-30T", onHand: 6, reorder: 8, location: "Ndola", unitCostZMW: 9800 },
  { id: "inv-3",  name: "Rinstrum R320 Indicator", category: "Indicator", sku: "IND-R320", onHand: 14, reorder: 6, location: "Lusaka", unitCostZMW: 5400 },
  { id: "inv-4",  name: "Rinstrum R420 Weighbridge Indicator", category: "Indicator", sku: "IND-R420", onHand: 3, reorder: 4, location: "Lusaka", unitCostZMW: 18500 },
  { id: "inv-5",  name: "Ohaus T31P Retail Indicator", category: "Indicator", sku: "IND-T31P", onHand: 40, reorder: 15, location: "Lusaka", unitCostZMW: 4200 },
  { id: "inv-6",  name: "8-way Stainless Junction Box", category: "Junction Box", sku: "JB-SS-8", onHand: 11, reorder: 5, location: "Ndola", unitCostZMW: 2600 },
  { id: "inv-7",  name: "4-way ABS Junction Box", category: "Junction Box", sku: "JB-ABS-4", onHand: 18, reorder: 8, location: "Lusaka", unitCostZMW: 1400 },
  { id: "inv-8",  name: "6-core Shielded Cable (per m)", category: "Cabling", sku: "CBL-6C-M", onHand: 640, reorder: 300, location: "Lusaka", unitCostZMW: 55 },
  { id: "inv-9",  name: "F1 Calibration Weight Set 1–20kg", category: "Test Weight", sku: "TW-F1-20", onHand: 4, reorder: 2, location: "Lusaka", unitCostZMW: 21000 },
  { id: "inv-10", name: "M1 Cast Iron Weights 500kg (set)", category: "Test Weight", sku: "TW-M1-500", onHand: 2, reorder: 1, location: "Ndola", unitCostZMW: 34000 },
  { id: "inv-11", name: "Epson TM-U220 Printer", category: "Printer", sku: "PRN-TMU220", onHand: 9, reorder: 4, location: "Lusaka", unitCostZMW: 4800 },
  { id: "inv-12", name: "Load Cell Cable Gland Kit", category: "Spares", sku: "SP-GLAND", onHand: 60, reorder: 25, location: "Lusaka", unitCostZMW: 120 },
];

export interface Order {
  id: string;
  supplier: string;
  item: string;
  qty: number;
  totalZMW: number;
  status: "Placed" | "In Transit" | "Received" | "Delayed";
  eta: string;
}

const t = (n: number) => new Date(Date.now() + n * 864e5).toISOString();

export const ORDERS: Order[] = [
  { id: "PO-1042", supplier: "Zemic (SA)", item: "HM9B 30t Load Cells x8", qty: 8, totalZMW: 78400, status: "In Transit", eta: t(5) },
  { id: "PO-1043", supplier: "Rinstrum",   item: "R420 Weighbridge Indicators x4", qty: 4, totalZMW: 74000, status: "Placed", eta: t(14) },
  { id: "PO-1044", supplier: "Local Fabricator", item: "80T Weighbridge Deck Sections", qty: 6, totalZMW: 420000, status: "Delayed", eta: t(9) },
  { id: "PO-1045", supplier: "Ohaus", item: "T31P Retail Indicators x20", qty: 20, totalZMW: 84000, status: "Received", eta: t(-2) },
];
