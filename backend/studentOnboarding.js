//backend/studentOnboarding.js

(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE || (isLocal ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const SCHOOL_INFO_URL = `${API_BASE}/tenant/auth/school-info`;

  const logo = document.querySelector(".brand img");
  const schoolHeading = document.querySelector(".brand h2");
  const tagline = document.querySelector(".brand p");
  const welcomeHeading = document.getElementById("welcomeName");
  const welcomeText = document.querySelector(".welcome p");

  // Keep the logo supplied in the HTML if the school has no uploaded logo.
  const designedLogoSrc = logo?.getAttribute("src") || "";
  const designedSchoolName = schoolHeading?.textContent.trim() || "Your School";

  function getStudent() {
    try {
      return JSON.parse(sessionStorage.getItem("studentUser") || "null");
    } catch {
      return null;
    }
  }

  function getStudentName(student) {
    if (!student) return "";

    return (
      student.name ||
      [student.firstName, student.otherNames, student.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
    );
  }

  function unwrap(response) {
    let result = response;

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

  function renderWelcome(studentName, schoolName) {
    const name = studentName || "Student";
    const school = schoolName || designedSchoolName;

    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome, ${name}!`;
    }

    if (welcomeText) {
      welcomeText.textContent =
        `We’re delighted to have you, ${name}, at ${school} and wish you a successful journey ahead.`;
    }

    document.title = `Welcome, ${name} | Student Portal`;
  }

  async function loadSchoolInfo() {
    const response = await fetch(SCHOOL_INFO_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `School information request failed (${response.status})`
      );
    }

    return unwrap(body);
  }

  async function initialize() {
    const studentName = getStudentName(getStudent());

    // Show the student’s name immediately while the school request loads.
    renderWelcome(studentName, designedSchoolName);

    if (tagline) {
      tagline.textContent = "Student Portal";
    }

    try {
      const school = await loadSchoolInfo();
      const schoolName =
        school?.name ||
        school?.schoolName ||
        designedSchoolName;

      if (schoolName && schoolHeading) {
        schoolHeading.textContent = schoolName;
      }

      const logoUrl =
        typeof school?.logo === "string" ? school.logo.trim() : "";

      // Only replace the designed logo when the API supplies a real logo URL.
      if (logo && logoUrl) {
        logo.onerror = () => {
          logo.onerror = null;
          if (designedLogoSrc) logo.src = designedLogoSrc;
        };

        logo.src = logoUrl;
        logo.alt = `${schoolName} logo`;
      }

      renderWelcome(studentName, schoolName);
    } catch (error) {
      // Keep the HTML's school name and designed logo as fallbacks.
      console.warn("Could not load school information:", error.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();