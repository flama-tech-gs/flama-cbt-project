/*=========================================================
    ACCOUNT SETTINGS
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeLucide();
  initializeLogoUpload();
  initializePasswordToggles();
  initializePasswordStrength();
  initializePasswordValidation();
  initializeSlugValidation();
  initializeForms();
});

/*=========================================================
    LUCIDE
=========================================================*/

function initializeLucide() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/*=========================================================
    LOGO UPLOAD
=========================================================*/

function initializeLogoUpload() {
  const uploadInput = document.getElementById("logoUpload");
  const uploadZone = document.getElementById("uploadZone");
  const preview = document.getElementById("currentLogo");
  const filename = document.getElementById("logoFilename");

  if (!uploadInput || !uploadZone) return;

  uploadInput.addEventListener("change", handleFiles);

  ["dragenter", "dragover"].forEach((event) => {
    uploadZone.addEventListener(event, (e) => {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((event) => {
    uploadZone.addEventListener(event, (e) => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
    });
  });

  uploadZone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;

    if (files.length) {
      uploadInput.files = files;

      handleFiles();
    }
  });

  function handleFiles() {
    const file = uploadInput.files[0];

    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];

    if (!validTypes.includes(file.type)) {
      notify("Only PNG, JPG or SVG allowed.");

      uploadInput.value = "";

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("Maximum file size is 2MB.");

      uploadInput.value = "";

      return;
    }

    filename.textContent = file.name;

    const reader = new FileReader();

    reader.onload = (e) => {
      preview.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
}

/*=========================================================
    PASSWORD VISIBILITY
=========================================================*/

function initializePasswordToggles() {
  document
    .querySelectorAll(".password-toggle")

    .forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        input.type = input.type === "password" ? "text" : "password";

        button.innerHTML =
          input.type === "password"
            ? '<i data-lucide="eye"></i>'
            : '<i data-lucide="eye-off"></i>';

        lucide.createIcons();
      });
    });
}

/*=========================================================
    PASSWORD STRENGTH
=========================================================*/

function initializePasswordStrength() {
  const password = document.getElementById("newPassword");

  const bar = document.getElementById("strengthBar");

  const text = document.getElementById("strengthText");

  if (!password) return;

  password.addEventListener("input", () => {
    const value = password.value;

    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const levels = {
      0: ["0%", "Weak", "#EF4444"],
      1: ["20%", "Weak", "#EF4444"],
      2: ["40%", "Fair", "#F59E0B"],
      3: ["60%", "Good", "#3B82F6"],
      4: ["80%", "Strong", "#16A34A"],
      5: ["100%", "Very Strong", "#16A34A"],
    };

    const level = levels[score];

    bar.style.width = level[0];

    bar.style.background = level[2];

    text.innerHTML = `Password strength:
             <strong>${level[1]}</strong>`;
  });
}

/*=========================================================
    PASSWORD MATCH
=========================================================*/

function initializePasswordValidation() {
  const newPassword = document.getElementById("newPassword");

  const confirm = document.getElementById("confirmPassword");

  if (!confirm) return;

  confirm.addEventListener("input", () => {
    if (confirm.value !== newPassword.value) {
      confirm.setCustomValidity("Passwords do not match");
    } else {
      confirm.setCustomValidity("");
    }
  });
}

/*=========================================================
    SCHOOL URL
=========================================================*/

function initializeSlugValidation() {
  const slug = document.getElementById("schoolSlug");

  const status = document.querySelector(".url-status span");

  if (!slug) return;

  slug.addEventListener("input", () => {
    slug.value = slug.value

      .toLowerCase()

      .replace(/[^a-z0-9-]/g, "");

    /*
            Backend API

            GET

            /schools/check-slug

        */

    status.textContent = "Available";
  });
}

/*=========================================================
    FORMS
=========================================================*/

function initializeForms() {
  document
    .querySelectorAll("form")

    .forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!form.reportValidity()) return;

        submitForm(form);
      });
    });
}

/*=========================================================
    BACKEND
=========================================================*/

function submitForm(form) {
  /*
    ======================================

    Replace with API request

    fetch()

    axios()

    ======================================
    */

  console.log(
    "Submitting",

    form.id,

    new FormData(form),
  );

  notify("Changes saved successfully.");
}

/*=========================================================
    NOTIFICATION
=========================================================*/

function notify(message) {
  /*
        Replace with reusable
        Toast component
    */

  alert(message);
}
