import pool from '../config/db.js';

const requestStatusOrder = ['Pending', 'Under review', 'Accepted', 'Staff assigned', 'Assistance completed', 'Cancelled'];

const canEditRequest = (status) => !['Assistance completed', 'Cancelled'].includes(status);

const getRequestById = async (id) => {
  const [rows] = await pool.query(
    `
      SELECT r.*, u.full_name as passenger_name, u.email as passenger_email,
             s.full_name as staff_name, s.email as staff_email
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
        preferred_contact_method || req.user.preferred_contact_method || 'phone',
      ]
    );

    const requestId = result.insertId;
    const request = await getRequestById(requestId);

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES (?, 'Request submitted', 'Your assistance request has been submitted and is awaiting review.', 'request_submission', false, NOW())`,
      [req.user.id]
    );

    return res.status(201).json({
      message: 'Assistance request submitted successfully.',
      reference_number: `NCPD-${String(requestId).padStart(5, '0')}`,
      request,
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
             s.full_name as staff_name, s.email as staff_email
      FROM assistance_requests r
      LEFT JOIN users u ON u.id = r.passenger_id
      LEFT JOIN users s ON s.id = r.assigned_staff_id
    `;
    const values = [];

    if (status && status !== 'all') {
      query += ' WHERE r.status = ?';
      values.push(status);
    }

    if (search) {
      const condition = values.length ? ' AND ' : ' WHERE ';
      query += `${condition} (u.full_name LIKE ? OR r.departure_point LIKE ? OR r.destination LIKE ? OR r.assistance_type LIKE ?)`;
      const term = `%${search}%`;
      values.push(term, term, term, term);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(query, values);
    res.json({ requests: rows });
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

    res.json({ request });
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

    if (req.user.role === 'passenger' && !canEditRequest(request.status)) {
      return res.status(400).json({ message: 'This request can no longer be edited or cancelled.' });
    }

    if (req.user.role === 'admin') {
      // administrators may update status and assignment details but cannot bypass validity checks
    }

    const nextStatus = status || request.status;
    if (status && !requestStatusOrder.includes(status)) {
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
    await pool.query(
      'UPDATE assistance_requests SET assigned_staff_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [staff_id, 'Staff assigned', id]
    );

    await pool.query(
      'INSERT INTO staff_assignments (request_id, staff_id, assigned_at, status) VALUES (?, ?, NOW(), \'active\')',
      [id, staff_id]
    );

    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, false, NOW())',
      [request.passenger_id, 'Staff assigned', 'A staff member has been assigned to your request.', 'staff_assignment', false]
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

    await pool.query(
      'UPDATE assistance_requests SET status = ?, updated_at = NOW() WHERE id = ?',
      ['Assistance completed', id]
    );

    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, false, NOW())',
      [request.passenger_id, 'Assistance completed', 'Your assistance session has been completed.', 'completion', false]
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

    if (request.status !== 'Assistance completed') {
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
