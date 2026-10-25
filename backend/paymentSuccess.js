//backend/paymentSuccess.js

document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "http://localhost:5000/api";

    const elements = {
        schoolName: document.getElementById("schoolName"),
        planName: document.getElementById("planName"),
        amountPaid: document.getElementById("amountPaid"),
        paidAmount: document.getElementById("paidAmount"),
        transactionRef: document.getElementById("transactionRef"),
        paymentDate: document.getElementById("paymentDate"),
        receiptEmail: document.getElementById("receiptEmail"),
    };

    const setText = (element, value, fallback = "—") => {
        if (element) {
            element.textContent =
                value === null || value === undefined || value === ""
                    ? fallback
                    : String(value);
        }
    };

    const params = new URLSearchParams(window.location.search);
    const reference =
        params.get("reference") ||
        params.get("trxref");

    if (!reference) {
        showError("Payment reference is missing from this page.");
        return;
    }

    setText(elements.transactionRef, reference);

    try {
        const response = await fetch(
            `${API_BASE_URL}/billing/payments/receipt?reference=${encodeURIComponent(reference)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                `Could not load payment details (${response.status}).`
            );
        }

        // Supports ApiResponse.data and plain JSON response formats.
        const receipt = result.data || result;

        setText(elements.schoolName, receipt.schoolName);
        setText(elements.planName, receipt.planName);
        setText(elements.transactionRef, receipt.reference || reference);
        setText(elements.receiptEmail, receipt.email);

        const currency = receipt.currency || "NGN";
        const amount = Number(receipt.amount);

        if (Number.isFinite(amount)) {
            const formattedAmount = new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
            }).format(amount);

            setText(elements.amountPaid, formattedAmount);
            setText(elements.paidAmount, formattedAmount);
        } else {
            setText(elements.amountPaid, null);
            setText(elements.paidAmount, null);
        }

        const paidAt = receipt.paidAt
            ? new Date(receipt.paidAt)
            : null;

        setText(
            elements.paymentDate,
            paidAt && !Number.isNaN(paidAt.getTime())
                ? new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "long",
                    timeStyle: "short",
                }).format(paidAt)
                : null
        );

        // If verification did not succeed, don't show the success page as paid.
        if (receipt.status && receipt.status !== "SUCCESS") {
            showError("The payment has not been confirmed as successful yet.");
        }
    } catch (error) {
        console.error("[Payment Success] Could not load receipt:", error);
        showError(
            error.message ||
            "Payment details could not be loaded. Please contact support with your reference."
        );
    }

    function showError(message) {
        let errorElement = document.getElementById("paymentLoadError");

        if (!errorElement) {
            errorElement = document.createElement("p");
            errorElement.id = "paymentLoadError";
            errorElement.setAttribute("role", "alert");
            errorElement.style.color = "#b42318";
            errorElement.style.marginTop = "12px";

            const summary =
                document.querySelector(".payment-summary") ||
                document.querySelector(".success-header");

            summary?.appendChild(errorElement);
        }

        if (errorElement) {
            errorElement.textContent = message;
        }
    }
});