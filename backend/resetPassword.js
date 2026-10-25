//backend/resetPassword.js


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const alertBox = document.getElementById("formAlert");
  const button = form.querySelector(".auth-submit");
  const buttonText = form.querySelector(".btn-text");
  const loader = form.querySelector(".btn-loader");

  const params = new URLSearchParams(window.location.search);
  const email = (params.get("email") || "").trim().toLowerCase();
  const token = params.get("token") || "";

  emailInput.value = email;

  function showMessage(message, type = "error") {
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.classList.remove("success", "error");
    alertBox.classList.add(type);
  }

  function setLoading(loading) {
    button.disabled = loading;
    buttonText.textContent = loading
      ? "Resetting..."
      : "Reset Password";
    loader.hidden = !loading;
  }

  // Show/hide password controls.
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );

      const icon = toggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("ri-eye-line", !show);
        icon.classList.toggle("ri-eye-off-line", show);
      }
    });
  });

  if (!email || !token) {
    form.hidden = true;
    showMessage(
      "This password reset link is incomplete. Request a new reset link."
    );
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    alertBox.hidden = true;

    const newPassword = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (newPassword.length < 8) {
      showMessage("Your new password must contain at least 8 characters.");
      passwordInput.focus();
      return;
    }

    if (newPassword.length > 128) {
      showMessage("Your password cannot exceed 128 characters.");
      passwordInput.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("The passwords do not match.");
      confirmInput.focus();
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest("/onboarding/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      showMessage(
        result?.message ||
          "Password reset successfully. Please log in again.",
        "success"
      );

      form.reset();
      emailInput.value = email;

      // Remove the one-time token from the address bar after success.
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      window.setTimeout(() => {
        window.location.assign("./login.html");
      }, 1800);
    } catch (error) {
      console.error("Reset password error:", error);

      showMessage(
        error.message ||
          "Unable to reset your password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  });
});
