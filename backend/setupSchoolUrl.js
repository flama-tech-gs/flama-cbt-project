// backend/setupSchoolUrl.js
// Validates the selected school address and activates the portal.

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("subdomain");
    const preview = document.getElementById("previewUrl");
    const copyButton = document.getElementById("copyUrl");
    const statusElement = document.getElementById("urlStatus");
    const form = document.getElementById("portalForm");


    if (!input || !form) {
        return;
    }

    if (
        typeof getRegistration !== "function" ||
        typeof saveRegistration !== "function"
    ) {
        showStatus(
            "Registration storage is unavailable. Refresh and try again.",
            "error"
        );
        return;
    }

    if (typeof apiRequest !== "function") {
        showStatus(
            "We couldn’t connect to the school portal service. Refresh the page and try again.",
            "error"
        );
        return;
    }

    let registration = {};

    try {
        registration = getRegistration() || {};

    } catch {
        showStatus("Unable to load your onboarding details.", "error");
        return;
    }

    const draftId =
        registration.onboardingDraftId ||
        registration.draftId ||
        registration.onboardingDraft?._id ||
        registration.draft?._id ||
        registration.draft?.id ||
        "";

    const school = registration.registeredSchool || {};

    if (!draftId) {

        showStatus(
            "Your saved registration could not be found. Please sign in again to resume, or start a new registration.",
            "error"
        );

        form
            .querySelector('[type="submit"]')
            ?.setAttribute("disabled", "disabled");

        return;
    }


    let availableSubdomain = "";
    let checkTimer = null;
    let checkSequence = 0;
    let isSubmitting = false;

    const slugify = (value) =>
        String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 30);

    const isValidSlug = (value) =>
        value.length >= 3 &&
        value.length <= 30 &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

    function portalUrl(value) {
        if (!value) return "";
        const hostname = window.location.hostname.toLowerCase();
        const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
        const domain = isLocal
            ? "localhost"
            : (window.FLAMA_SCHOOL_DOMAIN || "creativesbee.site");
        const port = isLocal && window.location.port ? `:${window.location.port}` : "";
        const url = new URL("/auth/login.html", `${isLocal ? "http" : "https"}://${value}.${domain}${port}`);
        return url.toString();
    }

    function showStatus(message, state = "info") {
        if (!statusElement) {
            return;
        }

        statusElement.classList.remove(
            "available",
            "unavailable",
            "checking",
            "error"
        );

        const statusClass =
            state === "available"
                ? "available"
                : state === "checking"
                  ? "checking"
                  : state === "error"
                    ? "unavailable"
                    : state === "unavailable"
                      ? "unavailable"
                      : "checking";

        statusElement.classList.add(statusClass);

        const iconClass =
            state === "available"
                ? "ri-check-line"
                : state === "checking"
                  ? "ri-loader-4-line"
                  : state === "unavailable"
                    ? "ri-close-line"
                    : "ri-information-line";

        statusElement.replaceChildren();

        const iconElement = document.createElement("i");
        iconElement.className = iconClass;

        statusElement.append(
            iconElement,
            document.createTextNode(` ${message}`)
        );

    }

    function updatePreview(value = input.value.trim()) {
        if (preview) {
            preview.textContent =
                portalUrl(value) ||
                "https://your-school.creativesbee.site/auth/login.html";
        }
    }

    async function checkAvailability(value, sequence) {

        if (!isValidSlug(value)) {
            availableSubdomain = "";
            showStatus(
                "Use 3–30 lowercase letters, numbers, and hyphens between words.",
                "error"
            );
            return;
        }

        showStatus("Checking availability...", "checking");

        try {
            const query = new URLSearchParams({
                subdomain: value,
                draftId: String(draftId),
            });

            const path =
                `/onboarding/subdomain-availability?${query.toString()}`;


            const response = await apiRequest(path);

            // Ignore a stale response if the user has since typed again.
            if (sequence !== checkSequence) {
                return;
            }


            if (response?.available === true) {
                availableSubdomain = value;
                showStatus("Available", "available");
            } else {
                availableSubdomain = "";
                showStatus(
                    response?.message ||
                        "This subdomain is already in use.",
                    "unavailable"
                );
            }
        } catch (error) {
            if (sequence !== checkSequence) {
                return;
            }

            availableSubdomain = "";
            showStatus(typeof getApiErrorMessage === "function"
                ? getApiErrorMessage(error, "Could not check this school address. Please try again.")
                : "Could not check this school address. Please try again.", "error");
        }

    }

    function scheduleAvailabilityCheck() {
        const value = input.value.trim().toLowerCase();

        input.value = value;
        updatePreview(value);
        availableSubdomain = "";
        checkSequence += 1;

        const sequence = checkSequence;
        clearTimeout(checkTimer);

        if (!value) {
            showStatus("Choose a subdomain", "info");
            return;
        }

        checkTimer = setTimeout(
            () => checkAvailability(value, sequence),
            350
        );
    }

    // The owner can edit the suggested subdomain.
    input.readOnly = false;
    input.value = slugify(
        school.name ||
        registration.school?.schoolName ||
        registration.schoolName ||
        ""
    );


    input.addEventListener("input", scheduleAvailabilityCheck);
    updatePreview();
    scheduleAvailabilityCheck();

    copyButton?.addEventListener("click", async () => {
        const subdomain = input.value.trim().toLowerCase();
        const url = portalUrl(subdomain);


        if (!isValidSlug(subdomain)) {
            showStatus(
                "Choose a valid subdomain before copying the URL.",
                "error"
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            showStatus("Portal URL copied", "available");
        } catch (error) {
            window.prompt("Copy your school portal URL:", url);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const subdomain = input.value.trim().toLowerCase();


        if (!isValidSlug(subdomain)) {
            showStatus(
                "Enter a valid subdomain before continuing.",
                "error"
            );
            input.focus();
            return;
        }

        if (availableSubdomain !== subdomain) {
            showStatus(
                "Wait for the availability check to confirm this subdomain.",
                "error"
            );

            await checkAvailability(subdomain, ++checkSequence);

            if (availableSubdomain !== subdomain) {
                return;
            }
        }

        if (isSubmitting) {
            return;
        }

        const submitButton =
            form.querySelector('[type="submit"]');
        const originalText =
            submitButton?.textContent ||
            "Confirm & Activate School Portal";

        isSubmitting = true;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Activating portal...";
        }

        try {
            const path =
                `/onboarding/drafts/${encodeURIComponent(draftId)}/activate`;

            const requestBody = { subdomain };


            const result = await apiRequest(path, {
                method: "POST",
                body: JSON.stringify(requestBody),
            });


            const activatedSchool =
                result?.school || result?.activatedSchool;

            const finalUrl =
                result?.portalUrl ||
                portalUrl(
                    activatedSchool?.subdomain || subdomain
                );

            if (!activatedSchool?.id && !activatedSchool?._id) {
                throw new Error(
                    "We couldn’t finish activating your school portal. Please sign in again to resume, or contact support if the issue continues."
                );
            }

            saveRegistration("registeredSchool", {
                ...school,
                id: activatedSchool.id || activatedSchool._id,
                name:
                    activatedSchool.name ||
                    school.name ||
                    registration.school?.schoolName ||
                    registration.schoolName ||
                    "",
                subdomain:
                    activatedSchool.subdomain || subdomain,
                status: activatedSchool.status || "ACTIVE",
            });

            saveRegistration("portalUrl", finalUrl);
            saveRegistration("portalActivated", true);


            window.location.href = "./portal-activated.html";
        } catch (error) {

            showStatus(typeof getApiErrorMessage === "function"
                ? getApiErrorMessage(error, "Unable to activate the portal. Please try again.")
                : "Unable to activate the portal. Please try again.", "error");

            isSubmitting = false;

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }

        }
    });
});
