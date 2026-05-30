-- Seed data for BarangayHealth Connect
USE barangay_health_connect;

-- Default password for all users: password123
-- bcrypt hash of 'password123'
INSERT INTO users (username, password_hash, full_name, role, phone) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'admin', '09171234567'),
('nurse.maria', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria Santos', 'nurse', '09181234567'),
('bhw.juan', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Juan Dela Cruz', 'bhw', '09191234567'),
('staff.ana', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ana Reyes', 'staff', '09201234567');

INSERT INTO patients (patient_code, first_name, last_name, birth_date, gender, phone, address, barangay, blood_type) VALUES
('P-2024-001', 'Pedro', 'Garcia', '1985-03-15', 'male', '09171111111', '123 Rizal St.', 'Barangay San Jose', 'O+'),
('P-2024-002', 'Rosa', 'Mendoza', '1990-07-22', 'female', '09172222222', '456 Mabini Ave.', 'Barangay San Jose', 'A+'),
('P-2024-003', 'Carlos', 'Ramos', '1978-11-08', 'male', '09173333333', '789 Bonifacio Rd.', 'Barangay San Jose', 'B+'),
('P-2024-004', 'Elena', 'Torres', '1995-01-30', 'female', '09174444444', '321 Luna St.', 'Barangay San Jose', 'AB+'),
('P-2024-005', 'Miguel', 'Fernandez', '2019-06-12', 'male', '09175555555', '654 Aguinaldo St.', 'Barangay San Jose', 'O-');

INSERT INTO appointments (patient_id, appointment_date, queue_number, status, booking_source, reason) VALUES
(1, CURDATE(), 1, 'confirmed', 'sms', 'General check-up'),
(2, CURDATE(), 2, 'in_queue', 'web', 'Prenatal visit'),
(3, CURDATE(), 3, 'pending', 'walk_in', 'Blood pressure monitoring'),
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL, 'pending', 'web', 'Vaccine Dose 2'),
(5, CURDATE(), 4, 'confirmed', 'sms', 'Child immunization');

INSERT INTO home_visits (patient_id, bhw_id, visit_date, status) VALUES
(1, 3, CURDATE(), 'scheduled'),
(3, 3, CURDATE(), 'scheduled'),
(5, 3, CURDATE(), 'scheduled');

INSERT INTO inventory_items (item_name, category, unit, quantity, low_stock_threshold) VALUES
('Paracetamol 500mg', 'medicine', 'tablets', 120, 50),
('Amoxicillin 500mg', 'medicine', 'capsules', 80, 30),
('BCG Vaccine', 'vaccine', 'doses', 25, 10),
('Measles Vaccine', 'vaccine', 'doses', 15, 10),
('Bandages', 'supply', 'rolls', 45, 20),
('Syringes 5ml', 'supply', 'pcs', 200, 50),
('Blood Pressure Cuff', 'equipment', 'pcs', 5, 2);

INSERT INTO vitals (patient_id, recorded_by, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, weight_kg, temperature_c, is_high_risk) VALUES
(3, 3, 165, 105, 88, 78.5, 36.8, TRUE);

INSERT INTO alerts (alert_type, title, message, reference_type, reference_id) VALUES
('high_risk_vital', 'High Blood Pressure Alert', 'Carlos Ramos recorded BP 165/105 - requires immediate attention', 'vitals', 1),
('low_stock', 'Low Stock: Measles Vaccine', 'Measles Vaccine stock (15 doses) is below threshold (10 doses)', 'inventory', 4);

INSERT INTO reminders (patient_id, appointment_id, reminder_date, message) VALUES
(4, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Reminder: Your Vaccine Dose 2 appointment is scheduled for tomorrow.');
