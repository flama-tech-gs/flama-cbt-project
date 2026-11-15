// Runs a student's exam through the tenant API and resumes an attempt in this tab.
(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE || (isLocal ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const token =
    sessionStorage.getItem("tenantAccessToken") ||
    sessionStorage.getItem("studentAccessToken");
  const examId = new URLSearchParams(window.location.search).get("examId");
  const attemptStorageKey = `flamaExamAttempt:${examId}`;
  const answersStorageKey = `flamaExamAnswers:${examId}`;
  const questionStorageKey = `flamaExamQuestion:${examId}`;
  const defaultAvatar = "../assets/icons/avatar.png";
  const defaultLogo = "../assets/icons/logo.png";

  const elements = {
    pageStatus: document.getElementById("examPageStatus"),
    title: document.getElementById("examTitle"),
    instructions: document.getElementById("examInstruction"),
    studentName: document.getElementById("studentName"),
    studentClass: document.getElementById("studentClass"),
    studentRole: document.getElementById("studentRole"),
    studentAvatar: document.querySelector(".user-info img"),
    schoolName: document.querySelector(".brand h2"),
    schoolTagline: document.querySelector(".brand p"),
    schoolLogo: document.querySelector(".brand img"),
    subject: document.getElementById("subjectName"),
    timer: document.getElementById("timer"),
    questionNumber: document.getElementById("questionNumber"),
    questionText: document.getElementById("questionText"),
    options: document.getElementById("options"),
    questionGrid: document.getElementById("questionGrid"),
    previous: document.getElementById("prevBtn"),
    next: document.getElementById("nextBtn"),
    submit: document.getElementById("submitBtn"),
    modalSubject: document.getElementById("modalSubject"),
    totalQuestions: document.getElementById("totalQuestionCount"),
    answeredCount: document.getElementById("answeredCount"),
    unansweredCount: document.getElementById("unansweredCount"),
    submitModal: document.getElementById("submitModal"),
    successModal: document.getElementById("successModal"),
  };

  let student = null;
  let exam = null;
  let attempt = null;
  let questions = [];
  let answers = {};
  let currentQuestion = 0;
  let timerInterval = null;
  let progressInterval = null;
  let progressQueue = Promise.resolve();
  let isSubmitting = false;
  const pendingSaves = new Map();

  function unwrap(value) {
    let result = value;
    for (let depth = 0; depth < 5; depth += 1) {
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

  async function requestJson(path, options = {}) {
    const method = options.method || "GET";
    
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${token}`);

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
    const responseText = await response.text();
    let body = {};
    try {
      body = responseText ? JSON.parse(responseText) : {};
    } catch {
      body = {};
    }

    
    if (!response.ok || body.success === false) {
      const error = new Error(
        body.message || responseText.trim() || `Request failed (${response.status})`
      );
      error.status = response.status;
      throw error;
    }

    // Some current controllers pass ApiResponse arguments in reverse order.
    if (
      body.success === true &&
      body.message &&
      typeof body.message === "object" &&
      typeof body.data === "string"
    ) {
      return body.message;
    }

    return unwrap(body);
  }

  function setPageStatus(message, kind = "") {
    if (!elements.pageStatus) return;
    elements.pageStatus.textContent = message;
    elements.pageStatus.classList.toggle("is-error", kind === "error");
    elements.pageStatus.classList.toggle("is-success", kind === "success");
  }

  function showPageError(message) {
    setPageStatus(message, "error");
    elements.questionText.textContent = message;
    elements.options.replaceChildren();
    elements.submit.disabled = true;
  }

  function idOf(value) {
    if (!value) return "";
    return String(value._id || value.id || value);
  }

  function loadSavedAnswers() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(answersStorageKey) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  function saveLocalAnswers() {
    sessionStorage.setItem(answersStorageKey, JSON.stringify(answers));
  }

  function setSchoolBranding(profile) {
    const school = profile.school || {};
    if (school.name) elements.schoolName.textContent = school.name;
    elements.schoolTagline.textContent = "Student Portal";

    if (school.logo) {
      elements.schoolLogo.onerror = () => {
        elements.schoolLogo.onerror = null;
        elements.schoolLogo.src = defaultLogo;
      };
      elements.schoolLogo.src = school.logo;
      elements.schoolLogo.alt = `${school.name || "School"} logo`;
    }

    const name = student.name ||
      [student.firstName, student.otherNames, student.lastName]
        .filter(Boolean)
        .join(" ") || "Student";
    elements.studentName.textContent = name;
    elements.studentClass.textContent = student.className || "Class not assigned";
    elements.studentRole.textContent = student.role || "Student";

    if (student.avatar) {
      elements.studentAvatar.onerror = () => {
        elements.studentAvatar.onerror = null;
        elements.studentAvatar.src = defaultAvatar;
      };
      elements.studentAvatar.src = student.avatar;
    }
  }

  function findSubjectName(examRecord, subjects) {
    const subjectId = idOf(examRecord.subjectOffering?.subject);
    const subject = subjects.find((item) => idOf(item.id || item._id) === subjectId);
    return subject?.name || "Examination";
  }

  function examIsAvailable(record) {
    const now = Date.now();
    return (
      ["PUBLISHED", "ONGOING"].includes(record.status) &&
      new Date(record.startDate).getTime() <= now &&
      new Date(record.endDate).getTime() >= now
    );
  }

  async function loadProfileAndExam() {
    const profileResponse = await requestJson("/student-dashboard/profile");
    student = profileResponse?.student;
    const subjects = profileResponse?.subjects || [];

    if (!student?.id || !student.classId) {
      throw new Error("Your student profile or class assignment is incomplete.");
    }

    setSchoolBranding(profileResponse);

    const query = new URLSearchParams({
      class: student.classId,
      status: "PUBLISHED,ONGOING",
      limit: "100",
    });
    const examResponse = await requestJson(`/exam?${query.toString()}`);
    const returnedExams = examResponse?.exams || [];
    const matches = returnedExams.filter(
      (item) => idOf(item) === examId && examIsAvailable(item)
    );

    exam = matches[0];
    if (!exam) {
      throw new Error("This exam is not currently available for your class.");
    }

    elements.title.textContent = exam.title || "Examination";
    elements.instructions.textContent = exam.instructions || "Answer all questions";
    elements.subject.textContent = findSubjectName(exam, subjects);
    elements.modalSubject.textContent = elements.subject.textContent;
    document.title = `${exam.title || "Examination"} | Student Portal`;
  }

  async function loadOrStartAttempt() {
    const savedAttemptId = sessionStorage.getItem(attemptStorageKey);
    if (savedAttemptId) {
      try {
        const savedAttempt = await requestJson(
          `/exam-attempt/${encodeURIComponent(savedAttemptId)}`
        );
        if (
          savedAttempt?.status === "IN_PROGRESS" &&
          !savedAttempt.isPaused &&
          new Date(savedAttempt.expiresAt).getTime() > Date.now()
        ) {
          return savedAttempt;
        }

        if (savedAttempt?.status === "IN_PROGRESS" && savedAttempt.isPaused) {
          return requestJson("/exam-attempt", {
            method: "POST",
            body: JSON.stringify({ exam: examId }),
          });
        }
      } catch (error) {
        if (error.status !== 404) throw error;
      }
      sessionStorage.removeItem(attemptStorageKey);
    }

    const startedAttempt = await requestJson("/exam-attempt", {
      method: "POST",
      body: JSON.stringify({ exam: examId }),
    });

    if (!startedAttempt?._id || !startedAttempt?.expiresAt) {
      throw new Error("The exam service returned an incomplete attempt.");
    }

    sessionStorage.setItem(attemptStorageKey, startedAttempt._id);
    return startedAttempt;
  }

  function questionId(question) {
    return idOf(question.question || question._id);
  }

  function renderQuestionGrid() {
    elements.questionGrid.replaceChildren();

    questions.forEach((question, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(index + 1);
      button.setAttribute("aria-label", `Go to question ${index + 1}`);
      button.addEventListener("click", () => showQuestion(index));
      elements.questionGrid.appendChild(button);
    });
  }

  function renderQuestion() {
    const question = questions[currentQuestion];
    if (!question) return;

    const id = questionId(question);
    elements.questionNumber.replaceChildren();

    const label = document.createElement("span");
    label.textContent = `Question ${currentQuestion + 1}:`;
    const counter = document.createElement("span");
    counter.className = "question-counter";
    counter.textContent = `  of ${questions.length}`;
    elements.questionNumber.append(label, counter);
    elements.questionText.textContent = question.questionText || "Question text unavailable.";
    elements.options.replaceChildren();

    let options = Array.isArray(question.options) ? question.options : [];
    if (!options.length && question.questionType === "TRUE_FALSE") {
      options = [
        { key: "TRUE", text: "True" },
        { key: "FALSE", text: "False" },
      ];
    }

    options.forEach((option) => {
      const button = document.createElement("button");
      const key = String(option.key || "");
      button.type = "button";
      button.className = "option-button";
      button.textContent = key
        ? `${key}. ${option.text || option.label || key}`
        : String(option.text || option.label || option);
      button.classList.toggle("selected", answers[id] === key);
      button.setAttribute("aria-pressed", String(answers[id] === key));
      button.disabled = isSubmitting;
      button.addEventListener("click", () => selectAnswer(question, key));
      elements.options.appendChild(button);
    });

    [...elements.questionGrid.children].forEach((button, index) => {
      const gridQuestion = questions[index];
      const answered = Boolean(answers[questionId(gridQuestion)]);
      button.classList.toggle("answered", answered);
      button.classList.toggle("active", index === currentQuestion);
      button.setAttribute("aria-current", index === currentQuestion ? "step" : "false");
    });

    elements.previous.disabled = currentQuestion === 0 || isSubmitting;
    elements.next.disabled = currentQuestion === questions.length - 1 || isSubmitting;
    elements.submit.disabled = isSubmitting;
  }

  function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentQuestion = index;
    renderQuestion();
    sessionStorage.setItem(questionStorageKey, String(currentQuestion));
    void saveProgress().catch((error) => {
      console.warn("Could not save the current question:", error.message);
    });
  }

  function saveProgress(pause = false, keepalive = false) {
    if (!attempt?._id || isSubmitting) return Promise.resolve(null);

    const body = JSON.stringify({
      currentQuestionIndex: currentQuestion,
      pause,
    });
    const operation = progressQueue
      .catch(() => null)
      .then(() => requestJson(
        `/exam-attempt/${encodeURIComponent(attempt._id)}/progress`,
        { method: "PATCH", body, keepalive }
      ));

    progressQueue = operation;
    return operation.then((updatedAttempt) => {
      if (updatedAttempt) attempt = { ...attempt, ...updatedAttempt };
      return updatedAttempt;
    });
  }

  async function pauseAttempt(keepalive = false) {
    if (!attempt || attempt.isPaused || isSubmitting) return;
    window.clearInterval(timerInterval);
    window.clearInterval(progressInterval);
    timerInterval = null;
    progressInterval = null;

    await Promise.all(pendingSaves.values());
    try {
      await saveProgress(true, keepalive);
      elements.timer.textContent = formatTime(attempt.remainingSeconds);
      setPageStatus("Exam paused. Your question and remaining time are saved.");
    } catch (error) {
      console.warn("Could not pause exam progress:", error.message);
      if (/expired|window has ended/i.test(error.message)) {
        attempt.expiresAt = new Date().toISOString();
        attempt.isPaused = false;
        void finishExam({ automatic: true });
      }
    }
  }

  function setSaveStatus(message, kind = "") {
    const saveStatus = document.getElementById("saveStatus");
    if (!saveStatus) return;
    saveStatus.textContent = message;
    saveStatus.classList.toggle("is-error", kind === "error");
    saveStatus.classList.toggle("is-success", kind === "success");
  }

  function queueAnswerSave(questionIdValue, answer) {
    const existing = pendingSaves.get(questionIdValue) || Promise.resolve(true);
    const saving = existing
      .catch(() => false)
      .then(async () => {
        await requestJson(`/exam-answer/${encodeURIComponent(attempt._id)}`, {
          method: "POST",
          body: JSON.stringify({ question: questionIdValue, answer }),
        });
        setSaveStatus("");
        return true;
      })
      .catch((error) => {
        console.error("Answer could not be saved:", error);
        setSaveStatus("Answer not saved. It will retry when you submit.", "error");
        return false;
      });

    pendingSaves.set(questionIdValue, saving);
    return saving;
  }

  function selectAnswer(question, answer) {
    if (isSubmitting) return;
    const id = questionId(question);
    answers[id] = answer;
    saveLocalAnswers();
    renderQuestion();
    void queueAnswerSave(id, answer);
    void saveProgress().catch((error) => {
      console.warn("Could not save the current question:", error.message);
    });
  }

  async function flushAnswers() {
    const saves = Object.entries(answers).map(([id, answer]) =>
      queueAnswerSave(id, answer)
    );
    const results = await Promise.all(saves);
    const earlierSaves = await Promise.all(pendingSaves.values());
    return results.every(Boolean) && earlierSaves.every(Boolean);
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${String(minutes).padStart(2, "0")} : ${String(remainder).padStart(2, "0")}`;
  }

  async function finishExam({ automatic = false } = {}) {
    if (isSubmitting || !attempt) return;
    isSubmitting = true;
    window.clearInterval(timerInterval);
    window.clearInterval(progressInterval);
    timerInterval = null;
    progressInterval = null;
    renderQuestion();

    if (automatic) {
      setPageStatus("Time is up. Submitting your exam…");
    }

    try {
      const answersSaved = await flushAnswers();
      if (!answersSaved && !automatic) {
        throw new Error("Some answers could not be saved. Check your connection and try again.");
      }

      try {
        await requestJson(`/exam-attempt/${encodeURIComponent(attempt._id)}/submit`, {
          method: "PATCH",
        });
      } catch (error) {
        // The backend marks an attempt TIMED_OUT when the expiry time is reached.
        const attemptAlreadyEnded =
          error.status === 409 &&
          /expired|no longer active|already been submitted/i.test(error.message);
        if (!attemptAlreadyEnded) throw error;
      }

      try {
        await requestJson(
          `/result/attempt/${encodeURIComponent(attempt._id)}`,
          { method: "POST" }
        );
      } catch (error) {
        console.error("Result generation failed after submission:", error);
      }

      sessionStorage.removeItem(attemptStorageKey);
      sessionStorage.removeItem(answersStorageKey);
      sessionStorage.removeItem(questionStorageKey);
      elements.submitModal.classList.add("hidden");
      elements.successModal.classList.remove("hidden");
      setPageStatus("Exam submitted successfully.", "success");
    } catch (error) {
      console.error("Exam submission failed:", error);
      isSubmitting = false;
      renderQuestion();
      setPageStatus(error.message || "Exam submission failed. Please try again.", "error");
      if (new Date(attempt.expiresAt).getTime() > Date.now()) {
        timerInterval = window.setInterval(tickTimer, 1000);
        progressInterval = window.setInterval(() => {
          if (!document.hidden) void saveProgress().catch(() => {});
        }, 10000);
      }
    }
  }

  function tickTimer() {
    if (!attempt?.expiresAt || attempt.isPaused) return;

    const secondsLeft = Math.ceil((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000);
    elements.timer.textContent = formatTime(secondsLeft);
    elements.timer.classList.toggle("is-warning", secondsLeft <= 300 && secondsLeft > 0);

    if (secondsLeft <= 0) {
      elements.timer.classList.add("is-expired");
      void finishExam({ automatic: true });
    }
  }

  function openModal() {
    const answered = Object.values(answers).filter(Boolean).length;
    elements.answeredCount.textContent = String(answered);
    elements.unansweredCount.textContent = String(questions.length - answered);
    elements.submitModal.classList.remove("hidden");
  }

  function closeModal() {
    elements.submitModal.classList.add("hidden");
  }

  function goToDashboard() {
    window.location.assign("./onboarding");
  }

  elements.previous.addEventListener("click", () => showQuestion(currentQuestion - 1));
  elements.next.addEventListener("click", () => showQuestion(currentQuestion + 1));
  elements.submit.addEventListener("click", openModal);
  document.querySelector("#submitModal .back-btn")?.addEventListener("click", closeModal);
  document.querySelector("#submitModal .submit-btn")?.addEventListener("click", () => {
    void finishExam();
  });
  document.querySelector("#successModal button")?.addEventListener("click", goToDashboard);

  async function initialize() {
    if (!token) {
      window.location.replace("../index");
      return;
    }
    if (!examId) {
      showPageError("Exam ID is missing. Return to the available exams page and select an exam.");
      return;
    }

    try {
      setPageStatus("Loading your profile and exam…");
      await loadProfileAndExam();
      const previousAttemptId = sessionStorage.getItem(attemptStorageKey);
      attempt = await loadOrStartAttempt();

      if (previousAttemptId && previousAttemptId !== attempt._id) {
        sessionStorage.removeItem(answersStorageKey);
        sessionStorage.removeItem(questionStorageKey);
      }

      // Reload saved answers from the tenant database after logout or a new login.
      attempt = await requestJson(
        `/exam-attempt/${encodeURIComponent(attempt._id)}`
      );

      if (attempt.status !== "IN_PROGRESS") {
        throw new Error("This exam attempt is no longer active.");
      }

      const serverAnswers = Object.fromEntries(
        (attempt.savedAnswers || []).map((item) => [item.question, item.answer])
      );
      answers = { ...serverAnswers, ...loadSavedAnswers() };
      questions = [...(attempt.questions || [])].sort(
        (first, second) => first.order - second.order
      );

      
      if (!questions.length) {
        throw new Error("This exam does not have any questions yet.");
      }

      elements.totalQuestions.textContent = String(questions.length);
      renderQuestionGrid();
      const savedQuestionValue = sessionStorage.getItem(questionStorageKey);
      const savedQuestionIndex = savedQuestionValue === null
        ? Number.NaN
        : Number(savedQuestionValue);
      currentQuestion = Number.isInteger(savedQuestionIndex)
        ? savedQuestionIndex
        : Number.isInteger(attempt.currentQuestionIndex)
          ? attempt.currentQuestionIndex
          : 0;
      currentQuestion = Math.min(Math.max(currentQuestion, 0), questions.length - 1);
      renderQuestion();
      setPageStatus("Your answers save as you work.");
      tickTimer();
      timerInterval = window.setInterval(tickTimer, 1000);
      progressInterval = window.setInterval(() => {
        if (!document.hidden) {
          void saveProgress().catch((error) => {
            console.warn("Could not save exam progress:", error.message);
          });
        }
      }, 10000);
    } catch (error) {
      console.error("Could not load exam:", error);
      if (error.status === 401) {
        sessionStorage.removeItem("tenantAccessToken");
        sessionStorage.removeItem("studentAccessToken");
        window.location.replace("../index");
        return;
      }
      showPageError(error.message || "Could not load this exam.");
    }
  }

  window.addEventListener("pagehide", () => {
    if (attempt && !attempt.isPaused && !isSubmitting) {
      void pauseAttempt(true).catch((error) => {
        console.warn("Could not save progress before leaving:", error.message);
      });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
