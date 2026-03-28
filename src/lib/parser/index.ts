import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { detectDocumentType } from "./detect";
import { parseMededeling } from "./mededeling";
import { parseInspectie } from "./inspectie";
import { parseMonster } from "./monster";
import { parseBlokkade } from "./blokkade";
import { prisma } from "../db";
import { normalizeStatus } from "@/types";

export interface ParseResult {
  type: string;
  aangiftenummer?: string;
  success: boolean;
  error?: string;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const doc = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    verbosity: 0, // suppress warnings about standardFontDataUrl
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let currentLine = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const textItem = item as { str: string; hasEOL?: boolean };
      currentLine += textItem.str;
      if (textItem.hasEOL) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}

export async function parsePdfBuffer(buffer: Buffer, emailIngestionId?: string): Promise<ParseResult> {
  const text = await extractTextFromPdf(buffer);
  const docType = detectDocumentType(text);

  switch (docType) {
    case "MEDEDELING":
      return processMededeling(text, emailIngestionId);
    case "INSPECTIE":
      return processInspectie(text);
    case "MONSTER":
      return processMonster(text);
    case "BLOKKADE":
      return processBlokkade(text);
    default:
      return { type: "UNKNOWN", success: false, error: "Unknown document type" };
  }
}

async function processMededeling(text: string, emailIngestionId?: string): Promise<ParseResult> {
  const data = parseMededeling(text);
  if (!data) return { type: "MEDEDELING", success: false, error: "Failed to parse mededeling" };

  const shipment = await prisma.shipment.upsert({
    where: { aangiftenummer: data.aangiftenummer },
    create: {
      aangiftenummer: data.aangiftenummer,
      aangever: data.aangever,
      relatienummer: data.relatienummer,
      relatienaam: data.relatienaam,
      referentie: data.referentie,
      exporteur: data.exporteur,
      importeur: data.importeur,
      awb: data.awb,
      bol: data.bol,
      containerNrs: data.containerNrs,
      landVanVerzending: data.landVanVerzending,
      landVanOorsprong: data.landVanOorsprong,
      transportNaarEU: data.transportNaarEU,
      transportBinnenEU: data.transportBinnenEU,
      inspectiedatum: data.inspectiedatum,
      inspectielocatie: data.inspectielocatie,
      verwachteAankomst: data.verwachteAankomst,
      status: data.status,
      emailIngestionId,
    },
    update: {
      aangever: data.aangever,
      relatienummer: data.relatienummer,
      relatienaam: data.relatienaam,
      referentie: data.referentie,
      exporteur: data.exporteur,
      importeur: data.importeur,
      awb: data.awb,
      landVanVerzending: data.landVanVerzending,
      landVanOorsprong: data.landVanOorsprong,
      transportNaarEU: data.transportNaarEU,
      transportBinnenEU: data.transportBinnenEU,
      inspectiedatum: data.inspectiedatum,
      inspectielocatie: data.inspectielocatie,
      verwachteAankomst: data.verwachteAankomst,
      status: data.status,
      emailIngestionId,
    },
  });

  // Create status history entry
  await prisma.statusHistory.create({
    data: {
      shipmentId: shipment.id,
      status: data.status,
      source: "MEDEDELING",
      details: `Status update from Mededeling PDF`,
    },
  });

  // Upsert sub-shipments (delete old, create new)
  if (data.subShipments.length > 0) {
    await prisma.subShipment.deleteMany({ where: { shipmentId: shipment.id } });
    await prisma.subShipment.createMany({
      data: data.subShipments.map((sub) => ({
        shipmentId: shipment.id,
        botanischeNaam: sub.botanischeNaam,
        landVanOorsprong: sub.landVanOorsprong,
        aantalColli: sub.aantalColli,
        soortColli: sub.soortColli,
        aantalStuks: sub.aantalStuks,
        taricCode: sub.taricCode,
        bescheiden: sub.bescheiden,
      })),
    });
  }

  return { type: "MEDEDELING", aangiftenummer: data.aangiftenummer, success: true };
}

