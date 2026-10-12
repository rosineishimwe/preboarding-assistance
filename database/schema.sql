CREATE DATABASE IF NOT EXISTS preboarding_assistance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE preboarding_assistance;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  preferred_contact_method ENUM('phone', 'email', 'sms', 'whatsapp') NOT NULL DEFAULT 'phone',
  role ENUM('passenger', 'staff', 'admin') NOT NULL DEFAULT 'passenger',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_users_role (role),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE passenger_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  nationality VARCHAR(80) NULL,
  accessibility_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_passenger_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assistance_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  passenger_id BIGINT UNSIGNED NOT NULL,
  assigned_staff_id BIGINT UNSIGNED NULL,
  departure_point VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  travel_date DATE NOT NULL,
  preferred_departure_time TIME NOT NULL,
  assistance_type ENUM(
    'Wheelchair boarding support',
    'Visual guidance',
    'Hearing or communication support',
    'Mobility assistance',
    'Station or boarding-point guidance',
    'Other assistance'
  ) NOT NULL,
  additional_instructions TEXT NULL,
  preferred_contact_method ENUM('phone', 'email', 'sms', 'whatsapp') NOT NULL DEFAULT 'phone',
  status ENUM(
    'Pending',
    'Under review',
    'Accepted',
    'Staff assigned',
    'Assistance completed',
    'Cancelled'
  ) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_requests_passenger (passenger_id),
  KEY idx_requests_staff (assigned_staff_id),
  KEY idx_requests_status (status),
  KEY idx_requests_date (travel_date),
  CONSTRAINT fk_requests_passenger
    FOREIGN KEY (passenger_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_requests_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE staff_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  staff_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  PRIMARY KEY (id),
  KEY idx_assignments_request (request_id),
  KEY idx_assignments_staff (staff_id),
  CONSTRAINT fk_assignments_request
    FOREIGN KEY (request_id) REFERENCES assistance_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_staff
    FOREIGN KEY (staff_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('request_submission', 'request_update', 'staff_assignment', 'completion', 'system') NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_read (is_read),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE feedback (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id BIGINT UNSIGNED NOT NULL,
  passenger_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_feedback_request (request_id),
  KEY idx_feedback_passenger (passenger_id),
  CONSTRAINT fk_feedback_request
    FOREIGN KEY (request_id) REFERENCES assistance_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_feedback_passenger
    FOREIGN KEY (passenger_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
