//backend/principalTheory.js

(() => {
  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const container = document.querySelector("#theoryAccordion");
  const TOKEN_KEY = "principalAccessToken";

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

  async function requestJson(url) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      window.location.assign("./index.html");
      throw new Error("Your login session has expired.");
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    return result;
  }

  function updateBranding(data) {
    const logoArea = document.querySelector(".logo-area");
    const schoolLogo = logoArea?.querySelector("img");
    const schoolName = logoArea?.querySelector("h2");

    if (schoolName && data.school?.name) {
      schoolName.textContent = data.school.name;
    }

    if (schoolLogo && data.school?.logo) {
      schoolLogo.src = data.school.logo;
      schoolLogo.alt = `${data.school.name || "School"} logo`;
    }

    const principalProfile =
      document.querySelector(".topbar .teacher-profile");

    const principalImage = principalProfile?.querySelector("img");
    const principalName = principalProfile?.querySelector("h3");

    if (principalName && data.principal?.name) {
      principalName.textContent = data.principal.name;
    }

    if (principalImage && data.principal?.image) {
      principalImage.src = data.principal.image;
      principalImage.alt = `${data.principal.name || "Principal"} profile`;
    }
  }

  function renderTheory(classes) {
    if (!container) return;

    if (!classes.length) {
      container.innerHTML = "<p>No classes found.</p>";
      return;
    }

    container.innerHTML = classes
      .map((classItem, classIndex) => {
        const classOpen = classIndex === 0;

        return `
          <section class="theory-section">
            <div class="class-header ${classOpen ? "active" : ""}">
              <div class="class-header-left">
                <h2>${escapeHtml(classItem.class)}</h2>
                <span class="subject-count">
                  ${classItem.subjects} subjects
                </span>
              </div>
              <i data-lucide="${classOpen ? "chevron-up" : "chevron-down"}"></i>
            </div>

            <div class="class-body ${classOpen ? "" : "hidden"}">
              ${
                (classItem.subjectList || [])
                  .map((subject, subjectIndex) => {
                    const subjectOpen = classIndex === 0 && subjectIndex === 0;

                    return `
                      <div class="subject-card">
                        <div class="subject-header ${subjectOpen ? "active" : ""}">
                          <div class="subject-left">
                            <h3>${escapeHtml(subject.subject)}</h3>
                            <span class="teacher-name">
                              • ${escapeHtml(subject.teacher)}
                            </span>
                            <span class="student-total">
                              ${subject.students} students
                            </span>
                          </div>
                          <i data-lucide="${subjectOpen ? "chevron-up" : "chevron-down"}"></i>
                        </div>

                        <div class="subject-body ${subjectOpen ? "" : "hidden"}">
                          <div class="table-wrapper">
                            <table>
                              <thead>
                                <tr>
                                  <th>S/N</th>
                                  <th>Student Name</th>
                                  <th>Access Code</th>
                                  <th>Session</th>
                                  <th>Theory Score</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${
                                  subject.records?.length
                                    ? subject.records.map((student, index) => `
                                      <tr>
                                        <td>${index + 1}</td>
                                        <td>${escapeHtml(student.name)}</td>
                                        <td>
                                          <span class="access-code">
                                            ${escapeHtml(student.code)}
                                          </span>
                                        </td>
                                        <td>${escapeHtml(student.session)}</td>
                                        <td><span class="score">—</span></td>
                                        <td>
                                          <button
                                            class="profile-btn"
                                            type="button"
                                            data-student-id="${escapeHtml(student.studentId)}"
                                          >
                                            View Profile
                                          </button>
                                        </td>
                                      </tr>
                                    `).join("")
                                    : `<tr><td colspan="6">No students in this class.</td></tr>`
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("") ||
                `<p>No active subject offerings for this class.</p>`
              }
            </div>
          </section>
        `;
      })
      .join("");

    window.lucide?.createIcons();
  }

  function bindAccordionEvents() {
    document.addEventListener("click", (event) => {
      const classHeader = event.target.closest(".class-header");

      if (classHeader) {
        const body = classHeader.nextElementSibling;
        body?.classList.toggle("hidden");
        classHeader.classList.toggle("active");

        classHeader.querySelector("i")?.setAttribute(
          "data-lucide",
          body?.classList.contains("hidden")
            ? "chevron-down"
            : "chevron-up"
        );

        window.lucide?.createIcons();
        return;
      }

      const subjectHeader = event.target.closest(".subject-header");

      if (subjectHeader) {
        const body = subjectHeader.nextElementSibling;
        body?.classList.toggle("hidden");
        subjectHeader.classList.toggle("active");

        subjectHeader.querySelector("i")?.setAttribute(
          "data-lucide",
          body?.classList.contains("hidden")
            ? "chevron-down"
            : "chevron-up"
        );

        window.lucide?.createIcons();
      }
    });
  }

  async function init() {
    if (!container) return;

    bindAccordionEvents();

    try {
      const response = await requestJson(`${API_BASE}/principal/theory`);
      const data = unwrap(response) || {};

      updateBranding(data);
      renderTheory(data.classes || []);
    } catch (error) {
      console.error("Could not load principal theory data:", error);
      container.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();