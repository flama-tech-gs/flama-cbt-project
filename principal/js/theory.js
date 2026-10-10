/*
==========================================
DATA
==========================================
*/

const theoryData = [
  {
    class: "JSS 3B",
    subjects: 2,
    open: true,

    subjectList: [
      {
        subject: "Biology",
        teacher: "Mrs. Adebayo Folake",
        students: 2,
        open: true,

        records: [
          {
            name: "Adegbola Abiodun Odunyemi",
            code: "JS/50/2024",
            session: "2025/2026",
            score: 58,
          },

          {
            name: "Chukwu Ngozi Adaeze",
            code: "JS/51/2024",
            session: "2025/2026",
            score: 49,
          },
        ],
      },

      {
        subject: "Basic Science & Technology",
        teacher: "Mrs. Adebayo Folake",
        students: 35,
        open: false,
        records: [],
      },
    ],
  },

  {
    class: "JSS 1A",
    subjects: 4,
    open: false,
    subjectList: [],
  },
];

/*
==========================================
RENDER
==========================================
*/

const container = document.getElementById("theoryAccordion");

container.innerHTML = theoryData
  .map(
    (classItem, classIndex) => `

<section class="theory-section">

<div class="class-header ${classItem.open ? "active" : ""}">

<div class="class-header-left">

<h2>${classItem.class}</h2>

<span class="subject-count">

${classItem.subjects} subjects

</span>

</div>

<i data-lucide="${classItem.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="class-body ${classItem.open ? "" : "hidden"}">

${classItem.subjectList
  .map(
    (subject) => `

<div class="subject-card">

<div class="subject-header ${subject.open ? "active" : ""}">

<div class="subject-left">

<h3>${subject.subject}</h3>

<span class="teacher-name">

• ${subject.teacher}

</span>

<span class="student-total">

${subject.students} students

</span>

</div>

<i data-lucide="${subject.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="subject-body ${subject.open ? "" : "hidden"}">

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>S/N</th>
<th>Student Name</th>
<th>Access Code</th>
<th>Session</th>
<th>Theory Score</th>
<th>Action</th>

</tr>

</thead>

<tbody>

${subject.records
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

<td>${student.session}</td>

<td>

<span class="score">

${student.score}

</span>

</td>

<td>

<button class="profile-btn">

View Profile

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

</div>

`,
  )
  .join("")}

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
SUBJECT ACCORDION
==========================================
*/

document.querySelectorAll(".subject-header").forEach((header) => {
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
VIEW PROFILE
==========================================
*/

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".profile-btn");

  if (!btn) return;

  /*

window.location.href =
"student-profile.html";

*/

  alert("Open Student Profile");
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
