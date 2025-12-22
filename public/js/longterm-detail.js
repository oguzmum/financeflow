let plan = null;
let incomeTemplates = [];
let expenseTemplates = [];
let incomeEntries = [];
let expenseEntries = [];

function initDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));
    const plans = getLongtermPlans();
    plan = plans.find(p => p.id === id);

    if (!plan) {
        document.querySelector('.section').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❓</div>
                <p>No plan found. Return to Overview.</p>
                <button onclick="window.location.href='longterm.html'" style="margin-top:12px;">Zurück</button>
            </div>
        `;
        return;
    }

    document.getElementById('planTitle').textContent = plan.name;
    const descEl = document.getElementById('planDescription');
    descEl.textContent = plan.description || 'No Description.';

    incomeTemplates = getIncomeTemplates();
    expenseTemplates = getExpenseTemplates();
    incomeEntries = getIncome();
    expenseEntries = getExpenses();

    populateTemplateDropdowns();
    presetDates();
}

function presetDates() {
    const now = new Date();
    const startInput = document.getElementById('startMonth');
    const endInput = document.getElementById('endMonth');

    const startMonth = now.toISOString().slice(0, 7);
    const end = new Date(now.getFullYear(), now.getMonth() + 11, 1);
    const endMonth = end.toISOString().slice(0, 7);

    startInput.value = startMonth;
    endInput.value = endMonth;
}

function populateTemplateDropdowns() {
    const incomeSelect = document.getElementById('incomeTemplate');
    const expenseSelect = document.getElementById('expenseTemplate');

    incomeSelect.innerHTML = `<option value=\"\">(None)</option>` +
        incomeTemplates.map(t => `<option value=\"${t.id}\">${t.name}</option>`).join('');

    expenseSelect.innerHTML = `<option value=\"\">(None)</option>` +
        expenseTemplates.map(t => `<option value=\"${t.id}\">${t.name}</option>`).join('');
}

function monthRange(start, end) {
    const [startYear, startMonth] = start.split('-').map(Number);
    const [endYear, endMonth] = end.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth - 1, 1);

    if (startDate > endDate) {
        return null;
    }

    const months = [];
    let cursor = new Date(startDate);
    while (cursor <= endDate) {
        months.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
}

function templateSum(templateId, entries, templates, key) {
    if (!templateId) return 0;
    const template = templates.find(t => t.id === Number(templateId));
    if (!template) return 0;
    const ids = new Set(template[key]);
    return entries
        .filter(e => ids.has(e.id))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

function generateProjection() {
    const start = document.getElementById('startMonth').value;
    const end = document.getElementById('endMonth').value;
    const startingBalance = Number(document.getElementById('startingBalance').value || 0);
    const incomeTemplateId = document.getElementById('incomeTemplate').value;
    const expenseTemplateId = document.getElementById('expenseTemplate').value;

    if (!start || !end) {
        showMessage('projectionMessage', 'Choose Start- and Endmonth.', 'error');
        return;
    }

    const months = monthRange(start, end);
    if (!months) {
        showMessage('projectionMessage', 'Starthmonth has to be before the Endmonth.', 'error');
        return;
    }

    const monthlyIncome = templateSum(incomeTemplateId, incomeEntries, incomeTemplates, 'incomeIds');
    const monthlyExpense = templateSum(expenseTemplateId, expenseEntries, expenseTemplates, 'expenseIds');
    const monthlyNet = monthlyIncome - monthlyExpense;

    let balance = startingBalance;
    const rows = months.map(date => {
        const income = monthlyIncome;
        const expense = monthlyExpense;
        const net = monthlyNet;
        balance += net;
        return {
            month: date,
            income,
            expense,
            net,
            balance
        };
    });

    renderTable(rows, monthlyIncome, monthlyExpense, startingBalance);
    showMessage('projectionMessage', 'Refreshed.', 'success');
}

function renderTable(rows, monthlyIncome, monthlyExpense, startingBalance) {
    const container = document.getElementById('projectionTable');
    if (!rows.length) {
        container.innerHTML = '';
        return;
    }

    const header = `
        <div class=\"entry-details\" style=\"margin-bottom:10px;\">
            Monthly income: <strong>${formatCurrency(monthlyIncome)}</strong> •
            Monthly expense: <strong>${formatCurrency(monthlyExpense)}</strong> •
            Start Balanece: <strong>${formatCurrency(startingBalance)}</strong>
        </div>
    `;

    const table = `
        <table>
            <thead>
                <tr>
                    <th>Monat</th>
                    <th class=\"text-right\">Income</th>
                    <th class=\"text-right\">Expense</th>
                    <th class=\"text-right\">Netto</th>
                    <th class=\"text-right\">Balance</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(r => `
                    <tr>
                        <td>${formatMonth(r.month)}</td>
                        <td class=\"text-right\">${formatCurrency(r.income)}</td>
                        <td class=\"text-right\">${formatCurrency(r.expense)}</td>
                        <td class=\"text-right\">${formatCurrency(r.net)}</td>
                        <td class=\"text-right\">${formatCurrency(r.balance)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = header + table;
}

function formatMonth(date) {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}


initDetail();
