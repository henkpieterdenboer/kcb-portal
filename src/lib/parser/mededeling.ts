import { normalizeStatus, ShipmentStatus } from "@/types";

export interface MededelingData {
  aangiftenummer: string;
  aangever: string | null;
  relatienummer: string | null;
  relatienaam: string | null;
  referentie: string | null;
  exporteur: string | null;
  importeur: string | null;
  awb: string | null;
  bol: string | null;
  containerNrs: string | null;
  landVanVerzending: string | null;
  landVanOorsprong: string | null;
  transportNaarEU: string | null;
  transportBinnenEU: string | null;
  inspectiedatum: Date | null;
  inspectielocatie: string | null;
  verwachteAankomst: Date | null;
  status: ShipmentStatus;
  subShipments: SubShipmentData[];
}

export interface SubShipmentData {
  botanischeNaam: string;
  landVanOorsprong: string | null;
  aantalColli: number | null;
  soortColli: string | null;
  aantalStuks: number | null;
  taricCode: string | null;
  bescheiden: string | null;
}

function extractField(text: string, label: string): string | null {
  const regex = new RegExp(`${label}\\s*:\\s*(.+?)(?:\\n|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function parseDutchDate(dateStr: string): Date | null {
  // Format: DD-MM-YYYY HH:MM or DD-MM-YYYY
  const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, day, month, year, hours, minutes] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    hours ? parseInt(hours) : 0,
    minutes ? parseInt(minutes) : 0
  );
}

function parseSubShipments(text: string): SubShipmentData[] {
  const results: SubShipmentData[] = [];

  // Find the Deelzendingen section (page 2)
  const deelIdx = text.indexOf("Deelzendingen");
  if (deelIdx === -1) return results;

  const section = text.substring(deelIdx);

  // Pattern: The table has merged text like:
  // GYPSOPHILAKENIA30DOOS\n(KARTON)\n480000603197090...
  // ROSAKENIA26DOOS\n(KARTON)\n46200603110000...
  // We need to parse these plant names followed by country and numbers

  const plantNames = [
    "ROSA", "GYPSOPHILA", "ASTER", "SOLIDAGO", "TRACHELIUM",
    "NIET-INSPECTIE\nPLICHTIGE \nSNIJBLOEMEN", "NIET-INSPECTIE\nPLICHTIGE\nSNIJBLOEMEN",
    "NIET-INSPECTIEPLICHTIGE SNIJBLOEMEN",
  ];

  const countries = ["KENIA", "KENYA", "ZIMBABWE", "ECUADOR", "COLOMBIA", "ETHIOPIE", "ETHIOPIA"];

  // Normalize the section text for easier parsing
  const lines = section.split("\n").map(l => l.trim()).filter(Boolean);
  const flatText = lines.join(" ");

  // Regex to find plant name + country + numbers pattern
  // The PDF text concatenates fields: BOTANISCHENAAMcountryNUMBERDOOS...
  // Note: stuks and TARIC code run together (e.g. "653410603110000" = 65341 stuks + 0603110000 TARIC)
  const entryRegex = /(ROSA|GYPSOPHILA|ASTER|SOLIDAGO|TRACHELIUM|NIET-INSPECTIEPLICHTIGE SNIJBLOEMEN|NIET-INSPECTIE\s*PLICHTIGE\s*SNIJBLOEMEN)\s*(KENIA|KENYA|ZIMBABWE|ECUADOR|COLOMBIA|ETHIOPIE|ETHIOPIA|ZW|KE|EC|CO|NL)\s*(\d+)\s*(?:DOOS\s*\(KARTON\)|DOOS)\s*(\d+)/gi;

  let match;
  while ((match = entryRegex.exec(flatText)) !== null) {
    const botanischeNaam = match[1].replace(/\s+/g, " ").trim();
    let land = match[2].toUpperCase();
    // Normalize short country codes
    if (land === "KE") land = "KENIA";
    if (land === "ZW") land = "ZIMBABWE";
    if (land === "EC") land = "ECUADOR";
    if (land === "CO") land = "COLOMBIA";

    // Split stuks+TARIC: TARIC codes for flowers start with "0603"
    const rawNumber = match[4];
    let aantalStuks: number | null = null;
    let taricCode: string | null = null;
    const taricIdx = rawNumber.indexOf("0603");
    if (taricIdx > 0) {
      aantalStuks = parseInt(rawNumber.substring(0, taricIdx)) || null;
      taricCode = rawNumber.substring(taricIdx);
    } else {
      aantalStuks = parseInt(rawNumber) || null;
    }

    results.push({
      botanischeNaam,
      landVanOorsprong: land,
      aantalColli: parseInt(match[3]) || null,
      soortColli: "DOOS (KARTON)",
      aantalStuks,
      taricCode,
      bescheiden: null,
    });
  }

  return results;
}

export function parseMededeling(text: string): MededelingData | null {
  const aangiftenummer = extractField(text, "Aangiftenummer");
  if (!aangiftenummer) return null;

  let rawStatus = extractField(text, "Status van de aangifte") || "Documentcontrole";

  // P2 code in bescheiden column means the shipment is released/approved,
  // even when the PDF status still says "Fysieke inspectie"
  const deelIdx = text.indexOf("Deelzendingen");
  if (deelIdx !== -1 && /\bP2\s+\d/.test(text.substring(deelIdx))) {
    if (normalizeStatus(rawStatus) === "FYSIEKE_INSPECTIE") {
      rawStatus = "Goedgekeurd";
    }
  }

  const aangever = extractField(text, "Aangever");
  const relatieRaw = extractField(text, "Relatienr \\+ naam");
  let relatienummer: string | null = null;
  let relatienaam: string | null = null;
  if (relatieRaw) {
    const relMatch = relatieRaw.match(/^(V\d+)\s+(.+)/);
    if (relMatch) {
      relatienummer = relMatch[1];
      relatienaam = relMatch[2];
    } else {
      relatienaam = relatieRaw;
    }
  }

  const inspectiedatumStr = extractField(text, "Aangevraagde inspectiedatum");
  const verwachteAankomstStr = extractField(text, "Verwachte aankomsttijd");

  return {
    aangiftenummer,
    aangever,
    relatienummer,
    relatienaam,
    referentie: extractField(text, "Referentie"),
    exporteur: extractField(text, "Exporteur"),
    importeur: extractField(text, "Importeur"),
    awb: extractField(text, "Awb"),
    bol: extractField(text, "Bol") || null,
    containerNrs: extractField(text, "Container nr\\(s\\)") || null,
    landVanVerzending: extractField(text, "Land van verzending"),
    landVanOorsprong: extractField(text, "Land van oorsprong"),
    transportNaarEU: extractField(text, "Transport naar EU"),
    transportBinnenEU: extractField(text, "Transport binnen EU"),
    inspectiedatum: inspectiedatumStr ? parseDutchDate(inspectiedatumStr) : null,
    inspectielocatie: extractField(text, "Aangevraagde inspectielocatie"),
    verwachteAankomst: verwachteAankomstStr ? parseDutchDate(verwachteAankomstStr) : null,
    status: normalizeStatus(rawStatus),
    subShipments: parseSubShipments(text),
  };
}
