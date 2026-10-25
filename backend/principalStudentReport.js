//backend/principalStudentReport.js

(() => {
  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const TOKEN_KEY = "principalAccessToken";

  function token() {
    const value = sessionStorage.getItem(TOKEN_KEY);
    if (!value) {
      window.location.assign("../index.html");
      throw new Error("Your session has expired. Please log in again.");
    }
    return value;
  }

  async function getJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token()}`,
      },
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || `Request failed (${response.status})`);
    }
    return body;
  }

  function unwrap(value) {
    let current = value;
    for (let i = 0; i < 5; i += 1) {
      if (current && !Array.isArray(current) && current.data !== undefined) {
        current = current.data;
      } else {
        break;
      }
    }
    return current;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function gradeClass(grade) {
    switch (grade) {
      case "A": return "a";
      case "B": return "b";
      case "C": return "c";
      default: return "d";
    }
  }

  function setBranding(data) {
    const logoArea = document.querySelector(".logo-area");
    const schoolImage = logoArea?.querySelector("img");
    const schoolHeading = logoArea?.querySelector("h2");

    if (schoolHeading && data.school?.name) {
      schoolHeading.textContent = data.school.name;
    }
    if (schoolImage && data.school?.logo) {
      schoolImage.src = data.school.logo;
    }

    const profile = document.querySelector(".topbar .teacher-profile");
    const principalImage = profile?.querySelector("img");
    const principalHeading = profile?.querySelector("h3");

    if (principalHeading && data.principal?.name) {
      principalHeading.textContent = data.principal.name;
    }
    if (principalImage && data.principal?.image) {
      principalImage.src = data.principal.image;
    }
  }

  function ordinal(number) {
    if (!number) return "—";
    const remainder100 = number % 100;
    if (remainder100 >= 11 && remainder100 <= 13) return `${number}th`;
    switch (number % 10) {
      case 1: return `${number}st`;
      case 2: return `${number}nd`;
      case 3: return `${number}rd`;
      default: return `${number}th`;
    }
  }

  function updateStudentHeader(student) {
    const title = document.querySelector(".topbar-title h1");
    const subtitle = document.querySelector(".topbar-title p");

    if (title) title.textContent = `${student.name} – Full Report`;
    if (subtitle) {
      subtitle.textContent =
        `${student.className} • Access Number ${student.accessCode}`;
    }
  }

  function updateSummary(summary) {
    const items = document.querySelectorAll(".summary-card .summary-item h3");
    if (items.length < 5) return;

    items[0].textContent = `${Number(summary.overallAverage || 0).toFixed(1)}%`;

    const position = summary.classPosition;
    items[1].textContent = position
      ? `${ordinal(position.position)} of ${position.total}`
      : "—";

    items[2].textContent =
      summary.attendance == null ? "Not recorded" : `${summary.attendance}%`;

    items[3].textContent = String(summary.examsTaken || 0);

    items[4].textContent = summary.conduct || "Not recorded";
  }

  function renderReports(reports) {
    const container = document.querySelector("#reportAccordion");
    if (!container) return;

    if (!reports.length) {
      container.innerHTML = "<p>No report records found for this student.</p>";
      return;
    }

    container.innerHTML = reports.map((report, index) => `
      <section class="term-card">
        <div class="term-header ${index === 0 ? "active" : ""}">
          <div class="term-title">
            <h2>${escapeHtml(report.term)} — ${escapeHtml(report.year)}</h2>
            <div class="term-average">
              Overall Average:
              ${Number(report.average || 0).toFixed(1)}%
              • ${report.subjects} subjects
            </div>
          </div>
          <i data-lucide="${index === 0 ? "chevron-up" : "chevron-down"}"></i>
        </div>

        <div class="term-body ${index === 0 ? "" : "hidden"}">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Test Score</th>
                  <th>Exam Score</th>
                  <th>Total</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                ${report.results.map((result) => `
                  <tr>
                    <td>${escapeHtml(result.subject)}</td>
                    <td>—</td>
                    <td>${escapeHtml(result.examScore.obtained)} / ${escapeHtml(result.examScore.total)}</td>
                    <td>${escapeHtml(result.total.obtained)} / ${escapeHtml(result.total.total)}</td>
                    <td>
                      <div class="grade ${gradeClass(result.grade)}">
                        ${escapeHtml(result.grade)}
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `).join("");

    window.lucide?.createIcons();
  }

  async function init() {
    const studentId = new URLSearchParams(window.location.search).get("studentId");

    if (!studentId) {
      console.error("Missing studentId in the URL.");
      return;
    }

    try {
      const response = await getJson(
        `${API_BASE}/principal/student-reports/${encodeURIComponent(studentId)}`
      );

      const data = unwrap(response);
      setBranding(data);
      updateStudentHeader(data.student);
      updateSummary(data.summary);
      renderReports(data.reports || []);
    } catch (error) {
      console.error("Could not load student full report:", error);
      const container = document.querySelector("#reportAccordion");
      if (container) container.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
  }

  // This runs after the existing page script's handler and controls accordions
  // rendered from the API.
  document.addEventListener("click", (event) => {
    const header = event.target.closest(".term-header");
    if (!header) return;

    const body = header.nextElementSibling;
    body?.classList.toggle("hidden");
    header.classList.toggle("active");
    header.querySelector("i")?.setAttribute(
      "data-lucide",
      body?.classList.contains("hidden") ? "chevron-down" : "chevron-up"
    );
    window.lucide?.createIcons();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();