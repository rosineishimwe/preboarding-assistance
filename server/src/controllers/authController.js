import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

const normalizeName = (value) => (value || '').trim();

export const register = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      preferred_contact_method,
      nationality,
      role,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    if (role && ['staff', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Public registration is limited to passengers only.' });
    }

    const allowedContact = ['phone', 'email', 'sms', 'whatsapp'];
    const contactMethod = preferred_contact_method || 'phone';
    if (!allowedContact.includes(contactMethod)) {
      return res.status(400).json({ message: 'Preferred contact method is invalid.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, phone, preferred_contact_method, role, is_active) VALUES (?, ?, ?, ?, ?, ?, true)',
      [normalizeName(full_name), normalizedEmail, passwordHash, phone || null, contactMethod, 'passenger']
    );

    const userId = result.insertId;

    await pool.query(
      'INSERT INTO passenger_profiles (user_id, nationality, accessibility_notes, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userId, nationality || null, null]
    );

    const [userRows] = await pool.query(
      'SELECT id, full_name, email, role, phone, preferred_contact_method, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const user = userRows[0];
    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferred_contact_method: user.preferred_contact_method,
      },
      message: 'Passenger account created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, role, phone, preferred_contact_method, is_active FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferred_contact_method: user.preferred_contact_method,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, phone, preferred_contact_method, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );

  const user = rows[0];
  if (!user) {
    return res.status(404).json({ message: 'User profile not found.' });
  }

  res.json({ user });
};
