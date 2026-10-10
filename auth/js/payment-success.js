// ==========================================
// PAYMENT SUCCESS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadPaymentSummary();
  generateTransactionReference();
});

/* ==========================================
   LOAD PAYMENT DETAILS
========================================== */

function loadPaymentSummary() {
  const registration =
    JSON.parse(localStorage.getItem("schoolRegistration")) || {};

  const plans = {
    starter: {
      name: "Starter",
      amount: 15000,
    },
    standard: {
      name: "Standard",
      amount: 45000,
    },
    enterprise: {
      name: "Enterprise",
      amount: 0,
    },
  };

  const plan = plans[registration.plan] || plans.standard;

  const schoolName = registration.schoolName || "Your School";

  const email =
    registration.email ||
    registration.officialEmail ||
    "admin@yourschool.edu.ng";

  document.getElementById("schoolName").textContent = schoolName;

  document.getElementById("planName").textContent = plan.name;

  document.getElementById("receiptEmail").textContent = email;

  if (plan.amount > 0) {
    const total = plan.amount + plan.amount * 0.075 + 500;

    const formatted = formatCurrency(total);

    document.getElementById("paidAmount").textContent = formatted;

    document.getElementById("amountPaid").textContent = formatted;
  } else {
    document.getElementById("paidAmount").textContent = "Custom";

    document.getElementById("amountPaid").textContent = "Custom";
  }

  document.getElementById("paymentDate").textContent =
    new Date().toLocaleString("en-NG", {
      dateStyle: "long",
      timeStyle: "short",
    });
}

/* ==========================================
   TRANSACTION REFERENCE
========================================== */

function generateTransactionReference() {
  const ref = localStorage.getItem("paymentReference");

  if (ref) {
    document.getElementById("transactionRef").textContent = ref;

    return;
  }

  const generated = "PAY-" + Date.now().toString().slice(-10);

  localStorage.setItem("paymentReference", generated);

  document.getElementById("transactionRef").textContent = generated;
}

/* ==========================================
   HELPERS
========================================== */

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}
