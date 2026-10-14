USE preboarding_assistance;

INSERT INTO organization_settings (
  organization_name, contact_email, contact_phone,
  email_notifications_enabled, whatsapp_notifications_enabled, notes, updated_at
) VALUES (
  'Pre-Boarding Assistance', NULL, NULL, FALSE, FALSE,
  'External email and WhatsApp notifications are not configured. Requests remain securely stored in the database.', NOW()
);
