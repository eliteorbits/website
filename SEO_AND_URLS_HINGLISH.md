# Website Update: Clean URLs + Mobile Fix + Google Tag + SEO/AEO/GEO/LLMO

## 1) URL se `.html` hat gaya

Har page ab apne folder ke andar `index.html` ki tarah save hai:
`about.html` → `about/index.html`, jo URL me `/about/` ki tarah khulega
(GitHub Pages folder ke andar `index.html` ko automatically serve karta hai
— koi extra config nahi chahiye). Saare internal links (nav, footer, buttons,
JS redirects) already `/about/`, `/flights/`, `/login/?next=...` type me
update kar diye hain.

**Zaroori: apna asli domain daalo.** Maine SEO tags me temporarily
`https://eliteorbits.com` use kiya hai. Agar aapka actual domain alag hai,
to `frontend/` ke andar sab `.html` files me `eliteorbits.com` ko find-replace
kar dena apne real domain se (`sitemap.xml`, `robots.txt`, `llms.txt` me bhi).

## 2) Mobile view

`styles.css` ke end me extra mobile breakpoints (`480px` aur `360px`) add
kiye — chhoti screens pe nav padding, heading size, form rows (1-column),
images (`max-width:100%`) sab theek se fit honge. Site already ek hamburger
mobile-nav rakhti thi, ye us par extra polish hai.

## 3) Google tag (gtag.js)

Aapka diya hua snippet **har HTML page** ke `<head>` me add ho gaya hai (`G-6XS376425K`).

## 4) SEO / AEO / GEO / LLMO / AI-SEO / E-E-A-T

Har page me ye add hue:
- Unique `<title>` aur `meta description`
- `canonical` URL, `robots` meta
- Open Graph + Twitter card tags (social share preview)
- `author` meta (E-E-A-T trust signal)
- Home page pe `TravelAgency` schema (JSON-LD) — Google ko business samajhne me madad
- FAQ page pe `FAQPage` schema (aapke saare 9 Q&A auto-extract karke) — ye
  Google ke "People also ask" aur AI answer engines (ChatGPT, Perplexity,
  Google AI Overviews) me directly answer dikhne ke chances badhata hai (AEO/GEO)
- `robots.txt` — GPTBot, ClaudeBot, PerplexityBot, Google-Extended jaise AI
  crawlers ko explicitly allow kiya (LLMO — taaki AI tools aapki site ko
  index/cite kar sakein)
- `sitemap.xml` — saare pages list
- `llms.txt` — ek naya standard file jo AI assistants ke liye seedha plain-text
  me batati hai ki business kya karta hai (GEO/LLMO ke liye)

## Deploy karte waqt yaad rakhna

- GitHub Pages settings me source **branch + `/frontend` folder** (ya jahan
  bhi ye files hain) set hona chahiye.
- Custom domain use kar rahe ho to GitHub Pages settings me domain add karo
  aur DNS me CNAME record point karo — tabhi `sitemap.xml`/`canonical` wale
  URLs real match karenge.
- Deploy ke baad Google Search Console me sitemap submit kar dena
  (`https://<yourdomain>/sitemap.xml`) — indexing fast ho jayegi.
