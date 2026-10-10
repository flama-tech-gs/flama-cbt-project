// ==========================================
// REGISTER STEP 3
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initPlanSelection();
  initStep3Form();
  initBackButton();
  restoreSavedPlan();
});

/* ==========================================
   PLAN SELECTION
========================================== */

function initPlanSelection() {
  const plans = document.querySelectorAll('input[name="plan"]');

  plans.forEach((plan) => {
    plan.addEventListener("change", () => {
      document
        .querySelectorAll(".plan-card")
        .forEach((card) => card.classList.remove("selected"));

      plan.closest(".plan-card").classList.add("selected");
    });
  });
}

/* ==========================================
   RESTORE PLAN
========================================== */

function restoreSavedPlan() {
  const saved = JSON.parse(localStorage.getItem("schoolRegistration"));

  if (!saved?.plan) return;

  const radio = document.querySelector(`input[value="${saved.plan}"]`);

  if (!radio) return;

  radio.checked = true;

  radio.closest(".plan-card").classList.add("selected");
}

/* ==========================================
   BACK BUTTON
========================================== */

function initBackButton() {
  const backBtn = document.getElementById("backBtn");

  if (!backBtn) return;

  backBtn.addEventListener("click", () => {
    window.location.href = "register-step2.html";
  });
}

/* ==========================================
   FORM SUBMIT
========================================== */

function initStep3Form() {
  const form = document.getElementById("step3Form");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedPlan = document.querySelector('input[name="plan"]:checked');

    const terms = document.getElementById("agreeTerms");

    if (!selectedPlan) {
      alert("Please select a subscription plan.");

      return;
    }

    if (!terms.checked) {
      alert("You must agree to the Terms & Conditions.");

      return;
    }

    const previous =
      JSON.parse(localStorage.getItem("schoolRegistration")) || {};

    previous.plan = selectedPlan.value;
    previous.acceptedTerms = true;

    localStorage.setItem("schoolRegistration", JSON.stringify(previous));

    // ==================================
    // STEP 4 (Payment)
    // ==================================

    window.location.href = "register-step4.html";
  });
}
