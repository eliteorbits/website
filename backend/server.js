require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const contactRoutes = require('./src/routes/contact');
const searchRoutes = require('./src/routes/search');
const bookingsRoutes = require('./src/routes/bookings');
const reviewsRoutes = require('./src/routes/reviews');
const db = require('./src/db');
const { seedReviews } = require('./src/seedReviews');

// Load the real customer reviews on first boot (only if the table is
// currently empty — never overwrites reviews already there, including
// ones submitted later through the site).
try {
  const result = seedReviews(db);
  if (result.seeded) {
    console.log(`Seeded ${result.count} real customer reviews (table was empty).`);
  }
} catch (err) {
  console.error('Review seeding skipped due to an error:', err.message);
}

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'elite-orbits-backend', message: 'API is running. See /api/health.' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'elite-orbits-backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews', reviewsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Elite Orbits backend running on http://0.0.0.0:${PORT}`);
});
