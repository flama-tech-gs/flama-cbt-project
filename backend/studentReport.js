//backend/studentReport.js

(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE || (isLocal ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const API_URL = `${API_BASE}/student-dashboard/report`;

  const token =
    sessionStorage.getItem("studentAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const state = {
    classes: [],
    terms: [],
    selectedClassId: "all",
    selectedTermId: "all",
    requestNumber: 0,
  };

  const el = {
    logo: document.querySelector(".school-brand img"),
    schoolName: document.querySelector(".school-brand h2"),
    schoolTagline: document.querySelector(".school-brand p"),
    classButtons: document.querySelector(".class-buttons"),
    termButtons: document.querySelector(".term-buttons"),
    studentImage: document.querySelector(".student-profile img"),
    studentName: document.querySelector(".student-profile h3"),
    studentClass: document.querySelector(".student-profile span"),
    reportCards: [...document.querySelectorAll(".report-card")],
    printButtons: [...document.querySelectorAll(".print-btn")],
  };

  const originalLogo = el.logo?.getAttribute("src") || "";
  const escapeHtml = (value) =>
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

  async function apiGet(url) {
    if (!token) {
      throw new Error("Your student session has expired. Please sign in again.");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Report request failed (${response.status})`
      );
    }

    return unwrap(body);
  }

  function setText(element, value, fallback = "—") {
    if (!element) return;
    element.textContent =
      value === null || value === undefined || value === ""
        ? fallback
        : String(value);
  }

  function renderBranding(school) {
    if (school.name) {
      setText(el.schoolName, school.name);
    }

    if (el.schoolTagline) {
      el.schoolTagline.textContent = "Student Portal";
    }

    const logoUrl =
      typeof school.logo === "string" ? school.logo.trim() : "";

    // Keep the designed logo from the HTML when no school logo is set.
    if (el.logo && logoUrl) {
      el.logo.onerror = () => {
        el.logo.onerror = null;
        if (originalLogo) el.logo.src = originalLogo;
      };

      el.logo.src = logoUrl;
      el.logo.alt = school.name
        ? `${school.name} logo`
        : "School logo";
    }
  }

  function renderStudent(student) {
    setText(el.studentName, student.name, "Student");
    setText(el.studentClass, student.className, "Student");

    if (el.studentImage) {
      el.studentImage.hidden = !student.avatar;
      if (!student.avatar) {
        el.studentImage.removeAttribute("src");
        return;
      }
      el.studentImage.onerror = () => {
        el.studentImage.onerror = null;
        el.studentImage.hidden = true;
        el.studentImage.removeAttribute("src");
      };
      el.studentImage.src = student.avatar;
      el.studentImage.alt = student.name || "Student profile";
    }
  }

  function renderClassButtons(classes, selectedClassId) {
    if (!el.classButtons) return;

    el.classButtons.innerHTML = classes
      .map(
        (item) => `
          <button
            type="button"
            class="${item.id === selectedClassId ? "active" : ""}"
            data-class-id="${escapeHtml(item.id)}">
            ${escapeHtml(item.name)}
          </button>
        `
      )
      .join("");

    el.classButtons.onclick = (event) => {
      const button = event.target.closest("[data-class-id]");
      if (!button) return;

      state.selectedClassId = button.dataset.classId;
      renderClassButtons(state.classes, state.selectedClassId);
      loadReport();
    };
  }

  function renderTermButtons(terms, selectedTermId) {
    if (!el.termButtons) return;

    el.termButtons.innerHTML = terms
      .map((term) => {
        const active = term.id === selectedTermId;

        return `
          <button
            type="button"
            class="dropdown-btn ${active ? "active-term" : ""}"
            data-term-id="${escapeHtml(term.id)}">
            ${escapeHtml(term.name)} Report
            <span>${active ? "⌃" : "⌄"}</span>
          </button>
        `;
      })
      .join("");

    el.termButtons.onclick = (event) => {
      const button = event.target.closest("[data-term-id]");
      if (!button) return;

      state.selectedTermId = button.dataset.termId;
      renderTermButtons(state.terms, state.selectedTermId);
      loadReport();
    };
  }

  function valueOrDash(value) {
    return value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  }

  function scoreCell(score) {
    if (!score || score.score === null || score.score === undefined) {
      return '<td><span aria-hidden="true">—</span></td>';
    }

    return `<td>${escapeHtml(score.score)}</td>`;
  }

  function totalCell(value) {
    return `<td>${escapeHtml(valueOrDash(value))}</td>`;
  }

  function renderScoreTable(report, termName) {
    const table = document.querySelector(".score-table");
    if (!table) return;

    const caption = table.querySelector("caption");
    const tbody = table.querySelector("tbody");
    const tfootRow = table.querySelector("tfoot tr");

    if (caption) {
      caption.textContent = `${termName} scores by subject`;
    }

    const rows = report.rows || [];

    if (tbody) {
      if (!rows.length) {
        tbody.innerHTML = `
          <tr>
            <th scope="row">No subjects</th>
            <td colspan="5">No subject offerings were found.</td>
          </tr>
        `;
      } else {
        tbody.innerHTML = rows
          .map(
            (row) => `
              <tr>
                <th scope="row">${escapeHtml(row.subject)}</th>
                ${scoreCell(row.testObjective)}
                ${scoreCell(row.testTheory)}
                ${scoreCell(row.examObjective)}
                ${scoreCell(row.examTheory)}
                ${totalCell(row.total)}
              </tr>
            `
          )
          .join("");
      }
    }

    if (tfootRow) {
      const totals = report.totals || {};
      tfootRow.innerHTML = `
        <th scope="row">TOTAL</th>
        ${totalCell(totals.testObjective)}
        ${totalCell(totals.testTheory)}
        ${totalCell(totals.examObjective)}
        ${totalCell(totals.examTheory)}
        ${totalCell(totals.total)}
      `;
    }
  }

  function setParagraphValue(container, index, label, value) {
    const paragraphs = container?.querySelectorAll("p");
    const paragraph = paragraphs?.[index];
    if (!paragraph) return;

    paragraph.textContent = `${label}: ${valueOrDash(value)}`;
  }

  function renderReportInfo(student, selection) {
    const firstCard = el.reportCards[0];
    if (!firstCard) return;

    const left = firstCard.querySelector(".left-info");
    const right = firstCard.querySelector(".right-info");

    setParagraphValue(left, 0, "Name", student.name);
    setParagraphValue(left, 1, "Class", student.className);
    setParagraphValue(left, 2, "Department", student.department);
    setParagraphValue(left, 3, "Access Number", student.admissionNumber);

    setParagraphValue(right, 0, "Position", selection.rank);
    setParagraphValue(right, 1, "Session", selection.sessionName);
    setParagraphValue(right, 2, "School days opened", selection.schoolDaysOpened);
    setParagraphValue(right, 3, "Students in class", selection.studentsInClass);

    const footer = firstCard.querySelector(".report-footer");
    const footerDivs = footer?.querySelectorAll(":scope > div");

    if (footerDivs?.[0]) {
      footerDivs[0].innerHTML =
        `<strong>Principal comment:</strong> ${
          escapeHtml(selection.principalComment || "—")
        }`;
    }

    if (footerDivs?.[1]) {
      const signature = footerDivs[1].querySelector("span");
      if (signature) {
        signature.textContent = selection.principalName || "—";
      }
    }
  }

  function renderRatings(report) {
    const firstCard = el.reportCards[0];
    if (!firstCard) return;

    const ratingCards = firstCard.querySelectorAll(".rating-card");
    const groups = [
      report.affective || [],
      report.psychomotor || [],
    ];

    ratingCards.forEach((card, groupIndex) => {
      const ratings = groups[groupIndex] || [];
      const list = card.querySelector("ul");
      if (!list) return;
      list.innerHTML = ratings.length
        ? ratings.map((rating) => `<li>${escapeHtml(rating.name || "Rating")} <span>${escapeHtml(valueOrDash(rating.score))}</span></li>`).join("")
        : "<li>No ratings recorded</li>";
    });
  }

  function showError(message) {
    let error = document.getElementById("reportLoadError");

    if (!error) {
      error = document.createElement("p");
      error.id = "reportLoadError";
      error.setAttribute("role", "alert");
      document.querySelector(".main-content")?.prepend(error);
    }

    error.textContent = message;
  }

  async function loadReport() {
    const requestNumber = ++state.requestNumber;
    const url = new URL(API_URL);

    if (state.selectedClassId !== "all") {
      url.searchParams.set("classId", state.selectedClassId);
    }

    if (state.selectedTermId !== "all") {
      url.searchParams.set("termId", state.selectedTermId);
    }

    try {
      const data = await apiGet(url.toString());

      if (requestNumber !== state.requestNumber) return;

      renderBranding(data.school || {});
      renderStudent(data.student || {});

      state.classes = data.filters?.classes || [];
      state.terms = data.filters?.terms || [];

      const selection = data.selection || {};
      const classId = selection.classId || state.classes[0]?.id || "all";
      const termId = selection.termId || state.terms[0]?.id || "all";

      state.selectedClassId = classId;
      state.selectedTermId = termId;

      renderClassButtons(state.classes, classId);
      renderTermButtons(state.terms, termId);

      const report = data.report || {};

      renderReportInfo(data.student || {}, {
        ...selection,
        schoolDaysOpened: report.schoolDaysOpened,
        principalComment: report.principalComment,
        principalName: report.principalName,
      });

      renderScoreTable(report, selection.termName || "Term");
      renderRatings(report);

      // The page contains a second static sample report card.
      // Hide it so the sample data is not mistaken for the student's report.
      el.reportCards.slice(1).forEach((card) => {
        card.hidden = true;
      });
    } catch (error) {
      if (requestNumber !== state.requestNumber) return;
      console.error("Could not load student report:", error);
      showError(error.message || "Could not load your report.");
    }
  }

  function initialize() {
    const backLink = document.querySelector(".back-btn a");
    if (backLink) backLink.href = "../pages/onboarding";

    el.printButtons.forEach((button) => {
      button.addEventListener("click", () => window.print());
    });

    loadReport();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
