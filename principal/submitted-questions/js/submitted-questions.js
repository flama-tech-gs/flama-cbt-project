/* ==========================================
   SUBMITTED QUESTIONS PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeAccordions();
  initializeSearch();
  initializeFilters();
  initializeViewButtons();
  initializeSidebar();

  if (typeof lucide !== "undefined") lucide.createIcons();
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

function initializeAccordions() {
  document.querySelectorAll(".accordion-toggle").forEach((accordion) => {
    accordion.addEventListener("click", () => {
      const parent = accordion.parentElement;
      const content = accordion.nextElementSibling;
      const icon = accordion.querySelector("svg");

      if (!content || !icon) return;

      const isOpen = parent.classList.toggle("open");
      content.style.display = isOpen ? "block" : "none";
      icon.setAttribute("data-lucide", isOpen ? "chevron-up" : "chevron-down");
      lucide.createIcons();
    });
  });
}

function initializeSearch() {
  const searchInput = document.querySelector(".search-box input");

  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    const keyword = this.value.toLowerCase().trim();

    document.querySelectorAll("tbody tr").forEach((row) => {
      const subject = row.children[0].textContent.toLowerCase();
      const teacher = row.children[1].textContent.toLowerCase();

      row.style.display =
        subject.includes(keyword) || teacher.includes(keyword) ? "" : "none";
    });
  });
}

function initializeFilters() {
  const filterButton = document.querySelector(".apply-filter-btn");
  const classFilter = document.querySelector(".class-filter");

  if (!filterButton || !classFilter) return;

  filterButton.addEventListener("click", () => {
    const selectedClass = classFilter.value.trim().toLowerCase();

    document.querySelectorAll(".year-group").forEach((yearGroup) => {
      const classGroups = yearGroup.querySelectorAll(
        ":scope > .year-content > .class-group",
      );

      if (!classGroups.length) return;

      let hasMatch = false;

      classGroups.forEach((classGroup) => {
        const classTitle = classGroup
          .querySelector(".class-title")
          ?.textContent.trim()
          .toLowerCase();
        const matches =
          selectedClass === "all classes" || classTitle === selectedClass;

        classGroup.hidden = !matches;
        hasMatch ||= matches;
      });

      yearGroup.hidden = !hasMatch;
    });
  });
}

function initializeViewButtons() {
  document.querySelectorAll(".view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      console.log({
        subject: row.children[0].textContent.trim(),
        teacher: row.children[1].textContent.trim(),
      });

      window.location.href = "./review.html";
    });
  });
}

function expandAllYears() {
  document.querySelectorAll(".year-group").forEach((group) => {
    const content = group.querySelector(".year-content");

    if (content) {
      group.classList.add("open");
      content.style.display = "block";
    }
  });
}

function collapseAllYears() {
  document.querySelectorAll(".year-group").forEach((group) => {
    const content = group.querySelector(".year-content");

    if (content) {
      group.classList.remove("open");
      content.style.display = "none";
    }
  });
}
