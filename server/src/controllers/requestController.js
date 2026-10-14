import pool from '../config/db.js';

const VALID_REQUEST_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const canEditRequest = (status) => !['Completed', 'Cancelled'].includes(status);

const ensureOrganizationSettingsTable = async () => {
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

  const [rows] = await pool.query('SELECT * FROM organization_settings ORDER BY id DESC LIMIT 1');
  if (!rows.length) {
    await pool.query(`
      INSERT INTO organization_settings (
        organization_name, contact_email, contact_phone,
        email_notifications_enabled, whatsapp_notifications_enabled, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Pre-Boarding Assistance',
      null,
      null,
      false,
      false,
      'External email and WhatsApp notifications are not configured yet. Requests remain stored in the database.'
    ]);
  }
};

const getOrganizationSettings = async () => {
  try {
    await ensureOrganizationSettingsTable();
    const [rows] = await pool.query(
      'SELECT * FROM organization_settings ORDER BY id DESC LIMIT 1'
    );

    return rows[0] || {
      organization_name: 'Pre-Boarding Assistance',
      contact_email: null,
      contact_phone: null,
      email_notifications_enabled: false,
      whatsapp_notifications_enabled: false,
      notes: null,
    };
  } catch (error) {
    return {
      organization_name: 'Pre-Boarding Assistance',
      contact_email: null,
      contact_phone: null,
      email_notifications_enabled: false,
      whatsapp_notifications_enabled: false,
      notes: 'External notifications are not configured. Requests remain stored safely in the database.',
    };
  }
};

const getRequestById = async (id) => {
  const [rows] = await pool.query(
    `
      SELECT r.*, u.full_name as passenger_name, u.email as passenger_email,
             u.phone as passenger_phone, u.preferred_contact_method as passenger_contact_method,
             s.full_name as staff_name, s.email as staff_email, s.phone as staff_phone
      FROM assistance_requests r
      LEFT JOIN users u ON u.id = r.passenger_id
      LEFT JOIN users s ON s.id = r.assigned_staff_id
      WHERE r.id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0];
};

const createNotificationBatch = async (userIds, title, message, type = 'system') => {
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (!recipients.length) {
    return;
  }

  const valuePlaceholders = recipients.map(() => '(?, ?, ?, ?, false, NOW())').join(', ');
  const values = recipients.flatMap((userId) => [userId, title, message, type]);

  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
     VALUES ${valuePlaceholders}`,
    values
  );
};

const getExternalNotificationNotice = async (contactMethod = 'phone') => {
  const config = await getOrganizationSettings();

  if (contactMethod === 'email' && !(config.email_notifications_enabled && config.contact_email)) {
    return 'External email notifications are not configured. The request is safely stored in the database.';
  }

  if (contactMethod === 'whatsapp' && !(config.whatsapp_notifications_enabled && config.contact_phone)) {
    return 'External WhatsApp notifications are not configured. The request is safely stored in the database.';
  }

  return null;
};

const getRequestStatusSettings = async () => {
  const config = await getOrganizationSettings();
  return {
    emailConfigured: Boolean(config.contact_email && config.email_notifications_enabled),
    whatsappConfigured: Boolean(config.contact_phone && config.whatsapp_notifications_enabled),
    adminContactLabel: config.contact_email || config.contact_phone || 'configured by administrator',
  };
};

const sanitizeRequestForPassenger = (request) => ({
  ...request,
  passenger_email: request.passenger_email,
  passenger_phone: request.passenger_phone,
  staff_name: request.staff_name,
  staff_email: request.staff_email,
  staff_phone: request.staff_phone,
});

export const createRequest = async (req, res, next) => {
  try {
    const {
      departure_point,
      destination,
      travel_date,
      preferred_departure_time,
      assistance_type,
      additional_instructions,
      preferred_contact_method,
    } = req.body;

    if (!departure_point || !destination || !travel_date || !preferred_departure_time || !assistance_type) {
      return res.status(400).json({ message: 'Departure point, destination, travel date, departure time, and assistance type are required.' });
    }

    const allowedTypes = [
      'Wheelchair boarding support',
      'Visual guidance',
      'Hearing or communication support',
      'Mobility assistance',
      'Station or boarding-point guidance',
      'Other assistance',
    ];

    if (!allowedTypes.includes(assistance_type)) {
      return res.status(400).json({ message: 'Assistance type is not valid.' });
    }

    const contactMethod = preferred_contact_method || req.user.preferred_contact_method || 'phone';
    const externalNotice = await getExternalNotificationNotice(contactMethod);

    const [result] = await pool.query(
      `INSERT INTO assistance_requests(
        passenger_id, departure_point, destination, travel_date, preferred_departure_time,
        assistance_type, additional_instructions, preferred_contact_method, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
      [
        req.user.id,
        departure_point,
        destination,
        travel_date,
        preferred_departure_time,
        assistance_type,
        additional_instructions || '',
        contactMethod,
      ]
    );

    const requestId = result.insertId;
    const request = await getRequestById(requestId);
    const [adminRows] = await pool.query('SELECT id FROM users WHERE role = ? AND is_active = TRUE', ['admin']);

    await createNotificationBatch(
      [req.user.id, ...adminRows.map((admin) => admin.id)],
      'Request submitted',
      externalNotice
        ? `Your assistance request has been submitted and is safely stored in the database. ${externalNotice}`
        : 'Your assistance request has been submitted and is awaiting review.',
      'request_submission'
    );

    const adminNotificationMessage = externalNotice
      ? `New passenger assistance request #NCPD-${String(requestId).padStart(5, '0')} submitted. ${externalNotice}`
      : `New passenger assistance request #NCPD-${String(requestId).padStart(5, '0')} submitted and waiting for review.`;

    await createNotificationBatch(
      adminRows.map((admin) => admin.id),
      'New request received',
      adminNotificationMessage,
      'request_submission'
    );

    return res.status(201).json({
      message: 'Assistance request submitted successfully.',
      reference_number: `NCPD-${String(requestId).padStart(5, '0')}`,
      notification_status: externalNotice ? { configured: false, message: externalNotice } : { configured: true, message: 'External notifications enabled.' },
      request: sanitizeRequestForPassenger(request),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM assistance_requests WHERE passenger_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows });
  } catch (error) {
    next(error);
  }
};

