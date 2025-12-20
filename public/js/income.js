let income = [];

function initIncome() {
    income = getIncome();
    render();
}

function addEntry() {
    const name = document.getElementById('name').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const frequency = document.getElementById('frequency').value;
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const startYear = parseInt(document.getElementById('startYear').value);
    const description = document.getElementById('description').value;

    if (!name || !amount || !startMonth || !startYear) {
        showMessage('message', 'Please fill in all required fields.', 'error');
        return;
    }

    const entry = {
        id: Date.now(),
        name,
        amount,
        frequency,
        startMonth,
        startYear,
        description
    };

    income.push(entry);
    localStorage.setItem('income', JSON.stringify(income));

    // Clear form
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';

    render();
    showMessage('message', 'Income added successfully.', 'success');
}

function deleteEntry(id) {
    income = income.filter(e => e.id !== id);
    localStorage.setItem('income', JSON.stringify(income));
    render();
}

function render() {
    const listContainer = document.getElementById('list');

    if (income.length === 0) {
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
                    <div class="entry-details">
                        ${getFrequencyText(e.frequency)} starting ${e.startMonth}/${e.startYear}
                    </div>
                </div>
                <div class="entry-amount">${formatCurrency(e.amount)}</div>
                <button class="btn-delete" onclick="deleteEntry(${e.id})">Delete</button>
            </div>
        `).join('');
}

// Initialize on load
initIncome();
