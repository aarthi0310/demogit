const API_URL = "http://localhost:8081/api/plans";

let currentPage = 1;
const itemsPerPage = 5;
let currentFilter = "all";

document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is logged in (token exists)
    const token = localStorage.getItem('jwtToken');
    console.log("JWT Token from localStorage:", token);
    if (!token) {
        console.warn("No JWT token found. Redirecting to login page.");
        window.location.href = '/index.html';
        return;
    }

    loadPlansFromBackend();
    setupMobileMenu();
    setupPaginationListeners();
});

async function fetchPlans(page = currentPage - 1, size = itemsPerPage, category = currentFilter) {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("size", size);
    queryParams.append("status", "active");
    if (category !== "all") queryParams.append("category", category);

    const url = `${API_URL}?${queryParams.toString()}`;
    console.log("Fetching plans from:", url);

    try {
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("Response Status:", response.status);
        console.log("Response Headers:", [...response.headers.entries()]);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Token may be invalid or expired.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/index.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            const errorText = await response.text();
            console.error("Error Response Body:", errorText);
            throw new Error(`Failed to fetch plans: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        console.log("Fetched plans data:", data);
        return data;
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            console.error('CORS or network error:', error);
            throw new Error('Failed to connect to the server. Please check your network or server configuration.');
        }
        throw error;
    }
}

async function loadPlansFromBackend(filter = currentFilter) {
    try {
        currentFilter = filter;
        const pageData = await fetchPlans(currentPage - 1, itemsPerPage, filter);
        const plans = pageData.content;
        const totalPages = pageData.totalPages;

        const tbody = document.getElementById("plansTableBody");
        tbody.innerHTML = "";

        const allPlansResponse = await fetchWithAuth(`${API_URL}?size=1000&status=active`, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!allPlansResponse.ok) {
            if (allPlansResponse.status === 401 || allPlansResponse.status === 403) {
                console.warn("Unauthorized or Forbidden access for all plans request.");
                localStorage.removeItem('jwtToken');
                window.location.href = '/index.html';
                throw new Error('Unauthorized access. Redirecting to login page.');
            }
            const errorText = await allPlansResponse.text();
            console.error("Error Response Body (all plans):", errorText);
            throw new Error(`Failed to fetch all plans: ${allPlansResponse.statusText} (${allPlansResponse.status})`);
        }

        const allPlans = (await allPlansResponse.json()).content;
        const uniqueCategories = [...new Set(allPlans.map(plan => plan.category))];

        updateFilterButtons(uniqueCategories, filter);

        if (plans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="py-4 px-4 text-center text-gray-600">No plans available for this filter.</td></tr>';
        } else {
            plans.forEach(plan => {
                const row = document.createElement("tr");
                row.className = `plan-row border-b plan-${plan.category}`;
                const isPopular = plan.category === "popular" ? 
                    '<span class="ml-2 text-xs px-2 py-1 badge-popular rounded-full">Popular</span>' : "";
                const description = plan.category === "data" ? (plan.name.includes("Booster") ? "Add-on to existing plans" : "Data only plan, no calls") :
                    plan.category === "entertainment" ? "Netflix, Prime Video, Disney+ Included" :
                    plan.category === "international" ? "International Roaming + ISD Calls" :
                    plan.name.includes("Basic") ? "Limited services, 10 SMS/day" : "Unlimited calls, 100 SMS/day";
                
                row.innerHTML = `
                    <td class="py-4 px-4">
                        <div class="flex items-center"><h3 class="font-medium text-gray-800">${plan.name}</h3>${isPopular}</div>
                        <p class="text-sm text-gray-600">${description}</p>
                        <div class="flex items-center mt-1"><span class="text-xs px-2 py-1 ${getBadgeStyle(plan.category)} rounded-full">${getCategoryLabel(plan.category)}</span></div>
                    </td>
                    <td class="py-4 px-4 text-center font-bold text-blue-700">₹${plan.price}</td>
                    <td class="py-4 px-4 text-center">${plan.data}</td>
                    <td class="py-4 px-4 text-center">${plan.validity} days</td>
                    <td class="py-4 px-4 text-center">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded-lg text-sm transition" onclick="selectPlan('${plan.name}', ${plan.price}, '${plan.data}', '${plan.validity} days')">
                            Select
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        updatePagination(totalPages);
    } catch (error) {
        console.error('Error loading plans:', error);
        showMessage("Error loading plans: " + error.message, "error");
    }
}

function updateFilterButtons(categories, activeFilter) {
    const filterContainer = document.getElementById("filterContainer");
    filterContainer.innerHTML = "";

    const allButton = createFilterButton("all", "All Plans", activeFilter === "all");
    filterContainer.appendChild(allButton);

    categories.forEach(category => {
        const button = createFilterButton(category, getCategoryLabel(category), category === activeFilter);
        filterContainer.appendChild(button);
    });
}

function createFilterButton(filter, label, isActive) {
    const button = document.createElement("button");
    button.className = `filter-button px-4 py-2 rounded-md text-sm font-medium transition ${isActive ? 'active' : 'bg-gray-100 hover:bg-gray-200'}`;
    button.setAttribute("data-filter", filter);
    button.innerHTML = `${getFilterIcon(filter)} ${label}`;
    button.addEventListener('click', () => {
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentPage = 1;
        loadPlansFromBackend(filter);
    });
    return button;
}

function setupPaginationListeners() {
    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadPlansFromBackend(currentFilter);
        }
    });
    document.getElementById("nextPage").addEventListener("click", async () => {
        const pageData = await fetchPlans(currentPage - 1, itemsPerPage, currentFilter);
        const totalPages = pageData.totalPages;
        if (currentPage < totalPages) {
            currentPage++;
            loadPlansFromBackend(currentFilter);
        }
    });
}

