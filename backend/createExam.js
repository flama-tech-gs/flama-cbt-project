// Shared exam creation form for the Principal modal and Teacher page.
(function () {
  const API_BASE = window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");
  const principalPage = window.location.pathname.includes("/principal/");
  const TOKEN_KEYS = principalPage
    ? ["principalAccessToken", "tenantAccessToken"]
    : ["teacherAccessToken", "tenantAccessToken"];

  const token = () => TOKEN_KEYS.map((key) => sessionStorage.getItem(key)).find(Boolean);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  function unwrap(body) {
    // Most API responses use { success, message, data }. Exam controllers
    // return their message and data in the opposite positions.
    let value = body;
    if (value && typeof value.message === "object" && value.data !== undefined) {
      value = value.message;
    } else if (value && value.data !== undefined) {
      value = value.data;
    }
    return value;
  }

  async function request(path, options = {}) {
    const accessToken = token();
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
      return unwrap(body);
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("The server did not respond in time. Check the backend and try again.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function list(value, keys) {
    for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
    return Array.isArray(value) ? value : [];
  }

  async function loadList(path, keys, label) {
    try {
      const result = await request(path);
      return { items: list(result, keys), error: null };
    } catch (error) {
      return { items: [], error: `${label}: ${error.message}` };
    }
  }

  async function loadTeacherScope() {
    try {
      const result = await request("/teacher-dashboard/exam-creation-data");
      const departments = list(result, ["departments"]);
      const classes = list(result, ["classes"]);
      const offerings = list(result, ["offerings"]);
      let notice = "";

      if (!departments.length) {
        notice = "No HOD department is assigned to your teacher account. Ask your school administrator to assign you as a Head of Department.";
      } else if (!classes.length) {
        notice = "No active classes with subject offerings are linked to your HOD department.";
      }

      return {
        classes: { items: classes, error: null, emptyLabel: "No HOD-assigned classes" },
        offerings: { items: offerings, error: null },
        notice,
      };
    } catch (error) {
      const message = `HOD classes and subjects: ${error.message}`;
      return {
        classes: { items: [], error: message, emptyLabel: "Could not load HOD classes" },
        offerings: { items: [], error: message },
        notice: "",
      };
    }
  }

  function option(value, label) {
    return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
  }

  function formatTermName(name = "") {
    return String(name)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function formMarkup() {
    const scopeNote = principalPage
      ? ""
      : '<p class="exam-form-hint">Teacher exam creation is limited to classes served by active subject offerings in your HOD department.</p>';
    return `
      <form class="exam-create-form" id="examCreateForm">
        ${scopeNote}
        <div class="exam-form-grid">
          <label class="exam-field exam-field-wide">Exam title<input name="title" required minlength="3" maxlength="200" placeholder="e.g. First Term Mathematics Examination"></label>
          <label class="exam-field">Academic session<select name="academicSession" required><option value="">Loading sessions…</option></select></label>
          <label class="exam-field">Term<select name="term" required disabled><option value="">Select a session first</option></select></label>
          <label class="exam-field">Class<select name="class" required><option value="">Loading classes…</option></select></label>
          <label class="exam-field">Subject<select name="subject" required disabled><option value="">Select a class first</option></select><span class="exam-field-help">Subjects are listed for the selected class and linked automatically.</span></label>
          <label class="exam-field">Duration (minutes)<input name="durationMinutes" type="number" min="1" max="600" value="60" required></label>
          <label class="exam-field">Maximum attempts<input name="maxAttempts" type="number" min="1" max="10" value="5" required></label>
          <label class="exam-field">Available from<input name="startDate" type="datetime-local" required></label>
          <label class="exam-field">Available until<input name="endDate" type="datetime-local" required></label>
          <label class="exam-field exam-field-wide">Instructions<textarea name="instructions" rows="3" maxlength="5000" placeholder="Instructions students will see before starting"></textarea></label>
        </div>
        <fieldset class="exam-question-fieldset">
          <legend>Questions</legend>
          <p class="exam-form-hint">Choose active questions for the selected subject and set the marks for each one.</p>
          <div class="exam-question-list" data-question-list><p class="exam-form-hint">Choose a session, term, class and subject first.</p></div>
        </fieldset>
        <div class="exam-form-options">
          <label><input name="randomizeQuestions" type="checkbox"> Randomize question order</label>
          <label><input name="randomizeOptions" type="checkbox"> Randomize answer options</label>
        </div>
        <div class="exam-form-message" role="status" aria-live="polite" data-form-message></div>
        <div class="exam-form-actions">
          <button type="reset" class="exam-button-secondary">Clear form</button>
          <button type="submit" class="exam-button-primary" data-submit>Save draft exam</button>
        </div>
      </form>`;
  }

  function installForm(root) {
    root.innerHTML = formMarkup();
    const form = root.querySelector("form");
    const sessionSelect = form.elements.academicSession;
    const termSelect = form.elements.term;
    const classSelect = form.elements.class;
    const subjectSelect = form.elements.subject;
    const questionList = form.querySelector("[data-question-list]");
    const message = form.querySelector("[data-form-message]");

    function setMessage(text, type = "") {
      message.textContent = text;
      message.dataset.type = type;
    }

    async function loadQuestions() {
      questionList.innerHTML = '<p class="exam-form-hint">Loading approved questions…</p>';
      const query = new URLSearchParams({
        status: "ACTIVE", subjectOffering: subjectSelect.value,
        academicSession: sessionSelect.value, term: termSelect.value, limit: "100",
      });
      try {
        const selectionKey = `${sessionSelect.value}:${termSelect.value}:${classSelect.value}:${subjectSelect.value}`;
        const result = await request(`/question?${query}`);
        const currentSelectionKey = `${sessionSelect.value}:${termSelect.value}:${classSelect.value}:${subjectSelect.value}`;
        if (selectionKey !== currentSelectionKey) return;
        const questions = list(result, ["questions"]);
        if (!questions.length) {
          questionList.innerHTML = '<p class="exam-form-hint">No active questions are available for this subject, session and term.</p>';
          return;
        }
        questionList.innerHTML = questions.map((question) => `
          <label class="exam-question-option">
            <input type="checkbox" data-question-id="${escapeHtml(question._id || question.id)}">
            <span class="exam-question-text">${escapeHtml(question.questionText || question.text || "Question")}</span>
            <span class="exam-question-type">${escapeHtml(question.questionType || "")}</span>
            <span class="exam-question-marks"><input type="number" min="1" step="1" value="${Math.max(1, Number(question.marks) || 1)}" aria-label="Marks" disabled> marks</span>
          </label>`).join("");
        questionList.querySelectorAll('[data-question-id]').forEach((checkbox) => {
          checkbox.addEventListener("change", () => {
            checkbox.closest(".exam-question-option").querySelector(".exam-question-marks input").disabled = !checkbox.checked;
          });
        });
      } catch (error) {
        questionList.innerHTML = `<p class="exam-form-error">${escapeHtml(error.message)}</p>`;
      }
    }

    async function loadMetadata() {
      const teacherScopePromise = principalPage ? null : loadTeacherScope();
      const [sessionData, termData, classData, offeringData, teacherScope] = await Promise.all([
        loadList("/session?limit=100", ["sessions", "academicSessions"], "Academic sessions"),
        loadList("/term?limit=100", ["terms"], "Terms"),
        principalPage
          ? loadList("/class?limit=100&status=ACTIVE", ["classes"], "Classes")
          : teacherScopePromise.then((scope) => scope.classes),
        principalPage
          ? loadList("/offering?limit=100&status=ACTIVE", ["offerings", "subjectOfferings"], "Subjects")
          : teacherScopePromise.then((scope) => scope.offerings),
        teacherScopePromise || Promise.resolve(null),
      ]);

      const terms = termData.items;
      const offerings = offeringData.items;
      const failures = [sessionData, termData, classData, offeringData]
        .map((result) => result.error)
        .filter(Boolean);

      sessionSelect.innerHTML = sessionData.error
        ? option("", "Could not load sessions")
        : option("", sessionData.items.length ? "Select academic session" : "No academic sessions found") +
          sessionData.items.map((item) => option(item._id || item.id, item.name)).join("");

      classSelect.innerHTML = classData.error
        ? option("", "Could not load classes")
        : option("", classData.items.length ? "Select class" : (classData.emptyLabel || "No active classes found")) +
          classData.items.map((item) => option(item._id || item.id, item.name || item.code)).join("");

      const notices = [...failures, teacherScope?.notice].filter(Boolean);
      if (notices.length) {
        setMessage(notices.join(" "), "error");
      } else {
        setMessage("");
      }

      sessionSelect.addEventListener("change", () => {
        const selectedId = sessionSelect.value;
        const eligible = terms.filter((item) =>
          String(item.academicSession?._id || item.academicSession) === selectedId,
        );
        termSelect.innerHTML = option("", eligible.length ? "Select term" : "No terms for this session") +
          eligible.map((item) => option(item._id || item.id, formatTermName(item.name))).join("");
        termSelect.disabled = !selectedId || Boolean(termData.error);
        subjectSelect.value = "";
        questionList.innerHTML = '<p class="exam-form-hint">Choose a term, class and subject first.</p>';
      });

      classSelect.addEventListener("change", () => {
        const selectedId = classSelect.value;
        const eligible = offerings.filter((item) =>
          String(item.class?._id || item.class) === selectedId,
        );
        subjectSelect.innerHTML = offeringData.error
          ? option("", "Could not load subjects")
          : option("", eligible.length ? "Select subject" : "No subjects for this class") +
            eligible.map((item) => {
              const subject = item.subject?.name || "Subject";
              const code = item.subject?.code;
              return option(item._id || item.id, code ? `${subject} (${code})` : subject);
            }).join("");
        subjectSelect.disabled = !selectedId || Boolean(offeringData.error) || eligible.length === 0;
        questionList.innerHTML = '<p class="exam-form-hint">Choose a subject to load its active questions.</p>';
      });

      [sessionSelect, termSelect, subjectSelect].forEach((select) => {
        select.addEventListener("change", () => {
          if (sessionSelect.value && termSelect.value && classSelect.value && subjectSelect.value) {
            loadQuestions();
          }
        });
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("");
      const selectedQuestions = [...questionList.querySelectorAll("[data-question-id]:checked")];
      if (!selectedQuestions.length) {
        setMessage("Select at least one active question.", "error");
        return;
      }
      const values = new FormData(form);
      const startDate = new Date(values.get("startDate"));
      const endDate = new Date(values.get("endDate"));
      if (endDate <= startDate) {
        setMessage("The end time must be after the start time.", "error");
        return;
      }
      const questions = selectedQuestions.map((checkbox, index) => ({
        question: checkbox.dataset.questionId,
        marks: Number(checkbox.closest(".exam-question-option").querySelector(".exam-question-marks input").value),
        order: index + 1,
      }));
      const payload = {
        title: values.get("title").trim(), instructions: values.get("instructions").trim(),
        academicSession: values.get("academicSession"), term: values.get("term"),
        class: values.get("class"),
        // The visible subject select stores the matching offering ID required by the API.
        subjectOffering: values.get("subject"),
        questions, durationMinutes: Number(values.get("durationMinutes")),
        maxAttempts: Number(values.get("maxAttempts")),
        startDate: startDate.toISOString(), endDate: endDate.toISOString(),
        randomizeQuestions: form.elements.randomizeQuestions.checked,
        randomizeOptions: form.elements.randomizeOptions.checked,
      };
      const submit = form.querySelector("[data-submit]");
      submit.disabled = true;
      submit.textContent = "Saving…";
      try {
        await request("/exam", { method: "POST", body: JSON.stringify(payload) });
        form.reset();
        termSelect.disabled = true;
        subjectSelect.disabled = true;
        questionList.innerHTML = '<p class="exam-form-hint">Choose a session, term, class and subject first.</p>';
        window.setTimeout(() => {
          setMessage("Exam saved as a draft. A Principal can schedule or publish it from Exam Control.", "success");
        }, 0);
        if (principalPage && window.refreshPrincipalExamControl) window.refreshPrincipalExamControl();
      } catch (error) {
        setMessage(error.message || "Could not save the exam.", "error");
      } finally {
        submit.disabled = false;
        submit.textContent = "Save draft exam";
      }
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        termSelect.disabled = true;
        subjectSelect.disabled = true;
        questionList.innerHTML = '<p class="exam-form-hint">Choose a session, term, class and subject first.</p>';
        setMessage("");
      });
    });

    loadMetadata();
  }

  function initPrincipal() {
    const trigger = document.getElementById("openCreateExam");
    const modal = document.getElementById("createExamModal");
    const root = document.getElementById("createExamFormRoot");
    if (!trigger || !modal || !root) return;
    installForm(root);
    const close = () => { modal.hidden = true; document.body.classList.remove("exam-modal-open"); };
    trigger.addEventListener("click", () => { modal.hidden = false; document.body.classList.add("exam-modal-open"); });
    modal.querySelectorAll("[data-close-create-exam]").forEach((item) => item.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
  }

  function initTeacher() {
    const root = document.getElementById("createExamFormRoot");
    if (root) installForm(root);
  }

  document.addEventListener("DOMContentLoaded", principalPage ? initPrincipal : initTeacher);
})();
