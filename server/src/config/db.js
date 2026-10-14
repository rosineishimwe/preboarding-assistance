import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'preboarding_assistance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organization_settings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      organization_name VARCHAR(120) NOT NULL DEFAULT 'Pre-Boarding Assistance',
      contact_email VARCHAR(150) NULL,
      contact_phone VARCHAR(30) NULL,
      email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS delivery_channel ENUM('in_app', 'email', 'whatsapp', 'sms') NOT NULL DEFAULT 'in_app',
      ADD COLUMN IF NOT EXISTS delivery_status ENUM('stored', 'queued', 'sent', 'failed', 'disabled', 'not_required') NOT NULL DEFAULT 'stored'
  `);

  await pool.query(`
    UPDATE assistance_requests
    SET status = 'Pending'
    WHERE status IS NULL OR status = '' OR status NOT IN ('Pending', 'In Progress', 'Completed', 'Cancelled')
  `);

  await pool.query(`
    ALTER TABLE assistance_requests
      MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending'
  `);
};

export default pool;
