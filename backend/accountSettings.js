//backend/accountSettings.js

const API_BASE = "http://localhost:5000/api/owner";
const TOKEN_KEY = "flamaAccessToken";

const schoolDetailsForm = document.querySelector("#schoolDetailsForm");
const schoolLogoForm = document.querySelector("#schoolLogoForm");
const logoInput = document.querySelector("#logoUpload");
const logoPreview = document.querySelector("#currentLogo");
const logoFilename = document.querySelector("#logoFilename");

function getOwnerToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        throw new Error("Owner login token not found. Please log in again.");
    }

    return token;
}

function authHeaders({ json = false } = {}) {
    return {
        Accept: "application/json",
        Authorization: `Bearer ${getOwnerToken()}`,
        ...(json ? { "Content-Type": "application/json" } : {}),
    };
}

async function readResponse(response) {
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || `Request failed (${response.status})`
        );
    }

    return result;
}

function responseData(result) {
    return result.data ?? result;
}

function showMessage(message) {
    alert(message);
}

async function loadSchoolSettings() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`, {
            method: "GET",
            headers: authHeaders(),
        });

        const result = await readResponse(response);
        const { school, subscription } = responseData(result);

        if (!school) {
            throw new Error("Dashboard response did not include school details.");
        }

        setValue("#schoolName", school.name);
        setValue("#schoolType", school.schoolType);
        setValue("#registrationNumber", school.rcNumber);
        setValue("#yearFounded", school.year);
        setValue("#schoolAddress", school.address);
        setValue("#state", school.state);
        setValue("#lga", school.localGovernment);
        setValue("#phone", school.phone);
        setValue("#email", school.officialEmail);
        setValue("#website", school.website);
        setValue("#schoolSlug", school.subdomain);

        setText("#currentSchoolUrl", school.url || "School URL unavailable");

        setText(
            "#subscriptionExpiry",
            subscription?.expiresAt
                ? `Expires ${new Intl.DateTimeFormat("en-US", {month: "short",
                        day: "numeric",
                        year: "numeric",
                    }).format(new Date(subscription.expiresAt))}`
                : "No subscription expiry date"
        );

        if (school.image && logoPreview) {
            logoPreview.src = school.image;
        }

        const brandName = document.querySelector(
            ".school-brand__content h2"
        );
        if (brandName) brandName.textContent = school.name || "School";

        const accountName = document.querySelector(".account-info strong");
        if (accountName) accountName.textContent = school.name || "School";
    } catch (error) {
        console.error("Could not load school settings:", error);
        showMessage(error.message || "Could not load school settings.");
    }
}

function setValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.value = value ?? "";
}

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value ?? "";
}

schoolDetailsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = new FormData(schoolDetailsForm);
    const rawYear = form.get("year_founded");

    const payload = {
        name: String(form.get("school_name") || "").trim(),
        schoolType: String(form.get("school_type") || "").trim().toLowerCase(),
        rcNumber: String(form.get("registration_number") || "").trim(),
        year: rawYear ? Number(rawYear) : null,
        address: String(form.get("school_address") || "").trim(),
        state: String(form.get("state") || "").trim(),
        localGovernment: String(form.get("lga") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        officialEmail: String(form.get("email") || "").trim(),
        website: String(form.get("website") || "").trim(),
    };

    const button = schoolDetailsForm.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/school`, {
            method: "PATCH",
            headers: authHeaders({ json: true }),
            body: JSON.stringify(payload),
        });

        const result = await readResponse(response);
        showMessage(result.message || "School details updated.");
        await loadSchoolSettings();
    } catch (error) {
        console.error("Could not update school details:", error);
        showMessage(error.message || "Could not update school details.");
    } finally {
        if (button) button.disabled = false;
    }
});

logoInput?.addEventListener("change", () => {
    const file = logoInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showMessage("Choose an image file.");
        logoInput.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showMessage("Logo must be 2 MB or smaller.");
        logoInput.value = "";
        return;
    }

    if (logoPreview) {
        logoPreview.src = URL.createObjectURL(file);
    }

    if (logoFilename) {
        logoFilename.textContent = file.name;
    }
});

schoolLogoForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = logoInput?.files?.[0];
    if (!file) {
        showMessage("Choose a logo image first.");
        return;
    }

    const body = new FormData();
    body.append("logo", file);

    const button = schoolLogoForm.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/school/logo`, {
            method: "PATCH",
            headers: authHeaders(),
            body,
        });

        const result = await readResponse(response);
        const data = responseData(result);
        const imageUrl = data.school?.image || data.image;

        if (imageUrl && logoPreview) {
            logoPreview.src = imageUrl;
        }

        showMessage(result.message || "School logo updated.");
        logoInput.value = "";
    } catch (error) {
        console.error("Could not update school logo:", error);
        showMessage(error.message || "Could not update school logo.");
    } finally {
        if (button) button.disabled = false;
    }
});

// Subdomain changes are not supported by the backend code shown so far.
document.querySelector("#schoolUrlForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    showMessage("School URL changes are not enabled yet.");
});

document.addEventListener("DOMContentLoaded", loadSchoolSettings);