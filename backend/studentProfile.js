//backend/studentProfile.js

(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE || (isLocal ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const PROFILE_URL = `${API_BASE}/student-dashboard/profile`;

  const token =
    sessionStorage.getItem("studentAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const logo = document.querySelector(".brand img");
  const schoolName = document.querySelector(".brand h2");
  const tagline = document.querySelector(".brand p");
  const topStudentName = document.getElementById("topStudentName");
  const topStudentClass = document.getElementById("topStudentClass");
  const topStudentImage = document.querySelector(".user-info img");
  const profileImage = document.querySelector(".profile-left img");
  const subjectsGrid = document.getElementById("subjectsGrid");

  const designedLogoSrc = logo?.getAttribute("src") || "";

  const fields = {
    studentName: document.getElementById("studentName"),
    studentAge: document.getElementById("studentAge"),
    studentClass: document.getElementById("studentClass"),
    studentAdmissionYear: document.getElementById("studentAdmissionYear"),
    studentParentPhone: document.getElementById("studentParentPhone"),
    studentCurrentTerm: document.getElementById("studentCurrentTerm"),
    studentAddress: document.getElementById("studentAddress"),
    studentDepartment: document.getElementById("studentDepartment"),
  };

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function unwrap(body) {
    let result = body;

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

  async function apiGet(url) {
    if (!token) {
      throw new Error("Your student session has expired. Please sign in again.");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Profile request failed (${response.status})`
      );
    }

    return unwrap(body);
  }

  function setText(element, value, fallback = "—") {
    if (element) {
      element.textContent =
        value === null || value === undefined || value === ""
          ? fallback
          : String(value);
    }
  }

  function renderBranding(school) {
    if (school.name) {
      setText(schoolName, school.name);
    }

    if (tagline) {
      tagline.textContent = "Student Portal";
    }

    const schoolLogoUrl =
      typeof school.logo === "string" ? school.logo.trim() : "";

    // Keep the designed logo from the HTML if there is no school logo.
    if (logo && schoolLogoUrl) {
      logo.onerror = () => {
        logo.onerror = null;
        if (designedLogoSrc) logo.src = designedLogoSrc;
      };

      logo.src = schoolLogoUrl;
      logo.alt = school.name ? `${school.name} logo` : "School logo";
    }
  }

  function renderStudent(student) {
    setText(topStudentName, student.name, "Student");
    setText(
      topStudentClass,
      student.className
        ? `Student · ${student.className}`
        : student.role || "Student"
    );

    setText(fields.studentName, student.name);
    setText(fields.studentAge, student.age);
    setText(fields.studentClass, student.className);
    setText(fields.studentAdmissionYear, student.admissionYear);
    setText(fields.studentCurrentTerm, student.termName);
    setText(fields.studentAddress, student.address);
    setText(fields.studentDepartment, student.department);

    // The supplied Student model has phone, but no parentPhone field.
    // Display the saved phone and correct the label to match the data.
    setText(fields.studentParentPhone, student.phone);

    const phoneLabel = fields.studentParentPhone
      ?.parentElement?.querySelector("span");

    if (phoneLabel) {
      phoneLabel.textContent = "Phone Number:";
    }

    [topStudentImage, profileImage].filter(Boolean).forEach((image) => {
      image.hidden = !student.avatar;
      if (!student.avatar) {
        image.removeAttribute("src");
        return;
      }
      image.onerror = () => {
        image.onerror = null;
        image.hidden = true;
        image.removeAttribute("src");
      };
      image.src = student.avatar;
      image.alt = student.name ? `${student.name} profile` : "Student profile";
    });
  }

  function renderSubjects(subjects) {
    if (!subjectsGrid) return;

    if (!subjects.length) {
      subjectsGrid.innerHTML =
        "<p>No active subjects are assigned to your class yet.</p>";
      return;
    }

    // Keep the page's existing subjects-grid layout and list styling.
    const columns = 3;
    const perColumn = Math.ceil(subjects.length / columns);
    const lists = [];

    for (let start = 0; start < subjects.length; start += perColumn) {
      const group = subjects.slice(start, start + perColumn);

      lists.push(`
        <ul>
          ${group
            .map(
              (subject) => `
                <li title="${esc(subject.code || "")}">
                  ${esc(subject.name)}
                </li>
              `
            )
            .join("")}
        </ul>
      `);
    }

    subjectsGrid.innerHTML = lists.join("");
  }

  function showError(message) {
    const profileCard = document.querySelector(".profile-card");
    if (!profileCard) return;

    let error = document.getElementById("profileLoadError");

    if (!error) {
      error = document.createElement("p");
      error.id = "profileLoadError";
      error.setAttribute("role", "alert");
      profileCard.before(error);
    }

    error.textContent = message;
  }

  async function initialize() {
    try {
      const data = await apiGet(PROFILE_URL);

      renderBranding(data.school || {});
      renderStudent(data.student || {});
      renderSubjects(data.subjects || []);
    } catch (error) {
      console.error("Could not load student profile:", error);
      showError(error.message || "Could not load your profile.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
