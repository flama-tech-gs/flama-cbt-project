//backend/teacherEditQuestion.js

(() => {
  "use strict";

  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;
  const DATA_URL =
    `${API_BASE}/teacher-dashboard/submitted-questions/edit-data`;
  const UPDATE_URL =
    `${API_BASE}/teacher-dashboard/submitted-questions`;
  const RESUBMIT_URL =
    `${API_BASE}/teacher-dashboard/submitted-questions/resubmit`;

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const params = new URLSearchParams(window.location.search);
  const questionIds = (params.get("questionIds") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const fallbackAvatar =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e8edf3"/><circle cx="40" cy="30" r="14" fill="#9aa8b8"/><path d="M12 76c2-18 13-26 28-26s26 8 28 26" fill="#9aa8b8"/></svg>'
    );

  const el = {
    logo: document.querySelector(".logo-area img"),
    schoolName: document.querySelector(".logo-area h2"),
    schoolTagline: document.querySelector(".logo-area p"),
    teacherImage: document.querySelector(".teacher-profile img"),
    teacherName: document.querySelector(".teacher-profile h3"),
    teacherRole: document.querySelector(".teacher-profile p"),

    questionText: document.getElementById("questionText"),
    options: {
      A: document.getElementById("optionA"),
      B: document.getElementById("optionB"),
      C: document.getElementById("optionC"),
      D: document.getElementById("optionD"),
    },

    questionNumber: document.getElementById("questionNumber"),
    questionCounter: document.getElementById("questionCounter"),
    navigationCounter: document.getElementById("navigationCounter"),

    previous: document.getElementById("previousQuestion"),
    next: document.getElementById("nextQuestion"),
    save: document.getElementById("saveChanges"),
    discard: document.getElementById("discardChanges"),
    submit: document.getElementById("submitQuestion"),

    summaryItems: document.querySelectorAll(".summary-item"),
    approvalSuccessModal: document.getElementById("approvalSuccessModal"),
    successSubject: document.getElementById("successSubject"),
    successClass: document.getElementById("successClass"),
    successQuestionCount: document.getElementById("successQuestionCount"),
    successSubmittedDate: document.getElementById("successSubmittedDate"),
    closeApprovalSuccess: document.getElementById("closeApprovalSuccess"),
    toastRegion: document.getElementById("editQuestionToastRegion"),
  };

  const designedLogoSrc = el.logo?.getAttribute("src") || "";

  const state = {
    questions: [],
    currentIndex: 0,
    hasChanges: false,
    submission: null,
    saving: false,
  };

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function unwrap(body) {
    let result = body;

    for (let i = 0; i < 5; i += 1) {
      if (
        result &&
        typeof result === "object" &&
        Object.prototype.hasOwnProperty.call(result, "data")
      ) {
        result = result.data;
      } else {
        break;
      }
    }

    return result;
  }

  async function request(url, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Request failed (${response.status})`
      );
    }

    return unwrap(body);
  }

  function setAvatar(image, url) {
    if (!image) return;

    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackAvatar;
    };

    image.src = url || fallbackAvatar;
  }

  function applyBranding(branding) {
    const school = branding?.school || {};
    const teacher = branding?.teacher || {};

    if (school.name && el.schoolName) {
      el.schoolName.textContent = school.name;
    }

    // Leave the HTML's designed logo in place when no school logo is set.
    const logoUrl =
      typeof school.logo === "string" ? school.logo.trim() : "";

    if (el.logo && logoUrl) {
      el.logo.onerror = () => {
        el.logo.onerror = null;
        if (designedLogoSrc) el.logo.src = designedLogoSrc;
      };
      el.logo.src = logoUrl;
      el.logo.alt = school.name ? `${school.name} logo` : "School logo";
    }

    if (el.schoolTagline) {
      el.schoolTagline.textContent = "Teacher Portal";
    }

    if (el.teacherName) {
      el.teacherName.textContent = teacher.name || "Teacher";
    }

    if (el.teacherRole) {
      el.teacherRole.textContent =
        teacher.department || teacher.employeeId || "Teacher";
    }

    setAvatar(el.teacherImage, teacher.avatar);
  }

  function setSummaryValue(labelText, value) {
    for (const item of el.summaryItems) {
      const label = item.querySelector("span");
      const strong = item.querySelector("strong");

      if (
        label?.textContent.trim().toLowerCase() ===
        labelText.toLowerCase()
      ) {
        if (strong) strong.textContent = value || "—";
        return;
      }
    }
  }

  function setStatus(status) {
    const statusItem = [...el.summaryItems].find((item) =>
      item.textContent.toLowerCase().includes("exam status")
    );

    const badge = statusItem?.querySelector(".badge");
    if (!badge) return;

    const normalized = String(status || "PENDING").toUpperCase();
    badge.textContent =
      normalized === "PENDING"
        ? "Pending Approval"
        : normalized;

    badge.className = `badge ${normalized.toLowerCase()}`;
  }

  function showMessage(message, isError = false) {
    let node = document.getElementById("editQuestionMessage");

    if (!node) {
      node = document.createElement("p");
      node.id = "editQuestionMessage";
      node.setAttribute("role", "status");

      const builder = document.querySelector(".question-builder");
      builder?.prepend(node);
    }

    node.textContent = message;
    node.style.color = isError ? "#b42318" : "";
  }

  function showToast(title, description, kind = "saved") {
    if (!el.toastRegion) return;

    const toast = document.createElement("article");
    toast.className = `edit-question-toast is-${kind}`;
    toast.setAttribute("role", "status");

    const icon = document.createElement("span");
    icon.className = "edit-question-toast__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = kind === "discarded" ? "↶" : "✓";

    const content = document.createElement("div");
    content.className = "edit-question-toast__content";

    const heading = document.createElement("strong");
    heading.textContent = title;
    const detail = document.createElement("span");
    detail.textContent = description;
    content.append(heading, detail);

    const close = document.createElement("button");
    close.className = "edit-question-toast__close";
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";
    close.addEventListener("click", () => toast.remove());

    toast.append(icon, content, close);
    el.toastRegion.appendChild(toast);

    window.setTimeout(() => toast.remove(), 5000);
  }

  function showApprovalSuccess() {
    const submission = state.submission || {};
    const submittedAt = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date());

    if (el.successSubject) el.successSubject.textContent = submission.subject || "Questions";
    if (el.successClass) el.successClass.textContent = submission.className || "—";
    if (el.successQuestionCount) {
      el.successQuestionCount.textContent = String(state.questions.length);
    }
    if (el.successSubmittedDate) el.successSubmittedDate.textContent = submittedAt;

    el.approvalSuccessModal?.classList.remove("hidden");
    el.approvalSuccessModal?.setAttribute("aria-hidden", "false");
    window.lucide?.createIcons();
    el.closeApprovalSuccess?.focus();
  }

  function hideApprovalSuccess() {
    el.approvalSuccessModal?.classList.add("hidden");
    el.approvalSuccessModal?.setAttribute("aria-hidden", "true");
  }

  function activeQuestion() {
    return state.questions[state.currentIndex];
  }

  function correctAnswerFromQuestion(question) {
    const answer = String(question.correctAnswer || "").trim().toUpperCase();

    if (["A", "B", "C", "D"].includes(answer)) return answer;

    const matchingOption = (question.options || []).find(
      (option) =>
        String(option.text || "").trim().toLowerCase() ===
        String(question.correctAnswer || "").trim().toLowerCase()
    );

    return matchingOption?.key || "";
  }

  function renderQuestion() {
    const question = activeQuestion();
    if (!question) return;

    const number = state.currentIndex + 1;
    const total = state.questions.length;

    if (el.questionNumber) el.questionNumber.textContent = String(number);
    if (el.questionCounter) {
      el.questionCounter.textContent = `${number} of ${total}`;
    }
    if (el.navigationCounter) {
      el.navigationCounter.textContent = `Question ${number} of ${total}`;
    }

    if (el.questionText) {
      el.questionText.value = question.questionText || "";
    }

    const optionMap = new Map(
      (question.options || []).map((option) => [
        String(option.key).toUpperCase(),
        option.text || "",
      ])
    );

    for (const key of ["A", "B", "C", "D"]) {
      if (el.options[key]) {
        el.options[key].value = optionMap.get(key) || "";
      }
    }

    // The existing Question model and validator support A-D. Hide the
    // template's optional E card so it cannot be submitted accidentally.
    document
      .querySelectorAll(".option-card")
      .forEach((card) => {
        const heading = card.querySelector(".option-header h3");
        if (heading?.textContent.trim() === "Option E") {
          card.hidden = true;
        }
      });

    const answer = correctAnswerFromQuestion(question);

    document.querySelectorAll(".correct-btn").forEach((button) => {
      const selected = button.dataset.option === answer;
      button.classList.toggle("active", selected);
      button.textContent = selected ? "✓ Correct" : "Mark as Correct";
    });

    const approved =
      String(question.reviewStatus || "PENDING").toUpperCase() ===
      "APPROVED";

    for (const input of [
      el.questionText,
      ...Object.values(el.options),
    ]) {
      if (input) input.disabled = approved;
    }

    document.querySelectorAll(".correct-btn").forEach((button) => {
      button.disabled = approved;
    });

    if (el.save) el.save.disabled = approved;
    if (el.submit) el.submit.disabled = approved;

    if (el.previous) {
      el.previous.disabled = state.currentIndex === 0;
    }

    if (el.next) {
      el.next.disabled = state.currentIndex === total - 1;
    }

    state.hasChanges = false;

    if (approved) {
      showMessage("This question is approved and can no longer be edited.");
    } else {
      showMessage("");
    }
  }

  function readForm() {
    const selected = document.querySelector(".correct-btn.active");
    const options = ["A", "B", "C", "D"]
      .map((key) => ({
        key,
        text: el.options[key]?.value.trim() || "",
      }))
      .filter((option) => option.text);

    return {
      questionText: el.questionText?.value.trim() || "",
      options,
      correctAnswer: selected?.dataset.option || "",
    };
  }

  function validateForm(data) {
    if (data.questionText.length < 3) {
      throw new Error("Enter a question with at least 3 characters.");
    }

    if (data.options.length < 2) {
      throw new Error("Enter at least two answer options.");
    }

    if (!data.correctAnswer) {
      throw new Error("Mark one answer as correct.");
    }

    if (!data.options.some((option) => option.key === data.correctAnswer)) {
      throw new Error("The correct answer must have an option value.");
    }
  }

  async function saveCurrentQuestion(showSuccess = true) {
    const question = activeQuestion();
    if (!question) return;

    const data = readForm();
    validateForm(data);

    state.saving = true;
    if (el.save) el.save.disabled = true;

    try {
      await request(
        `${UPDATE_URL}/${encodeURIComponent(question._id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );

      question.questionText = data.questionText;
      question.options = data.options;
      question.correctAnswer = data.correctAnswer;
      state.hasChanges = false;

      if (showSuccess) {
        showToast(
          "Question saved!",
          `Question ${state.currentIndex + 1} of ${state.questions.length} has been saved.`,
          "saved"
        );
      }
    } finally {
      state.saving = false;
      renderQuestion();
    }
  }

  async function submitForApproval() {
    if (state.saving) return;

    try {
      if (state.hasChanges) {
        await saveCurrentQuestion(false);
      }

      const approvedQuestion = state.questions.find(
        (question) =>
          String(question.reviewStatus || "PENDING").toUpperCase() ===
          "APPROVED"
      );

      if (approvedQuestion) {
        throw new Error(
          "This submission contains an approved question and cannot be resubmitted as a group."
        );
      }

      if (
        !window.confirm(
          `Submit all ${state.questions.length} question(s) for approval?`
        )
      ) {
        return;
      }

      await request(RESUBMIT_URL, {
        method: "POST",
        body: JSON.stringify({
          questionIds: state.questions.map((question) => question._id),
        }),
      });

      state.questions.forEach((question) => {
        question.reviewStatus = "PENDING";
      });

      setStatus("PENDING");
      showApprovalSuccess();
    } catch (error) {
      showMessage(error.message || "Could not submit questions.", true);
    }
  }

  function bindEvents() {
    for (const input of [
      el.questionText,
      ...Object.values(el.options),
    ]) {
      input?.addEventListener("input", () => {
        state.hasChanges = true;
      });
    }

    document.querySelectorAll(".correct-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".correct-btn").forEach((item) => {
          item.classList.remove("active");
          item.textContent = "Mark as Correct";
        });

        button.classList.add("active");
        button.textContent = "✓ Correct";
        state.hasChanges = true;
      });
    });

    el.save?.addEventListener("click", async () => {
      try {
        await saveCurrentQuestion();
      } catch (error) {
        showMessage(error.message || "Could not save changes.", true);
      }
    });

    el.discard?.addEventListener("click", () => {
      if (!state.questions.length) return;
      const questionNumber = state.currentIndex + 1;
      renderQuestion();
      showToast(
        "Changes discarded",
        `Question ${questionNumber} has been restored to its last saved version.`,
        "discarded"
      );
    });

    el.previous?.addEventListener("click", () => {
      if (state.currentIndex <= 0) return;

      if (state.hasChanges) {
        const discard = window.confirm(
          "You have unsaved changes. Discard them and go to the previous question?"
        );
        if (!discard) return;
      }

      state.currentIndex -= 1;
      renderQuestion();
    });

    el.next?.addEventListener("click", () => {
      if (state.currentIndex >= state.questions.length - 1) return;

      if (state.hasChanges) {
        const discard = window.confirm(
          "You have unsaved changes. Discard them and go to the next question?"
        );
        if (!discard) return;
      }

      state.currentIndex += 1;
      renderQuestion();
    });

    el.submit?.addEventListener("click", submitForApproval);
    el.closeApprovalSuccess?.addEventListener("click", hideApprovalSuccess);
    el.approvalSuccessModal?.addEventListener("click", (event) => {
      if (event.target === el.approvalSuccessModal) hideApprovalSuccess();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !el.approvalSuccessModal?.classList.contains("hidden")) {
        hideApprovalSuccess();
      }
    });

    // Return to the submitted questions listing.
    const backLink = document.querySelector(".back-btn");
    if (backLink) {
      backLink.href = "../submitted-question/submitted-questions.html";
    }

    window.addEventListener("beforeunload", (event) => {
      if (!state.hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  async function initialize() {
    if (!token) {
      showMessage("Your teacher session has expired. Please sign in again.", true);
      return;
    }

    if (!questionIds.length) {
      showMessage(
        "No question IDs were provided. Return to Submitted Questions and click Edit on a submission.",
        true
      );
      return;
    }

    bindEvents();

    const url = new URL(DATA_URL);
    url.searchParams.set("questionIds", questionIds.join(","));

    try {
      const data = await request(url.toString());
      const submission = data.submission || {};

      state.submission = submission;
      state.questions = submission.questions || [];

      applyBranding(data.branding);

      setSummaryValue("Subject", submission.subject);
      setSummaryValue("Class", submission.className);
      setSummaryValue("Term", submission.term);
      setStatus(submission.status);

      if (!state.questions.length) {
        showMessage("No questions were returned for this submission.", true);
        return;
      }

      renderQuestion();
    } catch (error) {
      console.error("Could not load questions for editing:", error);
      showMessage(error.message || "Could not load the questions.", true);
    }

    window.lucide?.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
