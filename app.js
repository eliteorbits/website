// Shared helpers for the Elite Orbits frontend.
const API_BASE_URL = 'https://website-uzl1.onrender.com/api';
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

    // Insert a "My Bookings" link right before the account name/logout link.
    if (!document.getElementById('navMyBookingsLink')) {
      const myBookings = document.createElement('a');
      myBookings.id = 'navMyBookingsLink';
      myBookings.href = '/my-bookings/';
      myBookings.textContent = 'My Bookings';
      myBookings.addEventListener('click', () => navLinks && navLinks.classList.remove('open'));
      accountLink.parentNode.insertBefore(myBookings, accountLink);
    }
  }
}

// Creates a booking via the backend. Redirects to login if the user isn't signed in.
// Returns the booking on success, or null (and shows a message in the given element) on failure.
// Builds a short, readable WhatsApp message from a booking so the customer's
// chat already has everything the team needs (no retyping on either side).
function eoBuildWhatsappMessage({ type, details, price, currency, reference }) {
  const priceStr = eoFormatMoney(price, currency);
  let line = '';
  if (type === 'flight') line = `${details.from || ''} → ${details.to || ''}`;
  else if (type === 'stay') line = `${details.title || ''} (${details.city || ''}, ${details.nights || ''} night${details.nights > 1 ? 's' : ''})`;
  else if (type === 'car') line = `${details.category || ''} in ${details.city || ''} (${details.days || ''} day${details.days > 1 ? 's' : ''})`;

  return `Hi Elite Orbits! I'd like to confirm my booking.\n\nReference: ${reference}\nType: ${type}\n${line}\nPrice: ${priceStr}\n\nPlease confirm the next steps.`;
}

// Opens WhatsApp with the booking details pre-filled. Uses phoneHref (a real
// number) for the prefilled-text link; falls back to the QR link (no
// pre-filled text possible) if a plain number isn't set.
function eoOpenWhatsapp(message) {
  const num = (CONTACT_INFO.phoneHref || '').replace(/[^\d]/g, '');
  const url = num
    ? `https://wa.me/${num}?text=${encodeURIComponent(message)}`
    : CONTACT_INFO.whatsappLink;
  window.open(url, '_blank');
}

