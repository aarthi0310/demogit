document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('adminLoginForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const adminID = document.getElementById('adminID').value.trim();
        const password = document.getElementById('password').value.trim();
        const passwordError = document.getElementById('passwordError');
        const loginSuccess = document.getElementById('loginSuccess');

        passwordError.style.display = 'none';
        loginSuccess.style.display = 'none';

        if (!adminID || !password) {
            passwordError.textContent = 'Please enter both username and password';
            passwordError.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('http://localhost:8081/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminName: adminID, password: password })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            loginSuccess.textContent = 'Login successful! Redirecting...';
            loginSuccess.style.display = 'block';
            setTimeout(() => window.location.href = 'plansmanagement.html', 1500);
        } catch (error) {
            passwordError.textContent = error.message;
            passwordError.style.display = 'block';
        }
    });
});