# Elite Orbits — Apne Computer Pe Chalane Ka Tarika

Domain baad mein le lena — abhi ke liye tum ye poori website apne computer pe Chrome mein chala sakti ho.

## Step 1: Node.js install karo (ek baar ka kaam)

Agar pehle se nahi hai:
1. Jao **https://nodejs.org**
2. "LTS" wala version download karo aur normal software jaise install kar do (Next, Next, Finish)

Check karne ke liye ki install ho gaya:
- Windows: Start menu mein "cmd" search karo, khol ke type karo `node -v` — kuch version number dikhna chahiye
- Mac: Terminal khol ke `node -v` type karo

## Step 2: Zip file extract karo

`elite-orbits-fullstack.zip` ko kahin bhi extract karo (Desktop pe kar sakti ho). Ek folder banega jisme `frontend`, `backend`, aur ye start files honge.

## Step 3: Start karo

- **Windows**: `start-windows.bat` pe **double-click** karo
- **Mac**: Terminal khol ke, folder tak jao (`cd Desktop/elite-orbits`), phir type karo:
  ```
  ./start-mac-linux.sh
  ```

Ye khud hi:
1. Backend server start kar dega (ek kaala/terminal window khulega — usse band mat karna jab tak website use kar rahi ho)
2. Chrome mein website khol dega

## Step 4: Use karo

Website Chrome mein khul jayegi. Signup/Login, Contact form, aur flight/stay search — sab kaam karega kyunki backend chal raha hai.

**Jab kaam khatam ho jaye**, us kaale/terminal window ko band kar do — backend server ruk jayega.

## Agli baar

Agli baar bas start file (`start-windows.bat` ya `start-mac-linux.sh`) dubara double-click/run karna — sab kuch already installed hoga, jaldi khul jayega.

## Agar kuch error aaye

- "npm not found" ya "node not found" → Node.js sahi se install nahi hua, Step 1 dobara karo
- Chrome khud nahi khulta → manually Chrome khol ke `frontend/index.html` file ko drag-drop kar do
- Website khul gayi par login/contact kaam nahi kar raha → check karo kaala/terminal window abhi bhi khula hai ya nahi, aur usme koi error to nahi dikh raha
