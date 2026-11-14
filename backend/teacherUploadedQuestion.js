//backend/teacherUploadedQuestion.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");
  const API_URL = `${API_BASE}/teacher-dashboard/uploaded-questions`;

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const fallbackAvatar =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e8edf3"/><circle cx="40" cy="30" r="14" fill="#9aa8b8"/><path d="M12 76c2-18 13-26 28-26s26 8 28 26" fill="#9aa8b8"/></svg>'
    );

  const state = {
    submissions: { pending: [], active: [], past: [] },
    filters: { terms: [], classes: [], subjects: [] },
    termId: "all",
    classId: "all",
    subjectId: "all",
  };

  const el = {
    schoolLogo: document.querySelector(".logo-area img"),
    schoolName: document.querySelector(".logo-area h2"),
    schoolTagline: document.querySelector(".logo-area p"),
    teacherImage: document.querySelector(".teacher-profile img"),
    teacherName: document.querySelector(".teacher-profile h3"),
    teacherRole: document.querySelector(".teacher-profile p"),
    pageHeading: document.querySelector(".page-heading h2"),
    classTabs: document.getElementById("classTabs"),
    termFilter: document.getElementById("termFilter"),
    pendingBody: document.getElementById("pendingBody"),
    activeBody: document.getElementById("activeBody"),
    pastBody: document.getElementById("pastBody"),
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function unwrapResponse(body) {
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

  async function apiGet(url) {
    const headers = { Accept: "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Request failed with status ${response.status}`
      );
    }

    return unwrapResponse(body);
  }

  function setAvatar(image, url) {
    if (!image) return;

    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackAvatar;
    };

    image.src = url || fallbackAvatar;
  }

  function renderBranding(branding) {
    const school = branding?.school || {};
    const teacher = branding?.teacher || {};

    if (school.name && el.schoolName) {
      el.schoolName.textContent = school.name;
    }

    // Preserve the logo already in the HTML when the school has no logo.
    // Only replace it when the API returns a non-empty school logo URL.
    const schoolLogoUrl =
      typeof school.logo === "string" ? school.logo.trim() : "";

    if (el.schoolLogo && schoolLogoUrl) {
      el.schoolLogo.src = schoolLogoUrl;
      el.schoolLogo.alt = school.name
        ? `${school.name} logo`
        : "School logo";

      // If the provided school logo fails to load, retain the HTML's
      // original designed logo instead of using a generated placeholder.
      const designedLogo = el.schoolLogo.getAttribute("src");

      el.schoolLogo.onerror = () => {
        el.schoolLogo.onerror = null;
        if (designedLogo && el.schoolLogo.src !== designedLogo) {
          el.schoolLogo.src = designedLogo;
        }
      };
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

  function ensureSubjectFilter() {
    let select = document.getElementById("subjectFilter");
    if (select || !el.termFilter) return select;

    const label = document.createElement("label");
    label.htmlFor = "subjectFilter";
    label.textContent = "Filter by subject";

    select = document.createElement("select");
    select.id = "subjectFilter";
    select.innerHTML = '<option value="all">All subjects</option>';

    const container = el.termFilter.closest(".question-filter");

    if (container) {
      container.append(label, select);
    } else {
      el.termFilter.insertAdjacentElement("afterend", label);
      label.insertAdjacentElement("afterend", select);
    }

    select.addEventListener("change", () => {
      state.subjectId = select.value;
      renderTables();
    });

    return select;
  }

  function populateSelect(select, items, allLabel, selectedId = "all") {
    if (!select) return;

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

    select.value = [...select.options].some(
      (option) => option.value === selectedId
    )
      ? selectedId
      : "all";
  }

  function renderClassTabs() {
    if (!el.classTabs) return;

    const tabs = [
      `<button type="button"
        class="class-tab ${state.classId === "all" ? "active" : ""}"
        data-class-id="all">All classes</button>`,
      ...state.filters.classes.map(
        (item) => `<button type="button"
          class="class-tab ${
            state.classId === item.id ? "active" : ""
          }"
          data-class-id="${escapeHtml(item.id)}">
          ${escapeHtml(item.name)}
        </button>`
      ),
    ];

    el.classTabs.innerHTML = tabs.join("");

    const selectedClass = state.filters.classes.find(
      (item) => item.id === state.classId
    );

    if (el.pageHeading) {
      el.pageHeading.textContent = selectedClass
        ? `${selectedClass.name} — Uploaded Questions`
        : "All Classes — Uploaded Questions";
    }
  }

  function renderFilters() {
    populateSelect(
      el.termFilter,
      state.filters.terms,
      "All terms",
      state.termId
    );

    populateSelect(
      ensureSubjectFilter(),
      state.filters.subjects,
      "All subjects",
      state.subjectId
    );

    renderClassTabs();
  }

  function matchesFilters(item) {
    return (
      (state.termId === "all" || item.termId === state.termId) &&
      (state.classId === "all" || item.classId === state.classId) &&
      (state.subjectId === "all" || item.subjectId === state.subjectId)
    );
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString();
  }

  function rowsFor(items, emptyMessage) {
    const filtered = items.filter(matchesFilters);

    if (!filtered.length) {
      return `<tr><td colspan="6">${escapeHtml(emptyMessage)}</td></tr>`;
    }

    return filtered
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.subject || "—")}</td>
            <td>${escapeHtml(item.term || "—")}</td>
            <td>${escapeHtml(item.session || "—")}</td>
            <td>${escapeHtml(formatDate(item.uploadedAt))}</td>
            <td>${Number(item.questionCount) || 0}</td>
            <td>${escapeHtml(
              String(item.status || "UNKNOWN").toUpperCase()
            )}</td>
          </tr>
        `
      )
      .join("");
  }

  function renderTables() {
    if (el.pendingBody) {
      el.pendingBody.innerHTML = rowsFor(
        state.submissions.pending,
        "No questions are waiting for approval."
      );
    }

    if (el.activeBody) {
      el.activeBody.innerHTML = rowsFor(
        state.submissions.active,
        "No approved questions were found for the current term or session."
      );
    }

    if (el.pastBody) {
      el.pastBody.innerHTML = rowsFor(
        state.submissions.past,
        "No past question submissions were found."
      );
    }
  }

  function bindEvents() {
    el.termFilter?.addEventListener("change", () => {
      state.termId = el.termFilter.value;
      renderTables();
    });

    el.classTabs?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-class-id]");
      if (!button) return;

      state.classId = button.dataset.classId;
      renderClassTabs();
      renderTables();
    });

    document.querySelectorAll(".accordion-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = document.getElementById(button.dataset.target);
        if (!panel) return;

        const isOpen = panel.classList.toggle("hidden") === false;
        button.classList.toggle("active", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
      });
    });
  }

  function showError(message) {
    [el.pendingBody, el.activeBody, el.pastBody]
      .filter(Boolean)
      .forEach((tbody) => {
        tbody.innerHTML = `<tr><td colspan="6">${escapeHtml(
          message
        )}</td></tr>`;
      });
  }

  async function loadUploadedQuestions() {
    if (!token) {
      showError("Your teacher session has expired. Please sign in again.");
      return;
    }

    try {
      const response = await apiGet(API_URL);

      renderBranding(response.branding);

      state.submissions = {
        pending: response.submissions?.pending || [],
        active: response.submissions?.active || [],
        past: response.submissions?.past || [],
      };

      state.filters = {
        terms: response.filters?.terms || [],
        classes: response.filters?.classes || [],
        subjects: response.filters?.subjects || [],
      };

      renderFilters();
      renderTables();
    } catch (error) {
      console.error("Could not load uploaded questions:", error);
      showError(error.message || "Could not load uploaded questions.");
    }
  }

  function initialize() {
    ensureSubjectFilter();
    bindEvents();
    loadUploadedQuestions();
    window.lucide?.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();