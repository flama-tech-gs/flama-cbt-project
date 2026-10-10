/* ==========================================
   DEPARTMENTS PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeDepartmentsPage();
});

function initializeDepartmentsPage() {
  initializeCreateDepartment();
  initializeEditDepartments();
  initializeSidebar();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

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
   CREATE DEPARTMENT
========================================== */

function initializeCreateDepartment() {
  const createButton = document.querySelector(".create-department-btn");

  if (!createButton) return;

  createButton.addEventListener("click", () => {
    // TODO:
    // Open Create Department Modal

    window.location.href = "./create.html";

    console.log("Create Department");
  });
}

/* ==========================================
   EDIT DEPARTMENT
========================================== */

function initializeEditDepartments() {
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".department-card");

      const departmentName = card.querySelector("h3").textContent;

      // TODO:
      // Open Edit Department Modal

      window.location.href = "./edit.html";

      console.log(`Edit ${departmentName}`);
    });
  });
}

/* ==========================================
   OPTIONAL FUNCTIONS
========================================== */

function addDepartment(department) {
  console.log("Add Department:", department);
}

function updateDepartment(id, data) {
  console.log("Update Department:", id, data);
}

function deleteDepartment(id) {
  console.log("Delete Department:", id);
}
