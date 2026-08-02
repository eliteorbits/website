# Backend ko Back4app pe Deploy Karna (Free, No Card)

Ye guide tumhare `elite-orbits/backend` folder ko ek real live URL de degi (jaise `https://elite-orbits-xxxx.back4app.io`), jisse tumhari live website (GitHub Pages + tumhara domain) ka Flights/Stays/Cars search aur login/signup **sabke liye** kaam karega, na sirf tumhare apne computer pe.

## Step 1: Backend ko GitHub pe push karo

Agar poora `elite-orbits` folder pehle se GitHub pe hai, to koi extra step nahi — bas latest files push kar do (ye Dockerfile bhi isi commit mein honi chahiye):

```bash
cd elite-orbits
git add .
git commit -m "Add Dockerfile for backend deployment"
git push
```

Agar GitHub pe nahi hai abhi, to GitHub.com pe naya repository banao aur poora `elite-orbits` folder usme push kar do.

## Step 2: Back4app pe account banao

1. **back4app.com** pe jao
2. "Sign Up" → GitHub se sign up kar lo (fastest way)
3. Koi card nahi maangega is step mein

## Step 3: Naya Container App banao

1. Dashboard mein **"New App"** click karo
2. **"Container"** option select karo (Backend-as-a-Service nahi — Container wala)
3. **"Import from GitHub"** choose karo
4. Apna GitHub account connect/authorize karo agar pehli baar hai
5. Apna `elite-orbits` repository select karo
6. Branch select karo (`main` ya `master`)

## Step 4: Dockerfile path set karo

Kyunki tumhare repo mein `frontend` aur `backend` dono folders hain, Back4app ko batana hoga ki Dockerfile kaha hai:

- **Dockerfile path / Root directory**: `backend`

(Ye setting deployment configure karte waqt dikhegi — agar naam thoda alag ho jaise "Context Directory" ya "Build Path", wahi `backend` daal dena)

## Step 5: Environment variables add karo

Deployment form mein ye env vars add karo:

| Key | Value |
|---|---|
| `JWT_SECRET` | Koi bhi lamba random string, jaise `myEliteOrbits2026SuperSecretKey123` |
| `ADMIN_KEY` | Koi bhi private random string — isse tum reviews approve/reject karogi, kisi ke saath share mat karna |
| `CORS_ORIGIN` | Tumhara live domain, jaise `https://tumhara-domain.com` |
| `DATABASE_FILE` | `./data/eliteorbits.db` |

(SMTP wale optional hain, contact form ke email ke liye baad mein add kar sakti ho)

## Step 6: Deploy karo

**"Create App"** ya **"Deploy"** button click karo. Kuch minutes lagenge. Deploy hone ke baad, dashboard ke top-left mein tumhe ek **live URL** milega, jaise:

```
https://elite-orbits-abc123.back4app.io
```

## Step 7: Frontend ko is URL se connect karo

Ye sabse important step hai. Apne code editor mein (ya GitHub pe directly edit karke) in files mein `API_BASE_URL` ki line dhundo aur `http://localhost:4000/api` ko apne naye Back4app URL se replace karo:

**File `frontend/app.js`** (line ~2):
```js
const API_BASE_URL = 'https://elite-orbits-abc123.back4app.io/api';
```

**In files mein bhi wahi line change karo** (inme API_BASE_URL alag se likha hai):
- `frontend/index.html`
- `frontend/login.html`
- `frontend/signup.html`
- `frontend/contact.html`

Phir GitHub pe push kar do — tumhari live website automatically update ho jayegi.

## Ek zaroori baat (SQLite storage)

Container platforms (Back4app, Render, Railway — sab) ka filesystem **temporary** hota hai — matlab agar tum backend ko redeploy karti ho (naya code push), to SQLite database file (`eliteorbits.db`) mein saved users/bookings **delete ho sakte hain**. Ye abhi ke liye theek hai testing ke liye, lekin real business ke liye baad mein ek proper hosted database (jaise Back4app ka khud ka database service, ya PostgreSQL) use karna behtar hoga. Jab wo step aaye tab bata dena, madad kar dungi.

## Agar Docker deployment mein error aaye

- Error logs Back4app dashboard mein hi dikhte hain, wahi se problem samajh aa jayegi
- Common issue: agar "Dockerfile path" `backend` set nahi kiya to build fail hoga (root mein Dockerfile nahi milegi)
- Doubt ho to error message paste kar dena, main dekh lungi
