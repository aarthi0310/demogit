document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    setupMobileMenu();
    loadSelectedPlan();
    setupPaymentOptions();
});

function setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const navLinks = document.getElementById('navLinks');

    if (!mobileMenuButton || !navLinks) return;

    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        if (!mobileMenuButton.contains(event.target) && !navLinks.contains(event.target)) {
            navLinks.classList.remove('show');
        }
    });
}

function loadSelectedPlan() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Parameters:', urlParams.toString()); // Log the URL parameters
    const planName = urlParams.get('planName') || 'Unknown Plan';
    const price = urlParams.get('price') || '0';
    const data = urlParams.get('data') || 'N/A';
    const validity = urlParams.get('validity') || 'N/A';
    const phoneNumber = urlParams.get('phoneNumber') || localStorage.getItem('userPhone');

    const planData = { name: planName, price, data, validity, phoneNumber };
    console.log('Plan Data:', planData); // Log the plan data
    sessionStorage.setItem('selectedPlan', JSON.stringify(planData));
   

    const container = document.getElementById('selected-plan-container');
    if (!phoneNumber) {
        container.innerHTML = '<p class="text-red-500 text-center p-6">Error: Please enter a valid phone number on the recharge page first.</p>';
        return;
    }

    document.getElementById('selected-plan-name').textContent = planName;
    document.getElementById('selected-plan-price').textContent = `₹${price}`;
    document.getElementById('selected-plan-data').textContent = data;
    document.getElementById('selected-plan-validity').textContent = validity;
}

function setupPaymentOptions() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentForms = document.querySelectorAll('.payment-form');

    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            const paymentMethod = option.getAttribute('data-payment');
            paymentForms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${paymentMethod}Form`).classList.add('active');
        });
    });
}

// payment.js
function initiateRazorpayPayment() {
    const plan = JSON.parse(sessionStorage.getItem('selectedPlan'));
    const razorpayError = document.getElementById('razorpayError');
    razorpayError.classList.add('hidden');

    if (!plan || !plan.phoneNumber) {
        razorpayError.textContent = 'Please enter a valid phone number on the recharge page first.';
        razorpayError.classList.remove('hidden');
        return;
    }

    const amount = parseFloat(plan.price);
    if (isNaN(amount) || amount < 1) {
        razorpayError.textContent = 'Invalid amount! The minimum amount is ₹1. Please provide a valid price.';
        razorpayError.classList.remove('hidden');
        return;
    }

    // Step 1: Create an order
    const payload = {
        amount: parseInt(plan.price) * 100, // Convert to paise
        phoneNumber: plan.phoneNumber,
        planName: plan.name,
        validity: plan.validity
    };

    fetch('http://localhost:8081/api/payment/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken') || ''}`
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Failed to create order'); });
        }
        return response.json();
    })
    .then(data => {
        // Step 2: Open Razorpay checkout
        const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: 'Mobi-Comm Recharge',
            description: `Recharge for ${plan.name}`,
            order_id: data.orderId,
            handler: function (response) {
                // Step 3: Verify payment with backend
                const verificationPayload = {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    phoneNumber: plan.phoneNumber, // Initial phone number, may be overridden by Razorpay
                    planName: plan.name,
                    amount: data.amount.toString(), // In paise
                    validity: plan.validity
                };

                fetch('http://localhost:8081/api/payment/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken') || ''}`
                    },
                    body: JSON.stringify(verificationPayload)
                })
                .then(verifyResponse => {
                    if (!verifyResponse.ok) {
                        return verifyResponse.json().then(err => { throw new Error(err.error || 'Payment verification failed'); });
                    }
                    return verifyResponse.json();
                })
                .then(verifyData => {
                    // Step 4: Store payment info and redirect
                    const paymentInfo = {
                        phoneNumber: verifyData.phoneNumber, // Use exact phone number from backend
                        planName: verifyData.planName,
                        amount: verifyData.amount,
                        method: verifyData.method,
                        transactionId: verifyData.transactionId,
                        date: verifyData.date,
                        validity: verifyData.validity
                    };
                    sessionStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));
                    const urlParams = new URLSearchParams(paymentInfo).toString();
                    window.location.href = `${verifyData.redirectUrl}?${urlParams}`;
                })
                .catch(error => {
                    razorpayError.textContent = `Error verifying payment: ${error.message}`;
                    razorpayError.classList.remove('hidden');
                });
            },
            prefill: {
                contact: plan.phoneNumber, // Prefill with initial phone number
                email: 'customer@example.com' // Replace with actual user email if available
            },
            theme: {
                color: '#F37254'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    })
    .catch(error => {
        razorpayError.textContent = `Error initiating payment: ${error.message}`;
        razorpayError.classList.remove('hidden');
    });
}