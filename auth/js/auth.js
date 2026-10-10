// ==========================================
// AUTHENTICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggle();
  initFormValidation();
});

// ==========================================
// PASSWORD TOGGLE
// ==========================================

function initPasswordToggle() {
  const toggles = document.querySelectorAll(".password-toggle");

  toggles.forEach((toggle) => {
    const input = toggle.previousElementSibling;
    const icon = toggle.querySelector("i");

    toggle.addEventListener("click", () => {
      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";

      icon.classList.toggle("ri-eye-line");
      icon.classList.toggle("ri-eye-off-line");

      toggle.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password",
      );
    });
  });
}

// ==========================================
// LOGIN FORM
// ==========================================

function initFormValidation() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", handleSubmit);
}

// ==========================================
// HANDLE SUBMIT
// ==========================================

function handleSubmit(e) {
  e.preventDefault();

  clearErrors();

  const email = document.getElementById("email");
  const password = document.getElementById("password");

  let valid = true;

  if (!validateEmail(email)) valid = false;

  if (!validatePassword(password)) valid = false;

  if (!valid) return;

  setLoading(true);

  // ==================================
  // Replace with API request
  // ==================================

  setTimeout(() => {
    setLoading(false);

    console.log({
      email: email.value.trim(),
      password: password.value,
      remember: document.getElementById("remember").checked,
    });

    // Example
    // window.location.href = "../dashboard/index.html";
  }, 1500);
}

// ==========================================
// EMAIL
// ==========================================

function validateEmail(input) {
  const value = input.value.trim();

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value) {
    showError(input, "Email address is required.");

    return false;
  }

  if (!regex.test(value)) {
    showError(input, "Enter a valid email address.");

    return false;
  }

  return true;
}

// ==========================================
// PASSWORD
// ==========================================

function validatePassword(input) {
  const value = input.value.trim();

  if (!value) {
    showError(input, "Password is required.");

    return false;
  }

  return true;
}

// ==========================================
// SHOW ERROR
// ==========================================

function showError(input, message) {
  const group = input.closest(".form-group");

  if (!group) return;

  group.classList.add("error");

  const error = group.querySelector(".input-error");

  if (error) {
    error.textContent = message;
  }
}

// ==========================================
// CLEAR ERRORS
// ==========================================

function clearErrors() {
  document.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("error");

    const error = group.querySelector(".input-error");

    if (error) {
      error.textContent = "";
    }
  });
}

// ==========================================
// BUTTON LOADING
// ==========================================

function setLoading(state) {
  const button = document.querySelector(".auth-submit");

  if (!button) return;

  const loader = button.querySelector(".btn-loader");

  button.disabled = state;

  button.classList.toggle("loading", state);

  if (loader) {
    loader.hidden = !state;
  }
}

// ==========================================
// ALERT
// ==========================================

function showAlert(message, type = "error") {
  const alert = document.getElementById("formAlert");

  if (!alert) return;

  alert.hidden = false;

  alert.className = `form-alert show ${type}`;

  alert.textContent = message;
}

function hideAlert() {
  const alert = document.getElementById("formAlert");

  if (!alert) return;

  alert.hidden = true;

  alert.className = "form-alert";

  alert.textContent = "";
}
