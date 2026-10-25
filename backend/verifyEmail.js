document.addEventListener("DOMContentLoaded", initEmailVerification);

function initEmailVerification() {
    const form = document.getElementById("verifyForm");
    const otpInputs = [...document.querySelectorAll(".otp-input")];
    const resendLink = document.querySelector(".resend-link");
    const countdownElement = document.getElementById("countdown");
    const submitButton = form?.querySelector('button[type="submit"]');
    const emailElement = document.getElementById("schoolEmail");

    if (!form || otpInputs.length !== 6) {
        console.error("Verification form or OTP inputs are missing.");
        return;
    }

    if (typeof apiRequest !== "function") {
        alert("API helper not found. Please refresh the page.");
        return;
    }

    let registration = {};

    try {
        registration = JSON.parse(
            sessionStorage.getItem("flamaRegistration") || "{}"
        );
    } catch (error) {
        console.error("Unable to read registration data:", error);
    }

    const email =
        registration.ownerEmail ||
        registration.registeredOwner?.email ||
        registration.school?.ownerEmail ||
        "";

    if (emailElement) {
        emailElement.textContent = email || "your registered email";
    }

    if (!email) {
        alert(
            "Your registered email was not found. Please return to Step 2 and register again."
        );
        return;
    }

    let secondsRemaining = 10 * 60;
    let countdownInterval = null;

    function renderCountdown() {
        if (!countdownElement) return;

        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;

        countdownElement.textContent =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;
    }

    function startCountdown() {
        clearInterval(countdownInterval);
        secondsRemaining = 10 * 60;
        renderCountdown();

        countdownInterval = setInterval(() => {
            secondsRemaining = Math.max(0, secondsRemaining - 1);
            renderCountdown();

            if (secondsRemaining === 0) {
                clearInterval(countdownInterval);
                showMessage(
                    "Your code may have expired. Request a new code to continue.",
                    "error"
                );
            }
        }, 1000);
    }

    function showMessage(message, type = "info") {
        let messageElement = document.getElementById("otpMessage");

        if (!messageElement) {
            messageElement = document.createElement("p");
            messageElement.id = "otpMessage";
            messageElement.setAttribute("role", "status");
            messageElement.setAttribute("aria-live", "polite");
            form.insertAdjacentElement("afterend", messageElement);
        }

        messageElement.textContent = message;
        messageElement.dataset.type = type;
    }

    function setButtonLoading(loading, text) {
        if (!submitButton) return;

        submitButton.disabled = loading;

        const buttonText = submitButton.querySelector(".btn-text");
        const loader = submitButton.querySelector(".btn-loader");

        if (buttonText && text) {
            buttonText.textContent = text;
        }

        loader?.classList.toggle("hidden", !loading);
    }

    function saveRegistrationValue(key, value) {
        if (typeof saveRegistration === "function") {
            saveRegistration(key, value);
            return;
        }

        registration[key] = value;
        sessionStorage.setItem(
            "flamaRegistration",
            JSON.stringify(registration)
        );
    }

    otpInputs.forEach((input, index) => {
        input.inputMode = "numeric";
        input.autocomplete = index === 0 ? "one-time-code" : "off";
        input.setAttribute("aria-label", `OTP digit ${index + 1}`);

        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(-1);

            if (input.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (event) => {
            if (
                event.key === "Backspace" &&
                !input.value &&
                index > 0
            ) {
                otpInputs[index - 1].focus();
            }

            if (event.key === "ArrowLeft" && index > 0) {
                otpInputs[index - 1].focus();
            }

            if (
                event.key === "ArrowRight" &&
                index < otpInputs.length - 1
            ) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener("paste", (event) => {
            const pasted = event.clipboardData
                ?.getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

            if (!pasted) return;

            event.preventDefault();

            pasted.split("").forEach((digit, digitIndex) => {
                if (otpInputs[digitIndex]) {
                    otpInputs[digitIndex].value = digit;
                }
            });

            otpInputs[Math.min(pasted.length, 5)].focus();
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const otp = otpInputs.map((input) => input.value).join("");

        if (!/^\d{6}$/.test(otp)) {
            showMessage(
                "Enter the complete six-digit verification code.",
                "error"
            );
            otpInputs.find((input) => !input.value)?.focus();
            return;
        }

        try {
            setButtonLoading(true, "Verifying...");

            const response = await apiRequest("/onboarding/verify-email", {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            // apiRequest may already unwrap the response's `data`.
            const data = response?.data ?? response;

            if (data?.verified !== true) {
                throw new Error("Email verification failed.");
            }

            const draftId =
                data.draftId ||
                registration.onboardingDraftId;

            const school =
                data.registeredSchool ||
                data.school ||
                null;

            const schoolId =
                school?.id ||
                school?._id ||
                data.schoolId;

            const onboardingPaymentToken =
                data.onboardingPaymentToken ||
                data.onboardingToken;

            if (!draftId) {
                throw new Error(
                    "Email was verified, but the onboarding draft ID was not returned."
                );
            }

            if (!schoolId || !onboardingPaymentToken) {
                throw new Error(
                    "Email was verified, but the backend did not return the school ID and payment token. Update the email verification endpoint, then try again."
                );
            }

            const registeredSchool = {
                id: String(schoolId),
                name:
                    school?.name ||
                    school?.schoolName ||
                    registration.school?.schoolName ||
                    "Your School",
                subdomain: school?.subdomain || "",
                status: school?.status || "PENDING",
            };

            saveRegistrationValue("onboardingDraftId", draftId);
            saveRegistrationValue("registeredSchool", registeredSchool);
            saveRegistrationValue(
                "onboardingPaymentToken",
                onboardingPaymentToken
            );
            saveRegistrationValue(
                "onboardingToken",
                onboardingPaymentToken
            );

            sessionStorage.setItem(
                "flamaEmailVerified",
                JSON.stringify({
                    email,
                    verified: true,
                    verifiedAt: new Date().toISOString(),
                })
            );

            clearInterval(countdownInterval);

            showMessage(
                "Email verified successfully. Continuing...",
                "success"
            );

            window.location.href = "./register-step3.html";
        } catch (error) {
            console.error("Email verification failed:", error);

            showMessage(
                error.message ||
                    "Invalid or expired OTP. Please try again.",
                "error"
            );
        } finally {
            setButtonLoading(false, "Verify & Continue");
        }
    });

    resendLink?.addEventListener("click", async (event) => {
        event.preventDefault();

        if (resendLink.dataset.sending === "true") return;

        try {
            resendLink.dataset.sending = "true";
            resendLink.style.pointerEvents = "none";
            resendLink.textContent = "Sending...";

            await apiRequest("/onboarding/resend-verification-otp", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            otpInputs.forEach((input) => {
                input.value = "";
            });

            startCountdown();

            showMessage(
                "If this email belongs to an unverified account, a new OTP has been sent. Check your inbox and spam folder.",
                "success"
            );

            otpInputs[0].focus();
        } catch (error) {
            console.error("Resending OTP failed:", error);

            showMessage(
                error.message ||
                    "Unable to resend the OTP. Please try again.",
                "error"
            );
        } finally {
            resendLink.dataset.sending = "false";
            resendLink.style.pointerEvents = "";
            resendLink.textContent = "Resend code";
        }
    });

    startCountdown();
    otpInputs[0].focus();
}