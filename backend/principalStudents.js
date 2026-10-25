//backend/principalStudents.js

(() => {
  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const TOKEN_KEY = "principalAccessToken";
  const accordion = document.querySelector("#studentsAccordion");
  const searchInput = document.querySelector(".students-toolbar .search-box input");
  const promoteAllButton = document.querySelector("#promoteAllBtn");
  const togglePromoteButton = document.querySelector("#disablePromoteAllBtn");

  let classes = [];
  let searchTimer;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
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

  async function requestJson(path, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      window.location.assign("../index.html");
      throw new Error("Your login session has expired.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    return unwrap(result);
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
    }

    const profile = document.querySelector(".topbar .teacher-profile");
    const principalImage = profile?.querySelector("img");
    const principalName = profile?.querySelector("h3");

    if (principalName && data.principal?.name) {
      principalName.textContent = data.principal.name;
    }
    if (principalImage && data.principal?.image) {
      principalImage.src = data.principal.image;
    }
  }

  async function loadBranding() {
    const [schoolResponse, profileResponse] = await Promise.all([
      requestJson("/tenant/auth/school-info"),
      requestJson("/principal/profile"),
    ]);

    const schoolData = schoolResponse?.school || schoolResponse || {};
    const profileData = profileResponse?.principal || profileResponse || {};

    updateBranding({
      school: schoolData,
      principal: {
        name:
          profileData.fullName ||
          profileData.name ||
          [profileData.title, profileData.firstName, profileData.lastName]
            .filter(Boolean)
            .join(" "),
        image:
          profileData.profileImage ||
          profileData.avatar ||
          profileData.image ||
          null,
      },
    });
  }

  function render() {
    if (!accordion) return;

    if (!classes.length) {
      accordion.innerHTML = "<p>No classes or students found.</p>";
      return;
    }

    accordion.innerHTML = classes.map((classItem, classIndex) => `
      <section class="student-section">
        <div class="class-header ${classIndex === 0 ? "active" : ""}">
          <div class="class-header-left">
            <h2>${escapeHtml(classItem.class)}</h2>
            <span class="student-count">${classItem.students} students</span>
          </div>
          <i data-lucide="${classIndex === 0 ? "chevron-up" : "chevron-down"}"></i>
        </div>

        <div class="student-body ${classIndex === 0 ? "" : "hidden"}">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Student Name</th>
                  <th>Access Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  classItem.records.length
                    ? classItem.records.map((student, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${escapeHtml(student.name)}</td>
                        <td>
                          <span class="access-code">${escapeHtml(student.code)}</span>
                        </td>
                        <td>
                          <span class="status-dot ${
                            student.active ? "active-dot" : "inactive-dot"
                          }"></span>
                          ${escapeHtml(student.status)}
                        </td>
                        <td>
                          <div class="actions">
                            <a class="action-link"
                               href="./student-profile.html?studentId=${encodeURIComponent(student.studentId)}">
                              View
                            </a>

                            <button class="action-link student-action"
                                    data-action="promote"
                                    data-student-id="${escapeHtml(student.studentId)}">
                              Promote
                            </button>

                            <a class="action-link"
                               href="./edit-student.html?studentId=${encodeURIComponent(student.studentId)}">
                              Edit Profile
                            </a>

                            <button class="action-link student-action"
                                    data-action="password"
                                    data-student-id="${escapeHtml(student.studentId)}">
                              Change Password
                            </button>

                            <button class="action-link ${
                              student.active ? "action-danger" : "action-success"
                            } student-action"
                                    data-action="${student.active ? "pause" : "activate"}"
                                    data-student-id="${escapeHtml(student.studentId)}">
                              ${student.active ? "Pause Account" : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join("")
                    : `<tr><td colspan="5">No students in this class.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `).join("");

    window.lucide?.createIcons();
  }

  async function loadStudents(search = "") {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await requestJson(`/principal/students${query}`);

    classes = data.classes || [];
    render();
  }

  function chooseClass(message, excludedId = "") {
    const available = classes.filter(
      (item) => item.classId !== excludedId
    );

    if (!available.length) {
      throw new Error("No destination class is available.");
    }

    const choices = available
      .map((item, index) => `${index + 1}. ${item.class}`)
      .join("\n");

    const answer = window.prompt(`${message}\n\n${choices}`);
    if (!answer) return null;

    const index = Number(answer) - 1;
    if (!Number.isInteger(index) || !available[index]) {
      throw new Error("Enter the number beside a listed class.");
    }

    return available[index];
  }

  async function handleStudentAction(button) {
    const { action, studentId } = button.dataset;
    if (!studentId) return;

    if (action === "pause" || action === "activate") {
      const status = action === "pause" ? "SUSPENDED" : "ACTIVE";
      const confirmed = window.confirm(
        `${action === "pause" ? "Pause" : "Reactivate"} this student account?`
      );
      if (!confirmed) return;

      await requestJson(`/principal/students/${studentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await loadStudents(searchInput?.value.trim() || "");
      return;
    }

    if (action === "password") {
      const newPassword = window.prompt(
        "Enter the new student password (at least 8 characters):"
      );
      if (newPassword === null) return;

      await requestJson(`/principal/students/${studentId}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword }),
      });

      window.alert("Student password changed.");
      return;
    }

    if (action === "promote") {
      const sourceClass = classes.find((item) =>
        item.records.some((student) => student.studentId === studentId)
      );
      const target = chooseClass(
        "Choose the destination class by entering its number:",
        sourceClass?.classId
      );
      if (!target) return;

      await requestJson(`/principal/students/${studentId}/promote`, {
        method: "PATCH",
        body: JSON.stringify({ classId: target.classId }),
      });

      window.alert(`Student promoted to ${target.class}.`);
      await loadStudents(searchInput?.value.trim() || "");
    }
  }

  async function promoteClass(classItem) {
    const target = chooseClass(
      `Choose the destination class for all ${classItem.class} students:`,
      classItem.classId
    );
    if (!target) return;

    const confirmed = window.confirm(
      `Promote all ${classItem.students} students from ${classItem.class} to ${target.class}?`
    );
    if (!confirmed) return;

    const data = await requestJson("/principal/students/promote", {
      method: "PATCH",
      body: JSON.stringify({
        sourceClassId: classItem.classId,
        targetClassId: target.classId,
      }),
    });

    window.alert(
      `${data.modifiedCount ?? 0} students promoted to ${target.class}.`
    );

    await loadStudents(searchInput?.value.trim() || "");
  }

  function bindEvents() {
    searchInput?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        loadStudents(searchInput.value.trim()).catch(showError);
      }, 300);
    });

    accordion?.addEventListener("click", async (event) => {
      const header = event.target.closest(".class-header");
      if (header) {
        const body = header.nextElementSibling;
        body?.classList.toggle("hidden");
        header.classList.toggle("active");
        header.querySelector("i")?.setAttribute(
          "data-lucide",
          body?.classList.contains("hidden") ? "chevron-down" : "chevron-up"
        );
        window.lucide?.createIcons();
        return;
      }

      const button = event.target.closest(".student-action");
      if (!button) return;

      button.disabled = true;
      try {
        await handleStudentAction(button);
      } catch (error) {
        showError(error);
      } finally {
        button.disabled = false;
      }
    });

    promoteAllButton?.addEventListener("click", async () => {
      if (promoteAllButton.disabled) return;

      const source = chooseClass("Choose the class to promote:");
      if (!source) return;

      try {
        promoteAllButton.disabled = true;
        await promoteClass(source);
      } catch (error) {
        showError(error);
      } finally {
        promoteAllButton.disabled = false;
      }
    });

    togglePromoteButton?.addEventListener("click", () => {
      const disabled = !promoteAllButton.disabled;
      promoteAllButton.disabled = disabled;
      togglePromoteButton.textContent = disabled
        ? "Enable Promote All"
        : "Disable Promote All";
    });
  }

  function showError(error) {
    console.error("Principal students integration error:", error);
    window.alert(error.message || "Could not complete the student action.");
  }

  async function init() {
    bindEvents();

    try {
      await Promise.all([
        loadBranding(),
        loadStudents(),
      ]);
    } catch (error) {
      showError(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();