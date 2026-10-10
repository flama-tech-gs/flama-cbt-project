/* ==========================================
   PLATFORM ADMIN — SCHOOLS
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeSchoolDirectory();
});

/* ==========================================
   INITIALIZE
========================================== */

function initializeSchoolDirectory() {
  initializeSchoolSearch();
  initializeSchoolFilters();
  initializeSchoolActions();
  initializeSchoolPagination();
  initializeSchoolExport();
  initializeAddSchool();
}

/* ==========================================
   SEARCH
========================================== */

function initializeSchoolSearch() {
  const searchInput = document.getElementById("schoolSearch");

  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.trim().toLowerCase();

    filterSchools(searchTerm);
  });
}

function filterSchools(searchTerm) {
  const rows = getSchoolRows();

  rows.forEach((row) => {
    const schoolName = row.dataset.school || "";

    const visible = schoolName.includes(searchTerm);

    row.dataset.searchVisible = visible ? "true" : "false";

    updateRowVisibility(row);
  });

  updateSchoolCount();
}

/* ==========================================
   STATUS FILTERS
========================================== */

function initializeSchoolFilters() {
  const filters = document.querySelectorAll(".school-filter");

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      filters.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });

      filter.classList.add("active");

      filter.setAttribute("aria-selected", "true");

      const selectedFilter = filter.dataset.filter;

      applyStatusFilter(selectedFilter);
    });
  });
}

function applyStatusFilter(selectedFilter) {
  const rows = getSchoolRows();

  rows.forEach((row) => {
    const status = row.dataset.status;

    const statusVisible = selectedFilter === "all" || status === selectedFilter;

    row.dataset.statusVisible = statusVisible ? "true" : "false";

    if (!row.dataset.searchVisible) {
      row.dataset.searchVisible = "true";
    }

    updateRowVisibility(row);
  });

  updateSchoolCount();
}

/* ==========================================
   ROW VISIBILITY
========================================== */

function updateRowVisibility(row) {
  const searchVisible = row.dataset.searchVisible !== "false";

  const statusVisible = row.dataset.statusVisible !== "false";

  row.style.display = searchVisible && statusVisible ? "" : "none";
}

/* ==========================================
   SCHOOL ACTIONS
========================================== */

function initializeSchoolActions() {
  document.addEventListener("click", (event) => {
    const actionButton = event.target.closest(".school-action");

    if (!actionButton) return;

    const row = actionButton.closest("tr");

    if (!row) return;

    const action = actionButton.dataset.action;

    const schoolName = row
      .querySelector(".school-name-cell strong")
      ?.textContent.trim();

    if (!schoolName) return;

    if (action === "suspend") {
      const confirmed = window.confirm(`Suspend ${schoolName}?`);

      if (!confirmed) return;

      changeSchoolStatus(row, "suspended");
    }

    if (action === "activate") {
      const confirmed = window.confirm(`Activate ${schoolName}?`);

      if (!confirmed) return;

      changeSchoolStatus(row, "active");
    }
  });
}

/* ==========================================
   CHANGE SCHOOL STATUS
========================================== */

function changeSchoolStatus(row, status) {
  const statusBadge = row.querySelector(".school-status");

  const actionButton = row.querySelector(".school-action");

  if (!statusBadge || !actionButton) return;

  statusBadge.className = "school-status";

  if (status === "active") {
    statusBadge.classList.add("active");
    statusBadge.textContent = "Active";

    actionButton.className = "school-action suspend";

    actionButton.dataset.action = "suspend";

    actionButton.textContent = "Suspend";

    row.dataset.status = "active";

    return;
  }

  if (status === "suspended") {
    statusBadge.classList.add("suspended");
    statusBadge.textContent = "Suspended";

    actionButton.className = "school-action activate";

    actionButton.dataset.action = "activate";

    actionButton.textContent = "Activate";

    row.dataset.status = "suspended";
  }
}

/* ==========================================
   PAGINATION
========================================== */

function initializeSchoolPagination() {
  const previousButton = document.getElementById("previousPage");

  const nextButton = document.getElementById("nextPage");

  if (!previousButton || !nextButton) {
    return;
  }

  previousButton.addEventListener("click", () => {
    if (previousButton.disabled) {
      return;
    }

    console.log("Previous schools page");
  });

  nextButton.addEventListener("click", () => {
    console.log("Next schools page");
  });
}

/* ==========================================
   EXPORT CSV
========================================== */

function initializeSchoolExport() {
  const exportButton = document.getElementById("exportSchoolsBtn");

  if (!exportButton) return;

  exportButton.addEventListener("click", exportSchoolsToCSV);
}

function exportSchoolsToCSV() {
  const rows = getSchoolRows();

  const headers = [
    "School",
    "Plan",
    "Students",
    "Teachers",
    "Status",
    "Joined",
  ];

  const csvRows = [headers.join(",")];

  rows.forEach((row) => {
    if (row.style.display === "none") {
      return;
    }

    const cells = row.querySelectorAll("td");

    if (cells.length < 6) return;

    const school = cells[0].querySelector("strong")?.textContent.trim() || "";

    const plan = cells[1].textContent.trim();

    const students = cells[2].textContent.trim();

    const teachers = cells[3].textContent.trim();

    const status = cells[4].textContent.trim();

    const joined = cells[5].textContent.trim();

    csvRows.push(
      [school, plan, students, teachers, status, joined]
        .map(csvEscape)
        .join(","),
    );
  });

  const csv = csvRows.join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "cbt-school-directory.csv";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

/* ==========================================
   CSV ESCAPE
========================================== */

function csvEscape(value) {
  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/* ==========================================
   ADD NEW SCHOOL
========================================== */

function initializeAddSchool() {
  const button = document.getElementById("addSchoolBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    window.location.href = "./add-school.html";
  });
}

/* ==========================================
   RESULT COUNT
========================================== */

function updateSchoolCount() {
  const countElement = document.getElementById("schoolsResultCount");

  if (!countElement) return;

  const rows = getSchoolRows();

  const visibleRows = Array.from(rows).filter(
    (row) => row.style.display !== "none",
  );

  if (visibleRows.length === 0) {
    countElement.textContent = "No schools found";

    showEmptyState();

    return;
  }

  removeEmptyState();

  countElement.textContent = `Showing 1–${visibleRows.length} of 128 schools`;
}

/* ==========================================
   EMPTY STATE
========================================== */

function showEmptyState() {
  const tbody = document.getElementById("schoolsTableBody");

  if (!tbody) return;

  if (tbody.querySelector(".schools-table-empty")) {
    return;
  }

  const row = document.createElement("tr");

  row.className = "schools-empty-row";

  row.innerHTML = `
    <td
      colspan="7"
      class="schools-table-empty"
    >
      No schools match your search or filter.
    </td>
  `;

  tbody.appendChild(row);
}

function removeEmptyState() {
  const emptyRow = document.querySelector(".schools-empty-row");

  emptyRow?.remove();
}

/* ==========================================
   HELPERS
========================================== */

function getSchoolRows() {
  return document.querySelectorAll(
    "#schoolsTableBody > tr:not(.schools-empty-row)",
  );
}
