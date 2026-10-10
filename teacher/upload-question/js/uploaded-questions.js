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
    <button class="class-tab ${index === 5 ? "active" : ""}">
        ${className}
    </button>
`,
  )
  .join("");

/*
==========================================
SAMPLE DATA
(REPLACE WITH API LATER)
==========================================
*/

const pendingExams = [
  {
    subject: "Biology",
    term: "2nd Term",
    session: "2025/2026",
    uploaded: "June 10, 2026",
    questions: 40,
    status: "Pending Approval",
  },

  {
    subject: "Basic Science & Tech",
    term: "2nd Term",
    session: "2025/2026",
    uploaded: "June 12, 2026",
    questions: 35,
    status: "Pending Approval",
  },
];

const activeExams = [
  {
    subject: "Biology",
    term: "1st Term",
    session: "2025/2026",
    uploaded: "Jan 15, 2026",
    questions: 40,
    status: "Active",
  },
];

const pastExams = [
  {
    subject: "Biology",
    term: "3rd Term",
    session: "2024/2025",
    uploaded: "Apr 20, 2025",
    questions: 50,
    status: "Completed",
  },

  {
    subject: "Basic Science & Tech",
    term: "3rd Term",
    session: "2024/2025",
    uploaded: "Apr 22, 2025",
    questions: 45,
    status: "Completed",
  },

  {
    subject: "Biology",
    term: "2nd Term",
    session: "2024/2025",
    uploaded: "Jan 10, 2025",
    questions: 40,
    status: "Completed",
  },
];

/*
==========================================
TABLE RENDERER
==========================================
*/

function renderTable(data, tbodyId, badgeClass) {
  const tbody = document.getElementById(tbodyId);

  if (!data.length) {
    tbody.innerHTML = '<tr><td class="empty-filter-state" colspan="6">No questions match this filter.</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map(
      (exam) => `

        <tr>

            <td>${exam.subject}</td>

            <td>${exam.term}</td>

            <td>${exam.session}</td>

            <td>${exam.uploaded}</td>

            <td>${exam.questions}</td>

            <td>

                <span class="badge ${badgeClass}">
                    ${exam.status}
                </span>

            </td>

        </tr>

    `,
    )
    .join("");
}

function renderAllTables(term = "all") {
  const filterByTerm = (exams) =>
    term === "all" ? exams : exams.filter((exam) => exam.term === term);

  renderTable(filterByTerm(pendingExams), "pendingBody", "pending");
  renderTable(filterByTerm(activeExams), "activeBody", "active");
  renderTable(filterByTerm(pastExams), "pastBody", "completed");
}

renderAllTables();

document.getElementById("termFilter").addEventListener("change", (event) => {
  renderAllTables(event.target.value);
});

/*
==========================================
ACCORDIONS
==========================================
*/

const accordions = document.querySelectorAll(".accordion-btn");

accordions.forEach((button) => {
  button.addEventListener("click", () => {
    const content = document.getElementById(button.dataset.target);

    const icon = button.querySelector("i");

    const isOpen = button.classList.contains("active");

    button.classList.toggle("active");

    if (isOpen) {
      content.style.display = "none";

      icon.setAttribute("data-lucide", "chevron-down");
    } else {
      content.style.display = "block";

      icon.setAttribute("data-lucide", "chevron-up");
    }

    lucide.createIcons();
  });
});

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
      `${tab.textContent.trim()} — Biology`;

    /*
        Later:

        fetchClassQuestions(tab.dataset.id)

        */
  });
});
