//backend/adminAuth.js

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:5000/api/admin/auth";
  const messageBox = document.getElementById("formMessage");

  const getToken = () =>
    sessionStorage.getItem("flamaAccessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    localStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken");

  function showMessage(message, isError = false) {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.classList.toggle("error", isError);
    messageBox.style.display = "block";
    messageBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function post(path, body, requiresAdminToken = false) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (requiresAdminToken) {
      const token = getToken();
      if (!token) {
        throw new Error("Log in as a Super Admin before inviting an admin.");
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      const errors = Array.isArray(result.errors)
        ? `\n${result.errors.join("\n")}`
        : "";

      throw new Error(
        `${result.message || `Request failed (${response.status})`}${errors}`
      );
    }

    return result;
  }

  function values(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function bindForm({ id, endpoint, map, requiresAdminToken = false, onSuccess }) {
    const form = document.getElementById(id);
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = form.querySelector('button[type="submit"]');
      const originalText = button.textContent;

      try {
        button.disabled = true;
        button.textContent = "Please wait...";

        const body = map(values(form));
        const result = await post(endpoint, body, requiresAdminToken);

        showMessage(
          result.message ||
          result.data?.message ||
          "Request completed successfully."
        );

        if (onSuccess) onSuccess(body, result);
      } catch (error) {
        showMessage(error.message || "Something went wrong.", true);
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  bindForm({
    id: "createAdminForm",
    endpoint: "/create",
    requiresAdminToken: true,
    map: (form) => ({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      roleName: form.roleName,
    }),
    onSuccess: (body) => {
      // Carry the invited admin's email to the verification page.
      location.href =
        `./admin-verify.html?email=${encodeURIComponent(body.email)}`;
    },
  });

  bindForm({
    id: "verifyEmailForm",
    endpoint: "/admin-verify",
    map: (form) => ({
      email: form.email.trim().toLowerCase(),
      otp: form.otp.trim(),
    }),
  });

  bindForm({
    id: "resendOtpForm",
    endpoint: "/admin-resend-otp",
    map: (form) => ({
      email: form.email.trim().toLowerCase(),
    }),
  });

  bindForm({
    id: "forgotPasswordForm",
    endpoint: "/admin-forgot-password",
    map: (form) => ({
      email: form.email.trim().toLowerCase(),
    }),
  });

  bindForm({
    id: "resetPasswordForm",
    endpoint: "/admin-reset-password",
    map: (form) => ({
      token: form.token.trim(),
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      document.getElementById("resetPasswordForm").reset();
      history.replaceState({}, document.title, location.pathname);
    },
  });

  const query = new URLSearchParams(location.search);
  const email = query.get("email");

  if (email) {
    document
      .querySelectorAll('#verifyEmailForm input[name="email"], #resendOtpForm input[name="email"]')
      .forEach((input) => {
        input.value = email;
      });
  }

  const resetToken =
    query.get("token") ||
    query.get("resetToken");

  if (resetToken) {
    const tokenInput = document.getElementById("resetToken");
    if (tokenInput) tokenInput.value = resetToken;
  }
});