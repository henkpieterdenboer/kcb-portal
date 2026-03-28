export interface BlokkadeData {
  dossiernummer: string;
  registratienummer: string | null;
  aangiftenummer: string | null;
  nummerFytoCertificaat: string | null;
  landVanAfgifte: string | null;
  referentie: string | null;
  inspectiedatum: Date | null;
  soortInspectie: string | null;
  locatieNaam: string | null;
  locatieAdres: string | null;
  inspecteur: string | null;
  reden: string | null;
  varieteit: string | null;
  monsternummer: string | null;
}

function extractField(text: string, label: string): string | null {
  const regex = new RegExp(`${label}\\s*:\\s*(.+?)(?:\\n|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function parseDutchDate(dateStr: string): Date | null {
  const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

export function parseBlokkade(text: string): BlokkadeData | null {
  // Dossiernummer is in format BI/XXXXXXXX/XX at the top
  const dossierMatch = text.match(/B[DI]\/(\d+)\/(\d+)/);
  if (!dossierMatch) return null;
  const dossiernummer = dossierMatch[0];

  const inspectiedatumStr = extractField(text, "Inspectiedatum");

  return {
    dossiernummer,
    registratienummer: extractField(text, "Registratienummer"),
    aangiftenummer: extractField(text, "Aangiftenummer"),
    nummerFytoCertificaat: extractField(text, "Nummer fytosanitair certificaat"),
    landVanAfgifte: extractField(text, "Land van afgifte"),
    referentie: extractField(text, "Referentie aanvrager"),
    inspectiedatum: inspectiedatumStr ? parseDutchDate(inspectiedatumStr) : null,
    soortInspectie: extractField(text, "Soort inspectie"),
    locatieNaam: extractField(text, "Naam"),
    locatieAdres: extractField(text, "Adres"),
    inspecteur: extractField(text, "Naam KCB-inspecteur"),
    reden: extractField(text, "Reden"),
    varieteit: extractField(text, "Variëteit") || extractField(text, "Varieteit"),
    monsternummer: extractField(text, "Monsternummer"),
  };
}
