/*==========================================================
  EDIT SCHOOL DETAILS
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeIcons();
  initializeForm();
  initializeCancelButton();
});

/*==========================================================
  LUCIDE
==========================================================*/

function initializeIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/*==========================================================
  FORM
==========================================================*/

function initializeForm() {
  const form = document.querySelector(".settings-card");

  if (!form) return;

  const inputs = form.querySelectorAll("input, select");

  const saveButton = document.querySelector(".btn-primary");

  let formChanged = false;

  inputs.forEach((input) => {
    input.dataset.originalValue = input.value;

    input.addEventListener("input", () => {
      formChanged = hasFormChanged(inputs);

      toggleSaveButton(saveButton, formChanged);
    });

    input.addEventListener("change", () => {
      formChanged = hasFormChanged(inputs);

      toggleSaveButton(saveButton, formChanged);
    });
  });

  saveButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (!validateForm(form)) return;

    normalizeWebsite();

    submitForm();
  });
}

/*==========================================================
  VALIDATION
==========================================================*/

function validateForm(form) {
  const requiredFields = form.querySelectorAll("[required]");

  let valid = true;

  requiredFields.forEach((field) => {
    field.classList.remove("input-error");

    if (!field.value.trim()) {
      field.classList.add("input-error");

      valid = false;
    }
  });

  const email = document.getElementById("officialEmail");

  if (email && email.value.trim()) {
    if (!isValidEmail(email.value.trim())) {
      email.classList.add("input-error");

      valid = false;
    }
  }

  if (!valid) {
    showNotification("Please complete all required fields correctly.");
  }

  return valid;
}

/*==========================================================
  EMAIL
==========================================================*/

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/*==========================================================
  WEBSITE
==========================================================*/

function normalizeWebsite() {
  const website = document.getElementById("website");

  if (!website) return;

  let value = website.value.trim();

  if (!value) return;

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    website.value = `https://${value}`;
  }
}

/*==========================================================
  SAVE BUTTON
==========================================================*/

function toggleSaveButton(button, changed) {
  button.disabled = !changed;

  button.style.opacity = changed ? "1" : ".6";
}

/*==========================================================
  FORM CHANGED
==========================================================*/

function hasFormChanged(inputs) {
  return [...inputs].some((input) => {
    return input.dataset.originalValue !== input.value;
  });
}

/*==========================================================
  CANCEL
==========================================================*/

function initializeCancelButton() {
  const cancel = document.querySelector(".btn-secondary");

  if (!cancel) return;

  cancel.addEventListener("click", () => {
    if (confirm("Discard your changes?")) {
      history.back();
    }
  });
}

/*==========================================================
  SUBMIT
==========================================================*/

function submitForm() {
  /*
    ==========================================================

    Backend Integration

    Replace this section with your API request.

    Example:

    fetch('/api/school/update', {
        method:'PUT',
        body:new FormData(...)
    })

    ==========================================================
    */

  console.log("Submitting School Details...");

  showNotification("School details updated successfully.");
}

/*==========================================================
  NOTIFICATION
==========================================================*/

function showNotification(message) {
  /*
    Replace with your reusable toast component
    when integrating the full dashboard.
    */

  alert(message);
}
