/*
==========================================
DATA
==========================================
*/

const studentData = [
  {
    class: "JSS 1A",
    students: 15,
    open: true,

    records: [
      {
        name: "Adegbola Abiodun Odunyemi",
        code: "JS/50/2024",
        active: true,
      },

      {
        name: "Chukwu Ngozi Adaeze",
        code: "JS/51/2024",
        active: true,
      },

      {
        name: "Bello Tunde Ibrahim",
        code: "JS/52/2024",
        active: false,
      },

      {
        name: "Okafor Chidinma Grace",
        code: "JS/53/2024",
        active: true,
      },

      {
        name: "Johnson Peter",
        code: "JS/54/2024",
        active: true,
      },

      {
        name: "Smith Anne Marie",
        code: "JS/55/2024",
        active: true,
      },

      {
        name: "Davis Michael",
        code: "JS/56/2024",
        active: true,
      },

      {
        name: "Lopez Maria",
        code: "JS/57/2024",
        active: true,
      },

      {
        name: "Garcia Juan",
        code: "JS/58/2024",
        active: true,
      },

      {
        name: "Nguyen Emily",
        code: "JS/59/2024",
        active: true,
      },

      {
        name: "Smith John",
        code: "JS/60/2024",
        active: true,
      },

      {
        name: "Johnson Anna",
        code: "JS/61/2024",
        active: true,
      },
    ],
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
    class: "JSS 3B",
    students: 35,
    open: false,
    records: [],
  },
];

/*
==========================================
RENDER
==========================================
*/

const accordion = document.getElementById("studentsAccordion");

accordion.innerHTML = studentData
  .map(
    (item) => `

<section class="student-section">

<div class="class-header ${item.open ? "active" : ""}">

<div class="class-header-left">

<h2>${item.class}</h2>

<span class="student-count">

${item.students} students

</span>

</div>

<i data-lucide="${item.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="student-body ${item.open ? "" : "hidden"}">

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>S/N</th>
<th>Student Name</th>
<th>Access Code</th>
<th>Status</th>
<th>Actions</th>

</tr>

</thead>

<tbody>

${item.records
  .map(
    (student, index) => `

<tr>

<td>${index + 1}</td>

<td>${student.name}</td>

<td>

<span class="access-code">

${student.code}

</span>

</td>

<td>

<span class="status-dot ${student.active ? "active-dot" : "inactive-dot"}"></span>

</td>

<td>

<div class="actions">

<a class="action-link">View</a>

<a class="action-link">Promote</a>

<a class="action-link">Edit Profile</a>

<a class="action-link">Change Password</a>

${
  student.active
    ? `<a class="action-link action-danger">
Pause Account
</a>`
    : `<a class="action-link action-success">
Reactivate
</a>`
}

</div>

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
CLASS ACCORDION
==========================================
*/

document.querySelectorAll(".class-header").forEach((header) => {
  header.addEventListener("click", () => {
    header.classList.toggle("active");

    const body = header.nextElementSibling;

    body.classList.toggle("hidden");

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
BUTTON
==========================================
*/

document.getElementById("addStudentBtn").addEventListener("click", () => {
  window.location.href = "./add-student.html";

  // alert("Add Student");
});

const promoteAllButton = document.getElementById("promoteAllBtn");
const disablePromoteAllButton = document.getElementById("disablePromoteAllBtn");

promoteAllButton.addEventListener("click", () => {
  const confirmed = confirm("Promote all students to the next class?");

  if (!confirmed) return;

  alert("All students are queued for promotion.");
});

disablePromoteAllButton.addEventListener("click", () => {
  const isDisabled = promoteAllButton.disabled;

  promoteAllButton.disabled = !isDisabled;
  disablePromoteAllButton.textContent = isDisabled
    ? "Disable Promote All"
    : "Enable Promote All";
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();

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

/*
==========================================
RESET ACCESS CODE
==========================================
*/

const resetModal = document.getElementById("resetModal");

document.addEventListener("click", (e) => {
  const resetBtn = e.target.closest(".reset-access");

  if (resetBtn) {
    resetModal.classList.add("show");
  }
});

document.getElementById("closeReset").addEventListener("click", () => {
  resetModal.classList.remove("show");
});

document.getElementById("confirmReset").addEventListener("click", () => {
  alert("New access code generated.");

  resetModal.classList.remove("show");
});

resetModal.addEventListener("click", (e) => {
  if (e.target === resetModal) {
    resetModal.classList.remove("show");
  }
});
