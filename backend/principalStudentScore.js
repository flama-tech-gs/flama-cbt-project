//backend/principalStudentScore.js

(() => {
  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const TOKEN_KEY = "principalAccessToken";

  const elements = {
    schoolName: document.querySelector("#schoolName"),
    schoolLogo: document.querySelector("#schoolLogo"),
    principalName: document.querySelector("#principalName"),
    principalImage: document.querySelector("#principalImage"),

    classFilter: document.querySelector("#classFilter"),
    termFilter: document.querySelector("#termFilter"),
    subjectFilter: document.querySelector("#subjectFilter"),

    searchInput: document.querySelector(".search-box input"),
    filterButton: document.querySelector(".filter-btn"),
    table: document.querySelector("#scoresTable"),
  };

  let searchTimer;

  function getToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      window.location.assign("./index.html");
      throw new Error("Your login session has expired. Please log in again.");
    }

    return token;
  }

  async function requestJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    return result;
  }

  function unwrap(response) {
    let value = response;

    for (let i = 0; i < 5; i += 1) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.data !== undefined
      ) {
        value = value.data;
      } else {
        break;
      }
    }

    return value;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  }

  function setText(element, value, fallback = "—") {
    if (element) element.textContent = value || fallback;
  }

  function populateSelect(select, items, placeholder) {
    if (!(select instanceof HTMLSelectElement)) return;

    const previousValue = select.value;
    select.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = placeholder;
    select.appendChild(allOption);

    for (const item of items || []) {
      const id = item.id || item._id;
      const name = item.name || item.label;

      if (!id || !name) continue;

      const option = document.createElement("option");
      option.value = String(id);
      option.textContent = name;
      select.appendChild(option);
    }

    if ([...select.options].some((option) => option.value === previousValue)) {
      select.value = previousValue;
    }
  }

  async function loadSchoolAndPrincipal() {
    const [schoolResponse, profileResponse] = await Promise.all([
      requestJson(`${API_BASE}/tenant/auth/school-info`),
      requestJson(`${API_BASE}/principal/profile`),
    ]);

    const schoolData = unwrap(schoolResponse);
    const profileData = unwrap(profileResponse);

    const school = schoolData?.school || schoolData || {};
    const principal = profileData?.principal || profileData || {};

    setText(elements.schoolName, school.name);

    const schoolLogo =
      school.logo ||
      school.image ||
      school.logoUrl ||
      school.images?.[0]?.url;

    if (elements.schoolLogo && schoolLogo) {
      elements.schoolLogo.src = schoolLogo;
      elements.schoolLogo.alt = `${school.name || "School"} logo`;
    }

    const principalName =
      principal.fullName ||
      principal.name ||
      [
        principal.title,
        principal.firstName,
        principal.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    setText(elements.principalName, principalName);

    const principalImage =
      principal.profileImage ||
      principal.avatar ||
      principal.image;

    if (elements.principalImage && principalImage) {
      elements.principalImage.src = principalImage;
      elements.principalImage.alt = principalName
        ? `${principalName} profile`
        : "Principal profile";
    }
  }

  async function loadFilters() {
    const response = await requestJson(
      `${API_BASE}/principal/student-scores/filters`
    );

    const data = unwrap(response) || {};

    populateSelect(
      elements.classFilter,
      data.classes,
      "All Classes"
    );

    populateSelect(
      elements.termFilter,
      data.terms,
      "All Terms"
    );

    populateSelect(
      elements.subjectFilter,
      data.subjects,
      "All Subjects"
    );
  }

  function filterValue(select) {
    const value = String(select?.value || "").trim();

    // Be tolerant of old placeholder options that have no explicit value.
    if (!value || /^all\b/i.test(value)) {
      return "";
    }

    return value;
  }

  function buildScoresUrl() {
    const params = new URLSearchParams();

    const classId = filterValue(elements.classFilter);
    const termId = filterValue(elements.termFilter);
    const subjectId = filterValue(elements.subjectFilter);
    const search = elements.searchInput?.value.trim() || "";

    if (classId) params.set("classId", classId);
    if (termId) params.set("termId", termId);
    if (subjectId) params.set("subjectId", subjectId);
    if (search) params.set("search", search);

    const query = params.toString();

    return `${API_BASE}/principal/student-scores${query ? `?${query}` : ""}`;
  }

  function getLetterGrade(percentage) {
	  if (!Number.isFinite(percentage)) return "—";
	  if (percentage >= 80) return "A";
	  if (percentage >= 70) return "B";
	  if (percentage >= 60) return "C";
	  if (percentage >= 50) return "D";
	  if (percentage >= 40) return "E";
	  return "F";
	}

  function gradeClass(grade) {
    switch (String(grade || "").toUpperCase()) {
      case "A+":
        return "aplus";
      case "A":
        return "a";
      case "B":
        return "b";
      case "C":
        return "c";
      case "E":
        return "e";
      case "F":
        return "f";
      default:
        return "d";
    }
  }

  function renderScores(scores) {
    if (!elements.table) return;

    if (!scores.length) {
      elements.table.innerHTML = `
        <tr>
          <td colspan="7">No student scores found.</td>
        </tr>
      `;
      return;
    }

    elements.table.innerHTML = scores
      .map((student, index) => {
        const percentage = Number(student.percentage);
        const percentageText = Number.isFinite(percentage)
          ? `${percentage.toFixed(2).replace(/\.00$/, "")}%`
          : "—";

        //const grade = student.grade || "—";
        const grade = getLetterGrade(percentage);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(student.studentName || "—")}</td>
            <td>${escapeHtml(student.className || "—")}</td>
            <td>${escapeHtml(student.subjectName || "—")}</td>
            <td class="score">
              ${escapeHtml(student.marksObtained ?? "—")} /
              ${escapeHtml(student.totalMarks ?? "—")}
            </td>
            <td>${escapeHtml(percentageText)}</td>
            <td>
              <span class="grade ${gradeClass(grade)}">
                ${escapeHtml(grade)}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");

    window.lucide?.createIcons();
  }

  async function loadScores() {
    const response = await requestJson(buildScoresUrl());
    const data = unwrap(response) || {};

    renderScores(data.results || []);
  }

  function showError(error) {
    console.error("Could not load principal student scores:", error);

    if (elements.table) {
      elements.table.innerHTML = `
        <tr>
          <td colspan="7">
            ${escapeHtml(error.message || "Could not load student scores.")}
          </td>
        </tr>
      `;
    }
  }

  function bindEvents() {
    elements.filterButton?.addEventListener("click", () => {
      loadScores().catch(showError);
    });

    elements.searchInput?.addEventListener("input", () => {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        loadScores().catch(showError);
      }, 300);
    });
  }

  async function init() {
    bindEvents();

    try {
      await Promise.all([
        loadSchoolAndPrincipal(),
        loadFilters(),
      ]);

      await loadScores();
    } catch (error) {
      showError(error);
    }

    window.lucide?.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();