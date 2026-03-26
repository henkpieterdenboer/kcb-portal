import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { detectDocumentType } from "../src/lib/parser/detect";
import { parseMededeling } from "../src/lib/parser/mededeling";
import { parseInspectie } from "../src/lib/parser/inspectie";
import { parseMonster } from "../src/lib/parser/monster";
import { parseBlokkade } from "../src/lib/parser/blokkade";
import { normalizeStatus } from "../src/types";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("KcbInspect!2026", 12);
  await prisma.user.upsert({
    where: { email: "admin@coloriginz.nl" },
    update: { password: hashedPassword },
    create: {
      email: "admin@coloriginz.nl",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user: admin@coloriginz.nl / KcbInspect!2026");

  // Parse all PDFs from input/
  const inputDir = path.join(process.cwd(), "input");
  const files = fs.readdirSync(inputDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`Found ${files.length} PDF files`);

  // First pass: process Mededelingen to create shipments
  const mededelingFiles = files.filter((f) => f.startsWith("Mededeling"));
  console.log(`Processing ${mededelingFiles.length} Mededeling PDFs...`);

  for (const file of mededelingFiles) {
    try {
      const buffer = fs.readFileSync(path.join(inputDir, file));
      const data = await pdfParse(buffer);
      const text = data.text;
      const docType = detectDocumentType(text);

      if (docType !== "MEDEDELING") continue;

      const mededeling = parseMededeling(text);
      if (!mededeling) {
        console.log(`  Skip ${file}: could not parse`);
        continue;
      }

      const shipment = await prisma.shipment.upsert({
        where: { aangiftenummer: mededeling.aangiftenummer },
        create: {
          aangiftenummer: mededeling.aangiftenummer,
          aangever: mededeling.aangever,
          relatienummer: mededeling.relatienummer,
          relatienaam: mededeling.relatienaam,
          referentie: mededeling.referentie,
          exporteur: mededeling.exporteur,
          importeur: mededeling.importeur,
          awb: mededeling.awb,
          bol: mededeling.bol,
          containerNrs: mededeling.containerNrs,
          landVanVerzending: mededeling.landVanVerzending,
          landVanOorsprong: mededeling.landVanOorsprong,
          transportNaarEU: mededeling.transportNaarEU,
          transportBinnenEU: mededeling.transportBinnenEU,
          inspectiedatum: mededeling.inspectiedatum,
          inspectielocatie: mededeling.inspectielocatie,
          verwachteAankomst: mededeling.verwachteAankomst,
          status: mededeling.status,
        },
        update: {
          status: mededeling.status,
          inspectiedatum: mededeling.inspectiedatum,
          verwachteAankomst: mededeling.verwachteAankomst,
        },
      });

      // Create status history
      await prisma.statusHistory.create({
        data: {
          shipmentId: shipment.id,
          status: mededeling.status,
          source: "MEDEDELING",
          details: `Seeded from ${file}`,
        },
      });

      // Upsert sub-shipments
      if (mededeling.subShipments.length > 0) {
        // Only set sub-shipments if none exist yet (avoid overwriting)
        const existing = await prisma.subShipment.count({ where: { shipmentId: shipment.id } });
        if (existing === 0) {
          await prisma.subShipment.createMany({
            data: mededeling.subShipments.map((sub) => ({
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
      }

      console.log(`  ${file}: ${mededeling.aangiftenummer} -> ${mededeling.status}`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  // Second pass: process Inspection reports
  const inspectieFiles = files.filter((f) => f.startsWith("Inspectierapport"));
  console.log(`Processing ${inspectieFiles.length} Inspection report PDFs...`);

  for (const file of inspectieFiles) {
    try {
      const buffer = fs.readFileSync(path.join(inputDir, file));
      const data = await pdfParse(buffer);
      const inspectie = parseInspectie(data.text);

      if (!inspectie) {
        console.log(`  Skip ${file}: could not parse`);
        continue;
      }

      // Find linked shipment
      let shipmentId: string | null = null;
      if (inspectie.aanvraagnummer) {
        const shipment = await prisma.shipment.findUnique({
          where: { aangiftenummer: inspectie.aanvraagnummer },
        });
        shipmentId = shipment?.id || null;
      }

      const resultatenJson = JSON.stringify(inspectie.resultaten);

      await prisma.inspectionReport.upsert({
        where: { rapportnummer: inspectie.rapportnummer },
        create: {
          rapportnummer: inspectie.rapportnummer,
          registratienummer: inspectie.registratienummer,
          rapportdatum: inspectie.rapportdatum,
          soortInspectie: inspectie.soortInspectie,
          bezoeknummer: inspectie.bezoeknummer,
          aanvraagnummer: inspectie.aanvraagnummer,
          aanvrager: inspectie.aanvrager,
          aangever: inspectie.aangever,
          afzender: inspectie.afzender,
          awbNummer: inspectie.awbNummer,
          bolNummer: inspectie.bolNummer,
          landVanVertrek: inspectie.landVanVertrek,
          referentie: inspectie.referentie,
          inspectiedatum: inspectie.inspectiedatum,
          tijdAanvang: inspectie.tijdAanvang,
          tijdEinde: inspectie.tijdEinde,
          inspectieMinuten: inspectie.inspectieMinuten,
          inspecteur: inspectie.inspecteur,
          locatieNaam: inspectie.locatieNaam,
          locatieAdres: inspectie.locatieAdres,
          resultaten: resultatenJson,
          shipmentId,
        },
        update: {
          resultaten: resultatenJson,
          shipmentId,
        },
      });

      // Update shipment status from inspection result
      if (shipmentId && inspectie.resultaten.length > 0) {
        let overallStatus = "Goedgekeurd";
        for (const r of inspectie.resultaten) {
          if (r.status === "Wacht op vervolg") {
            overallStatus = "Wacht op vervolg";
            break;
          }
        }
        const newStatus = normalizeStatus(overallStatus);
        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { status: newStatus },
        });
        await prisma.statusHistory.create({
          data: {
            shipmentId,
            status: newStatus,
            source: "INSPECTIERAPPORT",
            details: `Inspection ${inspectie.rapportnummer}: ${overallStatus}`,
          },
        });
      }

      console.log(`  ${file}: ${inspectie.rapportnummer} -> ${inspectie.aanvraagnummer || "no shipment"}`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  // Third pass: process Sample reports
  const monsterFiles = files.filter((f) => f.startsWith("Monsterrapport"));
  console.log(`Processing ${monsterFiles.length} Sample report PDFs...`);

  for (const file of monsterFiles) {
    try {
      const buffer = fs.readFileSync(path.join(inputDir, file));
      const data = await pdfParse(buffer);
      const monster = parseMonster(data.text);

      if (!monster) {
        console.log(`  Skip ${file}: could not parse`);
        continue;
      }

      let shipmentId: string | null = null;
      if (monster.aanvraagnummer) {
        const shipment = await prisma.shipment.findUnique({
          where: { aangiftenummer: monster.aanvraagnummer },
        });
        shipmentId = shipment?.id || null;
      }

      await prisma.sampleReport.upsert({
        where: { dossiernummer: monster.dossiernummer },
        create: {
          dossiernummer: monster.dossiernummer,
          registratienummer: monster.registratienummer,
          aanvraagnummer: monster.aanvraagnummer,
          soortInspectie: monster.soortInspectie,
          inspecteur: monster.inspecteur,
          bedrijfsnaam: monster.bedrijfsnaam,
          adres: monster.adres,
          product: monster.product,
          hoeveelheid: monster.hoeveelheid,
          colli: monster.colli,
          landVanOorsprong: monster.landVanOorsprong,
          monsternummer: monster.monsternummer,
          datumMonstername: monster.datumMonstername,
          plaatsMonstername: monster.plaatsMonstername,
          soortMonster: monster.soortMonster,
          typeMonster: monster.typeMonster,
          vermoedenOorzaak: monster.vermoedenOorzaak,
          opmerking: monster.opmerking,
          diagnose: monster.diagnose,
          shipmentId,
        },
        update: { shipmentId },
      });

      console.log(`  ${file}: ${monster.dossiernummer}`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  // Fourth pass: process Blockade reports
  const blokkadeFiles = files.filter((f) => f.startsWith("Blokkaderapport"));
  console.log(`Processing ${blokkadeFiles.length} Blockade report PDFs...`);

  for (const file of blokkadeFiles) {
    try {
      const buffer = fs.readFileSync(path.join(inputDir, file));
      const data = await pdfParse(buffer);
      const blokkade = parseBlokkade(data.text);

      if (!blokkade) {
        console.log(`  Skip ${file}: could not parse`);
        continue;
      }

      let shipmentId: string | null = null;
      if (blokkade.aangiftenummer) {
        const shipment = await prisma.shipment.findUnique({
          where: { aangiftenummer: blokkade.aangiftenummer },
        });
        shipmentId = shipment?.id || null;

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
              details: `Blockade: ${blokkade.reden || "Unknown"}`,
            },
          });
        }
      }

      await prisma.blockadeReport.upsert({
        where: { dossiernummer: blokkade.dossiernummer },
        create: {
          dossiernummer: blokkade.dossiernummer,
          registratienummer: blokkade.registratienummer,
          aangiftenummer: blokkade.aangiftenummer,
          nummerFytoCertificaat: blokkade.nummerFytoCertificaat,
          landVanAfgifte: blokkade.landVanAfgifte,
          referentie: blokkade.referentie,
          inspectiedatum: blokkade.inspectiedatum,
          soortInspectie: blokkade.soortInspectie,
          locatieNaam: blokkade.locatieNaam,
          locatieAdres: blokkade.locatieAdres,
          inspecteur: blokkade.inspecteur,
          reden: blokkade.reden,
          varieteit: blokkade.varieteit,
          monsternummer: blokkade.monsternummer,
          shipmentId,
        },
        update: { shipmentId },
      });

      console.log(`  ${file}: ${blokkade.dossiernummer}`);
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
