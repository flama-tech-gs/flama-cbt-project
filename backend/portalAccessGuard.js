// Protects portal pages before their page scripts can make authenticated requests.
(() => {
  "use strict";

  const portal = window.location.pathname.split("/").filter(Boolean)[0];
  const settings = {
    student: {
      tokenKeys: ["studentAccessToken", "tenantAccessToken"],
      tokenType: "student",
      login: "/student/index.html",
      check: "/student-dashboard/profile",
    },
    teacher: {
      tokenKeys: ["teacherAccessToken", "tenantAccessToken"],
      tokenType: "teacher",
      login: "/teacher/index.html",
      check: "/teacher-dashboard/profile",
    },
    principal: {
      tokenKeys: ["principalAccessToken", "tenantAccessToken"],
      tokenType: "principal",
      login: "/principal/index.html",
      check: "/principal/profile",
    },
    "school-admin": {
      tokenKeys: ["flamaAccessToken"],
      tokenType: "tenant",
      requiredRole: "SCHOOL_OWNER",
      login: "/auth/login.html",
      check: "/owner/dashboard",
    },
    "platform-admin": {
      tokenKeys: ["adminAccessToken", "flamaAccessToken", "accessToken"],
      tokenType: "admin",
      login: "/platform-admin/admin-login.html",
      check: "/admin/auth/me",
    },
  }[portal];

  if (!settings) return;

  // Handle the logout controls centrally so every protected page uses the
  // same role-aware cleanup and school-aware login destination.
  const logoutSelectors = {
    student: ".logout-btn, .logout-link, .account-menu__logout",
    teacher: ".logout-btn, .logout-link, .account-menu__logout",
    principal: ".logout-btn, .logout-link, .account-menu__logout",
    "school-admin": ".logout-btn, .logout-link, .account-menu__logout",
    "platform-admin": ".logout-btn, .logout-link, .account-menu__logout",
  };
  const authKeys = [
    "studentAccessToken", "studentRefreshToken", "studentUser",
    "teacherAccessToken", "teacherRefreshToken", "teacherUser", "teacherToken",
    "principalAccessToken", "principalRefreshToken", "principalAccount",
    "tenantAccessToken", "flamaAccessToken", "flamaRefreshToken", "flamaOwner",
    "flamaSchool", "flamaLogin", "adminAccessToken", "adminRefreshToken",
    "accessToken", "refreshToken", "schoolRegistration",
  ];
  document.addEventListener("click", (event) => {
    const control = event.target instanceof Element
      ? event.target.closest(logoutSelectors[portal])
      : null;
    if (!control) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    for (const key of authKeys) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
    for (const key of ["flamaPortalAuthCheck:student", "flamaPortalAuthCheck:teacher",
      "flamaPortalAuthCheck:principal", "flamaPortalAuthCheck:school-admin",
      "flamaPortalAuthCheck:platform-admin"]) {
      sessionStorage.removeItem(key);
    }

    const destination = new URL(settings.login, window.location.origin);
    window.location.replace(destination.href);
  }, true);

  let authorized = false;
  document.documentElement.style.visibility = "hidden";
  document.addEventListener(
    "DOMContentLoaded",
    (event) => {
      if (!authorized) {
        event.stopImmediatePropagation();
        event.stopPropagation();
      }
    },
    true
  );

  const readToken = () => {
    for (const key of settings.tokenKeys) {
      const token = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (token) return { key, token };
    }
    return null;
  };

  const clearTokens = () => {
    for (const key of settings.tokenKeys) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  };

  const decodeToken = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Malformed token");
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="));
    return JSON.parse(decodeURIComponent(Array.from(decoded, (char) =>
      `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
    ).join("")));
  };

  const showNotFound = () => {
    document.documentElement.style.visibility = "visible";
    document.title = "404 | Page not found";
    if (!document.body) {
      document.documentElement.appendChild(document.createElement("body"));
    }
    document.body.innerHTML = `
      <main style="min-height:100vh;display:grid;place-content:center;text-align:center;font:16px/1.5 Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#202124;background:#f8faf8;padding:24px">
        <h1 style="font-size:5rem;line-height:1;margin:0;color:#2e7d32">404</h1>
        <p style="font-size:1.25rem">This page is unavailable.</p>
        <a href="/" style="color:#2e7d32">Return to home</a>
      </main>`;
  };

  const apiBase = () => {
    if (window.FLAMA_API_BASE) return window.FLAMA_API_BASE;
    const host = window.location.hostname;
    const local = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
    return local
      ? `${window.location.protocol}//${host}:5000/api`
      : "https://flama.onrender.com/api";
  };

  const validSchoolSlug = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized.length >= 3 && normalized.length <= 30 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized);
  };
  let schoolSlug = "";
  const hostname = window.location.hostname.toLowerCase();
  for (const suffix of [".creativesbee.site", ".cbt-frontend-sjlh.onrender.com", ".flama.com", ".localhost"]) {
    if (!hostname.endsWith(suffix)) continue;
    const prefix = hostname.slice(0, -suffix.length);
    if (prefix && !prefix.includes(".") && validSchoolSlug(prefix)) {
      schoolSlug = prefix;
      break;
    }
  }

  // The www host is the central frontend alias, not a tenant subdomain.
  // When an owner signs in there, use the school returned by onboarding login
  // to scope authenticated portal requests to the correct tenant.
  if (
    portal === "school-admin" &&
    ["creativesbee.site", "www.creativesbee.site"].includes(hostname)
  ) {
    try {
      const school = JSON.parse(
        sessionStorage.getItem("flamaSchool") ||
          localStorage.getItem("flamaSchool") ||
          "null"
      );
      if (validSchoolSlug(school?.subdomain)) {
        schoolSlug = school.subdomain.trim().toLowerCase();
      }
    } catch {
      // The existing guard will reject the page if there is no valid tenant.
    }
  }

  if (validSchoolSlug(schoolSlug)) {
    schoolSlug = schoolSlug.trim().toLowerCase();
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, options = {}) => {
      let requestUrl;
      try {
        requestUrl = new URL(
          typeof input === "string" ? input : input.url,
          window.location.href
        );
        const apiUrl = new URL(apiBase(), window.location.href);
        const apiPath = apiUrl.pathname.replace(/\/+$/, "");
        const isApiRequest =
          requestUrl.origin === apiUrl.origin &&
          (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`));

        if (isApiRequest) {
          const headers = new Headers(
            typeof Request !== "undefined" && input instanceof Request
              ? input.headers
              : undefined
          );
          new Headers(options.headers || {}).forEach((value, key) => {
            headers.set(key, value);
          });
          headers.set("X-School-Subdomain", schoolSlug);
          return nativeFetch(input, { ...options, headers });
        }
      } catch {
        // Let fetch report malformed inputs and preserve non-API behavior.
      }
      return nativeFetch(input, options);
    };
  }

  const redirectToLogin = () => {
    clearTokens();
    window.location.replace(settings.login);
  };

  async function tokenFingerprint(token) {
    try {
      if (!window.crypto?.subtle) return null;
      const bytes = new TextEncoder().encode(token);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
    } catch {
      return null;
    }
  }

  async function protect() {
    if (portal !== "platform-admin" && !validSchoolSlug(schoolSlug)) {
      showNotFound();
      return;
    }

    if (portal !== "platform-admin") {
      try {
        const schoolResponse = await fetch(
          `${apiBase()}/tenant/auth/school-info`,
          {
            headers: {
              Accept: "application/json",
              "X-School-Subdomain": schoolSlug,
            },
            cache: "no-store",
          }
        );

        if (schoolResponse.status === 404) {
          showNotFound();
          return;
        }
      } catch {
        // Continue to the authenticated portal check during a temporary outage.
      }
    }

    const stored = readToken();
    if (!stored) {
      redirectToLogin();
      return;
    }

    let claims;
    try {
      claims = decodeToken(stored.token);
    } catch {
      showNotFound();
      return;
    }

    if (Number.isFinite(claims.exp) && claims.exp * 1000 <= Date.now()) {
      redirectToLogin();
      return;
    }

    const type = String(claims.type || claims.tokenType || "").toLowerCase();
    const role = String(claims.role?.name || claims.role || claims.roleName || "").toUpperCase();
    if (type !== settings.tokenType || (settings.requiredRole && role !== settings.requiredRole)) {
      showNotFound();
      return;
    }

    const cacheKey = `flamaPortalAuthCheck:${portal}`;
    const fingerprint = await tokenFingerprint(stored.token);
    if (fingerprint) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (
          cached?.fingerprint === fingerprint &&
          Date.now() - cached.checkedAt < 60_000
        ) {
          authorized = true;
          document.documentElement.style.visibility = "visible";
          document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
          return;
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    try {
      const response = await fetch(`${apiBase()}${settings.check}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${stored.token}` },
        cache: "no-store",
      });
      if (response.status === 401) {
        // A token whose exp has passed was already routed to login above.
        // Any remaining 401 means the token is invalid or no longer accepted.
        showNotFound();
        return;
      }
      if (response.status === 403 || response.status === 404) {
        showNotFound();
        return;
      }
      if (!response.ok) {
        document.documentElement.style.visibility = "visible";
        authorized = true;
        document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
        return;
      }
      if (fingerprint) {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          fingerprint,
          checkedAt: Date.now(),
        }));
      }
    } catch {
      // Keep the normal page available during a temporary API/network outage.
    }

    authorized = true;
    document.documentElement.style.visibility = "visible";
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
  }

  protect();
})();
