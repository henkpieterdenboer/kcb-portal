export interface MonsterData {
  dossiernummer: string;
  registratienummer: string | null;
  aanvraagnummer: string | null;
  soortInspectie: string | null;
  inspecteur: string | null;
  bedrijfsnaam: string | null;
  adres: string | null;
  product: string | null;
  hoeveelheid: string | null;
  colli: string | null;
  landVanOorsprong: string | null;
  monsternummer: string | null;
  datumMonstername: Date | null;
  plaatsMonstername: string | null;
  soortMonster: string | null;
  typeMonster: string | null;
  vermoedenOorzaak: string | null;
  opmerking: string | null;
  diagnose: string | null;
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
  return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
}

export function parseMonster(text: string): MonsterData | null {
  // Dossiernummer is in format MO/XXXXXXXX/XX at the top
  const dossierMatch = text.match(/MO\/(\d+)\/(\d+)/);
  if (!dossierMatch) return null;
  const dossiernummer = dossierMatch[0];

  const datumStr = extractField(text, "Datum monstername");

  // Parse product info from the table
  // Pattern: ProductHoeveelheidColli... in table
  const productMatch = text.match(/(SOLIDAGO|ROSA|GYPSOPHILA|ASTER|TRACHELIUM)\s*(\d+)\s*ST\s*(\d+)\s*DOOS/i);
  let product: string | null = null;
  let hoeveelheid: string | null = null;
  let colli: string | null = null;
  if (productMatch) {
    product = productMatch[1];
    hoeveelheid = productMatch[2] + " ST";
    colli = productMatch[3] + " DOOS (KARTON)";
  }

  // Land van oorsprong from table (short codes)
  const landMatch = text.match(/(?:Vastgelegd\?|JA|Ja|NEE|Nee)\s*(ZW|KE|EC|CO|NL)/i);
  let land: string | null = null;
  if (landMatch) {
    const code = landMatch[1].toUpperCase();
    const landMap: Record<string, string> = { ZW: "ZIMBABWE", KE: "KENIA", EC: "ECUADOR", CO: "COLOMBIA", NL: "NEDERLAND" };
    land = landMap[code] || code;
  }

  return {
    dossiernummer,
    registratienummer: extractField(text, "Registratienummer"),
    aanvraagnummer: extractField(text, "Aanvraagnummer"),
    soortInspectie: extractField(text, "Soort inspectie"),
    inspecteur: extractField(text, "Inspecteur/monsternemer"),
    bedrijfsnaam: extractField(text, "Bedrijfsnaam"),
    adres: extractField(text, "Adres"),
    product,
    hoeveelheid,
    colli,
    landVanOorsprong: land,
    monsternummer: extractField(text, "Monsternummer"),
    datumMonstername: datumStr ? parseDutchDate(datumStr) : null,
    plaatsMonstername: extractField(text, "Plaats monstername"),
    soortMonster: extractField(text, "Soort monster"),
    typeMonster: extractField(text, "Type monster"),
    vermoedenOorzaak: extractField(text, "Vermoeden oorzaak/onderzoeken op"),
    opmerking: extractField(text, "Opmerking"),
    diagnose: extractField(text, "Diagnose") || null,
  };
}
