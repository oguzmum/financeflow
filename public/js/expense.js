let expenses = [];
let expenseTemplates = [];

function initExpenses() {
    expenses = getExpenses();
    expenseTemplates = getExpenseTemplates();
    pruneExpenseTemplates();
    renderExpenseList();
    renderTemplateExpensePicker();
    renderTemplateList();
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function saveExpenseTemplates() {
    localStorage.setItem('expenseTemplates', JSON.stringify(expenseTemplates));
}

function addEntry() {
    const name = document.getElementById('name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();

    if (!name || !amount) {
        showMessage('message', 'Please fill in all required fields.', 'error');
        return;
    }

    const entry = {
        id: Date.now(),
        name,
        amount,
        category,
        description
    };

    expenses.push(entry);
    saveExpenses();

    clearExpenseForm();
    renderExpenseList();
    renderTemplateExpensePicker();
    showMessage('message', 'Expense added successfully.', 'success');
}

function clearExpenseForm() {
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = 'housing';
}

function deleteEntry(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveExpenses();
    pruneExpenseTemplates();
    renderExpenseList();
    renderTemplateExpensePicker();
    renderTemplateList();
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
                        <div class="entry-details">${formatCurrency(entry.amount)}</div>
                        ${entry.description ? `<div class="entry-details">${entry.description}</div>` : ''}
                    </div>
                </label>
            `).join('')}
        </div>
    `;
}

function createTemplate() {
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

    const template = {
        id: Date.now(),
        name,
        expenseIds: selected,
        createdAt: new Date().toISOString()
    };

    expenseTemplates.push(template);
    saveExpenseTemplates();

    document.getElementById('templateName').value = '';
    document.querySelectorAll('.template-expense-option').forEach(el => el.checked = false);

    renderTemplateList();
    showMessage('templateMessage', 'Template saved successfully.', 'success');
}

function deleteTemplate(id) {
    expenseTemplates = expenseTemplates.filter(t => t.id !== id);
    saveExpenseTemplates();
    renderTemplateList();
    showMessage('templateMessage', 'Template removed.', 'success');
}

function pruneExpenseTemplates() {
    const existingIds = new Set(expenses.map(e => e.id));
    let changed = false;

    expenseTemplates = expenseTemplates.map(template => {
        const filteredIds = template.expenseIds.filter(id => existingIds.has(id));
        if (filteredIds.length !== template.expenseIds.length) {
            changed = true;
        }
        return { ...template, expenseIds: filteredIds };
    }).filter(template => template.expenseIds.length);

    if (changed) {
        saveExpenseTemplates();
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
        const entries = expenses.filter(item => template.expenseIds.includes(item.id));
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

// Initialize on load
initExpenses();
