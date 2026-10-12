USE preboarding_assistance;

INSERT INTO users (id, full_name, email, password_hash, phone, preferred_contact_method, role, is_active, created_at)
VALUES
  (1, 'Aline Mukamana', 'passenger@example.com', '$2b$10$DtR1dgXcSyaAx7FAySinpO9iquY/OfINW.bgUUtPB1ydnkHtWTNq6', '+250788111222', 'phone', 'passenger', TRUE, NOW()),
  (2, 'Samuel Niyonsenga', 'staff@example.com', '$2b$10$hXkbRaCNrxoea.6Y1SGW7ueAXLJXs1N0UFA0mdxsW8gIm7CQ7B5N2', '+250783333444', 'phone', 'staff', TRUE, NOW()),
  (3, 'Marie Uwimana', 'admin@example.com', '$2b$10$wqiQ1iK/305yqbNlFgyJGOtu8TXthwTlU7Y/gNKE1D8eDyFn6VP8e', '+250782222333', 'email', 'admin', TRUE, NOW());

INSERT INTO passenger_profiles (user_id, nationality, accessibility_notes, created_at, updated_at)
VALUES
  (1, 'Rwandan', 'Uses a wheelchair and needs clear verbal guidance during boarding.', NOW(), NOW());

INSERT INTO assistance_requests (
  id, passenger_id, assigned_staff_id, departure_point, destination, travel_date,
  preferred_departure_time, assistance_type, additional_instructions,
  preferred_contact_method, status, created_at, updated_at
)
VALUES
  (1, 1, 2, 'Kigali Bus Park', 'Kigali International Airport', '2026-10-18', '07:30:00', 'Wheelchair boarding support', 'Need a wheelchair assistance with a quiet boarding lane and clear instructions.', 'phone', 'Staff assigned', NOW(), NOW()),
  (2, 1, NULL, 'Nyabugogo Taxi Park', 'Kigali Convention Centre', '2026-10-20', '09:15:00', 'Visual guidance', 'Please guide me to the correct platform and show me the accessible route.', 'sms', 'Pending', NOW(), NOW());

INSERT INTO staff_assignments (id, request_id, staff_id, assigned_at, status)
VALUES
  (1, 1, 2, NOW(), 'active');

INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES
  (1, 1, 'Request submitted', 'Your assistance request has been submitted and is awaiting review.', 'request_submission', FALSE, NOW()),
  (2, 1, 'Staff assigned', 'A member of the assistance team has been assigned to your journey.', 'staff_assignment', FALSE, NOW());

INSERT INTO feedback (id, request_id, passenger_id, rating, comments, created_at)
VALUES
  (1, 1, 1, 5, 'Staff arrived on time and the boarding assistance was excellent.', NOW());
