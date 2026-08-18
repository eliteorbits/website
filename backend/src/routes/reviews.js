const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const VALID_CATEGORIES = ['flight', 'stay', 'car', 'general'];

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

// POST /api/reviews  (protected — must be logged in to submit a review)
router.post('/', requireAuth, (req, res) => {
  const { category, rating, comment } = req.body || {};

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be a whole number from 1 to 5.' });
  }
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'comment is required.' });
  }
  if (comment.trim().length > 600) {
    return res.status(400).json({ error: 'comment must be 600 characters or fewer.' });
  }

  const info = db
    .prepare(
      `INSERT INTO reviews (user_id, author_name, category, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    )
    .run(req.user.id, req.user.name, category, ratingNum, comment.trim());

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({
    review,
    note: 'Thanks! Your review is pending approval and will appear on the site once approved.',
  });
});

// GET /api/reviews?category=flight&limit=6&offset=0  — public, approved reviews only
router.get('/', (req, res) => {
  const { category, limit, offset } = req.query;
  const max = Math.min(Number(limit) || 20, 50);
  const start = Math.max(Number(offset) || 0, 0);
  const categoryFilter = category && VALID_CATEGORIES.includes(category) ? category : null;

  let countQuery = `SELECT COUNT(*) AS total FROM reviews WHERE status = 'approved'`;
  let query = `SELECT id, author_name, category, rating, comment, created_at FROM reviews WHERE status = 'approved'`;
  const params = [];
  if (categoryFilter) {
    countQuery += ' AND category = ?';
    query += ' AND category = ?';
    params.push(categoryFilter);
  }
  const { total } = db.prepare(countQuery).get(...params);

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const reviews = db.prepare(query).all(...params, max, start);

  res.json({ count: reviews.length, total, offset: start, limit: max, reviews });
});

// GET /api/reviews/admin/all  (admin key required) — every review regardless of status
router.get('/admin/all', requireAdminKey, (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json({ count: reviews.length, reviews });
});

// PATCH /api/reviews/admin/:id  (admin key required)  body: { status: 'approved' | 'rejected' }
router.patch('/admin/:id', requireAdminKey, (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: "status must be 'approved', 'rejected', or 'pending'." });
  }

  const existing = db.prepare('SELECT id FROM reviews WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Review not found.' });

  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  res.json({ review: updated });
});

module.exports = router;
