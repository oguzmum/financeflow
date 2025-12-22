let plan = null;
let incomeTemplates = [];
let expenseTemplates = [];
let incomeEntries = [];
let expenseEntries = [];

function buildTemplateOptions(templates) {
    return templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function setSelectedValues(selectEl, values = []) {
    const valueSet = new Set((values || []).map(Number));
    Array.from(selectEl.options).forEach(option => {
        option.selected = valueSet.has(Number(option.value));
    });
}

function getSelectedTemplateIds(selectEl) {
    return Array.from(selectEl.selectedOptions).map(option => Number(option.value));
}

async function initDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));

    if (!id) {
        document.querySelector('.section').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❓</div>
                <p>No plan found. Return to Overview.</p>
                <button onclick="window.location.href='longterm.html'" style="margin-top:12px;">Zurück</button>
            </div>
        `;
        return;
    }

    try {
        const [planResponse, incomesResponse, expensesResponse, incomeTemplatesResponse, expenseTemplatesResponse] = await Promise.all([
            apiRequest(`/longterm/plans/${id}`),
            apiRequest('/incomes'),
            apiRequest('/expenses'),
            apiRequest('/templates/income'),
            apiRequest('/templates/expense'),
        ]);

        plan = planResponse;
        incomeEntries = incomesResponse;
        expenseEntries = expensesResponse;
        incomeTemplates = incomeTemplatesResponse;
        expenseTemplates = expenseTemplatesResponse;

        document.getElementById('planTitle').textContent = plan.name;
        const descEl = document.getElementById('planDescription');
        descEl.textContent = plan.description || 'No Description.';

        if (plan.periods && plan.periods.length) {
            plan.periods.forEach(period => addPeriodRow({
                start: toMonthInput(period.start_month),
                end: toMonthInput(period.end_month),
                incomeTemplateIds: period.income_template_ids || [],
                expenseTemplateIds: period.expense_template_ids || []
            }));
        } else {
            addPeriodRow(getPresetRange());
        }
    } catch (error) {
        console.error(error);
        document.querySelector('.section').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❓</div>
                <p>${error.message || 'Plan could not be loaded.'}</p>
                <button onclick="window.location.href='longterm.html'" style="margin-top:12px;">Zurück</button>
            </div>
        `;
    }
}

function toMonthInput(dateString) {
    if (!dateString) return '';
    return dateString.slice(0, 7);
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
      <label>Income Templates</label>
      <div class="template-checklist income-checklist"></div>
    </div>

    <div class="form-group">
      <label>Expense Templates</label>
      <div class="template-checklist expense-checklist"></div>
    </div>

    <div class="form-group period-actions">
      <button type="button" class="btn-delete remove-period">Remove</button>
    </div>
  `;

  container.appendChild(row);

  // WICHTIG: erst NACH appendChild rendern
  renderTemplateChecklist(
    row.querySelector('.income-checklist'),
    incomeTemplates,
    defaults.incomeTemplateIds || [],
    'income'
  );

  renderTemplateChecklist(
    row.querySelector('.expense-checklist'),
    expenseTemplates,
    defaults.expenseTemplateIds || [],
    'expense'
  );

  row.querySelector('.remove-period').addEventListener('click', () => row.remove());
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

function templateSum(templateIds, entries, templates, entryKey) {
    if (!templateIds || !templateIds.length) return 0;

    const entryIds = new Set();
    templateIds.forEach(id => {
        const template = templates.find(t => t.id === Number(id));
        if (!template) return;
        (template[entryKey] || []).forEach(item => entryIds.add(item.id));
    });

    if (!entryIds.size) return 0;

    return entries
        .filter(e => entryIds.has(e.id))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function templateNames(templates, templateIds) {
    if (!templateIds || !templateIds.length) return 'Keine Templates';
    const names = templateIds
        .map(id => templates.find(t => t.id === Number(id)))
        .filter(Boolean)
        .map(t => t.name);
    return names.length ? names.join(', ') : 'Templates nicht gefunden';
}

function getCheckedIds(row, selector) {
  return Array.from(row.querySelectorAll(selector + ':checked'))
    .map(cb => Number(cb.value))
    .filter(Boolean);
}

function collectPeriods() {
  const rows = Array.from(document.querySelectorAll('.period-row'));
  return rows.map(row => ({
    start: row.querySelector('.period-start').value,
    end: row.querySelector('.period-end').value,
    incomeTemplateIds: getCheckedIds(row, '.income-template-checkbox'),
    expenseTemplateIds: getCheckedIds(row, '.expense-template-checkbox'),
  }));
}

async function savePeriods() {
    const periods = collectPeriods();
    if (!periods.length) {
        showMessage('projectionMessage', 'Füge mindestens einen Zeitraum hinzu.', 'error');
        return;
    }

    const payload = [];
    for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        if (!period.start || !period.end) {
            showMessage('projectionMessage', `Zeitraum ${i + 1}: Bitte Start- und Endmonat wählen.`, 'error');
            return;
        }
        payload.push({
            start_month: period.start,
            end_month: period.end,
            income_template_ids: period.incomeTemplateIds,
            expense_template_ids: period.expenseTemplateIds
        });
    }

    try {
        plan = await apiRequest(`/longterm/plans/${plan.id}/periods`, {
            method: 'PUT',
            body: payload
        });
        showMessage('projectionMessage', 'Zeiträume gespeichert.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('projectionMessage', error.message || 'Konnte Zeiträume nicht speichern.', 'error');
    }
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

        const monthlyIncome = templateSum(period.incomeTemplateIds, incomeEntries, incomeTemplates, 'incomes');
        const monthlyExpense = templateSum(period.expenseTemplateIds, expenseEntries, expenseTemplates, 'expenses');

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
        const incomeName = templateNames(incomeTemplates, p.incomeTemplateIds);
        const expenseName = templateNames(expenseTemplates, p.expenseTemplateIds);
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

function renderTemplateChecklist(containerEl, templates, selectedIds = [], kind = 'income') {
  const selectedSet = new Set((selectedIds || []).map(Number));

  if (!templates || !templates.length) {
    containerEl.innerHTML = `<div class="helper-text">No templates available.</div>`;
    return;
  }

  containerEl.innerHTML = templates.map(t => {
    const checked = selectedSet.has(Number(t.id)) ? 'checked' : '';
    return `
      <label class="template-check-item">
        <input
          type="checkbox"
          class="${kind}-template-checkbox"
          value="${t.id}"
          ${checked}
        />
        <span class="template-check-label">${t.name}</span>
      </label>
    `;
  }).join('');
}


initDetail();
