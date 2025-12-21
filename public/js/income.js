let income = [];
let incomeTemplates = [];

function initIncome() {
    income = getIncome();
    incomeTemplates = getIncomeTemplates();
    renderIncomeList();
    renderTemplateIncomePicker();
    renderTemplateList();
}

function saveIncome() {
    localStorage.setItem('income', JSON.stringify(income));
}

function saveIncomeTemplates() {
    localStorage.setItem('incomeTemplates', JSON.stringify(incomeTemplates));
}

function addEntry() {
    const name = document.getElementById('name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();

    if (!name || !amount) {
        showMessage('message', 'Please fill in all required fields.', 'error');
        return;
    }

    const entry = {
        id: Date.now(),
        name,
        amount,
        description
    };

    income.push(entry);
    saveIncome();

    clearIncomeForm();
    renderIncomeList();
    renderTemplateIncomePicker();
    showMessage('message', 'Income added successfully.', 'success');
}

function clearIncomeForm() {
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
}

function deleteEntry(id) {
    income = income.filter(e => e.id !== id);
    saveIncome();
    pruneTemplates();
    renderIncomeList();
    renderTemplateIncomePicker();
    renderTemplateList();
}

function renderIncomeList() {
    const listContainer = document.getElementById('list');

    if (!income.length) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No income added yet</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML =
        '<h3>Your Income:</h3>' +
        income.map(e => `
            <div class="entry-item">
                <div class="entry-info">
                    <div class="entry-name">${e.name}</div>
                    ${e.description ? `<div class="entry-details">${e.description}</div>` : ''}
                </div>
                <div class="entry-amount">${formatCurrency(e.amount)}</div>
                <button class="btn-delete" onclick="deleteEntry(${e.id})">Delete</button>
            </div>
        `).join('');
}

function renderTemplateIncomePicker() {
    const picker = document.getElementById('templateIncomePicker');
    if (!picker) return;

    if (!income.length) {
        picker.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧾</div>
                <p>Add income entries first to create templates.</p>
            </div>
        `;
        return;
    }

    picker.innerHTML = `
        <p>Select the income entries that should belong to this template.</p>
        <div class="template-income-grid">
            ${income.map(entry => `
                <label class="template-income-card">
                    <input type="checkbox" class="template-income-option" value="${entry.id}">
                    <div>
                        <div class="entry-name">${entry.name}</div>
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
    const selected = Array.from(document.querySelectorAll('.template-income-option:checked'))
        .map(el => Number(el.value));

    if (!name) {
        showMessage('templateMessage', 'Please provide a template name.', 'error');
        return;
    }

    if (!selected.length) {
        showMessage('templateMessage', 'Select at least one income for the template.', 'error');
        return;
    }

    const template = {
        id: Date.now(),
        name,
        incomeIds: selected,
        createdAt: new Date().toISOString()
    };

    incomeTemplates.push(template);
    saveIncomeTemplates();

    document.getElementById('templateName').value = '';
    document.querySelectorAll('.template-income-option').forEach(el => el.checked = false);

    renderTemplateList();
    showMessage('templateMessage', 'Template saved successfully.', 'success');
}

function deleteTemplate(id) {
    incomeTemplates = incomeTemplates.filter(t => t.id !== id);
    saveIncomeTemplates();
    renderTemplateList();
    showMessage('templateMessage', 'Template removed.', 'success');
}

function pruneTemplates() {
    const existingIds = new Set(income.map(e => e.id));
    let changed = false;

    incomeTemplates = incomeTemplates.map(template => {
        const filteredIds = template.incomeIds.filter(id => existingIds.has(id));
        if (filteredIds.length !== template.incomeIds.length) {
            changed = true;
        }
        return { ...template, incomeIds: filteredIds };
    }).filter(template => template.incomeIds.length);

    if (changed) {
        saveIncomeTemplates();
    }
}

function renderTemplateList() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    if (!incomeTemplates.length) {
        templateList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧩</div>
                <p>No templates yet. Create one to reuse your income combinations.</p>
            </div>
        `;
        return;
    }

    templateList.innerHTML = '<h3>Saved Templates:</h3>' + incomeTemplates.map(template => {
        const entries = income.filter(item => template.incomeIds.includes(item.id));
        const incomeSummary = entries.map(item => item.name).join(', ') || 'No incomes linked';
        return `
            <div class="entry-item">
                <div class="entry-info">
                    <div class="entry-name">${template.name}</div>
                    <div class="entry-details">
                        ${incomeSummary}
                    </div>
                </div>
                <div class="btn-actions">
                    <button class="btn-delete" onclick="deleteTemplate(${template.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize on load
initIncome();
