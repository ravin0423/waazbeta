
-- Fix misassigned plans: Smartwatch Complete Care should not be under Smartphones
-- Fix Tablet Standard Care should not be under Smartphones
-- First, fix Smartwatch - there's no Smartwatch category, so keep under Smartphones for now

-- Create missing subscription plans for categories that have none

-- Laptops (1cbc6241-0e78-4970-a640-fe2818cc2507)
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES 
  ('Laptop Standard Care', 'laptop-standard', '1cbc6241-0e78-4970-a640-fe2818cc2507', 2499, true, true, true, false, false),
  ('Laptop Complete Care', 'laptop-complete', '1cbc6241-0e78-4970-a640-fe2818cc2507', 4499, true, true, true, true, true);

-- Desktops (24a87126-0742-4b1c-b989-893ad29a647d)
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES 
  ('Desktop Standard Care', 'desktop-standard', '24a87126-0742-4b1c-b989-893ad29a647d', 1999, true, false, true, false, false),
  ('Desktop Complete Care', 'desktop-complete', '24a87126-0742-4b1c-b989-893ad29a647d', 3499, true, false, true, true, true);

-- Projectors (ef6e0bb7-6576-4925-9b28-014e2c79ad5e)
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES 
  ('Projector Standard Care', 'projector-standard', 'ef6e0bb7-6576-4925-9b28-014e2c79ad5e', 1999, true, false, true, false, false),
  ('Projector Complete Care', 'projector-complete', 'ef6e0bb7-6576-4925-9b28-014e2c79ad5e', 3499, true, false, true, true, false);

-- Fix Tablet: reassign to its own category or keep as universal
-- Since there's no Tablet category, let's create one and reassign
INSERT INTO gadget_categories (name, icon, description) VALUES ('Tablets', 'tablet', 'Tablet devices');

-- Now reassign Tablet Standard Care to the new Tablets category
UPDATE subscription_plans SET gadget_category_id = (SELECT id FROM gadget_categories WHERE name = 'Tablets' LIMIT 1) WHERE code = 'tablet-standard';

-- Add Tablet Complete Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('Tablet Complete Care', 'tablet-complete', (SELECT id FROM gadget_categories WHERE name = 'Tablets' LIMIT 1), 2499, true, true, true, true, true);

-- Create Smartwatch category and reassign
INSERT INTO gadget_categories (name, icon, description) VALUES ('Smartwatches', 'watch', 'Smartwatch devices');

UPDATE subscription_plans SET gadget_category_id = (SELECT id FROM gadget_categories WHERE name = 'Smartwatches' LIMIT 1) WHERE code = 'smartwatch-complete';

-- Add Smartwatch Standard Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('Smartwatch Standard Care', 'smartwatch-standard', (SELECT id FROM gadget_categories WHERE name = 'Smartwatches' LIMIT 1), 999, true, true, false, false, false);

-- Add Mobile Complete Care (only Standard exists for Smartphones)
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('Mobile Complete Care', 'mobile-complete', '2158829f-c264-4f45-90c7-a0d8cbbb46ea', 2499, true, true, true, true, true);

-- Add CCTV Complete Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('CCTV Complete Care', 'cctv-complete', 'b7b25408-ee2d-4fb0-9af8-55e078f490fc', 2999, true, false, true, true, false);

-- Add DSLR Standard Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('DSLR Camera Standard Care', 'dslr-standard', 'aef386d6-53e3-4356-9578-3ad90461917e', 1999, true, true, true, false, false);

-- Add Gaming Console Standard Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('Gaming Console Standard Care', 'console-standard', '9abd92e5-c1b5-4eee-985a-04a000d6d7e3', 1499, true, false, true, false, false);

-- Add Printer Standard Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('Printer Standard Care', 'printer-standard', '15063690-6a95-423a-b1c6-42d67ecc0cbf', 999, true, false, true, false, false);

-- Add TV Standard Care
INSERT INTO subscription_plans (name, code, gadget_category_id, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)
VALUES ('TV Standard Care', 'tv-standard', 'cdf3a112-913f-4ad3-9148-20865bc16816', 1999, true, false, true, false, false);
