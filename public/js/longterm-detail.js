let plan = null;
let incomeTemplates = [];
let expenseTemplates = [];
let savingTemplates = [];
let incomeEntries = [];
let expenseEntries = [];
let savingEntries = [];

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
        const [planResponse, incomesResponse, expensesResponse, incomeTemplatesResponse, expenseTemplatesResponse, savingsResponse, savingTemplatesResponse] = await Promise.all([
            apiRequest(`/longterm/plans/${id}`),
            apiRequest('/incomes'),
            apiRequest('/expenses'),
            apiRequest('/templates/income'),
            apiRequest('/templates/expense'),
            apiRequest('/savings'),
            apiRequest('/templates/saving'),
        ]);

        plan = planResponse;
        incomeEntries = incomesResponse;
        expenseEntries = expensesResponse;
        incomeTemplates = incomeTemplatesResponse;
        expenseTemplates = expenseTemplatesResponse;
        savingEntries = savingsResponse;
        savingTemplates = savingTemplatesResponse;

        document.getElementById('planTitle').textContent = plan.name;
        const descEl = document.getElementById('planDescription');
        descEl.textContent = plan.description || 'No Description.';
        document.getElementById('startingBalance').value = Number(plan.starting_balance || 0);
        document.getElementById('startingSavingBalance').value = Number(plan.starting_saving_balance || 0);
        setInputValue('savingsReturnRate', plan.savings_return_rate ?? 7);
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
                expenseTemplateIds: period.expense_template_ids || [],
                savingTemplateIds: period.saving_template_ids || []
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

    <div class="form-group">
      <label>Savings Templates</label>
      <div class="template-checklist saving-checklist"></div>
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

  renderTemplateChecklist(
    row.querySelector('.saving-checklist'),
    savingTemplates,
    defaults.savingTemplateIds || [],
    'saving'
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

function sumSavingEntries(entries) {
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
        const existing = monthMap.get(key) || { date: new Date(current), income: 0, expense: 0, savings: 0 };
        existing.expense += monthlyCosts;
        monthMap.set(key, existing);
    }

    const startKey = monthKey(startDate);
    const startEntry = monthMap.get(startKey) || { date: new Date(startDate), income: 0, expense: 0, savings: 0 };
    startEntry.expense += financing.downPayment;
    monthMap.set(startKey, startEntry);

    const endDate = addMonths(startDate, Math.max(financing.termMonths - 1, 0));
    const endKey = monthKey(endDate);
    const endEntry = monthMap.get(endKey) || { date: new Date(endDate), income: 0, expense: 0, savings: 0 };
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
    savingTemplateIds: getCheckedIds(row, '.saving-template-checkbox'),
  }));
}

async function savePeriods() {
    const startingBalance = Number(document.getElementById('startingBalance').value || 0);
    const startingSavingBalance = Number(document.getElementById('startingSavingBalance').value || 0);
    const savingsReturnRate = Number(document.getElementById('savingsReturnRate').value || 0);
    if (Number.isNaN(startingBalance)) {
        showMessage('projectionMessage', 'Bitte eine gültige Start-Balance eingeben.', 'error');
        return;
    }

    if (Number.isNaN(startingSavingBalance)) {
        showMessage('projectionMessage', 'Bitte eine gültige Start-Sparsumme eingeben.', 'error');
        return;
    }

    if (savingsReturnRate < 0) {
        showMessage('projectionMessage', 'Rendite kann nicht negativ sein.', 'error');
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
            expense_template_ids: period.expenseTemplateIds,
            saving_template_ids: period.savingTemplateIds
        });
    }

    try {
        plan = await apiRequest(`/longterm/plans/${plan.id}/periods`, {
            method: 'PUT',
            body: {
                starting_balance: startingBalance,
                starting_saving_balance: startingSavingBalance,
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
                savings_return_rate: savingsReturnRate,
                periods: payload
            }
        });
        document.getElementById('startingBalance').value = Number(plan.starting_balance || 0);
        document.getElementById('startingSavingBalance').value = Number(plan.starting_saving_balance || 0);
        showMessage('projectionMessage', 'Zeiträume gespeichert.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('projectionMessage', error.message || 'Konnte Zeiträume nicht speichern.', 'error');
    }
}

