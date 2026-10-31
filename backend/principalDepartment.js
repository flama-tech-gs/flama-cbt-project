//backend/principalDepartment.js

(() => {
    "use strict";

    const API_BASE =
        `${window.location.protocol}//${window.location.hostname}:5000/api`;
    const DEPARTMENTS_URL = `${API_BASE}/principal/departments`;
    const token = sessionStorage.getItem("principalAccessToken");

    const grid = document.querySelector(".departments-grid");
    const createButton =
        document.querySelector(".create-department-btn");

    if (!grid) {
        console.error("Could not find .departments-grid.");
        return;
    }

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>"']/g, (character) => {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            };

            return replacements[character];
        });
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

    async function getDepartments() {
        if (!token) {
            throw new Error(
                "Your principal session has expired. Please sign in again."
            );
        }

        const response = await fetch(DEPARTMENTS_URL, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                body.message ||
                    body.error ||
                    `Could not load departments (${response.status})`
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

    function buildEditUrl(department) {
        const url = new URL("./edit.html", window.location.href);

        if (department.id) {
            url.searchParams.set("departmentId", department.id);
        }

        // Include the name as a fallback for departments derived from
        // the Teacher.department string that have not been registered yet.
        url.searchParams.set("name", department.name || "");

        return `${url.pathname}${url.search}`;
    }

    function renderDepartments(departments) {
        const colors = [
            "green",
            "orange",
            "blue",
            "purple",
            "red",
            "yellow",
        ];

        if (!departments.length) {
            grid.innerHTML = "<p>No departments found.</p>";
            return;
        }

        grid.innerHTML = departments
            .map((department, index) => {
                const color = colors[index % colors.length];
                const headName =
                    department.headTeacher?.name || "Not assigned";
                const subjects =
                    Array.isArray(department.subjects) &&
                    department.subjects.length
                        ? department.subjects.join(", ")
                        : "No subjects assigned";

                return `
                    <article class="department-card">
                        <div class="department-top">
                            <div class="department-heading">
                                <span class="department-dot ${color}"></span>
                                <h3>${escapeHtml(department.name)}</h3>
                            </div>

                            <a
                                class="edit-btn ${color}"
                                href="${escapeHtml(buildEditUrl(department))}"
                            >
                                ✏️ Edit
                            </a>
                        </div>

                        <p class="hod">
                            HOD:
                            <span>${escapeHtml(headName)}</span>
                        </p>

                        <span class="teacher-badge">
                            ${Number(department.teacherCount || 0)}
                            ${
                                Number(department.teacherCount || 0) === 1
                                    ? "Teacher"
                                    : "Teachers"
                            }
                        </span>

                        <p class="subjects">
                            ${escapeHtml(subjects)}
                        </p>
                    </article>
                `;
            })
            .join("");

        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    async function loadDepartments() {
        grid.setAttribute("aria-busy", "true");
        grid.innerHTML = "<p>Loading departments…</p>";

        try {
            const data = await getDepartments();

            updateBranding(data);

            renderDepartments(
                Array.isArray(data.departments)
                    ? data.departments
                    : []
            );
        } catch (error) {
            grid.innerHTML = `
                <p>
                    ${escapeHtml(error.message)}
                    <button type="button" data-reload-departments>
                        Retry
                    </button>
                </p>
            `;
        } finally {
            grid.removeAttribute("aria-busy");
        }
    }

    // Capture the click so any demo handler in departments.js
    // does not run as well.
    createButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.location.href = "./create.html";
        },
        true
    );

    grid.addEventListener("click", (event) => {
        const retryButton = event.target.closest(
            "[data-reload-departments]"
        );

        if (retryButton) {
            loadDepartments();
        }
    });

    loadDepartments();
})();