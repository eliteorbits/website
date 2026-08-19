# Real Flight Availability + Live Price (Amadeus API) Setup

Ab flights page pe ye genuinely kaam karta hai:
1. Customer "From" me city/airport type karta hai → real airport list dropdown me aata hai → wahi select karta hai (koi galat airport nahi choose ho sakta).
2. "To" ke liye bhi wahi.
3. Departure date choose karta hai.
4. **"Check Availability"** click karte hi backend Amadeus se poochta hai: "is exact date pe is route pe flight hai ya nahi" — agar hai to real airline, time, aur real price dikhta hai. Agar nahi hai to saaf message aata hai "No flights found on [date]".

Iske liye Amadeus ka **free Self-Service API** use kiya hai. Setup karna hoga:

## Step 1: Amadeus Developer account banao

1. **developers.amadeus.com** pe jao → **Register** karo (free)
2. Email verify karo, login karo

## Step 2: Naya App banao

1. Dashboard me **My Apps → Create New App**
2. App ka naam de do, jaise `Elite Orbits`
3. Banne ke baad tumhe milega:
   - **API Key** (ye `AMADEUS_CLIENT_ID` hai)
   - **API Secret** (ye `AMADEUS_CLIENT_SECRET` hai)

## Step 3: Render env vars me daalo

Render dashboard → backend service → **Environment**:

| Key | Value |
|---|---|
| `AMADEUS_CLIENT_ID` | Step 2 wali API Key |
| `AMADEUS_CLIENT_SECRET` | Step 2 wali API Secret |

(`AMADEUS_ENV` set mat karo — default free "test" environment use hoga.)

Save karte hi Render service restart ho jayegi.

## ⚠️ Zaroori: Free "Test" environment ki limits

- Free tier **test environment** me data **real hota hai lekin limited routes/airlines** ke liye hota hai — sab duniya ki har flight yaha nahi milegi (khaaskar chhote domestic routes India me kam milte hain).
- Free tier me **~2000 calls/month** free milte hain (flight search + airport search dono milaake).
- Production/live full-data access ke liye Amadeus ka **"Move to Production"** process hai (paid, thoda approval lagta hai) — abhi ke liye test environment se start karna sahi rahega, dekh lo results kaise aa rahe hain.

## Test kaise karo

Deploy hone ke baad flights page pe koi popular route try karo (jaise **DEL** se **BOM**, ya **JFK** se **LAX**) kisi aane wale date ke sath. Agar "airport search unavailable" ya "not configured" dikhe, to Render ke **Logs** tab check karo — key galat set hui ya nahi wahan pata chalega.

## Agar aage jaake full/production data chahiye

Jab business badh jaye aur sab routes/real-time prices chahiye ho (jaise MakeMyTrip level), Amadeus **Production** access ya koi aur paid provider (Skyscanner, Duffel, Travelport) lena padega — us waqt bata dena, migrate kar dunga.
