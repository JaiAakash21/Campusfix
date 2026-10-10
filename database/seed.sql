-- CampusFix seed data
-- Run AFTER schema.sql
-- All dev passwords: "password"
-- Hash below is bcrypt cost-10 of "password" — valid for development only.
-- Production accounts are created via registration / admin panel with cost-12 hashes.

USE campusfix;

-- ─── categories ──────────────────────────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
('Infrastructure',    'Buildings, roads, electricity, water supply'),
('IT & Network',      'Computers, Wi-Fi, printers, software'),
('Academics',         'Timetables, exam issues, lab access'),
('Hostel & Canteen',  'Food quality, hostel maintenance, cleanliness'),
('Library',           'Books, e-resources, library hours'),
('Other',             'Anything that does not fit the above');

-- ─── users ───────────────────────────────────────────────────────────────────
-- password: "password"  hash: bcrypt cost-10
INSERT INTO users (name, email, password_hash, role, status) VALUES
('Admin User',   'admin@campusfix.local',        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',   'active'),
('Staff IT',     'staff.it@campusfix.local',     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff',   'active'),
('Staff Infra',  'staff.infra@campusfix.local',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff',   'active'),
('Alice Student','alice@campusfix.local',        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('Bob Student',  'bob@campusfix.local',          '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active');

-- ─── tickets ─────────────────────────────────────────────────────────────────
-- Manually seeded with deterministic refs for testing
INSERT INTO tickets (ticket_ref, title, description, category_id, submitter_id, assigned_to, status, priority) VALUES
('CF-20260101-0001', 'Wi-Fi dead in Block B',
 'The Wi-Fi access point in Block B room 204 has been offline for 3 days.',
 2, 4, 2, 'in_progress', 'high'),

('CF-20260101-0002', 'Broken projector in Lab 3',
 'The ceiling projector in Computer Lab 3 shows a blank screen when powered on.',
 2, 5, 2, 'open', 'medium'),

('CF-20260102-0001', 'Leaking roof in Hostel C',
 'Water drips from the ceiling in room 310 during rain. Mattress is damaged.',
 1, 4, 3, 'resolved', 'high'),

('CF-20260103-0001', 'Canteen menu not updated',
 'The digital menu board still shows last semester prices. New prices not reflected.',
 4, 5, NULL, 'open', 'low');

-- ─── ticket_history ──────────────────────────────────────────────────────────
INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, note) VALUES
(1, 2, 'open',        'in_progress', 'Investigating the AP firmware.'),
(3, 3, 'open',        'in_progress', 'Maintenance team notified.'),
(3, 3, 'in_progress', 'resolved',    'Roof sealed. Room inspected and cleared.');

-- ─── comments ────────────────────────────────────────────────────────────────
INSERT INTO comments (ticket_id, author_id, body) VALUES
(1, 2, 'I can reproduce this. The AP is unresponsive to pings. Will replace the unit tomorrow.'),
(1, 4, 'Thank you for the update!'),
(3, 3, 'Repair completed. Please let us know if it recurs.');
