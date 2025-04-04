document.addEventListener('DOMContentLoaded', () => {
    const mobileNumberInput = document.getElementById('mobileNumber');
    const formatErrorMessage = document.getElementById('formatErrorMessage');
    const mobiCommErrorMessage = document.getElementById('mobiCommErrorMessage');
    const accountDropdownButton = document.getElementById('accountDropdownButton');
    const accountDropdown = document.getElementById('accountDropdown');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (accountDropdownButton && accountDropdown) {
        accountDropdownButton.addEventListener('click', (e) => {
            e.preventDefault();
            accountDropdown.classList.toggle('dropdown-active');
            document.addEventListener('click', function closeDropdown(event) {
                if (!accountDropdown.contains(event.target) && event.target !== accountDropdownButton) {
                    accountDropdown.classList.remove('dropdown-active');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        });
    }

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    if (mobileNumberInput) {
        mobileNumberInput.addEventListener('input', (e) => {
            const phoneNumber = e.target.value.trim();
            formatErrorMessage.classList.add('hidden');
            mobiCommErrorMessage.classList.add('hidden');
            if (phoneNumber.length > 0 && !/^\d*$/.test(phoneNumber)) {
                formatErrorMessage.textContent = 'Please enter numbers only';
                formatErrorMessage.classList.remove('hidden');
            }
        });

        mobileNumberInput.addEventListener('change', (e) => {
            const phoneNumber = e.target.value.trim();
            if (phoneNumber.length === 10) {
                validatePhoneNumber(phoneNumber);
            } else if (phoneNumber.length > 0) {
                formatErrorMessage.textContent = 'Please enter a valid 10-digit number';
                formatErrorMessage.classList.remove('hidden');
            }
        });
    }

    async function validatePhoneNumber(phoneNumber) {
        if (!/^\d{10}$/.test(phoneNumber)) {
            formatErrorMessage.classList.remove('hidden');
            return;
        }
        try {
            const response = await fetch('http://127.0.0.1:8081/api/validate-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phoneNumber }),
            });
            const data = await response.json();
            if (response.ok) {
                window.location.href = data.redirectUrl;
            } else {
                mobiCommErrorMessage.textContent = data.error || 'Unknown error';
                mobiCommErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            mobiCommErrorMessage.textContent = 'Failed to connect to server. Please try again.';
            mobiCommErrorMessage.classList.remove('hidden');
        }
    }
});