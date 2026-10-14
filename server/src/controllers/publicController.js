import { fetchOrganizationSettings } from './dashboardController.js';

export const getPublicContactInfo = async (req, res, next) => {
  try {
    const settings = await fetchOrganizationSettings();
    const orgName = settings.organization_name || 'Pre-Boarding Assistance';
    const emailConfigured = Boolean(settings.contact_email && settings.email_notifications_enabled);
    const phoneConfigured = Boolean(settings.contact_phone && settings.whatsapp_notifications_enabled);

    res.json({
      organization_name: orgName,
      contact_email: settings.contact_email || null,
      contact_phone: settings.contact_phone || null,
      email_configured: emailConfigured,
      phone_configured: phoneConfigured,
      support_message: emailConfigured || phoneConfigured
        ? 'Verified contact details are available for the organization and may be used for follow-up.'
        : 'No external contact details have been verified yet. The organization can update them from the administrator dashboard.',
    });
  } catch (error) {
    next(error);
  }
};
