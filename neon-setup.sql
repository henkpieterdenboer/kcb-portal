-- ============================================
-- KCB Inspection Dashboard - Database Setup
-- Run this in the Neon SQL Editor
-- ============================================

-- TABLES
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_ingestions" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "from_address" TEXT,
    "received_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachment_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "errors" TEXT,
    CONSTRAINT "email_ingestions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "aangiftenummer" TEXT NOT NULL,
    "aangever" TEXT,
    "relatienummer" TEXT,
    "relatienaam" TEXT,
    "referentie" TEXT,
    "exporteur" TEXT,
    "importeur" TEXT,
    "awb" TEXT,
    "bol" TEXT,
    "container_nrs" TEXT,
    "land_van_verzending" TEXT,
    "land_van_oorsprong" TEXT,
    "transport_naar_eu" TEXT,
    "transport_binnen_eu" TEXT,
    "inspectiedatum" TIMESTAMP(3),
    "inspectielocatie" TEXT,
    "verwachte_aankomst" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DOCUMENTCONTROLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_ingestion_id" TEXT,
    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sub_shipments" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "botanische_naam" TEXT NOT NULL,
    "land_van_oorsprong" TEXT,
    "aantal_colli" INTEGER,
    "soort_colli" TEXT,
    "aantal_stuks" INTEGER,
    "taric_code" TEXT,
    "bescheiden" TEXT,
    "monster_verplicht" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sub_shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inspection_reports" (
    "id" TEXT NOT NULL,
    "rapportnummer" TEXT NOT NULL,
    "registratienummer" TEXT,
    "rapport_datum" TIMESTAMP(3),
    "soort_inspectie" TEXT,
    "bezoeknummer" TEXT,
    "aanvraagnummer" TEXT,
    "aanvrager" TEXT,
    "aangever" TEXT,
    "afzender" TEXT,
    "awb_nummer" TEXT,
    "bol_nummer" TEXT,
    "land_van_vertrek" TEXT,
    "referentie" TEXT,
    "inspectiedatum" TIMESTAMP(3),
    "tijd_aanvang" TEXT,
    "tijd_einde" TEXT,
    "inspectie_minuten" INTEGER,
    "inspecteur" TEXT,
    "locatie_naam" TEXT,
    "locatie_adres" TEXT,
    "resultaten" TEXT,
    "shipment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inspection_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sample_reports" (
    "id" TEXT NOT NULL,
    "dossiernummer" TEXT NOT NULL,
    "registratienummer" TEXT,
    "aanvraagnummer" TEXT,
    "soort_inspectie" TEXT,
    "inspecteur" TEXT,
    "bedrijfsnaam" TEXT,
    "adres" TEXT,
    "product" TEXT,
    "hoeveelheid" TEXT,
    "colli" TEXT,
    "land_van_oorsprong" TEXT,
    "monsternummer" TEXT,
    "datum_monstername" TIMESTAMP(3),
    "plaats_monstername" TEXT,
    "soort_monster" TEXT,
    "type_monster" TEXT,
    "vermoeden_oorzaak" TEXT,
    "opmerking" TEXT,
    "diagnose" TEXT,
    "shipment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sample_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockade_reports" (
    "id" TEXT NOT NULL,
    "dossiernummer" TEXT NOT NULL,
    "registratienummer" TEXT,
    "aangiftenummer" TEXT,
    "nummer_fyto_certificaat" TEXT,
    "land_van_afgifte" TEXT,
    "referentie" TEXT,
    "inspectiedatum" TIMESTAMP(3),
    "soort_inspectie" TEXT,
    "locatie_naam" TEXT,
    "locatie_adres" TEXT,
    "inspecteur" TEXT,
    "reden" TEXT,
    "varieteit" TEXT,
    "monsternummer" TEXT,
    "afhandeling" TEXT,
    "shipment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blockade_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- UNIQUE INDEXES
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "shipments_aangiftenummer_key" ON "shipments"("aangiftenummer");
CREATE UNIQUE INDEX "inspection_reports_rapportnummer_key" ON "inspection_reports"("rapportnummer");
CREATE UNIQUE INDEX "sample_reports_dossiernummer_key" ON "sample_reports"("dossiernummer");
CREATE UNIQUE INDEX "blockade_reports_dossiernummer_key" ON "blockade_reports"("dossiernummer");

-- FOREIGN KEYS
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_email_ingestion_id_fkey" FOREIGN KEY ("email_ingestion_id") REFERENCES "email_ingestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sub_shipments" ADD CONSTRAINT "sub_shipments_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sample_reports" ADD CONSTRAINT "sample_reports_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blockade_reports" ADD CONSTRAINT "blockade_reports_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SEED: Admin user (password: admin123, bcrypt hash)
INSERT INTO "users" ("id", "email", "name", "password", "role", "created_at", "updated_at")
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@coloriginz.nl',
    'Admin',
    '$2b$12$EOdXs7HhC9cGSR0vCOVP6ejpzE.k4jLDinnmN526tVx33/LDpx34e',
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
