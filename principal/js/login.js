// const togglePassword = document.getElementById("togglePassword");
// const passwordInput = document.getElementById("password");

// togglePassword.addEventListener("click", () => {
//   const type = passwordInput.type === "password" ? "text" : "password";
//   passwordInput.type = type;
// });

// PASSWORD TOGGLE
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";

  passwordInput.setAttribute("type", type);
});

// LOGIN VALIDATION
const loginForm = document.querySelector(".login-form");

const accessCode = document.getElementById("accessCode");
const password = document.getElementById("password");

const accessError = document.getElementById("accessError");
const passwordError = document.getElementById("passwordError");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // DEMO LOGIN DETAILS
  const validAccessCode = "JS/50/2024";
  const validPassword = "Password123";

  let hasError = false;

  // RESET
  accessCode.classList.remove("input-error");
  password.classList.remove("input-error");

  accessError.style.display = "none";
  passwordError.style.display = "none";

  // ACCESS CODE CHECK
  if (accessCode.value.trim() !== validAccessCode) {
    accessCode.classList.add("input-error");
    accessError.style.display = "block";
    hasError = true;
  }

  // PASSWORD CHECK
  if (password.value.trim() !== validPassword) {
    password.classList.add("input-error");
    passwordError.style.display = "block";
    hasError = true;
  }

  // SUCCESS
  if (!hasError) {
    window.location.href = "../pages/onboarding.html";
  }
});

// Section for handling the "Forgot Password" link

// FORGOT PASSWORD MODAL
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

const forgotModal = document.getElementById("forgotModal");

const closeModal = document.getElementById("closeModal");

// OPEN
forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();

  forgotModal.classList.add("active");
});

// CLOSE BUTTON
closeModal.addEventListener("click", () => {
  forgotModal.classList.remove("active");
});

// CLOSE WHEN CLICKING OUTSIDE
forgotModal.addEventListener("click", (e) => {
  if (e.target === forgotModal) {
    forgotModal.classList.remove("active");
  }
});
