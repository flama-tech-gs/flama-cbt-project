/*
==========================================
THEORY DATA
(REPLACE WITH API)
==========================================
*/

const theoryData = [
  {
    subject: "Biology",

    classes: [
      {
        name: "JSS 3B",

        students: [
          {
            id: 1,
            name: "Adegbola Abiodun Odunyemi",
            accessCode: "JS/50/2024",
            session: "2025/2026",
            score: 58,
          },

          {
            id: 2,
            name: "Chukwu Ngozi Adaeze",
            accessCode: "JS/51/2024",
            session: "2025/2026",
            score: 49,
          },

          {
            id: 3,
            name: "Bello Tunde Ibrahim",
            accessCode: "JS/52/2024",
            session: "2025/2026",
            score: null,
          },

          {
            id: 4,
            name: "Okafor Chidinma Grace",
            accessCode: "JS/53/2024",
            session: "2025/2026",
            score: null,
          },

          {
            id: 5,
            name: "Adesanya Olawale",
            accessCode: "JS/54/2024",
            session: "2025/2026",
            score: 62,
          },

          {
            id: 6,
            name: "Fagbohun Richard",
            accessCode: "JS/55/2024",
            session: "2025/2026",
            score: 45,
          },

          {
            id: 7,
            name: "Ibrahim Amina",
            accessCode: "JS/56/2024",
            session: "2025/2026",
            score: 50,
          },

          {
            id: 8,
            name: "Emeka Chike",
            accessCode: "JS/57/2024",
            session: "2025/2026",
            score: null,
          },

          {
            id: 9,
            name: "Nwosu Ifeyinwa",
            accessCode: "JS/58/2024",
            session: "2025/2026",
            score: 39,
          },

          {
            id: 10,
            name: "Ogunleye Tayo",
            accessCode: "JS/59/2024",
            session: "2025/2026",
            score: 54,
          },

          {
            id: 11,
            name: "Kanu Adaobi",
            accessCode: "JS/60/2024",
            session: "2025/2026",
            score: null,
          },
        ],
      },

      {
        name: "JSS 1A",

        students: [],
      },
    ],
  },

  {
    subject: "Basic Science & Technology",

    classes: [
      {
        name: "JSS 2A",

        students: [],
      },
    ],
  },
];

/*
==========================================
RENDER
==========================================
*/

const container = document.getElementById("theoryContainer");

container.innerHTML = theoryData
  .map(
    (subject) => `

<div class="subject-card">

<div class="subject-header">

<div class="subject-title">

<h2>${subject.subject}</h2>

<span class="subject-count">

${subject.classes.length} classes

</span>

</div>

<i data-lucide="chevron-up"></i>

</div>

<div class="subject-body">

${subject.classes
  .map(
    (classroom) => `

<div class="class-card">

<div class="class-header">

<div class="class-title">

<h3>${classroom.name}</h3>

<span class="class-count">

${classroom.students.length} students

</span>

</div>

<i data-lucide="chevron-up"></i>

</div>

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>S/N</th>
<th>Student Name</th>
<th>Access Code</th>
<th>Session</th>
<th>Theory Score</th>
<th>Status</th>
<th>Actions</th>

</tr>

</thead>

<tbody>

${classroom.students
  .map(
    (student, index) => `

<tr>

<td>${index + 1}</td>

<td>${student.name}</td>

<td>

<span class="access-code">

${student.accessCode}

</span>

</td>

<td>${student.session}</td>

<td>

<input
class="score-input"
type="number"
min="0"
max="100"
value="${student.score ?? ""}"
placeholder="—">

</td>

<td>

<span class="status-dot ${student.score !== null ? "saved" : "pending"}">

</span>

</td>

<td>

<div class="action-links">

<button class="action-save">

Save

</button>

<button class="action-edit">

Edit

</button>

<button class="action-clear">

Clear

</button>

<button class="action-profile">

View Profile

</button>

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

`,
  )
  .join("")}

</div>

</div>

`,
  )
  .join("");

lucide.createIcons();

/*
==========================================
SAVE
==========================================
*/

document.querySelectorAll(".action-save").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("tr");

    row.querySelector(".status-dot").className = "status-dot saved";

    /*

Backend

PATCH

/api/theory-score

*/

    alert("Theory score saved.");
  });
});

/*
==========================================
CLEAR
==========================================
*/

document.querySelectorAll(".action-clear").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("tr");

    row.querySelector(".score-input").value = "";

    row.querySelector(".status-dot").className = "status-dot pending";
  });
});

/*
==========================================
EDIT
==========================================
*/

document.querySelectorAll(".action-edit").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.closest("tr").querySelector(".score-input");

    input.focus();
  });
});

/*
==========================================
VIEW PROFILE
==========================================
*/

document.querySelectorAll(".action-profile").forEach((button) => {
  button.addEventListener("click", () => {
    /*
Backend

window.location.href=
`../student-profile/student-profile.html?id=1`;

*/

    alert("Student profile page coming next.");
  });
});

/*
==========================================
SUBJECT ACCORDION
==========================================
*/

document.querySelectorAll(".subject-header").forEach((header) => {
  header.addEventListener("click", () => {
    const body = header.nextElementSibling;

    body.hidden = !body.hidden;

    header.querySelector("i").setAttribute(
      "data-lucide",

      body.hidden ? "chevron-down" : "chevron-up",
    );

    lucide.createIcons();
  });
});

/*
==========================================
CLASS ACCORDION
==========================================
*/

document.querySelectorAll(".class-header").forEach((header) => {
  header.addEventListener("click", () => {
    const table = header.nextElementSibling;

    table.hidden = !table.hidden;

    header.querySelector("i").setAttribute(
      "data-lucide",

      table.hidden ? "chevron-down" : "chevron-up",
    );

    lucide.createIcons();
  });
});
