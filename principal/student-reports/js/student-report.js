/*
==========================================
DATA
(Replace with API)
==========================================
*/

const reports = [
  {
    term: "Current Report — 2nd Term, 2025/2026",
    average: "82%",
    subjects: 6,
    open: true,

    results: [
      {
        subject: "Biology",
        test: "23/30",
        exam: "63/70",
        total: "86/100",
        grade: "A",
      },

      {
        subject: "Mathematics",
        test: "18/30",
        exam: "50/70",
        total: "68/100",
        grade: "B",
      },

      {
        subject: "English Language",
        test: "20/30",
        exam: "55/70",
        total: "75/100",
        grade: "B",
      },

      {
        subject: "Chemistry",
        test: "25/30",
        exam: "60/70",
        total: "85/100",
        grade: "A",
      },

      {
        subject: "Physics",
        test: "15/30",
        exam: "45/70",
        total: "60/100",
        grade: "C",
      },

      {
        subject: "Basic Science & Tech",
        test: "27/30",
        exam: "65/70",
        total: "92/100",
        grade: "A",
      },
    ],
  },

  {
    term: "1st Term, 2025/2026",
    average: "78%",
    subjects: 6,
    open: false,
    results: [],
  },

  {
    term: "3rd Term, 2024/2025",
    average: "74%",
    subjects: 6,
    open: false,
    results: [],
  },

  {
    term: "2nd Term, 2024/2025",
    average: "71%",
    subjects: 6,
    open: false,
    results: [],
  },
];

/*
==========================================
GRADE
==========================================
*/

function gradeClass(grade) {
  switch (grade) {
    case "A":
      return "a";

    case "B":
      return "b";

    case "C":
      return "c";

    default:
      return "d";
  }
}

/*
==========================================
RENDER
==========================================
*/

const accordion = document.getElementById("reportAccordion");

accordion.innerHTML = reports
  .map(
    (report, index) => `

<section class="term-card">

<div
class="term-header ${report.open ? "active" : ""}"
data-index="${index}">

<div class="term-title">

<h2>${report.term}</h2>

<div class="term-average">

Overall Average:
${report.average}
• ${report.subjects} subjects

</div>

</div>

<i data-lucide="${report.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="term-body ${report.open ? "" : "hidden"}">

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>Subject</th>
<th>Test Score</th>
<th>Exam Score</th>
<th>Total</th>
<th>Grade</th>

</tr>

</thead>

<tbody>

${report.results
  .map(
    (subject) => `

<tr>

<td>${subject.subject}</td>

<td>${subject.test}</td>

<td>${subject.exam}</td>

<td>${subject.total}</td>

<td>

<div class="grade ${gradeClass(subject.grade)}">

${subject.grade}

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
ACCORDION
==========================================
*/

document.querySelectorAll(".term-header").forEach((header) => {
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
INIT
==========================================
*/

lucide.createIcons();
