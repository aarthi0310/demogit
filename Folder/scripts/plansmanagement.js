// plansmanagement.js
const API_URL = "http://localhost:8081/api/plans";

async function fetchWithToken(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
    };
    return fetch(url, options);
}

async function fetchPlans() {
    const response = await fetchWithToken(API_URL);
    return await response.json();
}

async function fetchAnalytics() {
    const response = await fetchWithToken(`${API_URL}/analytics`);
    return await response.json();
}

async function savePlan(plan) {
    const method = plan.id ? "PUT" : "POST";
    const url = plan.id ? `${API_URL}/${plan.id}` : API_URL;
    const response = await fetchWithToken(url, {
        method: method,
        body: JSON.stringify(plan),
    });
    return await response.json();
}

async function deletePlan(id) {
    const response = await fetchWithToken(`${API_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete plan");
}

async function togglePlanStatus(planId) {
    const response = await fetchWithToken(`${API_URL}/${planId}/toggle`, { method: "PUT" });
    return await response.json();
}

async function bulkToggle(isActive) {
    const response = await fetchWithToken(`${API_URL}/bulk-toggle?active=${isActive}`, { method: "PUT" });
    return await response.json();
}

document.addEventListener("DOMContentLoaded", () => {
    displayPlansAdmin();
    document.getElementById("planForm").addEventListener("submit", handlePlanFormSubmit);
    document.getElementById("searchPlans").addEventListener("input", displayPlansAdmin);
    document.getElementById("categoryFilter").addEventListener("change", displayPlansAdmin);
    document.getElementById("statusFilter").addEventListener("change", displayPlansAdmin);
    document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
        document.querySelector('.fixed-sidebar').classList.toggle('show');
    });
});

async function displayPlansAdmin() {
    const plans = await fetchPlans();
    const analytics = await fetchAnalytics();
    const tableBody = document.getElementById("plansTableBody");
    const searchText = document.getElementById("searchPlans").value.toLowerCase();
    const categoryFilter = document.getElementById("categoryFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;

    let plansToShow = plans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchText);
        const matchesCategory = categoryFilter === "all" || plan.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || 
            (statusFilter === "active" && plan.active) || 
            (statusFilter === "inactive" && !plan.active);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    tableBody.innerHTML = "";
    plansToShow.forEach(plan => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td class="px-6 py-4">${plan.name}</td>
            <td class="px-6 py-4">₹${plan.price}</td>
            <td class="px-6 py-4">${plan.data}</td>
            <td class="px-6 py-4">${plan.validity} days</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs ${getCategoryColor(plan.category)}">${capitalize(plan.category)}</span></td>
            <td class="px-6 py-4">
                <span class="status-indicator ${plan.active ? 'status-active' : 'status-inactive'}"></span>
                <label class="switch">
                    <input type="checkbox" ${plan.active ? "checked" : ""} onchange="togglePlanStatus(${plan.id})">
                    <span class="switch-slider"></span>
                </label>
            </td>
            <td class="px-6 py-4 flex space-x-3">
                <button onclick="editPlan(${plan.id})" class="action-btn edit-btn" title="Edit Plan"><i class="fas fa-edit"></i></button>
                <button onclick="openDeleteModal(${plan.id})" class="action-btn delete-btn" title="Delete Plan"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    updateAnalytics(analytics);
}

function getCategoryColor(category) {
    const colors = {
        popular: "bg-orange-100 text-orange-800",
        validity: "bg-green-100 text-green-800",
        data: "bg-blue-100 text-blue-800",
        unlimited: "bg-purple-100 text-purple-800",
        entertainment: "bg-pink-100 text-pink-800",
        international: "bg-indigo-100 text-indigo-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function updateAnalytics(analytics) {
    document.getElementById("totalPlans").textContent = analytics.totalPlans;
    document.getElementById("activePlans").textContent = analytics.activePlans;
    document.getElementById("avgPrice").textContent = `₹${analytics.averagePrice.toFixed(2)}`;
}

function openAddPlanModal() {
    document.getElementById("modalTitle").textContent = "Add New Plan";
    document.getElementById("planForm").reset();
    document.getElementById("planId").value = "";
    document.getElementById("planModal").style.display = "block";
}

async function editPlan(id) {
    const plans = await fetchPlans();
    const plan = plans.find(p => p.id === id);
    document.getElementById("modalTitle").textContent = "Edit Plan";
    document.getElementById("planId").value = plan.id;
    document.getElementById("planName").value = plan.name;
    document.getElementById("planPrice").value = plan.price;
    document.getElementById("planData").value = plan.data;
    document.getElementById("planValidity").value = plan.validity;
    document.getElementById("planCategory").value = plan.category;
    document.getElementById("planModal").style.display = "block";
}

function closePlanModal() {
    document.getElementById("planModal").style.display = "none";
}

function openDeleteModal(id) {
    document.getElementById("deletePlanId").value = id;
    document.getElementById("deleteModal").style.display = "block";
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

async function confirmDeletePlan() {
    const id = parseInt(document.getElementById("deletePlanId").value);
    await deletePlan(id);
    closeDeleteModal();
    showMessage("Plan deleted!", "success");
    displayPlansAdmin();
}

async function handlePlanFormSubmit(event) {
    event.preventDefault();
    const planId = document.getElementById("planId").value;
    const newPlan = {
        id: planId ? parseInt(planId) : null,
        name: document.getElementById("planName").value,
        price: parseFloat(document.getElementById("planPrice").value),
        data: document.getElementById("planData").value,
        validity: document.getElementById("planValidity").value,
        category: document.getElementById("planCategory").value,
        active: true
    };
    await savePlan(newPlan);
    showMessage(planId ? "Plan updated!" : "Plan added!", "success");
    closePlanModal();
    displayPlansAdmin();
}

async function downloadCSV() {
    const response = await fetchWithToken(`${API_URL}/export-csv`);
    const csvContent = await response.text();
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plans_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showMessage("CSV downloaded!", "success");
}

function showMessage(message, type) {
    const box = document.createElement("div");
    box.className = `fixed top-4 right-4 p-4 rounded-md shadow-md ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
}