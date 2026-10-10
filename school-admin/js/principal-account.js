/*==========================================================
    PRINCIPAL ACCOUNT
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeLucide();
  initializePasswordToggles();
  initializePasswordValidation();
  initializeEditProfile();
  initializeCreatePrincipal();
  initializeDeactivatePrincipal();
});

/*==========================================================
    LUCIDE
==========================================================*/

function initializeLucide() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/*==========================================================
    PASSWORD VISIBILITY
==========================================================*/

function initializePasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);

      if (!input) return;

      input.type = input.type === "password" ? "text" : "password";

      button.innerHTML =
        input.type === "password"
          ? '<i data-lucide="eye"></i>'
          : '<i data-lucide="eye-off"></i>';

      lucide.createIcons();
    });
  });
}

/*==========================================================
    PASSWORD VALIDATION
==========================================================*/

function initializePasswordValidation() {
  const password = document.getElementById("newPrincipalPassword");

  const confirm = document.getElementById("confirmPrincipalPassword");

  if (!password || !confirm) return;

  confirm.addEventListener("input", () => {
    if (confirm.value !== password.value) {
      confirm.setCustomValidity("Passwords do not match.");
    } else {
      confirm.setCustomValidity("");
    }
  });
}

/*==========================================================
    EDIT PROFILE
==========================================================*/

function initializeEditProfile() {
  const button = document.getElementById("editProfileBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    /*
        =====================================

        Open Edit Profile Modal

        or

        Navigate to Edit Profile Page

        =====================================
        */

    console.log("Edit Principal Profile");

    notify("Edit profile feature coming soon.");
  });
}

/*==========================================================
    CREATE NEW PRINCIPAL
==========================================================*/

function initializeCreatePrincipal() {
  const form = document.getElementById("createPrincipalForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const confirmed = document.getElementById("confirmReplacement");

    if (!confirmed.checked) {
      notify("Please confirm principal replacement.");

      return;
    }

    createPrincipal(form);
  });
}

async function createPrincipal(form) {
  /*
    =====================================

    Backend Example

    POST

    /api/principal/create

    =====================================

    */

  console.log(new FormData(form));

  notify("Principal account created successfully.");
}

/*==========================================================
    DEACTIVATE
==========================================================*/

function initializeDeactivatePrincipal() {
  const button = document.getElementById("deactivatePrincipalBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    const confirmed = confirm("Deactivate the current principal?");

    if (!confirmed) return;

    deactivatePrincipal();
  });
}

async function deactivatePrincipal() {
  /*
    =====================================

    Backend Example

    DELETE

    /api/principal

    =====================================

    */

  console.log("Principal Deactivated");

  notify("Principal account deactivated.");
}

/*==========================================================
    RESET PASSWORD
==========================================================*/

document
  .getElementById("principalPasswordForm")
  ?.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    if (!form.reportValidity()) return;

    /*
    =====================================

    Backend

    POST

    /api/principal/reset-password

    =====================================

    */

    notify("Password reset successfully.");
  });

/*==========================================================
    NOTIFICATION
==========================================================*/

function notify(message) {
  /*
    Replace with reusable dashboard
    Toast component.
    */

  alert(message);
}
