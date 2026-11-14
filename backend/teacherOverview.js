//backend/teacherOverview.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const tableBody = document.getElementById("classesTable");

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

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function getImageUrl(value) {
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

  function setStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = String(Number(value) || 0);
  }

  function applySchoolInfo(response) {
    const school = findObjectWithKeys(response, ["name", "logo"]);

    const schoolName =
      school?.name ||
      findNestedValue(response, "schoolName") ||
      "";

    const logo =
      getImageUrl(school?.logo) ||
      getImageUrl(findNestedValue(response, "logoUrl"));

    const nameElement = document.querySelector(".logo-area h2");
    const logoElement = document.querySelector(".logo-area img");

    if (nameElement && schoolName) {
      nameElement.textContent = schoolName;
    }

    if (logoElement && logo) {
      logoElement.src = logo;
      logoElement.alt = `${schoolName || "School"} logo`;
    }
  }

  function applyTeacherInfo(teacher) {
    const nameElement =
      document.querySelector(".teacher-profile h3");
    const roleElement =
      document.querySelector(".teacher-profile p");
    const imageElement =
      document.querySelector(".teacher-profile img");

    const fullName =
      teacher.fullName ||
      [
        teacher.title,
        teacher.firstName,
        teacher.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Teacher";

    if (nameElement) nameElement.textContent = fullName;

    if (roleElement) {
      roleElement.textContent = teacher.department
        ? `${teacher.department} Teacher`
        : "Teacher";
    }

    if (imageElement && teacher.avatar) {
      imageElement.src = teacher.avatar;
      imageElement.alt = fullName;
    }
  }

  function formatTerm(term) {
    const terms = {
      FIRST_TERM: "1st Term",
      SECOND_TERM: "2nd Term",
      THIRD_TERM: "3rd Term",
    };

    return terms[term] || term || "Not set";
  }

  function renderClasses(classes) {
    if (!tableBody) return;

    if (!Array.isArray(classes) || classes.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">No active classes are assigned to you.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = classes
      .map((item) => {
        const query = new URLSearchParams({
          classId: item.classId || "",
          offeringId: item.offeringId || "",
        });

        return `
          <tr>
            <td>${escapeHtml(item.className || "—")}</td>
            <td>${escapeHtml(item.subjectName || "—")}</td>
            <td>${Number(item.studentCount) || 0}</td>
            <td>${escapeHtml(formatTerm(item.termName))}</td>
            <td>${escapeHtml(item.sessionName || "Not set")}</td>
            <td>
              <a
                class="table-action"
                href="./classes.html?${query.toString()}"
              >View</a>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function loadOverview() {
    if (!token) {
      window.location.assign("./login.html");
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = `
        <tr><td colspan="6">Loading your classes…</td></tr>
      `;
    }

    try {
      const [schoolResponse, dashboardResponse] =
        await Promise.all([
          api(`${API_BASE}/tenant/auth/school-info`),
          api(`${API_BASE}/teacher-dashboard/overview`),
        ]);

      applySchoolInfo(schoolResponse);

      const teacher = findNestedValue(dashboardResponse, "teacher");
      const stats = findNestedValue(dashboardResponse, "stats");
      const school = findNestedValue(dashboardResponse, "school");
      const classes = findArray(dashboardResponse, "classes");

      if (school) applySchoolInfo({ school });
      if (teacher) applyTeacherInfo(teacher);

      setStat("studentCount", stats?.studentCount);
      setStat("classCount", stats?.classCount);
      setStat("subjectCount", stats?.subjectCount);
      setStat("pendingCount", stats?.pendingQuestionCount);

      renderClasses(classes || []);

      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    } catch (error) {
      console.error("Could not load teacher overview:", error);

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">${escapeHtml(
              error.message || "Could not load your dashboard."
            )}</td>
          </tr>
        `;
      }
    }
  }

  document.querySelector(".logout-btn")?.addEventListener("click", () => {
    sessionStorage.removeItem("teacherAccessToken");
    sessionStorage.removeItem("teacherRefreshToken");
    sessionStorage.removeItem("tenantAccessToken");
    sessionStorage.removeItem("teacherUser");
    window.location.assign("./login.html");
  });

  loadOverview();
})();