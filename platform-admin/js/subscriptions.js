/* ==========================================
   SUBSCRIPTIONS & BILLING
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeBillingPage();
});

/* ==========================================
   INITIALIZE
========================================== */

function initializeBillingPage() {
  initializePricingButtons();
  initializeReceiptButtons();
}

/* ==========================================
   EDIT PRICING
========================================== */

function initializePricingButtons() {
  const buttons = document.querySelectorAll(".pricing-edit-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const plan = button.dataset.plan;

      if (!plan) return;

      /*
       * Backend integration:
       *
       * Open the pricing editor/modal
       * for the selected subscription plan.
       */

      console.log(`Edit pricing for ${plan} plan`);
    });
  });
}

/* ==========================================
   RECEIPTS
========================================== */

function initializeReceiptButtons() {
  const buttons = document.querySelectorAll(".receipt-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const school = button.dataset.receipt;

      if (!school) return;

      /*
       * Backend integration:
       *
       * Request the actual PDF receipt
       * from the backend and download it.
       */

      console.log(`Download receipt for ${school}`);
    });
  });
}
