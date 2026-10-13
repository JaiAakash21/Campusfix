-- CampusFix production seed — for InfinityFree phpMyAdmin import
-- Run AFTER schema_prod.sql.
-- Seeds categories only. Do NOT include test users with weak passwords in production.
-- Create real accounts via the registration page or admin panel after deployment.

INSERT IGNORE INTO categories (name, description) VALUES
('Infrastructure',    'Buildings, roads, electricity, water supply'),
('IT & Network',      'Computers, Wi-Fi, printers, software'),
('Academics',         'Timetables, exam issues, lab access'),
('Hostel & Canteen',  'Food quality, hostel maintenance, cleanliness'),
('Library',           'Books, e-resources, library hours'),
('Other',             'Anything that does not fit the above');
