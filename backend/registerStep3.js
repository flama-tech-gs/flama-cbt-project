// backend/registerStep3.js
// Plan loading and selection for the existing Stage 3 HTML IDs.

const STEP3_LOG = "[Register Step 3]";

document.addEventListener("DOMContentLoaded", () => {
    console.log(STEP3_LOG, "Page loaded.");

    initPlanSelection();
    initStep3Form();
    initBackButton();

    loadPlans().then((loaded) => {
        console.log(STEP3_LOG, "Plan loading finished:", loaded);
        restoreSavedPlan();
    });
});

function initPlanSelection() {
    const radios = [
        ...document.querySelectorAll('input[name="plan"]'),
    ];
    const cards = [...document.querySelectorAll(".plan-card")];

    console.log(STEP3_LOG, "Plan controls found:", {
        radios: radios.length,
        cards: cards.length,
    });

    radios.forEach((radio) => {
        radio.addEventListener("change", () => {
            console.log(STEP3_LOG, "Plan radio changed:", {
                value: radio.value,
                planId: radio.dataset.planId || null,
                planName: radio.dataset.planName || null,
                price: radio.dataset.price || null,
                disabled: radio.disabled,
            });

            updateSelectedCard();
        });
    });

    cards.forEach((card) => {
        const button = card.querySelector(".plan-button");
        const radio = card.querySelector('input[name="plan"]');

        button?.addEventListener("click", (event) => {
            event.preventDefault();

            console.log(STEP3_LOG, "Plan card button clicked:", {
                buttonText: button.textContent.trim(),
                radioFound: Boolean(radio),
                radioDisabled: radio?.disabled ?? null,
            });

            if (!radio || radio.disabled) {
                console.warn(
                    STEP3_LOG,
                    "Cannot select this plan: radio is missing or disabled."
                );
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
    console.log(STEP3_LOG, "Loading plans from /billing/plans.");

    if (typeof apiRequest !== "function") {
        console.error(STEP3_LOG, "apiRequest is not available.");
        showStep3Message(
            "The API helper did not load. Check the api.js script path."
        );
        return false;
    }

    try {
        const response = await apiRequest("/billing/plans");
        const plans = unwrapPlans(response);

        console.log(
            STEP3_LOG,
            "Plans returned by the API:",
            plans.map((plan) => ({
                id: plan._id || plan.id || null,
                name: plan.name || null,
                price: plan.price ?? null,
                currency: plan.currency || null,
                billingInterval: plan.billingInterval || null,
            }))
        );

        if (!plans.length) {
            console.warn(STEP3_LOG, "The API returned no plans.");
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
                console.warn(
                    STEP3_LOG,
                    "Plan name does not match a frontend radio option:",
                    backendName
                );
                return;
            }

            const radio = document.querySelector(
                `input[name="plan"][value="${frontendValue}"]`
            );

            if (!radio) {
                console.warn(
                    STEP3_LOG,
                    "No radio input exists for plan:",
                    frontendValue
                );
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

                    priceElement.textContent =
                        `${amount} / ${interval}`;
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
                console.log(
                    STEP3_LOG,
                    "Selected first available plan:",
                    firstAvailable.value
                );
            }
        }

        updateSelectedCard();

        console.log(
            STEP3_LOG,
            "Plan controls after loading:",
            [...document.querySelectorAll('input[name="plan"]')].map(
                (radio) => ({
                    value: radio.value,
                    planId: radio.dataset.planId || null,
                    price: radio.dataset.price || null,
                    checked: radio.checked,
                    disabled: radio.disabled,
                })
            )
        );

        return true;
    } catch (error) {
        console.error(STEP3_LOG, "Unable to load plans:", error);
        showStep3Message(
            error?.message ||
                "Unable to load plans. Refresh and try again."
        );
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

        // Do not log the token or any password.
        console.log(STEP3_LOG, "Registration data status:", {
            hasDraftId: Boolean(registration.onboardingDraftId),
            hasSchool:
                Boolean(registration.registeredSchool) ||
                Boolean(registration.schoolId),
            hasSchoolId: Boolean(
                registration.registeredSchool?.id ||
                    registration.registeredSchool?._id ||
                    registration.schoolId
            ),
            hasPaymentToken: Boolean(
                registration.onboardingPaymentToken ||
                    registration.onboardingToken
            ),
            hasSavedPlan: Boolean(
                registration.selectedPlan || registration.plan
            ),
        });

        return registration;
    } catch (error) {
        console.error(
            STEP3_LOG,
            "Unable to read registration data:",
            error
        );
        return {};
    }
}

function restoreSavedPlan() {
    const registration = readRegistration();
    const savedPlan =
        registration.selectedPlan || registration.plan;

    if (!savedPlan) {
        console.log(STEP3_LOG, "No previously saved plan to restore.");
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

    if (radio && !radio.disabled) {
        radio.checked = true;

        console.log(STEP3_LOG, "Restored saved plan:", {
            value: radio.value,
            planId: radio.dataset.planId || null,
            price: radio.dataset.price || null,
        });
    } else {
        console.warn(
            STEP3_LOG,
            "Saved plan could not be matched to an available plan.",
            {
                savedId: savedId || null,
                savedName: savedName || null,
            }
        );
    }

    updateSelectedCard();
}

function initBackButton() {
    const backButton = document.getElementById("backBtn");

    if (!backButton) {
        console.warn(STEP3_LOG, "#backBtn was not found.");
        return;
    }

    backButton.addEventListener("click", () => {
        console.log(STEP3_LOG, "Back button clicked.");
        window.location.href = "./register-step2.html";
    });
}

function initStep3Form() {
    const form = document.getElementById("step3Form");

    if (!form) {
        console.error(
            STEP3_LOG,
            "Step 3 form (#step3Form) was not found."
        );
        return;
    }

    console.log(STEP3_LOG, "Step 3 form found:", {
        id: form.id,
        action: form.action || null,
        method: form.method || null,
        submitButtons: form.querySelectorAll(
            'button[type="submit"], input[type="submit"]'
        ).length,
    });

    // This log helps identify a button that is not submitting the form.
    document.addEventListener("click", (event) => {
        const button = event.target.closest("button, input[type='submit']");

        if (button && button.form === form) {
            console.log(STEP3_LOG, "Form button clicked:", {
                text: button.textContent?.trim() || button.value || "",
                type: button.type,
                disabled: button.disabled,
                formId: button.form?.id || null,
            });
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        console.group(`${STEP3_LOG} Proceed to payment`);
        console.log("Form submit event fired.");

        clearStep3Message();

        const selected = document.querySelector(
            'input[name="plan"]:checked'
        );
        const terms = document.getElementById("agreeTerms");

        console.log("Selected plan input:", selected
            ? {
                  value: selected.value,
                  disabled: selected.disabled,
                  planId: selected.dataset.planId || null,
                  planName: selected.dataset.planName || null,
                  price: selected.dataset.price || null,
                  currency: selected.dataset.currency || null,
              }
            : null);

        console.log("Terms checkbox:", {
            found: Boolean(terms),
            checked: terms?.checked ?? false,
        });

        if (!selected || selected.disabled) {
            console.warn(
                "Blocked: no available plan is selected."
            );
            showStep3Message(
                "Select an available subscription plan."
            );
            console.groupEnd();
            return;
        }

        if (!terms?.checked) {
            console.warn(
                "Blocked: Terms & Conditions are not checked."
            );
            showStep3Message(
                "You must agree to the Terms & Conditions."
            );
            console.groupEnd();
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

        console.log("Required onboarding values:", {
            hasDraftId: Boolean(registration.onboardingDraftId),
            schoolId: schoolId || null,
            hasPaymentToken: Boolean(paymentToken),
        });

        if (!registration.onboardingDraftId) {
            console.warn("Blocked: onboarding draft ID is missing.");
            showStep3Message(
                "Your onboarding draft ID is missing. Please verify your email again."
            );
            console.groupEnd();
            return;
        }

        if (!schoolId || !paymentToken) {
            console.warn(
                "Blocked: school ID or onboarding payment token is missing."
            );
            showStep3Message(
                "Your verified school ID or payment token is missing. Please return to email verification."
            );
            console.groupEnd();
            return;
        }

        const planName = selected.dataset.planName;
        const planId = selected.dataset.planId;
        const price = Number(selected.dataset.price);

        if (!planId || !planName) {
            console.warn(
                "Blocked: selected plan ID or name is missing."
            );
            showStep3Message(
                "This plan has not loaded from the server. Refresh and try again."
            );
            console.groupEnd();
            return;
        }

        if (
            planName === "CUSTOM" ||
            selected.value === "enterprise"
        ) {
            console.warn("Blocked: Custom plan uses manual billing.");
            showStep3Message(
                "Please contact us for Custom plan pricing."
            );
            console.groupEnd();
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            console.warn("Blocked: plan price is invalid:", price);
            showStep3Message(
                "The selected plan price is invalid. Please contact support."
            );
            console.groupEnd();
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

        console.log("Plan to save:", selectedPlan);

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

        const savedRegistration = readRegistration();

        console.log("Saved registration status:", {
            hasDraftId: Boolean(
                savedRegistration.onboardingDraftId
            ),
            schoolId:
                savedRegistration.registeredSchool?.id ||
                savedRegistration.registeredSchool?._id ||
                savedRegistration.schoolId ||
                null,
            hasPaymentToken: Boolean(
                savedRegistration.onboardingPaymentToken ||
                    savedRegistration.onboardingToken
            ),
            savedPlan:
                savedRegistration.selectedPlan ||
                savedRegistration.plan ||
                null,
        });

        console.log(
            "Navigating to ./register-step4.html"
        );
        console.groupEnd();

        window.location.href = "./register-step4.html";
    });
}

function showStep3Message(message) {
    console.error(STEP3_LOG, "Showing message:", message);

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