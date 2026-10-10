/*
==========================================
CLASS TABS
==========================================
*/

const classes = ["JSS 1A", "JSS 1B", "JSS 2A", "JSS 2B", "JSS 3A", "JSS 3B"];

const classTabs = document.getElementById("classTabs");

classTabs.innerHTML = classes
  .map(
    (className, index) => `

<button
    class="class-tab ${index === 5 ? "active" : ""}"
    data-class-id="${index + 1}">

    ${className}

</button>

`,
  )
  .join("");

/*
==========================================
STUDENT SCORES
(REPLACE WITH API)
==========================================
*/

const studentScores = [
  {
    name: "Adegbola Abiodun Odunyemi",
    score: 36,
    total: 40,
  },

  {
    name: "Chukwu Ngozi Adaeze",
    score: 28,
    total: 40,
  },

  {
    name: "Bello Tunde Ibrahim",
    score: 32,
    total: 40,
  },

  {
    name: "Okafor Chidinma Grace",
    score: 38,
    total: 40,
  },

  {
    name: "Yusuf Aisha Mohammed",
    score: 24,
    total: 40,
  },

  {
    name: "Eze Kelechi David",
    score: 30,
    total: 40,
  },

  {
    name: "Williams Tamara Joy",
    score: 34,
    total: 40,
  },

  {
    name: "Afolabi Babatunde Samuel",
    score: 18,
    total: 40,
  },
];

/*
==========================================
GRADE CALCULATOR
==========================================
*/

function getGrade(percent) {
  if (percent >= 80) {
    return {
      grade: "A",
      remark: "Excellent",
      class: "a",
      remarkClass: "excellent",
    };
  }

  if (percent >= 70) {
    return {
      grade: "B",
      remark: "Good",
      class: "b",
      remarkClass: "good",
    };
  }

  if (percent >= 50) {
    return {
      grade: "C",
      remark: "Fair",
      class: "c",
      remarkClass: "fair",
    };
  }

  return {
    grade: "D",
    remark: "Poor",
    class: "d",
    remarkClass: "poor",
  };
}

/*
==========================================
RENDER TABLE
==========================================
*/

const tbody = document.getElementById("scoresTable");

tbody.innerHTML = studentScores
  .map((student, index) => {
    const percentage = Math.round((student.score / student.total) * 100);

    const result = getGrade(percentage);

    return `

<tr>

<td>

${index + 1}

</td>

<td>

${student.name}

</td>

<td>

${student.score} / ${student.total}

</td>

<td>

${percentage}%

</td>

<td>

<span class="grade ${result.class}">

${result.grade}

</span>

</td>

<td>

<span class="remark ${result.remarkClass}">

${result.remark}

</span>

</td>

</tr>

`;
  })
  .join("");

/*
==========================================
CLASS TAB CLICK
==========================================
*/

document.querySelectorAll(".class-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelector(".class-tab.active")?.classList.remove("active");

    tab.classList.add("active");

    document.querySelector(".page-heading h2").textContent =
      `${tab.textContent.trim()} – Result Sheet`;

    /*

Backend

fetch(
`/api/teacher/results?classId=${tab.dataset.classId}`
)

.then(...)

*/
  });
});

/*
==========================================
SUMMARY STATS
(BACKEND READY)
==========================================

const totalStudents =
studentScores.length;

const average =
studentScores.reduce(
(sum,s)=>sum+s.score,
0
) / totalStudents;

const highest =
Math.max(
...studentScores.map(s=>s.score)
);

const lowest =
Math.min(
...studentScores.map(s=>s.score)
);

These values can later populate the stat cards dynamically.
*/
