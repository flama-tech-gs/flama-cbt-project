// Resolves the school tenant from the school-specific hostname.
(() => {
  "use strict";

  const isValidSubdomain = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized.length >= 3 && normalized.length <= 30 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized);
  };

  function findSchoolSubdomain() {
    const hostname = window.location.hostname.toLowerCase();
    const domainSuffixes = [
      ".creativesbee.site",
      ".cbt-frontend-sjlh.onrender.com",
      ".flama.com",
      ".localhost",
    ];
    for (const domainSuffix of domainSuffixes) {
      if (!hostname.endsWith(domainSuffix)) continue;
      const prefix = hostname.slice(0, -domainSuffix.length);
      if (prefix && !prefix.includes(".") && isValidSubdomain(prefix)) {
        return prefix;
      }
    }
    return "";
  }

  window.flamaSchoolSubdomain = findSchoolSubdomain;
  window.flamaSchoolHeaders = () => {
    const school = findSchoolSubdomain();
    return school ? { "X-School-Subdomain": school } : {};
  };

  findSchoolSubdomain();
})();