async function processInspectie(text: string): Promise<ParseResult> {
  const data = parseInspectie(text);
  if (!data) return { type: "INSPECTIE", success: false, error: "Failed to parse inspection report" };

  // Find linked shipment by aanvraagnummer (= aangiftenummer)
  let shipmentId: string | null = null;
  if (data.aanvraagnummer) {
    const shipment = await prisma.shipment.findUnique({
      where: { aangiftenummer: data.aanvraagnummer },
    });
    shipmentId = shipment?.id || null;
  }

  // Determine overall status from resultaten
  let overallStatus = "Goedgekeurd";
  const resultatenJson = JSON.stringify(data.resultaten);
  for (const r of data.resultaten) {
    if (r.status === "Wacht op vervolg") {
      overallStatus = "Wacht op vervolg";
      break;
    }
    if (r.status === "Afgekeurd" || r.status === "Geblokkeerd") {
      overallStatus = r.status;
      break;
    }
  }

  await prisma.inspectionReport.upsert({
    where: { rapportnummer: data.rapportnummer },
    create: {
      rapportnummer: data.rapportnummer,
      registratienummer: data.registratienummer,
      rapportdatum: data.rapportdatum,
      soortInspectie: data.soortInspectie,
      bezoeknummer: data.bezoeknummer,
      aanvraagnummer: data.aanvraagnummer,
      aanvrager: data.aanvrager,
      aangever: data.aangever,
      afzender: data.afzender,
      awbNummer: data.awbNummer,
      bolNummer: data.bolNummer,
      landVanVertrek: data.landVanVertrek,
      referentie: data.referentie,
      inspectiedatum: data.inspectiedatum,
      tijdAanvang: data.tijdAanvang,
      tijdEinde: data.tijdEinde,
      inspectieMinuten: data.inspectieMinuten,
      inspecteur: data.inspecteur,
      locatieNaam: data.locatieNaam,
      locatieAdres: data.locatieAdres,
      resultaten: resultatenJson,
      shipmentId,
    },
    update: {
      rapportdatum: data.rapportdatum,
      inspectiedatum: data.inspectiedatum,
      resultaten: resultatenJson,
      shipmentId,
    },
  });

  // Update shipment status and fill in AWB/BOL if missing
  if (shipmentId) {
    const newStatus = normalizeStatus(overallStatus);
    const shipmentUpdate: Record<string, string> = { status: newStatus };
    if (data.awbNummer) {
      const current = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { awb: true, bol: true } });
      if (!current?.awb) shipmentUpdate.awb = data.awbNummer;
      if (!current?.bol && data.bolNummer) shipmentUpdate.bol = data.bolNummer;
    }
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: shipmentUpdate,
    });
    await prisma.statusHistory.create({
      data: {
        shipmentId,
        status: newStatus,
        source: "INSPECTIERAPPORT",
        details: `Inspection report ${data.rapportnummer}: ${overallStatus}`,
      },
    });
  }

  return { type: "INSPECTIE", aangiftenummer: data.aanvraagnummer || undefined, success: true };
}

async function processMonster(text: string): Promise<ParseResult> {
  const data = parseMonster(text);
  if (!data) return { type: "MONSTER", success: false, error: "Failed to parse sample report" };

  // Find linked shipment
  let shipmentId: string | null = null;
  if (data.aanvraagnummer) {
    const shipment = await prisma.shipment.findUnique({
      where: { aangiftenummer: data.aanvraagnummer },
    });
    shipmentId = shipment?.id || null;
  }

  await prisma.sampleReport.upsert({
    where: { dossiernummer: data.dossiernummer },
    create: {
      dossiernummer: data.dossiernummer,
      registratienummer: data.registratienummer,
      aanvraagnummer: data.aanvraagnummer,
      soortInspectie: data.soortInspectie,
      inspecteur: data.inspecteur,
      bedrijfsnaam: data.bedrijfsnaam,
      adres: data.adres,
      product: data.product,
      hoeveelheid: data.hoeveelheid,
      colli: data.colli,
      landVanOorsprong: data.landVanOorsprong,
      monsternummer: data.monsternummer,
      datumMonstername: data.datumMonstername,
      plaatsMonstername: data.plaatsMonstername,
      soortMonster: data.soortMonster,
      typeMonster: data.typeMonster,
      vermoedenOorzaak: data.vermoedenOorzaak,
      opmerking: data.opmerking,
      diagnose: data.diagnose,
      shipmentId,
    },
    update: {
      diagnose: data.diagnose,
      shipmentId,
    },
  });

  return { type: "MONSTER", aangiftenummer: data.aanvraagnummer || undefined, success: true };
}

async function processBlokkade(text: string): Promise<ParseResult> {
  const data = parseBlokkade(text);
  if (!data) return { type: "BLOKKADE", success: false, error: "Failed to parse blockade report" };

  // Find linked shipment
  let shipmentId: string | null = null;
  if (data.aangiftenummer) {
    const shipment = await prisma.shipment.findUnique({
      where: { aangiftenummer: data.aangiftenummer },
    });
    shipmentId = shipment?.id || null;

    // Update shipment status to GEBLOKKEERD
    if (shipmentId) {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: "GEBLOKKEERD" },
      });
      await prisma.statusHistory.create({
        data: {
          shipmentId,
          status: "GEBLOKKEERD",
          source: "BLOKKADERAPPORT",
          details: `Blockade: ${data.reden || "Unknown reason"}`,
        },
      });
    }
  }

  await prisma.blockadeReport.upsert({
    where: { dossiernummer: data.dossiernummer },
    create: {
      dossiernummer: data.dossiernummer,
      registratienummer: data.registratienummer,
      aangiftenummer: data.aangiftenummer,
      nummerFytoCertificaat: data.nummerFytoCertificaat,
      landVanAfgifte: data.landVanAfgifte,
      referentie: data.referentie,
      inspectiedatum: data.inspectiedatum,
      soortInspectie: data.soortInspectie,
      locatieNaam: data.locatieNaam,
      locatieAdres: data.locatieAdres,
      inspecteur: data.inspecteur,
      reden: data.reden,
      varieteit: data.varieteit,
      monsternummer: data.monsternummer,
      shipmentId,
    },
    update: {
      reden: data.reden,
      shipmentId,
    },
  });

  return { type: "BLOKKADE", aangiftenummer: data.aangiftenummer || undefined, success: true };
}
