-- ============================================
-- KCB Enriched Status History
-- Run this AFTER neon-setup.sql + neon-seed-data.sql
-- Adds realistic process flow to all shipments
-- ============================================

-- First, delete existing status history (we'll recreate it with full flow)
DELETE FROM "status_history";

-- ============================================
-- SHIPMENT FLOW:
-- 1. AANGEMELD           - Email notification received
-- 2. INSPECTIE_AANGEVRAAGD - Handler proposes inspection time
-- 3. INSPECTIE_GEPLAND   - KCB confirms date/time
-- 4. DOCUMENTCONTROLE    - Document check starts
-- 5. DOCUMENTCONTROLE_AFGEROND - Documents approved
-- 6. FYSIEKE_INSPECTIE   - Physical inspection
-- 7. GOEDGEKEURD / WACHT_OP_VERVOLG / GEBLOKKEERD
-- ============================================

-- ============================================
-- GROUP A: Fully completed - GOEDGEKEURD (3 shipments)
-- These have gone through the entire flow
-- ============================================

-- A1: 03823b87 - Ecuador Trachelium (IP Handlers) → GOEDGEKEURD
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171103712', '2026-03-17 08:15:00'),
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 19-03 10:00 at Rietwijkeroordweg', '2026-03-17 09:30:00'),
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 19-03-2026 10:10 - Inspector R. Kamphuis', '2026-03-17 14:22:00'),
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-18 07:00:00'),
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved - cleared for physical inspection', '2026-03-18 16:30:00'),
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'FYSIEKE_INSPECTIE', 'MEDEDELING', 'Physical inspection in progress', '2026-03-19 10:10:00'),
  (gen_random_uuid(), '03823b87-6aa4-462b-b79a-c6b4b50399bd', 'GOEDGEKEURD', 'INSPECTIERAPPORT', 'Inspection E0109189 - Trachelium: Approved', '2026-03-19 11:30:00');
UPDATE "shipments" SET "status" = 'GOEDGEKEURD', "updated_at" = '2026-03-19 11:30:00' WHERE "id" = '03823b87-6aa4-462b-b79a-c6b4b50399bd';

-- A2: 1121944c - Kenia Rosa (Parfum Flower / Tambuzi) → GOEDGEKEURD
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01510467', '2026-03-17 06:45:00'),
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 19-03 07:00 at Rietwijkeroordweg', '2026-03-17 07:15:00'),
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 19-03-2026 06:59 - Inspector S. Rusman', '2026-03-17 11:00:00'),
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-18 06:00:00'),
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved', '2026-03-18 14:00:00'),
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'FYSIEKE_INSPECTIE', 'MEDEDELING', 'Physical inspection in progress', '2026-03-19 07:59:00'),
  (gen_random_uuid(), '1121944c-1f63-409a-bb8c-befec0a4db16', 'GOEDGEKEURD', 'INSPECTIERAPPORT', 'Inspection E0108855 - Rosa: Approved', '2026-03-19 09:24:00');
UPDATE "shipments" SET "status" = 'GOEDGEKEURD', "updated_at" = '2026-03-19 09:24:00' WHERE "id" = '1121944c-1f63-409a-bb8c-befec0a4db16';

-- A3: 5a499ca2 - Zimbabwe Aster (Zimflex/Airflo) → GOEDGEKEURD
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01511069', '2026-03-17 06:45:00'),
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 19-03 07:00 at Rietwijkeroordweg', '2026-03-17 07:15:00'),
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 19-03-2026 06:59 - Inspector S. Rusman', '2026-03-17 11:00:00'),
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-18 06:30:00'),
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved', '2026-03-18 15:00:00'),
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'FYSIEKE_INSPECTIE', 'MEDEDELING', 'Physical inspection in progress', '2026-03-19 07:59:00'),
  (gen_random_uuid(), '5a499ca2-3e26-47d5-ae8c-349e44fccf4e', 'GOEDGEKEURD', 'INSPECTIERAPPORT', 'Inspection E0108853 - Aster: Approved', '2026-03-19 09:24:00');
UPDATE "shipments" SET "status" = 'GOEDGEKEURD', "updated_at" = '2026-03-19 09:24:00' WHERE "id" = '5a499ca2-3e26-47d5-ae8c-349e44fccf4e';

-- ============================================
-- GROUP B: GEBLOKKEERD (1 shipment - full flow including block)
-- ============================================

