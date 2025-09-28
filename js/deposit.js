document.addEventListener("DOMContentLoaded", () => {
    // Initialize live payments tracker
    const livePayments = new LivePaymentsTracker();

    const methodCards = document.querySelectorAll(".method-card");
    const cardDetails = document.getElementById("card-details");
    const bankDetails = document.getElementById("bank-details");
    const cryptoDetails = document.getElementById("crypto-details");
    const depositAmountInput = document.getElementById("deposit-amount");
    const quickButtons = document.querySelectorAll(".quick-amount-btn");

    // Method selection toggle
    methodCards.forEach(card => {
        card.addEventListener("click", () => {
            methodCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            cardDetails.style.display = "none";
            bankDetails.style.display = "none";
            cryptoDetails.style.display = "none";

            const selected = card.dataset.method;
            if (selected === "card") cardDetails.style.display = "block";
            if (selected === "bank") bankDetails.style.display = "block";
            if (selected === "crypto") cryptoDetails.style.display = "block";
        });
    });

    // Quick amount buttons
    quickButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            depositAmountInput.value = btn.dataset.amount;
            updateFees();
        });
    });

    // Update fees live with validation
    depositAmountInput.addEventListener("input", () => {
        validateDepositAmount();
        updateFees();
    });

    function validateDepositAmount() {
        const errorElement = document.getElementById('deposit-amount-error');
        const amount = parseFloat(depositAmountInput.value);

        let isValid = true;
        let message = '';

        if (!depositAmountInput.value) {
            message = 'Deposit amount is required';
            isValid = false;
        } else if (!isValidAmount(amount, 10)) {
            message = 'Amount must be at least $10.00';
            isValid = false;
        }

        errorElement.textContent = message;
        depositAmountInput.classList.toggle('error', !isValid);
        return isValid;
    }

    function validateCardDetails() {
        const cardNumber = document.getElementById('card-number').value;
        const expiry = document.getElementById('card-expiry').value;
        const cvv = document.getElementById('card-cvv').value;

        let isValid = true;

        // Card number validation
        if (!validateCardNumber(cardNumber)) {
            document.getElementById('card-number-error').textContent = 'Please enter a valid card number';
            document.getElementById('card-number').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('card-number-error').textContent = '';
            document.getElementById('card-number').classList.remove('error');
        }

        // Expiry validation
        if (!validateExpiry(expiry)) {
            document.getElementById('card-expiry-error').textContent = 'Please enter a valid expiry date (MM/YY)';
            document.getElementById('card-expiry').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('card-expiry-error').textContent = '';
            document.getElementById('card-expiry').classList.remove('error');
        }

        // CVV validation
        if (!validateCVV(cvv)) {
            document.getElementById('card-cvv-error').textContent = 'Please enter a valid CVV (3-4 digits)';
            document.getElementById('card-cvv').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('card-cvv-error').textContent = '';
            document.getElementById('card-cvv').classList.remove('error');
        }

        return isValid;
    }

    function validateDepositForm(method) {
        const amountValid = validateDepositAmount();
        let cardValid = true;

        if (method === 'card') {
            cardValid = validateCardDetails();
        }

        return amountValid && cardValid;
    }

    function updateFees() {
        const amount = parseFloat(depositAmountInput.value) || 0;
        const fee = (amount * 0.029).toFixed(2);
        document.getElementById("fee-amount").textContent = `$${amount.toFixed(2)}`;
        document.getElementById("fee-processing").textContent = `$${fee}`;
        document.getElementById("fee-total").textContent = `$${(amount + parseFloat(fee)).toFixed(2)}`;
    }

    // Form submit handler with validation
    document.getElementById("deposit-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get selected method
        const selectedMethod = document.querySelector('.method-card.active')?.dataset.method || 'card';

        // Validate form
        if (!validateDepositForm(selectedMethod)) {
            showToast('Please correct the errors and try again', 'error');
            return;
        }

        // Sanitize inputs
        const sanitizedAmount = parseFloat(depositAmountInput.value);
        let sanitizedCardNumber = '';
        let sanitizedExpiry = '';
        let sanitizedCVV = '';

        if (selectedMethod === 'card') {
            sanitizedCardNumber = sanitizeInput(document.getElementById('card-number').value);
            sanitizedExpiry = sanitizeInput(document.getElementById('card-expiry').value);
            sanitizedCVV = sanitizeInput(document.getElementById('card-cvv').value);
        }

        // Log sanitized data for debugging
        console.log('Deposit submission:', {
            amount: sanitizedAmount,
            method: selectedMethod,
            cardNumber: sanitizedCardNumber ? '****' + sanitizedCardNumber.slice(-4) : '',
            expiry: sanitizedExpiry,
            cvv: sanitizedCVV ? '***' : ''
        });

        document.getElementById("loading-overlay").style.display = "flex";

        setTimeout(() => {
            alert("✅ Deposit submitted successfully!");
            document.getElementById("loading-overlay").style.display = "none";
        }, 2000);
    });
});

// Copy to clipboard function
function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert("Address copied to clipboard!");
    });
}
