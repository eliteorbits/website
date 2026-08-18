const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const VALID_TYPES = ['flight', 'stay', 'car'];

function generateReference() {
  return 'EO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: 'ADMIN_KEY is not configured on the server.' });
  }
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid or missing admin key.' });
  }
  next();
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } catch (err) {
    console.error('Failed to create email transporter (check SMTP env vars):', err.message);
    return null;
  }
}

const CURRENCY_SYMBOL = { INR: '₹', USD: '$', CAD: 'C$' };

// Logs every booking as a new row in a Google Sheet, via a Google Apps
// Script "Web App" that you deploy yourself (see GOOGLE_SHEETS_SETUP.md).
// If GOOGLE_SHEET_WEBHOOK_URL isn't set, this quietly does nothing — it
// never blocks or breaks the booking itself.
async function logBookingToGoogleSheet({ user, type, reference, details, price, currency }) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference,
        type,
        customerName: user.name || '',
        customerEmail: user.email || '',
        details: summarizeDetails(type, details),
        price,
        currency: currency || 'INR',
        createdAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('logBookingToGoogleSheet failed:', err.message);
  }
}

function summarizeDetails(type, details) {
  if (type === 'flight') return `${details.from || ''} → ${details.to || ''}${details.airline ? ' · ' + details.airline : ''}`;
  if (type === 'stay') return `${details.name || details.city || ''}${details.city ? ' · ' + details.city : ''}`;
  if (type === 'car') return `${details.category || ''}${details.city ? ' · ' + details.city : ''}`;
  return JSON.stringify(details);
}

async function sendBookingEmails({ user, type, reference, details, price, currency }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const summary = summarizeDetails(type, details);
  const priceStr = `${CURRENCY_SYMBOL[currency] || ''}${price}`;
  const fromAddr = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

  // Confirmation to the customer
  if (user.email) {
    transporter.sendMail({
      from: fromAddr,
      to: user.email,
      subject: `Booking confirmed — ${reference}`,
      text: `Hi ${user.name || ''},\n\nYour ${type} booking is confirmed.\n\nReference: ${reference}\n${summary}\nPrice: ${priceStr}\n\nThanks for booking with Elite Orbits.`,
    }).catch((err) => console.error('Failed to send booking confirmation email:', err.message));
  }

  // Notification to the site owner/admin
  if (process.env.CONTACT_TO_EMAIL) {
    transporter.sendMail({
      from: fromAddr,
      to: process.env.CONTACT_TO_EMAIL,
      subject: `New booking — ${reference} (${type})`,
      text: `New booking made.\n\nCustomer: ${user.name || ''} <${user.email || ''}>\nType: ${type}\nReference: ${reference}\n${summary}\nPrice: ${priceStr}`,
    }).catch((err) => console.error('Failed to send admin booking notification:', err.message));
  }
}

// POST /api/bookings  (protected)
// body: { type: 'flight'|'stay'|'car', details: {...}, price: number, currency?: string }
router.post('/', requireAuth, async (req, res) => {
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

  // Fire-and-forget: never let an email problem affect the booking response,
  // and never let it become an unhandled rejection that could crash the process.
  try {
    sendBookingEmails({
      user: req.user,
      type,
      reference,
      details,
      price,
      currency: currency || 'INR',
    }).catch((err) => console.error('sendBookingEmails failed:', err.message));
  } catch (err) {
    console.error('sendBookingEmails threw synchronously:', err.message);
  }

  // Same fire-and-forget pattern for the Google Sheet log.
  try {
    logBookingToGoogleSheet({
      user: req.user,
      type,
      reference,
      details,
      price,
      currency: currency || 'INR',
    }).catch((err) => console.error('logBookingToGoogleSheet failed:', err.message));
  } catch (err) {
    console.error('logBookingToGoogleSheet threw synchronously:', err.message);
  }

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

// GET /api/bookings/admin/all  (admin key required) — every booking, across all customers
router.get('/admin/all', requireAdminKey, (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email
       FROM bookings b JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC`
    )
    .all();

  const bookings = rows.map((b) => ({ ...b, details: JSON.parse(b.details) }));
  res.json({ count: bookings.length, bookings });
});

module.exports = router;
