# Railway se Render pe Backend Migrate Karna

Aapki Render service already ban chuki hai: `srv-d9kb6e6417fc73ehnpmg`.
Neeche steps follow karo taaki wahi service properly serve karne lage.

## Render sleep ka jawab (recap)

- **Free tier**: 15 min inactivity ke baad service sleep ho jaati hai, agli
  request pe ~50 second ka cold start lagta hai. Frontend me pehle se hi
  is case ka message dikhaya gaya hai ("backend may be waking up from sleep").
- **Sleep hatana ho** to Render dashboard me us service ko **Starter plan**
  (paid, ~$7/month) pe upgrade karna padega — tabhi 24x7 always-on rahegi.

## Step 1: Repo aur root settings check karo

Render dashboard → apni service (`srv-d9kb6e6417fc73ehnpmg`) → **Settings**:

- **Root Directory**: `backend`
- **Runtime**: Docker (Dockerfile already `backend/Dockerfile` me hai)
- **Branch**: jo bhi aapka main/master branch hai

## Step 2: Environment Variables set karo

**Environment** tab me ye add karo:

| Key | Value |
|---|---|
| `JWT_SECRET` | Koi lamba random string |
| `ADMIN_KEY` | Private random string (reviews approve/reject ke liye) |
| `CORS_ORIGIN` | Aapki live website ka domain, jaise `https://eliteorbits.com` |
| `DATABASE_FILE` | `./data/eliteorbits.db` |
| `GOOGLE_SHEET_WEBHOOK_URL` | `GOOGLE_SHEETS_SETUP.md` wala Apps Script URL |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT` | (optional) email confirmation ke liye |

## Step 3: Deploy

Save karte hi Render naya build+deploy start kar degi. Dashboard ke top pe
live URL milega, jaise:
```
https://elite-orbits-xxxx.onrender.com
```

## Step 4: Frontend ko naye URL se connect karo

`frontend/app.js` ki line 2 me:

```js
const API_BASE_URL = 'https://website-production-92e6.up.railway.app/api';
```

isko replace karo:

```js
const API_BASE_URL = 'https://elite-orbits-xxxx.onrender.com/api';
```

(Apna actual Render URL daalna, `/api` sath rakhna.) Save karke GitHub pe
push kar do — live site automatically naye backend se baat karne lagegi.

## Zaroori baat: SQLite storage

Render ka filesystem bhi temporary hai — jab bhi naya code deploy hota hai,
`eliteorbits.db` file (users/bookings) reset ho sakti hai. Abhi ke liye theek
hai, lekin real business ke liye baad me proper hosted database (Render
Postgres, ya koi cloud DB) lagana better rahega. Jab chaho, bata dena — setup
kar dunga.

## Ek cheez batao

Aapka **actual Render URL** (jo abhi `srv-d9kb6e6417fc73ehnpmg` service ka
live URL hai) bhej do, to main `frontend/app.js` me khud update karke final
zip bana dunga — abhi maine placeholder rakha hai.
