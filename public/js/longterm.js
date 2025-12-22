let longtermPlans = [];

function initLongterm() {
    longtermPlans = getLongtermPlans();
    renderPlans();
}

function renderPlans() {
    const container = document.getElementById('planList');
    if (!container) return;

    if (!longtermPlans.length) {
        container.innerHTML = `
            <div class="empty-state" style="width:100%">
                <div class="empty-state-icon">🗂️</div>
                <p>No plan added.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = longtermPlans.map(plan => `
        <div class="plan-card" onclick="openPlan(${plan.id})">
            <div class="pill">Plan</div>
            <h3>${plan.name}</h3>
            ${plan.description ? `<p>${plan.description}</p>` : '<p>No Description.</p>'}
            <div class="plan-meta">Created on ${new Date(plan.createdAt).toLocaleDateString()}</div>
        </div>
    `).join('');
}

function openPlan(id) {
    window.location.href = `longterm-detail.html?id=${id}`;
}

function openPlanModal() {
    document.getElementById('planModal').classList.add('active');
}

function closePlanModal() {
    document.getElementById('planModal').classList.remove('active');
    document.getElementById('planName').value = '';
    document.getElementById('planDescription').value = '';
}

function createPlan() {
    const name = document.getElementById('planName').value.trim();
    const description = document.getElementById('planDescription').value.trim();

    if (!name) {
        alert('Add a name for the plan.');
        return;
    }

    const plan = {
        id: Date.now(),
        name,
        description,
        createdAt: new Date().toISOString()
    };

    longtermPlans.push(plan);
    saveLongtermPlans(longtermPlans);
    closePlanModal();
    renderPlans();
}

initLongterm();
