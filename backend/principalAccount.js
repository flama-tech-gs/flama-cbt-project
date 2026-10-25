//backend/principalAccount.js

const API_BASE = "http://localhost:5000/api";
const TOKEN_KEY = "flamaAccessToken";

const createForm = document.querySelector("#createPrincipalForm");
const passwordForm = document.querySelector("#principalPasswordForm");
const deactivateButton = document.querySelector("#deactivatePrincipalBtn");

function authHeaders(json = false) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        throw new Error("Your login session has expired. Please log in again.");
    }

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(json ? { "Content-Type": "application/json" } : {}),
    };
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || `Request failed (${response.status})`
        );
    }

    return result;
}

function unwrap(value) {
    let current = value;

    for (let i = 0; i < 4; i += 1) {
        if (
            current &&
            typeof current === "object" &&
            !Array.isArray(current) &&
            current.data !== undefined
        ) {
            current = current.data;
        } else {
            break;
        }
    }

    return current;
}

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value || "—";
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

async function loadPrincipalPage() {
    try {
        const headers = authHeaders();

        const [dashboardResult, principalResult] = await Promise.all([
            requestJson(`${API_BASE}/owner/dashboard`, { headers }),
            requestJson(`${API_BASE}/owner/principal`, { headers }),
        ]);

        const dashboard = unwrap(dashboardResult);
        const principal = unwrap(principalResult);
        const school = dashboard.school || {};
        const subscription = dashboard.subscription || {};

        setText("#schoolName", school.name || "School");
        setText("#accountSchoolName", school.name || "School");
        setText("#principalSchoolName", school.name || "School");

        const schoolUrl = document.querySelector("#schoolUrl");
        if (schoolUrl) {
            schoolUrl.textContent = school.url || "School URL unavailable";

            if (school.url) {
                schoolUrl.href = school.url;
                schoolUrl.target = "_blank";
                schoolUrl.rel = "noopener";
            } else {
                schoolUrl.removeAttribute("href");
            }
        }

        const expiry = subscription.expiresAt;
        setText(
            "#headerExpiry",
            expiry
                ? `Expires ${formatDate(expiry)}`
                : "No subscription expiry date"
        );

        if (!principal?._id) {
            setText("#principalFullName", "No principal account");
            setText("#principalInitials", "—");
            setText("#principalStatus", "No active principal");
            setText("#principalLastLogin", "Not available");
            setText("#principalFirstName", "—");
            setText("#principalLastName", "—");
            setText("#principalTitle", "—");
            setText("#principalPhone", "—");
            setText("#principalEmail", "—");
            setText("#principalJoined", "—");
            return;
        }

        const fullName = [
            principal.title,
            principal.firstName,
            principal.lastName,
        ].filter(Boolean).join(" ");

        setText("#principalFullName", fullName);
        setText(
            "#principalInitials",
            `${principal.firstName?.[0] || ""}${principal.lastName?.[0] || ""}`.toUpperCase()
        );
        setText("#principalStatus", principal.status || "Unknown");
        setText(
            "#principalLastLogin",
            principal.lastLogin
                ? formatDate(principal.lastLogin)
                : "Never logged in"
        );
        setText("#principalFirstName", principal.firstName);
        setText("#principalLastName", principal.lastName);
        setText("#principalTitle", principal.title);
        setText("#principalPhone", principal.phone);
        setText("#principalEmail", principal.email);
        setText("#principalJoined", formatDate(principal.createdAt));

        const status = document.querySelector("#principalStatus");
        if (status) {
            status.classList.toggle(
                "active",
                principal.status === "ACTIVE"
            );
        }
    } catch (error) {
        console.error("Could not load principal account:", error);
        alert(error.message || "Could not load principal account.");
    }
}

createForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = new FormData(createForm);
    const confirmed = document.querySelector("#confirmReplacement")?.checked;

    if (!confirmed) {
        alert("Confirm that you want to create or replace the principal.");
        return;
    }

    const payload = {
        title: form.get("title"),
        firstName: String(form.get("first_name") || "").trim(),
        lastName: String(form.get("last_name") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        email: String(form.get("principal_email") || "").trim(),
        password: String(form.get("temporary_password") || ""),
        confirmReplacement: true,
    };

    const button = createForm.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
        const result = await requestJson(`${API_BASE}/owner/principal`, {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        alert(result.message || "Principal account created.");
        createForm.reset();
        await loadPrincipalPage();
    } catch (error) {
        console.error("Could not create principal:", error);
        alert(error.message || "Could not create principal.");
    } finally {
        if (button) button.disabled = false;
    }
});

passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPassword =
        document.querySelector("#newPrincipalPassword")?.value || "";
    const confirmPassword =
        document.querySelector("#confirmPrincipalPassword")?.value || "";

    if (newPassword !== confirmPassword) {
        alert("The passwords do not match.");
        return;
    }

    if (newPassword.length < 8) {
        alert("The password must contain at least 8 characters.");
        return;
    }

    const button = passwordForm.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
        const result = await requestJson(
            `${API_BASE}/owner/principal/password`,
            {
                method: "PATCH",
                headers: authHeaders(true),
                body: JSON.stringify({ newPassword }),
            }
        );

        alert(result.message || "Principal password reset.");
        passwordForm.reset();
    } catch (error) {
        console.error("Could not reset principal password:", error);
        alert(error.message || "Could not reset principal password.");
    } finally {
        if (button) button.disabled = false;
    }
});

deactivateButton?.addEventListener("click", async () => {
    const confirmed = window.confirm(
        "Deactivate the principal account? The principal will lose access."
    );

    if (!confirmed) return;

    deactivateButton.disabled = true;

    try {
        const result = await requestJson(
            `${API_BASE}/owner/principal/deactivate`,
            {
                method: "PATCH",
                headers: authHeaders(true),
                body: JSON.stringify({}),
            }
        );

        alert(result.message || "Principal account deactivated.");
        await loadPrincipalPage();
    } catch (error) {
        console.error("Could not deactivate principal:", error);
        alert(error.message || "Could not deactivate principal.");
    } finally {
        deactivateButton.disabled = false;
    }
});

document.addEventListener("DOMContentLoaded", loadPrincipalPage);