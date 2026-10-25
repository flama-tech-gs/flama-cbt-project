//backend/principalStudentReports.js

(() => {
  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const container = document.querySelector("#reportsAccordion");
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

  function setBranding(data) {
    const school = data.school || {};
    const principal = data.principal || {};

    const logoArea = document.querySelector(".logo-area");
    const schoolImage = logoArea?.querySelector("img");
    const schoolHeading = logoArea?.querySelector("h2");

    if (schoolHeading && school.name) schoolHeading.textContent = school.name;
    if (schoolImage && school.logo) schoolImage.src = school.logo;

    const profile = document.querySelector(".topbar .teacher-profile");
    const principalImage = profile?.querySelector("img");
    const principalHeading = profile?.querySelector("h3");

    if (principalHeading && principal.name) {
      principalHeading.textContent = principal.name;
    }
    if (principalImage && principal.image) {
      principalImage.src = principal.image;
    }
  }

  function render(classes) {
    if (!container) return;

    if (!classes.length) {
      container.innerHTML = "<p>No classes or student reports found.</p>";
      return;
    }

    container.innerHTML = classes.map((section, index) => `
      <section class="report-section">
        <div class="report-header ${index === 0 ? "active" : ""}" data-index="${index}">
          <div class="report-header-left">
            <h2>${escapeHtml(section.class)}</h2>
            <span class="student-count">${section.students} students</span>
          </div>
          <i data-lucide="${index === 0 ? "chevron-up" : "chevron-down"}"></i>
        </div>

        <div class="report-body ${index === 0 ? "" : "hidden"}">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Student Name</th>
                  <th>Term</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${
                  section.records.length
                    ? section.records.map((student, rowIndex) => `
                      <tr>
                        <td>${rowIndex + 1}</td>
                        <td>${escapeHtml(student.name)}</td>
                        <td>${escapeHtml(student.term)}</td>
                        <td>${escapeHtml(student.year)}</td>
                        <td>
                          <div class="status">
                            <span class="status-dot"></span>
                            ${escapeHtml(student.status)}
                          </div>
                        </td>
                        <td>
                          <button
                            class="report-btn"
                            type="button"
                            data-student-id="${escapeHtml(student.studentId)}"
                          >
                            View Full Report
                          </button>
                        </td>
                      </tr>
                    `).join("")
                    : `<tr><td colspan="6">No exam reports for students in this class yet.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `).join("");

    window.lucide?.createIcons();
  }

  async function init() {
    try {
      const response = await getJson(`${API_BASE}/principal/student-reports`);
      const data = unwrap(response) || {};
      setBranding(data);
      render(data.classes || []);
    } catch (error) {
      console.error("Could not load student reports:", error);
      if (container) {
        container.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
      }
    }
  }

  // Capture the click before the existing mock script's generic report handler.
  document.addEventListener("click", (event) => {
    const header = event.target.closest(".report-header");
    if (header) {
      const body = header.nextElementSibling;
      body?.classList.toggle("hidden");
      header.classList.toggle("active");
      const icon = header.querySelector("i");
      icon?.setAttribute(
        "data-lucide",
        body?.classList.contains("hidden") ? "chevron-down" : "chevron-up"
      );
      window.lucide?.createIcons();
      return;
    }

    const button = event.target.closest(".report-btn[data-student-id]");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const url = new URL("./student-report.html", window.location.href);
    url.searchParams.set("studentId", button.dataset.studentId);
    window.location.assign(url);
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();