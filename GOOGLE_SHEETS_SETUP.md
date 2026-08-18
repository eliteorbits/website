# Bookings ko Google Sheet me Auto-Save Karna (Free)

Ye setup karne ke baad, jab bhi koi customer website pe "Book Now" click karega,
uski booking details automatically ek Google Sheet me ek nayi row ban jayengi
(WhatsApp chat alag se khulegi, uska data auto-save nahi hota — sirf yahi
booking-form wala data save hoga).

## Step 1: Naya Google Sheet banao

1. **sheets.google.com** pe jao → naya blank sheet banao
2. Sheet ka naam de do, jaise `Elite Orbits Bookings`
3. Pehli row me ye headers type kar do (A1 se H1 tak):
   `Reference | Type | Customer Name | Customer Email | Details | Price | Currency | Created At`

## Step 2: Apps Script khol ke code paste karo

1. Sheet ke top menu me **Extensions → Apps Script** click karo
2. Jo default code hai use delete karke ye poora code paste kar do:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.reference || '',
    data.type || '',
    data.customerName || '',
    data.customerEmail || '',
    data.details || '',
    data.price || '',
    data.currency || '',
    data.createdAt || new Date().toISOString()
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Save kar do (disk icon, ya Ctrl+S) — project ko koi bhi naam de do jaise `Bookings Logger`

## Step 3: Web App ke roop me Deploy karo

1. Top-right **Deploy → New deployment** click karo
2. Gear/settings icon (⚙️) pe click karke type me **Web app** choose karo
3. Settings:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (ye zaroori hai, warna backend request bhej hi nahi payega)
4. **Deploy** click karo
5. Pehli baar authorize karne ko kahega — apna Google account choose karo → "Advanced" → "Go to Bookings Logger (unsafe)" → Allow (ye warning normal hai, kyunki ye tumhara khud ka script hai)
6. Deploy hone ke baad ek **Web app URL** milega, kuch aisa:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   **Ise copy kar lo** — yehi tumhara `GOOGLE_SHEET_WEBHOOK_URL` hai.

## Step 4: Ye URL Render ke environment variable me daalo

Render dashboard → apni backend service → **Environment** tab → naya variable add karo:

| Key | Value |
|---|---|
| `GOOGLE_SHEET_WEBHOOK_URL` | (Step 3 wala Web App URL, `/exec` tak) |

Save karte hi Render service khud restart ho jayegi.

## Test kaise kare

Website pe koi bhi flight/stay/car "Book Now" karo (login karke) — 5-10 second me
Google Sheet me nayi row aa jani chahiye. Agar na aaye:
- Render ke **Logs** tab me `logBookingToGoogleSheet failed` dhundo, error waha dikhega
- Apps Script deployment me "Who has access: Anyone" set hai ya nahi dobara check karo

## Baad me agar script code update karna ho

Apps Script editor me code change karne ke baad **Deploy → Manage deployments →
pencil icon → Version: New version → Deploy** karna padega (naya deployment
banane se URL badal jayega, isliye "Manage deployments" wala tarika use karo).
