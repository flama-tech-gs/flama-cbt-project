// backend/api.js

// const API_BASE_URL = "https://flama.onrender.com/api";
const API_BASE_URL = (window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api"));

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
    "We couldn’t complete that request. Please try again.";

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    return result.data ?? result;
}

function saveRegistration(key, value) {
    const registration = JSON.parse(localStorage.getItem("schoolRegistration") || "{}");

    registration[key] = value;

    localStorage.setItem("schoolRegistration", JSON.stringify(registration));
}

function getRegistration() {
    return JSON.parse(localStorage.getItem("schoolRegistration") || "{}");
}

function getApiErrorMessage(error, fallback = "We couldn’t complete that request. Please try again.") {
    const message = String(error?.message || "").trim();
    const normalized = message.toLowerCase();

    if (/verification (code|otp).*(expired|invalid)|invalid.*(verification code|otp)|otp.*expired/.test(normalized)) {
        return "That verification code is invalid or has expired. Request a new code and try again.";
    }
    if (/reset (link|token).*(expired|invalid)|expired.*reset (link|token)|invalid.*reset (link|token)/.test(normalized)) {
        return "This password reset link is invalid or has expired. Request a new link and try again.";
    }
    if (/draft.*(expired|not found)|onboarding.*(expired|not found)/.test(normalized)) {
        return "Your saved registration is no longer available. Please start a new registration.";
    }
    if (error?.status === 401 || /access token|refresh token|onboarding payment token|jwt|unauthorized|authentication required|session.{0,20}(expired|terminated|ended)|token.{0,30}(expired|invalid)|expired.{0,30}token/.test(normalized)) {
        return "Session terminated. Please log in again to continue.";
    }
    if (/failed to fetch|networkerror|load failed/.test(normalized)) {
        return "We couldn’t connect right now. Check your internet connection and try again.";
    }
    if (error?.status >= 500) {
        return "We couldn’t complete that request right now. Please try again in a few minutes.";
    }
    if (!message || /request failed \(\d+\)|internal server error/.test(normalized)) {
        return fallback;
    }
    return message;
}