export const getAllRequests = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT r.*, u.full_name as passenger_name, u.email as passenger_email,
             u.phone as passenger_phone, u.preferred_contact_method as passenger_contact_method,
             s.full_name as staff_name, s.email as staff_email, s.phone as staff_phone
      FROM assistance_requests r
      LEFT JOIN users u ON u.id = r.passenger_id
      LEFT JOIN users s ON s.id = r.assigned_staff_id
    `;
    const values = [];
    const filters = [];

    if (req.user.role === 'passenger') {
      filters.push('r.passenger_id = ?');
      values.push(req.user.id);
    }

    if (req.user.role === 'staff') {
      filters.push('r.assigned_staff_id = ?');
      values.push(req.user.id);
    }

    if (status && status !== 'all') {
      filters.push('r.status = ?');
      values.push(status);
    }

    if (search) {
      filters.push('(u.full_name LIKE ? OR r.departure_point LIKE ? OR r.destination LIKE ? OR r.assistance_type LIKE ?)');
      const term = `%${search}%`;
      values.push(term, term, term, term);
    }

    if (filters.length) {
      query += ` WHERE ${filters.join(' AND ')}`;
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(query, values);
    res.json({ requests: rows.map((request) => {
      if (req.user.role === 'passenger') {
        return sanitizeRequestForPassenger(request);
      }
      return request;
    }) });
  } catch (error) {
    next(error);
  }
};

export const getRequestDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await getRequestById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (req.user.role === 'passenger' && request.passenger_id !== req.user.id) {
      return res.status(403).json({ message: 'You cannot access another passenger request.' });
    }

    const responseRequest = req.user.role === 'passenger' ? sanitizeRequestForPassenger(request) : request;
    res.json({ request: responseRequest });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, departure_point, destination, travel_date, preferred_departure_time, assistance_type, additional_instructions } = req.body;

    const [requestRows] = await pool.query('SELECT * FROM assistance_requests WHERE id = ? LIMIT 1', [id]);
    const request = requestRows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (req.user.role === 'passenger' && request.passenger_id !== req.user.id) {
      return res.status(403).json({ message: 'You cannot modify another passenger request.' });
    }

    if (req.user.role === 'staff' && request.assigned_staff_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This request is not assigned to you.' });
    }

    if (req.user.role === 'passenger' && !canEditRequest(request.status)) {
      return res.status(400).json({ message: 'This request can no longer be edited or cancelled.' });
    }

    const nextStatus = status || request.status;
    if (status && !VALID_REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status is invalid.' });
    }

    if (status === 'Cancelled' && !['passenger', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only the passenger or an administrator may cancel this request.' });
    }

    await pool.query(
      `UPDATE assistance_requests
       SET departure_point = ?, destination = ?, travel_date = ?, preferred_departure_time = ?,
           assistance_type = ?, additional_instructions = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        departure_point || request.departure_point,
        destination || request.destination,
        travel_date || request.travel_date,
        preferred_departure_time || request.preferred_departure_time,
        assistance_type || request.assistance_type,
        additional_instructions ?? request.additional_instructions,
        nextStatus,
        id,
      ]
    );

    const updated = await getRequestById(id);
    const notificationType = nextStatus === 'Completed' ? 'completion' : 'request_update';
    const passengerMessage = nextStatus === 'Completed'
      ? 'Your assistance request has been completed.'
      : nextStatus === 'Cancelled'
        ? 'Your assistance request has been cancelled.'
        : `Your assistance request status has changed to ${nextStatus}.`;

    await createNotificationBatch(
      [request.passenger_id],
      'Request status updated',
      passengerMessage,
      notificationType
    );

    if (request.assigned_staff_id) {
      await createNotificationBatch(
        [request.assigned_staff_id],
        'Request updated',
        `Request #NCPD-${String(id).padStart(5, '0')} changed to ${nextStatus}.`,
        notificationType
      );
    }

    return res.json({ message: 'Request updated successfully.', request: updated });
  } catch (error) {
    next(error);
  }
};

