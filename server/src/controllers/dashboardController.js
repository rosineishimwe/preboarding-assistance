import pool from '../config/db.js';

export const getNotifications = async (req, res, next) => {
  try {
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const getPassengerDashboard = async (req, res, next) => {
  try {
    const [stats] = await pool.query(
      `SELECT
         COUNT(*) AS total_requests,
         SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
         SUM(CASE WHEN status = 'Accepted' OR status = 'Staff assigned' THEN 1 ELSE 0 END) AS accepted_requests,
         SUM(CASE WHEN status = 'Assistance completed' THEN 1 ELSE 0 END) AS completed_requests
       FROM assistance_requests WHERE passenger_id = ?`,
      [req.user.id]
    );

    const [requests] = await pool.query(
      `SELECT r.*, u.full_name AS staff_name, u.email AS staff_email
       FROM assistance_requests r
       LEFT JOIN users u ON u.id = r.assigned_staff_id
       WHERE r.passenger_id = ?
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );

    res.json({
      stats: stats[0],
      requests,
      notifications,
      welcome: `Welcome back, ${req.user.full_name.split(' ')[0]}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffDashboard = async (req, res, next) => {
  try {
    const [stats] = await pool.query(
      `SELECT
         COUNT(*) AS total_requests,
         SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
         SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted_requests,
         SUM(CASE WHEN status = 'Staff assigned' THEN 1 ELSE 0 END) AS assigned_requests,
         SUM(CASE WHEN status = 'Assistance completed' THEN 1 ELSE 0 END) AS completed_requests
       FROM assistance_requests`
    );

    const [requests] = await pool.query(
      `SELECT r.*, u.full_name as passenger_name,
              s.full_name as staff_name
       FROM assistance_requests r
       LEFT JOIN users u ON u.id = r.passenger_id
       LEFT JOIN users s ON s.id = r.assigned_staff_id
       ORDER BY r.created_at DESC LIMIT 20`
    );

    const [upcoming] = await pool.query(
      `SELECT * FROM assistance_requests
       WHERE travel_date >= CURDATE() AND status NOT IN ('Cancelled', 'Assistance completed')
       ORDER BY travel_date ASC LIMIT 10`
    );

    res.json({
      stats: stats[0],
      requests,
      upcoming,
      welcome: `Staff operations overview`,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [userStats] = await pool.query(
      `SELECT
         SUM(CASE WHEN role = 'passenger' THEN 1 ELSE 0 END) AS passengers,
         SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff,
         SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
       FROM users`
    );

    const [requestStats] = await pool.query(
      `SELECT
         COUNT(*) AS total_requests,
         SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
         SUM(CASE WHEN status = 'Assistance completed' THEN 1 ELSE 0 END) AS completed_requests,
         SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_requests
       FROM assistance_requests`
    );

    const [feedback] = await pool.query(
      `SELECT f.*, r.passenger_id, u.full_name
       FROM feedback f
       LEFT JOIN assistance_requests r ON r.id = f.request_id
       LEFT JOIN users u ON u.id = r.passenger_id
       ORDER BY f.created_at DESC LIMIT 10`
    );

    const [users] = await pool.query(
      `SELECT id, full_name, email, role, is_active, phone, preferred_contact_method, created_at
       FROM users
       ORDER BY created_at DESC LIMIT 50`
    );

    res.json({
      userStats: userStats[0],
      requestStats: requestStats[0],
      feedback,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, role, is_active, phone, preferred_contact_method, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (error) {
    next(error);
  }
};

export const updateUserAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators may manage user access.' });
    }

    const validRoles = ['passenger', 'staff', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'User role is invalid.' });
    }

    const [userRows] = await pool.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [id]);
    if (!userRows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await pool.query(
      'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
      [role || userRows[0].role, typeof is_active === 'boolean' ? is_active : !!userRows[0].is_active, id]
    );

    const [updatedRows] = await pool.query(
      'SELECT id, full_name, email, role, is_active, phone, preferred_contact_method FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    res.json({ message: 'User access updated successfully.', user: updatedRows[0] });
  } catch (error) {
    next(error);
  }
};
