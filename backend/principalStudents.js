//backend/principalStudents.js

(() => {
  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const TOKEN_KEY = "principalAccessToken";
  const accordion = document.querySelector("#studentsAccordion");
  const searchInput = document.querySelector(".students-toolbar .search-box input");
  const promoteAllButton = document.querySelector("#promoteAllBtn");
  const togglePromoteButton = document.querySelector("#disablePromoteAllBtn");
  const resetModal = document.querySelector("#resetModal");
  const resetStudent = document.querySelector("#resetStudent");
  const resetClass = document.querySelector("#resetClass");
  const resetCode = document.querySelector("#resetCode");
  const confirmResetButton = document.querySelector("#confirmReset");
  const closeResetButton = document.querySelector("#closeReset");
  const actionModal = document.querySelector("#studentActionModal");
  const actionDialog = actionModal?.querySelector(".action-dialog");
  const actionTitle = document.querySelector("#actionDialogTitle");
  const actionMessage = document.querySelector("#actionDialogMessage");
  const actionDetails = document.querySelector("#actionDialogDetails");
  const actionIcon = document.querySelector("#actionDialogIcon");
  const actionSelectWrap = document.querySelector("#actionSelectWrap");
  const actionSelect = document.querySelector("#actionSelect");
  const actionConfirmButton = document.querySelector("#actionConfirm");
  const actionCancelButton = document.querySelector("#actionCancel");

  let classes = [];
  let searchTimer;
  let studentPendingReset = null;

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
      window.location.assign("../index");
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

  function showActionPopup({
    title,
    message,
    details = [],
    options = null,
    confirmText = "Continue",
    cancelText = "Cancel",
    showCancel = true,
    isError = false,
  }) {
    if (!actionModal || !actionDialog) return Promise.resolve(null);

    actionTitle.textContent = title;
    actionMessage.textContent = message;
    actionIcon.textContent = isError ? "!" : "✓";
    actionDialog.classList.toggle("is-error", isError);
    actionDetails.replaceChildren();

    details.forEach(({ label, value }) => {
      const row = document.createElement("div");
      row.className = "action-dialog-detail";
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.textContent = value;
      row.append(labelNode, valueNode);
      actionDetails.appendChild(row);
    });

    actionSelectWrap.hidden = !Array.isArray(options);
    actionSelect.replaceChildren();
    if (Array.isArray(options)) {
      options.forEach(({ value, label }) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        actionSelect.appendChild(option);
      });
    }

    actionConfirmButton.textContent = confirmText;
    actionCancelButton.textContent = cancelText;
    actionCancelButton.hidden = !showCancel;
    actionModal.classList.add("show");
    actionModal.setAttribute("aria-hidden", "false");

    return new Promise((resolve) => {
      let finished = false;
      const finish = (value) => {
        if (finished) return;
        finished = true;
        actionModal.classList.remove("show");
        actionModal.setAttribute("aria-hidden", "true");
        actionConfirmButton.removeEventListener("click", onConfirm);
        actionCancelButton.removeEventListener("click", onCancel);
        actionModal.removeEventListener("click", onOverlayClick);
        document.removeEventListener("keydown", onKeyDown);
        resolve(value);
      };
      const onConfirm = () => finish(Array.isArray(options) ? actionSelect.value : true);
      const onCancel = () => finish(null);
      const onOverlayClick = (event) => {
        if (event.target === actionModal) finish(null);
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") finish(null);
      };

      actionConfirmButton.addEventListener("click", onConfirm);
      actionCancelButton.addEventListener("click", onCancel);
      actionModal.addEventListener("click", onOverlayClick);
      document.addEventListener("keydown", onKeyDown);
      actionConfirmButton.focus();
    });
  }

  function showNotice(title, message, { details = [], isError = false } = {}) {
    return showActionPopup({
      title,
      message,
      details,
      confirmText: "Close",
      showCancel: false,
      isError,
    });
  }

  function studentRecord(studentId) {
    for (const classItem of classes) {
      const student = classItem.records.find(
        (record) => record.studentId === studentId
      );
      if (student) return { student, classItem };
    }
    return null;
  }

  function openResetModal(studentId) {
    const result = studentRecord(studentId);
    if (!result || !resetModal) {
      void showNotice("Student not found", "Refresh the student list and try again.", {
        isError: true,
      });
      return;
    }

    studentPendingReset = result;
    resetStudent.textContent = result.student.name;
    resetClass.textContent = result.classItem.class;
    resetCode.textContent = result.student.code || "—";
    resetModal.classList.add("show");
    resetModal.setAttribute("aria-hidden", "false");
    confirmResetButton.focus();
  }

  function closeResetModal() {
    resetModal?.classList.remove("show");
    resetModal?.setAttribute("aria-hidden", "true");
    studentPendingReset = null;
  }

  function createTemporaryPassword() {
    if (!window.crypto?.getRandomValues) {
      throw new Error("Secure password generation is unavailable in this browser.");
    }

    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const limit = Math.floor(256 / alphabet.length) * alphabet.length;
    let value = "";

    while (value.length < 14) {
      const bytes = new Uint8Array(20);
      window.crypto.getRandomValues(bytes);
      for (const byte of bytes) {
        if (byte < limit) value += alphabet[byte % alphabet.length];
        if (value.length === 14) break;
      }
    }

    return `Flama-${value}`;
  }

  async function resetStudentPassword() {
    if (!studentPendingReset || confirmResetButton.disabled) return;

    const pendingReset = studentPendingReset;
    confirmResetButton.disabled = true;

    try {
      const temporaryPassword = createTemporaryPassword();
      await requestJson(
        `/principal/students/${encodeURIComponent(pendingReset.student.studentId)}/password`,
        {
          method: "PATCH",
          body: JSON.stringify({ newPassword: temporaryPassword }),
        }
      );

      closeResetModal();
      await showNotice(
        "Password reset successfully",
        "Share this temporary password with the student. Their admission number stays the same.",
        {
          details: [
            { label: "Student", value: pendingReset.student.name },
            { label: "Temporary Password", value: temporaryPassword },
          ],
        }
      );
    } catch (error) {
      closeResetModal();
      await showNotice("Could not reset password", error.message, { isError: true });
    } finally {
      confirmResetButton.disabled = false;
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
                               href="./student-profile?studentId=${encodeURIComponent(student.studentId)}">
                              View
                            </a>

                            <button class="action-link student-action"
                                    data-action="promote"
                                    data-student-id="${escapeHtml(student.studentId)}">
                              Promote
                            </button>

                            <a class="action-link"
                               href="./edit-student?studentId=${encodeURIComponent(student.studentId)}">
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

  async function chooseClass(message, excludedId = "") {
    const available = classes.filter(
      (item) => item.classId !== excludedId
    );

    if (!available.length) {
      throw new Error("No destination class is available.");
    }

    const selectedId = await showActionPopup({
      title: "Choose a class",
      message,
      options: available.map((item) => ({
        value: item.classId,
        label: item.class,
      })),
      confirmText: "Continue",
    });

    return available.find((item) => item.classId === selectedId) || null;
  }

  async function handleStudentAction(button) {
    const { action, studentId } = button.dataset;
    if (!studentId) return;

    if (action === "pause" || action === "activate") {
      const status = action === "pause" ? "SUSPENDED" : "ACTIVE";
      const record = studentRecord(studentId)?.student;
      const confirmed = await showActionPopup({
        title: action === "pause" ? "Pause student account?" : "Reactivate student account?",
        message: `${action === "pause" ? "Pause" : "Reactivate"} this student account?`,
        details: record ? [{ label: "Student", value: record.name }] : [],
        confirmText: action === "pause" ? "Yes, Pause Account" : "Reactivate Account",
      });
      if (!confirmed) return;

      await requestJson(`/principal/students/${studentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await loadStudents(searchInput?.value.trim() || "");
      await showNotice(
        action === "pause" ? "Student account paused" : "Student account reactivated",
        `${record?.name || "The student"} is now ${action === "pause" ? "suspended" : "active"}.`
      );
      return;
    }

    if (action === "password") {
      openResetModal(studentId);
      return;
    }

    if (action === "promote") {
      const sourceClass = classes.find((item) =>
        item.records.some((student) => student.studentId === studentId)
      );
      const target = await chooseClass(
        "Select the destination class:",
        sourceClass?.classId
      );
      if (!target) return;

      const record = studentRecord(studentId)?.student;
      const confirmed = await showActionPopup({
        title: "Promote student?",
        message: `Move this student to ${target.class}?`,
        details: record ? [{ label: "Student", value: record.name }] : [],
        confirmText: "Yes, Promote",
      });
      if (!confirmed) return;

      await requestJson(`/principal/students/${studentId}/promote`, {
        method: "PATCH",
        body: JSON.stringify({ classId: target.classId }),
      });

      await loadStudents(searchInput?.value.trim() || "");
      await showNotice("Student promoted", `The student has been promoted to ${target.class}.`);
    }
  }

  async function promoteClass(classItem) {
    const target = await chooseClass(
      `Choose the destination class for all ${classItem.class} students:`,
      classItem.classId
    );
    if (!target) return;

    const confirmed = await showActionPopup({
      title: "Promote this class?",
      message: `Promote all ${classItem.students} students from ${classItem.class} to ${target.class}?`,
      confirmText: "Yes, Promote All",
    });
    if (!confirmed) return;

    const data = await requestJson("/principal/students/promote", {
      method: "PATCH",
      body: JSON.stringify({
        sourceClassId: classItem.classId,
        targetClassId: target.classId,
      }),
    });

    await loadStudents(searchInput?.value.trim() || "");
    await showNotice(
      "Class promoted",
      `Students have been promoted to ${target.class}.`,
      { details: [{ label: "Students Promoted", value: String(data.modifiedCount ?? 0) }] }
    );
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

      try {
        promoteAllButton.disabled = true;
        const source = await chooseClass("Choose the class to promote:");
        if (!source) return;
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
    void showNotice(
      "Action could not be completed",
      error.message || "Could not complete the student action.",
      { isError: true }
    );
  }

  async function init() {
    bindEvents();
    closeResetButton?.addEventListener("click", closeResetModal);
    confirmResetButton?.addEventListener("click", resetStudentPassword);
    resetModal?.addEventListener("click", (event) => {
      if (event.target === resetModal) closeResetModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && resetModal?.classList.contains("show")) {
        closeResetModal();
      }
    });

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
