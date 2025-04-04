// Declare API_BASE_URL only once
const API_BASE_URL = 'http://localhost:8081/api/recharge';

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

async function fetchCustomers() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/history/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'omit',
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/admin/adminlogin.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            throw new Error(`Failed to fetch recharge history: ${response.status}`);
        }
        const rechargeHistory = await response.json();
        console.log("Fetched recharge history:", rechargeHistory);
        if (!rechargeHistory || !Array.isArray(rechargeHistory)) {
            console.error('Invalid recharge history data:', rechargeHistory);
            return [];
        }
        return rechargeHistory.map((record, index) => ({
            id: record.id || index + 1,
            name: record.name || 'Unknown',
            phone: record.phoneNumber || 'N/A',
            plan: record.planName || 'N/A',
            expiry: record.expiryDate ? record.expiryDate.split('T')[0] : 'N/A',
            transactions: record.transactions && Array.isArray(record.transactions)
                ? record.transactions.map(tx => ({
                    date: tx.date ? tx.date.split('T')[0] : 'N/A',
                    plan: tx.plan || 'N/A',
                    amount: tx.amount || 0,
                    paymentMode: tx.paymentMode || 'N/A',
                    status: tx.status || 'Successful'
                }))
                : []
        }));
    } catch (error) {
        console.error('Error fetching customers:', error);
        showMessage('Failed to load customer data from server', 'error');
        return [];
    }
}

const itemsPerPage = 5;
let currentPage = 1;
let customers = [];

// Filter and paginate customers
async function filterAndPaginateCustomers() {
    if (customers.length === 0) {
        customers = await fetchCustomers();
    }

    const searchText = document.getElementById("searchCustomers").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    const today = new Date().toISOString().split('T')[0];

    let filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchText);
        const matchesStatus = statusFilter === "all" || 
                             (statusFilter === "active" && customer.expiry >= today) || 
                             (statusFilter === "expired" && customer.expiry < today);
        return matchesSearch && matchesStatus;
    });

    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    displayCustomers(paginatedCustomers);
    updatePagination(totalPages);
    return filteredCustomers;
}

// Display customers in the table
function displayCustomers(customersToShow) {
    const tableBody = document.getElementById("customerTableBody");
    tableBody.innerHTML = "";
    customersToShow.forEach(customer => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td class="px-6 py-4">${customer.name}</td>
            <td class="px-6 py-4">${customer.phone}</td>
            <td class="px-6 py-4">${customer.plan}</td>
            <td class="px-6 py-4">${customer.expiry}</td>
            <td class="px-6 py-4 flex space-x-3">
                <button onclick="viewCustomer(${customer.id})" class="action-btn view-btn" title="View Recharge History"><i class="fas fa-eye"></i></button>
                <button onclick="editCustomer(${customer.id})" class="action-btn edit-btn" title="Edit Customer"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination(totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";
    
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => { if (currentPage > 1) { currentPage--; filterAndPaginateCustomers(); } };
    pagination.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        pageButton.classList.toggle("active", i === currentPage);
        pageButton.onclick = () => { currentPage = i; filterAndPaginateCustomers(); };
        pagination.appendChild(pageButton);
    }

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => { if (currentPage < totalPages) { currentPage++; filterAndPaginateCustomers(); } };
    pagination.appendChild(nextButton);
}

// Open add/edit customer modal
function openAddCustomerModal() {
    document.getElementById("customerModalTitle").textContent = "Add New Customer";
    document.getElementById("customerForm").reset();
    document.getElementById("customerId").value = "";
    document.getElementById("customerModal").style.display = "block";
}

// Edit customer
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    document.getElementById("customerModalTitle").textContent = "Edit Customer Details";
    document.getElementById("customerId").value = customer.id;
    document.getElementById("customerName").value = customer.name;
    document.getElementById("customerPhone").value = customer.phone;
    document.getElementById("customerPlan").value = customer.plan;
    document.getElementById("customerExpiry").value = customer.expiry;
    document.getElementById("customerModal").style.display = "block";
}

// Close add/edit modal
function closeCustomerModal() {
    document.getElementById("customerModal").style.display = "none";
}

