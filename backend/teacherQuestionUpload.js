//backend/teacherQuestionUpload.js

(() => {
  "use strict";

  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const originalMain = document.querySelector(".main-container");

  if (!originalMain) {
    console.error("Question upload page: .main-container was not found.");
    return;
  }

  // Remove event handlers from the existing demo page scripts.
  const mainContainer = originalMain.cloneNode(true);
  originalMain.replaceWith(mainContainer);

  // The modals are outside .main-container in this page's HTML.
  // Clone them too to remove any demo handlers attached to their buttons.
  const oldConfirmModal = document.getElementById("confirmModal");
  const oldSuccessModal = document.getElementById("successModal");

  const confirmModal = oldConfirmModal
    ? oldConfirmModal.cloneNode(true)
    : null;

  const successModal = oldSuccessModal
    ? oldSuccessModal.cloneNode(true)
    : null;

  if (oldConfirmModal && confirmModal) {
    oldConfirmModal.replaceWith(confirmModal);
  }

  if (oldSuccessModal && successModal) {
    oldSuccessModal.replaceWith(successModal);
  }

  const classSelect = mainContainer.querySelector("#classSelect");
  const subjectSelect = mainContainer.querySelector("#subjectSelect");
  const termSelect = mainContainer.querySelector("#termSelect");
  const sessionInput = mainContainer.querySelector("#sessionInput");
  const totalQuestionsInput =
    mainContainer.querySelector("#totalQuestionsInput");
  const instructionsInput =
    mainContainer.querySelector("#instructionInput");
  const durationInput =
    mainContainer.querySelector("#durationInput");
  const questionText =
    mainContainer.querySelector("#questionText");

  const optionInputs = {
    A: mainContainer.querySelector("#optionA"),
    B: mainContainer.querySelector("#optionB"),
    C: mainContainer.querySelector("#optionC"),
    D: mainContainer.querySelector("#optionD"),
  };

  const questionCounter =
    mainContainer.querySelector("#questionCounter");
  const progressFill =
    mainContainer.querySelector("#progressFill");
  const progressText =
    mainContainer.querySelector("#progressText");
  const progressSummary =
    mainContainer.querySelector("#progressSummary");

  const saveNextButton =
    mainContainer.querySelector("#saveNextBtn");
  const clearButton =
    mainContainer.querySelector("#clearBtn");
  const submitExamButton =
    mainContainer.querySelector("#submitExamBtn");

  const confirmSubmitButton =
    confirmModal?.querySelector("#confirmSubmit");
  const cancelSubmitButton =
    confirmModal?.querySelector("#cancelSubmit");
  const summaryClass =
    confirmModal?.querySelector("#summaryClass");
  const summarySubject =
    confirmModal?.querySelector("#summarySubject");
  const summaryQuestions =
    confirmModal?.querySelector("#summaryQuestions");

  const viewQuestionsButton =
    successModal?.querySelector("#viewQuestionsBtn");
  const newExamButton =
    successModal?.querySelector("#newExamBtn");

  const correctButtons = [
    ...mainContainer.querySelectorAll(
      ".correct-btn[data-option]"
    ),
  ];

  const DRAFTS_KEY = "teacherQuestionUploadDrafts";

  let offerings = [];
  let sessions = [];
  let drafts = [];
  let selectedCorrectAnswer = "A";
  let uploading = false;

  [
    saveNextButton,
    clearButton,
    submitExamButton,
    confirmSubmitButton,
    cancelSubmitButton,
    viewQuestionsButton,
    newExamButton,
    ...correctButtons,
  ].forEach((button) => {
    if (button) button.type = "button";
  });

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

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

  function showMessage(message, isError = false) {
    let messageElement = mainContainer.querySelector(
      "#questionUploadMessage"
    );

    if (!messageElement) {
      messageElement = document.createElement("p");
      messageElement.id = "questionUploadMessage";
      messageElement.setAttribute("role", "status");

      const examDetails =
        mainContainer.querySelector(".exam-details");

      if (examDetails) {
        examDetails.insertAdjacentElement(
          "afterend",
          messageElement
        );
      } else {
        mainContainer.prepend(messageElement);
      }
    }

    messageElement.textContent = message;
    messageElement.dataset.error = String(isError);
  }

  function clearMessage() {
    mainContainer
      .querySelector("#questionUploadMessage")
      ?.remove();
  }

  async function api(url, options = {}) {
    const requestUrl = new URL(url);

    if (!options.method || options.method.toUpperCase() === "GET") {
      requestUrl.searchParams.set(
        "_requestTime",
        String(Date.now())
      );
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

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        findNestedValue(body, "message") ||
          findNestedValue(body, "error") ||
          `Request failed (${response.status})`
      );
    }

    return body;
  }

  function applyBranding(school, teacher) {
    const schoolNameElement =
      document.querySelector(".logo-area h2");
    const schoolLogoElement =
      document.querySelector(".logo-area img");
    const teacherNameElement =
      document.querySelector(".teacher-profile h3");
    const teacherRoleElement =
      document.querySelector(".teacher-profile p");
    const teacherImageElement =
      document.querySelector(".teacher-profile img");

    if (schoolNameElement && school?.name) {
      schoolNameElement.textContent = school.name;
    }

    const logo =
      getImageUrl(school?.logo) ||
      getImageUrl(school?.logoUrl) ||
      getImageUrl(school?.images?.[0]);

    if (schoolLogoElement && logo) {
      schoolLogoElement.src = logo;
      schoolLogoElement.alt = `${school?.name || "School"} logo`;
    }

    if (!teacher) return;

    const name =
      teacher.fullName ||
      [
        teacher.title,
        teacher.firstName,
        teacher.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    if (teacherNameElement && name) {
      teacherNameElement.textContent = name;
    }

    if (teacherRoleElement) {
      teacherRoleElement.textContent = teacher.department
        ? `${teacher.department} Teacher`
        : "Teacher";
    }

    const avatar = getImageUrl(teacher.avatar);

    if (teacherImageElement && avatar) {
      teacherImageElement.src = avatar;
      teacherImageElement.alt = name || "Teacher";
    }
  }

  function populateTerms(session) {
    if (!termSelect) return;

    const terms = session?.terms || [];
    termSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = terms.length
      ? "Select Term"
      : "No terms for this session";
    termSelect.appendChild(placeholder);

    for (const term of terms) {
      const option = document.createElement("option");
      option.value = term.id;
      option.textContent = String(term.name || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      termSelect.appendChild(option);
    }

    const currentTerm = terms.find(
      (term) => term.isCurrent || term.status === "ACTIVE"
    );

    if (currentTerm) {
      termSelect.value = currentTerm.id;
    }
  }

  function populateSessions(defaultSessionId = "") {
    if (!sessionInput) return;

    const datalistId = "uploadAcademicSessions";
    let datalist = document.getElementById(datalistId);

    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.id = datalistId;
      document.body.appendChild(datalist);
    }

    datalist.innerHTML = sessions
      .map(
        (session) => `
          <option value="${escapeHtml(session.name)}"></option>
        `
      )
      .join("");

    sessionInput.setAttribute("list", datalistId);

    const defaultSession =
      sessions.find((session) => session.id === defaultSessionId) ||
      sessions.find((session) => session.isCurrent) ||
      sessions.find((session) => session.status === "ACTIVE");

    if (defaultSession) {
      sessionInput.value = defaultSession.name;
      sessionInput.dataset.sessionId = defaultSession.id;
      populateTerms(defaultSession);
    } else {
      sessionInput.value = "";
      sessionInput.dataset.sessionId = "";
      populateTerms(null);
    }

    sessionInput.addEventListener("change", () => {
      const selectedSession = sessions.find(
        (session) =>
          session.name === sessionInput.value.trim()
      );

      sessionInput.dataset.sessionId =
        selectedSession?.id || "";

      populateTerms(selectedSession || null);
    });
  }

  function populateSubjects() {
    if (!subjectSelect) return;

    const selectedClassId = classSelect?.value || "";
    const matchingOfferings = offerings.filter(
      (offering) => offering.classId === selectedClassId
    );

    subjectSelect.innerHTML =
      '<option value="">Select Subject</option>';

    for (const offering of matchingOfferings) {
      const option = document.createElement("option");
      option.value = offering.offeringId;
      option.textContent = offering.subjectCode
        ? `${offering.subjectName} (${offering.subjectCode})`
        : offering.subjectName;
      subjectSelect.appendChild(option);
    }
  }

  function populateClasses() {
    if (!classSelect) return;

    const classesById = new Map();

    for (const offering of offerings) {
      if (!classesById.has(offering.classId)) {
        classesById.set(offering.classId, offering);
      }
    }

    classSelect.innerHTML =
      '<option value="">Select Class</option>';

    for (const offering of classesById.values()) {
      const option = document.createElement("option");
      option.value = offering.classId;
      option.textContent = offering.classCode
        ? `${offering.className} (${offering.classCode})`
        : offering.className;
      classSelect.appendChild(option);
    }

    classSelect.addEventListener("change", populateSubjects);
    populateSubjects();
  }

  function getTargetQuestionCount() {
    const count = Number.parseInt(
      totalQuestionsInput?.value || "",
      10
    );

    return Number.isInteger(count) && count > 0 ? count : 0;
  }

  function updateProgress() {
    const target = getTargetQuestionCount();
    const completed = drafts.length;
    const percent = target
      ? Math.min(100, Math.round((completed / target) * 100))
      : 0;

    if (questionCounter) {
      const nextNumber = target
        ? Math.min(completed + 1, target)
        : completed + 1;

      questionCounter.textContent = target
        ? `Question ${nextNumber} of ${target}`
        : `Question ${nextNumber}`;
    }

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (progressText) {
      progressText.textContent =
        `${completed} / ${target} Questions Completed (${percent}%)`;
    }

    if (progressSummary) {
      progressSummary.textContent =
        `${completed} Question${completed === 1 ? "" : "s"} Added`;
    }

    if (saveNextButton) {
      saveNextButton.disabled =
        uploading || (target > 0 && completed >= target);
    }

    if (submitExamButton) {
      submitExamButton.disabled = uploading;
    }
  }

  function saveDrafts() {
    try {
      sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.warn("Could not save question drafts.", error);
    }
  }

  function restoreDrafts() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(DRAFTS_KEY) || "[]"
      );

      drafts = Array.isArray(saved) ? saved : [];
    } catch {
      drafts = [];
    }
  }

  function getCurrentQuestion() {
    const selectedOffering = offerings.find(
      (offering) =>
        offering.offeringId === subjectSelect?.value
    );

    const sessionId = sessionInput?.dataset.sessionId || "";
    const termId = termSelect?.value || "";
    const text = questionText?.value.trim() || "";

    const options = ["A", "B", "C", "D"].map((key) => ({
      key,
      text: optionInputs[key]?.value.trim() || "",
    }));

    if (!classSelect?.value) {
      throw new Error("Select a class.");
    }

    if (!selectedOffering) {
      throw new Error("Select a subject.");
    }

    if (!sessionId) {
      throw new Error("Select a valid academic session.");
    }

    if (!termId) {
      throw new Error("Select a term.");
    }

    if (!text) {
      throw new Error("Enter the question text.");
    }

    if (options.some((option) => !option.text)) {
      throw new Error("Fill in options A, B, C, and D.");
    }

    return {
      subjectOffering: selectedOffering.offeringId,
      academicSession: sessionId,
      term: termId,
      questionText: text,
      questionType: "MULTIPLE_CHOICE",
      options,
      correctAnswer: selectedCorrectAnswer,
      marks: 1,
      difficulty: "MEDIUM",
      explanation: "",
    };
  }

  function updateCorrectAnswerButtons() {
    for (const button of correctButtons) {
      const isCorrect =
        button.dataset.option === selectedCorrectAnswer;

      button.classList.toggle("active", isCorrect);
      button.textContent = isCorrect
        ? "✓ Correct Answer"
        : "Mark as Correct";
    }
  }

  function clearCurrentQuestion() {
    if (questionText) questionText.value = "";

    for (const input of Object.values(optionInputs)) {
      if (input) input.value = "";
    }

    selectedCorrectAnswer = "A";
    updateCorrectAnswerButtons();
    clearMessage();
    questionText?.focus();
  }

  function clearCurrentForm() {
    clearCurrentQuestion();
    showMessage(
      "Current question cleared. Previously added questions are preserved."
    );
  }

  function showModal(modal) {
    if (!modal) {
      showMessage("The confirmation modal was not found.", true);
      return;
    }

    modal.classList.remove("hidden");
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function hideModal(modal) {
    if (!modal) return;

    modal.classList.add("hidden");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  function updateConfirmSummary() {
    const offering = offerings.find(
      (item) => item.offeringId === subjectSelect?.value
    );

    if (summaryClass) {
      summaryClass.textContent = offering?.className || "—";
    }

    if (summarySubject) {
      summarySubject.textContent = offering?.subjectName || "—";
    }

    if (summaryQuestions) {
      summaryQuestions.textContent = String(drafts.length);
    }
  }

  async function submitDrafts() {
    if (uploading) return;

    const target = getTargetQuestionCount();

    if (!target) {
      hideModal(confirmModal);
      showMessage("Enter the total number of questions.", true);
      totalQuestionsInput?.focus();
      return;
    }

    if (drafts.length !== target) {
      hideModal(confirmModal);
      showMessage(
        `You have added ${drafts.length} of ${target} questions. Save all questions before submitting.`,
        true
      );
      return;
    }

    if (drafts.length === 0) {
      hideModal(confirmModal);
      showMessage("Add at least one question before submitting.", true);
      return;
    }

    uploading = true;
    updateProgress();
    hideModal(confirmModal);
    clearMessage();

    let submittedCount = 0;

    try {
      for (const draft of drafts) {
        await api(`${API_BASE}/question`, {
          method: "POST",
          body: JSON.stringify(draft),
        });

        submittedCount += 1;
      }

      drafts = [];
      saveDrafts();
      updateProgress();
      showModal(successModal);
    } catch (error) {
      // Retain only questions that haven't already been accepted by the API.
      drafts = drafts.slice(submittedCount);
      saveDrafts();
      updateProgress();

      showMessage(
        submittedCount
          ? `${submittedCount} question(s) were submitted. The remaining questions are still saved in this browser. ${error.message}`
          : error.message || "Could not submit questions.",
        true
      );
    } finally {
      uploading = false;
      updateProgress();
    }
  }

  async function loadUploadData() {
    if (!token) {
      window.location.assign("../login.html");
      return;
    }

    try {
      const response = await api(
        `${API_BASE}/teacher-dashboard/question-upload-data`
      );

      const school = findNestedValue(response, "school");
      const teacher = findNestedValue(response, "teacher");
      offerings = findArray(response, "offerings") || [];
      sessions = findArray(response, "sessions") || [];

      const defaultSessionId =
        findNestedValue(response, "defaultSessionId") || "";

      applyBranding(school, teacher);
      populateSessions(defaultSessionId);
      populateClasses();
      restoreDrafts();
      updateProgress();

      if (offerings.length === 0) {
        showMessage(
          "No active subject offerings are assigned to your account.",
          true
        );
      }
    } catch (error) {
      console.error("Could not load question upload data:", error);
      showMessage(
        error.message ||
          "Could not load classes, subjects, and sessions.",
        true
      );
    }
  }

  correctButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedCorrectAnswer = button.dataset.option;
      updateCorrectAnswerButtons();
    });
  });

  saveNextButton?.addEventListener("click", (event) => {
    event.preventDefault();
    clearMessage();

    const target = getTargetQuestionCount();

    if (!target) {
      showMessage("Enter the total number of questions first.", true);
      totalQuestionsInput?.focus();
      return;
    }

    if (drafts.length >= target) {
      showMessage(
        `You already added the requested ${target} questions.`,
        true
      );
      return;
    }

    try {
      drafts.push(getCurrentQuestion());
      saveDrafts();
      clearCurrentQuestion();
      updateProgress();
      showMessage(
        `Question ${drafts.length} saved. Add the next question.`
      );
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  clearButton?.addEventListener("click", (event) => {
    event.preventDefault();
    clearCurrentForm();
  });

  totalQuestionsInput?.addEventListener("input", updateProgress);

  submitExamButton?.addEventListener("click", (event) => {
    event.preventDefault();
    clearMessage();

    const target = getTargetQuestionCount();

    if (!target) {
      showMessage("Enter the total number of questions.", true);
      totalQuestionsInput?.focus();
      return;
    }

    if (drafts.length !== target) {
      showMessage(
        `You have saved ${drafts.length} of ${target} questions. Use Save & Add Next until all ${target} are saved.`,
        true
      );
      return;
    }

    updateConfirmSummary();
    showModal(confirmModal);
  });

  cancelSubmitButton?.addEventListener("click", (event) => {
    event.preventDefault();
    hideModal(confirmModal);
  });

  confirmSubmitButton?.addEventListener("click", (event) => {
    event.preventDefault();
    submitDrafts();
  });

  viewQuestionsButton?.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.assign("./uploaded-questions.html");
  });

  newExamButton?.addEventListener("click", (event) => {
    event.preventDefault();
    hideModal(successModal);

    drafts = [];
    saveDrafts();
    clearCurrentQuestion();

    if (totalQuestionsInput) totalQuestionsInput.value = "";
    if (instructionsInput) instructionsInput.value = "";
    if (durationInput) durationInput.value = "";

    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  confirmModal?.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
      hideModal(confirmModal);
    }
  });

  successModal?.addEventListener("click", (event) => {
    if (event.target === successModal) {
      hideModal(successModal);
    }
  });

  document.querySelector(".logout-btn")?.addEventListener("click", () => {
    sessionStorage.removeItem("teacherAccessToken");
    sessionStorage.removeItem("teacherRefreshToken");
    sessionStorage.removeItem("tenantAccessToken");
    sessionStorage.removeItem("teacherUser");
    sessionStorage.removeItem(DRAFTS_KEY);
    window.location.assign("../login.html");
  });

  updateCorrectAnswerButtons();
  updateProgress();
  loadUploadData();

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
})();