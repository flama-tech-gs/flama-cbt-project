//backend/ownerSupport.js

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

function getOwnerToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        throw new Error("Your login session has expired. Please log in again.");
    }

    return token;
}

async function loadOwnerSupportProfile() {
    try {
        const response = await fetch(`${API_BASE}/owner/dashboard`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${getOwnerToken()}`,
            },
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || `Request failed (${response.status})`
            );
        }

        // Handle ApiResponse.data and an optional nested data wrapper.
        let data = result;

        for (let i = 0; i < 4; i += 1) {
            if (
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                data.data !== undefined
            ) {
                data = data.data;
            } else {
                break;
            }
        }

        const school = data.school || {};
        const subscription = data.subscription || {};

        const schoolName = school.name || "School";
        const schoolNameElement = document.querySelector("#schoolName");
        const accountNameElement = document.querySelector("#accountSchoolName");

        if (schoolNameElement) schoolNameElement.textContent = schoolName;
        if (accountNameElement) accountNameElement.textContent = schoolName;

        const schoolUrlElement = document.querySelector("#schoolUrl");

        if (schoolUrlElement) {
            schoolUrlElement.textContent = schoolHostLabel(school);

            if (school.url) {
                schoolUrlElement.href = school.url;
                schoolUrlElement.target = "_blank";
                schoolUrlElement.rel = "noopener";
            } else {
                schoolUrlElement.removeAttribute("href");
            }
        }

        const expiryElement = document.querySelector("#headerExpiry");
        if (expiryElement) {
            const expiry = subscription.expiresAt;

            if (expiry && !Number.isNaN(new Date(expiry).getTime())) {
                expiryElement.textContent =
                    `Expires ${new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }).format(new Date(expiry))}`;
            } else {
                expiryElement.textContent = "No subscription expiry date";
            }
        }
    } catch (error) {
        console.error("Could not load owner support profile:", error);

        const expiryElement = document.querySelector("#headerExpiry");
        if (expiryElement) expiryElement.textContent = "Expiry unavailable";

        const urlElement = document.querySelector("#schoolUrl");
        if (urlElement) urlElement.textContent = "School URL unavailable";
    }
}

document.addEventListener("DOMContentLoaded", loadOwnerSupportProfile);
