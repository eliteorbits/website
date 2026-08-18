# Elite Orbits — Backend API

Node.js + Express + SQLite backend for the Elite Orbits website. Covers:

- User signup / login (JWT-based)
- Contact form (saved to DB, optionally emailed via SMTP)
- Flight / stay / car search (dummy data for now — swap for a real API later)
- Bookings (create + list, tied to the logged-in user)

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Open `.env` and set at minimum:
- `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`)
- `CORS_ORIGIN` — the URL(s) your frontend runs on

SMTP settings are optional. If left blank, contact messages are still saved to the database — they just won't be emailed anywhere.

## 3. Run

```bash
npm start
```

The API runs at `http://localhost:4000` by default. A SQLite database file is created automatically at `data/eliteorbits.db` on first run — no separate database server needed.

For auto-restart on file changes during development:

```bash
npm run dev
```

### Loading the real customer reviews

The homepage and `/reviews.html` page read from the `reviews` table. **These real, client-provided reviews load automatically the first time the server starts against an empty database** — no manual step needed, even on a host like Render where you don't have shell access. It only seeds when the table is completely empty, so it will never overwrite or delete reviews submitted later through the site.

If you ever want to force a full reset back to just this list (e.g. in local development), run:

```bash
npm run seed:reviews
```

This clears the `reviews` table and re-inserts the full list — only use it if you're okay discarding any other reviews currently in the table.

## API Reference

All request/response bodies are JSON. Protected routes require an `Authorization: Bearer <token>` header (token returned from signup/login).

### Auth

**POST `/api/auth/signup`**
```json
{ "name": "Priya Shah", "email": "priya@example.com", "password": "at least 8 chars" }
```
→ `201` `{ "token": "...", "user": { "id": 1, "name": "...", "email": "..." } }`

**POST `/api/auth/login`**
```json
{ "email": "priya@example.com", "password": "..." }
```
→ `200` `{ "token": "...", "user": {...} }`

**GET `/api/auth/me`** *(protected)*
→ `200` `{ "user": { "id": 1, "name": "...", "email": "...", "created_at": "..." } }`

### Contact

**POST `/api/contact`**
```json
{ "name": "Priya Shah", "email": "priya@example.com", "topic": "A flight booking", "message": "..." }
```
→ `201` `{ "ok": true, "emailed": false, "note": "..." }`

### Search *(dummy data — replace with a real provider later)*

**GET `/api/search/flights?country=india&from=DEL&to=BOM`**
All query params optional. `country` is `india` | `usa` | `canada`.
→ `200` `{ "count": 1, "results": [{ "id": "fl_del_bom", "from": "DEL", "to": "BOM", "basePrice": 6400, "memberPrice": 5120, "discountPercent": 20, ... }] }`

**GET `/api/search/stays?country=india&city=Goa`**
→ `200` `{ "count": 1, "results": [{ "id": "st_goa_3bhk", "standardPrice": 18200, "ourPrice": 14600, "savings": 3600, "savingsPercent": 19.78, ... }] }`

**GET `/api/search/cars?country=usa&city=Miami`**
→ `200` `{ "count": 1, "results": [{ "id": "car_mia_convertible", "dailyRate": 89, "currency": "USD", ... }] }`

### Bookings *(protected)*

**POST `/api/bookings`**
```json
{
  "type": "flight",
  "details": { "from": "DEL", "to": "BOM", "date": "2026-09-12" },
  "price": 5120,
  "currency": "INR"
}
```
`type` must be `flight`, `stay`, or `car`.
→ `201` `{ "booking": { "id": 1, "reference": "EO-9F3A2B10", "type": "flight", "details": {...}, "price": 5120, "status": "confirmed", ... } }`

**GET `/api/bookings`**
→ `200` `{ "count": 2, "bookings": [ {...}, {...} ] }`

### Reviews

**POST `/api/reviews`** *(protected — must be logged in)*
```json
{ "category": "flight", "rating": 5, "comment": "Great fare, no hassle." }
```
`category` is `flight` | `stay` | `car` | `general`. New reviews start as `pending` and won't show publicly until approved.
→ `201` `{ "review": {...}, "note": "..." }`

**GET `/api/reviews?category=flight&limit=6`** — public, approved reviews only
→ `200` `{ "count": 2, "reviews": [{ "id": 1, "author_name": "...", "category": "flight", "rating": 5, "comment": "...", "created_at": "..." }] }`

**GET `/api/reviews/admin/all`** *(requires `X-Admin-Key` header matching `ADMIN_KEY` in `.env`)* — every review, any status
→ `200` `{ "count": 5, "reviews": [...] }`

**PATCH `/api/reviews/admin/:id`** *(requires `X-Admin-Key` header)*
```json
{ "status": "approved" }
```
`status` is `approved` | `rejected` | `pending`.
→ `200` `{ "review": {...} }`

The frontend's `admin-reviews.html` page is a lightweight UI for the two admin endpoints above — open it, paste in your `ADMIN_KEY`, and approve/reject from there.

## Connecting the frontend

In the frontend files, set the API base URL near the top of the relevant `<script>` block, e.g.:

```js
const API_BASE_URL = 'http://localhost:4000/api';
```

Then call it with `fetch`, for example on signup:

```js
const res = await fetch(`${API_BASE_URL}/auth/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password }),
});
const data = await res.json();
localStorage.setItem('eo_token', data.token);
```

Once you're ready to go live, deploy this backend (Render, Railway, Fly.io, a VPS, etc.), point `CORS_ORIGIN` at your real frontend domain, and update `API_BASE_URL` in the frontend to the deployed backend URL.

## What's still a placeholder

- **Flights / stays / cars** come from local JSON files in `data/`, not a real supplier. Swap `src/routes/search.js` for calls to a real API (e.g. Amadeus for flights, a hotel/Airbnb-partner API for stays, a rental API for cars) when you're ready.
- **Payments** are not implemented — bookings are recorded as "confirmed" without taking any payment. Add a payment provider (Stripe, Razorpay, etc.) before this handles real money.
- **Email** only sends if you configure SMTP credentials in `.env`.
