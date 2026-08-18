const express = require('express');
const flights = require('../../data/flights.json');
const stays = require('../../data/stays.json');
const cars = require('../../data/cars.json');

const router = express.Router();
const MEMBER_DISCOUNT = 0.4; // 40% off, applied across flights, stays, and cars

function round2(n) {
  return Math.round(n * 100) / 100;
}

// GET /api/search/flights?country=india&from=DEL&to=BOM
router.get('/flights', (req, res) => {
  const { country, from, to } = req.query;

  let results = flights;
  if (country) results = results.filter((f) => f.country === String(country).toLowerCase());
  if (from) results = results.filter((f) => f.from === String(from).toUpperCase());
  if (to) results = results.filter((f) => f.to === String(to).toUpperCase());

  const withPricing = results.map((f) => ({
    ...f,
    memberPrice: round2(f.basePrice * (1 - MEMBER_DISCOUNT)),
    discountPercent: MEMBER_DISCOUNT * 100,
  }));

  res.json({ count: withPricing.length, results: withPricing });
});

// GET /api/search/stays?country=india&city=Goa
router.get('/stays', (req, res) => {
  const { country, city } = req.query;

  let results = stays;
  if (country) results = results.filter((s) => s.country === String(country).toLowerCase());
  if (city) results = results.filter((s) => s.city.toLowerCase() === String(city).toLowerCase());

  const withPricing = results.map((s) => ({
    ...s,
    ourPrice: round2(s.standardPrice * (1 - MEMBER_DISCOUNT)),
    savings: round2(s.standardPrice * MEMBER_DISCOUNT),
    savingsPercent: MEMBER_DISCOUNT * 100,
  }));

  res.json({ count: withPricing.length, results: withPricing });
});

// GET /api/search/cars?country=usa&city=Miami
router.get('/cars', (req, res) => {
  const { country, city } = req.query;

  let results = cars;
  if (country) results = results.filter((c) => c.country === String(country).toLowerCase());
  if (city) results = results.filter((c) => c.city.toLowerCase() === String(city).toLowerCase());

  const withPricing = results.map((c) => ({
    ...c,
    dailyRate: round2(c.standardDailyRate * (1 - MEMBER_DISCOUNT)),
    discountPercent: MEMBER_DISCOUNT * 100,
  }));

  res.json({ count: withPricing.length, results: withPricing });
});

module.exports = router;