function generateProjection() {
    const startingBalance = Number(document.getElementById('startingBalance').value || 0);
    const startingSavingBalance = Number(document.getElementById('startingSavingBalance').value || 0);
    const savingsReturnRate = Number(document.getElementById('savingsReturnRate').value || 0);
    const financing = collectFinancingData();

    if (savingsReturnRate < 0) {
        showMessage('projectionMessage', 'Rendite kann nicht negativ sein.', 'error');
        return;
    }

    if (Number.isNaN(startingSavingBalance)) {
        showMessage('projectionMessage', 'Bitte eine gültige Start-Sparsumme eingeben.', 'error');
        return;
    }

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
        const periodSavingEntries = collectTemplateEntries(period.savingTemplateIds, savingTemplates, 'savings');
        const monthlyIncome = sumIncomeEntries(periodIncomeEntries);
        const monthlySavings = sumSavingEntries(periodSavingEntries);

        months.forEach(date => {
            const key = monthKey(date);
            const existing = monthMap.get(key) || { date: new Date(date), income: 0, expense: 0, savings: 0 };
            existing.income += monthlyIncome;
            existing.expense += calculateMonthlyExpenses(periodExpenseEntries, date);
            existing.savings += monthlySavings;
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
        const net = item.income - item.expense - (item.savings || 0);
        return { ...item, net };
    });

    let balance = startingBalance;
    let savingTotal = startingSavingBalance;
    let investedBalance = startingSavingBalance;
    const monthlyReturnRate = Math.max(0, Number(savingsReturnRate) || 0) / 100 / 12;
    const rowsWithBalance = rows.map(r => {
        balance += r.net;
        savingTotal += r.savings || 0;
        investedBalance = (investedBalance + (r.savings || 0)) * (1 + monthlyReturnRate);
        return {
            ...r,
            balance,
            savingTotal,
        investedBalance,
        totalWealth: balance + investedBalance,
    };
    });

    renderTable(rowsWithBalance, startingBalance, startingSavingBalance, periods, financing, savingsReturnRate);
    renderWealthGraph(rowsWithBalance);
    showMessage('projectionMessage', 'Refreshed.', 'success');
}

