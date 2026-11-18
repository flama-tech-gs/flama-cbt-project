//backend/principalTeacher.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");
  const TEACHERS_URL = `${API_BASE}/principal/teachers`;
  const token = sessionStorage.getItem("principalAccessToken");

  const container = document.getElementById("teachersAccordion");
  const searchInput = document.querySelector(".search-box input");
  const addTeacherButton = document.getElementById("addTeacherBtn");

  let teachers = [];
  let searchText = "";

  if (!container) {
    console.error("Could not find #teachersAccordion.");
    return;
  }

  if (!token) {
    container.textContent =
      "Your principal session has expired. Please sign in again.";
    return;
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return replacements[character];
    });
  }

  function teacherName(teacher) {
    return [
      teacher.title,
      teacher.firstName,
      teacher.otherNames,
      teacher.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Unnamed teacher";
  }

  function teacherId(teacher) {
    return String(teacher.id || teacher._id || "");
  }

  function isActive(teacher) {
    return String(teacher.status || "").toUpperCase() === "ACTIVE";
  }

  async function apiRequest(url, options = {}) {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Request failed (${response.status})`
      );
    }

    let data = body;

    for (
      let i = 0;
      i < 5 &&
      data &&
      typeof data === "object" &&
      data.data !== undefined;
      i += 1
    ) {
      data = data.data;
    }

    return data;
  }

  function updateSchoolAndPrincipal(data) {
    const school = data.school || {};
    const principal = data.principal || {};

    const schoolName = document.querySelector(".logo-area h2");
    const schoolLogo = document.querySelector(".logo-area img");
    const principalName = document.querySelector(".teacher-profile h3");
    const principalImage =
      document.querySelector(".teacher-profile img");

    if (school.name && schoolName) {
      schoolName.textContent = school.name;
    }

    if (school.logo && schoolLogo) {
      schoolLogo.src = school.logo;
    }

    if (principal.name && principalName) {
      principalName.textContent = principal.name;
    }

    if (principal.image && principalImage) {
      principalImage.src = principal.image;
    }
  }

  function teacherSearchText(teacher) {
    const assignmentText = (teacher.subjects || [])
      .flatMap((subject) => [
        subject.name || "",
        subject.code || "",
        ...(subject.classes || []).map(
          (classItem) => classItem.name || ""
        ),
      ])
      .join(" ");

    return [
      teacherName(teacher),
      teacher.employeeId || "",
      teacher.department || "",
      assignmentText,
    ]
      .join(" ")
      .toLowerCase();
  }

  function getVisibleTeachers() {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return teachers;
    }

    return teachers.filter((teacher) =>
      teacherSearchText(teacher).includes(query)
    );
  }

  function renderTeachers() {
    const visibleTeachers = getVisibleTeachers();
    const departments = new Map();

    for (const teacher of visibleTeachers) {
      const department =
        String(teacher.department || "Unassigned Department").trim();

      if (!departments.has(department)) {
        departments.set(department, new Map());
      }

      const subjects =
        teacher.subjects && teacher.subjects.length
          ? teacher.subjects
          : [{ name: "No subject assigned", classes: [] }];

      for (const subject of subjects) {
        const subjectName = subject.name || "Unassigned subject";

        if (!departments.get(department).has(subjectName)) {
          departments.get(department).set(subjectName, []);
        }

        departments
          .get(department)
          .get(subjectName)
          .push({
            ...teacher,
            displayClasses: subject.classes || [],
          });
      }
    }

    if (!visibleTeachers.length) {
      container.innerHTML = `
        <p>
          ${
            searchText
              ? "No teachers match your search."
              : "No teachers found."
          }
        </p>
      `;
      return;
    }

    let rowNumber = 0;

    container.innerHTML = [...departments.entries()]
      .map(([department, subjectGroups], departmentIndex) => {
        const teacherCount = new Set(
          [...subjectGroups.values()]
            .flat()
            .map((teacher) => teacherId(teacher))
        ).size;

        const open = departmentIndex === 0;

        const subjectHtml = [...subjectGroups.entries()]
          .map(([subjectName, subjectTeachers]) => {
            const rows = subjectTeachers
              .map((teacher) => {
                rowNumber += 1;

                const classes =
                  (teacher.displayClasses || [])
                    .map((item) => item.name || item)
                    .join(", ") || "—";

                const active = isActive(teacher);
                const id = escapeHtml(teacherId(teacher));

                return `
                  <tr>
                    <td>${rowNumber}</td>
                    <td>${escapeHtml(teacherName(teacher))}</td>
                    <td>
                      <span class="staff-id">
                        ${escapeHtml(teacher.employeeId || "—")}
                      </span>
                    </td>
                    <td>${escapeHtml(classes)}</td>
                    <td>
                      <span class="status-dot ${
                        active ? "active-dot" : "inactive-dot"
                      }"></span>
                      ${escapeHtml(teacher.status || "UNKNOWN")}
                    </td>
                    <td>
                      <div class="actions">
                        <a
                          class="action-link"
                          href="./teacher-profile.html?teacherId=${encodeURIComponent(
                            teacherId(teacher)
                          )}"
                        >View Profile</a>

                        <a
                          class="action-link"
                          href="#"
                          data-action="reset"
                          data-id="${id}"
                        >Reset Code</a>

                        <a
                          class="action-link"
                          href="#"
                          data-action="password"
                          data-id="${id}"
                        >Change Password</a>

                        ${
                          active
                            ? `
                              <a
                                class="action-link action-danger"
                                href="#"
                                data-action="pause"
                                data-id="${id}"
                              >Pause Account</a>
                            `
                            : `
                              <a
                                class="action-link action-success"
                                href="#"
                                data-action="activate"
                                data-id="${id}"
                              >Reactivate</a>
                            `
                        }
                      </div>
                    </td>
                  </tr>
                `;
              })
              .join("");

            return `
              <div class="teacher-subject-group">
                <h3>${escapeHtml(subjectName)}</h3>
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>Teacher Name</th>
                        <th>Staff ID</th>
                        <th>Classes</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <section class="teacher-section">
            <div class="department-header ${open ? "active" : ""}">
              <div class="department-left">
                <h2>${escapeHtml(department)}</h2>
                <span class="teacher-count">
                  ${teacherCount}
                  ${teacherCount === 1 ? "teacher" : "teachers"}
                </span>
              </div>
              <i data-lucide="${
                open ? "chevron-up" : "chevron-down"
              }"></i>
            </div>

            <div class="department-body ${open ? "" : "hidden"}">
              ${subjectHtml}
            </div>
          </section>
        `;
      })
      .join("");

    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  }

  async function loadTeachers() {
    container.setAttribute("aria-busy", "true");
    container.innerHTML = "<p>Loading teachers…</p>";

    try {
      const data = await apiRequest(TEACHERS_URL);

      teachers = Array.isArray(data.teachers) ? data.teachers : [];

      updateSchoolAndPrincipal(data);
      renderTeachers();
    } catch (error) {
      container.innerHTML = `
        <p>
          ${escapeHtml(error.message)}
          <button type="button" data-action="reload">Retry</button>
        </p>
      `;
    } finally {
      container.removeAttribute("aria-busy");
    }
  }

  // Add New Teacher navigates to the existing add-teacher page.
  addTeacherButton?.addEventListener("click", () => {
    window.location.href = "./add-teacher";
  });

  searchInput?.addEventListener("input", () => {
    searchText = searchInput.value;
    renderTeachers();
  });

  container.addEventListener("click", async (event) => {
    const departmentHeader =
      event.target.closest(".department-header");

    if (departmentHeader) {
      const body = departmentHeader.nextElementSibling;
      const isOpen = body.classList.toggle("hidden") === false;

      departmentHeader.classList.toggle("active", isOpen);

      const icon = departmentHeader.querySelector("[data-lucide]");

      if (icon) {
        icon.setAttribute(
          "data-lucide",
          isOpen ? "chevron-up" : "chevron-down"
        );

        if (window.lucide?.createIcons) {
          window.lucide.createIcons();
        }
      }

      return;
    }

    const link = event.target.closest("[data-action]");
    if (!link) return;

    event.preventDefault();

    const action = link.dataset.action;

    if (action === "reload") {
      await loadTeachers();
      return;
    }

    const teacher = teachers.find(
      (item) => teacherId(item) === String(link.dataset.id)
    );

    if (!teacher) return;

    const teacherUrl =
      `${TEACHERS_URL}/${encodeURIComponent(teacherId(teacher))}`;

    try {
      if (action === "reset") {
        const confirmed = confirm(
          `Generate a temporary password for ${teacherName(teacher)}? ` +
            "The current password will stop working."
        );

        if (!confirmed) return;

        const result = await apiRequest(
          `${teacherUrl}/password/reset`,
          {
            method: "POST",
            body: JSON.stringify({}),
          }
        );

        if (!result.temporaryPassword) {
          throw new Error(
            "The server did not return a temporary password."
          );
        }

        prompt(
          "Copy this temporary password now. It will not be shown again:",
          result.temporaryPassword
        );

        return;
      }

      if (action === "password") {
        const password = prompt(
          `Enter a new password for ${teacherName(teacher)} ` +
            "(at least 6 characters):"
        );

        if (password === null) return;

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        await apiRequest(`${teacherUrl}/password`, {
          method: "PATCH",
          body: JSON.stringify({ password }),
        });

        alert("Password changed.");
        return;
      }

      if (action === "pause" || action === "activate") {
        const status =
          action === "pause" ? "SUSPENDED" : "ACTIVE";

        const verb =
          action === "pause" ? "Pause" : "Reactivate";

        const confirmed = confirm(
          `${verb} ${teacherName(teacher)}'s account?`
        );

        if (!confirmed) return;

        await apiRequest(`${teacherUrl}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });

        await loadTeachers();
      }
    } catch (error) {
      alert(error.message || "The action failed.");
    }
  });

  loadTeachers();
})();
