// Loads the signed-in student's profile and the published exams for their class.
(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE || (isLocal ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const TOKEN_KEY = "tenantAccessToken";
  const DEFAULT_AVATAR = "../assets/icons/avatar.png";
  const statusElement = document.getElementById("examStatus");
  const examList = document.getElementById("examList");

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

  async function getJson(path, token) {
    const requestUrl = `${API_BASE}${path}`;
    
    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      error.retryAfter = response.headers.get("retry-after");
      throw error;
    }

    // The current exam list controller places its payload in `message` and
    // the success text in `data`. Accept that response shape until the API
    // endpoint is corrected to use the standard ApiResponse argument order.
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

  function showMessage(title, message, isError = false) {
    if (!examList) return;

    const panel = document.createElement("div");
    panel.className = `exam-empty${isError ? " is-error" : ""}`;

    const heading = document.createElement("h2");
    heading.textContent = title;
    const description = document.createElement("p");
    description.textContent = message;

    panel.append(heading, description);
    examList.replaceChildren(panel);
  }

  function setStudentHeader(student) {
    const name = student.name ||
      [student.firstName, student.otherNames, student.lastName]
        .filter(Boolean)
        .join(" ") || "Student";

    document.getElementById("topStudentName").textContent = name;
    document.getElementById("topStudentClass").textContent =
      student.className || "Class not assigned";
    document.getElementById("topStudentRole").textContent =
      student.role || "Student";

    const avatar = document.getElementById("studentAvatar");
    if (student.avatar) {
      avatar.onerror = () => {
        avatar.onerror = null;
        avatar.src = DEFAULT_AVATAR;
      };
      avatar.src = student.avatar;
    }
  }

  function idOf(value) {
    if (!value) return "";
    return String(value._id || value.id || value);
  }

  function formatDate(value) {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function termName(term) {
    const value = term?.name || "";
    const labels = {
      FIRST_TERM: "First Term",
      SECOND_TERM: "Second Term",
      THIRD_TERM: "Third Term",
    };
    return labels[value] || value || "Not specified";
  }

  function addDetail(container, label, value) {
    const row = document.createElement("p");
    const heading = document.createElement("span");
    heading.textContent = `${label}:`;

    const content = document.createElement("span");
    content.textContent = value || "Not specified";

    row.append(heading, content);
    container.appendChild(row);
  }

  function createExamCard(exam, student, subjects, attemptStatus = null) {
    const card = document.createElement("article");
    card.className = "exam-card";

    const title = document.createElement("h2");
    title.className = "warning";
    title.textContent = exam.title || "Examination";

    const details = document.createElement("div");
    details.className = "exam-info";

    const offeringSubjectId = idOf(exam.subjectOffering?.subject);
    const subject = subjects.find(
      (item) => idOf(item.id || item._id) === offeringSubjectId
    );

    addDetail(details, "Student", student.name || "Student");
    addDetail(details, "Role", student.role || "Student");
    addDetail(details, "Class", exam.class?.name || student.className);
    addDetail(details, "Subject", subject?.name || "Subject");
    addDetail(details, "Duration", `${exam.durationMinutes || 0} minutes`);
    addDetail(details, "Questions", String(exam.questions?.length || 0));
    addDetail(details, "Total marks", String(exam.totalMarks ?? "Not specified"));
    addDetail(details, "Term", termName(exam.term));
    addDetail(details, "Session", exam.academicSession?.name);
    addDetail(details, "Available from", formatDate(exam.startDate));
    addDetail(details, "Available until", formatDate(exam.endDate));
    addDetail(
      details,
      "Attempt status",
      attemptStatus?.status === "SUBMITTED" ? "Submitted" : "Not submitted"
    );

    const instructionRow = document.createElement("p");
    const instructionLabel = document.createElement("span");
    instructionLabel.textContent = "Instructions:";
    const instructions = document.createElement("span");
    instructions.className = "exam-instructions";
    instructions.textContent = exam.instructions || "No additional instructions.";
    instructionRow.append(instructionLabel, instructions);
    details.appendChild(instructionRow);

    const startButton = document.createElement("button");
    startButton.className = "start-btn";
    startButton.type = "button";
    if (attemptStatus?.status === "SUBMITTED") {
      startButton.textContent = "EXAM SUBMITTED";
      startButton.disabled = true;
      startButton.classList.add("is-submitted");
      startButton.setAttribute("aria-label", `${exam.title || "Exam"} has already been submitted`);
    } else {
      startButton.textContent = "START EXAM";
      startButton.setAttribute("aria-label", `Start ${exam.title || "exam"}`);
      startButton.addEventListener("click", () => {
        const query = new URLSearchParams({ examId: idOf(exam) });
        window.location.assign(`./exam.html?${query.toString()}`);
      });
    }

    card.append(title, details, startButton);
    return card;
  }

  function isCurrentlyAvailable(exam, now) {
    return (
      ["PUBLISHED", "ONGOING"].includes(exam.status) &&
      new Date(exam.startDate).getTime() <= now &&
      new Date(exam.endDate).getTime() >= now
    );
  }

  function explainAvailability(exam, now) {
    const start = new Date(exam.startDate).getTime();
    const end = new Date(exam.endDate).getTime();
    const reasons = [];

    if (!["PUBLISHED", "ONGOING"].includes(exam.status)) {
      reasons.push(`status is ${exam.status || "missing"}, expected PUBLISHED or ONGOING`);
    }
    if (!Number.isFinite(start)) reasons.push("start date is invalid");
    else if (start > now) reasons.push("exam has not started yet");
    if (!Number.isFinite(end)) reasons.push("end date is invalid");
    else if (end < now) reasons.push("exam has ended");

    return {
      available: isCurrentlyAvailable(exam, now),
      reasons: reasons.length ? reasons : ["passes status and schedule checks"],
    };
  }

  async function initialize() {
    const token =
      sessionStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem("studentAccessToken");

    if (!token) {
      window.location.replace("../index.html");
      return;
    }

    try {
      const profileResponse = await getJson("/student-dashboard/profile", token);
      const student = profileResponse?.student;
      const subjects = profileResponse?.subjects || [];

      if (!student?.id || !student.classId) {
        throw new Error("Your student profile or class assignment is incomplete.");
      }

      setStudentHeader(student);

      const query = new URLSearchParams({
        class: student.classId,
        status: "PUBLISHED,ONGOING",
        limit: "100",
      });
      const examResponse = await getJson(`/exam?${query.toString()}`, token);
      const returnedExams = examResponse?.exams || [];
      const now = Date.now();

      const exams = returnedExams.filter((exam) => explainAvailability(exam, now).available);

      if (!exams.length) {
        statusElement.textContent = "No exams are currently open for your class.";
        showMessage(
          "No available exams",
          "Check back when your school schedules an examination."
        );
        return;
      }

      const statusQuery = new URLSearchParams({
        examIds: exams.map((exam) => idOf(exam)).join(","),
      });
      const statusResponse = await getJson(
        `/exam-attempt/status?${statusQuery.toString()}`,
        token
      );
      const attemptStatusByExam = new Map(
        (statusResponse?.attempts || []).map((item) => [item.examId, item])
      );
      statusElement.textContent = `${exams.length} exam${exams.length === 1 ? "" : "s"} currently available for your class.`;
      examList.replaceChildren(
        ...exams.map((exam) =>
          createExamCard(exam, student, subjects, attemptStatusByExam.get(idOf(exam)))
        )
      );
    } catch (error) {
      console.error("Could not load available exams:", error);

      if (error.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("studentAccessToken");
        window.location.replace("../index.html");
        return;
      }

      if (error.status === 429) {
        const waitMessage = error.retryAfter
          ? ` Try again in about ${error.retryAfter} seconds.`
          : " Please wait a short time and try again.";
        statusElement.textContent = "Too many requests. Please wait before trying again.";
        showMessage(
          "Request temporarily limited",
          `${error.message}${waitMessage}`,
          true
        );
        return;
      }

      statusElement.textContent = "We could not load your exams.";
      showMessage(
        "Unable to load exams",
        error.message || "Please try again in a moment.",
        true
      );
    }
  }

  document.querySelector(".back-btn")?.addEventListener("click", () => {
    window.location.assign("./onboarding.html");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
