// ==========================================
// REGISTER STEP 2
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initPasswordStrength();
  initConfirmPassword();
  initDocumentUpload();
  initNavigation();
});

/* ==========================================
   PASSWORD STRENGTH
========================================== */

function initPasswordStrength() {
  const password = document.getElementById("password");

  if (!password) return;

  password.addEventListener("input", () => {
    const value = password.value;

    const bars = document.querySelectorAll(".strength-bar");
    const text = document.getElementById("strengthText");

    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d|[^A-Za-z0-9]/.test(value)) score++;
    if (value.length >= 12) score++;

    bars.forEach((bar, index) => {
      bar.classList.toggle("active", index < score);
    });

    const labels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];

    text.textContent = `Password strength: ${labels[score]}`;
  });
}

/* ==========================================
   CONFIRM PASSWORD
========================================== */

function initConfirmPassword() {
  const password = document.getElementById("password");
  const confirm = document.getElementById("confirmPassword");

  if (!password || !confirm) return;

  confirm.addEventListener("input", () => {
    if (confirm.value === "") {
      confirm.setCustomValidity("");

      return;
    }

    if (confirm.value !== password.value) {
      confirm.setCustomValidity("Passwords do not match.");
    } else {
      confirm.setCustomValidity("");
    }
  });
}

/* ==========================================
   DOCUMENT UPLOAD
========================================== */

function initDocumentUpload() {
  const input = document.getElementById("approvalDocument");
  const area = document.querySelector(".upload-area");

  if (!input || !area) return;

  input.addEventListener("change", () => {
    if (!input.files.length) return;

    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert("Maximum file size is 5MB.");

      input.value = "";

      return;
    }

    area.classList.add("uploaded");

    area.querySelector("h5").textContent = file.name;
  });
}

/* ==========================================
   NAVIGATION
========================================== */

function initNavigation() {
  const form = document.getElementById("step2Form");
  const back = document.getElementById("backBtn");

  if (back) {
    back.addEventListener("click", () => {
      window.location.href = "register-step1.html";
    });
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());

    const previous =
      JSON.parse(localStorage.getItem("schoolRegistration")) || {};

    localStorage.setItem(
      "schoolRegistration",
      JSON.stringify({
        ...previous,
        ...data,
      }),
    );

    window.location.href = "register-step3.html";
  });
}
