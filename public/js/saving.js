let savings = [];
let savingTemplates = [];

async function init() {
    try {
        await Promise.all([loadSavings(), loadTemplates()]);
        renderList();
        renderTemplatePicker();
        renderTemplates();
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Could not load savings.', 'error');
    }
}

async function loadSavings() {
    savings = await apiRequest('/savings');
}

async function loadTemplates() {
    savingTemplates = await apiRequest('/templates/saving');
}

function renderList() {
    const list = document.getElementById('list');
    if (!list) return;

    if (!savings.length) {
        list.innerHTML = '<div class="helper-text">No savings added yet.</div>';
        return;
    }

    list.innerHTML = savings.map(entry => `
        <div class="entry-item">
            <div class="entry-info">
                <div>
                    <div class="entry-name">${entry.name}</div>
                    ${entry.description ? `<div class="entry-sub">${entry.description}</div>` : ''}
                </div>
            </div>
            <div class="entry-amount">${formatCurrency(entry.amount)}</div>
            <button class="btn-delete" onclick="removeSaving(${entry.id})">Delete</button>
        </div>
    `).join('');
}

function renderTemplatePicker() {
    const container = document.getElementById('templateSavingPicker');
    if (!container) return;

    if (!savings.length) {
        container.innerHTML = '<div class="helper-text">Create savings first.</div>';
        return;
    }

    container.innerHTML = savings.map(item => `
        <label class="template-check-item">
            <input type="checkbox" class="saving-checkbox" value="${item.id}">
            <span class="template-check-label">${item.name} (${formatCurrency(item.amount)})</span>
        </label>
    `).join('');
}

function renderTemplates() {
    const list = document.getElementById('templateList');
    if (!list) return;

    if (!savingTemplates.length) {
        list.innerHTML = '<div class="helper-text">No templates yet.</div>';
        return;
    }

    list.innerHTML = savingTemplates.map(t => `
        <div class="entry-item">
            <div>
                <div class="entry-name">${t.name}</div>
                <div class="entry-details">${t.savings.map(s => s.name).join(', ')}</div>
                ${t.description ? `<div class="entry-sub">${t.description}</div>` : ''}
            </div>
            <button class="btn-delete" onclick="deleteTemplate(${t.id})">Delete</button>
        </div>
    `).join('');
}

async function addSaving() {
    const name = document.getElementById('name').value.trim();
    const amount = Number(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();

    if (!name || !Number.isFinite(amount) || amount <= 0) {
        showMessage('message', 'Please enter a name and an amount greater than 0.', 'error');
        return;
    }

    try {
        await apiRequest('/savings', {
            method: 'POST',
            body: { name, amount, description: description || null }
        });
        document.getElementById('name').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        await loadSavings();
        renderList();
        renderTemplatePicker();
        showMessage('message', 'Saving added successfully.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('message', error.message || 'Could not save saving.', 'error');
    }
}

async function removeSaving(id) {
    if (!confirm('Are you sure you want to delete this saving?')) return;
    try {
        await apiRequest(`/savings/${id}`, { method: 'DELETE' });
        await Promise.all([loadSavings(), loadTemplates()]);
        renderList();
        renderTemplatePicker();
        renderTemplates();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Could not delete saving.');
    }
}

async function createTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const ids = Array.from(document.querySelectorAll('.saving-checkbox:checked'))
        .map(cb => Number(cb.value));

    if (!name || !ids.length) {
        showMessage('templateMessage', 'Please provide a name and select at least one saving.', 'error');
        return;
    }

    try {
        await apiRequest('/templates/saving', {
            method: 'POST',
            body: { name, saving_ids: ids, description: null }
        });
        document.getElementById('templateName').value = '';
        document.querySelectorAll('.saving-checkbox').forEach(cb => cb.checked = false);
        await loadTemplates();
        renderTemplates();
        showMessage('templateMessage', 'Template saved successfully.', 'success');
    } catch (error) {
        console.error(error);
        showMessage('templateMessage', error.message || 'Could not save template.', 'error');
    }
}

async function deleteTemplate(id) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
        await apiRequest(`/templates/saving/${id}`, { method: 'DELETE' });
        await loadTemplates();
        renderTemplates();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Could not delete template.');
    }
}

init();
