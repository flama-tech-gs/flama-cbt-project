// ==========================================
// REGISTER STEP 1
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initLogoUpload();
  initFormValidation();
  initStateLGA();
});

/* ==========================================
   LOGO UPLOAD
========================================== */

function initLogoUpload() {
  const input = document.getElementById("schoolLogo");
  const uploadArea = document.querySelector(".upload-area");

  if (!input || !uploadArea) return;

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragging");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragging");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();

    uploadArea.classList.remove("dragging");

    const file = e.dataTransfer.files[0];

    if (!file) return;

    input.files = e.dataTransfer.files;

    updateUploadText(file);
  });

  input.addEventListener("change", () => {
    if (!input.files.length) return;

    updateUploadText(input.files[0]);
  });
}

function updateUploadText(file) {
  const title = document.querySelector(".upload-area h5");

  if (!title) return;

  title.textContent = file.name;
}

/* ==========================================
   FORM VALIDATION
========================================== */

function initFormValidation() {
  const form = document.getElementById("schoolInfoForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();

      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    // Save for next step
    localStorage.setItem("schoolRegistration", JSON.stringify(data));

    // Redirect
    window.location.href = "register-step2.html";
  });
}

/* ==========================================
   STATE / LGA
========================================== */

function initStateLGA() {
  const stateSelect = document.getElementById("state");
  const lgaSelect = document.getElementById("lga");

  if (!stateSelect || !lgaSelect) return;

  // Replace with API later
  const states = ["Abia", "Akwa Ibom", "Lagos", "Rivers"];

  states.forEach((state) => {
    const option = document.createElement("option");

    option.value = state;

    option.textContent = state;

    stateSelect.appendChild(option);
  });

  stateSelect.addEventListener("change", () => {
    lgaSelect.innerHTML = '<option value="">Select LGA</option>';

    // Replace with backend/API response
    ["LGA 1", "LGA 2", "LGA 3"].forEach((lga) => {
      const option = document.createElement("option");

      option.value = lga;

      option.textContent = lga;

      lgaSelect.appendChild(option);
    });
  });
}
