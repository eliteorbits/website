# Elite Orbits — Full Project

```
elite-orbits/
├── frontend/     Static site (open index.html, or serve with any static server)
└── backend/      Node.js + Express + SQLite API (auth, contact, search, bookings)
```

## Quickest way to try it end-to-end

1. **Start the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env      # edit JWT_SECRET at minimum
   npm start
   ```
   Runs at `http://localhost:4000`.

2. **Serve the frontend** (don't just double-click the files — signup/login use `localStorage` and `fetch`, which behave better served over http). From the `frontend/` folder:
   ```bash
   npx serve .
   ```
   or use the VS Code "Live Server" extension, or any static file server.

3. Open the frontend URL, go to **Sign Up**, create an account, then try the **Contact** form — both talk to the backend you started in step 1.

See `backend/README.md` for the full API reference and notes on what's still a placeholder (real flight/stay/car data, and payments).
