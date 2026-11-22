/*
==========================================
DATA
(Replace with API)
==========================================
*/

const reports = [];

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
