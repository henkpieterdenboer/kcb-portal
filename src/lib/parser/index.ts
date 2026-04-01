import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Prisma } from "@prisma/client";
import { detectDocumentType } from "./detect";
import { parseMededeling } from "./mededeling";
import { parseInspectie } from "./inspectie";
import { parseMonster } from "./monster";
import { parseBlokkade } from "./blokkade";
import { prisma } from "../db";
import { normalizeStatus, statusLevel } from "@/types";

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

/**
 * Get the receivedAt timestamp from an email ingestion to use as status history timestamp.
 * Falls back to now() if not available.
 */
async function getEmailTimestamp(emailIngestionId?: string): Promise<Date> {
  if (emailIngestionId) {
    const email = await prisma.emailIngestion.findUnique({
      where: { id: emailIngestionId },
      select: { receivedAt: true },
    });
    if (email?.receivedAt) return email.receivedAt;
  }
  return new Date();
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

  // Upsert without status in update — we handle status separately to prevent regressions
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
      // status intentionally omitted — handled below to prevent regressions
      ...emailConnect,
    },
    select: { id: true, status: true },
  });

  // Only advance status, never regress (e.g. GOEDGEKEURD must not go back to AANGEMELD)
  const statusAdvanced = statusLevel(data.status) >= statusLevel(shipment.status) && shipment.status !== data.status;
  if (statusAdvanced) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: data.status },
    });
  }

  // Always record a status history entry for each mededeling email.
  // On reprocess: replace old entry for this email to reflect latest parse result.
  // Without emailIngestionId: fall back to status-based dedup (legacy/manual).
  if (emailIngestionId) {
    await prisma.statusHistory.deleteMany({
      where: { shipmentId: shipment.id, emailIngestionId },
    });
    const timestamp = await getEmailTimestamp(emailIngestionId);
    await prisma.statusHistory.create({
      data: {
        shipmentId: shipment.id,
        status: data.status,
        source: "MEDEDELING",
        details: `Status update from Mededeling PDF`,
        emailIngestionId,
        timestamp,
      },
    });
  } else if (statusAdvanced) {
    const lastHistory = await prisma.statusHistory.findFirst({
      where: { shipmentId: shipment.id },
      orderBy: { timestamp: "desc" },
      select: { status: true },
    });
    if (!lastHistory || lastHistory.status !== data.status) {
      await prisma.statusHistory.create({
        data: {
          shipmentId: shipment.id,
          status: data.status,
          source: "MEDEDELING",
          details: `Status update from Mededeling PDF`,
          timestamp: new Date(),
        },
      });
    }
  }

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
      update: emailConnect,
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

  // Update shipment status (only advance, never regress) and fill in AWB/BOL if missing
  if (shipmentId) {
    const newStatus = normalizeStatus(overallStatus);
    const current = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { awb: true, bol: true, status: true } });
    const shipmentUpdateData: Record<string, unknown> = {};

    // Only advance status, never regress
    const shouldAdvance = current && statusLevel(newStatus) >= statusLevel(current.status) && current.status !== newStatus;
    if (shouldAdvance) {
      shipmentUpdateData.status = newStatus;
    }

    if (data.awbNummer && !current?.awb) shipmentUpdateData.awb = data.awbNummer;
    if (data.bolNummer && !current?.bol) shipmentUpdateData.bol = data.bolNummer;

    if (Object.keys(shipmentUpdateData).length > 0) {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: shipmentUpdateData,
      });
    }

    // Always record status history for inspectie emails (definitive result).
    // On reprocess: replace old entry for this email.
    if (emailIngestionId) {
      await prisma.statusHistory.deleteMany({
        where: { shipmentId, emailIngestionId },
      });
      const timestamp = await getEmailTimestamp(emailIngestionId);
      await prisma.statusHistory.create({
        data: {
          shipmentId,
          status: newStatus,
          source: "INSPECTIERAPPORT",
          details: `Inspection report ${data.rapportnummer}: ${overallStatus}`,
          emailIngestionId,
          timestamp,
        },
      });
    } else if (shouldAdvance) {
      const lastHistory = await prisma.statusHistory.findFirst({
        where: { shipmentId },
        orderBy: { timestamp: "desc" },
        select: { status: true },
      });
      if (!lastHistory || lastHistory.status !== newStatus) {
        await prisma.statusHistory.create({
          data: {
            shipmentId,
            status: newStatus,
            source: "INSPECTIERAPPORT",
            details: `Inspection report ${data.rapportnummer}: ${overallStatus}`,
            timestamp: new Date(),
          },
        });
      }
    }
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

    // Always record status history for blokkade emails (definitive action).
    // On reprocess: replace old entry for this email.
    if (emailIngestionId) {
      await prisma.statusHistory.deleteMany({
        where: { shipmentId: shipment.id, emailIngestionId },
      });
      const timestamp = await getEmailTimestamp(emailIngestionId);
      await prisma.statusHistory.create({
        data: {
          shipmentId: shipment.id,
          status: "GEBLOKKEERD",
          source: "BLOKKADERAPPORT",
          details: `Blockade: ${data.reden || "Unknown reason"}`,
          emailIngestionId,
          timestamp,
        },
      });
    } else {
      const lastHistory = await prisma.statusHistory.findFirst({
        where: { shipmentId: shipment.id },
        orderBy: { timestamp: "desc" },
        select: { status: true },
      });
      if (!lastHistory || lastHistory.status !== "GEBLOKKEERD") {
        await prisma.statusHistory.create({
          data: {
            shipmentId: shipment.id,
            status: "GEBLOKKEERD",
            source: "BLOKKADERAPPORT",
            details: `Blockade: ${data.reden || "Unknown reason"}`,
            timestamp: new Date(),
          },
        });
      }
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

/**
 * Strip HTML tags and decode common entities to get plain text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

/**
 * Parse structured fields from email body text and update the linked shipment.
 * KCB planning/notification emails contain fields like Aangiftenummer, Awb, etc.
 * in the email body rather than in PDF attachments.
 * Accepts both plain text and HTML; HTML tags are stripped before extraction.
 */
export async function parseEmailBody(
  emailBody: string,
  emailIngestionId: string
): Promise<ParseResult | null> {
  // Strip HTML if the body contains HTML tags
  const text = emailBody.includes("<") ? stripHtml(emailBody) : emailBody;

  // Extract aangiftenummer from email body (use [ \t]* to avoid matching across lines)
  const aanMatch = text.match(/Aangiftenummer[ \t]*:[ \t]*(.+?)(?:\r?\n|$)/i);
  if (!aanMatch) return null;

  const aangiftenummer = aanMatch[1].trim();

  // Validate format: must start with NL followed by digits (reject English label text)
  if (!/^NL\d/i.test(aangiftenummer)) return null;

  // Extract fields from body
  function extractBodyField(label: string): string | null {
    const regex = new RegExp(`${label}[ \\t]*:[ \\t]*(.+?)(?:\\r?\\n|$)`, "i");
    const m = text.match(regex);
    return m ? m[1].trim() || null : null;
  }

  const awb = extractBodyField("Awb");
  const bol = extractBodyField("Bol");
  const exporteur = extractBodyField("Exporteur");
  const importeur = extractBodyField("Importeur");
  const aangever = extractBodyField("Aangever");
  const referentie = extractBodyField("Referentie");
  const landVanVerzending = extractBodyField("Land van verzending");
  const landVanOorsprong = extractBodyField("Land van oorsprong");
  const transportNaarEU = extractBodyField("Vluchtnummer/Bootnaam");

  // Parse inspection date: prefer confirmed time from subject, fall back to requested time from body.
  // Subject format: "Planning: ...ingepland op: '02-04-2026 08:01'"
  let inspectiedatum: Date | null = null;
  const emailRecord = await prisma.emailIngestion.findUnique({
    where: { id: emailIngestionId },
    select: { subject: true },
  });
  const subjectMatch = emailRecord?.subject?.match(/ingepland op:?\s*(?:&apos;|[''])?(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/i);
  if (subjectMatch) {
    // Confirmed time from subject
    inspectiedatum = new Date(Date.UTC(
      parseInt(subjectMatch[3]),
      parseInt(subjectMatch[2]) - 1,
      parseInt(subjectMatch[1]),
      parseInt(subjectMatch[4]),
      parseInt(subjectMatch[5])
    ));
  } else {
    // Fall back to requested time from body
    const inspDateRaw = extractBodyField("Aangevraagde inspectiedatum");
    if (inspDateRaw && /^\d{8}$/.test(inspDateRaw)) {
      const y = parseInt(inspDateRaw.substring(0, 4));
      const m = parseInt(inspDateRaw.substring(4, 6)) - 1;
      const d = parseInt(inspDateRaw.substring(6, 8));
      const timeRaw = extractBodyField("Aangevraagde tijd");
      let h = 0, min = 0;
      if (timeRaw && /^\d{4}$/.test(timeRaw)) {
        h = parseInt(timeRaw.substring(0, 2));
        min = parseInt(timeRaw.substring(2, 4));
      }
      inspectiedatum = new Date(Date.UTC(y, m, d, h, min));
    }
  }

  // Detect status from email body keywords
  let emailStatus: import("@/types").ShipmentStatus = "AANGEMELD";
  let statusDetail = "Planning email received";
  if (/ingepland/i.test(text)) {
    emailStatus = "INSPECTIE_GEPLAND";
    statusDetail = "Inspection scheduled via planning email";
  }

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
      landVanVerzending: landVanVerzending || undefined,
      landVanOorsprong: landVanOorsprong || undefined,
      transportNaarEU: transportNaarEU || undefined,
      inspectiedatum: inspectiedatum || undefined,
      status: emailStatus,
      ...emailConnect,
    },
    update: {
      ...emailConnect,
    },
    select: { id: true, status: true, awb: true, bol: true, exporteur: true, importeur: true,
              landVanVerzending: true, landVanOorsprong: true, transportNaarEU: true,
              inspectiedatum: true },
  });

  // Back-fill missing fields on existing shipments
  const backfill: Record<string, unknown> = {};
  if (awb && !shipment.awb) backfill.awb = awb;
  if (bol && !shipment.bol) backfill.bol = bol;
  if (exporteur && !shipment.exporteur) backfill.exporteur = exporteur;
  if (importeur && !shipment.importeur) backfill.importeur = importeur;
  if (landVanVerzending && !shipment.landVanVerzending) backfill.landVanVerzending = landVanVerzending;
  if (landVanOorsprong && !shipment.landVanOorsprong) backfill.landVanOorsprong = landVanOorsprong;
  if (transportNaarEU && !shipment.transportNaarEU) backfill.transportNaarEU = transportNaarEU;
  // Planning email with confirmed time always overwrites (confirmed > requested)
  if (inspectiedatum && subjectMatch) {
    backfill.inspectiedatum = inspectiedatum;
  } else if (inspectiedatum && !shipment.inspectiedatum) {
    backfill.inspectiedatum = inspectiedatum;
  }

  // Only advance status, never regress
  const shouldAdvance = statusLevel(emailStatus) >= statusLevel(shipment.status) && shipment.status !== emailStatus;
  if (shouldAdvance) backfill.status = emailStatus;

  if (Object.keys(backfill).length > 0) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: backfill,
    });
  }

  // Always record status history entry (dedup on emailIngestionId)
  await prisma.statusHistory.deleteMany({
    where: { shipmentId: shipment.id, emailIngestionId },
  });
  const timestamp = await getEmailTimestamp(emailIngestionId);
  await prisma.statusHistory.create({
    data: {
      shipmentId: shipment.id,
      status: emailStatus,
      source: "PLANNING_EMAIL",
      details: statusDetail,
      emailIngestionId,
      timestamp,
    },
  });

  return { type: "EMAIL_BODY", aangiftenummer, success: true };
}
