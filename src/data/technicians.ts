export type TechRole = "Technician" | "Senior Technician" | "Lead Technician" | "Subcontractor";

export interface Technician {
  id: string;
  name: string;
  role: TechRole;
  location: "Lusaka" | "Ndola";
  subcontractor: boolean;
  skills: string[];
  phone: string;
  activeJobs: number;
  avatarInitials: string;
}

export const TECHNICIANS: Technician[] = [
  { id: "peter",   name: "Peter Mwanza",     role: "Lead Technician",   location: "Lusaka", subcontractor: false, skills: ["Weighbridge","Load Cells","Calibration"], phone: "+260 977 111 001", activeJobs: 4, avatarInitials: "PM" },
  { id: "martin",  name: "Martin Zulu",      role: "Senior Technician", location: "Lusaka", subcontractor: false, skills: ["Civils","Weighbridge","Project Lead"],    phone: "+260 966 222 002", activeJobs: 3, avatarInitials: "MZ" },
  { id: "charles", name: "Charles Banda",    role: "Technician",        location: "Ndola",  subcontractor: false, skills: ["Platform Scales","POS","Retail"],         phone: "+260 955 333 003", activeJobs: 5, avatarInitials: "CB" },
  { id: "chris",   name: "Chris Phiri",      role: "Senior Technician", location: "Lusaka", subcontractor: false, skills: ["Indicators","Diagnostics","Firmware"],    phone: "+260 977 444 004", activeJobs: 2, avatarInitials: "CP" },
  { id: "mwando",  name: "Mwando Chileshe",  role: "Technician",        location: "Ndola",  subcontractor: false, skills: ["Bench Scales","Delivery","Assembly"],     phone: "+260 966 555 005", activeJobs: 3, avatarInitials: "MC" },
  { id: "kalulu",  name: "Kalulu Civils Team", role: "Subcontractor",   location: "Lusaka", subcontractor: true,  skills: ["Concrete","Weighbridge Pits","Rebar"],    phone: "+260 977 700 010", activeJobs: 1, avatarInitials: "KC" },
  { id: "brian",   name: "Brian Sakala",     role: "Technician",        location: "Ndola",  subcontractor: false, skills: ["Load Cells","Cabling"],                    phone: "+260 955 900 090", activeJobs: 2, avatarInitials: "BS" },
];

export function techById(id: string) { return TECHNICIANS.find(t => t.id === id); }
