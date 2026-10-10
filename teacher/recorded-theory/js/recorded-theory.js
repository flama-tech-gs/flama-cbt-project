/*
==========================================
RECORDED THEORY DATA
(REPLACE WITH API)
==========================================
*/

const recordedTheory = [
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
            name: "Fatima Al-Mansoori",
            accessCode: "JS/52/2024",
            session: "2025/2026",
            score: 72,
          },

          {
            id: 4,
            name: "Jamal Dandashi",
            accessCode: "JS/53/2024",
            session: "2025/2026",
            score: 63,
          },

          {
            id: 5,
            name: "Priya Gupta",
            accessCode: "JS/54/2024",
            session: "2025/2026",
            score: 55,
          },

          {
            id: 6,
            name: "Liam O'Connor",
            accessCode: "JS/55/2024",
            session: "2025/2026",
            score: 67,
          },

          {
            id: 7,
            name: "Sofia Chen",
            accessCode: "JS/56/2024",
            session: "2025/2026",
            score: 60,
          },

          {
            id: 8,
            name: "Zainab Mohammed",
            accessCode: "JS/57/2024",
            session: "2025/2026",
            score: 74,
          },

          {
            id: 9,
            name: "Ravi Kumar",
            accessCode: "JS/58/2024",
            session: "2025/2026",
            score: 66,
          },

          {
            id: 10,
            name: "Emily Martinez",
            accessCode: "JS/59/2024",
            session: "2025/2026",
            score: 50,
          },

          {
            id: 11,
            name: "Nia Johnson",
            accessCode: "JS/60/2024",
            session: "2025/2026",
            score: 80,
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

const container = document.getElementById("recordedTheoryContainer");

container.innerHTML = recordedTheory
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

${classroom.students.length} recorded

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
<th>Action</th>

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

<span class="score">

${student.score}

</span>

</td>

<td>

<a
href="../profile/profile.html?id=${student.id}"
class="profile-link">

View Profile

</a>

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

/*
==========================================
SUMMARY CARDS
==========================================
*/

const students = recordedTheory.flatMap((subject) =>
  subject.classes.flatMap((c) => c.students),
);

const totalStudents = students.length;

const marksRecorded = students.filter(
  (student) => student.score !== null,
).length;

const pendingEntry = totalStudents - marksRecorded;

const averageScore = marksRecorded
  ? Math.round(
      students
        .filter((student) => student.score !== null)
        .reduce((sum, student) => sum + student.score, 0) / marksRecorded,
    )
  : 0;

document.getElementById("totalStudents").textContent = totalStudents;

document.getElementById("marksRecorded").textContent = marksRecorded;

document.getElementById("pendingEntry").textContent = pendingEntry;

document.getElementById("averageScore").textContent = averageScore;

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

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();
