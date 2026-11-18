/*
==========================================
SUMMARY CARDS
(REPLACE WITH API)
==========================================
*/

const stats = [];

/*
==========================================
QUESTIONS AWAITING APPROVAL
(REPLACE WITH API)
==========================================
*/

const pendingQuestions = [];

/*
==========================================
RENDER STATS
==========================================
*/

const statsGrid = document.getElementById("statsGrid");

statsGrid.innerHTML = stats
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
RENDER TABLE
==========================================
*/

const table = document.getElementById("approvalTable");

table.innerHTML = pendingQuestions
  .map(
    (item) => `

<tr>

    <td>${item.subject}</td>

    <td>${item.class}</td>

    <td>${item.teacher}</td>

    <td>${item.questions}</td>

    <td>${item.submitted}</td>

    <td>

        <button
            class="review-btn"
            onclick="reviewSubmission('${item.subject}','${item.class}')">

            Review

        </button>

    </td>

</tr>

`,
  )
  .join("");

/*
==========================================
REVIEW
(REPLACE WITH ROUTE)
==========================================
*/

function reviewSubmission(subject, classroom) {
  console.log(subject, classroom);

  // Future route

  // window.location.href =
  // "../review-questions/review";
}

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
