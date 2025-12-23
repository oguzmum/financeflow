let plan = null;
let incomeTemplates = [];
let expenseTemplates = [];
let incomeEntries = [];
let expenseEntries = [];

function parseNumberInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const value = Number(el.value);
    return Number.isFinite(value) ? value : 0;
}

function parseIntegerInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const value = parseInt(el.value, 10);
    return Number.isInteger(value) ? value : 0;
}

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (value === null || value === undefined) {
        el.value = '';
        return;
    }
    el.value = value;
}

function monthStringToDate(monthValue) {
    if (!monthValue || typeof monthValue !== 'string' || !/^\d{4}-\d{2}$/.test(monthValue)) return null;
    const [year, month] = monthValue.split('-').map(Number);
    return new Date(year, month - 1, 1);
}

function addMonths(date, monthsToAdd) {
    return new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
}

function syncMaintenanceMonthly(force = true) {
    const annual = parseNumberInput('maintenanceAnnual');
    if (!force && !annual) return;
    const monthly = annual / 12;
    setInputValue('maintenanceMonthly', monthly ? monthly.toFixed(2) : '0.00');
}

function collectFinancingData() {
    return {
        startMonth: document.getElementById('financingStartMonth')?.value || '',
        purchasePrice: parseNumberInput('purchasePrice'),
        downPayment: parseNumberInput('downPayment'),
        finalPayment: parseNumberInput('finalPayment'),
        termMonths: parseIntegerInput('termMonths'),
        monthlyRate: parseNumberInput('monthlyRate'),
        carInsuranceMonthly: parseNumberInput('carInsuranceMonthly'),
		carFuelMonthly: parseNumberInput('carFuelMonthly'),
		carMaintenanceMonthly: parseNumberInput('carMaintenanceMonthly'),
		carTaxMonthly: parseNumberInput('carTaxMonthly'),
		interestRate: parseNumberInput('interestRate'),
    };
}

function updateFinancingSummary() {
  const summaryEl = document.getElementById('financingSummary');
  if (!summaryEl) return;

  const financing = collectFinancingData();

  const months = Math.max(0, financing.termMonths || 0);
  const annualRate = Math.max(0, financing.interestRate || 0);

  // “Financed principal” = what the bank actually finances
  // balloon/finalPayment is typically NOT financed until the end, so subtract it from financed principal
  const financedPrincipal =
    (financing.purchasePrice || 0) -
    (financing.downPayment || 0) -
    (financing.finalPayment || 0);

  const principal = Math.max(0, financedPrincipal);

  // If user provided interestRate and a term, we can *suggest* a computed monthly rate
  let computedMonthlyRate = 0;
  if (months > 0) {
    computedMonthlyRate = calculateMonthlyRate(principal, annualRate, months);
  }

  // Use the user-entered monthlyRate, unless it's empty/0 and we can compute one
  let effectiveMonthlyRate = Number(financing.monthlyRate || 0);
  if (effectiveMonthlyRate <= 0 && computedMonthlyRate > 0) {
    effectiveMonthlyRate = computedMonthlyRate;
    // Optional: auto-fill the field so projection uses it
    const rateInput = document.getElementById('monthlyRate');
    if (rateInput) rateInput.value = effectiveMonthlyRate.toFixed(2);
  }

  // Total paid (only financing part, not running costs)
  const totalPaid =
    (financing.downPayment || 0) +
    (effectiveMonthlyRate * months) +
    (financing.finalPayment || 0);

  // Overpayment vs purchase price (rough “interest/extra cost”)
  const totalOverpayment = Math.max(0, totalPaid - (financing.purchasePrice || 0));

  // Make the summary more explicit
  const startText = financing.startMonth ? ` from ${financing.startMonth}` : '';
  const rateText = annualRate > 0 ? ` • APR: ${annualRate.toFixed(2)}%` : '';

  summaryEl.textContent =
    `Monthly rate${startText}: ${formatCurrency(effectiveMonthlyRate)}${rateText} ` +
    `• Estimated overpayment: ${formatCurrency(totalOverpayment)}`;
}


