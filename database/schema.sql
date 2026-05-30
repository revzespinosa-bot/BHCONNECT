-- BarangayHealth Connect - Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS barangay_health_connect;
USE barangay_health_connect;

-- Users (Admin, Nurse, BHW, Staff)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'nurse', 'bhw', 'staff') NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unified Patient Registry
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50),
  birth_date DATE,
  gender ENUM('male', 'female', 'other'),
  phone VARCHAR(20),
  address TEXT,
  barangay VARCHAR(100),
  blood_type VARCHAR(5),
  allergies TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patient_name (last_name, first_name),
  INDEX idx_patient_phone (phone)
);

-- Appointments & Queue
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  queue_number INT,
  status ENUM('pending', 'confirmed', 'in_queue', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
  booking_source ENUM('sms', 'web', 'walk_in', 'bhw') DEFAULT 'web',
  reason TEXT,
  follow_up_date DATE,
  follow_up_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_appointment_date (appointment_date, status)
);

-- Home Visit Lists for BHW
CREATE TABLE home_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  bhw_id INT NOT NULL,
  visit_date DATE NOT NULL,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (bhw_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_visit_date (visit_date, bhw_id)
);

-- Vitals recorded during visits or check-ups
CREATE TABLE vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  recorded_by INT,
  home_visit_id INT,
  appointment_id INT,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  heart_rate INT,
  temperature_c DECIMAL(4,1),
  blood_sugar_mg_dl INT,
  is_high_risk BOOLEAN DEFAULT FALSE,
  risk_notes TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,
  sync_status ENUM('synced', 'pending', 'failed') DEFAULT 'synced',
  local_id VARCHAR(50),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (home_visit_id) REFERENCES home_visits(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_vitals_patient (patient_id, recorded_at)
);

-- Inventory / Supply Management
CREATE TABLE inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  category ENUM('medicine', 'vaccine', 'supply', 'equipment') NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 50,
  expiry_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inventory_name (item_name)
);

-- Inventory transactions (deductions, restocks)
CREATE TABLE inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  transaction_type ENUM('deduction', 'restock', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  patient_id INT,
  performed_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- System alerts (low stock, high-risk vitals, etc.)
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alert_type ENUM('low_stock', 'high_risk_vital', 'follow_up', 'system') NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alerts_unread (is_read, created_at)
);

-- Hospital referrals
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  referred_by INT NOT NULL,
  hospital_name VARCHAR(150) NOT NULL,
  reason TEXT NOT NULL,
  diagnosis_summary TEXT,
  status ENUM('pending', 'sent', 'accepted', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE CASCADE
);

-- SMS log
CREATE TABLE sms_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  direction ENUM('inbound', 'outbound') NOT NULL,
  message TEXT NOT NULL,
  keyword VARCHAR(20),
  status ENUM('sent', 'received', 'failed', 'processed') DEFAULT 'received',
  patient_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- Offline sync queue (BHW mobile app)
CREATE TABLE sync_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  entity_type ENUM('vitals', 'home_visit', 'patient_update') NOT NULL,
  local_id VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sync_pending (status, created_at)
);

-- Reminder triggers for follow-ups
CREATE TABLE reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT,
  reminder_date DATE NOT NULL,
  message TEXT NOT NULL,
  status ENUM('scheduled', 'sent', 'cancelled') DEFAULT 'scheduled',
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);
