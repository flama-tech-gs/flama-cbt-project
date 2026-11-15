//backend/teacherProfile.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const profileCard = document.getElementById("profileCard");
  const summaryCards = document.getElementById("summaryCards");
  const assignedClasses = document.getElementById("assignedClasses");

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

  function yearsOfService(dateValue) {
    if (!dateValue) return "Not recorded";

    const startDate = new Date(dateValue);
    if (Number.isNaN(startDate.getTime())) return "Not recorded";

    const now = new Date();

    let years = now.getFullYear() - startDate.getFullYear();

    const anniversaryHasPassed =
      now.getMonth() > startDate.getMonth() ||
      (now.getMonth() === startDate.getMonth() &&
        now.getDate() >= startDate.getDate());

    if (!anniversaryHasPassed) years -= 1;

    years = Math.max(years, 0);

    return `${years} ${years === 1 ? "year" : "years"}`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Not recorded";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Not recorded";

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function formatTerm(term) {
    const terms = {
      FIRST_TERM: "1st Term",
      SECOND_TERM: "2nd Term",
      THIRD_TERM: "3rd Term",
    };

    return terms[term] || term || "Not set";
  }

  function applySchool(school) {
    if (!school) return;

    const nameElement = document.querySelector(".logo-area h2");
    const logoElement = document.querySelector(".logo-area img");

    if (nameElement && school.name) {
      nameElement.textContent = school.name;
    }

    const logo =
      getImageUrl(school.logo) ||
      getImageUrl(school.logoUrl) ||
      getImageUrl(school.images?.[0]);

    if (logoElement && logo) {
      logoElement.src = logo;
      logoElement.alt = `${school.name || "School"} logo`;
    }
  }

  function applyTeacherHeader(teacher) {
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

  function renderProfile(teacher) {
    if (!profileCard) return;

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

    const subjectNames = Array.isArray(teacher.subjects)
      ? [...new Set(teacher.subjects.filter(Boolean))].join(", ")
      : "";

    const image =
      getImageUrl(teacher.avatar) || "../assets/teacher.png";

    const details = [
      ["Full Name:", fullName],
      ["Staff ID:", teacher.employeeId],
      ["Department:", teacher.department],
      ["Subjects Taught:", subjectNames],
      ["Email:", teacher.email],
      ["Phone Number:", teacher.phone],
      ["Qualification:", teacher.qualification],
      ["Address:", teacher.address],
      ["Date Employed:", formatDate(teacher.appointedAt)],
      ["Account Status:", teacher.status],
    ];

    profileCard.innerHTML = `
      <img
        class="profile-image"
        src="${escapeHtml(image)}"
        alt="${escapeHtml(fullName)}"
      >

      <div class="profile-details">
        ${details
          .map(
            ([label, value]) => `
              <div class="profile-label">${escapeHtml(label)}</div>
              <div class="profile-value">${
                escapeHtml(value || "Not recorded")
              }</div>
            `
          )
          .join("")}
      </div>
    `;

    const profileImage = profileCard.querySelector(".profile-image");
    profileImage?.addEventListener("error", () => {
      profileImage.src = "../assets/teacher.png";
    });
  }

  function renderSummary(teacher, stats) {
    if (!summaryCards) return;

    const summary = [
      {
        title: "Total Students",
        value: Number(stats?.studentCount) || 0,
      },
      {
        title: "Classes Assigned",
        value: Number(stats?.classCount) || 0,
      },
      {
        title: "Subjects Taught",
        value: Number(stats?.subjectCount) || 0,
      },
      {
        title: "Years of Service",
        value: yearsOfService(teacher?.appointedAt),
      },
    ];

    summaryCards.innerHTML = summary
      .map(
        (item) => `
          <article class="stat-card">
            <h2>${escapeHtml(item.value)}</h2>
            <p>${escapeHtml(item.title)}</p>
          </article>
        `
      )
      .join("");
  }

  function renderClasses(classes) {
    if (!assignedClasses) return;

    if (!Array.isArray(classes) || classes.length === 0) {
      assignedClasses.innerHTML = `
        <tr>
          <td colspan="5">No active classes or subjects are assigned.</td>
        </tr>
      `;
      return;
    }

    assignedClasses.innerHTML = classes
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.className || "—")}</td>
            <td>${escapeHtml(item.subjectName || "—")}</td>
            <td>${Number(item.studentCount) || 0}</td>
            <td>${escapeHtml(formatTerm(item.termName))}</td>
            <td>${escapeHtml(item.sessionName || "Not set")}</td>
          </tr>
        `
      )
      .join("");
  }

  async function loadTeacherProfile() {
    if (!token) {
      window.location.assign("../login");
      return;
    }

    if (assignedClasses) {
      assignedClasses.innerHTML = `
        <tr><td colspan="5">Loading your profile…</td></tr>
      `;
    }

    try {
      const response = await api(
        `${API_BASE}/teacher-dashboard/profile`
      );

      const teacher = findNestedValue(response, "teacher");
      const school = findNestedValue(response, "school");
      const stats = findNestedValue(response, "stats");
      const classes = findArray(response, "classes");

      if (!teacher) {
        throw new Error(
          "The teacher profile was missing from the API response."
        );
      }

      applySchool(school);
      applyTeacherHeader(teacher);
      renderProfile(teacher);
      renderSummary(teacher, stats);
      renderClasses(classes || []);

      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    } catch (error) {
      console.error("Could not load teacher profile:", error);

      if (profileCard) {
        profileCard.textContent =
          error.message || "Could not load the teacher profile.";
      }

      if (assignedClasses) {
        assignedClasses.innerHTML = `
          <tr>
            <td colspan="5">${escapeHtml(
              error.message || "Could not load assigned classes."
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
    window.location.assign("../login");
  });

  loadTeacherProfile();
})();