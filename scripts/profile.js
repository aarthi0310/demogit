const viewMode = document.getElementById('viewMode');
        const editMode = document.getElementById('editMode');
        const editButton = document.getElementById('editButton');
        const saveButton = document.getElementById('saveButton');
        const cancelButton = document.getElementById('cancelButton');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        const nameInput = document.getElementById('nameInput');
        const emailInput = document.getElementById('emailInput');
        const phoneInput = document.getElementById('phoneInput');
        const planName = document.getElementById('planName');
        const planData = document.getElementById('planData');
        const planValidity = document.getElementById('planValidity');
        const planStatus = document.getElementById('planStatus');
        const accountDropdownButton = document.getElementById('accountDropdownButton');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const navLinks = document.getElementById('navLinks');

        const backendUrl = 'http://localhost:8081/api';

        async function fetchProfileData(phoneNumber) {
            try {
                const response = await fetch(`${backendUrl}/profile/+91${phoneNumber}`);
                if (!response.ok) throw new Error('Failed to fetch profile data');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error fetching profile:', error);
                alert('Failed to load profile data. Please try again.');
                return null;
            }
        }

        async function updateEmail(phoneNumber, newEmail) {
            try {
                const response = await fetch(`${backendUrl}/profile/+91${phoneNumber}/email`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: newEmail })
                });
                if (!response.ok) throw new Error('Failed to update email');
                return true;
            } catch (error) {
                console.error('Error updating email:', error);
                alert('Failed to update email. Please try again.');
                return false;
            }
        }

        function calculateDataAndValidity(planName, expiryDate) {
            let data = 'Not set';
            if (planName.includes('Data Booster')) {
                data = '2GB/day';
            } else if (planName.includes('Unlimited')) {
                data = 'Unlimited';
            } else if (planName.includes('Monthly Value')) {
                data = '1.5GB/day';
            }

            const today = new Date();
            const expiry = new Date(expiryDate);
            const timeDiff = expiry - today;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            const validity = daysLeft > 0 ? `${daysLeft} days` : 'Expired';

            return { data, validity };
        }

        function toggleEditMode() {
            viewMode.classList.toggle('hidden');
            editMode.classList.toggle('hidden');
            nameInput.value = profileName.textContent;
            emailInput.value = profileEmail.textContent;
            phoneInput.value = profilePhone.textContent;
        }

        async function saveChanges() {
            const newEmail = emailInput.value;
            const phoneNumber = phoneInput.value.replace('+91', '');

            const success = await updateEmail(phoneNumber, newEmail);
            if (success) {
                profileEmail.textContent = newEmail;
                localStorage.setItem('userEmail', newEmail);
                toggleEditMode();
            }
        }

        function loadProfileData() {
            const urlParams = new URLSearchParams(window.location.search);
            const phoneFromUrl = urlParams.get('phone');
            const phoneFromLocalStorage = localStorage.getItem('userPhone');
            const phoneFromSessionStorage = sessionStorage.getItem('phoneNumber');
            const phoneNumber = phoneFromUrl || phoneFromLocalStorage || phoneFromSessionStorage;

            if (!phoneNumber) {
                alert('Phone number not found. Please log in again.');
                window.location.href = '/index.html';
                return;
            }

            fetchProfileData(phoneNumber).then(data => {
                if (data) {
                    profileName.textContent = data.name || 'Not set';
                    profileEmail.textContent = data.email || 'Not set';
                    profilePhone.textContent = data.phoneNumber || 'Not set';
                    nameInput.value = data.name || '';
                    emailInput.value = data.email || '';
                    phoneInput.value = data.phoneNumber || '';

                    planName.textContent = data.planName || 'Not set';
                    const { data: calculatedData, validity } = calculateDataAndValidity(data.planName, data.expiryDate);
                    planData.textContent = calculatedData;
                    planValidity.textContent = validity;
                    planStatus.textContent = validity === 'Expired' ? 'Expired' : 'Active';
                    planStatus.className = `plan-badge ${validity === 'Expired' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`;
                }
            });
        }

        editButton.addEventListener('click', toggleEditMode);
        saveButton.addEventListener('click', saveChanges);
        cancelButton.addEventListener('click', toggleEditMode);

        mobileMenuButton.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });

        accountDropdownButton.addEventListener('click', (event) => {
            event.preventDefault();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', (event) => {
            if (!accountDropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('show');
            }
            if (!mobileMenuButton.contains(event.target) && !navLinks.contains(event.target)) {
                navLinks.classList.remove('show');
            }
        });

        document.addEventListener('DOMContentLoaded', loadProfileData);