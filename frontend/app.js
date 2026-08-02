// Shared helpers for the Elite Orbits frontend.
const API_BASE_URL = 'https://website-uzil.onrender.com/api';
const CURRENCY_SYMBOL = { INR: '₹', USD: '$', CAD: 'C$' };

// Update these once here — every page's footer pulls from this single place.
const CONTACT_INFO = {
  facebook: 'https://www.facebook.com/share/161ugxpBcko/?mibextid=wwXIfr',
  instagram: 'https://www.instagram.com/elite.orbits?igsh=MTRoYnU4OGppeGx5bQ%3D%3D&utm_source=qr',
  supportEmail: 'support@eliteorbits.com',
  teamEmail: 'team@eliteorbits.com',
  adminEmail: 'admin@eliteorbits.com',
  // Your WhatsApp link (QR-code link or wa.me/<number> both work here).
  whatsappLink: 'https://wa.me/qr/INZJKG7CZWQ3P1',
  phoneDisplay: '+1 (905) 330-2036',
  phoneHref: '+19053302036',
};

function eoGetToken() {
  return localStorage.getItem('eo_token');
}
function eoGetUser() {
  try { return JSON.parse(localStorage.getItem('eo_user')); } catch (e) { return null; }
}
function eoLogout() {
  localStorage.removeItem('eo_token');
  localStorage.removeItem('eo_user');
}
function eoAuthHeaders() {
  const token = eoGetToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function eoFormatMoney(amount, currency) {
  const symbol = CURRENCY_SYMBOL[currency] || currency + ' ';
  return `${symbol}${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
function eoDaysBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

// Wires up the nav's account link (shows first name + logout when signed in).
function eoInitNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (a.id !== 'navAccountLink') navLinks.classList.remove('open');
    }));
  }

  const accountLink = document.getElementById('navAccountLink');
  const user = eoGetUser();
  if (accountLink && user) {
    accountLink.textContent = user.name.split(' ')[0];
    accountLink.href = '#';
    accountLink.addEventListener('click', (e) => {
      e.preventDefault();
      eoLogout();
      window.location.reload();
    });
  }
}

// Creates a booking via the backend. Redirects to login if the user isn't signed in.
// Returns the booking on success, or null (and shows a message in the given element) on failure.
async function eoCreateBooking({ type, details, price, currency }, messageEl) {
  if (!eoGetToken()) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return null;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...eoAuthHeaders() },
      body: JSON.stringify({ type, details, price, currency }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not complete booking.');
    if (messageEl) {
      messageEl.textContent = `Booked! Reference ${data.booking.reference} — confirmation details saved to your account.`;
      messageEl.classList.add('show');
    }
    return data.booking;
  } catch (err) {
    if (messageEl) {
      messageEl.textContent = err.message.includes('fetch')
        ? "Couldn't reach the backend. It may be waking up from sleep (free Render instances take ~50s after inactivity) — try again in a moment."
        : err.message;
      messageEl.style.borderColor = '#C97B63';
      messageEl.style.color = '#C97B63';
      messageEl.style.background = 'rgba(201,123,99,0.12)';
      messageEl.classList.add('show');
    }
    return null;
  }
}

// Populates the #footerSocial container (present in every page's footer) with
// Facebook, Instagram, WhatsApp, and phone links from CONTACT_INFO above.
function eoInitFooterSocial() {
  const el = document.getElementById('footerSocial');
  if (!el) return;

  const hasWhatsapp = CONTACT_INFO.whatsappLink && !CONTACT_INFO.whatsappLink.startsWith('REPLACE');
  const hasPhone = CONTACT_INFO.phoneHref && !CONTACT_INFO.phoneHref.startsWith('REPLACE');

  const links = [
    `<a href="${CONTACT_INFO.facebook}" target="_blank" rel="noopener">Facebook</a>`,
    `<a href="${CONTACT_INFO.instagram}" target="_blank" rel="noopener">Instagram</a>`,
    `<a href="mailto:${CONTACT_INFO.supportEmail}">${CONTACT_INFO.supportEmail}</a>`,
    hasWhatsapp
      ? `<a href="${CONTACT_INFO.whatsappLink}" target="_blank" rel="noopener">WhatsApp</a>`
      : `<span title="Add your WhatsApp link in app.js (CONTACT_INFO)" style="opacity:0.5;cursor:not-allowed;">WhatsApp</span>`,
    hasPhone
      ? `<a href="tel:${CONTACT_INFO.phoneHref}">${CONTACT_INFO.phoneDisplay}</a>`
      : `<span title="Add your phone number in app.js (CONTACT_INFO)" style="opacity:0.5;cursor:not-allowed;">Call Us</span>`,
  ];

  el.innerHTML = links.join('');
}

document.addEventListener('DOMContentLoaded', () => {
  eoInitNav();
  eoInitFooterSocial();
});
