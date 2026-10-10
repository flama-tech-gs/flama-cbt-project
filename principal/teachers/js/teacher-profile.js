// ======================================
// Teacher Full Profile Page
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  initializeTeacherProfile();
});

function initializeTeacherProfile() {
  initializeBackButton();
  initializeActionButtons();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// -----------------------------
// Back Navigation
// -----------------------------

function initializeBackButton() {
  const backButton = document.getElementById("backButton");

  if (!backButton) return;

  backButton.addEventListener("click", () => {
    // Replace with your preferred route if required.
    window.history.back();
  });
}

// -----------------------------
// Account Management Actions
// -----------------------------

function initializeActionButtons() {
  const resetBtn = document.querySelector(".btn-outline-success");
  const changePasswordBtn = document.querySelectorAll(
    ".btn-outline-success",
  )[1];
  const pauseBtn = document.querySelector(".btn-outline-danger");

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const confirmed = confirm("Reset this teacher's access code?");

      if (!confirmed) return;

      // TODO:
      // API call goes here

      alert("Access code has been reset successfully.");
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
      // TODO:
      // Open password reset modal

      alert("Open Change Password dialog.");
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      const confirmed = confirm("Pause this teacher's account?");

      if (!confirmed) return;

      pauseBtn.textContent = "Account Paused";
      pauseBtn.disabled = true;
      pauseBtn.classList.add("disabled");

      // TODO:
      // API request goes here.
    });
  }
}
