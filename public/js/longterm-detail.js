let plan = null;
let incomeTemplates = [];
let expenseTemplates = [];
let incomeEntries = [];
let expenseEntries = [];

function buildTemplateOptions(templates) {
    return `<option value="">(None)</option>` +
        templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

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

    addPeriodRow(getPresetRange());
}

function getPresetRange() {
    const now = new Date();
    const startMonth = now.toISOString().slice(0, 7);
    const end = new Date(now.getFullYear(), now.getMonth() + 11, 1);
    const endMonth = end.toISOString().slice(0, 7);

    return { start: startMonth, end: endMonth };
}

function addPeriodRow(defaults = {}) {
    const container = document.getElementById('periodsContainer');
    const row = document.createElement('div');
    row.className = 'period-row';
    row.innerHTML = `
        <div class="form-group">
            <label>Start Month</label>
            <input type="month" class="period-start" value="${defaults.start || ''}">
        </div>
        <div class="form-group">
            <label>End Month</label>
            <input type="month" class="period-end" value="${defaults.end || ''}">
        </div>
        <div class="form-group">
            <label>Income Template</label>
            <select class="period-income"></select>
        </div>
        <div class="form-group">
            <label>Expense Template</label>
            <select class="period-expense"></select>
        </div>
        <div class="form-group period-actions">
            <button type="button" class="btn-delete remove-period">Remove</button>
        </div>
    `;

    container.appendChild(row);

    const incomeSelect = row.querySelector('.period-income');
    const expenseSelect = row.querySelector('.period-expense');
    incomeSelect.innerHTML = buildTemplateOptions(incomeTemplates);
    expenseSelect.innerHTML = buildTemplateOptions(expenseTemplates);

    if (defaults.incomeTemplateId) incomeSelect.value = defaults.incomeTemplateId;
    if (defaults.expenseTemplateId) expenseSelect.value = defaults.expenseTemplateId;

    row.querySelector('.remove-period').addEventListener('click', () => {
        row.remove();
    });
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

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function templateName(templates, templateId) {
    if (!templateId) return 'Kein Template';
    const template = templates.find(t => t.id === Number(templateId));
    return template ? template.name : 'Template nicht gefunden';
}

function collectPeriods() {
    const rows = Array.from(document.querySelectorAll('.period-row'));
    return rows.map(row => ({
        start: row.querySelector('.period-start').value,
        end: row.querySelector('.period-end').value,
        incomeTemplateId: row.querySelector('.period-income').value,
        expenseTemplateId: row.querySelector('.period-expense').value
    }));
}

function generateProjection() {
    const startingBalance = Number(document.getElementById('startingBalance').value || 0);

    const periods = collectPeriods();
    if (!periods.length) {
        showMessage('projectionMessage', 'Füge mindestens einen Zeitraum hinzu.', 'error');
        return;
    }

    const monthMap = new Map();
    for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        if (!period.start || !period.end) {
            showMessage('projectionMessage', `Zeitraum ${i + 1}: Bitte Start- und Endmonat wählen.`, 'error');
            return;
        }

        const months = monthRange(period.start, period.end);
        if (!months) {
            showMessage('projectionMessage', `Zeitraum ${i + 1}: Startmonat muss vor dem Endmonat liegen.`, 'error');
            return;
        }

        const monthlyIncome = templateSum(period.incomeTemplateId, incomeEntries, incomeTemplates, 'incomeIds');
        const monthlyExpense = templateSum(period.expenseTemplateId, expenseEntries, expenseTemplates, 'expenseIds');

        months.forEach(date => {
            const key = monthKey(date);
            const existing = monthMap.get(key) || { date: new Date(date), income: 0, expense: 0 };
            existing.income += monthlyIncome;
            existing.expense += monthlyExpense;
            monthMap.set(key, existing);
        });
    }

    if (!monthMap.size) {
        showMessage('projectionMessage', 'Keine Monate im ausgewählten Zeitraum gefunden.', 'error');
        return;
    }

    const rows = Array.from(monthMap.values())
        .sort((a, b) => a.date - b.date)
        .map(item => {
            const net = item.income - item.expense;
            return { ...item, net };
        });

    let balance = startingBalance;
    const rowsWithBalance = rows.map(r => {
        balance += r.net;
        return {
            ...r,
            balance
        };
    });

    renderTable(rowsWithBalance, startingBalance, periods);
    showMessage('projectionMessage', 'Refreshed.', 'success');
}

function renderTable(rows, startingBalance, periods) {
    const container = document.getElementById('projectionTable');
    if (!rows.length) {
        container.innerHTML = '';
        return;
    }

    const periodSummary = periods.map((p, idx) => {
        const incomeName = templateName(incomeTemplates, p.incomeTemplateId);
        const expenseName = templateName(expenseTemplates, p.expenseTemplateId);
        return `#${idx + 1}: ${p.start} → ${p.end} • Income: ${incomeName} • Expense: ${expenseName}`;
    }).join('<br>');

    const header = `
        <div class=\"entry-details\" style=\"margin-bottom:10px;\">
            Start Balance: <strong>${formatCurrency(startingBalance)}</strong> •
            ${periods.length} Zeitraum(e)
        </div>
        ${periodSummary ? `<div class=\"entry-details\" style=\"margin-bottom:10px;\">${periodSummary}</div>` : ''}
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
                        <td>${formatMonth(r.date)}</td>
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
