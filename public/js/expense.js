let expenses = [];
let expenseTemplates = [];

async function initExpenses() {
    try {
        setupAnnualPaymentToggle();
        await Promise.all([loadExpenses(), loadExpenseTemplates()]);
        renderExpenseList();
        renderTemplateExpensePicker();
        renderTemplateList();
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Could not load expenses.', 'error');
    }
}

async function loadExpenses() {
    expenses = await apiRequest('/expenses');
}

async function loadExpenseTemplates() {
    expenseTemplates = await apiRequest('/templates/expense');
}

async function addEntry() {
    const name = document.getElementById('name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const isAnnualPayment = document.getElementById('isAnnualPayment').checked;
    const annualMonthValue = document.getElementById('annualMonth').value;
    const annualMonth = isAnnualPayment && annualMonthValue ? Number(annualMonthValue) : null;

    if (!name || !amount) {
        showMessage('message', 'Please fill in all required fields.', 'error');
        return;
    }

    if (isAnnualPayment && !annualMonth) {
        showMessage('message', 'Bitte Monat für die Jahreszahlung auswählen.', 'error');
        return;
    }

    try {
        await apiRequest('/expenses', {
            method: 'POST',
            body: {
                name,
                amount,
                category,
                description,
                is_annual_payment: isAnnualPayment,
                annual_month: annualMonth
            }
        });

        await loadExpenses();
        clearExpenseForm();
        renderExpenseList();
        renderTemplateExpensePicker();
        showMessage('message', 'Expense added successfully.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Failed to add expense.', 'error');
    }
}

function clearExpenseForm() {
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = 'housing';
    const checkbox = document.getElementById('isAnnualPayment');
    const monthSelect = document.getElementById('annualMonth');
    if (checkbox) checkbox.checked = false;
    if (monthSelect) monthSelect.value = '';
    toggleAnnualMonth(false);
}

async function deleteEntry(id) {
    try {
        await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
        await Promise.all([loadExpenses(), loadExpenseTemplates()]);
        renderExpenseList();
        renderTemplateExpensePicker();
        renderTemplateList();
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Failed to delete expense.', 'error');
    }
}

function renderExpenseList() {
    const listContainer = document.getElementById('list');

    if (!expenses.length) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No expenses added yet</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML =
        '<h3>Your Expenses:</h3>' +
        expenses.map(e => `
            <div class="entry-item">
                <div class="entry-info">
                    <div class="entry-name">${e.name}</div>
                    <div class="entry-details">
                        ${getCategoryText(e.category)}
                        ${formatExpenseSchedule(e)}
                        ${e.description ? ` • ${e.description}` : ''}
                    </div>
                </div>
                <div class="entry-amount">${formatCurrency(e.amount)}</div>
                <button class="btn-delete" onclick="deleteEntry(${e.id})">Delete</button>
            </div>
        `).join('');
}

function renderTemplateExpensePicker() {
    const picker = document.getElementById('templateExpensePicker');
    if (!picker) return;

    if (!expenses.length) {
        picker.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧾</div>
                <p>Add expenses first to create templates.</p>
            </div>
        `;
        return;
    }

    picker.innerHTML = `
        <p>Select the expenses that should belong to this template.</p>
        <div class="template-income-grid">
            ${expenses.map(entry => `
                <label class="template-income-card">
                    <input type="checkbox" class="template-expense-option" value="${entry.id}">
                    <div>
                        <div class="entry-name">${entry.name}</div>
                        <div class="entry-details">${getCategoryText(entry.category)}</div>
                        <div class="entry-details">${formatExpenseSchedule(entry)}</div>
                        <div class="entry-details">${formatCurrency(entry.amount)}</div>
                        ${entry.description ? `<div class="entry-details">${entry.description}</div>` : ''}
                    </div>
                </label>
            `).join('')}
        </div>
    `;
}

async function createTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const selected = Array.from(document.querySelectorAll('.template-expense-option:checked'))
        .map(el => Number(el.value));

    if (!name) {
        showMessage('templateMessage', 'Please provide a template name.', 'error');
        return;
    }

    if (!selected.length) {
        showMessage('templateMessage', 'Select at least one expense for the template.', 'error');
        return;
    }

    try {
        await apiRequest('/templates/expense', {
            method: 'POST',
            body: { name, expense_ids: selected }
        });

        document.getElementById('templateName').value = '';
        document.querySelectorAll('.template-expense-option').forEach(el => el.checked = false);

        await loadExpenseTemplates();
        renderTemplateList();
        showMessage('templateMessage', 'Template saved successfully.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('templateMessage', error.message || 'Failed to save template.', 'error');
    }
}

async function deleteTemplate(id) {
    try {
        await apiRequest(`/templates/expense/${id}`, { method: 'DELETE' });
        await loadExpenseTemplates();
        renderTemplateList();
        showMessage('templateMessage', 'Template removed.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('templateMessage', error.message || 'Failed to delete template.', 'error');
    }
}

function renderTemplateList() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    if (!expenseTemplates.length) {
        templateList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧩</div>
                <p>No templates yet. Create one to reuse your expense combinations.</p>
            </div>
        `;
        return;
    }

    templateList.innerHTML = '<h3>Saved Templates:</h3>' + expenseTemplates.map(template => {
        const entries = template.expenses || [];
        const expenseSummary = entries.map(item => item.name).join(', ') || 'No expenses linked';
        return `
            <div class="entry-item">
                <div class="entry-info">
                    <div class="entry-name">${template.name}</div>
                    <div class="entry-details">${expenseSummary}</div>
                </div>
                <div class="btn-actions">
                    <button class="btn-delete" onclick="deleteTemplate(${template.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initExpenses();
});


// Initialize on load
// initExpenses();

function setupAnnualPaymentToggle() {
    const checkbox = document.getElementById('isAnnualPayment');
    if (!checkbox) return;
    checkbox.addEventListener('change', () => toggleAnnualMonth(checkbox.checked));
    toggleAnnualMonth(checkbox.checked);
}

function toggleAnnualMonth(forceVisible) {
    const monthGroup = document.getElementById('annualMonthGroup');
    const monthSelect = document.getElementById('annualMonth');
    if (!monthGroup) return;
    const show = forceVisible ?? false;
    monthGroup.style.display = show ? 'block' : 'none';
    if (!show && monthSelect) {
        monthSelect.value = '';
    }
}

function formatExpenseSchedule(expense) {
    if (!expense?.is_annual_payment) return '• Monthly';

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName =
        monthNames[(Number(expense.annual_month) || 1) - 1] || 'Unknown month';

    return `• Yearly in ${monthName}`;
}

