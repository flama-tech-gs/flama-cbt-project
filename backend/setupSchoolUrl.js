// backend/setupSchoolUrl.js
// Uses existing setup-school-url.html IDs and logs onboarding diagnostics.

document.addEventListener("DOMContentLoaded", () => {
    const LOG_PREFIX = "[Setup School URL]";
    const input = document.getElementById("subdomain");
    const preview = document.getElementById("previewUrl");
    const copyButton = document.getElementById("copyUrl");
    const statusElement = document.getElementById("urlStatus");
    const form = document.getElementById("portalForm");
    const DOMAIN_SUFFIX = ".cbtflamaschool.ng";

    console.group(`${LOG_PREFIX} Page initialization`);
    console.log("Page URL:", window.location.href);
    console.log("API helper available:", typeof apiRequest === "function");
    console.log("Registration helpers:", {
        getRegistration: typeof getRegistration,
        saveRegistration: typeof saveRegistration,
    });
    console.log("Expected page elements:", {
        subdomain: Boolean(input),
        previewUrl: Boolean(preview),
        copyUrl: Boolean(copyButton),
        urlStatus: Boolean(statusElement),
        portalForm: Boolean(form),
    });
    console.groupEnd();

    if (!input || !form) {
        console.error(
            `${LOG_PREFIX} Required page elements are missing.`,
            {
                subdomain: Boolean(input),
                portalForm: Boolean(form),
            }
        );
        return;
    }

    if (
        typeof getRegistration !== "function" ||
        typeof saveRegistration !== "function"
    ) {
        console.error(
            `${LOG_PREFIX} Registration storage helpers are unavailable.`
        );
        showStatus(
            "Registration storage is unavailable. Refresh and try again.",
            "error"
        );
        return;
    }

    if (typeof apiRequest !== "function") {
        console.error(`${LOG_PREFIX} apiRequest() is unavailable.`);
        showStatus(
            "The API helper is unavailable. Check that api.js loads before this file.",
            "error"
        );
        return;
    }

    let registration = {};

    try {
        registration = getRegistration() || {};

        // Log only field names and whether ID fields exist.
        // Do not log the full registration object: it may contain tokens.
        console.group(`${LOG_PREFIX} Registration storage`);
        console.log("Registration keys:", Object.keys(registration));
        console.log("Draft ID field presence:", {
            onboardingDraftId: Boolean(registration.onboardingDraftId),
            draftId: Boolean(registration.draftId),
            onboardingDraftIdNested: Boolean(
                registration.onboardingDraft?._id
            ),
            draftIdNested: Boolean(
                registration.draft?._id || registration.draft?.id
            ),
        });
        console.log("School data available:", {
            registeredSchool: Boolean(registration.registeredSchool),
            school: Boolean(registration.school),
            registeredSchoolKeys: Object.keys(
                registration.registeredSchool || {}
            ),
            schoolKeys: Object.keys(registration.school || {}),
        });
        console.groupEnd();
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Could not read registration storage:`,
            error
        );
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
        console.error(
            `${LOG_PREFIX} No onboarding draft ID was found.`,
            {
                availableRegistrationKeys: Object.keys(registration),
                expectedFields: [
                    "onboardingDraftId",
                    "draftId",
                    "onboardingDraft._id",
                    "draft._id",
                    "draft.id",
                ],
                currentPage: window.location.href,
            }
        );

        showStatus(
            "Onboarding draft ID is missing. Check the console diagnostics and registration verification response.",
            "error"
        );

        form
            .querySelector('[type="submit"]')
            ?.setAttribute("disabled", "disabled");

        return;
    }

    console.log(`${LOG_PREFIX} Draft ID found.`);

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
        return value ? `https://${value}${DOMAIN_SUFFIX}` : "";
    }

    function showStatus(message, state = "info") {
        if (!statusElement) {
            console.warn(
                `${LOG_PREFIX} Cannot show status; #urlStatus is missing.`,
                { message, state }
            );
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

        console.log(`${LOG_PREFIX} Status:`, { state, message });
    }

    function updatePreview(value = input.value.trim()) {
        if (preview) {
            preview.textContent =
                portalUrl(value) ||
                "https://your-school.cbtflamaschool.ng";
        }
    }

    async function checkAvailability(value, sequence) {
        console.group(`${LOG_PREFIX} Subdomain availability check`);
        console.log("Subdomain:", value);
        console.log("Check sequence:", sequence);
        console.log("Draft ID present:", Boolean(draftId));

        if (!isValidSlug(value)) {
            availableSubdomain = "";
            console.warn("Subdomain format is invalid.");
            showStatus(
                "Use 3–30 lowercase letters, numbers, and hyphens between words.",
                "error"
            );
            console.groupEnd();
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

            console.log("Request path:", path);

            const response = await apiRequest(path);

            // Ignore a stale response if the user has since typed again.
            if (sequence !== checkSequence) {
                console.warn("Ignoring stale availability response.");
                console.groupEnd();
                return;
            }

            console.log("Availability response:", response);

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
                console.warn(
                    "Ignoring stale availability error:",
                    error
                );
                console.groupEnd();
                return;
            }

            availableSubdomain = "";
            console.error(
                `${LOG_PREFIX} Availability request failed:`,
                {
                    message: error?.message,
                    error,
                }
            );
            showStatus(
                error?.message ||
                    "Could not check this subdomain. Try again.",
                "error"
            );
        }

        console.groupEnd();
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

    console.log(`${LOG_PREFIX} Initial subdomain value:`, input.value);

    input.addEventListener("input", scheduleAvailabilityCheck);
    updatePreview();
    scheduleAvailabilityCheck();

    copyButton?.addEventListener("click", async () => {
        const subdomain = input.value.trim().toLowerCase();
        const url = portalUrl(subdomain);

        console.log(`${LOG_PREFIX} Copy button clicked.`, {
            subdomain,
            valid: isValidSlug(subdomain),
        });

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
            console.warn(
                `${LOG_PREFIX} Clipboard API failed; showing prompt.`,
                error
            );
            window.prompt("Copy your school portal URL:", url);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const subdomain = input.value.trim().toLowerCase();

        console.group(`${LOG_PREFIX} Portal activation`);
        console.log("Submitted subdomain:", subdomain);
        console.log("Subdomain valid:", isValidSlug(subdomain));
        console.log("Availability confirmed:", availableSubdomain === subdomain);
        console.log("Draft ID present:", Boolean(draftId));

        if (!isValidSlug(subdomain)) {
            showStatus(
                "Enter a valid subdomain before continuing.",
                "error"
            );
            input.focus();
            console.groupEnd();
            return;
        }

        if (availableSubdomain !== subdomain) {
            showStatus(
                "Wait for the availability check to confirm this subdomain.",
                "error"
            );

            await checkAvailability(subdomain, ++checkSequence);

            if (availableSubdomain !== subdomain) {
                console.error(
                    `${LOG_PREFIX} Activation stopped because availability was not confirmed.`
                );
                console.groupEnd();
                return;
            }
        }

        if (isSubmitting) {
            console.warn(
                `${LOG_PREFIX} Ignored duplicate form submission.`
            );
            console.groupEnd();
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

            console.log("Activation request:", {
                method: "POST",
                path,
                body: requestBody,
            });

            const result = await apiRequest(path, {
                method: "POST",
                body: JSON.stringify(requestBody),
            });

            console.log("Activation response:", result);

            const activatedSchool =
                result?.school || result?.activatedSchool;

            const finalUrl =
                result?.portalUrl ||
                portalUrl(
                    activatedSchool?.subdomain || subdomain
                );

            if (!activatedSchool?.id && !activatedSchool?._id) {
                throw new Error(
                    "The server did not return the activated school record."
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

            console.log(
                `${LOG_PREFIX} Portal activated. Redirecting.`,
                {
                    portalUrl: finalUrl,
                    schoolIdPresent: Boolean(
                        activatedSchool.id ||
                        activatedSchool._id
                    ),
                }
            );

            console.groupEnd();
            window.location.href = "./portal-activated.html";
        } catch (error) {
            console.error(
                `${LOG_PREFIX} Portal activation failed:`,
                {
                    message: error?.message,
                    error,
                }
            );

            showStatus(
                error?.message ||
                    "Unable to activate the portal. Please try again.",
                "error"
            );

            isSubmitting = false;

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }

            console.groupEnd();
        }
    });
});