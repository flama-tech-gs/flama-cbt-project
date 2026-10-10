// ==========================================
// REGISTER STEP 4
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadRegistrationSummary();
  initPaymentMethods();
  initCardFormatting();
  initPaymentForm();
});

/* ==========================================
   LOAD SUMMARY
========================================== */

function loadRegistrationSummary() {
  const data = JSON.parse(localStorage.getItem("schoolRegistration"));

  if (!data) return;

  const plans = {
    starter: {
      name: "Starter Plan",
      amount: 15000,
    },
    standard: {
      name: "Standard Plan",
      amount: 45000,
    },
    enterprise: {
      name: "Enterprise Plan",
      amount: 0,
    },
  };

  const selected = plans[data.plan] || plans.standard;

  document.getElementById("selectedPlan").textContent = selected.name;

  document.getElementById("schoolName").textContent =
    data.schoolName || "School";

  if (selected.amount === 0) {
    document.getElementById("planPrice").textContent = "Custom";
    document.getElementById("totalAmount").textContent = "Contact Sales";
    document.getElementById("payAmount").textContent = "Contact Sales";

    return;
  }

  const vat = selected.amount * 0.075;
  const fee = 500;
  const total = selected.amount + vat + fee;

  document.getElementById("planPrice").textContent = formatCurrency(
    selected.amount,
  );

  document.getElementById("totalAmount").textContent = formatCurrency(total);

  document.getElementById("payAmount").textContent = formatCurrency(total);
}

/* ==========================================
   PAYMENT METHOD
========================================== */

function initPaymentMethods() {
  const buttons = document.querySelectorAll(".payment-method");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");

      // Future:
      // Toggle Card / Bank / USSD panels
    });
  });
}

/* ==========================================
   CARD FORMATTING
========================================== */

function initCardFormatting() {
  const card = document.getElementById("cardNumber");
  const expiry = document.getElementById("expiry");
  const cvv = document.getElementById("cvv");

  if (card) {
    card.addEventListener("input", (e) => {
      e.target.value = e.target.value
        .replace(/\D/g, "")
        .substring(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    });
  }

  if (expiry) {
    expiry.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "").substring(0, 4);

      if (value.length > 2) {
        value = value.substring(0, 2) + "/" + value.substring(2);
      }

      e.target.value = value;
    });
  }

  if (cvv) {
    cvv.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
    });
  }
}

/* ==========================================
   SUBMIT
========================================== */

function initPaymentForm() {
  const form = document.getElementById("paymentForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const button = document.querySelector(".btn-payment");

    button.disabled = true;

    button.innerHTML =
      '<i class="ri-loader-4-line ri-spin"></i> Processing Payment...';

    const registration =
      JSON.parse(localStorage.getItem("schoolRegistration")) || {};

    console.log("Registration Data", registration);

    // ==========================================
    // PAYSTACK INTEGRATION HERE
    // ==========================================

    /*
            PaystackPop.setup({
                key: "YOUR_PUBLIC_KEY",
                email: registration.email,
                amount: totalInKobo,
                currency: "NGN",

                callback(response){

                    window.location.href =
                        "registration-success.html";

                },

                onClose(){

                    button.disabled = false;

                }

            }).openIframe();
        */

    // Demo

    setTimeout(() => {
      window.location.href = "registration-success.html";
    }, 2000);
  });
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