function updatePagination(totalPages) {
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const paginationNumbers = document.getElementById("paginationNumbers");

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= totalPages;

    paginationNumbers.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white`;
        pageButton.addEventListener("click", () => {
            currentPage = i;
            loadPlansFromBackend(currentFilter);
        });
        paginationNumbers.appendChild(pageButton);
    }
}

function getFilterIcon(category) {
    switch (category) {
        case 'popular': return '<i class="fas fa-fire mr-1"></i>';
        case 'validity': return '<i class="fas fa-calendar-alt mr-1"></i>';
        case 'data': return '<i class="fas fa-database mr-1"></i>';
        case 'unlimited': return '<i class="fas fa-infinity mr-1"></i>';
        case 'entertainment': return '<i class="fas fa-tv mr-1"></i>';
        case 'international': return '<i class="fas fa-globe mr-1"></i>';
        case 'all': return '';
        default: return '<i class="fas fa-tag mr-1"></i>';
    }
}

function getBadgeStyle(category) {
    switch (category) {
        case 'popular': return 'bg-orange-100 text-orange-800';
        case 'validity': return 'bg-yellow-100 text-yellow-800';
        case 'data': return 'bg-blue-100 text-blue-800';
        case 'unlimited': return 'bg-purple-100 text-purple-800';
        case 'entertainment': return 'bg-pink-100 text-pink-800';
        case 'international': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getCategoryLabel(category) {
    switch (category) {
        case 'popular': return 'Popular';
        case 'validity': return 'Validity';
        case 'data': return 'Data';
        case 'unlimited': return '5G Exclusive';
        case 'entertainment': return 'OTT Bundle';
        case 'international': return 'International';
        default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
}

function selectPlan(planName, price, data, validity) {
    const url = `/customer/quickrecharge.html?planName=${encodeURIComponent(planName)}&price=${encodeURIComponent(price)}&data=${encodeURIComponent(data)}&validity=${encodeURIComponent(validity)}`;
    window.location.href = url;
}

function setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const navLinks = document.getElementById('navLinks');
    const accountDropdownButton = document.getElementById('accountDropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    accountDropdownButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        if (!accountDropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
        if (!mobileMenuButton.contains(event.target) && !navLinks.contains(event.target)) {
            navLinks.classList.remove('show');
        }
    });
}

function showMessage(message, type) {
    const box = document.createElement("div");
    box.className = `fixed top-4 right-4 p-4 rounded-md shadow-md ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
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