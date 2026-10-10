// ==========================================
// PORTAL ACTIVATED
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadPortalDetails();
  initCopyButton();
  initEmailShare();
  initWhatsAppShare();
});

/* ==========================================
   LOAD PORTAL DETAILS
========================================== */

function loadPortalDetails() {
  const registration =
    JSON.parse(localStorage.getItem("schoolRegistration")) || {};

  const schoolName = registration.schoolName || "Your School";

  const email =
    registration.officialEmail ||
    registration.email ||
    "admin@yourschool.edu.ng";

  const portalUrl = registration.portalUrl || "https://yourschool.cbtschool.ng";

  document.getElementById("schoolName").textContent = schoolName;

  document.getElementById("schoolEmail").textContent = email;

  document.getElementById("portalUrl").textContent = portalUrl;
}

/* ==========================================
   COPY URL
========================================== */

function initCopyButton() {
  const button = document.getElementById("copyPortalUrl");

  if (!button) return;

  button.addEventListener("click", async () => {
    const url = document.getElementById("portalUrl").textContent;

    await navigator.clipboard.writeText(url);

    const original = button.innerHTML;

    button.innerHTML = '<i class="ri-check-line"></i> Copied';

    setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  });
}

/* ==========================================
   SHARE VIA EMAIL
========================================== */

function initEmailShare() {
  const button = document.getElementById("emailLink");

  if (!button) return;

  button.addEventListener("click", () => {
    const url = document.getElementById("portalUrl").textContent;

    const subject = encodeURIComponent("Our CBT School Portal");

    const body = encodeURIComponent(
      `Our CBT School portal is now active.\n\n${url}`,
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });
}

/* ==========================================
   SHARE VIA WHATSAPP
========================================== */

function initWhatsAppShare() {
  const button = document.getElementById("whatsappLink");

  if (!button) return;

  button.addEventListener("click", () => {
    const url = document.getElementById("portalUrl").textContent;

    const message = encodeURIComponent(
      `Our CBT School portal is now live.\n\n${url}`,
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  });
}
