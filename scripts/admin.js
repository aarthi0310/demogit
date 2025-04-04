document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminIDInput = document.getElementById('adminID');
    const passwordInput = document.getElementById('password');
    const adminIDError = document.getElementById('adminIDError');
    const passwordError = document.getElementById('passwordError');
    const loginSuccess = document.getElementById('loginSuccess');
    const backendUrl = 'http://localhost:8081/api';

    adminLoginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Get input values
        const adminID = adminIDInput.value.trim();
        const password = passwordInput.value.trim();

        // Reset error and success messages
        adminIDError.style.display = 'none';
        passwordError.style.display = 'none';
        loginSuccess.style.display = 'none';
        adminIDInput.style.borderColor = '#e2e8f0';
        passwordInput.style.borderColor = '#e2e8f0';

        // Validate inputs
        let hasError = false;
        if (!adminID) {
            adminIDError.textContent = 'Please enter your Administrator ID';
            adminIDError.style.display = 'block';
            adminIDInput.style.borderColor = '#dc2626';
            hasError = true;
        }
        if (!password) {
            passwordError.textContent = 'Please enter your password';
            passwordError.style.display = 'block';
            passwordInput.style.borderColor = '#dc2626';
            hasError = true;
        }

        if (hasError) return;

        try {
            // Make API request to admin login endpoint
            const response = await fetch(`${backendUrl}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminName: adminID, password: password })
            });

            const result = await response.json();

            if (response.ok) {
                // Store the JWT token in localStorage
                console.log("Received JWT Token: ", result.token);
                localStorage.setItem('jwtToken', result.token);

                // Display success message and redirect
                loginSuccess.textContent = 'Login successful! Redirecting to Plans Management...';
                loginSuccess.style.display = 'block';
                adminIDInput.disabled = true;
                passwordInput.disabled = true;
                setTimeout(() => {
                    window.location.href = result.redirectUrl || '/admin/plansmanagement.html';
                }, 1500);
            } else {
                // Display error message
                passwordError.textContent = result.message || 'Invalid Administrator ID or password';
                passwordError.style.display = 'block';
                adminIDInput.style.borderColor = '#dc2626';
                passwordInput.style.borderColor = '#dc2626';
            }
        } catch (error) {
            console.error('Error logging in:', error);
            passwordError.textContent = 'Server error. Please try again.';
            passwordError.style.display = 'block';
            adminIDInput.style.borderColor = '#dc2626';
            passwordInput.style.borderColor = '#dc2626';
        }
    });

    // Function to add JWT token to future requests (for consistency with other scripts)
    function fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }
        return fetch(url, options);
    }
});