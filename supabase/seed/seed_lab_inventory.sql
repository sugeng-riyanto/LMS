-- Seed: Lab Inventory for Physics Command Center
-- Categories: Measurement, Mechanics, Electricity, Electronics, Optics, Magnetism, Thermal, Waves, General

INSERT INTO public.lab_inventory
  (id, item_name, category, total_quantity, available_quantity, broken_quantity, location, last_restocked_at, notes)
VALUES

-- Measurement
(gen_random_uuid(), 'Multimeter Digital',        'Measurement',  15, 12, 3,  'Kabinet A - Rak 1', '2026-06-01', '3 unit rusak: layar pecah'),
(gen_random_uuid(), 'Stopwatch Digital',          'Measurement',  20, 18, 2,  'Kabinet A - Rak 1', '2026-06-01', '2 unit baterai lemah'),
(gen_random_uuid(), 'Meter Ruler (1m)',           'Measurement',  20, 20, 0,  'Kabinet A - Rak 2', '2026-06-01', NULL),
(gen_random_uuid(), 'Protractor',                 'Measurement',  15, 15, 0,  'Kabinet A - Rak 2', '2026-06-01', NULL),
(gen_random_uuid(), 'Balance (Digital)',          'Measurement',  5,  4,  1,  'Kabinet A - Rak 3', '2026-06-01', '1 unit perlu kalibrasi'),

-- Mechanics
(gen_random_uuid(), 'Dynamics Trolley',           'Mechanics',    10, 8,  2,  'Kabinet B - Rak 1', '2026-05-15', '2 troli roda aus'),
(gen_random_uuid(), 'Pulley System (Set)',        'Mechanics',    8,  8,  0,  'Kabinet B - Rak 1', '2026-05-15', NULL),
(gen_random_uuid(), 'Newton Meter (5N)',          'Mechanics',    15, 13, 2,  'Kabinet B - Rak 2', '2026-05-15', '2 unit pegang kendor'),

-- Electricity
(gen_random_uuid(), 'Circuit Board (Set)',        'Electricity',  12, 10, 2,  'Kabinet C - Rak 1', '2026-04-20', '2 PCB jalur putus'),
(gen_random_uuid(), 'Power Supply (DC)',          'Electricity',  10, 9,  1,  'Kabinet C - Rak 1', '2026-04-20', '1 unit tidak menyala'),

-- Electronics
(gen_random_uuid(), 'Oscilloscope',               'Electronics',  5,  4,  1,  'Kabinet C - Rak 2', '2026-04-20', '1 unit tabung redup'),
(gen_random_uuid(), 'Signal Generator',           'Electronics',  4,  4,  0,  'Kabinet C - Rak 2', '2026-04-20', NULL),

-- Optics
(gen_random_uuid(), 'Glass Block (Rectangular)',  'Optics',       10, 10, 0,  'Kabinet D - Rak 1', '2026-03-10', NULL),
(gen_random_uuid(), 'Lens Set (Convex/Concave)',  'Optics',       15, 13, 2,  'Kabinet D - Rak 1', '2026-03-10', '2 lensa retak'),

-- Magnetism
(gen_random_uuid(), 'Bar Magnet',                 'Magnetism',    20, 18, 2,  'Kabinet D - Rak 2', '2026-03-10', '2 magnet retak'),
(gen_random_uuid(), 'Coil Wire (Solenoid)',       'Magnetism',    10, 10, 0,  'Kabinet D - Rak 2', '2026-03-10', NULL),

-- Thermal
(gen_random_uuid(), 'Thermometer (-10 to 110C)',  'Thermal',      20, 17, 3,  'Kabinet E - Rak 1', '2026-02-05', '3 termometer air raksa pecah'),
(gen_random_uuid(), 'Calorimeter (Set)',          'Thermal',      8,  7,  1,  'Kabinet E - Rak 1', '2026-02-05', '1 set tutup hilang'),

-- Waves & Sound
(gen_random_uuid(), 'Tuning Fork (Set of 8)',     'Waves',        10, 9,  1,  'Kabinet E - Rak 2', '2026-02-05', '1 garpu tala frekuensi tidak akurat'),
(gen_random_uuid(), 'Slinky Spring',              'Waves',        10, 10, 0,  'Kabinet E - Rak 2', '2026-02-05', NULL);
