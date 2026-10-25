//backend/principalLogin.js

const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

const form = document.querySelector(".login-form");

function unwrapApiResponse(result) {
    let value = result;

    for (let i = 0; i < 5; i += 1) {
        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            value.data !== undefined
        ) {
            value = value.data;
        } else {
            break;
        }
    }

    return value;
}

async function loadSchoolBranding() {
    const nameElement = document.querySelector("#schoolName");
    const logoElement = document.querySelector("#schoolLogo");

    try {
        const response = await fetch(
            `${API_BASE}/tenant/auth/school-info`,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || "Could not load school details."
            );
        }

        const school = unwrapApiResponse(result);

        if (school?.name && nameElement) {
            nameElement.textContent = school.name;
            document.title = `Principal Login | ${school.name}`;
        }

        if (school?.logo && logoElement) {
            logoElement.src = school.logo;
        }
    } catch (error) {
        console.error("Could not load school branding:", error);

        if (nameElement) {
            nameElement.textContent = "School Portal";
        }
    }
}

loadSchoolBranding();

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identifierInput = document.querySelector("#identifier");
    const passwordInput = document.querySelector("#password");
    const button = form.querySelector('[type="submit"]');
    const errorElement = document.querySelector("#accessError");

    const identifier = identifierInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (errorElement) {
        errorElement.hidden = true;
        errorElement.textContent = "";
    }

    if (!identifier || !password) {
        const message = "Enter your email or employee ID and password.";

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.hidden = false;
        } else {
            alert(message);
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Signing in…";
    }

    try {
        const response = await fetch(
            `${API_BASE}/tenant/auth/principal/login`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    identifier,
                    password,
                }),
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || "Principal login failed.");
        }

        const data = unwrapApiResponse(result);
        const principal = data?.principal;

        if (!data?.accessToken || !principal) {
            console.error("Unexpected principal login response:", {
                responseKeys: Object.keys(result || {}),
                payloadKeys: Object.keys(data || {}),
            });

            throw new Error(
                "The server returned an unexpected login response."
            );
        }

        sessionStorage.setItem(
            "principalAccessToken",
            data.accessToken
        );
        sessionStorage.setItem(
            "principalRefreshToken",
            data.refreshToken || ""
        );
        sessionStorage.setItem(
            "principalAccount",
            JSON.stringify(principal)
        );

        window.location.assign("./profile.html");
    } catch (error) {
        console.error("Principal login failed:", error);

        if (errorElement) {
            errorElement.textContent =
                error.message || "Could not sign in.";
            errorElement.hidden = false;
        } else {
            alert(error.message || "Could not sign in.");
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Login →";
        }
    }
});

// Toggle password visibility.
document
    .querySelector("#togglePassword")
    ?.addEventListener("click", () => {
        const passwordInput = document.querySelector("#password");
        const toggleButton = document.querySelector("#togglePassword");

        if (!passwordInput || !toggleButton) return;

        const showingPassword = passwordInput.type === "password";
        passwordInput.type = showingPassword ? "text" : "password";
        toggleButton.setAttribute(
            "aria-label",
            showingPassword ? "Hide password" : "Show password"
        );
    });

// Show the forgot-password information modal.
document
    .querySelector("#forgotPasswordLink")
    ?.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector("#forgotModal")?.classList.add("show");
    });

document
    .querySelector("#closeModal")
    ?.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector("#forgotModal")?.classList.remove("show");
    });