const API_URL = "http://localhost:8081/api/plans";

document.addEventListener('DOMContentLoaded', function() {
    loadPlansFromBackend();
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadPlansFromBackend(filter);
        });
    });
    setInterval(() => loadPlansFromBackend(), 5000);
});

async function loadPlansFromBackend(filter = 'all') {
    const response = await fetch(API_URL);
    const plans = await response.json();
    const activePlans = plans.filter(plan => plan.active);
    const tbody = document.getElementById("plansTableBody");
    tbody.innerHTML = "";

    const filteredPlans = filter === 'all' ? activePlans : 
        activePlans.filter(plan => plan.category === filter);

    filteredPlans.forEach(plan => {
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
    const url = `/customer/payment.html?planName=${encodeURIComponent(planName)}&price=${encodeURIComponent(price)}&data=${encodeURIComponent(data)}&validity=${encodeURIComponent(validity)}`;
    window.location.href = url;
}