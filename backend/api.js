// backend/api.js

// const API_BASE_URL = "https://flama.onrender.com/api";
const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = sessionStorage.getItem("flamaAccessToken");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Do not manually set Content-Type for FormData.
    if (
        !(options.body instanceof FormData) &&
        options.body !== undefined
    ) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    // Read the response safely.
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
        console.error("API request failed:", {
            path,
            status: response.status,
            response: result,
        });

        // Support common backend validation-error formats.
        const validationDetails = Array.isArray(result.details)
            ? result.details
                .map(item => item.message || item.msg || "")
                .filter(Boolean)
                .join(", ")
            : "";

        const errorMessage =
    result.message ||
    (typeof result.data === "string" ? result.data : "") ||
    (Array.isArray(result.errors)
        ? result.errors
            .map((item) =>
                item.field
                    ? `${item.field}: ${item.message}`
                    : item.message
            )
            .filter(Boolean)
            .join("; ")
        : "") ||
    `Request failed (${response.status})`;

throw new Error(errorMessage);
    }

    return result.data ?? result;
}

function saveRegistration(key, value) {
    const registration = JSON.parse(
        sessionStorage.getItem("flamaRegistration") || "{}"
    );

    registration[key] = value;

    sessionStorage.setItem(
        "flamaRegistration",
        JSON.stringify(registration)
    );
}

function getRegistration() {
    return JSON.parse(
        sessionStorage.getItem("flamaRegistration") || "{}"
    );
}

function getApiErrorMessage(error) {
    return error?.message || "Something went wrong. Please try again.";
}
