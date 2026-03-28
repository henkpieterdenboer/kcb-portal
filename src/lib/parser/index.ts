import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Prisma } from "@prisma/client";
import { detectDocumentType } from "./detect";
import { parseMededeling } from "./mededeling";
import { parseInspectie } from "./inspectie";
import { parseMonster } from "./monster";
import { parseBlokkade } from "./blokkade";
import { prisma } from "../db";
import { normalizeStatus } from "@/types";

/**
 * Wrapper around prisma.shipment.upsert that retries on unique constraint
 * race conditions (P2002). When two concurrent requests both try to create
 * the same shipment, one will fail — retry converts the create to an update.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function shipmentUpsert(args: Prisma.ShipmentUpsertArgs): Promise<any> {
  try {
    return await prisma.shipment.upsert(args as any);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return await prisma.shipment.upsert(args as any);
    }
    throw err;
  }
}

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
      return processInspectie(text, emailIngestionId);
    case "MONSTER":
      return processMonster(text, emailIngestionId);
    case "BLOKKADE":
      return processBlokkade(text, emailIngestionId);
    default:
      return { type: "UNKNOWN", success: false, error: "Unknown document type" };
  }
}

async function processMededeling(text: string, emailIngestionId?: string): Promise<ParseResult> {
  const data = parseMededeling(text);
  if (!data) return { type: "MEDEDELING", success: false, error: "Failed to parse mededeling" };

  const emailConnect = emailIngestionId
    ? { emailIngestions: { connect: { id: emailIngestionId } } }
    : {};

  const shipment = await shipmentUpsert({
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
      ...emailConnect,
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
      ...emailConnect,
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

async function processInspectie(text: string, emailIngestionId?: string): Promise<ParseResult> {
  // Temporary debug: log first 1000 chars to find AWB label format
  console.log("[DEBUG INSPECTIE TEXT]", text.substring(0, 1000));

  const data = parseInspectie(text);
  if (!data) return { type: "INSPECTIE", success: false, error: "Failed to parse inspection report" };

  // Find or create linked shipment by aanvraagnummer (= aangiftenummer)
  let shipmentId: string | null = null;
  if (data.aanvraagnummer) {
    const emailConnect = emailIngestionId
      ? { emailIngestions: { connect: { id: emailIngestionId } } }
      : {};

    const shipment = await shipmentUpsert({
      where: { aangiftenummer: data.aanvraagnummer },
      create: {
        aangiftenummer: data.aanvraagnummer,
        aangever: data.aangever,
        referentie: data.referentie,
        awb: data.awbNummer,
        landVanOorsprong: data.landVanVertrek,
        inspectiedatum: data.inspectiedatum,
        inspectielocatie: data.locatieNaam,
        status: "DOCUMENTCONTROLE",
        ...emailConnect,
      },
      update: {},
    });
    shipmentId = shipment.id;
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
    const shipmentUpdateData: Record<string, unknown> = { status: newStatus };
    if (data.awbNummer) {
      const current = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { awb: true, bol: true } });
      if (!current?.awb) shipmentUpdateData.awb = data.awbNummer;
      if (!current?.bol && data.bolNummer) shipmentUpdateData.bol = data.bolNummer;
    }
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: shipmentUpdateData,
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

async function processMonster(text: string, emailIngestionId?: string): Promise<ParseResult> {
  const data = parseMonster(text);
  if (!data) return { type: "MONSTER", success: false, error: "Failed to parse sample report" };

  // Find or create linked shipment
  let shipmentId: string | null = null;
  if (data.aanvraagnummer) {
    const emailConnect = emailIngestionId
      ? { emailIngestions: { connect: { id: emailIngestionId } } }
      : {};

    const shipment = await shipmentUpsert({
      where: { aangiftenummer: data.aanvraagnummer },
      create: {
        aangiftenummer: data.aanvraagnummer,
        landVanOorsprong: data.landVanOorsprong,
        status: "DOCUMENTCONTROLE",
        ...emailConnect,
      },
      update: emailConnect,
    });
    shipmentId = shipment.id;
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

async function processBlokkade(text: string, emailIngestionId?: string): Promise<ParseResult> {
  const data = parseBlokkade(text);
  if (!data) return { type: "BLOKKADE", success: false, error: "Failed to parse blockade report" };

  // Find or create linked shipment
  let shipmentId: string | null = null;
  if (data.aangiftenummer) {
    const emailConnect = emailIngestionId
      ? { emailIngestions: { connect: { id: emailIngestionId } } }
      : {};

    const shipment = await shipmentUpsert({
      where: { aangiftenummer: data.aangiftenummer },
      create: {
        aangiftenummer: data.aangiftenummer,
        referentie: data.referentie,
        inspectiedatum: data.inspectiedatum,
        inspectielocatie: data.locatieNaam,
        landVanOorsprong: data.landVanAfgifte,
        status: "GEBLOKKEERD",
        ...emailConnect,
      },
      update: {
        status: "GEBLOKKEERD",
        ...emailConnect,
      },
    });
    shipmentId = shipment.id;

    await prisma.statusHistory.create({
      data: {
        shipmentId: shipment.id,
        status: "GEBLOKKEERD",
        source: "BLOKKADERAPPORT",
        details: `Blockade: ${data.reden || "Unknown reason"}`,
      },
    });
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

/**
 * Parse structured fields from email body text and update the linked shipment.
 * KCB planning/notification emails contain fields like Aangiftenummer, Awb, etc.
 * in the email body rather than in PDF attachments.
 */
export async function parseEmailBody(
  emailBody: string,
  emailIngestionId: string
): Promise<ParseResult | null> {
  // Extract aangiftenummer from email body
  const aanMatch = emailBody.match(/Aangiftenummer\s*:\s*(.+?)(?:\r?\n|$)/i);
  if (!aanMatch) return null;

  const aangiftenummer = aanMatch[1].trim();

  // Extract fields from body
  function extractBodyField(label: string): string | null {
    const regex = new RegExp(`${label}\\s*:\\s*(.+?)(?:\\r?\\n|$)`, "i");
    const m = emailBody.match(regex);
    return m ? m[1].trim() || null : null;
  }

  const awb = extractBodyField("Awb");
  const bol = extractBodyField("Bol");
  const exporteur = extractBodyField("Exporteur");
  const importeur = extractBodyField("Importeur");
  const aangever = extractBodyField("Aangever");
  const referentie = extractBodyField("Referentie");

  const emailConnect = { emailIngestions: { connect: { id: emailIngestionId } } };

  // Upsert: create shipment if it doesn't exist yet (planning email before mededeling)
  const shipment = await shipmentUpsert({
    where: { aangiftenummer },
    create: {
      aangiftenummer,
      aangever: aangever || undefined,
      referentie: referentie || undefined,
      awb: awb || undefined,
      bol: bol || undefined,
      exporteur: exporteur || undefined,
      importeur: importeur || undefined,
      status: "AANGEMELD",
      ...emailConnect,
    },
    update: {
      ...emailConnect,
    },
    select: { id: true, awb: true, bol: true, exporteur: true, importeur: true },
  });

  // Back-fill missing fields on existing shipments
  const backfill: Record<string, string> = {};
  if (awb && !shipment.awb) backfill.awb = awb;
  if (bol && !shipment.bol) backfill.bol = bol;
  if (exporteur && !shipment.exporteur) backfill.exporteur = exporteur;
  if (importeur && !shipment.importeur) backfill.importeur = importeur;

  if (Object.keys(backfill).length > 0) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: backfill,
    });
  }

  return { type: "EMAIL_BODY", aangiftenummer, success: true };
}
