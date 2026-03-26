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
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function parseResultaten(text: string): InspectieResultaat[] {
  const results: InspectieResultaat[] = [];

  const resultIdx = text.indexOf("RESULTATEN INSPECTIE DEELZENDINGEN");
  if (resultIdx === -1) return results;

  const section = text.substring(resultIdx);

  // Find entries - they follow the header row pattern
  // The text format concatenates fields: 1ROSAKE4620 ST26 DOOS (KARTON)...Status
  // Or: Volgnummer deelzending + Gewas + Oorsprong + Hoeveelheid + Colli + FytoCert + Status
  const gewassen = ["ROSA", "GYPSOPHILA", "ASTER", "SOLIDAGO", "TRACHELIUM"];
  const oorsprong = ["KE", "ZW", "EC", "CO", "KENIA", "KENYA", "ZIMBABWE", "ECUADOR", "COLOMBIA"];
  const statusValues = ["Goedgekeurd", "Wacht op vervolg", "Afgekeurd", "Geblokkeerd"];

  // Simple line-by-line parsing of the result section
  const lines = section.split("\n");
  let currentEntry: Partial<InspectieResultaat> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for numbered entry start (e.g., "1ROSAKE..." or "1 ROSA KE...")
    const entryMatch = trimmed.match(/^(\d+)\s*([A-Z]+?)(?:KE|ZW|EC|CO|KENIA|KENYA|ZIMBABWE|ECUADOR|COLOMBIA)/i);
    if (entryMatch) {
      if (currentEntry.gewas) {
        results.push(currentEntry as InspectieResultaat);
      }
      currentEntry = {
        volgnummer: parseInt(entryMatch[1]),
        gewas: "",
        oorsprong: "",
        hoeveelheid: "",
        colli: "",
        fytoCertificaat: null,
        status: "Goedgekeurd",
        dossiernummer: null,
        monsternummer: null,
        redenen: null,
      };

      // Parse the concatenated line
      // Pattern: 1ROSAKE4620 ST26 DOOS (KARTON)CERTNUMGoedgekeurd
      for (const g of gewassen) {
        if (trimmed.includes(g)) {
          currentEntry.gewas = g;
          break;
        }
      }
      for (const o of oorsprong) {
        const gIdx = trimmed.indexOf(currentEntry.gewas || "");
        const afterGewas = trimmed.substring(gIdx + (currentEntry.gewas?.length || 0));
        if (afterGewas.startsWith(o)) {
          currentEntry.oorsprong = o;
          break;
        }
      }

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

      // Check for status
      for (const s of statusValues) {
        if (trimmed.includes(s)) {
          currentEntry.status = s;
          break;
        }
      }
    }

    // Check for "Wacht op vervolg" on continuation lines
    if (trimmed.includes("Wacht op vervolg") && currentEntry.gewas) {
      currentEntry.status = "Wacht op vervolg";
    }

    // Check for dossiernummer (BI/XXXXX/XX pattern)
    const dossierMatch = trimmed.match(/BI\/(\d+)\/(\d+)/);
    if (dossierMatch && currentEntry.gewas) {
      currentEntry.dossiernummer = dossierMatch[0];
    }

    // Check for monsternummer (MO/XXXXX/XX pattern)
    const monsterMatch = trimmed.match(/MO\/(\d+)\/(\d+)/);
    if (monsterMatch && currentEntry.gewas) {
      currentEntry.monsternummer = monsterMatch[0];
    }

    // Check for redenen
    if (trimmed.includes("Vermoeden Q") && currentEntry.gewas) {
      currentEntry.redenen = trimmed;
    }
  }

  // Push last entry
  if (currentEntry.gewas) {
    results.push(currentEntry as InspectieResultaat);
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
    awbNummer: extractField(text, "AWB-nummer"),
    bolNummer: extractField(text, "BOL-nummer") || null,
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
