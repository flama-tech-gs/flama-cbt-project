/*
==========================================
DATA
==========================================
*/

const submittedQuestions = [
  {
    subject: "Biology",
    class: "JSS 3B",
    term: "2nd Term",
    session: "2025/2026",
    questions: 40,
    status: "Pending Approval",
  },

  {
    subject: "Basic Science & Tech",
    class: "JSS 3B",
    term: "2nd Term",
    session: "2025/2026",
    questions: 35,
    status: "Pending Approval",
  },

  {
    subject: "Biology",
    class: "JSS 1A",
    term: "2nd Term",
    session: "2025/2026",
    questions: 40,
    status: "Active",
  },

  {
    subject: "Biology",
    class: "JSS 1B",
    term: "2nd Term",
    session: "2025/2026",
    questions: 40,
    status: "Active",
  },

  {
    subject: "Biology",
    class: "JSS 2A",
    term: "2nd Term",
    session: "2025/2026",
    questions: 38,
    status: "Needs Correction",
    review:
      "Reviewer note: Q12 has two correct options. Please review and resubmit.",
  },

  {
    subject: "Biology",
    class: "JSS 2B",
    term: "2nd Term",
    session: "2025/2026",
    questions: 40,
    status: "Active",
  },

  {
    subject: "Biology",
    class: "JSS 3A",
    term: "1st Term",
    session: "2025/2026",
    questions: 40,
    status: "Paused",
  },

  {
    subject: "Biology",
    class: "JSS 3B",
    term: "1st Term",
    session: "2025/2026",
    questions: 40,
    status: "Completed",
  },
];

/*
==========================================
STATUS CLASS
==========================================
*/

function getStatusClass(status) {
  switch (status) {
    case "Pending Approval":
      return "pending";

    case "Active":
      return "active";

    case "Needs Correction":
      return "correction";

    case "Paused":
      return "paused";

    default:
      return "completed";
  }
}

/*
==========================================
RENDER TABLE
==========================================
*/

const tbody = document.getElementById("submittedQuestionsBody");

tbody.innerHTML = submittedQuestions
  .map(
    (item) => `

<tr>

<td>

${item.subject}

${
  item.review
    ? `<span class="review-note">

${item.review}

</span>`
    : ""
}

</td>

<td>${item.class}</td>

<td>${item.term}</td>

<td>${item.session}</td>

<td>${item.questions}</td>

<td>

<span class="status-badge ${getStatusClass(item.status)}">

${item.status}

</span>

</td>

<td>

<button
class="edit-btn"
type="button">

Edit

</button>

</td>

</tr>

`,
  )
  .join("");

document.querySelectorAll(".edit-btn").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = "../edit-question/edit-question.html?question=1";
  });
});
