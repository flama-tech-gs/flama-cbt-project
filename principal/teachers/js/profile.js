// =============================================
// Teacher Profile Page
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  initializeTeacherProfile();
});

function initializeTeacherProfile() {
  initializeBackButton();
  initializeAccountButtons();

  // Initialize Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// =============================================
// Back Button
// =============================================

function initializeBackButton() {
  const backButton = document.querySelector(".back-btn");

  if (!backButton) return;

  backButton.addEventListener("click", (e) => {
    e.preventDefault();

    window.location.href = "./teachers.html";
  });
}

// =============================================
// Account Buttons
// =============================================

function initializeAccountButtons() {
  const resetButton = document.querySelector(".btn-outline-green");

  const passwordButton = document.querySelectorAll(".btn-outline-green")[1];

  const pauseButton = document.querySelector(".btn-outline-red");

  // Reset Access Code

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const confirmReset = confirm("Reset this teacher's access code?");

      if (!confirmReset) return;

      // API HERE

      alert("Access code reset successfully.");
    });
  }

  // Change Password

  if (passwordButton) {
    passwordButton.addEventListener("click", () => {
      // Open Modal Here

      alert("Open Change Password Modal.");
    });
  }

  // Pause Account

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      const confirmPause = confirm("Pause this teacher's account?");

      if (!confirmPause) return;

      pauseButton.textContent = "Account Paused";

      pauseButton.disabled = true;

      pauseButton.style.opacity = ".7";
    });
  }
}

// =============================================
// Future Dynamic Data Support
// =============================================

const teacherProfile = {
  name: "Adebayo Folake Mojisola",

  staffId: "TCH/2025/014",

  department: "Science Department",

  subjects: "Biology, Basic Science & Technology",

  phone: "+2348023456789",

  qualification: "B.Sc Biology Education (Hons), NCE",

  address: "12, Adeola Crescent, Abeokuta, Ogun State.",

  employed: "September 2022",

  status: "Active",
};

// This object can later be replaced with data fetched
// from your backend API.
