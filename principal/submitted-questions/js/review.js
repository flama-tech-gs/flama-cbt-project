/* ==========================================
   QUESTION BANK PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeApproveButtons();
  initializeCorrectionButtons();
  initializeCommentButtons();
  initializePagination();
  initializeExamActions();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

/* ==========================================
   APPROVE QUESTION
========================================== */

function initializeApproveButtons() {
  const buttons = document.querySelectorAll(".approve-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".question-card");

      card.classList.remove("correction-card");

      button.innerHTML = `
                <i data-lucide="check-check"></i>
                Approved
            `;

      button.disabled = true;

      button.style.opacity = ".8";

      lucide.createIcons();

      // TODO:
      // approveQuestion(questionId)
    });
  });
}

/* ==========================================
   REQUEST CORRECTION
========================================== */

function initializeCorrectionButtons() {
  const buttons = document.querySelectorAll(".correction-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".question-card");

      const comment = prompt("Enter correction/comment for this question:");

      if (!comment) return;

      let commentBox = card.querySelector(".review-comment");

      if (!commentBox) {
        commentBox = document.createElement("div");

        commentBox.className = "review-comment";

        commentBox.innerHTML = `
                    <i data-lucide="message-circle-warning"></i>
                    <span></span>
                `;

        card.insertBefore(commentBox, card.querySelector(".question-actions"));
      }

      commentBox.querySelector("span").textContent = comment;

      card.classList.add("correction-card");

      lucide.createIcons();

      // TODO:
      // requestCorrection(questionId, comment)
    });
  });
}

/* ==========================================
   COMMENT BUTTON
========================================== */

function initializeCommentButtons() {
  const buttons = document.querySelectorAll(".comment-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const comment = prompt("Leave a comment for this question:");

      if (!comment) return;

      showToast("Comment saved.");

      // TODO:
      // saveComment(questionId, comment)
    });
  });
}

function showToast(message) {
  const existingToast = document.querySelector(".review-toast");

  existingToast?.remove();

  const toast = document.createElement("div");

  toast.className = "review-toast";
  toast.setAttribute("role", "status");
  toast.innerHTML = `<i data-lucide="check-circle-2"></i><span>${message}</span>`;

  document.body.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => toast.remove(), 220);
  }, 2200);
}

/* ==========================================
   PAGINATION
========================================== */

function initializePagination() {
  const pages = document.querySelectorAll(".pagination button:not(.next-page)");

  pages.forEach((page) => {
    page.addEventListener("click", () => {
      pages.forEach((btn) => btn.classList.remove("active"));

      page.classList.add("active");

      // TODO:
      // loadQuestionPage(page)
    });
  });

  const next = document.querySelector(".next-page");

  if (next) {
    next.addEventListener("click", () => {
      // TODO:
      // nextPage()

      console.log("Next page");
    });
  }
}

/* ==========================================
   APPROVE ENTIRE EXAM
========================================== */

function initializeExamActions() {
  const approveExam = document.querySelector(".approve-exam-btn");

  const sendBack = document.querySelector(".send-back-btn");

  approveExam.addEventListener("click", () => {
    const confirmed = confirm("Approve the entire Biology exam?");

    if (!confirmed) return;

    alert("Exam Approved Successfully.");

    // TODO:
    // approveEntireExam(examId)
  });

  sendBack.addEventListener("click", () => {
    const reason = prompt("Reason for sending this exam back:");

    if (!reason) return;

    alert("Exam returned to teacher.");

    // TODO:
    // sendBackForCorrection(examId, reason)
  });
}

/* ==========================================
   FUTURE API FUNCTIONS
========================================== */

function approveQuestion(id) {
  console.log(id);
}

function requestCorrection(id, comment) {
  console.log(id, comment);
}

function saveComment(id, comment) {
  console.log(id, comment);
}

function approveEntireExam(id) {
  console.log(id);
}

function sendBackForCorrection(id, reason) {
  console.log(id, reason);
}

// approve modal

const approveModal = document.getElementById("approveExamModal");

const confirmApprove = document.getElementById("confirmApproveExam");

const cancelApprove = document.getElementById("cancelApproveExam");

approveExam.addEventListener("click", () => {
  approveModal.classList.add("show");
});

cancelApprove.addEventListener("click", () => {
  approveModal.classList.remove("show");
});

approveModal.addEventListener("click", (e) => {
  if (e.target === approveModal) {
    approveModal.classList.remove("show");
  }
});

confirmApprove.addEventListener("click", () => {
  approveModal.classList.remove("show");

  // TODO:
  // approveEntireExam(examId);
});

// reject modal

/* ==========================================
SEND BACK MODAL
========================================== */

const sendBackModal = document.getElementById("sendBackModal");

const confirmSendBack = document.getElementById("confirmSendBack");

const cancelSendBack = document.getElementById("cancelSendBack");

const teacherSummary = document.getElementById("teacherSummary");

sendBack.addEventListener("click", () => {
  teacherSummary.value = "";

  sendBackModal.classList.add("show");
});

cancelSendBack.addEventListener("click", () => {
  sendBackModal.classList.remove("show");
});

sendBackModal.addEventListener("click", (e) => {
  if (e.target === sendBackModal) {
    sendBackModal.classList.remove("show");
  }
});

confirmSendBack.addEventListener("click", () => {
  const summary = teacherSummary.value.trim();

  if (!summary) {
    teacherSummary.focus();

    return;
  }

  sendBackModal.classList.remove("show");

  // TODO:
  // sendBackForCorrection(examId, summary);
});
