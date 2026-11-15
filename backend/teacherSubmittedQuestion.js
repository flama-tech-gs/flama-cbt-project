//backend/teacherSubmittedQuestion.js

(() => {
  "use strict";

  const API_URL =
    `${window.location.protocol}//${window.location.hostname}:5000/api/teacher-dashboard/submitted-questions`;

  const token =
    sessionStorage.getItem("teacherAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const body = document.getElementById("submittedQuestionsBody");
  const schoolLogo = document.querySelector(".logo-area img");
  const schoolName = document.querySelector(".logo-area h2");
  const schoolTagline = document.querySelector(".logo-area p");
  const teacherImage = document.querySelector(".teacher-profile img");
  const teacherName = document.querySelector(".teacher-profile h3");
  const teacherRole = document.querySelector(".teacher-profile p");

  const fallbackAvatar =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e8edf3"/><circle cx="40" cy="30" r="14" fill="#9aa8b8"/><path d="M12 76c2-18 13-26 28-26s26 8 28 26" fill="#9aa8b8"/></svg>'
    );

  // Keep the HTML's designed logo if the school has no logo.
  const designedLogoSrc = schoolLogo?.getAttribute("src") || "";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function unwrap(responseBody) {
    let result = responseBody;

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

  async function fetchSubmissions() {
    const headers = { Accept: "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        responseBody.message ||
          responseBody.error ||
          `Request failed (${response.status})`
      );
    }

    return unwrap(responseBody);
  }

  function setTeacherAvatar(url) {
    if (!teacherImage) return;

    teacherImage.onerror = () => {
      teacherImage.onerror = null;
      teacherImage.src = fallbackAvatar;
    };

    teacherImage.src = url || fallbackAvatar;
  }

  function applyBranding(branding) {
    const school = branding?.school || {};
    const teacher = branding?.teacher || {};

    if (school.name && schoolName) {
      schoolName.textContent = school.name;
    }

    const schoolLogoUrl =
      typeof school.logo === "string" ? school.logo.trim() : "";

    if (schoolLogo && schoolLogoUrl) {
      schoolLogo.onerror = () => {
        schoolLogo.onerror = null;
        if (designedLogoSrc) schoolLogo.src = designedLogoSrc;
      };

      schoolLogo.src = schoolLogoUrl;
      schoolLogo.alt = school.name
        ? `${school.name} logo`
        : "School logo";
    }

    if (schoolTagline) {
      schoolTagline.textContent = "Teacher Portal";
    }

    if (teacherName) {
      teacherName.textContent = teacher.name || "Teacher";
    }

    if (teacherRole) {
      teacherRole.textContent =
        teacher.department || teacher.employeeId || "Teacher";
    }

    setTeacherAvatar(teacher.avatar);
  }

  function makeEditUrl(submission) {
    // Root-relative path: avoids resolving under /submitted-question/.
    const url = new URL(
      "teacher/edit-question/edit-question",
      window.location.origin
    );

    url.searchParams.set(
      "subjectOffering",
      submission.subjectOfferingId || ""
    );
    url.searchParams.set("academicSession", submission.sessionId || "");
    url.searchParams.set("term", submission.termId || "");
    url.searchParams.set("status", submission.status || "");
    url.searchParams.set(
      "questionIds",
      (submission.questionIds || []).join(",")
    );

    return url.pathname + url.search;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString();
  }

  function renderRows(submissions) {
    if (!body) return;

    if (!submissions.length) {
      body.innerHTML = `
        <tr>
          <td colspan="7">No submitted questions were found.</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = submissions
      .map((submission) => {
        const status = String(
          submission.status || "PENDING"
        ).toUpperCase();

        return `
          <tr>
            <td>${escapeHtml(submission.subject || "—")}</td>
            <td>${escapeHtml(submission.className || "—")}</td>
            <td>${escapeHtml(submission.term || "—")}</td>
            <td>${escapeHtml(submission.session || "—")}</td>
            <td>${Number(submission.totalQuestions) || 0}</td>
            <td>${escapeHtml(status)}</td>
            <td>
              <a
                class="edit-question-btn"
                href="${escapeHtml(makeEditUrl(submission))}">
                Edit
              </a>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function showError(message) {
    if (!body) return;

    body.innerHTML = `
      <tr>
        <td colspan="7">${escapeHtml(message)}</td>
      </tr>
    `;
  }

  async function initialize() {
    if (!body) return;

    if (!token) {
      showError("Your teacher session has expired. Please sign in again.");
      return;
    }

    body.innerHTML = `
      <tr>
        <td colspan="7">Loading submitted questions…</td>
      </tr>
    `;

    try {
      const data = await fetchSubmissions();
      applyBranding(data.branding);
      renderRows(data.submissions || []);
    } catch (error) {
      console.error("Could not load teacher submitted questions:", error);
      showError(error.message || "Could not load submitted questions.");
    }

    window.lucide?.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();