// View customer recharge history
function viewCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showMessage("Customer not found!", "error");
        return;
    }

    document.getElementById("viewCustomerTitle").textContent = `${customer.name}'s Recharge History`;
    document.getElementById("viewName").textContent = customer.name;
    document.getElementById("viewPhone").textContent = customer.phone;
    document.getElementById("viewPlan").textContent = customer.plan;
    document.getElementById("viewExpiry").textContent = customer.expiry;

    const transactionBody = document.getElementById("viewTransactions");
    transactionBody.innerHTML = "";
    if (customer.transactions && customer.transactions.length > 0) {
        customer.transactions.forEach(tx => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${tx.date}</td>
                <td>${tx.plan}</td>
                <td>₹${tx.amount}</td>
                <td>${tx.paymentMode}</td>
                <td>${tx.status}</td>
            `;
            transactionBody.appendChild(row);
        });
    } else {
        let row = document.createElement("tr");
        row.innerHTML = `<td colspan="5" class="text-center">No recharge history available</td>`;
        transactionBody.appendChild(row);
    }

    document.getElementById("viewCustomerModal").style.display = "block";
}

// Close view modal
function closeViewCustomerModal() {
    document.getElementById("viewCustomerModal").style.display = "none";
}

// Form submission handler
document.getElementById("customerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    let customerId = document.getElementById("customerId").value;
    let newCustomer = {
        name: document.getElementById("customerName").value,
        phoneNumber: document.getElementById("customerPhone").value,
        planName: document.getElementById("customerPlan").value,
        expiryDate: document.getElementById("customerExpiry").value,
    };

    if (customerId) {
        for (let i = 0; i < customers.length; i++) {
            if (customers[i].id === parseInt(customerId)) {
                customers[i] = { id: customers[i].id, ...newCustomer };
                showMessage("Customer updated successfully!", "success");
                break;
            }
        }
    } else {
        let newId = customers.length > 0 ? customers[customers.length - 1].id + 1 : 1;
        customers.push({ id: newId, ...newCustomer, transactions: [] });
        showMessage("New customer added successfully!", "success");
    }
    closeCustomerModal();
    filterAndPaginateCustomers();
});

async function downloadCSV() {
    const filteredCustomers = await filterAndPaginateCustomers();
    if (filteredCustomers.length === 0) {
        showMessage("No matching customers to export!", "error");
        return;
    }

    const headers = ["ID", "Name", "Phone", "Plan", "Expiry"];
    const rows = filteredCustomers.map(customer => [
        customer.id || 'N/A',
        `"${(customer.name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(customer.phone || 'N/A').replace(/"/g, '""')}"`,
        `"${(customer.plan || 'N/A').replace(/"/g, '""')}"`,
        customer.expiry || 'N/A'
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customer-details.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage("Customer data exported successfully!", "success");
}

// Show success/error messages
function showMessage(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white ${type === "success" ? "bg-green-600" : "bg-red-600"} shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("opacity-0", "transition-opacity", "duration-500");
        setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
}

// Mobile menu toggle functionality
document.querySelector('.mobile-menu-toggle').addEventListener('click', function() {
    document.querySelector('.fixed-sidebar').classList.toggle('show');
});

document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.fixed-sidebar');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    if (window.innerWidth <= 640 && 
        sidebar.classList.contains('show') && 
        !sidebar.contains(event.target) && 
        !toggleButton.contains(event.target)) {
        sidebar.classList.remove('show');
    }
});

// Add event listeners to the filter controls
document.getElementById("searchCustomers").addEventListener("input", function() {
    currentPage = 1;
    filterAndPaginateCustomers();
});

document.getElementById("statusFilter").addEventListener("change", function() {
    currentPage = 1;
    filterAndPaginateCustomers();
});

// Initialize the page
document.addEventListener("DOMContentLoaded", function() {
    // Check if the user is logged in (token exists)
    const token = localStorage.getItem('jwtToken');
    console.log("JWT Token from localStorage:", token);
    if (!token) {
        console.warn("No JWT token found. Redirecting to login page.");
        window.location.href = '/admin/adminlogin.html';
        return;
    }

    filterAndPaginateCustomers();
});