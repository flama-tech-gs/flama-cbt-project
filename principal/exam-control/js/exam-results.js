/*
==========================================
RESULTS DATA
(Replace with API later)
==========================================
*/

const results = [
  {
    sn: 1,
    name: "Adegbola Abiodun Odunyemi",
    score: "47/50",
    percentage: "94%",
    grade: "A",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 2,
    name: "Chukwu Ngozi Adaeze",
    score: "40/50",
    percentage: "80%",
    grade: "B",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 3,
    name: "Bello Tunde Ibrahim",
    score: "35/50",
    percentage: "70%",
    grade: "C",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 4,
    name: "Okafor Chidinma Grace",
    score: "38/50",
    percentage: "76%",
    grade: "B",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 5,
    name: "Yusuf Aisha Mohammed",
    score: "28/50",
    percentage: "56%",
    grade: "D",
    status: "Passed",
    class: "warning",
  },

  {
    sn: 6,
    name: "Eze Kelechi David",
    score: "14/50",
    percentage: "28%",
    grade: "F",
    status: "Failed",
    class: "fail",
  },

  {
    sn: 7,
    name: "Williams Tamara Joy",
    score: "41/50",
    percentage: "82%",
    grade: "B",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 8,
    name: "Afolabi Babatunde Samuel",
    score: "33/50",
    percentage: "66%",
    grade: "C",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 9,
    name: "Musa Fatima Zainab",
    score: "44/50",
    percentage: "88%",
    grade: "A",
    status: "Passed",
    class: "pass",
  },

  {
    sn: 10,
    name: "Ibrahim Chuka Nnamdi",
    score: "—",
    percentage: "—",
    grade: "—",
    status: "Absent",
    class: "absent",
  },
];

/*
==========================================
RENDER TABLE
==========================================
*/

const table = document.getElementById("resultsTable");

results.forEach((student) => {
  table.innerHTML += `

<tr>

<td>${student.sn}</td>

<td>${student.name}</td>

<td>${student.score}</td>

<td>${student.percentage}</td>

<td>${student.grade}</td>

<td>

<span class="status ${student.class}">

${student.status}

</span>

</td>

</tr>

`;
});

/*
==========================================
DOWNLOAD CSV
==========================================
*/

document.querySelector(".download-btn").addEventListener("click", () => {
  alert("CSV download will be connected to the backend.");
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();
