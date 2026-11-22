// This page is retained at its existing URL, but now lists exams instead of questions.
(() => {
  "use strict";

  const API_BASE = window.FLAMA_API_BASE || (
    ["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost")
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : "https://flama.onrender.com/api"
  );
  const token = sessionStorage.getItem("teacherAccessToken") || sessionStorage.getItem("tenantAccessToken");
  const fallbackAvatar = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e8edf3"/><circle cx="40" cy="30" r="14" fill="#9aa8b8"/><path d="M12 76c2-18 13-26 28-26s26 8 28 26" fill="#9aa8b8"/></svg>');
  const state = { exams: [], classId: "all", termId: "all", subjectId: "all" };
  const el = {
    schoolLogo: document.querySelector(".logo-area img"), schoolName: document.querySelector(".logo-area h2"),
    schoolTagline: document.querySelector(".logo-area p"), teacherImage: document.querySelector(".teacher-profile img"),
    teacherName: document.querySelector(".teacher-profile h3"), teacherRole: document.querySelector(".teacher-profile p"),
    pageHeading: document.querySelector(".page-heading h2"), classTabs: document.getElementById("classTabs"),
    pendingBody: document.getElementById("pendingBody"), activeBody: document.getElementById("activeBody"),
    pastBody: document.getElementById("pastBody"), filters: document.querySelector(".question-filter"),
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);

  function unwrapResponse(body) {
    let result = body;
    for (let i = 0; i < 5; i += 1) {
      if (result && typeof result === "object" && Object.prototype.hasOwnProperty.call(result, "data")) result = result.data;
      else break;
    }
    return result;
  }

  async function loadExams() {
    if (!token) throw new Error("Your teacher session has expired. Please sign in again.");
    const response = await fetch(`${API_BASE}/teacher-dashboard/exams`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.error || `Request failed with status ${response.status}`);
    return unwrapResponse(body);
  }

  function setAvatar(image, url) {
    if (!image) return;
    image.onerror = () => { image.onerror = null; image.src = fallbackAvatar; };
    image.src = url || fallbackAvatar;
  }

  function renderBranding(branding) {
    const school = branding?.school || {};
    const teacher = branding?.teacher || {};
    if (school.name && el.schoolName) el.schoolName.textContent = school.name;
    const logo = typeof school.logo === "string" ? school.logo.trim() : "";
    if (logo && el.schoolLogo) {
      const designedLogo = el.schoolLogo.getAttribute("src");
      el.schoolLogo.src = logo;
      el.schoolLogo.alt = `${school.name || "School"} logo`;
      el.schoolLogo.onerror = () => { el.schoolLogo.onerror = null; if (designedLogo) el.schoolLogo.src = designedLogo; };
    }
    if (el.schoolTagline) el.schoolTagline.textContent = "Teacher Portal";
    if (el.teacherName) el.teacherName.textContent = teacher.name || "Teacher";
    if (el.teacherRole) el.teacherRole.textContent = teacher.department || teacher.employeeId || "Teacher";
    setAvatar(el.teacherImage, teacher.avatar);
  }

  function uniqueFilterOptions(key, labelKey) {
    return [...new Map(state.exams.filter((exam) => exam[key]).map((exam) => [exam[key], exam[labelKey]])).entries()]
      .map(([id, name]) => ({ id, name }));
  }

  function ensureSelect(id, labelText, allText) {
    let select = document.getElementById(id);
    if (select) return select;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;
    select = document.createElement("select");
    select.id = id;
    select.innerHTML = `<option value="all">${escapeHtml(allText)}</option>`;
    el.filters?.append(label, select);
    select.addEventListener("change", () => {
      const field = { termFilter: "termId", subjectFilter: "subjectId" }[id];
      state[field] = select.value;
      renderTables();
    });
    return select;
  }

  function populateSelect(select, items, allLabel, selectedId) {
    if (!select) return;
    select.replaceChildren(new Option(allLabel, "all"));
    items.forEach((item) => select.add(new Option(item.name, item.id)));
    select.value = [...select.options].some((option) => option.value === selectedId) ? selectedId : "all";
  }

  function renderClassTabs() {
    if (!el.classTabs) return;
    const classes = uniqueFilterOptions("classId", "className");
    el.classTabs.innerHTML = [
      `<button type="button" class="class-tab ${state.classId === "all" ? "active" : ""}" data-class-id="all">All classes</button>`,
      ...classes.map((item) => `<button type="button" class="class-tab ${state.classId === item.id ? "active" : ""}" data-class-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`),
    ].join("");
    const selected = classes.find((item) => item.id === state.classId);
    if (el.pageHeading) el.pageHeading.textContent = selected ? `${selected.name} — Uploaded Questions` : "All Classes — Uploaded Questions";
  }

  function matchesFilters(exam) {
    return (state.classId === "all" || exam.classId === state.classId)
      && (state.termId === "all" || exam.termId === state.termId)
      && (state.subjectId === "all" || exam.subjectId === state.subjectId);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  }

  function rowsFor(category, emptyMessage) {
    const rows = state.exams.filter((exam) => exam.category === category && matchesFilters(exam));
    if (!rows.length) return `<tr><td colspan="8">${escapeHtml(emptyMessage)}</td></tr>`;
    return rows.map((exam) => `<tr>
      <td>${escapeHtml(exam.title)}</td><td>${escapeHtml(exam.className)}</td>
      <td>${escapeHtml(exam.subject)}</td><td>${escapeHtml(exam.term)}</td>
      <td>${escapeHtml(exam.session)}</td><td>${escapeHtml(formatDate(exam.createdAt))}</td>
      <td>${Number(exam.questionCount) || 0}</td><td>${escapeHtml(exam.status)}</td>
    </tr>`).join("");
  }

  function renderTables() {
    if (el.pendingBody) el.pendingBody.innerHTML = rowsFor("pending", "No exams are waiting for approval.");
    if (el.activeBody) el.activeBody.innerHTML = rowsFor("active", "No active exams match these filters.");
    if (el.pastBody) el.pastBody.innerHTML = rowsFor("past", "No past exams match these filters.");
  }

  function showError(message) {
    [el.pendingBody, el.activeBody, el.pastBody].filter(Boolean).forEach((tbody) => {
      tbody.innerHTML = `<tr><td colspan="8">${escapeHtml(message)}</td></tr>`;
    });
  }

  function bindEvents() {
    el.classTabs?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-class-id]");
      if (!button) return;
      state.classId = button.dataset.classId;
      renderClassTabs();
      renderTables();
    });
    document.querySelectorAll(".accordion-btn").forEach((button) => button.addEventListener("click", () => {
      const panel = document.getElementById(button.dataset.target);
      if (!panel) return;
      const isOpen = panel.classList.toggle("hidden") === false;
      button.classList.toggle("active", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
    }));
  }

  async function initialize() {
    bindEvents();
    try {
      const response = await loadExams();
      renderBranding(response.branding);
      state.exams = response.exams || [];
      const terms = uniqueFilterOptions("termId", "term");
      const subjects = uniqueFilterOptions("subjectId", "subject");
      populateSelect(document.getElementById("termFilter"), terms, "All terms", state.termId);
      populateSelect(ensureSelect("subjectFilter", "Filter by subject", "All subjects"), subjects, "All subjects", state.subjectId);
      document.getElementById("termFilter")?.addEventListener("change", (event) => { state.termId = event.target.value; renderTables(); });
      renderClassTabs();
      renderTables();
    } catch (error) {
      console.error("Could not load teacher exams:", error);
      showError(error.message || "Could not load exams.");
    }
    window.lucide?.createIcons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
