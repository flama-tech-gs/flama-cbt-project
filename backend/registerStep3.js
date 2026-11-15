// backend/registerStep3.js
// Plan loading and selection for the existing Stage 3 HTML IDs.

document.addEventListener("DOMContentLoaded", () => {

    initPlanSelection();
    initStep3Form();
    initBackButton();

    loadPlans().then(restoreSavedPlan);
});

function initPlanSelection() {
    const radios = [
        ...document.querySelectorAll('input[name="plan"]'),
    ];
    const cards = [...document.querySelectorAll(".plan-card")];


    radios.forEach((radio) => {
        radio.addEventListener("change", () => {

            updateSelectedCard();
        });
    });

    cards.forEach((card) => {
        const button = card.querySelector(".plan-button");
        const radio = card.querySelector('input[name="plan"]');

        button?.addEventListener("click", (event) => {
            event.preventDefault();


            if (!radio || radio.disabled) {
                return;
            }

            radio.checked = true;
            radio.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        });

        card.addEventListener("click", (event) => {
            if (event.target.closest(".plan-button")) return;

            if (radio && !radio.disabled && !radio.checked) {
                radio.checked = true;
                radio.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            }
        });
    });

    updateSelectedCard();
}

function updateSelectedCard() {
    document.querySelectorAll(".plan-card").forEach((card) => {
        card.classList.toggle(
            "selected",
            Boolean(
                card.querySelector('input[name="plan"]')?.checked
            )
        );
    });
}

function unwrapPlans(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.plans)) return response.plans;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.plans)) {
        return response.data.plans;
    }

    return [];
}

async function loadPlans() {

    if (typeof apiRequest !== "function") {
        showStep3Message(
            "We couldn’t connect to the plan service. Refresh the page and try again."
        );
        return false;
    }

    try {
        const response = await apiRequest("/billing/plans");
        const plans = unwrapPlans(response);


        if (!plans.length) {
            showStep3Message(
                "No subscription plans are available right now."
            );
            return false;
        }

        const planValues = {
            STARTER: "starter",
            STANDARD: "standard",
            CUSTOM: "enterprise",
            ENTERPRISE: "enterprise",
        };

        const found = new Set();

        plans.forEach((plan) => {
            const backendName = String(plan.name || "")
                .trim()
                .toUpperCase();

            const frontendValue = planValues[backendName];

            if (!frontendValue) {
                return;
            }

            const radio = document.querySelector(
                `input[name="plan"][value="${frontendValue}"]`
            );

            if (!radio) {
                return;
            }

            radio.dataset.planId = String(
                plan._id || plan.id || ""
            );
            radio.dataset.planName = backendName;
            radio.dataset.price =
                plan.price == null
                    ? ""
                    : String(Number(plan.price));
            radio.dataset.currency = plan.currency || "NGN";
            radio.dataset.billingInterval =
                plan.billingInterval || "MONTHLY";
            radio.dataset.isUnlimited = String(
                Boolean(plan.isUnlimited)
            );

            found.add(frontendValue);

            const card = radio.closest(".plan-card");
            const title = card?.querySelector("h3");
            const priceElement = card?.querySelector(".price");
            const description = card?.querySelector(
                ".pricing-description"
            );
            const featureList = card?.querySelector(
                ".pricing-features"
            );

            if (title) {
                title.textContent =
                    plan.displayName || backendName;
            }

            if (description && plan.description) {
                description.textContent = plan.description;
            }

            if (priceElement) {
                if (
                    plan.price == null ||
                    backendName === "CUSTOM"
                ) {
                    priceElement.textContent = "Custom";
                } else {
                    const amount = new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: plan.currency || "NGN",
                        maximumFractionDigits: 2,
                    }).format(Number(plan.price));

                    const interval = String(
                        plan.billingInterval || "MONTHLY"
                    ).toLowerCase();

                    const intervalElement = document.createElement("span");
                    intervalElement.className = "price-interval";
                    intervalElement.textContent = `/ ${interval}`;
                    priceElement.replaceChildren(
                        document.createTextNode(amount),
                        intervalElement
                    );
                }
            }

            if (
                featureList &&
                Array.isArray(plan.features) &&
                plan.features.length
            ) {
                featureList.replaceChildren(
                    ...plan.features.map((feature) => {
                        const li = document.createElement("li");
                        const icon = document.createElement("i");

                        icon.className = "ri-check-line";
                        li.append(
                            icon,
                            document.createTextNode(String(feature))
                        );

                        return li;
                    })
                );
            }
        });

        document
            .querySelectorAll('input[name="plan"]')
            .forEach((radio) => {
                const card = radio.closest(".plan-card");
                const available = found.has(radio.value);

                radio.disabled = !available;
                card?.classList.toggle(
                    "unavailable",
                    !available
                );
            });

        const checked = document.querySelector(
            'input[name="plan"]:checked'
        );

        if (checked?.disabled) {
            const firstAvailable = document.querySelector(
                'input[name="plan"]:not(:disabled)'
            );

            if (firstAvailable) {
                firstAvailable.checked = true;
            }
        }

        updateSelectedCard();


        return true;
    } catch (error) {
        showStep3Message(typeof getApiErrorMessage === "function"
            ? getApiErrorMessage(error, "Unable to load plans. Refresh and try again.")
            : "Unable to load plans. Refresh and try again.");
        return false;
    }
}

