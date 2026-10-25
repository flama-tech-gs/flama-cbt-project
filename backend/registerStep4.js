// backend/registerStep4.js
// Checkout hand-off for the existing payment page IDs.

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("paymentForm");
    const button = document.getElementById("payButton");
    const buttonText = document.getElementById("payButtonText");

    if (!form || !button) {
        console.error("Step 4: paymentForm or payButton was not found.");
        return;
    }

    const readRegistration = () => {
        try {
            return typeof getRegistration === "function"
                ? getRegistration() || {}
                : JSON.parse(sessionStorage.getItem("flamaRegistration") || "{}");
        } catch (error) {
            console.error("Unable to read onboarding data:", error);
            return {};
        }
    };

    const formatMoney = (amount, currency = "NGN") =>
        new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    const showError = (message) => setText("paymentError", message);
    const setLoading = (loading) => {
        button.disabled = loading;
        if (buttonText) buttonText.textContent = loading ? "Connecting to Paystack..." : "Pay Securely";
    };

    const registration = readRegistration();
    const plan = registration.selectedPlan || registration.plan || {};
    const school = registration.registeredSchool || {};
    const onboardingToken = registration.onboardingPaymentToken || registration.onboardingToken;

    // Keep this calculation in sync with BillingService on the server.
    function calculateOrder(price) {
        const subtotal = Number(price);
        const vat = Math.round(subtotal * 0.075 * 100) / 100;
        const processingFee = 500;
        return { subtotal, vat, processingFee, total: subtotal + vat + processingFee };
    }

    function renderOrderSummary() {
        setText("schoolName", school.name || registration.school?.schoolName || "Your School");
        setText("selectedPlan", plan.planName || plan.name || "Selected Plan");

        const planId = plan.planId || plan.id;
        const price = Number(plan.price);
        const currency = plan.currency || "NGN";

        if (!planId) {
            showError("Your selected plan is missing. Please return to Step 3.");
            button.disabled = true;
            return false;
        }
        if (!Number.isFinite(price) || price <= 0) {
            showError("This plan cannot be paid for through online checkout.");
            button.disabled = true;
            return false;
        }
        if (!school.id || !onboardingToken) {
            showError("Your verified school registration is missing. Please complete email verification again.");
            button.disabled = true;
            return false;
        }

        const order = calculateOrder(price);
        setText("planPrice", formatMoney(order.subtotal, currency));
        setText("subtotalAmount", formatMoney(order.subtotal, currency));
        setText("vatAmount", formatMoney(order.vat, currency));
        setText("processingFee", formatMoney(order.processingFee, currency));
        setText("totalAmount", formatMoney(order.total, currency));
        setText("payAmount", formatMoney(order.total, currency));
        return true;
    }

    const summaryIsValid = renderOrderSummary();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        showError("");
        if (!summaryIsValid) return;

        if (typeof apiRequest !== "function") {
            showError("The API helper did not load. Check the api.js script path.");
            return;
        }

        const planId = plan.planId || plan.id;
        if (!planId) {
            showError("The selected plan ID is missing. Return to Step 3 and select a plan.");
            return;
        }

        setLoading(true);
        try {
            const response = await apiRequest("/billing/payments/onboarding/initialize", {
                method: "POST",
                body: JSON.stringify({
                    planId,
                    onboardingToken,
                }),
            });
            const payment = response?.data ?? response;
            const authorizationUrl = payment?.authorizationUrl || payment?.authorization_url;
            if (!authorizationUrl) {
                console.error("Payment initialization response:", response);
                throw new Error("The server did not return a Paystack checkout URL.");
            }

            if (payment.reference) {
                sessionStorage.setItem("flamaPaymentReference", payment.reference);
            }
            window.location.assign(authorizationUrl);
        } catch (error) {
            console.error("Onboarding payment initialization failed:", error);
            showError(typeof getApiErrorMessage === "function"
                ? getApiErrorMessage(error)
                : error?.message || "Unable to initialize payment.");
            setLoading(false);
        }
    });
});
