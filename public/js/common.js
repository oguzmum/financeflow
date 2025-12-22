function loadPage(page, element) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

	// cache-busting for iframe content to always load the latest HTML
    const url =location.hostname === "localhost" ? `${page}?t=${Date.now()}` : page;

    document.getElementById('pageContent').src = page;
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

function getIncome() {
    return JSON.parse(localStorage.getItem('income')) || [];
}

function getExpenses() {
    return JSON.parse(localStorage.getItem('expenses')) || [];
}

function getIncomeTemplates() {
    return JSON.parse(localStorage.getItem('incomeTemplates')) || [];
}

function getExpenseTemplates() {
    return JSON.parse(localStorage.getItem('expenseTemplates')) || [];
}
