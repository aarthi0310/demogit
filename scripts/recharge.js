document.addEventListener('DOMContentLoaded', () => {
    // Recharge form validation
    const rechargeForm = document.getElementById('rechargeForm');
    const phoneInput = document.getElementById('phoneNumber');
    const phoneError = document.getElementById('phoneError');
    
    if (!rechargeForm || !phoneInput || !phoneError) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Real-time validation
    phoneInput.addEventListener('input', (e) => {
        const phoneNumber = e.target.value.trim();
        phoneError.classList.remove('show');
        
        if (phoneNumber.length > 0 && !/^\d*$/.test(phoneNumber)) {
            phoneError.textContent = 'Please enter numbers only';
            phoneError.classList.add('show');
        } else if (phoneNumber.length === 10 && !/^\d{10}$/.test(phoneNumber)) {
            phoneError.textContent = 'Please enter a valid 10-digit number';
            phoneError.classList.add('show');
        }
    });
    
    // Form submission
    rechargeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const phoneNumber = phoneInput.value.trim();
        
        if (!/^\d{10}$/.test(phoneNumber)) {
            phoneError.textContent = 'Please enter a valid 10-digit mobile number';
            phoneError.classList.add('show');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8081/api/validate-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                phoneError.classList.remove('show');
                localStorage.setItem('userPhone', phoneNumber);
                
                // Use the redirect URL from the backend
                window.location.href = data.redirectUrl;
            } else {
                phoneError.textContent = data.error || 'Validation failed';
                phoneError.classList.add('show');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            phoneError.textContent = 'An error occurred. Please try again.';
            phoneError.classList.add('show');
        }
    });
    
    // FIX: Account dropdown functionality
    const accountDropdownButton = document.getElementById('accountDropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (accountDropdownButton && dropdownMenu) {
        // Toggle dropdown on click
        accountDropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        window.addEventListener('click', (e) => {
            if (!accountDropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }
    
    // Mobile menu functionality
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
});