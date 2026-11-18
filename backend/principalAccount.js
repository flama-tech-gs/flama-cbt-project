//backend/principalAccount.js

const API_BASE = (window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api"));
const TOKEN_KEY = "flamaAccessToken";

function schoolHostLabel(school) {
    const currentHost = window.location.hostname.toLowerCase();
    if (
        school?.subdomain &&
        (currentHost === "creativesbee.site" ||
            currentHost.endsWith(".creativesbee.site"))
    ) {
        return `${school.subdomain}.creativesbee.site`;
    }
    try {
        if (school?.url) return new URL(school.url).host;
    } catch {
        // Use the saved subdomain if the API URL is malformed.
    }
    return school?.subdomain
        ? `${school.subdomain}.creativesbee.site`
        : "School URL unavailable";
}

const createForm = document.querySelector("#createPrincipalForm");
const passwordForm = document.querySelector("#principalPasswordForm");
const deactivateButton = document.querySelector("#deactivatePrincipalBtn");
let currentPrincipal = null;

function notify(message, kind = "success") {
    const region = document.querySelector("#ownerToastRegion");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = `owner-toast is-${kind}`;
    toast.setAttribute("role", kind === "error" ? "alert" : "status");
    const icon = document.createElement("span");
    icon.textContent = kind === "error" ? "!" : "✓";
    const text = document.createElement("span");
    text.textContent = message;
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Close notification");
    close.textContent = "×";
    close.addEventListener("click", () => toast.remove());
    toast.append(icon, text, close);
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 5000);
}

function accessMessage(message) {
    return /invalid or expired access token/i.test(String(message))
        ? "Access Invalid or Expired"
        : message;
}

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
        currentPrincipal = principal;
        const school = dashboard.school || {};
        const subscription = dashboard.subscription || {};

        setText("#schoolName", school.name || "School");
        setText("#accountSchoolName", school.name || "School");
        setText("#principalSchoolName", school.name || "School");

        const schoolUrl = document.querySelector("#schoolUrl");
        if (schoolUrl) {
            schoolUrl.textContent = schoolHostLabel(school);

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
        notify(accessMessage(error.message || "Could not load principal account."), "error");
    }
}

createForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = new FormData(createForm);
    const confirmed = document.querySelector("#confirmReplacement")?.checked;

    if (!confirmed) {
        notify("Confirm that you want to create or replace the principal.", "error");
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

        notify(result.message || "Principal account created.");
        createForm.reset();
        await loadPrincipalPage();
    } catch (error) {
        console.error("Could not create principal:", error);
        notify(accessMessage(error.message || "Could not create principal."), "error");
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
        notify("The passwords do not match.", "error");
        return;
    }

    if (newPassword.length < 8) {
        notify("The password must contain at least 8 characters.", "error");
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

        notify(result.message || "Principal password reset successfully.");
        passwordForm.reset();
    } catch (error) {
        console.error("Could not reset principal password:", error);
        notify(accessMessage(error.message || "Could not reset principal password."), "error");
    } finally {
        if (button) button.disabled = false;
    }
});

deactivateButton?.addEventListener("click", async () => {
    if (!window.confirm("Deactivate the principal account? The principal will lose access.")) return;

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

        notify(result.message || "Principal account deactivated.");
        await loadPrincipalPage();
    } catch (error) {
        console.error("Could not deactivate principal:", error);
        notify(accessMessage(error.message || "Could not deactivate principal."), "error");
    } finally {
        deactivateButton.disabled = false;
    }
});

document.addEventListener("DOMContentLoaded", loadPrincipalPage);

document.querySelectorAll(".password-toggle[data-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
        const input = document.getElementById(toggle.dataset.target);
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
        toggle.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
        const icon = toggle.querySelector("i");
        if (icon) {
            icon.setAttribute("data-lucide", input.type === "password" ? "eye" : "eye-off");
            window.lucide?.createIcons();
        }
    });
});

const editForm = document.querySelector("#editPrincipalForm");
document.querySelector("#editProfileBtn")?.addEventListener("click", () => {
    if (!currentPrincipal?._id) return notify("No principal profile is available to edit.", "error");
    editForm.hidden = false;
    document.querySelector(".details-grid").hidden = true;
    document.querySelector("#editPrincipalTitle").value = currentPrincipal.title || "Mr";
    document.querySelector("#editPrincipalFirstName").value = currentPrincipal.firstName || "";
    document.querySelector("#editPrincipalLastName").value = currentPrincipal.lastName || "";
    document.querySelector("#editPrincipalPhone").value = currentPrincipal.phone || "";
    document.querySelector("#editPrincipalEmail").value = currentPrincipal.email || "";
    document.querySelector("#editProfileBtn").hidden = true;
});
function closeProfileEdit() {
    editForm.hidden = true;
    document.querySelector(".details-grid").hidden = false;
    document.querySelector("#editProfileBtn").hidden = false;
}
document.querySelector("#cancelEditProfileBtn")?.addEventListener("click", closeProfileEdit);
editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = editForm.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
        const payload = Object.fromEntries(new FormData(editForm).entries());
        const result = await requestJson(`${API_BASE}/owner/principal`, {
            method: "PATCH", headers: authHeaders(true), body: JSON.stringify(payload),
        });
        notify(result.message || "Principal profile updated successfully.");
        closeProfileEdit();
        await loadPrincipalPage();
    } catch (error) {
        notify(accessMessage(error.message || "Could not update principal profile."), "error");
    } finally { submit.disabled = false; }
});
