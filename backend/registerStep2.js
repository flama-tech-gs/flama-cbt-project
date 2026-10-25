// backend/registerStep2.js
// Keeps the existing register-step2.html IDs and saves owner details through
// the staged onboarding draft endpoint. The password is sent to the backend
// over HTTPS and is never saved in browser storage.

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("step2Form");

    if (!form) {
        console.error("Step 2 form (#step2Form) was not found.");
        return;
    }

    const approvalInput = document.getElementById("approvalDocument");
    const approvalPreview = document.getElementById("approvalPreview");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const strengthText = document.getElementById("strengthText");
    const strengthBars = [...document.querySelectorAll(".strength-bar")];
    const passwordRuleItems = [
        ...document.querySelectorAll(".password-rules li"),
    ];

    const submitButton = document.querySelector(
        'button[form="step2Form"][type="submit"]'
    ) || form.querySelector('button[type="submit"], input[type="submit"]');

    const backButton = document.getElementById("backBtn");
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    let approvalPreviewUrl = null;

    function setMessage(message, isError = true) {
        let messageElement = document.getElementById("step2Message");
        if (!messageElement) {
            messageElement = document.createElement("p");
            messageElement.id = "step2Message";
            messageElement.setAttribute("role", "status");
            messageElement.setAttribute("aria-live", "polite");
            form.insertAdjacentElement("afterend", messageElement);
        }
        messageElement.textContent = message;
        messageElement.style.color = isError ? "#b42318" : "#16794b";
    }

    function clearApprovalPreview() {
        if (approvalPreviewUrl) {
            URL.revokeObjectURL(approvalPreviewUrl);
            approvalPreviewUrl = null;
        }
        if (approvalPreview) {
            approvalPreview.replaceChildren();
            approvalPreview.style.display = "none";
        }
    }

    function showApprovalPreview(file) {
        if (!approvalPreview) return;
        clearApprovalPreview();
        approvalPreview.style.display = "block";

        const card = document.createElement("div");
        card.style.cssText = "display:flex;align-items:center;gap:14px;padding:14px;border:1px solid #d9e2ec;border-radius:10px;background:#fff;max-width:100%;box-sizing:border-box;";

        const details = document.createElement("div");
        details.style.cssText = "flex:1;min-width:0;overflow-wrap:anywhere;";

        const name = document.createElement("p");
        name.textContent = file.name;
        name.style.cssText = "margin:0 0 5px;font-weight:600;";

        const size = document.createElement("p");
        size.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        size.style.cssText = "margin:0;color:#64748b;font-size:13px;";
        details.append(name, size);

        if (file.type.startsWith("image/")) {
            approvalPreviewUrl = URL.createObjectURL(file);
            const image = document.createElement("img");
            image.src = approvalPreviewUrl;
            image.alt = "Approval document preview";
            image.style.cssText = "width:90px;height:90px;object-fit:cover;border-radius:8px;flex-shrink:0;";
            card.appendChild(image);
        } else {
            const pdf = document.createElement("div");
            pdf.textContent = "PDF";
            pdf.style.cssText = "display:flex;align-items:center;justify-content:center;width:65px;height:75px;flex-shrink:0;border-radius:8px;background:#fee2e2;color:#b91c1c;font-weight:700;";
            card.appendChild(pdf);
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.style.cssText = "border:0;background:transparent;color:#dc2626;cursor:pointer;font-weight:600;flex-shrink:0;";
        remove.addEventListener("click", () => {
            clearApprovalPreview();
            if (approvalInput) approvalInput.value = "";
        });

        card.append(details, remove);
        approvalPreview.appendChild(card);
    }

    function validateApprovalFile(file) {
        if (!file) return true;
        const validType = allowedTypes.includes(file.type);
        const validExtension = allowedExtensions.test(file.name);
        if (!validType || !validExtension) {
            setMessage("Choose a PDF, JPG, JPEG, or PNG approval document.");
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            setMessage("The approval document must not exceed 5 MB.");
            return false;
        }
        return true;
    }

    approvalInput?.addEventListener("change", () => {
        clearApprovalPreview();
        const file = approvalInput.files?.[0];
        if (!file) return;
        if (!validateApprovalFile(file)) {
            approvalInput.value = "";
            return;
        }
        showApprovalPreview(file);
    });

    // Password rules: minimum 8 characters, uppercase, lowercase, and number.
    function getPasswordChecks(password) {
        return [
            password.length >= 8,
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /\d/.test(password),
        ];
    }

    function updatePasswordStrength() {
        const password = passwordInput?.value || "";
        const checks = getPasswordChecks(password);
        const score = checks.filter(Boolean).length;
        const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];

        if (strengthText) {
            strengthText.textContent = password
                ? `Password strength: ${labels[score]}`
                : "Password strength: Enter a password";
        }

        strengthBars.forEach((bar, index) => {
            bar.classList.toggle("active", index < score);
            bar.classList.toggle("weak", score <= 1 && index < score);
            bar.classList.toggle("medium", score === 2 && index < score);
            bar.classList.toggle("strong", score >= 3 && index < score);
        });

        const rulePasses = [
            checks[0],
            checks[1] && checks[2],
            checks[3],
        ];
        const ruleLabels = [
            "Min 8 characters",
            "Uppercase & lowercase",
            "Number",
        ];

        passwordRuleItems.forEach((item, index) => {
            const icon = item.querySelector("i");
            const passed = Boolean(rulePasses[index]);
            item.classList.toggle("valid", passed);
            if (icon) {
                icon.classList.toggle("ri-check-line", passed);
                icon.classList.toggle("ri-close-line", !passed);
                const textNode = [...item.childNodes].find(
                    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                );
                if (textNode && ruleLabels[index]) {
                    textNode.textContent = ` ${ruleLabels[index]}`;
                }
            }
        });
    }

    passwordInput?.addEventListener("input", updatePasswordStrength);

    // Keep the existing eye buttons; toggle only their associated input.
    document.querySelectorAll(".password-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const input = button.parentElement?.querySelector("input");
            const icon = button.querySelector("i");
            if (!input) return;
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            if (icon) {
                icon.classList.toggle("ri-eye-line", !show);
                icon.classList.toggle("ri-eye-off-line", show);
            }
            button.setAttribute("aria-label", show ? "Hide password" : "Show password");
        });
    });

    function setSubmitting(isSubmitting) {
        if (!submitButton) return;
        submitButton.disabled = isSubmitting;
        if (submitButton.tagName === "BUTTON") {
            submitButton.textContent = isSubmitting
                ? "Saving registration..."
                : "Continue to Step 3";
        }
    }

    backButton?.addEventListener("click", () => {
        window.location.href = "./register-step1.html";
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setMessage("", false);

        const getValue = (name) =>
            String(form.elements[name]?.value || "").trim();

        const firstName = getValue("firstName");
        const lastName = getValue("lastName");
        const rawTitle = getValue("title");
        const title = rawTitle.replace(/\./g, "").trim();
        const ownerPhone = getValue("phone");
        const email = getValue("email").toLowerCase();
        const password = passwordInput?.value || "";
        const confirmPassword = confirmPasswordInput?.value || "";
        const passwordChecks = getPasswordChecks(password);

        if (!firstName || !lastName || !title || !email || !ownerPhone) {
            setMessage("Complete all required fields.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setMessage("Enter a valid email address.");
            return;
        }
        if (!passwordChecks.every(Boolean)) {
            setMessage("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
            passwordInput?.focus();
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Your passwords do not match.");
            confirmPasswordInput?.focus();
            return;
        }

        const approvalFile = approvalInput?.files?.[0] || null;
        if (!validateApprovalFile(approvalFile)) return;

        if (typeof getRegistration !== "function" || typeof saveRegistration !== "function") {
            setMessage("Registration storage is unavailable. Refresh the page and try again.");
            return;
        }
        if (typeof apiRequest !== "function") {
            setMessage("The API helper is unavailable. Refresh the page and try again.");
            return;
        }

        let registration;
        try {
            registration = getRegistration() || {};
        } catch (error) {
            console.error("Could not load registration data:", error);
            setMessage("Unable to load your school details. Please revisit Step 1.");
            return;
        }

        const school = registration.school || {};
        if (!school.schoolName || !school.registrationNumber) {
            setMessage("School details are missing. Please complete Step 1 again.");
            return;
        }

        const payload = new FormData();
        payload.append("schoolName", school.schoolName);
        payload.append("registrationNumber", school.registrationNumber);
        payload.append("schoolType", school.schoolType || "");
        payload.append("year", school.year || "");
        payload.append("address", school.address || "");
        payload.append("state", school.state || "");
        payload.append("localGovernment", school.localGovernment || "");
        payload.append("phone", school.phone || "");
        payload.append("officialEmail", school.officialEmail || "");
        payload.append("website", school.website || "");
        payload.append("ownerFirstName", firstName);
        payload.append("ownerLastName", lastName);
        payload.append("ownerTitle", title);
        payload.append("ownerEmail", email);
        payload.append("ownerPhone", ownerPhone);
        payload.append("ownerPassword", password);

        // The backend draft endpoint should accept these optional file fields.
        try {
            if (typeof getRegistrationFile === "function") {
                const savedLogo = await getRegistrationFile("schoolLogo");

                if (savedLogo) {
                    const extension = savedLogo.name?.match(/\.([^.]+)$/)?.[1]?.toLowerCase();

                    const mimeByExtension = {
                        jpg: "image/jpeg",
                        jpeg: "image/jpeg",
                        png: "image/png",
                        webp: "image/webp",
                    };

                    const mimeType =
                        savedLogo.type?.startsWith("image/")
                            ? savedLogo.type
                            : mimeByExtension[extension];

                    if (!mimeType) {
                        throw new Error(
                            "The school logo must be a JPG, PNG, or WebP image."
                        );
                    }

                    const filename =
                        savedLogo.name || `school-logo.${extension}`;

                    const logoFile = new File(
                        [savedLogo],
                        filename,
                        { type: mimeType }
                    );

                    payload.append("schoolLogo", logoFile, filename);
                }
            }
        } catch (error) {
            console.warn("Could not read saved school logo:", error);
        }
        if (approvalFile) {
            payload.append("approvalDocument", approvalFile, approvalFile.name);
        }

        try {
            setSubmitting(true);

            // New staged-flow endpoint. It must store the draft centrally,
            // hash the password, and send the email OTP before returning.
            const result = await apiRequest("/onboarding/drafts", {
                method: "POST",
                body: payload,
            });

            const draftId = result?.draftId || result?.id || result?._id;
            if (!draftId) {
                throw new Error("The server did not return an onboarding draft ID.");
            }

            saveRegistration("onboardingDraftId", draftId);
            saveRegistration("ownerEmail", email);
            saveRegistration("registeredOwner", {
                firstName,
                lastName,
                title,
                email,
                phone: ownerPhone,
            });

            // Never store the password in sessionStorage or localStorage.
            window.location.href = "./verify-email.html";
        } catch (error) {
            console.error("Step 2 registration failed:", error);
            setMessage(error?.message || "Unable to save registration. Please try again.");
            setSubmitting(false);
        }
    });

    updatePasswordStrength();
});