-- B1: 1b370cd9 - Zimbabwe Solidago (Zimflex) → GEBLOKKEERD (white fly suspicion)
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01511069', '2026-03-17 06:45:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 19-03 06:00 at Rietwijkeroordweg', '2026-03-17 07:20:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 19-03-2026 06:00 - Inspector S. Rusman', '2026-03-17 11:05:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-18 06:30:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved', '2026-03-18 14:30:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'FYSIEKE_INSPECTIE', 'MEDEDELING', 'Physical inspection in progress', '2026-03-19 07:59:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'WACHT_OP_VERVOLG', 'INSPECTIERAPPORT', 'Inspection E0108854 - Solidago: Awaiting follow-up (suspected Q-organism)', '2026-03-19 09:24:00'),
  (gen_random_uuid(), '1b370cd9-5f5a-427a-ab18-940fbde8d581', 'GEBLOKKEERD', 'BLOKKADERAPPORT', 'Blockade BI/20271474/02: White fly (Aleyrodidae) suspected Q-organism. Sample 72622968 sent for analysis.', '2026-03-19 10:15:00');
UPDATE "shipments" SET "status" = 'GEBLOKKEERD', "updated_at" = '2026-03-19 10:15:00' WHERE "id" = '1b370cd9-5f5a-427a-ab18-940fbde8d581';

-- ============================================
-- GROUP C: In FYSIEKE_INSPECTIE (2 shipments - awaiting inspection result)
-- ============================================

