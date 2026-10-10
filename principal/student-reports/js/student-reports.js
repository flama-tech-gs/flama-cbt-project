/*
==========================================
DATA
(Replace with API)
==========================================
*/

const reportData = [
  {
    class: "JSS 3B",
    students: 35,
    open: true,
    records: [
      {
        name: "Adegbola Abiodun Odunyemi",
        term: "2nd Term",
        year: "2025/2026",
        status: "Active",
      },

      {
        name: "Chukwu Ngozi Adaeze",
        term: "2nd Term",
        year: "2025/2026",
        status: "Active",
      },

      {
        name: "Bello Tunde Ibrahim",
        term: "2nd Term",
        year: "2025/2026",
        status: "Active",
      },

      {
        name: "Okafor Chidinma Grace",
        term: "2nd Term",
        year: "2025/2026",
        status: "Active",
      },
    ],
  },

  {
    class: "JSS 1A",
    students: 30,
    open: false,
    records: [],
  },

  {
    class: "JSS 1B",
    students: 28,
    open: false,
    records: [],
  },

  {
    class: "JSS 2A",
    students: 33,
    open: false,
    records: [],
  },

  {
    class: "JSS 3A",
    students: 31,
    open: false,
    records: [],
  },
];

/*
==========================================
RENDER
==========================================
*/

const container = document.getElementById("reportsAccordion");

container.innerHTML = reportData
  .map(
    (item, index) => `

<section class="report-section">

<div
class="report-header ${item.open ? "active" : ""}"
data-index="${index}">

<div class="report-header-left">

<h2>${item.class}</h2>

<span class="student-count">

${item.students} students

</span>

</div>

<i data-lucide="${item.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="report-body ${item.open ? "" : "hidden"}">

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>S/N</th>

<th>Student Name</th>

<th>Term</th>

<th>Year</th>

<th>Status</th>

<th>Action</th>

</tr>

</thead>

<tbody>

${item.records
  .map(
    (student, i) => `

<tr>

<td>${i + 1}</td>

<td>${student.name}</td>

<td>${student.term}</td>

<td>${student.year}</td>

<td>

<div class="status">

<span class="status-dot"></span>

${student.status}

</div>

</td>

<td>

<button class="report-btn">

View Full Report

</button>

</td>

</tr>

`,
  )
  .join("")}

</tbody>

</table>

</div>

</div>

</section>

`,
  )
  .join("");

/*
==========================================
ACCORDION
==========================================
*/

document.querySelectorAll(".report-header").forEach((header) => {
  header.addEventListener("click", () => {
    const body = header.nextElementSibling;

    body.classList.toggle("hidden");

    header.classList.toggle("active");

    const icon = header.querySelector("i");

    icon.setAttribute(
      "data-lucide",
      body.classList.contains("hidden") ? "chevron-down" : "chevron-up",
    );

    lucide.createIcons();
  });
});

/*
==========================================
VIEW REPORT
==========================================
*/

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".report-btn");

  if (!btn) return;

  window.location.href = "./student-report.html";

  // alert("Open Student Report");
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function closeSidebar() {
  sidebar?.classList.remove("show");
  sidebarOverlay?.classList.remove("show");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("show");

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
