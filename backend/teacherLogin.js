//backend/teacherLogin.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const AUTH_ROOT = `${API_BASE}/tenant/auth`;

  const form = document.querySelector(".login-form");

  if (!form) {
    console.error("Teacher login form was not found.");
    return;
  }

  // Remove any demo event listeners attached by login.js while retaining
  // the existing HTML and CSS.
  const cleanForm = form.cloneNode(true);
  form.replaceWith(cleanForm);

  const staffIdInput =
    cleanForm.querySelector('input[type="text"]');
  const passwordInput =
    cleanForm.querySelector("#password");
  const loginButton =
    cleanForm.querySelector(".login-btn");
  const accessError =
    cleanForm.querySelector("#accessError");
  const passwordError =
    cleanForm.querySelector("#passwordError");
  const togglePassword =
    cleanForm.querySelector("#togglePassword");
  const forgotLink =
    cleanForm.querySelector("#forgotPasswordLink");
  const forgotModal =
    cleanForm.querySelector("#forgotModal");
  const closeModalButton =
    cleanForm.querySelector("#closeModal");

  function findNestedValue(root, key, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(root, key)) {
      return root[key];
    }

    for (const value of Object.values(root)) {
      if (value && typeof value === "object") {
        const found = findNestedValue(value, key, depth + 1);
        if (found !== undefined) return found;
      }
    }

    return undefined;
  }

  function getImageUrl(value) {
    if (typeof value === "string") return value;
    if (value && typeof value.url === "string") return value.url;
    return "";
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(window.flamaSchoolHeaders?.() || {}),
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        findNestedValue(body, "message") ||
          findNestedValue(body, "error") ||
          `Request failed (${response.status})`
      );
    }

    return body;
  }

  function showError(element, message) {
    if (!element) return;

    element.textContent = message;
    element.hidden = false;
    element.style.display = "block";
  }

  function hideErrors() {
    [accessError, passwordError].forEach((element) => {
      if (!element) return;
      element.hidden = true;
      element.style.display = "none";
    });
  }

  function applySchoolInfo(responseBody) {
    const name =
      findNestedValue(responseBody, "schoolName") ||
      findNestedValue(responseBody, "name") ||
      "";

    const logo =
      getImageUrl(findNestedValue(responseBody, "logo")) ||
      getImageUrl(findNestedValue(responseBody, "logoUrl"));

    const taglineElement = document.querySelector(".login-header .tagline");
		if (taglineElement) {
		  taglineElement.textContent = "Teacher Portal";
		}

    const nameElement =
      document.querySelector(".login-header h1");
    const logoElement =
      document.querySelector(".login-header .logo");

    if (nameElement && name) {
      nameElement.textContent = name;
      document.title = `Login | ${name}`;
    }

    if (logoElement && logo) {
      logoElement.src = logo;
      logoElement.alt = `${name || "School"} logo`;
    }
  }

  async function loadSchoolInfo() {
    try {
      const result = await requestJson(
        `${AUTH_ROOT}/school-info`
      );
      applySchoolInfo(result);
    } catch (error) {
      // Keep the HTML defaults visible if school info is unavailable.
      console.error("Could not load school login information:", error);
    }
  }

  function saveTeacherSession(responseBody) {
    const accessToken =
      findNestedValue(responseBody, "accessToken");
    const refreshToken =
      findNestedValue(responseBody, "refreshToken");
    const teacher =
      findNestedValue(responseBody, "teacher");

    if (!accessToken) {
      throw new Error(
        "Login succeeded, but the server did not return an access token."
      );
    }

    sessionStorage.setItem("teacherAccessToken", accessToken);
    sessionStorage.setItem("tenantAccessToken", accessToken);

    if (refreshToken) {
      sessionStorage.setItem("teacherRefreshToken", refreshToken);
    }

    if (teacher) {
      sessionStorage.setItem(
        "teacherUser",
        JSON.stringify(teacher)
      );
    }
  }

  function showModal() {
    if (!forgotModal) return;
    forgotModal.style.display = "flex";
    forgotModal.setAttribute("aria-hidden", "false");
  }

  function hideModal() {
    if (!forgotModal) return;
    forgotModal.style.display = "none";
    forgotModal.setAttribute("aria-hidden", "true");
  }

  togglePassword?.addEventListener("click", () => {
    if (!passwordInput) return;

    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password"
    );
  });

  forgotLink?.addEventListener("click", (event) => {
    event.preventDefault();
    showModal();
  });

  closeModalButton?.addEventListener("click", (event) => {
    event.preventDefault();
    hideModal();
  });

  forgotModal?.addEventListener("click", (event) => {
    if (event.target === forgotModal) hideModal();
  });

  cleanForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideErrors();

    const identifier = staffIdInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!identifier) {
      showError(accessError, "Enter your Staff ID or email.");
      staffIdInput?.focus();
      return;
    }

    if (!password) {
      showError(passwordError, "Enter your password.");
      passwordInput?.focus();
      return;
    }

    const originalButtonText =
      loginButton?.textContent || "Login →";

    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = "Signing in…";
    }

    try {
      const result = await requestJson(
        `${AUTH_ROOT}/teacher/login`,
        {
          method: "POST",
          body: JSON.stringify({
            identifier,
            password,
            device: navigator.userAgent,
          }),
        }
      );

      saveTeacherSession(result);

      window.location.assign("./profile/profile");
    } catch (error) {
      const message =
        error.message || "Unable to sign in. Please try again.";

      if (/password/i.test(message)) {
        showError(passwordError, message);
        passwordInput?.focus();
      } else {
        showError(accessError, message);
        staffIdInput?.focus();
      }
    } finally {
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = originalButtonText;
      }
    }
  });

  hideErrors();
  loadSchoolInfo();
})();
