/*
==========================================
NOTIFICATIONS DATA
(REPLACE WITH API)
==========================================
*/

const notifications = [
  {
    id: 1,
    type: "warning",
    title: "Biology (JSS 2A) sent back for correction",
    message:
      'Dr. Bankole Okonjo: "Question 12 has two correct options — please review and resubmit."',
    time: "Today, 2:14 PM",
    action: "Edit Question",
    url: "../edit-question/edit-question.html?question=12",
    unread: true,
  },

  {
    id: 2,
    type: "success",
    title: "Biology (JSS 1A) approved",
    message:
      "Dr. Bankole Okonjo approved your submission. It's now ready to be scheduled or pushed live.",
    time: "Today, 10:32 AM",
    action: "View Exam",
    url: "../question-bank/question-bank.html",
    unread: true,
  },

  {
    id: 3,
    type: "success",
    title: "Basic Science & Tech (JSS 3B) approved",
    message: "Dr. Bankole Okonjo approved your submission of 35 questions.",
    time: "Yesterday, 4:50 PM",
    action: "View Exam",
    url: "../question-bank/question-bank.html",
    unread: false,
  },

  {
    id: 4,
    type: "success",
    title: "Biology (JSS 3A) approved",
    message: "Dr. Bankole Okonjo approved your submission of 40 questions.",
    time: "Jun 14, 2026",
    action: "View Exam",
    url: "../question-bank/question-bank.html",
    unread: false,
  },
];

/*
==========================================
RENDER NOTIFICATIONS
==========================================
*/

const list = document.getElementById("notificationsList");

list.innerHTML = notifications
  .map(
    (item) => `

<div class="notification-card ${item.unread ? "unread" : ""}">

<div class="notification-icon ${item.type}">

<i data-lucide="${item.type === "success" ? "check" : "alert-circle"}"></i>

</div>

<div class="notification-content">

<div class="notification-title">

<h3>

${item.title}

</h3>

${item.unread ? `<span class="unread-dot"></span>` : ""}

</div>

<p class="notification-message">

${item.message}

</p>

<div class="notification-footer">

<span class="notification-time">

${item.time}

</span>

<a
href="${item.url}"
class="notification-link ${item.type}">

${item.action}

<i data-lucide="arrow-right"></i>

</a>

</div>

</div>

</div>

`,
  )
  .join("");

lucide.createIcons();

/*
==========================================
MARK AS READ
==========================================
*/

document.querySelectorAll(".notification-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.classList.remove("unread");

    const dot = card.querySelector(".unread-dot");

    if (dot) {
      dot.remove();
    }

    /*
Backend

PATCH

/api/notifications/read

*/
  });
});
