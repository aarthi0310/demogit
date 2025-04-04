// paymentconformation.js
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
    loadPaymentConfirmation();
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

function loadPaymentConfirmation() {
    let paymentInfo;
    const paymentInfoJSON = sessionStorage.getItem('paymentInfo');
    console.log('Retrieved Payment Info from sessionStorage:', paymentInfoJSON);

    if (paymentInfoJSON) {
        try {
            paymentInfo = JSON.parse(paymentInfoJSON);
            console.log('Parsed Payment Info:', paymentInfo);
        } catch (error) {
            console.error('Error parsing sessionStorage payment info:', error);
        }
    }

    // Fallback to URL parameters if sessionStorage is empty
    if (!paymentInfo) {
        const urlParams = new URLSearchParams(window.location.search);
        paymentInfo = {
            phoneNumber: urlParams.get('phoneNumber') || 'N/A',
            planName: urlParams.get('planName') || 'Unknown Plan',
            amount: urlParams.get('amount') || '0',
            method: urlParams.get('method') || 'N/A',
            transactionId: urlParams.get('transactionId') || 'N/A',
            date: urlParams.get('date') || 'N/A',
            validity: urlParams.get('validity') || 'N/A'
        };
        console.log('Payment Info from URL:', paymentInfo);
    }

    // ✅ Remove +91 prefix from phone number if present
    if (paymentInfo.phoneNumber.startsWith('+91')) {
        paymentInfo.phoneNumber = paymentInfo.phoneNumber.replace(/^\+91/, '');
    }

   
    const paymentMethodMapping = {
        "card": "Credit/Debit Card",
        "netbanking": "Net Banking",
        "wallet": "Wallet Payment",
        "upi": "UPI",
        "cod": "Cash on Delivery",
        "bank_transfer": "Bank Transfer"
    };

    const displayPaymentMethod = paymentMethodMapping[paymentInfo.method] || paymentInfo.method;

    // Display payment info
    if (paymentInfo && paymentInfo.transactionId !== 'N/A' && paymentInfo.phoneNumber !== 'N/A') {
        document.getElementById('confirmPhoneNumber').textContent = paymentInfo.phoneNumber;
        document.getElementById('confirmPlanName').textContent = paymentInfo.planName;
        document.getElementById('confirmAmount').textContent = `₹${paymentInfo.amount}`;
        document.getElementById('confirmPaymentMethod').textContent = displayPaymentMethod; 
        document.getElementById('confirmTransactionId').textContent = paymentInfo.transactionId;
        document.getElementById('confirmDateTime').textContent = paymentInfo.date;
        document.getElementById('confirmValidity').textContent = paymentInfo.validity;
    } else {
        console.error('Invalid payment information:', paymentInfo);
        alert('No valid payment information found. Redirecting to home page.');
        window.location.href = '/index.html';
    }
}



function downloadPDFReceipt() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const phoneNumber = document.getElementById('confirmPhoneNumber').textContent;
    const planName = document.getElementById('confirmPlanName').textContent;
    const amount = document.getElementById('confirmAmount').textContent;
    const paymentMethod = document.getElementById('confirmPaymentMethod').textContent;
    const transactionId = document.getElementById('confirmTransactionId').textContent;
    const dateTime = document.getElementById('confirmDateTime').textContent;
    const validity = document.getElementById('confirmValidity').textContent;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MOBI-COMM PAYMENT RECEIPT", 20, 20);
    
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    const content = [
        `Date: ${dateTime}`,
        `Transaction ID: ${transactionId}`,
        "",
        "PAYMENT DETAILS",
        "----------------",
        `Phone Number: ${phoneNumber}`,
        `Plan: ${planName}`,
        `Amount: ${amount}`,
        `Payment Method: ${paymentMethod}`,  // ✅ Updated to show mapped payment method
        `Validity: ${validity}`,
        "",
        "Thank you for choosing Mobi-Comm!",
        "For support, contact: support@mobi-comm.com"
    ];
    
    let yPos = 40;
    content.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 8;
    });

    doc.setFontSize(10);
    doc.text("Mobi-Comm Services | www.mobi-comm.com", 20, 280);
    
    const cleanTransactionId = transactionId.replace(/[^a-zA-Z0-9]/g, '');
    doc.save(`mobi-comm-receipt-${cleanTransactionId}.pdf`);
}
