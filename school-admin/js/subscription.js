/*==========================================================
  SUBSCRIPTION & BILLING
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeLucide();
  initializePlanSelection();
  initializeRenewButton();
  initializeReceiptDownloads();
  initializeBillingActions();
});

/*==========================================================
  LUCIDE
==========================================================*/

function initializeLucide() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/*==========================================================
  PLAN SELECTION
==========================================================*/

function initializePlanSelection() {
  const buttons = document.querySelectorAll("[data-plan]");

  buttons.forEach((button) => {
    if (!button.matches("button")) return;

    button.addEventListener("click", () => {
      const plan = button.dataset.plan;

      selectPlan(plan);
    });
  });
}

function selectPlan(plan) {
  document
    .querySelectorAll(".pricing-card")
    .forEach((card) => card.classList.remove("selected"));

  const selectedCard = document.querySelector(
    `.pricing-card[data-plan="${plan}"]`,
  );

  if (selectedCard) {
    selectedCard.classList.add("selected");
  }

  console.log("Selected Plan:", plan);

  /*
    ==========================================

    Backend Hook

    Save selected plan
    or open checkout

    ==========================================
    */
}

/*==========================================================
  RENEW
==========================================================*/

function initializeRenewButton() {
  const renewButton = document.getElementById("renewPlanBtn");

  if (!renewButton) return;

  renewButton.addEventListener("click", () => {
    const confirmed = confirm("Proceed to renew your current subscription?");

    if (!confirmed) return;

    startRenewal();
  });
}

function startRenewal() {
  /*
    ==========================================

    PAYMENT FLOW

    Flutterwave

    Paystack

    Stripe

    etc.

    ==========================================
    */

  console.log("Renew Subscription");

  notify("Redirecting to payment...");
}

/*==========================================================
  RECEIPTS
==========================================================*/

function initializeReceiptDownloads() {
  document

    .querySelectorAll(".receipt-btn")

    .forEach((button) => {
      button.addEventListener("click", () => {
        const receipt = button.dataset.receipt;

        downloadReceipt(receipt);
      });
    });
}

function downloadReceipt(filename) {
  /*
    ==========================================

    Backend Example

    GET

    /billing/receipt/{id}

    ==========================================
    */

  console.log("Download:", filename);

  notify(`Downloading ${filename}`);
}

/*==========================================================
  BILLING ACTIONS
==========================================================*/

function initializeBillingActions() {
  /*
    Future Features

    - Invoice Filters

    - Search

    - Pagination

    - Export CSV

    */
}

/*==========================================================
  BACKEND
==========================================================*/

async function subscribe(plan) {
  /*
    Example

    await fetch("/api/subscription", {

        method:"POST"

    })

    */
}

/*==========================================================
  TOAST
==========================================================*/

function notify(message) {
  /*
    Replace with reusable toast component
    used across the School Admin Dashboard.
    */

  alert(message);
}
