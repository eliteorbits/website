const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../db');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, topic, message } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });

  db.prepare(
    'INSERT INTO contact_messages (name, email, topic, message) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), email.toLowerCase(), topic || null, message.trim());

  const transporter = getTransporter();
  let emailed = false;

  if (transporter && process.env.CONTACT_TO_EMAIL) {
    try {
      await transporter.sendMail({
        from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
        to: process.env.CONTACT_TO_EMAIL,
        replyTo: email,
        subject: `New contact form message — ${topic || 'General'}`,
        text: `From: ${name} <${email}>\nTopic: ${topic || 'N/A'}\n\n${message}`,
      });
      emailed = true;
    } catch (err) {
      console.error('Failed to send contact email:', err.message);
    }
  }

  res.status(201).json({
    ok: true,
    emailed,
    note: emailed
      ? 'Message saved and emailed to support.'
      : 'Message saved. Email delivery is not configured yet (set SMTP_* in .env).',
  });
});

module.exports = router;
