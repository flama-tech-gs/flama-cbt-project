//backend/studentLogin.js

(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE ||
    (isLocal
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : `${window.location.origin}/api`);

  const SCHOOL_INFO_URL = `${API_BASE}/tenant/auth/school-info`;
  const LOGIN_URL = `${API_BASE}/tenant/auth/student/login`;

  const form = document.querySelector(".login-form");
  const accessCodeInput = document.getElementById("accessCode");
  const passwordInput = document.getElementById("password");
  const accessError = document.getElementById("accessError");
  const passwordError = document.getElementById("passwordError");
  const togglePassword = document.getElementById("togglePassword");
  const forgotLink = document.getElementById("forgotPasswordLink");
  const forgotModal = document.getElementById("forgotModal");
  const closeModal = document.getElementById("closeModal");
  const loginButton = form?.querySelector(".login-btn");

  const schoolName = document.querySelector(".login-header h1");
  const tagline = document.querySelector(".login-header .tagline");

  function unwrap(response) {
    let result = response;

    for (let i = 0; i < 5; i += 1) {
      if (
        result &&
        typeof result === "object" &&
        Object.prototype.hasOwnProperty.call(result, "data")
      ) {
        result = result.data;
      } else {
        break;
      }
    }

    return result;
  }

  function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = "block";
  }

  function hideError(element) {
    if (!element) return;
    element.style.display = "none";
  }

  function findValue(object, names, depth = 0) {
    if (!object || typeof object !== "object" || depth > 5) return null;

    for (const name of names) {
      if (typeof object[name] === "string" && object[name].trim()) {
        return object[name];
      }
    }

    for (const value of Object.values(object)) {
      if (value && typeof value === "object") {
        const found = findValue(value, names, depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  async function loadSchoolName() {
    try {
      const response = await fetch(SCHOOL_INFO_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.message ||
            body.error ||
            `School information request failed (${response.status})`
        );
      }

      const data = unwrap(body);
      const name =
        data?.school?.name ||
        data?.name ||
        data?.schoolName ||
        findValue(data, ["schoolName"]);

      if (name && schoolName) {
        schoolName.textContent = name;
      }
    } catch (error) {
      // The school name in the HTML remains as the fallback.
      console.warn("Could not load school name:", error.message);
    }
  }

  function setLoading(isLoading) {
    if (!loginButton) return;

    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? "Logging in…" : "Login →";
  }

  async function handleLogin(event) {
    event.preventDefault();

    hideError(accessError);
    hideError(passwordError);

    const admissionNumber = accessCodeInput?.value.trim();
    const password = passwordInput?.value;

    if (!admissionNumber) {
      showError(accessError, "Enter your access code.");
      accessCodeInput?.focus();
      return;
    }

    if (!password) {
      showError(passwordError, "Enter your password.");
      passwordInput?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admissionNumber,
          password,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          body.message ||
          body.error ||
          "Login failed. Check your access code and password.";

        // Show credential errors beside the relevant fields.
        if (/admission|access|student|identifier/i.test(message)) {
          showError(accessError, message);
        } else {
          showError(passwordError, message);
        }

        return;
      }

      const result = unwrap(body);
      const accessToken = findValue(result, [
        "accessToken",
        "access_token",
        "token",
      ]);
      const refreshToken = findValue(result, [
        "refreshToken",
        "refresh_token",
      ]);

      if (!accessToken) {
        throw new Error(
          "Login succeeded, but the server response did not include an access token."
        );
      }

      // Clear tokens for other portal roles to avoid using the wrong account.
      [
        "principalAccessToken",
        "teacherAccessToken",
        "studentAccessToken",
        "tenantAccessToken",
        "principalRefreshToken",
        "teacherRefreshToken",
        "studentRefreshToken",
        "refreshToken",
      ].forEach((key) => sessionStorage.removeItem(key));

      sessionStorage.setItem("studentAccessToken", accessToken);
      sessionStorage.setItem("tenantAccessToken", accessToken);

      if (refreshToken) {
        sessionStorage.setItem("studentRefreshToken", refreshToken);
      }

      const student =
        result?.student ||
        result?.user ||
        result?.account ||
        null;

      if (student) {
        sessionStorage.setItem("studentUser", JSON.stringify(student));
      }

      window.location.assign("./pages/onboarding.html");
    } catch (error) {
      console.error("Student login failed:", error);
      showError(
        passwordError,
        error.message || "Could not connect to the login service."
      );
    } finally {
      setLoading(false);
    }
  }

  function initialize() {
    if (tagline) {
      tagline.textContent = "Student Portal";
    }

    loadSchoolName();

    form?.addEventListener("submit", handleLogin);

    accessCodeInput?.addEventListener("input", () => {
      hideError(accessError);
    });

    passwordInput?.addEventListener("input", () => {
      hideError(passwordError);
    });

    togglePassword?.addEventListener("click", () => {
      if (!passwordInput) return;

      const showing = passwordInput.type === "text";
      passwordInput.type = showing ? "password" : "text";
      togglePassword.textContent = showing ? "👁️" : "🙈";
    });

    if (closeModal) {
      closeModal.type = "button";
      closeModal.addEventListener("click", (event) => {
        event.preventDefault();
        if (forgotModal) forgotModal.style.display = "none";
      });
    }

    forgotLink?.addEventListener("click", (event) => {
      event.preventDefault();
      if (forgotModal) forgotModal.style.display = "flex";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();