document.addEventListener("DOMContentLoaded", () => {
    const TOKEN_KEY = "flamaAccessToken";
    const DASHBOARD_ENDPOINT = "/owner/dashboard";
    const LOGIN_URL = "../auth/login.html";

    const byId = (id) => document.getElementById(id);

    function setText(id, value, fallback = "Not available") {
        const element = byId(id);
        if (!element) return;

        element.textContent =
            value === null || value === undefined || value === ""
                ? fallback
                : String(value);
    }

    function formatDate(value) {
        if (!value) return "Not available";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
        }).format(date);
    }

    function normalizeUrl(value) {
        if (!value || typeof value !== "string") return null;

        const trimmed = value.trim();
        if (!trimmed) return null;

        const candidate = /^https?:\/\//i.test(trimmed)
            ? trimmed
            : `https://${trimmed}`;

        try {
            return new URL(candidate).toString();
        } catch {
            return null;
        }
    }

    function getHost(url, subdomain) {
        const normalized = normalizeUrl(url);

        if (normalized) {
            try {
                return new URL(normalized).host;
            } catch {
                // Fall through to the subdomain.
            }
        }

        return subdomain || url || "Not available";
    }

    function setLink(id, value, label) {
        const element = byId(id);
        if (!element) return;

        const normalized = normalizeUrl(value);

        if (!normalized) {
            element.textContent = value || "Not available";
            element.removeAttribute("href");
            return;
        }

        element.href = normalized;
        element.textContent = label || value;
        element.target = "_blank";
        element.rel = "noopener";
    }

    function setImage(id, url, altText) {
        const container = byId(id);
        if (!container) return;

        container.replaceChildren();

        if (!url) return;

        const image = document.createElement("img");
        image.src = url;
        image.alt = altText || "School image";
        image.loading = "lazy";
        container.appendChild(image);
    }

    function updateDetailByLabel(label, value) {
        const rows = document.querySelectorAll(
            ".details-grid .detail-item"
        );

        for (const row of rows) {
            const labelElement = row.querySelector("span");
            const valueElement = row.querySelector("strong");

            if (!labelElement || !valueElement) continue;

            const currentLabel = labelElement.textContent
                .trim()
                .replace(/:$/, "")
                .toLowerCase();

            if (currentLabel === label.toLowerCase()) {
                valueElement.textContent =
                    value === null || value === undefined || value === ""
                        ? "Not provided"
                        : String(value);
                return;
            }
        }
    }

    function getPayload(response) {
        let data = response;

        // api.js normally returns result.data. This handles an extra
        // nested data property if the API response has one.
        for (let index = 0; index < 3; index += 1) {
            if (
                data &&
                typeof data === "object" &&
                data.data &&
                typeof data.data === "object"
            ) {
                data = data.data;
            } else {
                break;
            }
        }

        return data;
    }

    function renderPortalLinks(urls) {
        const links = document.querySelectorAll(
            ".portal-links .portal-link"
        );

        const portalItems = [
            {
                url: urls?.student,
                label: "Student Portal",
            },
            {
                url: urls?.staff,
                label: "Staff Portal",
            },
            {
                url: urls?.principal,
                label: "Principal Portal",
            },
        ];

        links.forEach((item, index) => {
            const portal = portalItems[index];
            if (!portal) return;

            const text = item.querySelector(".portal-link__url span");
            const anchor = item.querySelector(".portal-link__url a");

            if (text) {
                text.textContent =
                    portal.url || "Not available";
            }

            if (anchor) {
                const normalized = normalizeUrl(portal.url);

                if (normalized) {
                    anchor.href = normalized;
                    anchor.target = "_blank";
                    anchor.rel = "noopener";
                } else {
                    anchor.removeAttribute("href");
                }

                anchor.setAttribute(
                    "aria-label",
                    `Open ${portal.label}`
                );
            }
        });
    }

    function renderDashboard(response) {
        const data = getPayload(response);
        const school = data?.school || {};
        const principal = data?.principal || null;
        const subscription = data?.subscription || null;

        console.log("Owner dashboard data:", data);

        // School name and URL.
        setText("school-name", school.name);
        setText("school-name2", school.name);
        setText("welcome-school-name", school.name);

        // Your pasted HTML currently calls the welcome span school-host2.
        setText("school-host2", school.name);

        setText(
            "school-host",
            getHost(school.url, school.subdomain)
        );

        // School status is based on a currently active subscription.
        setText(
            "school-status",
            school.subscriptionIsActive ? "Active" : "Inactive"
        );

        // Plan and expiry.
        setText(
            "current-plan",
            subscription?.plan,
            "No active plan"
        );

        const expiry = formatDate(subscription?.expiresAt);

        setText("expiry-date", expiry);
        setText("expiry-date2", `Expires ${expiry}`);
        setText("subscription-expires", expiry);
        setText(
            "subscription-status",
            subscription?.status,
            "No subscription"
        );

        if (subscription?.expiresAt) {
            const remainingDays = Math.ceil(
                (new Date(subscription.expiresAt).getTime() -
                    Date.now()) /
                    86400000
            );

            setText(
                "expiry-remaining",
                remainingDays > 0
                    ? `${remainingDays} days remaining`
                    : "Subscription expired"
            );

            setText(
                "subscription-alert-text",
                remainingDays > 0
                    ? `Expires in ${remainingDays} days — renew to avoid interruption`
                    : "Your subscription has expired"
            );
        } else {
            setText("expiry-remaining", "");
            setText(
                "subscription-alert-text",
                "No subscription expiry date available"
            );
        }

        // Principal card.
        setText(
            "principal-status",
            principal?.status || "Not assigned"
        );
        setText(
            "principal-name",
            principal?.name || "No principal assigned"
        );

        // School image and logo.
        const image =
            school.image ||
            school.images?.[0]?.url ||
            null;

        setImage(
            "school-image",
            image,
            `${school.name || "School"} logo`
        );
        setImage(
            "school-image2",
            image,
            `${school.name || "School"} logo`
        );
        setImage(
            "school-logo-preview",
            image,
            `${school.name || "School"} logo`
        );

        // Update the existing School Details design.
        updateDetailByLabel("School Name", school.name);
        updateDetailByLabel("Type", school.schoolType);
        updateDetailByLabel("RC Number", school.rcNumber);
        updateDetailByLabel("Year Founded", school.year);
        updateDetailByLabel("Address", school.address);
        updateDetailByLabel("Phone", school.phone);
        updateDetailByLabel(
            "Email",
            school.officialEmail || school.ownerEmail
        );
        updateDetailByLabel("Website", school.website);

        // Main school URL and portal links.
        setText(
            "school-url-status",
            school.url ? "Live" : "Not available"
        );
        setLink("school-url", school.url, school.url);

        renderPortalLinks(school.urls);

        // Update existing subscription card elements by their IDs
        // when present, otherwise update the card's current elements.
        setText(
            "subscription-plan-name",
            subscription?.plan,
            "No subscription"
        );
        setText(
            "subscription-plan-description",
            subscription?.studentLimit
                ? `Student limit: ${subscription.studentLimit}`
                : "Plan details unavailable"
        );

        if (
            subscription?.price !== null &&
            subscription?.price !== undefined
        ) {
            const formattedPrice = new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: subscription.currency || "NGN",
            }).format(subscription.price);

            const interval = subscription.billingInterval
                ? `/${subscription.billingInterval.toLowerCase()}`
                : "";

            setText(
                "subscription-price",
                `${formattedPrice}${interval}`
            );
        } else {
            setText("subscription-price", "Price unavailable");
        }

        // Fallback to the existing HTML structure if you have not yet
        // added the subscription IDs.
        const planBox = document.querySelector(".plan-box");
        if (planBox) {
            const heading = planBox.querySelector("h3");
            const description = planBox.querySelector("p");
            const price = planBox.querySelector("strong");

            if (heading && !byId("subscription-plan-name")) {
                heading.textContent =
                    subscription?.plan || "No subscription";
            }

            if (description && !byId("subscription-plan-description")) {
                description.textContent = subscription?.studentLimit
                    ? `Student limit: ${subscription.studentLimit}`
                    : "Plan details unavailable";
            }

            if (
                price &&
                !byId("subscription-price") &&
                subscription?.price !== null &&
                subscription?.price !== undefined
            ) {
                price.textContent = new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: subscription.currency || "NGN",
                }).format(subscription.price);
            }
        }
    }

    async function loadDashboard() {
        if (!sessionStorage.getItem(TOKEN_KEY)) {
            window.location.assign(LOGIN_URL);
            return;
        }

        if (typeof apiRequest !== "function") {
            console.error("api.js must load before ownerDashboard.js");
            alert("Dashboard API helper was not loaded.");
            return;
        }

        try {
            const response = await apiRequest("/owner/dashboard");
            renderDashboard(response);
        } catch (error) {
            console.error("Could not load owner dashboard:", error);

            const message = String(error?.message || "");
            const unauthorized =
                /\b401\b|unauthorized|authentication required|invalid or expired access token/i.test(
                    message
                );

            if (unauthorized) {
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem("flamaRefreshToken");
                sessionStorage.removeItem("flamaOwner");
                sessionStorage.removeItem("flamaSchool");
                sessionStorage.removeItem("flamaLogin");

                window.location.assign(LOGIN_URL);
                return;
            }

            alert(message || "Could not load the dashboard.");
        }
    }

    const logoutButton = document.querySelector(
        ".account-menu__logout"
    );

    logoutButton?.addEventListener("click", () => {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("flamaRefreshToken");
        sessionStorage.removeItem("flamaOwner");
        sessionStorage.removeItem("flamaSchool");
        sessionStorage.removeItem("flamaLogin");

        window.location.assign(LOGIN_URL);
    });

    loadDashboard();
});