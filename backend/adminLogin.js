//backend/adminLogin.js

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // CONFIGURATION
    // ==========================================
    const API_BASE_URL = "http://localhost:5000/api";
    const ADMIN_DASHBOARD_URL = "./index.html";

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const form = document.getElementById("adminLoginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const rememberInput = document.getElementById("remember");
    const alertBox = document.getElementById("formAlert");
    const submitButton = document.getElementById("submitButton");
    const buttonText = document.getElementById("buttonText");
    const togglePassword = document.getElementById("togglePassword");

    // ==========================================
    // VERIFY REQUIRED ELEMENTS
    // ==========================================
    if (!form || !emailInput || !passwordInput) {
        console.error(
            "Admin login initialization failed. Check the HTML element IDs.",
            {
                formFound: Boolean(form),
                emailFound: Boolean(emailInput),
                passwordFound: Boolean(passwordInput),
            }
        );
        return;
    }

    // ==========================================
    // ALERTS
    // ==========================================
    function showAlert(message, type = "error") {
        if (!alertBox) {
            console.error(message);
            return;
        }

        alertBox.textContent = message;
        alertBox.className = `form-alert ${type}`;
        alertBox.style.display = "block";
        alertBox.setAttribute("role", "alert");
    }

    function clearAlert() {
        if (!alertBox) return;

        alertBox.textContent = "";
        alertBox.style.display = "none";
        alertBox.className = "form-alert";
    }

    // ==========================================
    // BUTTON LOADING STATE
    // ==========================================
    function setLoading(isLoading) {
        if (submitButton) {
            submitButton.disabled = isLoading;
        }

        if (buttonText) {
            buttonText.textContent = isLoading
                ? "Signing in..."
                : "Sign In";
        }
    }

    // ==========================================
    // PASSWORD VISIBILITY
    // ==========================================
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const showPassword =
                passwordInput.type === "password";

            passwordInput.type = showPassword
                ? "text"
                : "password";

            togglePassword.setAttribute(
                "aria-label",
                showPassword ? "Hide password" : "Show password"
            );

            const icon = togglePassword.querySelector("i");

            if (icon) {
                icon.classList.toggle("fa-eye", !showPassword);
                icon.classList.toggle("fa-eye-slash", showPassword);
            }
        });
    }

    // ==========================================
    // PARSE POSSIBLE JSON STRINGS
    // ==========================================
    function parseJsonIfPossible(value) {
        if (typeof value !== "string") {
            return value;
        }

        const trimmed = value.trim();

        if (!trimmed) {
            return value;
        }

        try {
            return JSON.parse(trimmed);
        } catch {
            return value;
        }
    }

    // ==========================================
    // EXTRACT LOGIN PAYLOAD
     // ==========================================
    function extractLoginData(responseBody) {
        let current = parseJsonIfPossible(responseBody);

        for (let i = 0; i < 10; i++) {
            current = parseJsonIfPossible(current);

            if (!current || typeof current !== "object") {
                return current;
            }

            // Access token at this level.
            const directToken =
                current.accessToken ||
                current.access_token ||
                current.token;

            if (typeof directToken === "string" && directToken) {
                return current;
            }

            // Access token nested inside tokens.
            if (current.tokens && typeof current.tokens === "object") {
                const nestedToken =
                    current.tokens.accessToken ||
                    current.tokens.access_token ||
                    current.tokens.token;

                if (typeof nestedToken === "string" && nestedToken) {
                    return {
                        ...current,
                        accessToken: nestedToken,
                        refreshToken:
                            current.refreshToken ||
                            current.refresh_token ||
                            current.tokens.refreshToken ||
                            current.tokens.refresh_token ||
                            null,
                    };
                }
            }

            // Your current backend puts the result in message.
            if (
                current.message &&
                typeof current.message === "object"
            ) {
                const message = parseJsonIfPossible(current.message);

                if (message && typeof message === "object") {
                    current = message;
                    continue;
                }
            }

            // Standard ApiResponse format puts the result in data.
            if (
                current.data !== undefined &&
                current.data !== null
            ) {
                current = current.data;
                continue;
            }

            // Support other common response wrappers.
            if (
                current.result !== undefined &&
                current.result !== null
            ) {
                current = current.result;
                continue;
            }

            if (
                current.payload !== undefined &&
                current.payload !== null
            ) {
                current = current.payload;
                continue;
            }

            return current;
        }

        return current;
    }

    // ==========================================
    // SAVE ADMIN SESSION
    // ==========================================
    function saveAdminSession(responseBody) {
        const payload = extractLoginData(responseBody);

        const accessToken =
            payload?.accessToken ||
            payload?.access_token ||
            payload?.token ||
            payload?.tokens?.accessToken ||
            payload?.tokens?.access_token;

        const refreshToken =
            payload?.refreshToken ||
            payload?.refresh_token ||
            payload?.tokens?.refreshToken ||
            payload?.tokens?.refresh_token;

        if (
            typeof accessToken !== "string" ||
            accessToken.trim() === ""
        ) {
            // Log response structure only.
            // Never log the actual access or refresh token.
            console.error("Admin login response diagnostic:", {
                responseKeys:
                    responseBody &&
                    typeof responseBody === "object"
                        ? Object.keys(responseBody)
                        : [],
                messageType: typeof responseBody?.message,
                messageKeys:
                    responseBody?.message &&
                    typeof responseBody.message === "object"
                        ? Object.keys(responseBody.message)
                        : [],
                dataType: typeof responseBody?.data,
                dataKeys:
                    responseBody?.data &&
                    typeof responseBody.data === "object"
                        ? Object.keys(responseBody.data)
                        : [],
                payloadType: typeof payload,
                payloadKeys:
                    payload && typeof payload === "object"
                        ? Object.keys(payload)
                        : [],
            });

            throw new Error(
                "Login returned successfully, but the access token could not be found. Check the login response structure."
            );
        }

        const rememberMe = Boolean(rememberInput?.checked);

        const destination = rememberMe
            ? localStorage
            : sessionStorage;

        const otherStorage = rememberMe
            ? sessionStorage
            : localStorage;

        const keys = [
            "adminAccessToken",
            "adminRefreshToken",
            "adminUser",
        ];

        // Prevent stale credentials from remaining in both stores.
        keys.forEach((key) => {
            otherStorage.removeItem(key);
        });

        destination.setItem(
            "adminAccessToken",
            accessToken.trim()
        );

        if (
            typeof refreshToken === "string" &&
            refreshToken.trim() !== ""
        ) {
            destination.setItem(
                "adminRefreshToken",
                refreshToken.trim()
            );
        } else {
            destination.removeItem("adminRefreshToken");
        }

        const admin =
            payload?.admin ||
            payload?.user ||
            payload?.account ||
            payload?.profile;

        if (admin && typeof admin === "object") {
            destination.setItem(
                "adminUser",
                JSON.stringify(admin)
            );
        } else {
            destination.removeItem("adminUser");
        }

        console.info("Admin session saved.", {
            accessTokenSaved: Boolean(
                destination.getItem("adminAccessToken")
            ),
            refreshTokenSaved: Boolean(
                destination.getItem("adminRefreshToken")
            ),
            adminProfileSaved: Boolean(
                destination.getItem("adminUser")
            ),
            rememberMe,
        });
    }

    // ==========================================
    // LOGIN SUBMISSION
    // ==========================================
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearAlert();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            showAlert("Enter your admin email and password.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showAlert("Enter a valid email address.");
            emailInput.focus();
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/admin/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const responseText = await response.text();
            let body = {};

            if (responseText.trim()) {
                try {
                    body = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        "The server returned an invalid JSON response."
                    );
                }
            }

            console.info("Admin login response received:", {
                httpStatus: response.status,
                success: body?.success,
                responseKeys:
                    body && typeof body === "object"
                        ? Object.keys(body)
                        : [],
                messageType: typeof body?.message,
                dataType: typeof body?.data,
            });

            // Handle HTTP errors and API-level errors.
            if (!response.ok || body?.success === false) {
                let message = "Unable to log in.";

                if (typeof body?.message === "string") {
                    message = body.message;
                } else if (typeof body?.error === "string") {
                    message = body.error;
                } else if (
                    typeof body?.error?.message === "string"
                ) {
                    message = body.error.message;
                }

                const errors = body?.errors || body?.data?.errors;

                if (Array.isArray(errors) && errors.length > 0) {
                    message += ` ${errors.join(", ")}`;
                }

                throw new Error(
                    `${message} (HTTP ${response.status})`
                );
            }

            // Save tokens from the backend response.
            saveAdminSession(body);

            showAlert(
                "Admin login successful. Redirecting to your dashboard...",
                "success"
            );

            // Redirect to the admin dashboard.
            window.location.assign(ADMIN_DASHBOARD_URL);
        } catch (error) {
            console.error(
                "Admin login failed:",
                error?.message || error
            );

            let message =
                error?.message ||
                "Unable to sign in. Please try again.";

            if (error instanceof TypeError) {
                message =
                    "Cannot connect to the backend. Ensure the server is running and the API URL is correct.";
            }

            showAlert(message);
        } finally {
            setLoading(false);
        }
    });
});
