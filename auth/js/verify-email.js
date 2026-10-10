// ==========================================
// VERIFY EMAIL
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initOTP();
  initCountdown();
  initVerification();
});

// ==========================================
// OTP INPUTS
// ==========================================

function initOTP() {
  const inputs = document.querySelectorAll(".otp-input");

  if (!inputs.length) return;

  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");

      e.target.value = value;

      if (value) {
        e.target.classList.add("filled");

        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      } else {
        e.target.classList.remove("filled");
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", handlePaste);
  });
}

// ==========================================
// PASTE
// ==========================================

function handlePaste(e) {
  e.preventDefault();

  const pasted = (e.clipboardData || window.clipboardData)
    .getData("text")
    .replace(/\D/g, "")
    .slice(0, 6);

  const inputs = document.querySelectorAll(".otp-input");

  pasted.split("").forEach((digit, index) => {
    if (!inputs[index]) return;

    inputs[index].value = digit;
    inputs[index].classList.add("filled");
  });

  if (pasted.length === 6) {
    inputs[5].focus();
  }
}

// ==========================================
// COUNTDOWN
// ==========================================

function initCountdown() {
  const timer = document.getElementById("countdown");

  if (!timer) return;

  let seconds = 9 * 60 + 47;

  const interval = setInterval(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    timer.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    if (seconds <= 0) {
      clearInterval(interval);

      timer.textContent = "Expired";

      document.querySelector(".resend-link")?.classList.remove("disabled");

      return;
    }

    seconds--;
  }, 1000);
}

// ==========================================
// VERIFY
// ==========================================

function initVerification() {
  const form = document.getElementById("verifyForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const code = [...document.querySelectorAll(".otp-input")]
      .map((input) => input.value)
      .join("");

    if (code.length !== 6) {
      alert("Enter the complete verification code.");

      return;
    }

    const button = form.querySelector(".btn");
    const loader = button.querySelector(".btn-loader");

    button.disabled = true;
    button.classList.add("loading");

    if (loader) loader.classList.remove("hidden");

    // ==================================
    // Replace with API request
    // ==================================

    setTimeout(() => {
      console.log("Verification Code:", code);

      // window.location.href = "success.html";

      button.disabled = false;
      button.classList.remove("loading");

      if (loader) loader.classList.add("hidden");
    }, 1500);
  });
}