function calculateMonthlyRate(principal, annualRatePercent, months) {
  if (months <= 0) return 0;

  const principalSafe = Math.max(0, Number(principal) || 0);
  const rateSafe = Math.max(0, Number(annualRatePercent) || 0);

  if (rateSafe === 0) return principalSafe / months;

  const r = rateSafe / 100 / 12;
  return principalSafe * (r / (1 - Math.pow(1 + r, -months)));
}



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
        document.getElementById('startingBalance').value = Number(plan.starting_balance || 0);
        setInputValue('financingStartMonth', toMonthInput(plan.financing_start_month));
        setInputValue('purchasePrice', plan.car_purchase_price ?? 0);
        setInputValue('downPayment', plan.car_down_payment ?? 0);
        setInputValue('finalPayment', plan.car_final_payment ?? 0);
        setInputValue('termMonths', plan.car_term_months ?? 0);
        setInputValue('monthlyRate', plan.car_monthly_rate ?? 0);
        setInputValue('carInsuranceMonthly', plan.car_insurance_monthly ?? 0);
		setInputValue('carFuelMonthly', plan.car_fuel_monthly ?? 0);
		setInputValue('carMaintenanceMonthly', plan.car_maintenance_monthly ?? 0);
		setInputValue('carTaxMonthly', plan.car_tax_monthly ?? 0);
		setInputValue('interestRate', plan.car_interest_rate ?? 0);
        syncMaintenanceMonthly(false);
        updateFinancingSummary();

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

        document.getElementById('maintenanceAnnual')?.addEventListener('input', () => {
            syncMaintenanceMonthly(true);
            updateFinancingSummary();
        });

        ['maintenanceMonthly', 'purchasePrice', 'downPayment', 'finalPayment', 'termMonths', 'monthlyRate', 'financingStartMonth'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateFinancingSummary);
            }
        });
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

function collectTemplateEntries(templateIds, templates, entryKey) {
    if (!templateIds || !templateIds.length) return [];

    const seen = new Set();
    const collected = [];

    templateIds.forEach(id => {
        const template = templates.find(t => t.id === Number(id));
        if (!template || !template[entryKey]) return;

        template[entryKey].forEach(item => {
            if (seen.has(item.id)) return;
            seen.add(item.id);
            collected.push(item);
        });
    });

    return collected;
}

