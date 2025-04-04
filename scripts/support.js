
    // FAQ toggles
    document.querySelectorAll(".faq-question").forEach(item => {
        item.addEventListener("click", function () {
            let answer = this.nextElementSibling;
            answer.style.display = answer.style.display === "block" ? "none" : "block";
        });
    });

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobileMenuButton");
    const mobileMenu = document.getElementById("mobileMenu");
    mobileMenuButton.addEventListener("click", function() {
        mobileMenu.classList.toggle("active");
    });

    // Support form submission
    document.getElementById("supportForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        let name = document.getElementById("name").value.trim();
        let mobile = document.getElementById("mobile").value.trim();
        let issueType = document.getElementById("issueType").value;
        let description = document.getElementById("description").value.trim();

        let mobileError = document.getElementById("mobileError");
        let nameError = createErrorElement("nameError", "Please enter your name.");
        let issueTypeError = createErrorElement("issueTypeError", "Please select the type of issue.");
        let descriptionError = createErrorElement("descriptionError", "Please describe your issue.");

        let isValid = true;
        clearErrorMessages();

        if (name === "") {
            showError("name", nameError);
            isValid = false;
        }

        if (mobile === "") {
            mobileError.innerText = "Please enter your mobile number.";
            mobileError.classList.remove("hidden");
            isValid = false;
        } else if (!/^\d{10}$/.test(mobile)) {
            mobileError.innerText = "Invalid mobile number. Must be 10 digits.";
            mobileError.classList.remove("hidden");
            isValid = false;
        } else {
            mobileError.classList.add("hidden");
        }

        if (issueType === "") {
            showError("issueType", issueTypeError);
            isValid = false;
        }

        if (description === "") {
            showError("description", descriptionError);
            isValid = false;
        }

        if (isValid) {
            const ticket = {
                customerName: name,
                mobile: mobile, // Send as 10 digits, no +91 prefix
                issueType: issueType,
                issueTypeName: document.querySelector(`#issueType option[value="${issueType}"]`).text,
                description: description
            };

            try {
                const response = await fetch('http://localhost:8081/api/support/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ticket)
                });

                const result = await response.json();

                if (response.ok) {
                    showSuccessPopup(`Your request has been successfully submitted! Ticket ID: ${result.ticketId}`);
                    document.getElementById("supportForm").reset();
                } else {
                    if (result.error === "Please enter a valid Mobi-Comm number") {
                        mobileError.innerText = result.error;
                        mobileError.classList.remove("hidden");
                    } else {
                        alert(result.error || "Failed to submit request. Please try again.");
                    }
                }
            } catch (error) {
                console.error("Error submitting ticket:", error);
                alert("An error occurred. Please try again later.");
            }
        }
    });

    // Success popup function
    function showSuccessPopup(message) {
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.backgroundColor = "#ffffff";
        popup.style.padding = "20px";
        popup.style.borderRadius = "8px";
        popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        popup.style.zIndex = "1000";
        popup.style.textAlign = "center";
        popup.style.maxWidth = "400px";
        popup.style.width = "90%";

        const text = document.createElement("p");
        text.innerText = message;
        text.style.marginBottom = "15px";
        text.style.color = "#333";

        const closeButton = document.createElement("button");
        closeButton.innerText = "OK";
        closeButton.style.backgroundColor = "#2563eb";
        closeButton.style.color = "#ffffff";
        closeButton.style.padding = "8px 16px";
        closeButton.style.border = "none";
        closeButton.style.borderRadius = "4px";
        closeButton.style.cursor = "pointer";
        closeButton.addEventListener("click", () => {
            document.body.removeChild(popup);
        });

        popup.appendChild(text);
        popup.appendChild(closeButton);
        document.body.appendChild(popup);
    }

    function createErrorElement(id, message) {
        let existingError = document.getElementById(id);
        if (!existingError) {
            let errorElement = document.createElement("p");
            errorElement.id = id;
            errorElement.className = "text-red-500 text-sm mt-1";
            errorElement.innerText = message;
            return errorElement;
        }
        return existingError;
    }

    function showError(fieldId, errorElement) {
        let field = document.getElementById(fieldId);
        if (field && field.parentNode) {
            field.parentNode.appendChild(errorElement);
        }
    }

    function clearErrorMessages() {
        let errorIds = ["nameError", "issueTypeError", "descriptionError"];
        errorIds.forEach(id => {
            let errorElement = document.getElementById(id);
            if (errorElement) {
                errorElement.remove();
            }
        });
        document.getElementById("mobileError").classList.add("hidden");
    }