-- C1: a7f2d074 - Kenia Aster/Snijbloemen (Africalla) → FYSIEKE_INSPECTIE
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), 'a7f2d074-fb13-454a-b157-984dd460d831', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01510115', '2026-03-18 16:00:00'),
  (gen_random_uuid(), 'a7f2d074-fb13-454a-b157-984dd460d831', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 20-03 06:00 at Rietwijkeroordweg', '2026-03-18 16:45:00'),
  (gen_random_uuid(), 'a7f2d074-fb13-454a-b157-984dd460d831', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 20-03-2026 06:00', '2026-03-19 08:30:00'),
  (gen_random_uuid(), 'a7f2d074-fb13-454a-b157-984dd460d831', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-19 14:00:00'),
  (gen_random_uuid(), 'a7f2d074-fb13-454a-b157-984dd460d831', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved', '2026-03-20 05:30:00'),
  (gen_random_uuid(), 'a7f2d074-fb13-454a-b157-984dd460d831', 'FYSIEKE_INSPECTIE', 'MEDEDELING', 'Physical inspection in progress', '2026-03-20 06:00:00');
UPDATE "shipments" SET "status" = 'FYSIEKE_INSPECTIE', "updated_at" = '2026-03-20 06:00:00' WHERE "id" = 'a7f2d074-fb13-454a-b157-984dd460d831';

-- C2: 0304304e - Ecuador Trachelium (IP Handlers) → FYSIEKE_INSPECTIE
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '0304304e-b90d-4729-9b92-a394ddd4874a', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171104037', '2026-03-18 14:00:00'),
  (gen_random_uuid(), '0304304e-b90d-4729-9b92-a394ddd4874a', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 20-03 06:00 at Rietwijkeroordweg', '2026-03-18 14:30:00'),
  (gen_random_uuid(), '0304304e-b90d-4729-9b92-a394ddd4874a', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 20-03-2026 06:00', '2026-03-19 09:00:00'),
  (gen_random_uuid(), '0304304e-b90d-4729-9b92-a394ddd4874a', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-19 15:00:00'),
  (gen_random_uuid(), '0304304e-b90d-4729-9b92-a394ddd4874a', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved', '2026-03-20 05:45:00'),
  (gen_random_uuid(), '0304304e-b90d-4729-9b92-a394ddd4874a', 'FYSIEKE_INSPECTIE', 'MEDEDELING', 'Physical inspection in progress', '2026-03-20 06:00:00');
UPDATE "shipments" SET "status" = 'FYSIEKE_INSPECTIE', "updated_at" = '2026-03-20 06:00:00' WHERE "id" = '0304304e-b90d-4729-9b92-a394ddd4874a';

-- ============================================
-- GROUP D: In DOCUMENTCONTROLE_AFGEROND (2 shipments - docs done, awaiting physical)
-- ============================================

-- D1: 072c6f13 - Ecuador Rosa/Snijbloemen (IP Handlers) → DOCUMENTCONTROLE_AFGEROND
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '072c6f13-9301-4504-9fda-532a06970564', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171101830', '2026-03-12 09:00:00'),
  (gen_random_uuid(), '072c6f13-9301-4504-9fda-532a06970564', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 14-03 10:00 at Rietwijkeroordweg', '2026-03-12 09:45:00'),
  (gen_random_uuid(), '072c6f13-9301-4504-9fda-532a06970564', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 14-03-2026 10:00', '2026-03-12 15:00:00'),
  (gen_random_uuid(), '072c6f13-9301-4504-9fda-532a06970564', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-13 07:00:00'),
  (gen_random_uuid(), '072c6f13-9301-4504-9fda-532a06970564', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved - awaiting physical inspection', '2026-03-13 16:00:00');
UPDATE "shipments" SET "status" = 'DOCUMENTCONTROLE_AFGEROND', "updated_at" = '2026-03-13 16:00:00' WHERE "id" = '072c6f13-9301-4504-9fda-532a06970564';

-- D2: f55c9cad - Colombia Rosa (Logiztik Alliance) → DOCUMENTCONTROLE_AFGEROND
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), 'f55c9cad-1722-425d-b792-b7b409f05382', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171102571', '2026-03-15 08:30:00'),
  (gen_random_uuid(), 'f55c9cad-1722-425d-b792-b7b409f05382', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 17-03 06:00 at Rietwijkeroordweg', '2026-03-15 09:00:00'),
  (gen_random_uuid(), 'f55c9cad-1722-425d-b792-b7b409f05382', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 17-03-2026 06:00', '2026-03-15 14:00:00'),
  (gen_random_uuid(), 'f55c9cad-1722-425d-b792-b7b409f05382', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-16 07:00:00'),
  (gen_random_uuid(), 'f55c9cad-1722-425d-b792-b7b409f05382', 'DOCUMENTCONTROLE_AFGEROND', 'MEDEDELING', 'Documents approved', '2026-03-16 15:30:00');
UPDATE "shipments" SET "status" = 'DOCUMENTCONTROLE_AFGEROND', "updated_at" = '2026-03-16 15:30:00' WHERE "id" = 'f55c9cad-1722-425d-b792-b7b409f05382';

-- ============================================
-- GROUP E: In DOCUMENTCONTROLE (2 shipments - docs being checked)
-- ============================================

-- E1: d33ab24d - Ecuador Rosa/Gypsophila → DOCUMENTCONTROLE
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), 'd33ab24d-1bbe-4fa4-8994-ba3b2dee7705', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171100501', '2026-03-08 10:00:00'),
  (gen_random_uuid(), 'd33ab24d-1bbe-4fa4-8994-ba3b2dee7705', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 10-03 06:00 at Rietwijkeroordweg', '2026-03-08 10:30:00'),
  (gen_random_uuid(), 'd33ab24d-1bbe-4fa4-8994-ba3b2dee7705', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 10-03-2026 06:00', '2026-03-08 16:00:00'),
  (gen_random_uuid(), 'd33ab24d-1bbe-4fa4-8994-ba3b2dee7705', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-09 07:30:00');
UPDATE "shipments" SET "status" = 'DOCUMENTCONTROLE', "updated_at" = '2026-03-09 07:30:00' WHERE "id" = 'd33ab24d-1bbe-4fa4-8994-ba3b2dee7705';

-- E2: b29cbf71 - Ecuador Rosa/Gypsophila/Snijbloemen → DOCUMENTCONTROLE
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), 'b29cbf71-2797-4f08-a5ff-c09f63f11940', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171101049', '2026-03-10 08:00:00'),
  (gen_random_uuid(), 'b29cbf71-2797-4f08-a5ff-c09f63f11940', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 12-03 06:00 at Rietwijkeroordweg', '2026-03-10 08:45:00'),
  (gen_random_uuid(), 'b29cbf71-2797-4f08-a5ff-c09f63f11940', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 12-03-2026 06:00', '2026-03-10 14:30:00'),
  (gen_random_uuid(), 'b29cbf71-2797-4f08-a5ff-c09f63f11940', 'DOCUMENTCONTROLE', 'MEDEDELING', 'Document control started', '2026-03-11 07:00:00');
UPDATE "shipments" SET "status" = 'DOCUMENTCONTROLE', "updated_at" = '2026-03-11 07:00:00' WHERE "id" = 'b29cbf71-2797-4f08-a5ff-c09f63f11940';

-- ============================================
-- GROUP F: In INSPECTIE_GEPLAND (2 shipments - confirmed, awaiting docs)
-- ============================================

-- F1: 9b6e5248 - Ecuador Rosa/Gypsophila → INSPECTIE_GEPLAND
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '9b6e5248-a7f8-4b0f-a98e-c19d0ddff0d1', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171102231', '2026-03-13 11:00:00'),
  (gen_random_uuid(), '9b6e5248-a7f8-4b0f-a98e-c19d0ddff0d1', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 15-03 10:00 at Rietwijkeroordweg', '2026-03-13 11:30:00'),
  (gen_random_uuid(), '9b6e5248-a7f8-4b0f-a98e-c19d0ddff0d1', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 15-03-2026 10:00', '2026-03-13 16:45:00');
UPDATE "shipments" SET "status" = 'INSPECTIE_GEPLAND', "updated_at" = '2026-03-13 16:45:00' WHERE "id" = '9b6e5248-a7f8-4b0f-a98e-c19d0ddff0d1';

-- F2: 66dee108 - Kenia Gypsophila (Black Tulip) → INSPECTIE_GEPLAND
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '66dee108-acbd-47c3-8289-b4d2303ca418', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01510435', '2026-03-17 07:00:00'),
  (gen_random_uuid(), '66dee108-acbd-47c3-8289-b4d2303ca418', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 19-03 06:00 at Rietwijkeroordweg', '2026-03-17 07:30:00'),
  (gen_random_uuid(), '66dee108-acbd-47c3-8289-b4d2303ca418', 'INSPECTIE_GEPLAND', 'KCB', 'KCB confirmed: 19-03-2026 06:00', '2026-03-17 13:00:00');
UPDATE "shipments" SET "status" = 'INSPECTIE_GEPLAND', "updated_at" = '2026-03-17 13:00:00' WHERE "id" = '66dee108-acbd-47c3-8289-b4d2303ca418';

-- ============================================
-- GROUP G: In INSPECTIE_AANGEVRAAGD (2 shipments - handler proposed time)
-- ============================================

-- G1: 556be9fb - Ecuador Rosa/Gypsophila/Snijbloemen → INSPECTIE_AANGEVRAAGD
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '556be9fb-4b29-4570-80b6-74c7a055d2c7', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment 171104037', '2026-03-19 06:00:00'),
  (gen_random_uuid(), '556be9fb-4b29-4570-80b6-74c7a055d2c7', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 20-03 06:00 at Rietwijkeroordweg - awaiting KCB confirmation', '2026-03-19 06:30:00');
UPDATE "shipments" SET "status" = 'INSPECTIE_AANGEVRAAGD', "updated_at" = '2026-03-19 06:30:00' WHERE "id" = '556be9fb-4b29-4570-80b6-74c7a055d2c7';

-- G2: 3af6a61c - Kenia Gypsophila (Sun Floritech) → INSPECTIE_AANGEVRAAGD
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '3af6a61c-0631-4ffd-b6d6-4b475b726783', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01510452', '2026-03-19 14:00:00'),
  (gen_random_uuid(), '3af6a61c-0631-4ffd-b6d6-4b475b726783', 'INSPECTIE_AANGEVRAAGD', 'HANDLER', 'Inspection requested for 20-03 06:00 at Rietwijkeroordweg - awaiting KCB confirmation', '2026-03-19 14:45:00');
UPDATE "shipments" SET "status" = 'INSPECTIE_AANGEVRAAGD', "updated_at" = '2026-03-19 14:45:00' WHERE "id" = '3af6a61c-0631-4ffd-b6d6-4b475b726783';

-- ============================================
-- GROUP H: In AANGEMELD (2 shipments - just received notification)
-- ============================================

-- H1: 7642a38d - Kenia Rosa (Everflora) → AANGEMELD
INSERT INTO "status_history" ("id", "shipment_id", "status", "source", "details", "timestamp") VALUES
  (gen_random_uuid(), '7642a38d-5646-49c1-9255-16ca29fecc5b', 'AANGEMELD', 'EMAIL', 'KCB inspection announced for shipment S01510453 - awaiting handler action', '2026-03-19 17:30:00');
UPDATE "shipments" SET "status" = 'AANGEMELD', "updated_at" = '2026-03-19 17:30:00' WHERE "id" = '7642a38d-5646-49c1-9255-16ca29fecc5b';

-- All 15 shipments now assigned to a stage.

-- ============================================
-- Summary of final distribution:
-- AANGEMELD:                1 (7642a38d)
-- INSPECTIE_AANGEVRAAGD:    2 (556be9fb, 3af6a61c)
-- INSPECTIE_GEPLAND:        2 (9b6e5248, 66dee108)
-- DOCUMENTCONTROLE:         2 (d33ab24d, b29cbf71)
-- DOCUMENTCONTROLE_AFGEROND: 2 (072c6f13, f55c9cad)
-- FYSIEKE_INSPECTIE:        2 (a7f2d074, 0304304e)
-- GOEDGEKEURD:              3 (03823b87, 1121944c, 5a499ca2)
-- GEBLOKKEERD:              1 (1b370cd9)
-- Total: 15
-- ============================================
