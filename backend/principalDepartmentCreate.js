//backend/principalDepartmentCreate.js

(() => {
    "use strict";

    const API_BASE =
        window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");
    const ROOT = `${API_BASE}/principal/departmentss`;
    const token = sessionStorage.getItem("principalAccessToken");

    const form = document.querySelector(".department-form");
    const nameInput = form?.querySelector(
        '.form-grid input[type="text"]'
    );
    const headSelect = form?.querySelector(
        ".form-grid select"
    );
    const descriptionInput = form?.querySelector("textarea");
    const searchInput = form?.querySelector(".search-box input");
    const tableBody = form?.querySelector("tbody");
    const selectedList = form?.querySelector(".selected-list");
    const selectedLabel = form?.querySelector(".selected-wrapper > p");

    const successModal = document.getElementById(
        "departmentSuccessModal"
    );
    const viewDepartmentsButton = document.getElementById(
        "viewDepartmentsBtn"
    );
    const createAnotherButton = document.getElementById(
        "createAnotherBtn"
    );
    const cancelButton = form?.querySelector(
        ".form-actions .btn-secondary"
    );

    let teachers = [];
    let selectedTeacherIds = new Set();

    if (!form || !tableBody) {
        console.error("Department form/table was not found.");
        return;
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

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[character]);
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

        const schoolName = document.querySelector(".logo-area h2");
        const schoolLogo = document.querySelector(".logo-area img");
        const principalName =
            document.querySelector(".principal-details h4");
        const principalImage =
            document.querySelector(".principal-avatar img");

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

    function getVisibleTeachers() {
        const query = (searchInput?.value || "")
            .trim()
            .toLowerCase();

        if (!query) return teachers;

        return teachers.filter((teacher) => {
            const searchable = [
                teacher.name,
                teacher.employeeId,
                teacher.department,
                ...(teacher.subjects || []),
            ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(query);
        });
    }

    function renderHeadOptions() {
        if (!headSelect) return;

        const selectedTeachers = teachers.filter((teacher) =>
            selectedTeacherIds.has(teacher.id)
        );

        const oldHead = headSelect.value;

        headSelect.replaceChildren(
            new Option("Select a teacher", ""),
            ...selectedTeachers.map(
                (teacher) =>
                    new Option(
                        `${teacher.name} (${teacher.employeeId || "—"})`,
                        teacher.id
                    )
            )
        );

        if (
            selectedTeachers.some((teacher) => teacher.id === oldHead)
        ) {
            headSelect.value = oldHead;
        } else {
            headSelect.value = "";
        }
    }

    function renderSelectedTeachers() {
        if (!selectedList) return;

        const selected = teachers.filter((teacher) =>
            selectedTeacherIds.has(teacher.id)
        );

        if (selectedLabel) {
            selectedLabel.textContent = `Selected (${selected.length})`;
        }

        selectedList.innerHTML = selected
            .map(
                (teacher) => `
                    <span class="teacher-chip">
                        ${escapeHtml(teacher.name)}
                        <button
                            type="button"
                            data-remove-selected="${escapeHtml(teacher.id)}"
                            aria-label="Remove ${escapeHtml(teacher.name)}"
                        >
                            <i data-lucide="x"></i>
                        </button>
                    </span>
                `
            )
            .join("");

        renderHeadOptions();

        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    function renderTeacherTable() {
        const visible = getVisibleTeachers();

        if (!visible.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No teachers found.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = visible
            .map((teacher) => {
                const selected = selectedTeacherIds.has(teacher.id);
                const statusText = selected
                    ? "Will be added"
                    : teacher.department
                      ? `Will move from ${teacher.department}`
                      : "—";

                return `
                    <tr>
                        <td>
                            <input
                                type="checkbox"
                                data-teacher-checkbox="${escapeHtml(
                                    teacher.id
                                )}"
                                ${selected ? "checked" : ""}
                            />
                        </td>
                        <td>${escapeHtml(teacher.name)}</td>
                        <td>${escapeHtml(
                            teacher.department || "Unassigned"
                        )}</td>
                        <td>${escapeHtml(
                            teacher.subjects?.join(", ") ||
                                "No subject assigned"
                        )}</td>
                        <td class="${
                            selected ? "status-success" : ""
                        }">
                            ${escapeHtml(statusText)}
                        </td>
                    </tr>
                `;
            })
            .join("");

        renderSelectedTeachers();
    }

    async function loadCreateData() {
        const data = await request(`${ROOT}/create-data`);

        updateBranding(data);

        teachers = Array.isArray(data.teachers)
            ? data.teachers
            : [];

        renderTeacherTable();
    }

    function showSuccessModal(result) {
        if (!successModal) {
            alert("Department created successfully.");
            window.location.href = "./departments";
            return;
        }

        const department = result.department || {};
        const message = successModal.querySelector(".success-modal p");

        if (message) {
            message.textContent =
                `${department.name || nameInput.value.trim()} has been created ` +
                `with ${selectedTeacherIds.size} teacher(s) assigned.`;
        }

        successModal.classList.add("show");
        successModal.style.display = "flex";
        successModal.setAttribute("aria-hidden", "false");

        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    async function submitDepartment(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const name = nameInput?.value.trim() || "";
        const description =
            descriptionInput?.value.trim() || "";
        const teacherIds = [...selectedTeacherIds];
        const headTeacherId = headSelect?.value || "";

        if (!name) {
            alert("Enter a department name.");
            nameInput?.focus();
            return;
        }

        if (!teacherIds.length) {
            alert("Select at least one teacher.");
            return;
        }

        if (!headTeacherId) {
            alert("Select a head of department.");
            headSelect?.focus();
            return;
        }

        const teachersBeingMoved = teachers.filter(
            (teacher) =>
                selectedTeacherIds.has(teacher.id) &&
                teacher.department
        );

        if (teachersBeingMoved.length) {
            const names = teachersBeingMoved
                .map((teacher) => teacher.name)
                .join(", ");

            if (
                !confirm(
                    `These teachers will be moved from their current department: ${names}. Continue?`
                )
            ) {
                return;
            }
        }

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );
        const originalText =
            submitButton?.textContent || "Save Department";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Saving department…";
        }

        try {
            const result = await request(ROOT, {
                method: "POST",
                body: JSON.stringify({
                    name,
                    description,
                    teacherIds,
                    headTeacherId,
                }),
            });

            showSuccessModal(result);
        } catch (error) {
            alert(error.message || "Could not create the department.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    }

    // Capture-phase listeners prevent the existing create.js demo
    // handlers from also submitting or modifying the demo table.
    form.addEventListener("submit", submitDepartment, true);

    tableBody.addEventListener(
        "change",
        (event) => {
            const checkbox = event.target.closest(
                "[data-teacher-checkbox]"
            );

            if (!checkbox) return;

            event.stopImmediatePropagation();

            const id = checkbox.dataset.teacherCheckbox;

            if (checkbox.checked) {
                selectedTeacherIds.add(id);
            } else {
                selectedTeacherIds.delete(id);
            }

            renderTeacherTable();
        },
        true
    );

    selectedList?.addEventListener(
        "click",
        (event) => {
            const button = event.target.closest(
                "[data-remove-selected]"
            );

            if (!button) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            selectedTeacherIds.delete(
                button.dataset.removeSelected
            );

            renderTeacherTable();
        },
        true
    );

    searchInput?.addEventListener("input", renderTeacherTable);

    cancelButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.location.href = "./departments";
        },
        true
    );

    viewDepartmentsButton?.addEventListener(
        "click",
        () => {
            window.location.href = "./departments";
        },
        true
    );

    createAnotherButton?.addEventListener(
        "click",
        () => {
            window.location.reload();
        },
        true
    );

    loadCreateData().catch((error) => {
        console.error("Could not load department form data:", error);
        alert(error.message || "Could not load teachers.");
    });
})();