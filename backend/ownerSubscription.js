//backend/ownerSubscription.js

const API_BASE = "http://localhost:5000/api";
const TOKEN_KEY = "flamaAccessToken";

const plansGrid = document.querySelector(".pricing-grid");
const historyBody = document.querySelector(".billing-table tbody");

function getToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        throw new Error("Your login session has expired. Please log in again.");
    }

    return token;
}

function authHeaders(json = false) {
    return {
        Accept: "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...(json ? { "Content-Type": "application/json" } : {}),
    };
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || `Request failed (${response.status})`
        );
    }

    return result;
}

function unwrap(value) {
    let current = value;

    for (let i = 0; i < 4; i += 1) {
        if (
            current &&
            typeof current === "object" &&
            !Array.isArray(current) &&
            current.data !== undefined
        ) {
            current = current.data;
        } else {
            break;
        }
    }

    return current;
}

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value ?? "";
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function formatMoney(amount, currency = "NGN") {
    if (amount === null || amount === undefined) {
        return "Price unavailable";
    }

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatInterval(interval) {
    const labels = {
        MONTHLY: "month",
        YEARLY: "year",
        CUSTOM: "custom term",
    };

    return labels[String(interval || "").toUpperCase()] || interval || "term";
}

function isActiveSubscription(subscription) {
    return (
        subscription?.status === "ACTIVE" &&
        subscription.endDate &&
        new Date(subscription.endDate) > new Date()
    );
}

function getPlanName(subscription) {
    if (typeof subscription?.plan === "string") {
        return subscription.plan;
    }

    return subscription?.plan?.name || "Subscription";
}

function setSchoolHeader(school) {
    setText("#schoolName", school?.name || "School");
    setText("#accountSchoolName", school?.name || "School");

    const url = document.querySelector("#schoolUrl");
    if (!url) return;

    url.textContent = school?.url || "School URL unavailable";

    if (school?.url) {
        url.href = school.url;
        url.target = "_blank";
        url.rel = "noopener";
    } else {
        url.removeAttribute("href");
    }
}

function renderCurrentSubscription(active, dashboardSubscription) {
    const current = active || dashboardSubscription;

    if (!current) {
        setText("#currentPlanName", "No active subscription");
        setText("#currentPlanMeta", "Choose a plan to get started.");
        setText("#currentPlanExpiry", "No active subscription");
        setText("#currentPlanPrice", "—");
        setText("#currentPlanPaymentDate", "No payment recorded");
        setText("#headerExpiry", "No active subscription");
        return;
    }

    const plan =
        current.plan && typeof current.plan === "object"
            ? current.plan
            : {};

    const planName =
        plan.name ||
        (typeof current.plan === "string" ? current.plan : "Subscription");

    const interval = plan.billingInterval || current.billingInterval;

    const studentLimit = plan.isUnlimited
        ? "Unlimited students"
        : plan.studentLimit
            ? `Up to ${plan.studentLimit} students`
            : current.studentLimit
                ? `Up to ${current.studentLimit} students`
                : "Student limit unavailable";

    const expiry = current.endDate || current.expiresAt;
    const expiryLabel = expiry
        ? `Expires ${formatDate(expiry)}`
        : "Expiry date unavailable";

    const price = plan.price ?? current.price;
    const currency = plan.currency || current.currency || "NGN";
    const paymentDate = current.startDate || current.createdAt;

    setText("#currentPlanName", String(planName).toUpperCase());
    setText(
        "#currentPlanMeta",
        `${current.status || "SUBSCRIPTION"} • ${formatInterval(interval)} • ${studentLimit}`
    );
    setText("#currentPlanExpiry", expiryLabel);
    setText(
        "#currentPlanPrice",
        `${formatMoney(price, currency)} / ${formatInterval(interval)}`
    );
    setText(
        "#currentPlanPaymentDate",
        paymentDate
            ? `Paid: ${formatDate(paymentDate)} • via Paystack`
            : "Payment date unavailable"
    );
    setText("#headerExpiry", expiryLabel);
}

function planCardKey(plan) {
    const name = String(plan.name || "").toLowerCase();
    return name === "custom" ? "enterprise" : name;
}

function updateExistingPlanCards(plans, activeSubscription) {
    if (!plansGrid) return;

    for (const card of plansGrid.querySelectorAll(".pricing-card")) {
        const cardKey = card.dataset.plan?.toLowerCase();
        const plan = plans.find((item) => planCardKey(item) === cardKey);

        if (!plan) {
            card.hidden = true;
            continue;
        }

        card.hidden = false;

        const planId = plan._id || plan.id;
        const activePlanId =
            activeSubscription?.plan?._id ||
            activeSubscription?.plan?.id;

        const isCurrentPlan =
            activeSubscription &&
            activePlanId &&
            String(activePlanId) === String(planId);

        const heading = card.querySelector("h3");
        if (heading) heading.textContent = plan.name || "Plan";

        const price = card.querySelector(".price");
        if (price) {
            price.replaceChildren();

            price.append(
                document.createTextNode(
                    plan.price === null || plan.price === undefined
                        ? "Custom"
                        : formatMoney(plan.price, plan.currency || "NGN")
                )
            );

            if (plan.price !== null && plan.price !== undefined) {
                const interval = document.createElement("span");
                interval.textContent = `/${formatInterval(plan.billingInterval)}`;
                price.appendChild(interval);
            }
        }

        const description = card.querySelector(".pricing-description");
        if (description) {
            description.textContent = plan.description || "Subscription plan";
        }

        const featureList = card.querySelector(".pricing-features");

        if (featureList) {
            const firstFeature = featureList.querySelector("li");
            const iconMarkup = firstFeature?.querySelector("i")?.outerHTML || "";

            const features = [
                plan.isUnlimited
                    ? "Unlimited students"
                    : plan.studentLimit
                        ? `Up to ${plan.studentLimit} students`
                        : null,
                ...(Array.isArray(plan.features) ? plan.features : []),
            ].filter(Boolean);

            featureList.replaceChildren();

            for (const feature of features) {
                const item = document.createElement("li");

                if (iconMarkup) {
                    item.insertAdjacentHTML("afterbegin", iconMarkup);
                }

                item.append(document.createTextNode(feature));
                featureList.appendChild(item);
            }
        }

        const button = card.querySelector("button");
        if (!button) continue;

        button.dataset.planId = planId || "";

        if (activeSubscription) {
            button.disabled = true;
            button.textContent = isCurrentPlan
                ? "Current Plan"
                : "Subscription Active";
            button.onclick = null;
        } else if (!planId || plan.price === null) {
            button.disabled = true;
            button.textContent = "Contact Us";
            button.onclick = null;
        } else {
            button.disabled = false;
            button.textContent = "Choose Plan";
            button.onclick = () => startPayment(planId);
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

function renderExistingBillingRows(subscriptions) {
    if (!historyBody) return;

    const template = historyBody.querySelector("tr");
    if (!template) return;

    historyBody.replaceChildren();

    if (!subscriptions.length) {
        const row = template.cloneNode(true);
        const cells = row.querySelectorAll("td");

        if (cells.length) {
            cells[0].textContent = "No billing history found.";

            for (let i = 1; i < cells.length; i += 1) {
                cells[i].textContent = "";
            }
        }

        historyBody.appendChild(row);
        return;
    }

    for (const subscription of subscriptions) {
        const row = template.cloneNode(true);
        const cells = row.querySelectorAll("td");

        const plan =
            subscription.plan && typeof subscription.plan === "object"
                ? subscription.plan
                : {};

        const date = subscription.startDate || subscription.createdAt;

        const values = [
            formatDate(date),
            plan.name || getPlanName(subscription),
            formatInterval(plan.billingInterval),
            formatMoney(plan.price, plan.currency || "NGN"),
            "Paystack",
            subscription.status || "Unknown",
        ];

        values.forEach((value, index) => {
            if (cells[index]) cells[index].textContent = value;
        });

        const statusPill = cells[5]?.querySelector(".status-pill");

        if (statusPill) {
            const status = String(subscription.status || "unknown");
            statusPill.className = `status-pill ${status.toLowerCase()}`;
            statusPill.textContent = status;
        }

        const receiptCell = cells[6];

        if (receiptCell) {
            const reference =
                subscription.paymentReference ||
                subscription.payment?.reference ||
                subscription.reference;

            receiptCell.replaceChildren();

            const referenceText = document.createElement("span");
            referenceText.className = "payment-reference";
            referenceText.textContent = reference || "—";
            referenceText.title =
                reference || "Payment reference unavailable";

            receiptCell.appendChild(referenceText);
        }

        historyBody.appendChild(row);
    }

    if (window.lucide) window.lucide.createIcons();
}

async function startPayment(planId) {
    try {
        const result = await requestJson(
            `${API_BASE}/billing/payments/initialize`,
            {
                method: "POST",
                headers: authHeaders(true),
                body: JSON.stringify({ planId }),
            }
        );

        const data = unwrap(result);

        if (!data.authorizationUrl) {
            throw new Error("Paystack checkout URL was not returned.");
        }

        window.location.assign(data.authorizationUrl);
    } catch (error) {
        console.error("Could not start Paystack payment:", error);
        alert(error.message || "Could not start payment.");
    }
}

document.querySelector("#renewPlanBtn")?.addEventListener("click", () => {
    document.querySelector(".plans-section")?.scrollIntoView({
        behavior: "smooth",
    });
});

async function loadSubscriptionPage() {
    try {
        const headers = authHeaders();

        const [dashboardResult, subscriptionResult, plansResult] =
            await Promise.all([
                requestJson(`${API_BASE}/owner/dashboard`, { headers }),
                requestJson(`${API_BASE}/owner/subscription`, { headers }),
                requestJson(`${API_BASE}/billing/plans`),
            ]);

        const dashboard = unwrap(dashboardResult);
        const subscriptionData = unwrap(subscriptionResult);
        const plansData = unwrap(plansResult);

        const subscriptions = Array.isArray(subscriptionData)
            ? subscriptionData
            : [];

        const plans = Array.isArray(plansData)
            ? plansData
            : [];

        const activeSubscription =
            subscriptions.find(isActiveSubscription) || null;

        setSchoolHeader(dashboard.school || {});
        renderCurrentSubscription(
            activeSubscription,
            dashboard.subscription
        );
        updateExistingPlanCards(plans, activeSubscription);
        renderExistingBillingRows(subscriptions);
    } catch (error) {
        console.error("Could not load subscription page:", error);

        setText("#currentPlanName", "Could not load subscription");
        setText("#currentPlanMeta", error.message);

        if (!sessionStorage.getItem(TOKEN_KEY)) {
            alert(error.message);
        }
    }
}

document.addEventListener("DOMContentLoaded", loadSubscriptionPage);

