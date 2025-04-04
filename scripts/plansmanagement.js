const API_URL = "http://localhost:8081/api/plans";

let currentPage = 0;
const itemsPerPage = 5;

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('jwtToken');
    console.log("JWT Token from localStorage:", token);
    if (!token) {
        console.warn("No JWT token found. Redirecting to login page.");
        window.location.href = '/admin/adminlogin.html';
        return;
    }

    loadPlans();
    loadAnalytics();
    setupEventListeners();
    setupMobileMenu();
});

function setupEventListeners() {
    document.getElementById('searchPlans').addEventListener('input', () => loadPlans(0));
    document.getElementById('statusFilter').addEventListener('change', () => loadPlans(0));
    document.getElementById('planForm').addEventListener('submit', savePlan);
    document.getElementById('prevPage').addEventListener('click', () => loadPlans(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => loadPlans(currentPage + 1));
}

function setupMobileMenu() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.fixed-sidebar');
    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => sidebar.classList.toggle('show'));
    } else {
        console.error("Mobile menu elements not found in the DOM");
    }
}

async function loadPlans(page = currentPage) {
    const search = document.getElementById('searchPlans').value;
    const status = document.getElementById('statusFilter').value === 'all' ? '' : document.getElementById('statusFilter').value;

    try {
        const response = await fetchWithAuth(`${API_URL}?page=${page}&size=${itemsPerPage}&search=${search}&status=${status}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/admin/adminlogin.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            const errorText = await response.text();
            console.error("Error Response Body:", errorText);
            throw new Error(`Failed to fetch plans: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        console.log("Fetched plans data:", data);
        currentPage = data.number;

        const tbody = document.getElementById('plansTableBody');
        if (!tbody) {
            console.error("plansTableBody element not found in the DOM");
            return;
        }
        tbody.innerHTML = '';
        if (data.content.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center">No plans available.</td></tr>';
        } else {
            data.content.forEach(plan => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">${plan.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">₹${plan.price}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${plan.data}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${plan.validity}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${plan.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="status-indicator ${plan.active ? 'status-active' : 'status-inactive'}"></span>
                        ${plan.active ? 'Active' : 'Inactive'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button class="action-btn edit-btn" onclick="openEditPlanModal(${plan.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="openDeleteModal(${plan.id})"><i class="fas fa-trash"></i></button>
                        <button class="action-btn" onclick="togglePlanStatus(${plan.id})"><i class="fas fa-power-off"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        updatePagination(data.totalPages);
    } catch (error) {
        console.error('Error loading plans:', error);
    }
}

async function loadAnalytics() {
    try {
        const response = await fetchWithAuth(`${API_URL}/analytics`, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access for analytics request.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/admin/adminlogin.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            throw new Error(`Failed to fetch analytics: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        document.getElementById('totalPlans').textContent = data.totalPlans;
        document.getElementById('activePlans').textContent = data.activePlans;
        document.getElementById('avgPrice').textContent = `₹${data.averagePrice.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function updatePagination(totalPages) {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const paginationNumbers = document.getElementById('paginationNumbers');

    if (!prevButton || !nextButton || !paginationNumbers) {
        console.error("Pagination elements not found in the DOM");
        return;
    }

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= totalPages - 1;

    paginationNumbers.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i + 1;
        btn.className = `px-3 py-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'}`;
        btn.addEventListener('click', () => loadPlans(i));
        paginationNumbers.appendChild(btn);
    }
}

function openAddPlanModal() {
    document.getElementById('modalTitle').textContent = 'Add New Plan';
    document.getElementById('planId').value = '';
    document.getElementById('planForm').reset();
    document.getElementById('planActive').checked = true; // Default to active for new plans
    document.getElementById('planModal').style.display = 'block';
}

async function openEditPlanModal(id) {
    console.log("Opening edit modal for plan ID:", id);
    try {
        const response = await fetchWithAuth(`${API_URL}/${id}`, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("Response Status:", response.status);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/admin/adminlogin.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            if (response.status === 404) {
                console.error("Plan not found for ID:", id);
                alert("Plan not found. It may have been deleted.");
                return;
            }
            const errorText = await response.text();
            console.error("Error Response Body:", errorText);
            throw new Error(`Failed to fetch plan: ${response.statusText} (${response.status})`);
        }

        const plan = await response.json();
        console.log("Fetched plan for editing:", plan);

        const modalTitle = document.getElementById('modalTitle');
        const planIdInput = document.getElementById('planId');
        const planNameInput = document.getElementById('planName');
        const planPriceInput = document.getElementById('planPrice');
        const planDataInput = document.getElementById('planData');
        const planValidityInput = document.getElementById('planValidity');
        const planCategoryInput = document.getElementById('planCategory');
        const planActiveInput = document.getElementById('planActive');
        const planModal = document.getElementById('planModal');

        if (!modalTitle || !planIdInput || !planNameInput || !planPriceInput || !planDataInput || !planValidityInput || !planCategoryInput || !planActiveInput || !planModal) {
            console.error("One or more DOM elements not found:", {
                modalTitle, planIdInput, planNameInput, planPriceInput, planDataInput, planValidityInput, planCategoryInput, planActiveInput, planModal
            });
            return;
        }

        modalTitle.textContent = 'Edit Plan';
        planIdInput.value = plan.id;
        planNameInput.value = plan.name;
        planPriceInput.value = plan.price;
        planDataInput.value = plan.data;
        planValidityInput.value = plan.validity;
        planCategoryInput.value = plan.category || '';
        planActiveInput.checked = plan.active; // Set the active status
        planModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching plan:', error);
        alert('Failed to load plan details. Please try again.');
    }
}

function closePlanModal() {
    document.getElementById('planModal').style.display = 'none';
}

async function savePlan(e) {
    e.preventDefault();
    const id = document.getElementById('planId').value;
    console.log("Saving plan with ID:", id);

    const plan = {
        name: document.getElementById('planName').value,
        price: parseFloat(document.getElementById('planPrice').value),
        data: document.getElementById('planData').value,
        validity: document.getElementById('planValidity').value,
        category: document.getElementById('planCategory').value.trim(),
        active: document.getElementById('planActive').checked // Use the checkbox value
    };
    console.log("Plan data to save:", plan);

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;
        console.log("Sending request to:", url, "with method:", method);

        const response = await fetchWithAuth(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan)
        });

        console.log("Response Status:", response.status);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/admin/adminlogin.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            const errorText = await response.text();
            console.error("Error Response Body:", errorText);
            throw new Error(`Failed to save plan: ${response.statusText} (${response.status})`);
        }

        closePlanModal();
        loadPlans();
        loadAnalytics();
    } catch (error) {
        console.error('Error saving plan:', error);
        alert('Failed to save plan. Please try again.');
    }
}

function openDeleteModal(id) {
    document.getElementById('deletePlanId').value = id;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDeletePlan() {
    const id = document.getElementById('deletePlanId').value;
    try {
        const response = await fetchWithAuth(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModal();
            loadPlans();
            loadAnalytics();
        } else {
            console.error('Error deleting plan:', response.statusText);
        }
    } catch (error) {
        console.error('Error deleting plan:', error);
    }
}

async function togglePlanStatus(id) {
    try {
        const response = await fetchWithAuth(`${API_URL}/${id}/toggle`, {
            method: 'PUT'
        });

        if (response.ok) {
            loadPlans();
            loadAnalytics();
        } else {
            console.error('Error toggling plan status:', response.statusText);
        }
    } catch (error) {
        console.error('Error toggling plan status:', error);
    }
}

async function bulkToggle(active) {
    try {
        const response = await fetchWithAuth(`${API_URL}/bulk-toggle?active=${active}`, {
            method: 'PUT'
        });

        if (response.ok) {
            loadPlans();
            loadAnalytics();
        } else {
            console.error('Error bulk toggling plans:', response.statusText);
        }
    } catch (error) {
        console.error('Error bulk toggling plans:', error);
    }
}

async function downloadCSV() {
    const search = document.getElementById('searchPlans').value;
    const status = document.getElementById('statusFilter').value === 'all' ? '' : document.getElementById('statusFilter').value;

    try {
        const response = await fetchWithAuth(`${API_URL}/export-csv?search=${search}&status=${status}`);
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plans.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading CSV:', error);
    }
}

function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('jwtToken');
    console.log("Using JWT Token in fetchWithAuth:", token);
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    } else {
        console.warn('No JWT token found in localStorage');
    }
    return fetch(url, options);
}