function sumIncomeEntries(entries) {
    if (!entries || !entries.length) return 0;
    return entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function calculateMonthlyExpenses(entries, date) {
    if (!entries || !entries.length) return 0;
    const month = date.getMonth() + 1;

    return entries.reduce((sum, expense) => {
        const amount = Number(expense.amount || 0);
        if (expense.is_annual_payment) {
            return sum + (Number(expense.annual_month) === month ? amount : 0);
        }
        return sum + amount;
    }, 0);
}

function applyFinancingToProjection(monthMap, financing) {
    if (!financing || !financing.startMonth || financing.termMonths <= 0) return monthMap;

    const startDate = monthStringToDate(financing.startMonth);
    if (!startDate) return monthMap;

    const runningCosts =
		financing.carInsuranceMonthly +
		financing.carFuelMonthly +
		financing.carMaintenanceMonthly +
		financing.carTaxMonthly;

	const monthlyCosts = financing.monthlyRate + runningCosts;


    for (let i = 0; i < financing.termMonths; i++) {
        const current = addMonths(startDate, i);
        const key = monthKey(current);
        const existing = monthMap.get(key) || { date: new Date(current), income: 0, expense: 0 };
        existing.expense += monthlyCosts;
        monthMap.set(key, existing);
    }

    const startKey = monthKey(startDate);
    const startEntry = monthMap.get(startKey) || { date: new Date(startDate), income: 0, expense: 0 };
    startEntry.expense += financing.downPayment;
    monthMap.set(startKey, startEntry);

    const endDate = addMonths(startDate, Math.max(financing.termMonths - 1, 0));
    const endKey = monthKey(endDate);
    const endEntry = monthMap.get(endKey) || { date: new Date(endDate), income: 0, expense: 0 };
    endEntry.expense += financing.finalPayment;
    monthMap.set(endKey, endEntry);

    return monthMap;
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
    const startingBalance = Number(document.getElementById('startingBalance').value || 0);
    if (Number.isNaN(startingBalance)) {
        showMessage('projectionMessage', 'Bitte eine gültige Start-Balance eingeben.', 'error');
        return;
    }

    const financing = collectFinancingData();
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
            body: {
                starting_balance: startingBalance,
                financing_start_month: financing.startMonth || null,
                car_purchase_price: financing.purchasePrice,
                car_down_payment: financing.downPayment,
                car_final_payment: financing.finalPayment,
                car_monthly_rate: financing.monthlyRate,
                car_term_months: financing.termMonths,
                car_insurance_monthly: financing.carInsuranceMonthly,
				car_fuel_monthly: financing.carFuelMonthly,
				car_maintenance_monthly: financing.carMaintenanceMonthly,
				car_tax_monthly: financing.carTaxMonthly,
				car_interest_rate: financing.interestRate,
                periods: payload
            }
        });
        document.getElementById('startingBalance').value = Number(plan.starting_balance || 0);
        showMessage('projectionMessage', 'Zeiträume gespeichert.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('projectionMessage', error.message || 'Konnte Zeiträume nicht speichern.', 'error');
    }
}

function generateProjection() {
    const startingBalance = Number(document.getElementById('startingBalance').value || 0);
    const financing = collectFinancingData();

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

        const periodIncomeEntries = collectTemplateEntries(period.incomeTemplateIds, incomeTemplates, 'incomes');
        const periodExpenseEntries = collectTemplateEntries(period.expenseTemplateIds, expenseTemplates, 'expenses');
        const monthlyIncome = sumIncomeEntries(periodIncomeEntries);

        months.forEach(date => {
            const key = monthKey(date);
            const existing = monthMap.get(key) || { date: new Date(date), income: 0, expense: 0 };
            existing.income += monthlyIncome;
            existing.expense += calculateMonthlyExpenses(periodExpenseEntries, date);
            monthMap.set(key, existing);
        });
    }

    applyFinancingToProjection(monthMap, financing);

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

    renderTable(rowsWithBalance, startingBalance, periods, financing);
    showMessage('projectionMessage', 'Refreshed.', 'success');
}

function renderTable(rows, startingBalance, periods, financing) {
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

    const runningCosts =
		financing.carInsuranceMonthly +
		financing.carFuelMonthly +
		financing.carMaintenanceMonthly +
		financing.carTaxMonthly;

	const totalPaid = financing.downPayment + (financing.monthlyRate * financing.termMonths) + financing.finalPayment;
	const totalInterest = Math.max(0, totalPaid - financing.purchasePrice);
	const startText = financing.startMonth ? ` from ${financing.startMonth}` : '';

	financingDetails = `
		<div class="entry-details" style="margin-bottom:10px;">
			Vehicle financing${startText}: ${financing.termMonths} months •
			Monthly rate ${formatCurrency(financing.monthlyRate)} •
			Running costs ${formatCurrency(runningCosts)} / month •
			Estimated interest ${formatCurrency(totalInterest)}
		</div>
		`;


    const header = `
        <div class=\"entry-details\" style=\"margin-bottom:10px;\">
            Start Balance: <strong>${formatCurrency(startingBalance)}</strong> •
            ${periods.length} Zeitraum(e)
        </div>
        ${periodSummary ? `<div class=\"entry-details\" style=\"margin-bottom:10px;\">${periodSummary}</div>` : ''}
        ${financingDetails}
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
