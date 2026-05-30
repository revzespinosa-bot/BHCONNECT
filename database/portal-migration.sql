-- Patient Portal extensions (run on existing database)
USE barangay_health_connect;

CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🏥',
  max_slots_per_day INT NOT NULL DEFAULT 20,
  allowed_days VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS patient_otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone (phone, used, expires_at)
);

-- Add service to appointments if column missing
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'barangay_health_connect'
    AND TABLE_NAME = 'appointments'
    AND COLUMN_NAME = 'service_category_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE appointments ADD COLUMN service_category_id INT NULL AFTER patient_id, ADD FOREIGN KEY (service_category_id) REFERENCES service_categories(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO service_categories (slug, name, description, icon, max_slots_per_day, allowed_days, sort_order) VALUES
('maternal_health', 'Maternal Health', 'Prenatal check-ups, postnatal care, and maternal wellness', '🤰', 15, '1,3,5', 1),
('immunization', 'Immunization', 'Vaccines for children and adults', '💉', 20, '2,4,6', 2),
('general_medicine', 'General Medicine', 'General consultations and routine check-ups', '🩺', 25, '1,2,3,4,5', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);
