//backend/schoolName.js

(() => {
  "use strict";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  const API_BASE =
    window.FLAMA_API_BASE ||
    (isLocal
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : `${window.location.origin}/api`);

  const PROFILE_URL = `${API_BASE}/principal/profile`;

  const token =
    sessionStorage.getItem("principalAccessToken") ||
    sessionStorage.getItem("tenantAccessToken");

  const schoolLogo = document.querySelector(
    "[data-school-logo], .logo-area img"
  );
  const schoolName = document.querySelector(
    "[data-school-name], .logo-area h2"
  );
  const principalImage = document.querySelector(
    "[data-principal-avatar], .principal-profile img, .teacher-profile img"
  );
  const principalName = document.querySelector(
    "[data-principal-name], .principal-profile h3, .teacher-profile h3"
  );
  const principalRole = document.querySelector(
    "[data-principal-role], .principal-profile p, .teacher-profile p"
  );

  // Save the logo supplied in the page HTML as the fallback.
  const designedLogoSrc = schoolLogo?.getAttribute("src") || "";

  function unwrap(response) {
    let result = response;

    for (let i = 0; i < 6; i += 1) {
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

  function getName(person) {
    return (
      person?.name ||
      [person?.title, person?.firstName, person?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
    );
  }

  function getSchoolLogo(school) {
    return (
      school?.logo ||
      school?.logoUrl ||
      school?.images?.[0]?.url ||
      ""
    );
  }

  function getPrincipalImage(principal) {
    return (
      principal?.avatar ||
      principal?.profilePic ||
      principal?.profilePicture ||
      principal?.image ||
      ""
    );
  }

  async function loadBranding() {
    if (!token) {
      console.warn(
        "Principal branding was not loaded: principalAccessToken is missing."
      );
      return;
    }

    const url = new URL(PROFILE_URL);
    url.searchParams.set("_t", Date.now());

    const response = await fetch(url.toString(), {
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
          `Could not load profile (${response.status})`
      );
    }

    const profile = unwrap(body);
    const school = profile?.school || {};
    const principal =
      profile?.principal ||
      profile?.user ||
      profile?.teacher ||
      {};

    const name = getName(principal);
    const logoUrl = getSchoolLogo(school);
    const imageUrl = getPrincipalImage(principal);

    if (school.name && schoolName) {
      schoolName.textContent = school.name;
    }

    // Use the uploaded school logo only when one exists.
    if (schoolLogo && logoUrl) {
      schoolLogo.onerror = () => {
        schoolLogo.onerror = null;
        if (designedLogoSrc) schoolLogo.src = designedLogoSrc;
      };

      schoolLogo.src = logoUrl;
      schoolLogo.alt = school.name
        ? `${school.name} logo`
        : "School logo";
    }

    if (name && principalName) {
      principalName.textContent = name;
    }

    if (principalRole && name) {
      principalRole.textContent = "School Principal";
    }

    // Keep the page's existing image if the profile has no picture.
    if (principalImage && imageUrl) {
      principalImage.src = imageUrl;
      principalImage.alt = name || "Principal";
    }
  }

  loadBranding().catch((error) => {
    console.error("Could not load school/principal branding:", error);
  });
})();