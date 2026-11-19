//backend/principalQuestionsReview.js


(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");
  const ROOT = `${API_BASE}/principal/submitted-questions`;
  const token = sessionStorage.getItem("principalAccessToken");

  const mainContainer = document.querySelector(".main-container");
  const params = new URLSearchParams(window.location.search);
  const questionIds = (params.get("questionIds") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const PAGE_SIZE = 10;

  let questions = [];
  let currentPage = 1;
  let reviewInProgress = false;
  let pendingQuestion = null;

  if (!mainContainer) {
    console.error("Review integration: .main-container was not found.");
    return;
  }

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function findNestedValue(root, key, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(root, key)) {
      return root[key];
    }

    for (const value of Object.values(root)) {
      if (value && typeof value === "object") {
        const found = findNestedValue(value, key, depth + 1);
        if (found !== undefined) return found;
      }
    }

    return undefined;
  }

  function findArray(root, key, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return null;
    }

    if (Array.isArray(root[key])) return root[key];

    const values = Array.isArray(root) ? root : Object.values(root);

    for (const value of values) {
      if (value && typeof value === "object") {
        const found = findArray(value, key, depth + 1);
        if (found !== null) return found;
      }
    }

    return null;
  }

  function getImageUrl(value) {
    if (typeof value === "string") return value;
    if (value && typeof value.url === "string") return value.url;
    return "";
  }

  async function api(url, options = {}) {
    const requestUrl = new URL(url);

    if (!options.method || options.method.toUpperCase() === "GET") {
      requestUrl.searchParams.set("_requestTime", String(Date.now()));
    }

    const response = await fetch(requestUrl.toString(), {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    if (response.status === 304) {
      throw new Error(
        "The server returned 304 without a response body. Restart the backend and reload the page."
      );
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Request failed (${response.status})`
      );
    }

    return body;
  }

  function applyBranding(profileResponse) {
    const school =
      profileResponse?.school ||
      profileResponse?.schoolProfile ||
      findNestedValue(profileResponse, "school") ||
      findNestedValue(profileResponse, "schoolProfile");

    const principal =
      profileResponse?.principal ||
      profileResponse?.principalProfile ||
      profileResponse?.user ||
      findNestedValue(profileResponse, "principal") ||
      findNestedValue(profileResponse, "principalProfile") ||
      findNestedValue(profileResponse, "user");

    const schoolName =
      school?.name ||
      findNestedValue(profileResponse, "schoolName") ||
      "";

    const schoolLogo =
      getImageUrl(school?.logo) ||
      getImageUrl(school?.logoUrl) ||
      getImageUrl(school?.images?.[0]);

    const principalName =
      principal?.fullName ||
      [
        principal?.title,
        principal?.firstName,
        principal?.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      findNestedValue(profileResponse, "principalName") ||
      "";

    const principalImage =
      getImageUrl(principal?.avatar) ||
      getImageUrl(principal?.profilePicture) ||
      getImageUrl(principal?.image);

    const schoolNameElement =
      document.querySelector(".logo-area h2");
    const schoolLogoElement =
      document.querySelector(".logo-area img");
    const principalNameElement =
      document.querySelector(
        ".principal-profile .principal-details h4"
      );
    const principalImageElement =
      document.querySelector(
        ".principal-profile .principal-avatar img"
      );

    if (schoolNameElement && schoolName) {
      schoolNameElement.textContent = schoolName;
    }

    if (schoolLogoElement && schoolLogo) {
      schoolLogoElement.src = schoolLogo;
      schoolLogoElement.alt = `${schoolName || "School"} logo`;
    }

    if (principalNameElement && principalName) {
      principalNameElement.textContent = principalName;
    }

    if (principalImageElement && principalImage) {
      principalImageElement.src = principalImage;
      principalImageElement.alt = principalName || "Principal";
    }
  }

  async function loadBranding() {
    if (!token) return;

    try {
      const profile = await api(`${API_BASE}/principal/profile`);
      applyBranding(profile);
    } catch (error) {
      console.error("Could not load school/principal profile:", error);
    }
  }

  function getOffering(question) {
    return question.subjectOffering || {};
  }

  function getSubjectName(question) {
    return getOffering(question).subject?.name || "Unknown subject";
  }

  function getClassName(question) {
    return getOffering(question).class?.name || "Unknown class";
  }

  function getTeacherName(question) {
    const teacher = question.submittedBy;
    if (!teacher) return "Unknown teacher";

    return (
      teacher.fullName ||
      [
        teacher.title,
        teacher.firstName,
        teacher.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Unknown teacher"
    );
  }

  function formatTerm(value) {
    const names = {
      FIRST_TERM: "1st Term",
      SECOND_TERM: "2nd Term",
      THIRD_TERM: "3rd Term",
    };

    return names[value] || value || "Term not recorded";
  }

  function getReviewStatus() {
    if (
      questions.length > 0 &&
      questions.every(
        (question) => question.reviewStatus === "APPROVED"
      )
    ) {
      return "Approved";
    }

    if (
      questions.some(
        (question) => question.reviewStatus === "REJECTED"
      )
    ) {
      return "Rejected";
    }

    return "Pending Approval";
  }

  function setSummaryItem(index, value, className = "") {
    const item = document.querySelectorAll(
      ".exam-summary .summary-item"
    )[index];

    if (!item) return;

    const element =
      item.querySelector("strong") ||
      item.querySelector(".status") ||
      item.lastElementChild;

    if (!element) return;

    element.textContent = value;
    if (className) element.className = className;
  }

  function updateSummaryAndTotals() {
    const total = questions.length;
    const first = questions[0];

    if (first) {
      const status = getReviewStatus();
      const statusClass =
        status === "Approved"
          ? "approved"
          : status === "Rejected"
            ? "rejected"
            : "pending";

      setSummaryItem(0, getSubjectName(first));
      setSummaryItem(1, getClassName(first));
      setSummaryItem(2, getTeacherName(first));
      setSummaryItem(3, formatTerm(first.term?.name));
      setSummaryItem(4, String(total));
      setSummaryItem(5, status, `status ${statusClass}`);

      const pageTitle = document.querySelector(
        ".page-header .page-title h1"
      );

      if (pageTitle) {
        pageTitle.textContent =
          `${getSubjectName(first)} – Question Review`;
      }
    } else {
      setSummaryItem(4, "0");
      setSummaryItem(5, "No questions", "status");
    }

    const sectionTitle =
      mainContainer.querySelector(".section-title");

    if (sectionTitle) {
      sectionTitle.textContent = `All Questions (${total})`;
    }

    const footerHeading =
      document.querySelector(".approval-bar h4");

    if (footerHeading) {
      footerHeading.textContent =
        `Finished reviewing all ${total} questions?`;
    }

    const approveTitle =
      document.querySelector("#approveExamModal h2");

    if (approveTitle) {
      approveTitle.textContent = `Approve all ${total} questions?`;
    }

    const sendBackTitle =
      document.querySelector("#sendBackModal h2");

    if (sendBackTitle) {
      sendBackTitle.textContent =
        `Send back all ${total} questions?`;
    }

    if (!first) return;

    const approveModalText =
      document.querySelector("#approveExamModal .modal-text");

    if (approveModalText) {
      approveModalText.textContent =
        `Approve all ${total} questions for ` +
        `${getSubjectName(first)} in ${getClassName(first)}?`;
    }

    const approveInfo = document.querySelectorAll(
      "#approveExamModal .exam-info .info-row strong"
    );

    [
      getSubjectName(first),
      getClassName(first),
      getTeacherName(first),
      `${total} of ${total}`,
    ].forEach((value, index) => {
      if (approveInfo[index]) approveInfo[index].textContent = value;
    });

    const sendBackInfo = document.querySelectorAll(
      "#sendBackModal .exam-info .info-row strong"
    );

    [
      getSubjectName(first),
      getClassName(first),
      `0 of ${total}`,
    ].forEach((value, index) => {
      if (sendBackInfo[index]) {
        sendBackInfo[index].textContent = value;
      }
    });
  }

  function getQuestionOptions(question) {
    if (Array.isArray(question.options) && question.options.length) {
      return question.options;
    }

    if (question.questionType === "TRUE_FALSE") {
      return [
        { key: "TRUE", text: "True" },
        { key: "FALSE", text: "False" },
      ];
    }

    return [];
  }

  function isCorrectOption(option, correctAnswer) {
    return (
      String(option.key).toUpperCase() ===
        String(correctAnswer).toUpperCase() ||
      String(option.text).trim().toLowerCase() ===
        String(correctAnswer).trim().toLowerCase()
    );
  }

  function renderQuestions() {
    const paginationWrapper =
      mainContainer.querySelector(".pagination-wrapper");

    let questionList = mainContainer.querySelector(
      ".question-list-integration"
    );

    if (!questionList) {
      questionList = document.createElement("div");
      questionList.className = "question-list-integration";

      if (paginationWrapper) {
        mainContainer.insertBefore(
          questionList,
          paginationWrapper
        );
      } else {
        mainContainer.appendChild(questionList);
      }
    }

    // Remove the static demo cards from the HTML.
    mainContainer
      .querySelectorAll(".question-card")
      .forEach((card) => card.remove());

    const totalPages = Math.max(
      1,
      Math.ceil(questions.length / PAGE_SIZE)
    );

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageQuestions = questions.slice(
      start,
      start + PAGE_SIZE
    );

    questionList.innerHTML = pageQuestions
      .map((question, pageIndex) => {
        const number = start + pageIndex + 1;
        const options = getQuestionOptions(question);
        const correctAnswer = question.correctAnswer || "";

        const optionsHtml = options
          .map((option) => {
            const correct = isCorrectOption(
              option,
              correctAnswer
            );

            return `
              <div class="option ${correct ? "correct" : ""}">
                <span>${escapeHtml(option.key || "")}</span>
                ${escapeHtml(option.text || "")}
              </div>
            `;
          })
          .join("");

        const explanationHtml = question.explanation
          ? `
            <div class="review-comment">
              <strong>Explanation:</strong>
              <span>${escapeHtml(question.explanation)}</span>
            </div>
          `
          : "";

        const reviewNote = question.reviewComment || question.rejectionReason;
        const rejectionHtml = reviewNote
          ? `
            <div class="review-comment">
              <span>${escapeHtml(reviewNote)}</span>
            </div>
          `
          : "";

        return `
          <article
            class="question-card"
            data-question-id="${escapeHtml(question._id)}"
          >
            <div class="question-header">
              <div class="question-number">${number}</div>
              <h3>${escapeHtml(question.questionText || "")}</h3>

              <button
                type="button"
                class="comment-btn"
                data-action="comment"
                data-id="${escapeHtml(question._id)}"
              >
                <i data-lucide="message-circle"></i>
                Comment
              </button>
            </div>

            <div class="options-grid">
              ${optionsHtml}
            </div>

            ${explanationHtml}
            ${rejectionHtml}

            <div class="question-actions">
              <button
                type="button"
                class="approve-btn"
                data-action="approve-one"
                data-id="${escapeHtml(question._id)}"
              >
                <i data-lucide="check"></i>
                Approve
              </button>

              <button
                type="button"
                class="correction-btn"
                data-action="reject-one"
                data-id="${escapeHtml(question._id)}"
              >Make Correction</button>
            </div>
          </article>
        `;
      })
      .join("");

    renderPagination(totalPages, start, pageQuestions.length);

    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  }

  function renderPagination(totalPages, start, visibleCount) {
    const wrapper =
      mainContainer.querySelector(".pagination-wrapper");

    if (!wrapper) return;

    const summary = wrapper.querySelector(":scope > span");

    if (summary) {
      const first = questions.length ? start + 1 : 0;
      const last = start + visibleCount;

      summary.textContent =
        `Showing ${first}–${last} of ${questions.length} questions`;
    }

    let pagination = wrapper.querySelector(".pagination");

    if (!pagination) {
      pagination = document.createElement("div");
      pagination.className = "pagination";
      wrapper.appendChild(pagination);
    }

    const buttons = [];

    if (currentPage > 1) {
      buttons.push(`
        <button type="button" data-page="${currentPage - 1}">
          Previous
        </button>
      `);
    }

    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(`
        <button
          type="button"
          data-page="${page}"
          class="${page === currentPage ? "active" : ""}"
          ${page === currentPage ? 'aria-current="page"' : ""}
        >${page}</button>
      `);
    }

    if (currentPage < totalPages) {
      buttons.push(`
        <button
          type="button"
          class="next-page"
          data-page="${currentPage + 1}"
        >
          Next <i data-lucide="arrow-right"></i>
        </button>
      `);
    }

    pagination.innerHTML = buttons.join("");

    pagination.onclick = (event) => {
      const button = event.target.closest("button[data-page]");
      if (!button) return;

      const page = Number(button.dataset.page);
      if (!Number.isInteger(page)) return;

      currentPage = page;
      renderQuestions();

      mainContainer
        .querySelector(".question-list-integration")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    };
  }

  function showMessage(message, className = "") {
    let messageElement = mainContainer.querySelector(
      ".review-integration-message"
    );

    if (!messageElement) {
      messageElement = document.createElement("p");
      messageElement.className = "review-integration-message";
      mainContainer.prepend(messageElement);
    }

    messageElement.className =
      `review-integration-message ${className}`.trim();
    messageElement.textContent = message;
  }

  function hideMessage() {
    mainContainer
      .querySelector(".review-integration-message")
      ?.remove();
  }

  function showModal(modal) {
    if (!modal) return;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function hideModal(modal) {
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  function setQuestionActionDetails(question) {
    const questionNumber = questions.indexOf(question) + 1;
    const details = {
      approveQuestionSubject: getSubjectName(question),
      approveQuestionClass: getClassName(question),
      approveQuestionTeacher: getTeacherName(question),
      approveQuestionNumber: `${questionNumber} of ${questions.length}`,
      correctQuestionSubject: getSubjectName(question),
      correctQuestionClass: getClassName(question),
      correctQuestionNumber: `${questionNumber} of ${questions.length}`,
    };

    Object.entries(details).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  async function loadQuestions({ showLoading = true } = {}) {
    if (!token) {
      showMessage(
        "Your principal session has expired. Please sign in again.",
        "error"
      );
      return;
    }

    if (questionIds.length === 0) {
      showMessage(
        "No question IDs were provided. Return to Submitted Questions and select a submission."
      );
      return;
    }

    if (showLoading) showMessage("Loading questions…");

    try {
      const url = new URL(`${ROOT}/questions`);
      url.searchParams.set("questionIds", questionIds.join(","));

      const response = await api(url.toString());
      const loadedQuestions = findArray(response, "questions");

      questions = Array.isArray(loadedQuestions)
        ? loadedQuestions
        : [];

      hideMessage();
      currentPage = 1;
      updateSummaryAndTotals();
      renderQuestions();

      if (questions.length === 0) {
        showMessage("No questions were found for this submission.");
      }
    } catch (error) {
      console.error("Could not load review questions:", error);
      showMessage(
        error.message || "Could not load questions for review.",
        "error"
      );
    }
  }

  async function reviewQuestions(
    ids,
    reviewStatus,
    rejectionReason = "",
    action = "REVIEW"
  ) {
    if (reviewInProgress || ids.length === 0) return;

    reviewInProgress = true;
    hideMessage();

    try {
      await api(`${ROOT}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          questionIds: ids,
          action,
          reviewStatus,
          rejectionReason,
          comment: action === "COMMENT" ? rejectionReason : undefined,
        }),
      });
      await loadQuestions({ showLoading: false });
      const message = action === "COMMENT"
        ? "Comment saved successfully."
        : reviewStatus === "APPROVED"
          ? "Question(s) approved successfully."
          : "Question(s) sent back for correction.";
      showMessage(message, "success");
    } catch (error) {
      console.error("Could not update question review:", error);
      showMessage(
        error.message || "Could not update the question review.",
        "error"
      );
    } finally {
      reviewInProgress = false;
    }
  }

  function connectControls() {
    mainContainer.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const id = button.dataset.id;
      const question = questions.find(
        (item) => String(item._id) === String(id)
      );

      if (!question) return;

      if (button.dataset.action === "approve-one") {
        pendingQuestion = question;
        setQuestionActionDetails(question);
        showModal(document.getElementById("approveQuestionModal"));
        return;
      }

      if (
        button.dataset.action === "reject-one" ||
        button.dataset.action === "comment"
      ) {
        pendingQuestion = question;
        pendingQuestion.reviewAction = button.dataset.action === "comment" ? "COMMENT" : "REVIEW";
        setQuestionActionDetails(question);
        const commentInput = document.getElementById("questionCorrectionComment");
        const commentError = document.getElementById("correctionCommentError");
        const correctionModal = document.getElementById("correctQuestionModal");
        const title = document.getElementById("correctQuestionTitle");
        const description = correctionModal?.querySelector(".modal-text");
        const confirmButton = document.getElementById("confirmCorrectQuestion");
        const isComment = pendingQuestion.reviewAction === "COMMENT";
        if (title) title.textContent = isComment ? "Comment on this question" : "Send back for correction?";
        if (description) description.textContent = isComment
          ? "Save a note for the teacher without changing this question’s approval status."
          : "The teacher will be asked to correct this question before resubmitting.";
        if (confirmButton) confirmButton.textContent = isComment ? "Save Comment" : "Send Back for Correction";
        if (commentInput) commentInput.value = question.reviewComment || question.rejectionReason || "";
        if (commentError) commentError.hidden = true;
        showModal(correctionModal);
      }
    });

    const approveQuestionModal = document.getElementById("approveQuestionModal");
    const correctQuestionModal = document.getElementById("correctQuestionModal");

    document
      .getElementById("confirmApproveQuestion")
      ?.addEventListener("click", async () => {
        if (!pendingQuestion || reviewInProgress) return;
        const questionId = String(pendingQuestion._id);
        hideModal(approveQuestionModal);
        pendingQuestion = null;
        await reviewQuestions([questionId], "APPROVED");
      });

    document
      .getElementById("cancelApproveQuestion")
      ?.addEventListener("click", () => {
        hideModal(approveQuestionModal);
        pendingQuestion = null;
      });

    document
      .getElementById("confirmCorrectQuestion")
      ?.addEventListener("click", async () => {
        if (!pendingQuestion || reviewInProgress) return;

        const commentInput = document.getElementById("questionCorrectionComment");
        const commentError = document.getElementById("correctionCommentError");
        const comment = commentInput?.value.trim() || "";
        if (!comment) {
          if (commentError) commentError.hidden = false;
          commentInput?.focus();
          return;
        }

        const questionId = String(pendingQuestion._id);
        const action = pendingQuestion.reviewAction || "REVIEW";
        hideModal(correctQuestionModal);
        pendingQuestion = null;
        await reviewQuestions(
          [questionId],
          action === "COMMENT" ? "PENDING" : "REJECTED",
          comment,
          action
        );
      });

    document
      .getElementById("cancelCorrectQuestion")
      ?.addEventListener("click", () => {
        hideModal(correctQuestionModal);
        pendingQuestion = null;
      });

    const approveModal =
      document.getElementById("approveExamModal");
    const sendBackModal =
      document.getElementById("sendBackModal");

    document
      .querySelector(".approve-exam-btn")
      ?.addEventListener("click", () => {
        showModal(approveModal);
      });

    document
      .querySelector(".send-back-btn")
      ?.addEventListener("click", () => {
        showModal(sendBackModal);
      });

    document
      .getElementById("confirmApproveExam")
      ?.addEventListener("click", async () => {
        hideModal(approveModal);

        await reviewQuestions(
          questions.map((question) => String(question._id)),
          "APPROVED"
        );
      });

    document
      .getElementById("cancelApproveExam")
      ?.addEventListener("click", () => {
        hideModal(approveModal);
      });

    document
      .getElementById("confirmSendBack")
      ?.addEventListener("click", async () => {
        const summary =
          document.getElementById("teacherSummary")?.value || "";

        const summaryError = document.getElementById("teacherSummaryError");
        if (!summary.trim()) {
          if (summaryError) {
            summaryError.textContent = "Enter a summary comment before sending questions back.";
            summaryError.hidden = false;
          }
          document.getElementById("teacherSummary")?.focus();
          return;
        }

        if (summaryError) summaryError.hidden = true;

        hideModal(sendBackModal);

        await reviewQuestions(
          questions.map((question) => String(question._id)),
          "REJECTED",
          summary.trim()
        );
      });

    document
      .getElementById("cancelSendBack")
      ?.addEventListener("click", () => {
        hideModal(sendBackModal);
      });

    [approveModal, sendBackModal, approveQuestionModal, correctQuestionModal].forEach((modal) => {
      modal?.addEventListener("click", (event) => {
        if (event.target === modal) hideModal(modal);
      });
    });
  }

  if (!token) {
    showMessage(
      "Your principal session has expired. Please sign in again.",
      "error"
    );
    return;
  }

  connectControls();
  loadBranding();
  loadQuestions();
})();
