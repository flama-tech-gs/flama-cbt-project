/*
==========================================
SUMMARY CARDS
(REPLACE WITH API)
==========================================
*/

const stats = [
  {
    value: "1,247",
    title: "Total Students",
    color: "green",
  },

  {
    value: "58",
    title: "Total Teachers",
    color: "green",
  },

  {
    value: "18",
    title: "Total Classes",
    color: "green",
  },

  {
    value: "22",
    title: "Total Subjects",
    color: "green",
  },

  {
    value: "12",
    title: "Upcoming Exams",
    color: "green",
  },

  {
    value: "847",
    title: "Total Submitted Qs",
    color: "green",
  },

  {
    value: "612",
    title: "Approved Questions",
    color: "lime",
  },

  {
    value: "9",
    title: "Pending Review",
    color: "orange",
  },

  {
    value: "3",
    title: "Not Yet Submitted",
    color: "orange",
  },
];

/*
==========================================
QUESTIONS AWAITING APPROVAL
(REPLACE WITH API)
==========================================
*/

const pendingQuestions = [
  {
    subject: "Biology",
    class: "JSS 3B",
    teacher: "Mrs. Adebayo Folake",
    questions: 50,
    submitted: "Jun 16, 2026",
  },

  {
    subject: "Basic Science & Tech",
    class: "JSS 3B",
    teacher: "Mrs. Adebayo Folake",
    questions: 35,
    submitted: "Jun 12, 2026",
  },

  {
    subject: "Mathematics",
    class: "JSS 2A",
    teacher: "Mr. Chukwu Emeka",
    questions: 40,
    submitted: "Jun 14, 2026",
  },

  {
    subject: "Chemistry",
    class: "JSS 3A",
    teacher: "Mr. Ogunleye Tunde",
    questions: 45,
    submitted: "Jun 20, 2026",
  },

  {
    subject: "Physics",
    class: "JSS 2B",
    teacher: "Mrs. Okafor Joy",
    questions: 30,
    submitted: "Jun 18, 2026",
  },

  {
    subject: "English Language",
    class: "JSS 1A",
    teacher: "Mr. Adeyemi Kola",
    questions: 60,
    submitted: "Jun 22, 2026",
  },

  {
    subject: "History",
    class: "JSS 1B",
    teacher: "Mrs. Ige Sarah",
    questions: 55,
    submitted: "Jun 24, 2026",
  },

  {
    subject: "Geography",
    class: "JSS 2C",
    teacher: "Mr. Bamidele Ayo",
    questions: 50,
    submitted: "Jun 25, 2026",
  },

  {
    subject: "Literature",
    class: "JSS 3C",
    teacher: "Mrs. Nwankwo Chika",
    questions: 48,
    submitted: "Jun 27, 2026",
  },

  {
    subject: "Civics",
    class: "JSS 1C",
    teacher: "Mr. Ogunbiyi Tola",
    questions: 42,
    submitted: "Jun 28, 2026",
  },

  {
    subject: "Agricultural Science",
    class: "JSS 2A",
    teacher: "Mrs. Ogunleye Fola",
    questions: 38,
    submitted: "Jun 29, 2026",
  },

  {
    subject: "Computer Studies",
    class: "JSS 3A",
    teacher: "Mr. Nwodo Kingsley",
    questions: 55,
    submitted: "Jun 30, 2026",
  },

  {
    subject: "Music",
    class: "JSS 1B",
    teacher: "Mrs. Eze Chinyere",
    questions: 47,
    submitted: "Jul 01, 2026",
  },

  {
    subject: "Physical Education",
    class: "JSS 2C",
    teacher: "Mr. Okoro Victor",
    questions: 33,
    submitted: "Jul 02, 2026",
  },

  {
    subject: "French Language",
    class: "JSS 3B",
    teacher: "Mrs. Abiola Temitope",
    questions: 49,
    submitted: "Jul 03, 2026",
  },
];

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
  // "../review-questions/review.html";
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