function renderTable(rows, startingBalance, startingSavingBalance, periods, financing, savingsReturnRate) {
    const container = document.getElementById('projectionTable');
    if (!rows.length) {
        container.innerHTML = '';
        return;
    }

    const periodSummary = periods.map((p, idx) => {
        const incomeName = templateNames(incomeTemplates, p.incomeTemplateIds);
        const expenseName = templateNames(expenseTemplates, p.expenseTemplateIds);
        const savingName = templateNames(savingTemplates, p.savingTemplateIds);
        return `#${idx + 1}: ${p.start} → ${p.end} • Income: ${incomeName} • Expense: ${expenseName} • Saving: ${savingName}`;
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
            Sparkonto Start: <strong>${formatCurrency(startingSavingBalance)}</strong> •
            ${periods.length} Zeitraum(e) • Rendite Sparrate: ${Number(savingsReturnRate || 0).toFixed(2)}% p.a.
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
                    <th class=\"text-right\">Saving</th>
                    <th class=\"text-right\">Netto</th>
                    <th class=\"text-right\">Sparkonto</th>
                    <th class=\"text-right\">Sparanlage (mit Rendite)</th>
                    <th class=\"text-right\">Balance</th>
                    <th class=\"text-right\">Gesamtvermögen</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(r => `
                    <tr>
                        <td>${formatMonth(r.date)}</td>
                        <td class=\"text-right\">${formatCurrency(r.income)}</td>
                        <td class=\"text-right\">${formatCurrency(r.expense)}</td>
                        <td class=\"text-right\">${formatCurrency(r.savings || 0)}</td>
                        <td class=\"text-right\">${formatCurrency(r.net)}</td>
                        <td class=\"text-right\">${formatCurrency(r.savingTotal)}</td>
                        <td class=\"text-right\">${formatCurrency(r.investedBalance)}</td>
                        <td class=\"text-right\">${formatCurrency(r.balance)}</td>
                        <td class=\"text-right\">${formatCurrency(r.totalWealth)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = header + table;
}

function renderWealthGraph(rows) {
    const canvas = document.getElementById('totalWealthChart');
    const chartMessage = document.getElementById('projectionChartMessage');
    const downloadBtn = document.getElementById('downloadChartBtn');

    if (!canvas || !chartMessage || !downloadBtn) return;

    if (!rows || !rows.length) {
        chartMessage.textContent = 'No data available yet.';
        canvas.style.display = 'none';
        downloadBtn.style.display = 'none';
        return;
    }

    const labels = rows.map(r => formatMonth(r.date));
    const values = rows.map(r => Number(r.totalWealth || 0));

    drawLineChart(canvas, labels, values);

    chartMessage.textContent = 'Total wealth over time.';
    canvas.style.display = 'block';
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'total-wealth.png';
        link.click();
    };
}

function drawLineChart(canvas, labels, values) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !values || !values.length) return;

    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(360, (canvas.parentElement?.clientWidth || 800) - 24);
    const height = 340;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(ratio, ratio);

    // clear + white background (important for download)
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // layout
    const paddingLeft = 72;   // room for y-axis labels
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 54; // room for x-axis labels
    const plotX = paddingLeft;
    const plotY = paddingTop;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // min/max + range
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const minVal = Math.min(0, rawMin); // show 0 line if possible
    const maxVal = Math.max(0, rawMax);
    const range = Math.max(1e-9, maxVal - minVal);

    const xForIndex = (idx) => {
        if (labels.length === 1) return plotX;
        return plotX + (plotWidth * (idx / (labels.length - 1)));
    };

    const yForValue = (val) => {
        return plotY + ((maxVal - val) / range) * plotHeight;
    };

    const points = values.map((val, idx) => ({
        x: xForIndex(idx),
        y: yForValue(val)
    }));

    // helper: nice y-grid values
    function niceStep(roughStep) {
        const pow = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const n = roughStep / pow;
        let nice;
        if (n <= 1) nice = 1;
        else if (n <= 2) nice = 2;
        else if (n <= 5) nice = 5;
        else nice = 10;
        return nice * pow;
    }

    const targetGridLines = 5;
    const stepVal = niceStep(range / targetGridLines);
    const gridMin = Math.floor(minVal / stepVal) * stepVal;
    const gridMax = Math.ceil(maxVal / stepVal) * stepVal;

    // grid lines (horizontal)
    ctx.strokeStyle = '#e6e6e6';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let v = gridMin; v <= gridMax + stepVal / 2; v += stepVal) {
        const y = yForValue(v);
        ctx.beginPath();
        ctx.moveTo(plotX, y);
        ctx.lineTo(plotX + plotWidth, y);
        ctx.stroke();
    }

    // y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = gridMin; v <= gridMax + stepVal / 2; v += stepVal) {
        const y = yForValue(v);
        ctx.fillText(formatCurrency(v), plotX - 10, y);
    }

    // axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // y axis
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotHeight);
    // x axis
    ctx.lineTo(plotX + plotWidth, plotY + plotHeight);
    ctx.stroke();

    // 0-baseline (dashed) if 0 is within visible range
    if (minVal <= 0 && maxVal >= 0) {
        const y0 = yForValue(0);
        ctx.strokeStyle = '#cfcfcf';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(plotX, y0);
        ctx.lineTo(plotX + plotWidth, y0);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // line
    ctx.strokeStyle = '#2b7cff';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // points
    ctx.fillStyle = '#2b7cff';
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // x-axis labels (reduced density)
    ctx.fillStyle = '#444';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const step = Math.max(1, Math.floor(labels.length / 6));
    for (let i = 0; i < labels.length; i++) {
        if (i % step !== 0 && i !== labels.length - 1) continue;
        const x = points[i].x;
        ctx.fillText(labels[i], x, plotY + plotHeight + 10);
    }

    // title (optional small)
    ctx.fillStyle = '#222';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Total Wealth', plotX, 6);

    ctx.restore();
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
