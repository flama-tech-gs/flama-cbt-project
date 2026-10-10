// ==========================================
// SETUP SCHOOL URL
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initSubdomain();
  initCopyButton();
  initPortalForm();
  loadSuggestedSubdomain();
});

/* ==========================================
   LOAD DEFAULT SUBDOMAIN
========================================== */

function loadSuggestedSubdomain() {
  const registration =
    JSON.parse(localStorage.getItem("schoolRegistration")) || {};

  const input = document.getElementById("subdomain");

  if (!input) return;

  if (registration.schoolName) {
    input.value = slugify(registration.schoolName);

    updatePreview();
  }
}

/* ==========================================
   SUBDOMAIN
========================================== */

function initSubdomain() {
  const input = document.getElementById("subdomain");

  if (!input) return;

  input.addEventListener("input", () => {
    input.value = slugify(input.value);

    updatePreview();

    checkAvailability();
  });
}

function updatePreview() {
  const input = document.getElementById("subdomain");

  const preview = document.getElementById("previewUrl");

  preview.textContent = `https://${input.value}.cbtschool.ng`;
}

/* ==========================================
   COPY URL
========================================== */

function initCopyButton() {
  const button = document.getElementById("copyUrl");

  if (!button) return;

  button.addEventListener("click", async () => {
    const url = document.getElementById("previewUrl").textContent;

    await navigator.clipboard.writeText(url);

    const original = button.innerHTML;

    button.innerHTML = '<i class="ri-check-line"></i> Copied';

    setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  });
}

/* ==========================================
   CHECK AVAILABILITY
========================================== */

function checkAvailability() {
  const status = document.getElementById("urlStatus");

  const value = document.getElementById("subdomain").value.trim();

  if (value.length < 3) {
    status.className = "url-status unavailable";

    status.innerHTML = '<i class="ri-close-line"></i> Too short';

    return;
  }

  // Replace with backend API later

  status.className = "url-status available";

  status.innerHTML = '<i class="ri-check-line"></i> Available';
}

/* ==========================================
   SUBMIT
========================================== */

function initPortalForm() {
  const form = document.getElementById("portalForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const portalUrl = document.getElementById("previewUrl").textContent;

    const registration =
      JSON.parse(localStorage.getItem("schoolRegistration")) || {};

    registration.portalUrl = portalUrl;

    localStorage.setItem("schoolRegistration", JSON.stringify(registration));

    // ======================================
    // API CALL HERE
    // ======================================

    /*
            POST /schools/create-url
            {
                portalUrl
            }
        */

    window.location.href = "../principal/dashboard.html";
  });
}

/* ==========================================
   HELPERS
========================================== */

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 30);
}
