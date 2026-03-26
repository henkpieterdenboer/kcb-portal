export const SHIPMENT_STATUSES = [
  "AANGEMELD",
  "INSPECTIE_AANGEVRAAGD",
  "INSPECTIE_GEPLAND",
  "DOCUMENTCONTROLE",
  "DOCUMENTCONTROLE_AFGEROND",
  "FYSIEKE_INSPECTIE",
  "GOEDGEKEURD",
  "WACHT_OP_VERVOLG",
  "GEBLOKKEERD",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  AANGEMELD: "Registered",
  INSPECTIE_AANGEVRAAGD: "Inspection Requested",
  INSPECTIE_GEPLAND: "Inspection Scheduled",
  DOCUMENTCONTROLE: "Document Control",
  DOCUMENTCONTROLE_AFGEROND: "Document Control Completed",
  FYSIEKE_INSPECTIE: "Physical Inspection",
  GOEDGEKEURD: "Approved",
  WACHT_OP_VERVOLG: "Awaiting Follow-up",
  GEBLOKKEERD: "Blocked",
};

export const STATUS_COLORS: Record<ShipmentStatus, string> = {
  AANGEMELD: "bg-slate-100 text-slate-800",
  INSPECTIE_AANGEVRAAGD: "bg-indigo-100 text-indigo-800",
  INSPECTIE_GEPLAND: "bg-violet-100 text-violet-800",
  DOCUMENTCONTROLE: "bg-blue-100 text-blue-800",
  DOCUMENTCONTROLE_AFGEROND: "bg-cyan-100 text-cyan-800",
  FYSIEKE_INSPECTIE: "bg-yellow-100 text-yellow-800",
  GOEDGEKEURD: "bg-green-100 text-green-800",
  WACHT_OP_VERVOLG: "bg-orange-100 text-orange-800",
  GEBLOKKEERD: "bg-red-100 text-red-800",
};

export const TERMINAL_STATUSES: ShipmentStatus[] = ["GOEDGEKEURD", "WACHT_OP_VERVOLG", "GEBLOKKEERD"];
export const ACTIVE_STATUSES = SHIPMENT_STATUSES.filter(
  (s) => !(TERMINAL_STATUSES as string[]).includes(s)
);

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as string[]).includes(status);
}

export type DocumentType = "MEDEDELING" | "INSPECTIE" | "MONSTER" | "BLOKKADE" | "UNKNOWN";

export function normalizeStatus(rawStatus: string): ShipmentStatus {
  const s = rawStatus.trim().toLowerCase();
  if (s === "aangemeld") return "AANGEMELD";
  if (s === "inspectie aangevraagd") return "INSPECTIE_AANGEVRAAGD";
  if (s === "inspectie gepland") return "INSPECTIE_GEPLAND";
  if (s === "documentcontrole") return "DOCUMENTCONTROLE";
  if (s === "documentcontrole afgerond") return "DOCUMENTCONTROLE_AFGEROND";
  if (s === "fysieke inspectie") return "FYSIEKE_INSPECTIE";
  if (s === "goedgekeurd") return "GOEDGEKEURD";
  if (s.includes("wacht op vervolg") || s.includes("wacht")) return "WACHT_OP_VERVOLG";
  if (s.includes("geblokkeerd") || s.includes("blokkade")) return "GEBLOKKEERD";
  return "AANGEMELD";
}
