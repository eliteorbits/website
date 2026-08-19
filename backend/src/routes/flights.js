const express = require('express');
const router = express.Router();

// Real flight availability + live pricing, via the Amadeus Self-Service API.
// Setup instructions: see AMADEUS_SETUP_HINGLISH.md at the project root.
// Needs AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET env vars. Without them,
// both routes below return a clear 501 so the frontend can show a friendly
// message instead of a confusing crash.

const AMADEUS_BASE = process.env.AMADEUS_ENV === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com'; // free-tier "test" environment

let cachedToken = null; // { value, expiresAt }

async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error('Amadeus API keys are not configured.');
    err.code = 'NO_CREDENTIALS';
    throw err;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };
  return cachedToken.value;
}

// GET /api/flights/airports?keyword=del
// Autocomplete: airport/city name or IATA code -> list of real airports.
router.get('/airports', async (req, res) => {
  const keyword = (req.query.keyword || '').trim();
  if (keyword.length < 2) return res.json({ airports: [] });

  try {
    const token = await getAmadeusToken();
    const url = `${AMADEUS_BASE}/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword)}&page[limit]=8`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.errors?.[0]?.detail || 'Amadeus airport search failed');

    const airports = (data.data || []).map((a) => ({
      code: a.iataCode,
      name: a.name,
      city: a.address?.cityName,
      country: a.address?.countryName,
    }));
    res.json({ airports });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') {
      return res.status(501).json({ error: 'Live flight search is not configured yet.', airports: [] });
    }
    console.error('airport search failed:', err.message);
    res.status(502).json({ error: 'Could not search airports right now.', airports: [] });
  }
});

// GET /api/flights/search?origin=DEL&destination=BOM&date=2026-08-20&adults=1
// Real availability + live price for that exact date and route.
router.get('/search', async (req, res) => {
  const { origin, destination, date, adults } = req.query;
  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'origin, destination, and date are required.' });
  }

  try {
    const token = await getAmadeusToken();
    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate: date,
      adults: String(adults || 1),
      currencyCode: 'INR',
      max: '15',
    });
    const url = `${AMADEUS_BASE}/v2/shopping/flight-offers?${params.toString()}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.errors?.[0]?.detail || 'Amadeus flight search failed');

    const carriers = data.dictionaries?.carriers || {};
    const flights = (data.data || []).map((offer) => {
      const itin = offer.itineraries[0];
      const segs = itin.segments;
      const first = segs[0];
      const last = segs[segs.length - 1];
      return {
        id: offer.id,
        airline: carriers[first.carrierCode] || first.carrierCode,
        from: first.departure.iataCode,
        to: last.arrival.iataCode,
        departTime: first.departure.at,
        arriveTime: last.arrival.at,
        stops: segs.length - 1,
        durationISO: itin.duration,
        price: Number(offer.price.total),
        currency: offer.price.currency,
        seatsLeft: offer.numberOfBookableSeats,
      };
    });

    // Empty array here is the genuine, correct answer to "is that date
    // available" — the frontend should show "no flights on this date",
    // not a fallback/sample list.
    res.json({ flights, date, origin: origin.toUpperCase(), destination: destination.toUpperCase() });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') {
      return res.status(501).json({ error: 'Live flight search is not configured yet.', flights: [] });
    }
    console.error('flight search failed:', err.message);
    res.status(502).json({ error: 'Could not check flight availability right now. Please try again.', flights: [] });
  }
});

module.exports = router;
