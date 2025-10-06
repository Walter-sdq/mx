document.addEventListener("DOMContentLoaded", () => {
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

    // Update fees live
    depositAmountInput.addEventListener("input", updateFees);

    function updateFees() {
        const amount = parseFloat(depositAmountInput.value) || 0;
        const fee = (amount * 0.029).toFixed(2);
        document.getElementById("fee-amount").textContent = `$${amount.toFixed(2)}`;
        document.getElementById("fee-processing").textContent = `$${fee}`;
        document.getElementById("fee-total").textContent = `$${(amount + parseFloat(fee)).toFixed(2)}`;
    }

    // Form submit handler
    document.getElementById("deposit-form").addEventListener("submit", (e) => {
        e.preventDefault();
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
