-- ============================================================
-- RUBIS CAR WASH — Minimal Manual Migration (Option A)
-- Hibernate/JPA handles everything else automatically on startup.
--
-- The ONLY reason you need to run this manually is that
-- Hibernate's ddl-auto=update can ADD columns but CANNOT
-- remove NOT NULL constraints from existing columns.
--
-- Run these 2 statements in pgAdmin, then restart Spring Boot.
-- ============================================================

-- Allow guest bookings to have no customer or vehicle record
-- (existing rows KEEP their values; only the constraint is relaxed)
ALTER TABLE bookings ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN vehicle_id  DROP NOT NULL;

-- Done! Hibernate will auto-add all the new columns (is_guest,
-- guest_name, guest_phone, guest_vehicle_plate) when Spring Boot starts.
SELECT 'Manual migration done. Now restart Spring Boot.' AS result;
