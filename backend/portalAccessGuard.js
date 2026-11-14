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
      <main style="min-height:100vh;display:grid;place-content:center;text-align:center;font:16px/1.5 Arial,sans-serif;color:#263238;background:#f7f9fc;padding:24px">
        <h1 style="font-size:5rem;line-height:1;margin:0;color:#27833b">404</h1>
        <p style="font-size:1.25rem">This page is unavailable.</p>
        <a href="/" style="color:#27833b">Return to home</a>
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
