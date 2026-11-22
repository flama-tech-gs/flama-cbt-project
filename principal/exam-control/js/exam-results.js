/*
==========================================
RESULTS DATA
(Replace with API later)
==========================================
*/

const results = [];

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
