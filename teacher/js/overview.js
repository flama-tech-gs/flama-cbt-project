document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // Mobile Sidebar
  // ==========================

  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  function closeSidebar() {
    sidebar?.classList.remove("show");
    overlay?.classList.remove("show");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation");
  }

  menuToggle?.setAttribute("aria-expanded", "false");

  menuToggle?.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("show");

    overlay?.classList.toggle("show", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );
  });

  overlay?.addEventListener("click", closeSidebar);

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

  // ==========================
  // Dashboard Data
  // ==========================

  const dashboardData = {
    students: 191,

    classes: 6,

    subjects: 2,

    pending: 3,

    classList: [
      {
        class: "JSS 1A",
        subject: "Biology",
        students: 35,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 1B",
        subject: "Biology",
        students: 33,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },

      {
        class: "JSS 2A",
        subject: "Basic Science",
        students: 41,
        term: "First",
        session: "2026/2027",
      },
    ],
  };

  // ==========================
  // Update Statistics
  // ==========================

  document.getElementById("studentCount").textContent = dashboardData.students;

  document.getElementById("classCount").textContent = dashboardData.classes;

  document.getElementById("subjectCount").textContent = dashboardData.subjects;

  document.getElementById("pendingCount").textContent = dashboardData.pending;

  // ==========================
  // Populate Table
  // ==========================

  const table = document.getElementById("classesTable");

  table.innerHTML = dashboardData.classList
    .map(
      (item) => `

        <tr>

            <td>${item.class}</td>

            <td>${item.subject}</td>

            <td>${item.students}</td>

            <td>${item.term}</td>

            <td>${item.session}</td>

            <td>

                <button class="table-action" aria-label="View class details" title="View class details">

                    <i data-lucide="arrow-right"></i>

                </button>

            </td>

        </tr>

    `,
    )
    .join("");

  // Re-render Lucide icons
  lucide.createIcons();

  // ==========================
  // Logout
  // ==========================

  const logoutBtn = document.querySelector(".logout-btn");

  logoutBtn.addEventListener("click", () => {
    const confirmLogout = confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      localStorage.removeItem("teacherToken");

      window.location.href = "login.html";
    }
  });
});

document.getElementById("studentCount").textContent = dashboard.students;

document.getElementById("classCount").textContent = dashboard.classes;

document.getElementById("subjectCount").textContent = dashboard.subjects;

document.getElementById("pendingCount").textContent = dashboard.pending;

lucide.createIcons();
