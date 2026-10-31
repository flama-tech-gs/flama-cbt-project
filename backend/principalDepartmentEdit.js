//backend/principalDepartmentEdit.js

(() => {
    "use strict";

    const API_BASE =
        `${window.location.protocol}//${window.location.hostname}:5000/api`;
    const ROOT = `${API_BASE}/principal/departments`;
    const token = sessionStorage.getItem("principalAccessToken");

    const params = new URLSearchParams(window.location.search);
    let departmentId = params.get("departmentId");
    const departmentNameFromUrl = params.get("name") || "";

    const nameInput = document.querySelector(".details-grid input");
    const hodSelect = document.querySelector(".details-grid select");
    const tableBody = document.querySelector(".teachers-section tbody");

    const saveButton = document.querySelector(".form-actions .btn-success");
    const cancelButton = document.querySelector(
        ".form-actions .btn-secondary"
    );
    const deleteButton = document.querySelector(
        ".form-actions .btn-danger"
    );
    const addButton = document.querySelector(".add-teacher-btn");

    let department = null;
    let availableTeachers = [];

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[character]);
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

        const schoolName = document.querySelector(".logo-area h2");
        const schoolLogo = document.querySelector(".logo-area img");
        const principalName =
            document.querySelector(".principal-details h4");
        const principalImage =
            document.querySelector(".principal-avatar img");

        if (schoolName && school.name) schoolName.textContent = school.name;
        if (schoolLogo && school.logo) schoolLogo.src = school.logo;
        if (principalName && principal.name) {
            principalName.textContent = principal.name;
        }
        if (principalImage && principal.image) {
            principalImage.src = principal.image;
        }
    }

    async function ensureDepartmentRecord() {
        if (departmentId) return;

        if (!departmentNameFromUrl) {
            throw new Error("No department was specified.");
        }

        const result = await request(ROOT, {
            method: "POST",
            body: JSON.stringify({ name: departmentNameFromUrl }),
        });

        departmentId =
            result.department?.id ||
            result.department?._id ||
            result.id;

        if (!departmentId) {
            throw new Error("Could not find or create this department.");
        }
    }

    function renderHodOptions() {
        if (!hodSelect) return;

        const currentHeadId = department.headTeacher?.id || "";

        hodSelect.replaceChildren(
            new Option("Select head of department", ""),
            ...department.teachers.map((teacher) => {
                const option = new Option(
                    `${teacher.name} (${teacher.employeeId || "—"})`,
                    teacher.id
                );
                option.selected = teacher.id === currentHeadId;
                return option;
            })
        );
    }

    function renderTeachers() {
        if (!tableBody) return;

        const members = [...(department.teachers || [])];

        // HOD is always shown first.
        members.sort((a, b) => {
            const aIsHead = a.id === department.headTeacher?.id;
            const bIsHead = b.id === department.headTeacher?.id;

            if (aIsHead !== bIsHead) return aIsHead ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        if (!members.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">No teachers are assigned to this department.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = members
            .map((teacher) => {
                const isHead =
                    teacher.id === department.headTeacher?.id;

                const joined = teacher.joinedDate
                    ? new Date(teacher.joinedDate).toLocaleDateString()
                    : "—";

                return `
                    <tr data-teacher-id="${escapeHtml(teacher.id)}">
                        <td>
                            <strong>${escapeHtml(teacher.name)}</strong>
                            ${
                                isHead
                                    ? '<span class="hod-badge">HOD</span>'
                                    : ""
                            }
                            <br>
                            <small>${escapeHtml(
                                teacher.employeeId || ""
                            )}</small>
                        </td>

                        <td>
                            ${escapeHtml(
                                teacher.subjects?.join(", ") ||
                                    "No subject assigned"
                            )}
                        </td>

                        <td>${escapeHtml(joined)}</td>

                        <td>
                            <button
                                type="button"
                                class="remove-btn"
                                data-action="remove"
                                data-teacher-id="${escapeHtml(teacher.id)}"
                            >Remove</button>

                            <button
                                type="button"
                                class="replace-btn"
                                data-action="replace"
                                data-teacher-id="${escapeHtml(teacher.id)}"
                            >Replace</button>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    async function loadDepartment() {
        await ensureDepartmentRecord();

        const data = await request(
            `${ROOT}/${encodeURIComponent(departmentId)}/edit-data`
        );

        updateBranding(data);

        department = data.department;
        availableTeachers = department.availableTeachers || [];

        if (nameInput) {
            nameInput.value = department.name || "";
        }

        renderHodOptions();
        renderTeachers();
    }

    async function saveDepartment() {
        const newName = nameInput?.value.trim() || "";

        if (!newName) {
            alert("Enter a department name.");
            nameInput?.focus();
            return;
        }

        await request(`${ROOT}/${encodeURIComponent(departmentId)}`, {
            method: "PATCH",
            body: JSON.stringify({ name: newName }),
        });

        const selectedHeadId = hodSelect?.value || "";

        if (selectedHeadId) {
            await request(
                `${ROOT}/${encodeURIComponent(departmentId)}/head`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ teacherId: selectedHeadId }),
                }
            );
        }

        alert("Department changes saved.");
        await loadDepartment();
    }

    async function addTeacher() {
        if (!availableTeachers.length) {
            alert("There are no other teachers available to add.");
            return;
        }

        const choices = availableTeachers
            .map(
                (teacher, index) =>
                    `${index + 1}. ${teacher.name} — ${
                        teacher.employeeId || "No staff ID"
                    }${teacher.department
                        ? ` [${teacher.department}]`
                        : ""}`
            )
            .join("\n");

        const answer = prompt(
            `Enter the number of the teacher to add:\n\n${choices}`
        );

        if (answer === null) return;

        const index = Number(answer) - 1;
        const teacher = availableTeachers[index];

        if (!teacher) {
            alert("That selection is not valid.");
            return;
        }

        await request(
            `${ROOT}/${encodeURIComponent(departmentId)}/teachers`,
            {
                method: "POST",
                body: JSON.stringify({ teacherId: teacher.id }),
            }
        );

        await loadDepartment();
    }

    async function removeTeacher(teacherId) {
        const teacher = department.teachers.find(
            (item) => item.id === teacherId
        );

        if (!teacher) return;

        if (!confirm(`Remove ${teacher.name} from this department?`)) {
            return;
        }

        await request(
            `${ROOT}/${encodeURIComponent(departmentId)}/teachers/${encodeURIComponent(
                teacherId
            )}`,
            { method: "DELETE" }
        );

        await loadDepartment();
    }

    async function replaceTeacher(oldTeacherId) {
        const oldTeacher = department.teachers.find(
            (item) => item.id === oldTeacherId
        );

        if (!oldTeacher) return;

        const choices = availableTeachers
            .map(
                (teacher, index) =>
                    `${index + 1}. ${teacher.name} — ${
                        teacher.employeeId || "No staff ID"
                    }${teacher.department
                        ? ` [${teacher.department}]`
                        : ""}`
            )
            .join("\n");

        if (!choices) {
            alert("There are no other teachers available to replace them.");
            return;
        }

        const answer = prompt(
            `Replace ${oldTeacher.name} with which teacher?\n\n${choices}`
        );

        if (answer === null) return;

        const replacement = availableTeachers[Number(answer) - 1];

        if (!replacement) {
            alert("That selection is not valid.");
            return;
        }

        await request(
            `${ROOT}/${encodeURIComponent(departmentId)}/teachers/${encodeURIComponent(
                oldTeacherId
            )}/replace`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    replacementTeacherId: replacement.id,
                }),
            }
        );

        await loadDepartment();
    }

    tableBody?.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        try {
            const teacherId = button.dataset.teacherId;

            if (button.dataset.action === "remove") {
                await removeTeacher(teacherId);
            }

            if (button.dataset.action === "replace") {
                await replaceTeacher(teacherId);
            }
        } catch (error) {
            alert(error.message || "Could not update department teachers.");
        }
    });

    addButton?.addEventListener("click", async () => {
        try {
            await addTeacher();
        } catch (error) {
            alert(error.message || "Could not add the teacher.");
        }
    });

    saveButton?.addEventListener("click", async (event) => {
        event.preventDefault();

        try {
            await saveDepartment();
        } catch (error) {
            alert(error.message || "Could not save department changes.");
        }
    });

    cancelButton?.addEventListener("click", () => {
        window.location.href = "./departments.html";
    });

    deleteButton?.addEventListener("click", () => {
        alert(
            "Department deletion is not connected in this integration."
        );
    });

    loadDepartment().catch((error) => {
        alert(error.message || "Could not load department details.");
    });
})();