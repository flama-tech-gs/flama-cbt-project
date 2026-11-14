//backend/teacherclasses.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const tabsElement = document.getElementById("classTabs");
  const studentsTable = document.getElementById("studentsTable");
  const classTitle = document.getElementById("classTitle");
  const classDescription =
    document.getElementById("classDescription");

  const params = new URLSearchParams(window.location.search);
  const requestedClassId = params.get("classId") || "";
  const requestedOfferingId =
    params.get("offeringId") ||
    params.get("subjectOffering") ||
    params.get("subjectOfferingId") ||
    "";

  let offerings = [];
  let selectedOfferingId = "";

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function findNestedValue(root, key, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(root, key)) {
      return root[key];
    }

    for (const value of Object.values(root)) {
      if (value && typeof value === "object") {
        const found = findNestedValue(value, key, depth + 1);
        if (found !== undefined) return found;
      }
    }

    return undefined;
  }

  function findArray(root, key, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return null;
    }

    if (Array.isArray(root[key])) return root[key];

    const values = Array.isArray(root) ? root : Object.values(root);

    for (const value of values) {
      if (value && typeof value === "object") {
        const found = findArray(value, key, depth + 1);
        if (found !== null) return found;
      }
    }

    return null;
  }

  function findObjectWithKeys(root, keys, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return null;
    }

    if (
      keys.every((key) =>
        Object.prototype.hasOwnProperty.call(root, key)
      )
    ) {
      return root;
    }

    for (const value of Object.values(root)) {
      if (value && typeof value === "object") {
        const found = findObjectWithKeys(
          value,
          keys,
          depth + 1
        );
        if (found) return found;
      }
    }

    return null;
  }

  function imageUrl(value) {
    if (typeof value === "string") return value;
    if (value && typeof value.url === "string") return value.url;
    return "";
  }

  async function api(url) {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("_requestTime", String(Date.now()));

    const response = await fetch(requestUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 304) {
      throw new Error("The server returned an empty 304 response.");
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        findNestedValue(body, "message") ||
          findNestedValue(body, "error") ||
          `Request failed (${response.status})`
      );
    }

    return body;
  }

  function applyBranding(school, teacher) {
    const schoolNameElement =
      document.querySelector(".logo-area h2");
    const schoolLogoElement =
      document.querySelector(".logo-area img");
    const teacherNameElement =
      document.querySelector(".teacher-profile h3");
    const teacherRoleElement =
      document.querySelector(".teacher-profile p");
    const teacherImageElement =
      document.querySelector(".teacher-profile img");

    if (schoolNameElement && school?.name) {
      schoolNameElement.textContent = school.name;
    }

    const logo =
      imageUrl(school?.logo) ||
      imageUrl(school?.logoUrl) ||
      imageUrl(school?.images?.[0]);

    if (schoolLogoElement && logo) {
      schoolLogoElement.src = logo;
      schoolLogoElement.alt = `${school?.name || "School"} logo`;
    }

    const fullName =
      teacher?.fullName ||
      [
        teacher?.title,
        teacher?.firstName,
        teacher?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    if (teacherNameElement && fullName) {
      teacherNameElement.textContent = fullName;
    }

    if (teacherRoleElement && teacher) {
      teacherRoleElement.textContent =
        teacher.department
          ? `${teacher.department} Teacher`
          : "Teacher";
    }

    if (teacherImageElement && teacher?.avatar) {
      teacherImageElement.src = teacher.avatar;
      teacherImageElement.alt = fullName || "Teacher";
    }
  }

  function renderTabs() {
    if (!tabsElement) return;

    if (offerings.length === 0) {
      tabsElement.innerHTML =
        "<p>No active classes are assigned to your account.</p>";
      return;
    }

    tabsElement.innerHTML = offerings
      .map((offering) => {
        const active =
          offering.offeringId === selectedOfferingId;

        return `
          <button
            type="button"
            class="class-tab ${active ? "active" : ""}"
            data-offering-id="${escapeHtml(offering.offeringId)}"
            aria-pressed="${active}"
          >
            ${escapeHtml(offering.className)}
            <span> · ${escapeHtml(offering.subjectName)}</span>
          </button>
        `;
      })
      .join("");
  }

  function renderStudents(offering) {
    if (!offering) {
      if (classTitle) classTitle.textContent = "No class selected";
      if (classDescription) classDescription.textContent = "";
      if (studentsTable) {
        studentsTable.innerHTML =
          '<tr><td colspan="6">No class selected.</td></tr>';
      }
      return;
    }

    if (classTitle) {
      classTitle.textContent =
        `${offering.className} — ${offering.subjectName}`;
    }

    if (classDescription) {
      classDescription.textContent =
        `${Number(offering.studentCount) || 0} students • ` +
        `${offering.subjectName}`;
    }

    const students = Array.isArray(offering.students)
      ? offering.students
      : [];

    if (!studentsTable) return;

    if (students.length === 0) {
      studentsTable.innerHTML =
        '<tr><td colspan="6">No active students in this class.</td></tr>';
      return;
    }

    studentsTable.innerHTML = students
      .map((student, index) => {
        const profileUrl = new URL(
          "./student-profile.html",
          window.location.href
        );
        profileUrl.searchParams.set("studentId", student.id);
        profileUrl.searchParams.set("classId", offering.classId);
        profileUrl.searchParams.set(
          "offeringId",
          offering.offeringId
        );

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(student.fullName || "Unnamed student")}</td>
            <td>
              <span class="access-badge">
                ${escapeHtml(student.admissionNumber || "Not recorded")}
              </span>
            </td>
            <td>${escapeHtml(student.admissionYear || "Not recorded")}</td>
            <td>${escapeHtml(student.gender || "Not recorded")}</td>
            <td>
              <a
                class="profile-btn"
                href="${escapeHtml(profileUrl.toString())}"
              >View Profile</a>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function selectOffering(offeringId) {
    const offering = offerings.find(
      (item) => item.offeringId === offeringId
    );

    if (!offering) return;

    selectedOfferingId = offeringId;
    renderTabs();
    renderStudents(offering);
  }

  async function loadClasses() {
    if (!token) {
      window.location.assign("./login.html");
      return;
    }

    if (studentsTable) {
      studentsTable.innerHTML =
        '<tr><td colspan="6">Loading classes and students…</td></tr>';
    }

    try {
      const response = await api(
        `${API_BASE}/teacher-dashboard/classes`
      );

      const school = findNestedValue(response, "school");
      const teacher = findNestedValue(response, "teacher");
      offerings = findArray(response, "offerings") || [];

      applyBranding(school, teacher);

      const queryMatch =
        offerings.find(
          (offering) =>
            requestedOfferingId &&
            offering.offeringId === requestedOfferingId
        ) ||
        offerings.find(
          (offering) =>
            requestedClassId &&
            offering.classId === requestedClassId
        );

      const backendSelectedId =
        findNestedValue(response, "selectedOfferingId");

      selectedOfferingId =
        queryMatch?.offeringId ||
        offerings.find(
          (offering) =>
            offering.offeringId === backendSelectedId
        )?.offeringId ||
        offerings[0]?.offeringId ||
        "";

      renderTabs();

      const selected = offerings.find(
        (offering) =>
          offering.offeringId === selectedOfferingId
      );

      renderStudents(selected);

      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    } catch (error) {
      console.error("Could not load teacher classes:", error);

      if (studentsTable) {
        studentsTable.innerHTML = `
          <tr>
            <td colspan="6">${escapeHtml(
              error.message || "Could not load classes."
            )}</td>
          </tr>
        `;
      }
    }
  }

  tabsElement?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-offering-id]");
    if (!tab) return;

    selectOffering(tab.dataset.offeringId);
  });

  document.querySelector(".logout-btn")?.addEventListener("click", () => {
    sessionStorage.removeItem("teacherAccessToken");
    sessionStorage.removeItem("teacherRefreshToken");
    sessionStorage.removeItem("tenantAccessToken");
    sessionStorage.removeItem("teacherUser");
    window.location.assign("./login.html");
  });

  loadClasses();
})();