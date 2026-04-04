export interface InspectieData {
  rapportnummer: string;
  registratienummer: string | null;
  rapportdatum: Date | null;
  soortInspectie: string | null;
  bezoeknummer: string | null;
  aanvraagnummer: string | null;
  aanvrager: string | null;
  aangever: string | null;
  afzender: string | null;
  awbNummer: string | null;
  bolNummer: string | null;
  landVanVertrek: string | null;
  referentie: string | null;
  inspectiedatum: Date | null;
  tijdAanvang: string | null;
  tijdEinde: string | null;
  inspectieMinuten: number | null;
  inspecteur: string | null;
  locatieNaam: string | null;
  locatieAdres: string | null;
  resultaten: InspectieResultaat[];
}

export interface InspectieResultaat {
  volgnummer: number;
  gewas: string;
  oorsprong: string;
  hoeveelheid: string;
  colli: string;
  fytoCertificaat: string | null;
  status: string;
  dossiernummer: string | null;
  monsternummer: string | null;
  redenen: string | null;
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

function parseResultaten(text: string): InspectieResultaat[] {
  const results: InspectieResultaat[] = [];

  const resultIdx = text.indexOf("RESULTATEN INSPECTIE DEELZENDINGEN");
  if (resultIdx === -1) return results;

  const section = text.substring(resultIdx);
  const statusValues = ["Goedgekeurd", "Wacht op vervolg", "Afgekeurd", "Geblokkeerd"];

  // Entry regex: volgnummer + gewas (any 3+ uppercase letters) + country
  // Handles both concatenated ("1ROSAKE...") and spaced ("1 ROSA KE ...") formats
  const countryPattern = "KENIA|KENYA|ZIMBABWE|ECUADOR|COLOMBIA|ETHIOPIE|ETHIOPIA|KE|ZW|EC|CO|ET|NL";
  const entryRegex = new RegExp(
    `^(\\d+)\\s*([A-Z]{3,}?)\\s*(${countryPattern})`, "i"
  );

  const lines = section.split("\n");
  let currentEntry: Partial<InspectieResultaat> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    const entryMatch = trimmed.match(entryRegex);
    if (entryMatch) {
      // Push previous entry before starting new one
      if (currentEntry.volgnummer !== undefined) {
        results.push(currentEntry as InspectieResultaat);
      }
      currentEntry = {
        volgnummer: parseInt(entryMatch[1]),
        gewas: entryMatch[2].trim(),
        oorsprong: entryMatch[3].toUpperCase(),
        hoeveelheid: "",
        colli: "",
        fytoCertificaat: null,
        status: "Goedgekeurd",
        dossiernummer: null,
        monsternummer: null,
        redenen: null,
      };

      // Extract hoeveelheid (number + ST)
      const hoevMatch = trimmed.match(/(\d+)\s*ST/);
      if (hoevMatch) {
        currentEntry.hoeveelheid = hoevMatch[1] + " ST";
      }

      // Extract colli
      const colliMatch = trimmed.match(/(\d+)\s*DOOS\s*\(KARTON\)/);
      if (colliMatch) {
        currentEntry.colli = colliMatch[1] + " DOOS (KARTON)";
      }

      // Check for status on same line
      for (const s of statusValues) {
        if (trimmed.includes(s)) {
          currentEntry.status = s;
          break;
        }
      }
    }

    // Check for non-default status on continuation lines
    if (!entryMatch && currentEntry.volgnummer !== undefined) {
      if (trimmed.includes("Wacht op vervolg")) {
        currentEntry.status = "Wacht op vervolg";
      } else if (trimmed.includes("Afgekeurd")) {
        currentEntry.status = "Afgekeurd";
      } else if (trimmed.includes("Geblokkeerd")) {
        currentEntry.status = "Geblokkeerd";
      }
    }

    // Check for dossiernummer (BI/XXXXX/XX pattern)
    const dossierMatch = trimmed.match(/BI\/(\d+)\/(\d+)/);
    if (dossierMatch && currentEntry.volgnummer !== undefined) {
      currentEntry.dossiernummer = dossierMatch[0];
    }

    // Check for monsternummer (MO/XXXXX/XX pattern)
    const monsterMatch = trimmed.match(/MO\/(\d+)\/(\d+)/);
    if (monsterMatch && currentEntry.volgnummer !== undefined) {
      currentEntry.monsternummer = monsterMatch[0];
    }

    // Check for redenen
    if (trimmed.includes("Vermoeden Q") && currentEntry.volgnummer !== undefined) {
      currentEntry.redenen = trimmed;
    }
  }

  // Push last entry
  if (currentEntry.volgnummer !== undefined) {
    results.push(currentEntry as InspectieResultaat);
  }

  // Fallback: if structured parsing failed but the section header exists,
  // scan for status keywords to at least get the overall status right.
  // Priority: worst status wins.
  if (results.length === 0) {
    const flatSection = lines.join(" ");
    const prioritized = ["Geblokkeerd", "Afgekeurd", "Wacht op vervolg", "Goedgekeurd"];
    for (const s of prioritized) {
      if (flatSection.includes(s)) {
        results.push({
          volgnummer: 1,
          gewas: "UNKNOWN",
          oorsprong: "",
          hoeveelheid: "",
          colli: "",
          fytoCertificaat: null,
          status: s,
          dossiernummer: null,
          monsternummer: null,
          redenen: null,
        });
        break;
      }
    }
  }

  return results;
}

export function parseInspectie(text: string): InspectieData | null {
  const rapportnummer = extractField(text, "Rapportnummer");
  if (!rapportnummer) return null;

  const rapportdatumStr = extractField(text, "Rapportdatum");
  const inspectiedatumStr = extractField(text, "Inspectiedatum");
  const inspMinStr = extractField(text, "Inspectieminuten\naanvraag/opdracht") ||
    extractField(text, "aanvraag/opdracht");

  // Extract inspecteur from "Rapport geautoriseerd door"
  const inspecteur = extractField(text, "Rapport geautoriseerd door");

  return {
    rapportnummer,
    registratienummer: extractField(text, "Registratienummer"),
    rapportdatum: rapportdatumStr ? parseDutchDate(rapportdatumStr) : null,
    soortInspectie: extractField(text, "Soort inspectie"),
    bezoeknummer: extractField(text, "Bezoeknummer"),
    aanvraagnummer: extractField(text, "Aanvraagnummer"),
    aanvrager: extractField(text, "Aanvrager"),
    aangever: extractField(text, "Aangever"),
    afzender: extractField(text, "Afzender"),
    awbNummer: extractField(text, "AWB-nummer") || extractField(text, "Airway Bill nummer") || extractField(text, "Airwaybillnummer") || null,
    bolNummer: extractField(text, "BOL-nummer") || extractField(text, "Bill of Lading nummer") || null,
    landVanVertrek: extractField(text, "Land van vertrek"),
    referentie: extractField(text, "Referentie"),
    inspectiedatum: inspectiedatumStr ? parseDutchDate(inspectiedatumStr) : null,
    tijdAanvang: extractField(text, "Tijdstip aanvang bezoek"),
    tijdEinde: extractField(text, "Tijdstip einde bezoek"),
    inspectieMinuten: inspMinStr ? parseInt(inspMinStr) || null : null,
    inspecteur,
    locatieNaam: extractField(text, "Naam"),
    locatieAdres: extractField(text, "Adres"),
    resultaten: parseResultaten(text),
  };
}
