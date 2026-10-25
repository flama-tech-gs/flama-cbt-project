//backend/forgotPassword.js


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const alertBox = document.getElementById("formAlert");
  const button = form.querySelector(".auth-submit");
  const buttonText = form.querySelector(".btn-text");
  const loader = form.querySelector(".btn-loader");

  function showMessage(message, type = "error") {
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.classList.remove("success", "error");
    alertBox.classList.add(type);
  }

  function setLoading(loading) {
    button.disabled = loading;
    buttonText.textContent = loading
      ? "Sending..."
      : "Send Reset Link";
    loader.hidden = !loading;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    alertBox.hidden = true;
    emailInput.classList.remove("input-invalid");

    const email = emailInput.value.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add("input-invalid");
      const error = emailInput
        .closest(".form-group")
        .querySelector(".input-error");

      error.textContent = "Enter a valid email address.";
      return;
    }

    emailInput
      .closest(".form-group")
      .querySelector(".input-error").textContent = "";

    setLoading(true);

    try {
      const result = await apiRequest("/onboarding/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      showMessage(
        result?.message ||
          "If an account with that email exists, a password reset link has been sent.",
        "success"
      );

      form.reset();
    } catch (error) {
      console.error("Forgot password error:", error);

      showMessage(
        error.message || "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  });
});
