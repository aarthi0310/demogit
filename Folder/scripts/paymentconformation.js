// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobileMenuButton');
const navLinks = document.getElementById('navLinks');
mobileMenuButton.addEventListener('click', function(event) {
    event.stopPropagation();
    navLinks.classList.toggle('show');
});

// Close mobile menu when clicking outside
window.addEventListener('click', function(event) {
    if (!mobileMenuButton.contains(event.target) && !navLinks.contains(event.target)) {
        navLinks.classList.remove('show');
    }
});


// Function to update payment confirmation details
document.addEventListener('DOMContentLoaded', function() {
    const paymentInfoJSON = sessionStorage.getItem('paymentInfo');
    
    if (paymentInfoJSON) {
        const paymentInfo = JSON.parse(paymentInfoJSON);
        
        document.getElementById('confirmPlanName').textContent = paymentInfo.planName || 'N/A';
        document.getElementById('confirmAmount').textContent = paymentInfo.amount || 'N/A';
        document.getElementById('confirmPaymentMethod').textContent = paymentInfo.method || 'N/A';
        document.getElementById('confirmTransactionId').textContent = paymentInfo.transactionId || 'N/A';
        document.getElementById('confirmDateTime').textContent = paymentInfo.date || getCurrentDateTime();
    } else {
        document.getElementById('confirmDateTime').textContent = getCurrentDateTime();
        document.getElementById('confirmPlanName').textContent = 'Plan information not available';
        document.getElementById('confirmAmount').textContent = 'Amount information not available';
        document.getElementById('confirmPaymentMethod').textContent = 'Payment method not available';
        document.getElementById('confirmTransactionId').textContent = 'Transaction ID not available';
    }
});

function getCurrentDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
}

// PDF Receipt function - FIXED VERSION
function downloadPDFReceipt() {
    // Make sure jsPDF is properly initialized
    window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm' });
    
    try {
        // Properly initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const planName = document.getElementById('confirmPlanName').textContent;
        const amount = document.getElementById('confirmAmount').textContent;
        const paymentMethod = document.getElementById('confirmPaymentMethod').textContent;
        const transactionId = document.getElementById('confirmTransactionId').textContent;
        const dateTime = document.getElementById('confirmDateTime').textContent;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("MOBI-COMM PAYMENT RECEIPT", 20, 20);
        
        doc.setLineWidth(0.5);
        doc.line(20, 25, 190, 25);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        
        // Using an array of lines for text
        const content = [
            `Date: ${dateTime}`,
            `Transaction ID: ${transactionId}`,
            "",
            "PAYMENT DETAILS",
            "----------------",
            `Plan: ${planName}`,
            `Amount: ${amount}`,
            `Payment Method: ${paymentMethod}`,
            "",
            "Thank you for choosing Mobi-Comm!",
            "For support, contact: support@mobi-comm.com"
        ];
        
        // Print each line separately
        let yPos = 40;
        for (let i = 0; i < content.length; i++) {
            doc.text(content[i], 20, yPos);
            yPos += 8;
        }

        doc.setFontSize(10);
        doc.text("Mobi-Comm Services | www.mobi-comm.com", 20, 280);
        
        // Generate a clean filename
        const cleanTransactionId = transactionId.replace(/[^a-zA-Z0-9]/g, '');
        doc.save(`mobi-comm-receipt-${cleanTransactionId}.pdf`);
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("There was an error generating your PDF receipt. Please try again.");
    }
}