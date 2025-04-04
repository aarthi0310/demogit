// Function to calculate days left
function getDaysLeft(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Function to get status badge class based on days left
function getStatusBadge(daysLeft) {
    if (daysLeft <= 1) {
        return { class: 'status-badge status-critical', text: 'Critical', icon: 'exclamation-circle' };
    } else if (daysLeft <= 3) {
        return { class: 'status-badge status-warning', text: 'Warning', icon: 'exclamation-triangle' };
    } else {
        return { class: 'status-badge status-normal', text: 'Upcoming', icon: 'clock' };
    }
}

// Function to show notification popup
function showNotification(message, isError = false) {
    const popup = document.createElement('div');
    popup.className = `fixed top-4 right-4 ${isError ? 'bg-red-500' : 'bg-green-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    popup.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 300);
    }, 3000);
}

// Function to export data as CSV
function exportToCSV(customers) {
    const headers = ['Name', 'Phone', 'Plan', 'Expiry Date', 'Amount', 'Notified'];
    const rows = customers.map(customer => [
        customer.name,
        customer.phoneNumber,
        customer.planName,
        customer.expiryDate.split('T')[0],
        `₹${customer.amount}`,
        customer.notified ? 'Yes' : 'No'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(',') + '\n';
    csvContent += rows.map(row => row.join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expiring_plans_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to filter and sort customers
function filterAndSortCustomers(customers, filterValue, sortValue) {
    console.log('Filtering with:', filterValue, 'Sorting with:', sortValue);
    let filteredCustomers = [...customers];
    
    if (filterValue !== 'all') {
        filteredCustomers = filteredCustomers.filter(customer => {
            const daysLeft = getDaysLeft(customer.expiryDate);
            console.log('Customer:', customer.name, 'Days Left:', daysLeft);
            switch (filterValue) {
                case 'today':
                    return daysLeft <= 1;
                case '3days':
                    return daysLeft <= 3;
                case 'week':
                    return daysLeft <= 7;
                default:
                    return true;
            }
        });
    }
    
    filteredCustomers.sort((a, b) => {
        switch (sortValue) {
            case 'expiry-asc':
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            case 'expiry-desc':
                return new Date(b.expiryDate) - new Date(a.expiryDate);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });
    
    console.log('Filtered and sorted customers:', filteredCustomers);
    return filteredCustomers;
}

// Function to display expiring plans in the table
function renderExpiringPlansTable(customers) {
    const tableBody = document.getElementById("expiringPlansTable");
    tableBody.innerHTML = "";
    
    customers.forEach(customer => {
        const daysLeft = getDaysLeft(customer.expiryDate);
        const statusBadge = getStatusBadge(daysLeft);
        
        const row = document.createElement("tr");
        row.className = "table-row";
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-gray-500"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${customer.name}</div>
                        <div class="text-sm text-gray-500">${customer.phoneNumber}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${customer.planName}</div>
                <div class="text-sm text-gray-500">
                    <span class="mr-2">₹${customer.amount}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="mb-1">
                    <span class="${statusBadge.class}">
                        <i class="fas fa-${statusBadge.icon} mr-1"></i> ${statusBadge.text}
                    </span>
                </div>
                <div class="text-sm text-gray-500">
                    <span>Expires: ${customer.expiryDate.split('T')[0]}</span>
                    <span class="font-medium ml-2 ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-green-600'}">
                        (${daysLeft} days left)
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button class="notify-btn bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded transition ${customer.notified ? 'opacity-50 cursor-not-allowed' : ''}" data-name="${customer.name}" ${customer.notified ? 'disabled' : ''}>
                        <i class="fas fa-envelope mr-1"></i> Notify
                    </button>
                    <button class="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded transition">
                        <i class="fas fa-redo mr-1"></i> Renew
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    document.getElementById('plans-count').textContent = customers.length;

    document.querySelectorAll('.notify-btn:not(:disabled)').forEach(button => {
        button.addEventListener('click', function() {
            const customerName = this.getAttribute('data-name');
            showNotification(`Successfully notified ${customerName}`);
        });
    });
}

// Function to update dashboard cards
function updateDashboardCards(customers, notifiedCount) {
    const todayCount = customers.filter(c => getDaysLeft(c.expiryDate) <= 1).length;
    const threeDaysCount = customers.filter(c => getDaysLeft(c.expiryDate) <= 3).length;
    console.log('Updating dashboard - Today:', todayCount, '3 Days:', threeDaysCount, 'Notified:', notifiedCount);

    const todayElement = document.getElementById('expiring-today');
    const threeDaysElement = document.getElementById('expiring-3days');
    const notifiedElement = document.getElementById('notified-count');

    if (!notifiedElement) {
        console.error('Notified count element not found in DOM');
        return;
    }

    todayElement.textContent = todayCount;
    threeDaysElement.textContent = threeDaysCount;
    notifiedElement.textContent = notifiedCount;
    console.log('Dashboard updated - Notified count in DOM:', notifiedElement.textContent);
}

// Fetch with authentication
async function fetchWithAuth(url, options = {}) {
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

// Fetch expiring plans from backend
async function fetchExpiringPlans() {
    try {
        const response = await fetchWithAuth('http://localhost:8081/api/recharge/expiring?days=7', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/admin/adminlogin.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            throw new Error(`Failed to fetch expiring plans: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched expiring plans:', data);
        return data;
    } catch (error) {
        console.error('Error fetching expiring plans:', error);
        showNotification('Failed to load expiring plans', true);
        return [];
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async function() {
    // Check if the user is logged in (token exists)
    const token = localStorage.getItem('jwtToken');
    console.log("JWT Token from localStorage:", token);
    if (!token) {
        console.warn("No JWT token found. Redirecting to login page.");
        window.location.href = '/admin/adminlogin.html';
        return;
    }

    const filterSelect = document.getElementById('filterDays');
    const sortSelect = document.getElementById('sortBy');
    let expiringCustomers = await fetchExpiringPlans();
    let notifiedCount = expiringCustomers.filter(c => c.notified).length;
    console.log('Initial notified count:', notifiedCount);

    function updateTable() {
        const filteredAndSortedCustomers = filterAndSortCustomers(
            expiringCustomers,
            filterSelect.value,
            sortSelect.value
        );
        renderExpiringPlansTable(filteredAndSortedCustomers);
        updateDashboardCards(filteredAndSortedCustomers, notifiedCount);
    }

    // Initial render
    updateTable();
    
    filterSelect.addEventListener('change', () => {
        console.log('Filter changed to:', filterSelect.value);
        updateTable();
    });
    sortSelect.addEventListener('change', () => {
        console.log('Sort changed to:', sortSelect.value);
        updateTable();
    });
    
    document.querySelector('.notify-all-btn').addEventListener('click', async function() {
        try {
            console.log('Sending notify request...');
            const response = await fetchWithAuth('http://localhost:8081/api/test/notify-expiring', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                    localStorage.removeItem('jwtToken');
                    window.location.href = '/admin/adminlogin.html';
                    throw new Error('Unauthorized access. Redirecting to login page.');
                }
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            const data = await response.json();
            console.log('Notify response received:', data);

            const newNotifiedCount = data.notifiedCount || 0;
            console.log('Parsed notified count:', newNotifiedCount);

            if (newNotifiedCount === notifiedCount) {
                console.log('No new notifications sent; count unchanged');
            } else {
                notifiedCount = newNotifiedCount;
                console.log('Updated notifiedCount:', notifiedCount);

                // Update local data
                expiringCustomers.forEach(customer => {
                    if (getDaysLeft(customer.expiryDate) <= 3 && !customer.notified) {
                        customer.notified = true;
                    }
                });

                // Update UI
                updateTable();
            }

            showNotification(`Successfully notified users. Total notified: ${notifiedCount}`);
        } catch (error) {
            console.error('Error notifying users:', error);
            showNotification('Failed to notify users', true);
        }
    });
    
    document.querySelector('.export-btn').addEventListener('click', function() {
        const filteredAndSortedCustomers = filterAndSortCustomers(
            expiringCustomers,
            filterSelect.value,
            sortSelect.value
        );
        exportToCSV(filteredAndSortedCustomers);
        showNotification('Export completed successfully');
    });

    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    const sidebar = document.querySelector(".fixed-sidebar");

    mobileMenuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("show");
    });

    document.addEventListener("click", function(event) {
        if (!mobileMenuToggle.contains(event.target) && !sidebar.contains(event.target)) {
            sidebar.classList.remove("show");
        }
    });

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            sidebar.classList.remove("show");
        });
    });
});