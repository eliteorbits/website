/**
 * seedReviews.js
 *
 * Shared logic for loading Elite Orbits' real customer reviews into the
 * `reviews` table. Used two ways:
 *
 *  - On every server boot (server.js), in "seed only if empty" mode —
 *    so the real reviews appear automatically the first time the app
 *    deploys, without needing shell/SSH access to the production server.
 *    It never touches the table again once it has any rows, so it will
 *    not wipe out real reviews submitted later through the site.
 *
 *  - Via `node seed-reviews.js` (force mode) — for local development or
 *    to intentionally reset the table back to just this list.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const REVIEWS_DATA = require('./data/reviewsSeedData');

const SEED_USER_EMAIL = 'verified-reviews@eliteorbits.internal';
const SEED_USER_NAME = 'Elite Orbits Verified Customers';

function getOrCreateSeedUser(db) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(SEED_USER_EMAIL);
  if (existing) return existing.id;

  const passwordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(SEED_USER_NAME, SEED_USER_EMAIL, passwordHash);
  return info.lastInsertRowid;
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ force?: boolean }} options - force=true clears the table first
 *   and always re-inserts. force=false (default) only seeds if the table
 *   is currently empty.
 * @returns {{ seeded: boolean, count: number }}
 */
function seedReviews(db, { force = false } = {}) {
  const { count: existingCount } = db.prepare('SELECT COUNT(*) AS count FROM reviews').get();

  if (!force && existingCount > 0) {
    return { seeded: false, count: existingCount };
  }

  const seedUserId = getOrCreateSeedUser(db);

  if (force) {
    db.exec('DELETE FROM reviews');
  }

  const insert = db.prepare(`
    INSERT INTO reviews (user_id, author_name, category, rating, comment, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(seedUserId, ...row);
  });

  insertMany(REVIEWS_DATA);

  return { seeded: true, count: REVIEWS_DATA.length };
}

module.exports = { seedReviews };
