function loadPage(page, element) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // cache-busting for iframe content to always load the latest HTML
    const url = location.hostname === "localhost" ? `${page}?t=${Date.now()}` : page;

    document.getElementById('pageContent').src = url;
}

function showMessage(elementId, text, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = text;
    el.className = `message ${type}`;
    el.style.display = 'block';

    setTimeout(() => {
        el.style.display = 'none';
    }, 4000);
}

function getCategoryText(category) {
    const map = {
        housing: '🏠 Housing',
        groceries: '🛒 Groceries',
        transport: '🚗 Transport',
        insurance: '🛡️ Insurance',
        other: '📦 Other'
    };
    return map[category] || category;
}

function formatCurrency(amount) {
    return `€ ${Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

const API_BASE = '/api';

async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 = no content
  if (response.status === 204) return null;

  const raw = await response.text(); // read ONCE

  if (!response.ok) {
    let msg = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      msg = parsed?.detail || parsed?.message || raw || `Request failed (${response.status})`;
    } catch (_) {
      msg = raw || `Request failed (${response.status})`;
    }
    throw new Error(msg);
  }

  // ok response but empty body
  if (!raw) return null;

  // parse json if possible
  try {
    return JSON.parse(raw);
  } catch (_) {
    return raw;
  }
}
