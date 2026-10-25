//backend/login.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberInput = document.getElementById("remember");
  const formAlert = document.getElementById("formAlert");
  const submitButton = loginForm?.querySelector(".auth-submit");
  const submitText = loginForm?.querySelector(".btn-text");
  const submitLoader = loginForm?.querySelector(".btn-loader");
  const passwordToggle = document.querySelector(".password-toggle");

  const TOKEN_KEY = "flamaAccessToken";
  const REFRESH_TOKEN_KEY = "flamaRefreshToken";
  const DASHBOARD_URL = "../school-admin/index.html";

  if (!loginForm) {
    console.error("Login form #loginForm was not found.");
    return;
  }

  function showAlert(message, type = "error") {
    if (!formAlert) {
      alert(message);
      return;
    }

    formAlert.textContent = message;
    formAlert.hidden = false;
    formAlert.classList.remove("success", "error");
    formAlert.classList.add(type);
  }

  function clearAlert() {
    if (!formAlert) return;

    formAlert.textContent = "";
    formAlert.hidden = true;
    formAlert.classList.remove("success", "error");
  }

  function setLoading(isLoading) {
    if (submitButton) submitButton.disabled = isLoading;

    if (submitText) {
      submitText.textContent = isLoading
        ? "Signing In..."
        : "Sign In to Dashboard";
    }

    if (submitLoader) submitLoader.hidden = !isLoading;
  }

  function clearFieldErrors() {
    loginForm.querySelectorAll(".input-error").forEach((element) => {
      element.textContent = "";
    });

    emailInput?.classList.remove("input-invalid");
    passwordInput?.classList.remove("input-invalid");
  }

  function showFieldError(input, message) {
    if (!input) return;

    input.classList.add("input-invalid");

    const errorElement = input
      .closest(".form-group")
      ?.querySelector(".input-error");

    if (errorElement) errorElement.textContent = message;
  }

  function validateForm() {
    clearFieldErrors();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    let valid = true;

    if (!email) {
      showFieldError(emailInput, "Enter your email address.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, "Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, "Enter your password.");
      valid = false;
    }

    return valid;
  }

  function getLoginPayload(response) {
    // apiRequest() in api.js returns result.data ?? result.
    // This also tolerates an additional nested data wrapper.
    let payload = response;

    for (let i = 0; i < 3; i += 1) {
      if (
        payload &&
        typeof payload === "object" &&
        payload.data &&
        typeof payload.data === "object"
      ) {
        payload = payload.data;
      } else {
        break;
      }
    }

    return payload;
  }

  function saveLoginSession(response, email) {
    const payload = getLoginPayload(response);

    const accessToken =
      payload?.accessToken ||
      payload?.access_token ||
      payload?.token ||
      payload?.tokens?.accessToken ||
      payload?.tokens?.access_token ||
      payload?.session?.accessToken ||
      payload?.session?.access_token;

    const refreshToken =
      payload?.refreshToken ||
      payload?.refresh_token ||
      payload?.tokens?.refreshToken ||
      payload?.tokens?.refresh_token ||
      payload?.session?.refreshToken ||
      payload?.session?.refresh_token;

    if (!accessToken) {
      console.error("Login response payload:", payload);
      throw new Error(
        "Login response did not include an access token. Check the /onboarding/login response."
      );
    }

    // api.js reads flamaAccessToken from sessionStorage.
    // Keep the token there so existing API calls continue to work.
    sessionStorage.setItem(TOKEN_KEY, accessToken);

    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    const owner =
      payload?.owner ||
      payload?.user ||
      payload?.schoolOwner ||
      payload?.account ||
      null;

    const school = payload?.school || null;

    if (owner) {
      sessionStorage.setItem("flamaOwner", JSON.stringify(owner));
    }

    if (school) {
      sessionStorage.setItem("flamaSchool", JSON.stringify(school));
    }

    sessionStorage.setItem(
      "flamaLogin",
      JSON.stringify({
        email,
        loggedInAt: new Date().toISOString(),
      })
    );

    // Remember-me persists the email only. The existing api.js reads
    // the access token from sessionStorage, so keep the token there.
    if (rememberInput?.checked) {
      localStorage.setItem("flamaRememberedEmail", email);
    } else {
      localStorage.removeItem("flamaRememberedEmail");
    }
  }

  passwordToggle?.addEventListener("click", () => {
    const showingPassword = passwordInput.type === "password";
    passwordInput.type = showingPassword ? "text" : "password";

    passwordToggle.setAttribute(
      "aria-label",
      showingPassword ? "Hide password" : "Show password"
    );

    const icon = passwordToggle.querySelector("i");

    if (icon) {
      icon.classList.toggle("ri-eye-line", !showingPassword);
      icon.classList.toggle("ri-eye-off-line", showingPassword);
    }
  });

  [emailInput, passwordInput].forEach((input) => {
    input?.addEventListener("input", () => {
      input.classList.remove("input-invalid");

      const errorElement = input
        .closest(".form-group")
        ?.querySelector(".input-error");

      if (errorElement) errorElement.textContent = "";
      clearAlert();
    });
  });

  // Restore the remembered email without persisting the access token.
  const rememberedEmail = localStorage.getItem("flamaRememberedEmail");
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberInput) rememberInput.checked = true;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();

    if (!validateForm()) return;

    if (typeof apiRequest !== "function") {
      showAlert("api.js must load before login.js.");
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    setLoading(true);

    try {
      // Clear an old token before attempting a new login.
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);

      const response = await apiRequest("/onboarding/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const payload = getLoginPayload(response);

      if (
        response?.success === false ||
        payload?.success === false
      ) {
        throw new Error(
          response?.message ||
            payload?.message ||
            "Unable to sign in."
        );
      }

      // This is required before redirecting.
      saveLoginSession(response, email);

      showAlert(
        "Login successful. Redirecting to your dashboard...",
        "success"
      );

      window.location.assign(DASHBOARD_URL);
    } catch (error) {
      console.error("School owner login failed:", error);

      const message = String(error?.message || "");
      const isUnverified =
        /verify your account|email.*not verified|not verified/i.test(
          message
        );

      if (isUnverified) {
        const verifyUrl = new URL(
          "./verify-email.html",
          window.location.href
        );

        verifyUrl.searchParams.set("email", email);
        window.location.assign(verifyUrl.toString());
        return;
      }

      showAlert(
        message || "Unable to sign in. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  });
});