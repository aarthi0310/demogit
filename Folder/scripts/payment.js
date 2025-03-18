// Navbar Functionality
const mobileMenuButton = document.getElementById('mobileMenuButton');
const navLinks = document.getElementById('navLinks');

mobileMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    navLinks.classList.toggle('show');
});

window.addEventListener('click', (event) => {
    if (!mobileMenuButton.contains(event.target) && !navLinks.contains(event.target)) {
        navLinks.classList.remove('show');
    }
});

// Utility Functions
function showError(input, message) {
    let errorDiv = input.parentElement.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1';
        input.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    input.classList.add('border-red-500');
}

function removeError(input) {
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) errorDiv.remove();
    input.classList.remove('border-red-500');
}

function isEmpty(value) {
    return value.trim() === '';
}

// Validation Functions
function validateUPI(upiId) {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId);
}

function validateCard(cardNumber) {
    cardNumber = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cardNumber);
}

function validateExpiry(expiry) {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    const numMonth = parseInt(month);
    const numYear = parseInt(year);
    if (numMonth < 1 || numMonth > 12) return false;
    if (numYear < currentYear || (numYear === currentYear && numMonth < currentMonth)) return false;
    return true;
}

// Formatting Functions
function formatCard(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ');
    return value.trim();
}

function formatExpiry(value) {
    value = value.replace(/\D/g, '');
    if (value.length >= 2) {
        return value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    return value;
}

// Form Validation Setup
function setupValidation() {
    const upiForm = document.getElementById('upiPaymentForm');
    if (upiForm) {
        const upiInput = document.getElementById('upiId');
        upiInput.onblur = () => {
            if (isEmpty(upiInput.value)) showError(upiInput, 'UPI ID is required');
            else if (!validateUPI(upiInput.value)) showError(upiInput, 'Enter valid UPI ID (example@upi)');
        };
        upiInput.oninput = () => removeError(upiInput);
        upiForm.onsubmit = (e) => {
            e.preventDefault();
            if (isEmpty(upiInput.value)) showError(upiInput, 'UPI ID is required');
            else if (validateUPI(upiInput.value)) processPayment('UPI');
        };
    }

    const cardForm = document.getElementById('cardPaymentForm');
    if (cardForm) {
        const cardNumber = document.getElementById('cardNumber');
        const cardName = document.getElementById('cardName');
        const expiry = document.getElementById('expiryDate');
        const cvv = document.getElementById('cvv');

        cardNumber.oninput = () => { cardNumber.value = formatCard(cardNumber.value); removeError(cardNumber); };
        expiry.oninput = () => { expiry.value = formatExpiry(expiry.value); removeError(expiry); };
        cardName.oninput = () => removeError(cardName);
        cvv.oninput = () => removeError(cvv);

        cardNumber.onblur = () => {
            if (isEmpty(cardNumber.value)) showError(cardNumber, 'Card number is required');
            else if (!validateCard(cardNumber.value)) showError(cardNumber, 'Enter valid 16-digit card number');
        };
        cardName.onblur = () => {
            if (isEmpty(cardName.value)) showError(cardName, 'Name on card is required');
            else if (!/^[a-zA-Z\s]{3,}$/.test(cardName.value)) showError(cardName, 'Enter valid name (min 3 chars)');
        };
        expiry.onblur = () => {
            if (isEmpty(expiry.value)) showError(expiry, 'Expiry date is required');
            else if (!validateExpiry(expiry.value)) showError(expiry, 'Enter valid expiry date (MM/YY)');
        };
        cvv.onblur = () => {
            if (isEmpty(cvv.value)) showError(cvv, 'CVV is required');
            else if (!/^\d{3,4}$/.test(cvv.value)) showError(cvv, 'Enter valid CVV');
        };

        cardForm.onsubmit = (e) => {
            e.preventDefault();
            let isValid = true;
            if (isEmpty(cardNumber.value)) { showError(cardNumber, 'Card number is required'); isValid = false; }
            else if (!validateCard(cardNumber.value)) { showError(cardNumber, 'Enter valid 16-digit card number'); isValid = false; }
            if (isEmpty(cardName.value)) { showError(cardName, 'Name on card is required'); isValid = false; }
            else if (!/^[a-zA-Z\s]{3,}$/.test(cardName.value)) { showError(cardName, 'Enter valid name (min 3 chars)'); isValid = false; }
            if (isEmpty(expiry.value)) { showError(expiry, 'Expiry date is required'); isValid = false; }
            else if (!validateExpiry(expiry.value)) { showError(expiry, 'Enter valid expiry date (MM/YY)'); isValid = false; }
            if (isEmpty(cvv.value)) { showError(cvv, 'CVV is required'); isValid = false; }
            else if (!/^\d{3,4}$/.test(cvv.value)) { showError(cvv, 'Enter valid CVV'); isValid = false; }
            if (isValid) processPayment('Card');
        };
    }

    const netBankingForm = document.getElementById('netBankingPaymentForm');
    if (netBankingForm) {
        const bankSelect = document.getElementById('bankName');
        bankSelect.onblur = () => { if (isEmpty(bankSelect.value)) showError(bankSelect, 'Please select a bank'); };
        bankSelect.onchange = () => removeError(bankSelect);
        netBankingForm.onsubmit = (e) => {
            e.preventDefault();
            if (isEmpty(bankSelect.value)) showError(bankSelect, 'Please select a bank');
            else processPayment('NetBanking');
        };
    }
}

// Payment Method Selection
document.querySelectorAll('.payment-option').forEach(option => {
    option.onclick = () => {
        document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        document.querySelectorAll('.payment-form').forEach(form => form.classList.remove('active'));
        const paymentType = option.getAttribute('data-payment');
        document.getElementById(paymentType + 'Form').classList.add('active');
    };
});

// Process Payment
function processPayment(method) {
    const plan = JSON.parse(sessionStorage.getItem('selectedPlan'));
    const payment = {
        planName: plan.name,
        amount: plan.price,
        method: method,
        transactionId: 'TX' + Date.now(),
        date: new Date().toLocaleString()
    };
    sessionStorage.setItem('paymentInfo', JSON.stringify(payment));
    window.location.href = 'payment conformation.html'; // Corrected typo in filename
}

// Load Selected Plan
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = {
        name: urlParams.get('planName'),
        price: urlParams.get('price'),
        data: urlParams.get('data'),
        validity: urlParams.get('validity')
    };

    if (plan.name) {
        plan.id = 'PLAN_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('selectedPlan', JSON.stringify(plan));
    }

    const storedPlan = JSON.parse(sessionStorage.getItem('selectedPlan'));
    if (storedPlan) {
        document.getElementById('selected-plan-name').textContent = storedPlan.name;
        document.getElementById('selected-plan-price').textContent = storedPlan.price;
        document.getElementById('selected-plan-data').textContent = storedPlan.data;
        document.getElementById('selected-plan-validity').textContent = storedPlan.validity;
    } else {
        document.getElementById('selected-plan-container').innerHTML =
            '<div class="p-4 bg-red-50 text-red-700">Please select a plan first</div>';
    }

    setupValidation();
    document.querySelector('.payment-option[data-payment="upi"]').click();
};