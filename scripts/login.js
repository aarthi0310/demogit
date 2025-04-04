const mobileForm = document.getElementById('mobileForm');
const verifyOtpForm = document.getElementById('verifyOtpForm');
const phoneFormSection = document.getElementById('phoneForm');
const otpFormSection = document.getElementById('otpForm');
const mobileInput = document.getElementById('mobile');
const otpInput = document.getElementById('otp');
const emptyError = document.getElementById('emptyError');
const digitError = document.getElementById('digitError');
const notRegisteredError = document.getElementById('notRegisteredError');
const otpError = document.getElementById('otpError');
const resendOtpButton = document.getElementById('resendOtp');
const headerSubtitle = document.getElementById('header-subtitle');
const otpNotification = document.getElementById('otpNotification');
const otpDisplay = document.getElementById('otpDisplay');
const otpTimer = document.getElementById('otpTimer');
const timerSeconds = document.getElementById('timerSeconds');

let userMobileNumber;
let timerInterval;
const backendUrl = 'http://localhost:8081/api';

function startOtpTimer(duration) {
    let timeLeft = duration;
    timerSeconds.textContent = timeLeft;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerSeconds.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            otpNotification.style.display = 'none';
            otpError.textContent = 'OTP expired. Please resend!';
            otpError.style.display = 'block';
        }
    }, 1000);
}

function showOtp(otp) {
    otpDisplay.textContent = otp;
    otpNotification.style.display = 'block';
    startOtpTimer(30);
}

mobileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mobileNumber = mobileInput.value.trim();

    emptyError.style.display = 'none';
    digitError.style.display = 'none';
    notRegisteredError.style.display = 'none';
    mobileInput.classList.remove('input-error');

    if (mobileNumber === '') {
        emptyError.style.display = 'block';
        mobileInput.classList.add('input-error');
        return;
    }
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
        digitError.style.display = 'block';
        mobileInput.classList.add('input-error');
        return;
    }

    userMobileNumber = mobileNumber;
    const phoneNumberWithCountryCode = `+91${mobileNumber}`.replace(/\s+/g, '');

    try {
        const response = await fetch(`${backendUrl}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phoneNumberWithCountryCode })
        });
        const result = await response.text();
        if (response.ok) {
            headerSubtitle.textContent = `OTP sent to ${mobileNumber}`;
            phoneFormSection.style.display = 'none';
            otpFormSection.style.display = 'block';
            showOtp('Check SMS');
        } else {
            notRegisteredError.textContent = result || 'Please enter a valid Mobi-Comm number.';
            notRegisteredError.style.display = 'block';
            mobileInput.classList.add('input-error');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        notRegisteredError.textContent = 'Server error. Please try again.';
        notRegisteredError.style.display = 'block';
        mobileInput.classList.add('input-error');
    }
});

verifyOtpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const enteredOtp = otpInput.value.trim();
    otpError.style.display = 'none';
    otpInput.classList.remove('input-error');

    try {
        const response = await fetch(`${backendUrl}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: `+91${userMobileNumber}`.replace(/\s+/g, ''), otp: enteredOtp })
        });
        const result = await response.json();
        if (response.ok) {
            console.log("Received JWT Token: ", result.token);
            localStorage.setItem('userPhone', userMobileNumber);
            localStorage.setItem('jwtToken', result.token);
            sessionStorage.setItem('phoneNumber', userMobileNumber);
            otpInput.value = 'Login Successful! Redirecting...';
            otpInput.classList.add('success');
            otpInput.disabled = true;
            headerSubtitle.textContent = 'Welcome to Mobi-Comm!';
            otpNotification.style.display = 'none';
            clearInterval(timerInterval);
            document.querySelector('.login-btn').style.display = 'none';
            resendOtpButton.style.display = 'none';
            setTimeout(() => {
                window.location.href = result.redirectUrl; // Redirect to plans page
            }, 2000);
        } else {
            otpError.textContent = result.message || 'Invalid OTP. Try again!';
            otpError.style.display = 'block';
            otpInput.classList.add('input-error');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        otpError.textContent = 'Server error. Please try again.';
        otpError.style.display = 'block';
        otpInput.classList.add('input-error');
    }
});

resendOtpButton.addEventListener('click', async () => {
    try {
        const response = await fetch(`${backendUrl}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: `+91${userMobileNumber}`.replace(/\s+/g, '') })
        });
        const result = await response.text();
        if (response.ok) {
            const originalText = resendOtpButton.innerHTML;
            resendOtpButton.innerHTML = 'OTP Sent!';
            resendOtpButton.style.pointerEvents = 'none';
            showOtp('Check SMS');
            setTimeout(() => {
                resendOtpButton.innerHTML = originalText;
                resendOtpButton.style.pointerEvents = 'auto';
            }, 3000);
        } else {
            otpError.textContent = result || 'Failed to resend OTP.';
            otpError.style.display = 'block';
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        otpError.textContent = 'Server error. Please try again.';
        otpError.style.display = 'block';
    }
});

// Function to add JWT token to future requests
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