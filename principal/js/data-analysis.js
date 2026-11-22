/*
==========================================
SUMMARY CARDS
(REPLACE WITH API)
==========================================
*/

const dashboardStats = [];

/*
==========================================
CLASS CHART
(REPLACE WITH API)
==========================================
*/

const classPerformance = [];

/*
==========================================
TABLE DATA
(REPLACE WITH API)
==========================================
*/

const subjectPerformance = [];

/*
==========================================
RENDER SUMMARY
==========================================
*/

document.getElementById("statsGrid").innerHTML = dashboardStats
  .map(
    (card) => `

<div class="stat-card ${card.color}">

<h2>${card.value}</h2>

<p>${card.title}</p>

</div>

`,
  )
  .join("");

/*
==========================================
RENDER CHART
==========================================
*/

document.getElementById("classChart").innerHTML = classPerformance
  .map(
    (item) => `

<div class="chart-item">

<span>${item.score}%</span>

<div
class="bar"
style="height:${item.score * 2.2}px">

</div>

<p>${item.class}</p>

</div>

`,
  )
  .join("");

/*
==========================================
TREND ICON
==========================================
*/

function trendIcon(type) {
  switch (type) {
    case "up":
      return `
<span class="trend up">

<i data-lucide="arrow-up"></i>

</span>
`;

    case "down":
      return `
<span class="trend down">

<i data-lucide="arrow-down"></i>

</span>
`;

    default:
      return `
<span class="trend flat">

<i data-lucide="arrow-right"></i>

</span>
`;
  }
}

/*
==========================================
TABLE
==========================================
*/

document.getElementById("performanceTable").innerHTML = subjectPerformance
  .map(
    (subject) => `

<tr>

<td>${subject.subject}</td>

<td>${subject.avg}%</td>

<td>${subject.pass}%</td>

<td>${subject.highest}%</td>

<td>${subject.lowest}%</td>

<td>

${trendIcon(subject.trend)}

</td>

</tr>

`,
  )
  .join("");

/*
==========================================
TERM BUTTONS
==========================================
*/

document.querySelectorAll(".term-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".term-tabs button")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    /*
Replace with API call
*/
  });
});

/*
==========================================
FILTERS
==========================================
*/

document.getElementById("classFilter").addEventListener("change", () => {
  /*
Replace with API
*/
});

document.getElementById("sessionFilter").addEventListener("change", () => {
  /*
Replace with API
*/
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