function readRegistration() {
    try {
        const registration =
            typeof getRegistration === "function"
                ? getRegistration() || {}
                : JSON.parse(
                      sessionStorage.getItem("flamaRegistration") ||
                          "{}"
                  );

        return registration;
    } catch (error) {
        return {};
    }
}

function restoreSavedPlan() {
    const registration = readRegistration();
    const savedPlan =
        registration.selectedPlan || registration.plan;

    if (!savedPlan) {
        updateSelectedCard();
        return;
    }

    const savedId = savedPlan.planId || savedPlan.id;
    const savedName = String(
        savedPlan.name || ""
    ).toLowerCase();

    const radio =
        (savedId &&
            [...document.querySelectorAll('input[name="plan"]')].find(
                (item) =>
                    item.dataset.planId === String(savedId)
            )) ||
        document.querySelector(
            `input[name="plan"][value="${savedName}"]`
        );

    if (radio && !radio.disabled) radio.checked = true;

    updateSelectedCard();
}

function initBackButton() {
    const backButton = document.getElementById("backBtn");

    if (!backButton) {
        return;
    }

    backButton.addEventListener("click", () => {
        window.location.href = "./register-step2";
    });
}

function initStep3Form() {
    const form = document.getElementById("step3Form");

    if (!form) {
        return;
    }


    form.addEventListener("submit", (event) => {
        event.preventDefault();


        clearStep3Message();

        const selected = document.querySelector(
            'input[name="plan"]:checked'
        );
        const terms = document.getElementById("agreeTerms");



        if (!selected || selected.disabled) {
            showStep3Message(
                "Select an available subscription plan."
            );
            return;
        }

        if (!terms?.checked) {
            showStep3Message(
                "You must agree to the Terms & Conditions."
            );
            return;
        }

        const registration = readRegistration();
        const school = registration.registeredSchool || {};
        const schoolId =
            school.id ||
            school._id ||
            registration.schoolId;

        const paymentToken =
            registration.onboardingPaymentToken ||
            registration.onboardingToken;


        if (!registration.onboardingDraftId) {
            showStep3Message(
                "Your saved registration could not be found. Please sign in again to resume, or start a new registration."
            );
            return;
        }

        if (!schoolId || !paymentToken) {
            showStep3Message(
                "We couldn’t continue your verified registration. Please sign in again to resume, or contact support if the problem continues."
            );
            return;
        }

        const planName = selected.dataset.planName;
        const planId = selected.dataset.planId;
        const price = Number(selected.dataset.price);

        if (!planId || !planName) {
            showStep3Message(
                "This plan has not loaded from the server. Refresh and try again."
            );
            return;
        }

        if (
            planName === "CUSTOM" ||
            selected.value === "enterprise"
        ) {
            showStep3Message(
                "Please contact us for Custom plan pricing."
            );
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            showStep3Message(
                "The selected plan price is invalid. Please contact support."
            );
            return;
        }

        const selectedPlan = {
            name: selected.value,
            planName,
            planId,
            id: planId,
            price,
            currency: selected.dataset.currency || "NGN",
            billingInterval:
                selected.dataset.billingInterval || "MONTHLY",
        };


        if (typeof saveRegistration === "function") {
            saveRegistration("plan", selectedPlan);
            saveRegistration("selectedPlan", selectedPlan);
            saveRegistration("acceptedTerms", true);
        } else {
            registration.plan = selectedPlan;
            registration.selectedPlan = selectedPlan;
            registration.acceptedTerms = true;

            sessionStorage.setItem(
                "flamaRegistration",
                JSON.stringify(registration)
            );
        }



        window.location.href = "./register-step4";
    });
}

function showStep3Message(message) {

    let element = document.getElementById("step3Message");

    if (!element) {
        element = document.createElement("p");
        element.id = "step3Message";
        element.setAttribute("role", "alert");
        element.setAttribute("aria-live", "polite");
        document.getElementById("step3Form")?.prepend(element);
    }

    element.textContent = message;
}

function clearStep3Message() {
    const element = document.getElementById("step3Message");
    if (element) element.textContent = "";
}
