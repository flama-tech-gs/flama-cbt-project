//backend/teacherStudentScores.js


(() => {
  "use strict";

  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;
  const API_URL = `${API_BASE}/teacher-dashboard/student-scores`;

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const fallbackAvatar =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e8edf3"/><circle cx="40" cy="30" r="14" fill="#9aa8b8"/><path d="M12 76c2-18 13-26 28-26s26 8 28 26" fill="#9aa8b8"/></svg>'
    );

  const state = {
    classes: [],
    subjects: [],
    terms: [],
    sessions: [],
    selectedClass: "all",
    selectedSubject: "all",
    selectedTerm: "all",
    selectedSession: "all",
    requestNumber: 0,
  };

  const el = {
    logo: document.querySelector(".logo-area img"),
    schoolName: document.querySelector(".logo-area h2"),
    tagline: document.querySelector(".logo-area p"),
    teacherImage: document.querySelector(".teacher-profile img"),
    teacherName: document.querySelector(".teacher-profile h3"),
    teacherRole: document.querySelector(".teacher-profile p"),
    classTabs: document.getElementById("classTabs"),
    table: document.getElementById("scoresTable"),
    filterGroups: [
      ...document.querySelectorAll(".filters .filter-group"),
    ],
    headings: document.querySelectorAll(".page-heading h2"),
    statCards: document.querySelectorAll(".stats-grid .stat-card"),
  };

  const designedLogoSrc = el.logo?.getAttribute("src") || "";

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function unwrap(body) {
    let value = body;

    for (let i = 0; i < 5; i += 1) {
      if (
        value &&
        typeof value === "object" &&
        Object.prototype.hasOwnProperty.call(value, "data")
      ) {
        value = value.data;
      } else {
        break;
      }
    }

    return value;
  }

  async function apiGet(url) {
    const headers = { Accept: "application/json" };

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message || body.error || `Request failed (${response.status})`
      );
    }

    return unwrap(body);
  }

  function applyBranding(branding) {
    const school = branding?.school || {};
    const teacher = branding?.teacher || {};

    if (school.name && el.schoolName) {
      el.schoolName.textContent = school.name;
    }

    // Retain the designed HTML logo unless the API has a school logo.
    const schoolLogoUrl =
      typeof school.logo === "string" ? school.logo.trim() : "";

    if (el.logo && schoolLogoUrl) {
      el.logo.onerror = () => {
        el.logo.onerror = null;
        if (designedLogoSrc) el.logo.src = designedLogoSrc;
      };
      el.logo.src = schoolLogoUrl;
      el.logo.alt = school.name ? `${school.name} logo` : "School logo";
    }

    if (el.tagline) el.tagline.textContent = "Teacher Portal";
    if (el.teacherName) {
      el.teacherName.textContent = teacher.name || "Teacher";
    }
    if (el.teacherRole) {
      el.teacherRole.textContent =
        teacher.department || teacher.employeeId || "Teacher";
    }

    if (el.teacherImage) {
      el.teacherImage.onerror = () => {
        el.teacherImage.onerror = null;
        el.teacherImage.src = fallbackAvatar;
      };
      el.teacherImage.src = teacher.avatar || fallbackAvatar;
    }
  }

  function copyInputStyle(input, select) {
    const style = window.getComputedStyle(input);

    [
      "display",
      "width",
      "minWidth",
      "maxWidth",
      "height",
      "boxSizing",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "marginTop",
      "marginBottom",
      "marginLeft",
      "marginRight",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "borderTopStyle",
      "borderRightStyle",
      "borderBottomStyle",
      "borderLeftStyle",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "borderRadius",
      "backgroundColor",
      "color",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "textAlign",
    ].forEach((property) => {
      if (style[property]) select.style[property] = style[property];
    });

    // Use the native select control so the dropdown arrow is visible.
    select.style.appearance = "auto";
    select.style.webkitAppearance = "menulist";
    select.style.cursor = "pointer";
  }

  function makeSelect(groupIndex, id, labelText) {
    const group = el.filterGroups[groupIndex];
    if (!group) return null;

    const existing = group.querySelector(`#${id}`);
    if (existing) return existing;

    const input = group.querySelector("input");
    if (!input) return null;

    const select = document.createElement("select");
    select.id = id;
    select.name = id;
    select.className = input.className;
    select.setAttribute("aria-label", labelText);

    copyInputStyle(input, select);
    input.replaceWith(select);

    return select;
  }

  const filters = {
    subject: makeSelect(0, "subjectFilter", "Subject"),
    term: makeSelect(1, "termFilter", "Term"),
    session: makeSelect(2, "sessionFilter", "Session"),
  };

  function getFilterItems(key) {
    if (key === "subject") return state.subjects;
    if (key === "term") return state.terms;
    return state.sessions;
  }

  function getFilterState(key) {
    if (key === "subject") return state.selectedSubject;
    if (key === "term") return state.selectedTerm;
    return state.selectedSession;
  }

  function setFilterState(key, value) {
    if (key === "subject") state.selectedSubject = value;
    else if (key === "term") state.selectedTerm = value;
    else state.selectedSession = value;
  }

  function populateFilter(key, allLabel) {
    const select = filters[key];
    if (!select) return;

    const items = getFilterItems(key);
    const previousValue = getFilterState(key);

    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = allLabel;
    select.appendChild(allOption);

    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });

    const exists = [...select.options].some(
      (option) => option.value === previousValue
    );

    select.value = exists ? previousValue : "all";
    setFilterState(key, select.value);

    if (items.length === 0) {
      console.warn(
        `No ${key} filter options were returned by ${API_URL}`
      );
    }
  }

  function populateFilters() {
    populateFilter("subject", "All subjects");
    populateFilter("term", "All terms");
    populateFilter("session", "All sessions");
  }

  function bindFilters() {
    for (const key of ["subject", "term", "session"]) {
      const select = filters[key];
      if (!select || select.dataset.bound === "true") continue;

      select.addEventListener("change", () => {
        setFilterState(key, select.value);
        loadScores();
      });

      select.dataset.bound = "true";
    }
  }

  function renderClassTabs() {
    if (!el.classTabs) return;

    el.classTabs.innerHTML = [
      `<button type="button"
        class="class-tab ${
          state.selectedClass === "all" ? "active" : ""
        }"
        data-class-id="all">All classes</button>`,
      ...state.classes.map(
        (item) => `
          <button type="button"
            class="class-tab ${
              state.selectedClass === item.id ? "active" : ""
            }"
            data-class-id="${esc(item.id)}">
            ${esc(item.name)}
          </button>
        `
      ),
    ].join("");
  }

  function bindClassTabs() {
    if (!el.classTabs || el.classTabs.dataset.bound === "true") return;

    el.classTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-class-id]");
      if (!button) return;

      state.selectedClass = button.dataset.classId || "all";
      renderClassTabs();
      loadScores();
    });

    el.classTabs.dataset.bound = "true";
  }

  function gradeFor(percent) {
    if (percent >= 80) {
      return {
        grade: "A",
        remark: "Excellent",
        gradeClass: "a",
        remarkClass: "excellent",
      };
    }

    if (percent >= 70) {
      return {
        grade: "B",
        remark: "Good",
        gradeClass: "b",
        remarkClass: "good",
      };
    }

    if (percent >= 50) {
      return {
        grade: "C",
        remark: "Fair",
        gradeClass: "c",
        remarkClass: "fair",
      };
    }

    return {
      grade: "D",
      remark: "Poor",
      gradeClass: "d",
      remarkClass: "poor",
    };
  }

  function renderRows(rows) {
    if (!el.table) return;

    if (!rows.length) {
      el.table.innerHTML = `
        <tr>
          <td colspan="6">No student scores found for these filters.</td>
        </tr>
      `;
      return;
    }

    el.table.innerHTML = rows
      .map((student, index) => {
        const hasScore = Number(student.totalMarks) > 0;
        const percentage = Number(student.percentage) || 0;
        const grade = gradeFor(percentage);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${esc(student.name)}</td>
            <td>
              ${
                hasScore
                  ? `${Number(student.marksObtained)} / ${Number(student.totalMarks)}`
                  : "—"
              }
            </td>
            <td>${hasScore ? `${percentage}%` : "—"}</td>
            <td>
              <span class="grade ${hasScore ? grade.gradeClass : ""}">
                ${hasScore ? grade.grade : "—"}
              </span>
            </td>
            <td>
              <span class="remark ${hasScore ? grade.remarkClass : ""}">
                ${hasScore ? grade.remark : "No result"}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function renderSummary(summary, selection) {
    const cards = [...(el.statCards || [])];
    if (cards.length < 4) return;

    const setValue = (index, value) => {
      const heading = cards[index]?.querySelector("h2");
      if (heading) heading.textContent = value;
    };

    setValue(0, String(summary.totalStudents ?? 0));
    setValue(1, `${Number(summary.classAverage) || 0}%`);

    setValue(
      2,
      summary.highestScore
        ? `${summary.highestScore.score} / ${summary.highestScore.total}`
        : "—"
    );

    setValue(
      3,
      summary.lowestScore
        ? `${summary.lowestScore.score} / ${summary.lowestScore.total}`
        : "—"
    );

    const className =
      state.selectedClass === "all"
        ? "All Classes"
        : selection.className ||
          state.classes.find((item) => item.id === state.selectedClass)?.name ||
          "Class";

    const subjectName =
      state.selectedSubject === "all"
        ? "All subjects"
        : state.subjects.find(
            (item) => item.id === state.selectedSubject
          )?.name || "Subject";

    const termName =
      state.selectedTerm === "all"
        ? "All terms"
        : state.terms.find((item) => item.id === state.selectedTerm)?.name ||
          "Term";

    const sessionName =
      state.selectedSession === "all"
        ? "All sessions"
        : state.sessions.find(
            (item) => item.id === state.selectedSession
          )?.name || "Session";

    if (el.headings[0]) {
      el.headings[0].textContent = `${className} – Result Sheet`;
    }

    if (el.headings[1]) {
      el.headings[1].textContent =
        `${subjectName} – Objective Scores (${termName}, ${sessionName})`;
    }
  }

  function showError(message) {
    if (!el.table) return;

    el.table.innerHTML = `
      <tr>
        <td colspan="6">${esc(message)}</td>
      </tr>
    `;
  }

  async function loadScores() {
    if (!token) {
      showError("Your teacher session has expired. Please sign in again.");
      return;
    }

    const currentRequest = ++state.requestNumber;

    if (el.table) {
      el.table.innerHTML =
        '<tr><td colspan="6">Loading scores…</td></tr>';
    }

    const url = new URL(API_URL);

    if (state.selectedClass !== "all") {
      url.searchParams.set("classId", state.selectedClass);
    }
    if (state.selectedSubject !== "all") {
      url.searchParams.set("subjectId", state.selectedSubject);
    }
    if (state.selectedTerm !== "all") {
      url.searchParams.set("termId", state.selectedTerm);
    }
    if (state.selectedSession !== "all") {
      url.searchParams.set("sessionId", state.selectedSession);
    }

    try {
      const data = await apiGet(url.toString());

      if (currentRequest !== state.requestNumber) return;

      applyBranding(data.branding);

      if (data.filters) {
        state.classes = data.filters.classes || [];
        state.subjects = data.filters.subjects || [];
        state.terms = data.filters.terms || [];
        state.sessions = data.filters.sessions || [];

        populateFilters();
        renderClassTabs();
      }

      renderSummary(data.summary || {}, data.selection || {});
      renderRows(data.rows || []);
    } catch (error) {
      if (currentRequest !== state.requestNumber) return;

      console.error("Could not load teacher student scores:", error);
      showError(error.message || "Could not load student scores.");
    }
  }

  function initialize() {
    if (!el.table) return;

    bindFilters();
    bindClassTabs();
    loadScores();
    window.lucide?.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();