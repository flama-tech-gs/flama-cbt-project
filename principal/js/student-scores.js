/*
==========================================
DATA
(Replace with API)
==========================================
*/

const scores = [];

/*
==========================================
GRADE CLASS
==========================================
*/

function gradeClass(grade) {
  switch (grade) {
    case "A+":
      return "aplus";

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
RENDER TABLE
==========================================
*/

const table = document.getElementById("scoresTable");

table.innerHTML = scores
  .map(
    (student, index) => `

<tr>

<td>${index + 1}</td>

<td>${student.name}</td>

<td>${student.class}</td>

<td>${student.subject}</td>

<td class="score">${student.score}</td>

<td>${student.percentage}</td>

<td>

<span class="grade ${gradeClass(student.grade)}">

${student.grade}

</span>

</td>

</tr>

`,
  )
  .join("");

/*
==========================================
SEARCH
==========================================
*/

const searchInput = document.querySelector(".search-box input");

searchInput.addEventListener("keyup", (e) => {
  const value = e.target.value.toLowerCase();

  const rows = document.querySelectorAll("#scoresTable tr");

  rows.forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});

/*
==========================================
FILTER BUTTON
==========================================
*/

document.querySelector(".filter-btn").addEventListener("click", () => {
  // Replace with API filters

  console.log("Apply Filters");
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

// Reset the drawer when the viewport grows back to desktop width.
window.matchMedia("(max-width: 1024px)").addEventListener("change", (event) => {
  if (!event.matches) closeSidebar();
});
