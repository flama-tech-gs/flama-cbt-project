//backend/principalAddTeacher.js


(() => {
    "use strict";

    const API_BASE =
        `${window.location.protocol}//${window.location.hostname}:5000/api`;
    const ROOT = `${API_BASE}/principal/teachers`;
    const token = sessionStorage.getItem("principalAccessToken");

    const form = document.getElementById("teacherForm");
    const subjectContainer =
        document.getElementById("subjectContainer");

    const surnameInput = document.getElementById("surname");
    const firstNameInput = document.getElementById("firstname");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const departmentSelect = document.getElementById("department");

    const staffIdPreview =
        document.getElementById("staffIdPreview");
    const accessCodePreview =
        document.getElementById("accessCodePreview");
    const passwordPreview =
        document.getElementById("passwordPreview");

    let subjects = [];
    let classes = [];
    let temporaryPassword = "";

    if (!form || !subjectContainer) {
        console.error(
            "Teacher form or subject assignment container was not found."
        );
        return;
    }

    // The supplied HTML already includes this button. Add it if the
    // served page differs and does not contain a submit button.
    if (!form.querySelector('button[type="submit"]')) {
        const actions =
            form.querySelector(".form-actions") || form;

        const button = document.createElement("button");
        button.type = "submit";
        button.className = "primary-btn";
        button.textContent = "Create Teacher Account";
        actions.appendChild(button);
    }

    function unwrap(body) {
        let data = body;

        for (
            let i = 0;
            i < 5 &&
            data &&
            typeof data === "object" &&
            data.data !== undefined;
            i += 1
        ) {
            data = data.data;
        }

        return data;
    }

    async function request(url, options = {}) {
        if (!token) {
            throw new Error(
                "Your principal session has expired. Please sign in again."
            );
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(options.headers || {}),
            },
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                body.message ||
                    body.error ||
                    `Request failed (${response.status})`
            );
        }

        return unwrap(body);
    }

    function updateBranding(data) {
        const school = data.school || {};
        const principal = data.principal || {};

        const schoolName =
            document.querySelector(".logo-area h2");
        const schoolLogo =
            document.querySelector(".logo-area img");
        const principalName =
            document.querySelector(".teacher-profile h3");
        const principalImage =
            document.querySelector(".teacher-profile img");

        if (schoolName && school.name) {
            schoolName.textContent = school.name;
        }

        if (schoolLogo && school.logo) {
            schoolLogo.src = school.logo;
        }

        if (principalName && principal.name) {
            principalName.textContent = principal.name;
        }

        if (principalImage && principal.image) {
            principalImage.src = principal.image;
        }
    }

    function generateTemporaryPassword() {
        const bytes = new Uint8Array(6);
        window.crypto.getRandomValues(bytes);

        const randomPart = Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");

        temporaryPassword = `Flama-${randomPart}`;
        updateCredentialPreview();

        return temporaryPassword;
    }

    function updateCredentialPreview(employeeId = "") {
        if (staffIdPreview) {
            staffIdPreview.textContent =
                employeeId || "Generated after creation";
        }

        if (accessCodePreview) {
            accessCodePreview.textContent =
                employeeId || "Generated after creation";
        }

        if (passwordPreview) {
            passwordPreview.textContent =
                temporaryPassword || "Generated when page loads";
        }
    }

    function makeOption(value, label) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        return option;
    }

    function fillAssignmentRow(row) {
        const selects = row.querySelectorAll("select");
        const subjectSelect = selects[0];
        const classSelect = selects[1];

        if (!subjectSelect || !classSelect) {
            return;
        }

        const previousSubject = subjectSelect.value;
        const previousClass = classSelect.value;

        subjectSelect.replaceChildren(
            makeOption("", "Select subject"),
            ...subjects.map((subject) =>
                makeOption(subject.id, subject.name)
            )
        );

        classSelect.replaceChildren(
            makeOption("", "Select class"),
            ...classes.map((schoolClass) =>
                makeOption(schoolClass.id, schoolClass.name)
            )
        );

        if (
            subjects.some(
                (subject) => subject.id === previousSubject
            )
        ) {
            subjectSelect.value = previousSubject;
        }

        if (
            classes.some(
                (schoolClass) => schoolClass.id === previousClass
            )
        ) {
            classSelect.value = previousClass;
        }
    }

    async function loadCreateData() {
        // Register /teachers/create-data before /teachers/:teacherId
        // in principalDashboardRoutes.js.
        const data = await request(`${ROOT}/create-data`);

        updateBranding(data);

        subjects = Array.isArray(data.subjects)
            ? data.subjects
            : [];

        classes = Array.isArray(data.classes)
            ? data.classes
            : [];

        subjectContainer
            .querySelectorAll(".assignment-row")
            .forEach(fillAssignmentRow);

        if (subjects.length === 0) {
            throw new Error(
                "No active subjects were found for this school."
            );
        }

        if (classes.length === 0) {
            throw new Error(
                "No active classes were found for this school."
            );
        }
    }

    function collectAssignments() {
        const assignments = [];

        subjectContainer
            .querySelectorAll(".assignment-row")
            .forEach((row) => {
                const selects = row.querySelectorAll("select");
                const subjectId = selects[0]?.value || "";
                const classId = selects[1]?.value || "";

                if (subjectId && classId) {
                    assignments.push({
                        subjectId,
                        classId,
                    });
                }
            });

        const unique = new Map();

        assignments.forEach((assignment) => {
            const key =
                `${assignment.subjectId}:${assignment.classId}`;
            unique.set(key, assignment);
        });

        return [...unique.values()];
    }

    function getFieldValue(selector) {
        return form.querySelector(selector)?.value.trim() || "";
    }

    function collectTeacherData() {
        return {
            firstName: firstNameInput?.value.trim() || "",
            lastName: surnameInput?.value.trim() || "",
            email: emailInput?.value.trim() || "",
            phone: phoneInput?.value.trim() || "",
            department: departmentSelect?.value || "",
            qualification: getFieldValue(
                'input[placeholder*="B.Sc"]'
            ),
            address: getFieldValue("textarea"),
            password:
                temporaryPassword || generateTemporaryPassword(),
            assignments: collectAssignments(),
        };
    }

    function addPopupStyles() {
        if (document.getElementById("teacherCreatedPopupStyles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "teacherCreatedPopupStyles";
        style.textContent = `
            .teacher-created-popup {
			    position: fixed;
			    inset: 50% auto auto 50%;
			    transform: translate(-50%, -50%);
			    margin: 0;

			    /* Keep the rest of the existing rule */
			    width: min(560px, calc(100vw - 32px));
			    max-width: 560px;
			    max-height: 85vh;
			    padding: 0;
			    border: 0;
			    border-radius: 18px;
			    color: #182230;
			    background: #fff;
			    box-shadow: 0 24px 80px rgba(15, 23, 42, .28);
			    overflow: auto;
			    font-family: Inter, system-ui, sans-serif;
			}

            .teacher-created-popup::backdrop {
                background: rgba(15, 23, 42, .58);
                backdrop-filter: blur(3px);
            }

            .teacher-created-popup__content {
                padding: 28px;
            }

            .teacher-created-popup__header {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 22px;
            }

            .teacher-created-popup__check {
                display: grid;
                width: 46px;
                height: 46px;
                flex: 0 0 46px;
                place-items: center;
                border-radius: 50%;
                color: #16713b;
                background: #e6f6ec;
                font-size: 24px;
                font-weight: 700;
            }

            .teacher-created-popup h2 {
                margin: 0 0 6px;
                font-size: 1.3rem;
            }

            .teacher-created-popup p {
                margin: 0;
                color: #667085;
                line-height: 1.5;
            }

            .teacher-created-popup__close {
                margin-left: auto;
                border: 0;
                color: #667085;
                background: transparent;
                font-size: 26px;
                cursor: pointer;
            }

            .teacher-created-popup__details {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin: 20px 0;
            }

            .teacher-created-popup__detail {
                min-width: 0;
                padding: 13px;
                border: 1px solid #e7ebf0;
                border-radius: 11px;
                overflow-wrap: anywhere;
            }

            .teacher-created-popup__wide {
                grid-column: 1 / -1;
            }

            .teacher-created-popup__label {
                display: block;
                margin-bottom: 5px;
                color: #667085;
                font-size: .78rem;
            }

            .teacher-created-popup__value {
                display: block;
                color: #182230;
                font-weight: 600;
            }

            .teacher-created-popup__credentials {
                margin-top: 18px;
                padding: 16px;
                border: 1px solid #f3d58a;
                border-radius: 12px;
                background: #fff9e9;
            }

            .teacher-created-popup__credentials h3 {
                margin: 0 0 12px;
                font-size: 1rem;
            }

            .teacher-created-popup__password {
                display: inline-block;
                padding: 6px 9px;
                border-radius: 6px;
                color: #182230;
                background: #fff;
                font-family: ui-monospace, monospace;
                overflow-wrap: anywhere;
            }

            .teacher-created-popup__notice {
                margin-top: 10px !important;
                font-size: .88rem;
            }

            .teacher-created-popup__actions {
                display: flex;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 22px;
            }

            .teacher-created-popup__button {
                min-height: 42px;
                padding: 10px 16px;
                border: 1px solid #d0d5dd;
                border-radius: 9px;
                color: #344054;
                background: #fff;
                font: inherit;
                font-weight: 600;
                cursor: pointer;
            }

            .teacher-created-popup__button--primary {
                border-color: #16713b;
                color: #fff;
                background: #16713b;
            }

            @media (max-width: 520px) {
                .teacher-created-popup__content {
                    padding: 20px;
                }

                .teacher-created-popup__details {
                    grid-template-columns: 1fr;
                }

                .teacher-created-popup__wide {
                    grid-column: auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function ensureCreatedPopup() {
        let dialog = document.getElementById(
            "teacherCreatedPopup"
        );

        if (dialog) {
            return dialog;
        }

        addPopupStyles();

        dialog = document.createElement("dialog");
        dialog.id = "teacherCreatedPopup";
        dialog.className = "teacher-created-popup";

        dialog.innerHTML = `
            <div class="teacher-created-popup__content">
                <div class="teacher-created-popup__header">
                    <div class="teacher-created-popup__check" aria-hidden="true">✓</div>

                    <div>
                        <h2>Teacher created successfully</h2>
                        <p>The account and subject/class assignments are ready.</p>
                    </div>

                    <button
                        type="button"
                        class="teacher-created-popup__close"
                        data-popup-close
                        aria-label="Close"
                    >&times;</button>
                </div>

                <div class="teacher-created-popup__details">
                    <div class="teacher-created-popup__detail">
                        <span class="teacher-created-popup__label">Teacher name</span>
                        <strong class="teacher-created-popup__value" data-teacher-name></strong>
                    </div>

                    <div class="teacher-created-popup__detail">
                        <span class="teacher-created-popup__label">Staff ID / Login ID</span>
                        <strong class="teacher-created-popup__value" data-teacher-login></strong>
                    </div>

                    <div class="teacher-created-popup__detail">
                        <span class="teacher-created-popup__label">Email</span>
                        <strong class="teacher-created-popup__value" data-teacher-email></strong>
                    </div>

                    <div class="teacher-created-popup__detail">
                        <span class="teacher-created-popup__label">Department</span>
                        <strong class="teacher-created-popup__value" data-teacher-department></strong>
                    </div>

                    <div class="teacher-created-popup__detail teacher-created-popup__wide">
                        <span class="teacher-created-popup__label">Subject and class assignments</span>
                        <strong class="teacher-created-popup__value" data-teacher-assignments></strong>
                    </div>
                </div>

                <div class="teacher-created-popup__credentials">
                    <h3>Temporary login password</h3>
                    <code class="teacher-created-popup__password" data-teacher-password></code>
                    <p class="teacher-created-popup__notice">
                        Copy these login details now and provide them to the teacher.
                        The password will not be shown again after closing this popup.
                    </p>
                </div>

                <div class="teacher-created-popup__actions">
                    <button
                        type="button"
                        class="teacher-created-popup__button"
                        data-popup-close
                    >Close</button>

                    <button
                        type="button"
                        class="teacher-created-popup__button teacher-created-popup__button--primary"
                        data-copy-credentials
                    >Copy login details</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelectorAll("[data-popup-close]").forEach((button) => {
            button.addEventListener("click", () => {
                if (typeof dialog.close === "function") {
                    dialog.close();
                } else {
                    dialog.removeAttribute("open");
                }
            });
        });

        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) {
                if (typeof dialog.close === "function") {
                    dialog.close();
                } else {
                    dialog.removeAttribute("open");
                }
            }
        });

        return dialog;
    }

    function showCreatedTeacher(data) {
        const teacher = data.teacher || {};
        const credentials = data.credentials || {};
        const loginId =
            credentials.loginId || teacher.employeeId || "—";
        const password = credentials.password || "";

        const assignmentText = collectAssignments()
            .map((assignment) => {
                const subject = subjects.find(
                    (item) => item.id === assignment.subjectId
                );
                const schoolClass = classes.find(
                    (item) => item.id === assignment.classId
                );

                return `${subject?.name || "Subject"} — ${
                    schoolClass?.name || "Class"
                }`;
            })
            .join(", ");

        const dialog = ensureCreatedPopup();

        dialog.querySelector("[data-teacher-name]").textContent =
            [teacher.firstName, teacher.lastName]
                .filter(Boolean)
                .join(" ") || "—";

        dialog.querySelector("[data-teacher-login]").textContent =
            loginId;

        dialog.querySelector("[data-teacher-email]").textContent =
            teacher.email || "—";

        dialog.querySelector(
            "[data-teacher-department]"
        ).textContent = teacher.department || "—";

        dialog.querySelector(
            "[data-teacher-assignments]"
        ).textContent = assignmentText || "—";

        dialog.querySelector(
            "[data-teacher-password]"
        ).textContent = password || "—";

        updateCredentialPreview(
            teacher.employeeId || credentials.loginId || ""
        );

        dialog.querySelector(
            "[data-copy-credentials]"
        ).onclick = async () => {
            const text = [
                `Teacher: ${teacher.firstName || ""} ${
                    teacher.lastName || ""
                }`.trim(),
                `Login ID: ${loginId}`,
                `Password: ${password}`,
            ].join("\n");

            try {
                await navigator.clipboard.writeText(text);
                alert("Teacher login details copied.");
            } catch {
                window.prompt(
                    "Copy these teacher login details:",
                    text
                );
            }
        };

        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }
    }

    function collectFormData() {
        const payload = {
            firstName: firstNameInput?.value.trim() || "",
            lastName: surnameInput?.value.trim() || "",
            email: emailInput?.value.trim() || "",
            phone: phoneInput?.value.trim() || "",
            department: departmentSelect?.value || "",
            qualification:
                form.querySelector('input[placeholder*="B.Sc"]')
                    ?.value.trim() || "",
            address:
                form.querySelector("textarea")?.value.trim() || "",
            password:
                temporaryPassword || generateTemporaryPassword(),
            assignments: collectAssignments(),
        };

        return payload;
    }

    async function submitTeacher(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!form.reportValidity()) {
            return;
        }

        const payload = collectFormData();

        if (!payload.email) {
            alert("Enter the teacher's email address.");
            document.getElementById("email")?.focus();
            return;
        }

        if (!payload.department) {
            alert("Select a department.");
            departmentSelect?.focus();
            return;
        }

        if (payload.assignments.length === 0) {
            alert("Select at least one subject and class.");
            return;
        }

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );
        const originalText =
            submitButton?.textContent || "Create Teacher Account";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Creating teacher…";
        }

        try {
            const result = await request(ROOT, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            showCreatedTeacher(result);
        } catch (error) {
            alert(error.message || "Could not create the teacher.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    }

    /*
     * Capture phase prevents the original add-teacher.js demo submit
     * handler from displaying its alert or resetting the form.
     */
    form.addEventListener("submit", submitTeacher, true);

    /*
     * The original script creates assignment rows. Replace any sample
     * options in newly added rows with live subject/class options.
     */
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (
                    node.nodeType === Node.ELEMENT_NODE &&
                    node.matches(".assignment-row")
                ) {
                    fillAssignmentRow(node);

                    if (window.lucide?.createIcons) {
                        window.lucide.createIcons();
                    }
                }
            });
        });
    });

    observer.observe(subjectContainer, {
        childList: true,
    });

    /*
     * The original add-teacher.js also writes demo credentials on load
     * and when the surname changes. Restore the integration preview after it.
     */
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            updateCredentialPreview();

            surnameInput?.addEventListener("input", () => {
                updateCredentialPreview();
            });
        },
        { once: true }
    );

    generateTemporaryPassword();

    loadCreateData().catch((error) => {
        console.error("Could not load teacher form data:", error);
        alert(error.message || "Could not load subjects and classes.");
    });
})();