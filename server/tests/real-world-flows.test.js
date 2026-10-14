import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

const createUser = async ({ full_name, email, password, role = 'passenger', phone = '0788000000' }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, phone, preferred_contact_method, role, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
    [full_name, email, passwordHash, phone, 'phone', role]
  );

  return { id: result.insertId, email, full_name, password, role };
};

test('health endpoint is available', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.match(response.body.message, /Pre-Boarding Assistance API/i);
});

test('public contact endpoint returns organization-safe information', async () => {
  const response = await request(app).get('/api/public/contact');
  assert.equal(response.status, 200);
  assert.ok(response.body.organization_name);
  assert.ok('email_configured' in response.body);
  assert.ok('phone_configured' in response.body);
});

test('passenger can register and login securely', async () => {
  const email = uniqueEmail('register-user');
  const password = 'StrongPass123!';

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      full_name: 'Test Passenger',
      email,
      password,
      phone: '0788123456',
      preferred_contact_method: 'phone',
    });

  assert.equal(registerResponse.status, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.email, email);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.token);
  assert.equal(loginResponse.body.user.email, email);
});

test('passenger can submit a request with a generated reference number', async () => {
  const passenger = await createUser({
    full_name: 'Request Passenger',
    email: uniqueEmail('request-passenger'),
    password: 'StrongPass123!',
    role: 'passenger',
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: passenger.email, password: passenger.password });

  assert.equal(loginResponse.status, 200);

  const response = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${loginResponse.body.token}`)
    .send({
      departure_point: 'Kigali Airport',
      destination: 'Kigali City Center',
      travel_date: '2026-10-20',
      preferred_departure_time: '08:30',
      assistance_type: 'Wheelchair boarding support',
      additional_instructions: 'Need wheelchair and clear boarding instructions.',
      preferred_contact_method: 'phone',
    });

  assert.equal(response.status, 201);
  assert.match(response.body.reference_number, /^NCPD-/);
  assert.ok(response.body.request);
  assert.equal(response.body.request.passenger_email, passenger.email);
});

test('staff member can be assigned to a passenger request', async () => {
  const passenger = await createUser({
    full_name: 'Assign Passenger',
    email: uniqueEmail('assign-passenger'),
    password: 'StrongPass123!',
    role: 'passenger',
  });

  const staff = await createUser({
    full_name: 'Staff Member',
    email: uniqueEmail('assign-staff'),
    password: 'StrongPass123!',
    role: 'staff',
  });

  const passengerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: passenger.email, password: passenger.password });

  const createRequest = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${passengerLogin.body.token}`)
    .send({
      departure_point: 'Kigali Station',
      destination: 'Kigali Central Market',
      travel_date: '2026-11-02',
      preferred_departure_time: '10:00',
      assistance_type: 'Mobility assistance',
      additional_instructions: 'Need escort from platform to exit.',
      preferred_contact_method: 'phone',
    });

  assert.equal(createRequest.status, 201);

  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: staff.email, password: staff.password });

  const assignResponse = await request(app)
    .post(`/api/requests/${createRequest.body.request.id}/assign`)
    .set('Authorization', `Bearer ${staffLogin.body.token}`)
    .send({ staff_id: staff.id });

  assert.equal(assignResponse.status, 200);
  assert.equal(assignResponse.body.request.assigned_staff_id, staff.id);
});

test('passenger cannot view another passenger request', async () => {
  const firstPassenger = await createUser({
    full_name: 'First Passenger',
    email: uniqueEmail('first-passenger'),
    password: 'StrongPass123!',
    role: 'passenger',
  });

  const secondPassenger = await createUser({
    full_name: 'Second Passenger',
    email: uniqueEmail('second-passenger'),
    password: 'StrongPass123!',
    role: 'passenger',
  });

  const firstLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: firstPassenger.email, password: firstPassenger.password });

  const requestResponse = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${firstLogin.body.token}`)
    .send({
      departure_point: 'Kigali Airport',
      destination: 'Nyabugogo',
      travel_date: '2026-12-11',
      preferred_departure_time: '14:15',
      assistance_type: 'Visual guidance',
      additional_instructions: 'Need guide assistance.',
      preferred_contact_method: 'phone',
    });

  const secondLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: secondPassenger.email, password: secondPassenger.password });

  const forbiddenResponse = await request(app)
    .get(`/api/requests/${requestResponse.body.request.id}`)
    .set('Authorization', `Bearer ${secondLogin.body.token}`);

  assert.equal(forbiddenResponse.status, 403);
});

test('assigned staff can update a request status', async () => {
  const passenger = await createUser({
    full_name: 'Status Passenger',
    email: uniqueEmail('status-passenger'),
    password: 'StrongPass123!',
    role: 'passenger',
  });

  const staff = await createUser({
    full_name: 'Status Staff',
    email: uniqueEmail('status-staff'),
    password: 'StrongPass123!',
    role: 'staff',
  });

  const passengerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: passenger.email, password: passenger.password });

  const createRequest = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${passengerLogin.body.token}`)
    .send({
      departure_point: 'Kigali City',
      destination: 'Rubavu',
      travel_date: '2026-11-22',
      preferred_departure_time: '09:00',
      assistance_type: 'Station or boarding-point guidance',
      additional_instructions: 'Need help with gate directions.',
      preferred_contact_method: 'phone',
    });

  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: staff.email, password: staff.password });

  const assignResponse = await request(app)
    .post(`/api/requests/${createRequest.body.request.id}/assign`)
    .set('Authorization', `Bearer ${staffLogin.body.token}`)
    .send({ staff_id: staff.id });

  assert.equal(assignResponse.status, 200);

  const statusResponse = await request(app)
    .patch(`/api/requests/${createRequest.body.request.id}`)
    .set('Authorization', `Bearer ${staffLogin.body.token}`)
    .send({ status: 'In Progress' });

  assert.equal(statusResponse.status, 200);
  assert.equal(statusResponse.body.request.status, 'In Progress');
});

process.on('exit', async () => {
  await pool.end();
});
