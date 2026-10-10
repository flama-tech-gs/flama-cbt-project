/* ==========================================
   PLATFORM ADMIN DASHBOARD
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});

/* ==========================================
   DASHBOARD INITIALIZATION
========================================== */

function initializeDashboard() {
  initializeSearch();

  initializeNotifications();

  initializeSchoolActions();

  initializeLogout();

  initializeRevenueChart();

  initializeResponsiveTable();
}

/* ==========================================
   GLOBAL SEARCH
========================================== */

function initializeSearch() {
  const searchInput = document.querySelector(".global-search input");

  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.trim().toLowerCase();

    filterDashboardContent(searchTerm);
  });
}

/* ==========================================
   SEARCH DASHBOARD CONTENT
========================================== */

function filterDashboardContent(searchTerm) {
  const schoolRows = document.querySelectorAll("#recentSchoolsTable tr");

  const ticketRows = document.querySelectorAll("#supportTicketsTable tr");

  schoolRows.forEach((row) => {
    const content = row.textContent.toLowerCase();

    row.style.display =
      !searchTerm || content.includes(searchTerm) ? "" : "none";
  });

  ticketRows.forEach((row) => {
    const content = row.textContent.toLowerCase();

    row.style.display =
      !searchTerm || content.includes(searchTerm) ? "" : "none";
  });
}

/* ==========================================
   NOTIFICATIONS
========================================== */

function initializeNotifications() {
  const notificationButton = document.querySelector(".notification-button");

  if (!notificationButton) return;

  notificationButton.addEventListener("click", () => {
    notificationButton.classList.toggle("notification-active");
  });
}

/* ==========================================
   SCHOOL ACTIONS
========================================== */

function initializeSchoolActions() {
  const suspendButtons = document.querySelectorAll(".action-suspend");

  const activateButtons = document.querySelectorAll(".action-activate");

  suspendButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      const schoolName = row
        ?.querySelector(".school-cell strong")
        ?.textContent.trim();

      if (!schoolName) return;

      const confirmed = window.confirm(`Suspend ${schoolName}?`);

      if (!confirmed) return;

      updateSchoolStatus(row, "Suspended");
    });
  });

  activateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      const schoolName = row
        ?.querySelector(".school-cell strong")
        ?.textContent.trim();

      if (!schoolName) return;

      const confirmed = window.confirm(`Activate ${schoolName}?`);

      if (!confirmed) return;

      updateSchoolStatus(row, "Active");
    });
  });
}

/* ==========================================
   UPDATE SCHOOL STATUS
========================================== */

function updateSchoolStatus(row, status) {
  if (!row) return;

  const statusCell = row.children[3];

  const actionCell = row.children[5];

  if (!statusCell || !actionCell) return;

  const statusBadge = statusCell.querySelector(".status-badge");

  if (!statusBadge) return;

  statusBadge.className = "status-badge";

  if (status === "Active") {
    statusBadge.classList.add("active");

    statusBadge.textContent = "Active";

    actionCell.innerHTML = `
            <div class="table-actions">

                <a
                    href="./school-details.html"
                    class="action-view"
                >
                    View
                </a>

                <button
                    type="button"
                    class="action-suspend"
                >
                    Suspend
                </button>

            </div>
        `;
  }

  if (status === "Suspended") {
    statusBadge.classList.add("suspended");

    statusBadge.textContent = "Suspended";

    actionCell.innerHTML = `
            <div class="table-actions">

                <a
                    href="./school-details.html"
                    class="action-view"
                >
                    View
                </a>

                <button
                    type="button"
                    class="action-activate"
                >
                    Activate
                </button>

            </div>
        `;
  }

  bindSchoolAction(actionCell.querySelector(".action-suspend"));

  bindSchoolAction(actionCell.querySelector(".action-activate"));
}

/* ==========================================
   REUSABLE SCHOOL ACTION BINDING
========================================== */

function bindSchoolAction(button) {
  if (!button) return;

  button.addEventListener("click", () => {
    const row = button.closest("tr");

    const schoolName = row
      ?.querySelector(".school-cell strong")
      ?.textContent.trim();

    if (!schoolName) return;

    if (button.classList.contains("action-suspend")) {
      const confirmed = window.confirm(`Suspend ${schoolName}?`);

      if (!confirmed) return;

      updateSchoolStatus(row, "Suspended");
    }

    if (button.classList.contains("action-activate")) {
      const confirmed = window.confirm(`Activate ${schoolName}?`);

      if (!confirmed) return;

      updateSchoolStatus(row, "Active");
    }
  });
}

/* ==========================================
   LOGOUT
========================================== */

function initializeLogout() {
  const logoutButton = document.querySelector(".logout-link");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) return;

    /*
     * Backend integration:
     *
     * await logoutUser();
     *
     * window.location.href =
     * "./login.html";
     */

    console.log("Platform administrator logged out.");
  });
}

/* ==========================================
   REVENUE CHART
========================================== */

function initializeRevenueChart() {
  const chart = document.getElementById("revenueChart");

  if (!chart) return;

  const bars = chart.querySelectorAll(".revenue-fill");

  bars.forEach((bar, index) => {
    const height = bar.style.height;

    bar.style.height = "0";

    window.setTimeout(
      () => {
        bar.style.height = height;
      },
      100 + index * 80,
    );
  });
}

/* ==========================================
   RESPONSIVE TABLE
========================================== */

function initializeResponsiveTable() {
  const tables = document.querySelectorAll(".table-wrapper table");

  tables.forEach((table) => {
    table.setAttribute("role", "table");
  });
}
