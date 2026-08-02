/**
 * seed-reviews.js
 *
 * Manually (re)loads Elite Orbits' real customer reviews into the database.
 * This clears the `reviews` table and re-inserts the full list — use it to
 * force a reset back to just these reviews (e.g. in local development).
 *
 * Usage (from the backend/ folder):
 *   node seed-reviews.js
 *
 * Note: in production you don't need to run this manually — the server
 * seeds these reviews automatically on first boot if the table is empty
 * (see src/seedReviews.js). This script is for forcing a full reset.
 */

const db = require('./src/db');
const { seedReviews } = require('./src/seedReviews');

const result = seedReviews(db, { force: true });
console.log(`Seeded ${result.count} real customer reviews into the database.`);
