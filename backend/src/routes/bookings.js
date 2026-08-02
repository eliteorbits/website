const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const VALID_TYPES = ['flight', 'stay', 'car'];

function generateReference() {
  return 'EO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// POST /api/bookings  (protected)
// body: { type: 'flight'|'stay'|'car', details: {...}, price: number, currency?: string }
router.post('/', requireAuth, (req, res) => {
  const { type, details, price, currency } = req.body || {};

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (!details || typeof details !== 'object') {
    return res.status(400).json({ error: 'details object is required.' });
  }
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number.' });
  }

  const reference = generateReference();
  const info = db
    .prepare(
      `INSERT INTO bookings (user_id, type, reference, details, price, currency)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, type, reference, JSON.stringify(details), price, currency || 'INR');

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ booking: { ...booking, details: JSON.parse(booking.details) } });
});

// GET /api/bookings  (protected) — list the logged-in user's bookings
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);

  const bookings = rows.map((b) => ({ ...b, details: JSON.parse(b.details) }));
  res.json({ count: bookings.length, bookings });
});

module.exports = router;
