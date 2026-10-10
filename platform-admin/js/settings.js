/* ==========================================
   PLATFORM SETTINGS
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================
     GENERAL SETTINGS FORM
  =========================================== */

  const settingsForm = document.getElementById("generalSettingsForm");

  if (settingsForm) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const platformName = document.getElementById("platformName").value.trim();

      const supportEmail = document.getElementById("supportEmail").value.trim();

      const supportPhone = document.getElementById("supportPhone").value.trim();

      const timezone = document.getElementById("timezone").value.trim();

      const currency = document.getElementById("currency").value.trim();

      const settings = {
        platformName,
        supportEmail,
        supportPhone,
        timezone,
        currency,
      };

      console.log("Platform settings:", settings);

      showToast("Settings saved successfully.");
    });
  }

  /* ==========================================
     NOTIFICATION TOGGLES
  =========================================== */

  const notificationToggles = document.querySelectorAll(".switch input");

  notificationToggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const setting = toggle.dataset.setting;

      const enabled = toggle.checked;

      console.log(`${setting}: ${enabled ? "enabled" : "disabled"}`);
    });
  });

  /* ==========================================
     INVITE ADMIN
  =========================================== */

  const inviteAdminBtn = document.getElementById("inviteAdminBtn");

  if (inviteAdminBtn) {
    inviteAdminBtn.addEventListener("click", () => {
      showToast("Admin invitation form will open here.");
    });
  }

  /* ==========================================
     EDIT ADMIN
  =========================================== */

  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      const name = row?.querySelector(".user-name strong")?.textContent.trim();

      showToast(`Editing ${name || "admin"}`);
    });
  });

  /* ==========================================
     REMOVE ADMIN
  =========================================== */

  const removeButtons = document.querySelectorAll(".remove-btn");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      const name = row?.querySelector(".user-name strong")?.textContent.trim();

      const confirmed = window.confirm(
        `Remove ${name || "this admin"} from the platform?`,
      );

      if (!confirmed) {
        return;
      }

      row?.remove();

      showToast(`${name || "Admin"} removed.`);
    });
  });

  /* ==========================================
     TOAST
  =========================================== */

  function showToast(message) {
    let toast = document.getElementById("settingsToast");

    if (!toast) {
      toast = document.createElement("div");

      toast.id = "settingsToast";

      toast.className = "settings-toast";

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    clearTimeout(toast.hideTimeout);

    toast.hideTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }
});