async function eoCreateBooking({ type, details, price, currency }, messageEl) {
  if (!eoGetToken()) {
    window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
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
      messageEl.textContent = `Booked! Reference ${data.booking.reference} — opening WhatsApp to confirm with our team…`;
      messageEl.classList.add('show');
    }
    // The backend already logged this booking to the Google Sheet (see
    // backend/src/routes/bookings.js). Now hand off to WhatsApp so the
    // customer can chat with the team directly.
    eoOpenWhatsapp(eoBuildWhatsappMessage({ type, details, price, currency, reference: data.booking.reference }));
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
// Facebook, Instagram, Email, WhatsApp, and phone icon-buttons from CONTACT_INFO above.
function eoInitFooterSocial() {
  const el = document.getElementById('footerSocial');
  if (!el) return;

  const hasWhatsapp = CONTACT_INFO.whatsappLink && !CONTACT_INFO.whatsappLink.startsWith('REPLACE');
  const hasPhone = CONTACT_INFO.phoneHref && !CONTACT_INFO.phoneHref.startsWith('REPLACE');

  const ICONS = {
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.35C16.24 4.31 15.35 4.24 14.32 4.24c-2.15 0-3.62 1.31-3.62 3.72V10.5H8.2v3h2.5V21h2.8z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.02 3C7.05 3 3.02 7.03 3.02 12c0 1.73.48 3.35 1.32 4.73L3 21l4.4-1.3a8.94 8.94 0 0 0 4.62 1.28h.01c4.97 0 9-4.03 9-9s-4.03-9-9.01-9zm0 16.4c-1.42 0-2.75-.42-3.86-1.14l-.28-.17-2.6.77.78-2.54-.18-.29a7.4 7.4 0 0 1-1.15-3.99c0-4.1 3.34-7.43 7.44-7.43 1.99 0 3.85.77 5.26 2.18a7.38 7.38 0 0 1 2.18 5.26c-.01 4.1-3.35 7.35-7.44 7.35zm4.08-5.57c-.22-.11-1.32-.65-1.53-.73-.2-.08-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.15-.26.16-.48.05-.22-.11-.94-.35-1.79-1.11-.66-.59-1.11-1.32-1.24-1.54-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.06-.59.28-.2.22-.78.76-.78 1.85 0 1.09.8 2.14.91 2.29.11.15 1.58 2.41 3.83 3.38.54.23.96.37 1.29.47.54.17 1.03.15 1.42.09.43-.06 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.09-.2-.15-.42-.26z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V19c0 .6-.4 1-1 1C10.9 20 4 13.1 4 4.6c0-.6.4-1 1-1h3.1c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1.1L6.6 10.8z"/></svg>',
  };

  const items = [
    { key: 'facebook', href: CONTACT_INFO.facebook, label: 'Facebook' },
    { key: 'instagram', href: CONTACT_INFO.instagram, label: 'Instagram' },
    { key: 'mail', href: `mailto:${CONTACT_INFO.supportEmail}`, label: CONTACT_INFO.supportEmail },
    hasWhatsapp
      ? { key: 'whatsapp', href: CONTACT_INFO.whatsappLink, label: 'WhatsApp' }
      : null,
    hasPhone
      ? { key: 'phone', href: `tel:${CONTACT_INFO.phoneHref}`, label: CONTACT_INFO.phoneDisplay }
      : null,
  ].filter(Boolean);

  el.innerHTML = items
    .map(
      (item) => `
        <a href="${item.href}" class="social-icon-btn" target="_blank" rel="noopener" title="${item.label}" aria-label="${item.label}">
          ${ICONS[item.key]}
        </a>`
    )
    .join('');
}

// Adds a floating WhatsApp chat button (bottom-right, all pages) if a
// WhatsApp link is configured in CONTACT_INFO.
function eoInitWhatsAppFloat() {
  if (!CONTACT_INFO.whatsappLink || CONTACT_INFO.whatsappLink.startsWith('REPLACE')) return;
  if (document.getElementById('eoWhatsAppFloat')) return;

  const a = document.createElement('a');
  a.id = 'eoWhatsAppFloat';
  a.href = CONTACT_INFO.whatsappLink;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat on WhatsApp');
  a.title = 'Chat on WhatsApp';
  a.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.02 3C7.05 3 3.02 7.03 3.02 12c0 1.73.48 3.35 1.32 4.73L3 21l4.4-1.3a8.94 8.94 0 0 0 4.62 1.28h.01c4.97 0 9-4.03 9-9s-4.03-9-9.01-9zm0 16.4c-1.42 0-2.75-.42-3.86-1.14l-.28-.17-2.6.77.78-2.54-.18-.29a7.4 7.4 0 0 1-1.15-3.99c0-4.1 3.34-7.43 7.44-7.43 1.99 0 3.85.77 5.26 2.18a7.38 7.38 0 0 1 2.18 5.26c-.01 4.1-3.35 7.35-7.44 7.35zm4.08-5.57c-.22-.11-1.32-.65-1.53-.73-.2-.08-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.15-.26.16-.48.05-.22-.11-.94-.35-1.79-1.11-.66-.59-1.11-1.32-1.24-1.54-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.06-.59.28-.2.22-.78.76-.78 1.85 0 1.09.8 2.14.91 2.29.11.15 1.58 2.41 3.83 3.38.54.23.96.37 1.29.47.54.17 1.03.15 1.42.09.43-.06 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.09-.2-.15-.42-.26z"/></svg>`;
  document.body.appendChild(a);
}

document.addEventListener('DOMContentLoaded', () => {
  eoInitNav();
  eoInitFooterSocial();
  eoInitWhatsAppFloat();
});
