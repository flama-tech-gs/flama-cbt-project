/* ==========================================
   PRINCIPAL PROFILE PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeNoticeButton();

  initializeDepartmentRows();
  initializeSidebar();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

function initializeSidebar() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("principalSidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function closeSidebar() {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation");
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.toggle("show") ?? false;
    sidebarOverlay?.classList.toggle("show", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );
  });

  sidebarOverlay?.addEventListener("click", closeSidebar);
  sidebar?.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", closeSidebar);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  // Reset the drawer when the viewport grows back to desktop width.
  window.matchMedia("(max-width: 1024px)").addEventListener("change", (event) => {
    if (!event.matches) closeSidebar();
  });
}

/* ==========================================
   NOTICE BUTTON
========================================== */

function initializeNoticeButton() {
  const noticeButton = document.querySelector(".notice-icon");

  if (!noticeButton) return;

  noticeButton.addEventListener("click", () => {
    // Return to previous page

    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "./overview.html";
    }
  });
}

/* ==========================================
   DEPARTMENT TABLE
========================================== */

function initializeDepartmentRows() {
  const rows = document.querySelectorAll("tbody tr");

  rows.forEach((row) => {
    row.style.cursor = "pointer";

    row.addEventListener("mouseenter", () => {
      row.classList.add("row-hover");
    });

    row.addEventListener("mouseleave", () => {
      row.classList.remove("row-hover");
    });

    row.addEventListener("click", () => {
      const department = row.children[0].textContent.trim();

      console.log("Department:", department);

      // =====================================
      // TODO
      // Navigate to department details
      //
      // window.location.href =
      // `edit-department.html?id=department-id`;
      // =====================================
    });
  });
}

/* ==========================================
   FUTURE PROFILE FUNCTIONS
========================================== */

function loadPrincipalProfile() {
  // Fetch principal details
}

function loadSchoolStatistics() {
  // Fetch dashboard statistics
}

function loadDepartments() {
  // Fetch departments list
}