export const assignStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;

    if (!staff_id) {
      return res.status(400).json({ message: 'A staff member is required.' });
    }

    const [staffRows] = await pool.query(
      'SELECT id, role, is_active FROM users WHERE id = ? AND role IN (\'staff\', \'admin\') LIMIT 1',
      [staff_id]
    );

    if (!staffRows.length) {
      return res.status(404).json({ message: 'The selected staff member is not authorized.' });
    }

    const [requestRows] = await pool.query('SELECT * FROM assistance_requests WHERE id = ? LIMIT 1', [id]);
    if (!requestRows.length) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const request = requestRows[0];
    const previousStatus = request.status;

    await pool.query(
      'UPDATE assistance_requests SET assigned_staff_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [staff_id, previousStatus === 'Cancelled' ? 'Cancelled' : 'Pending', id]
    );

    await pool.query(
      'INSERT INTO staff_assignments (request_id, staff_id, assigned_at, status) VALUES (?, ?, NOW(), \'active\') ON DUPLICATE KEY UPDATE staff_id = VALUES(staff_id), assigned_at = NOW(), status = \'active\'',
      [id, staff_id]
    );

    await createNotificationBatch(
      [request.passenger_id, staff_id],
      'Staff assigned',
      `Request #NCPD-${String(id).padStart(5, '0')} has been assigned to a staff member. ${await getExternalNotificationNotice(request.preferred_contact_method) || 'Notifications are configured.'}`,
      'staff_assignment'
    );

    const updated = await getRequestById(id);
    res.json({ message: 'Staff assigned successfully.', request: updated });
  } catch (error) {
    next(error);
  }
};

export const completeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [requestRows] = await pool.query('SELECT * FROM assistance_requests WHERE id = ? LIMIT 1', [id]);
    const request = requestRows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (req.user.role === 'staff' && request.assigned_staff_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only complete requests assigned to you.' });
    }

    await pool.query(
      'UPDATE assistance_requests SET status = ?, updated_at = NOW() WHERE id = ?',
      ['Completed', id]
    );

    await createNotificationBatch(
      [request.passenger_id, request.assigned_staff_id].filter(Boolean),
      'Assistance completed',
      'The assistance request has been marked as completed.',
      'completion'
    );

    const updated = await getRequestById(id);
    return res.json({ message: 'Request marked as completed.', request: updated });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'A rating from 1 to 5 is required.' });
    }

    const [requestRows] = await pool.query('SELECT * FROM assistance_requests WHERE id = ? LIMIT 1', [id]);
    const request = requestRows[0];

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.passenger_id !== req.user.id) {
      return res.status(403).json({ message: 'You cannot submit feedback for another passenger request.' });
    }

    if (request.status !== 'Completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted after assistance is completed.' });
    }

    await pool.query(
      'INSERT INTO feedback (request_id, passenger_id, rating, comments, created_at) VALUES (?, ?, ?, ?, NOW())',
      [id, req.user.id, Number(rating), comments || null]
    );

    res.status(201).json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    next(error);
  }
};
