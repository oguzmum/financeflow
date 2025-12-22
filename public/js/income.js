let income = [];
let incomeTemplates = [];

async function initIncome() {
    try {
        await Promise.all([loadIncome(), loadIncomeTemplates()]);
        renderIncomeList();
        renderTemplateIncomePicker();
        renderTemplateList();
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Could not load income data.', 'error');
    }
}

async function loadIncome() {
    income = await apiRequest('/incomes');
}

async function loadIncomeTemplates() {
    incomeTemplates = await apiRequest('/templates/income');
}

async function addEntry() {
    const name = document.getElementById('name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();

    if (!name || !amount) {
        showMessage('message', 'Please fill in all required fields.', 'error');
        return;
    }

    try {
        await apiRequest('/incomes', {
            method: 'POST',
            body: { name, amount, description }
        });

        await loadIncome();
        clearIncomeForm();
        renderIncomeList();
        renderTemplateIncomePicker();
        showMessage('message', 'Income added successfully.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Failed to add income.', 'error');
    }
}

function clearIncomeForm() {
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
}

async function deleteEntry(id) {
    try {
        await apiRequest(`/incomes/${id}`, { method: 'DELETE' });
        await Promise.all([loadIncome(), loadIncomeTemplates()]);
        renderIncomeList();
        renderTemplateIncomePicker();
        renderTemplateList();
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Failed to delete income.', 'error');
    }
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

async function createTemplate() {
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

    try {
        await apiRequest('/templates/income', {
            method: 'POST',
            body: { name, income_ids: selected }
        });

        document.getElementById('templateName').value = '';
        document.querySelectorAll('.template-income-option').forEach(el => el.checked = false);

        await loadIncomeTemplates();
        renderTemplateList();
        showMessage('templateMessage', 'Template saved successfully.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('templateMessage', error.message || 'Failed to save template.', 'error');
    }
}

async function deleteTemplate(id) {
    try {
        await apiRequest(`/templates/income/${id}`, { method: 'DELETE' });
        await loadIncomeTemplates();
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
        const entries = template.incomes || [];
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
