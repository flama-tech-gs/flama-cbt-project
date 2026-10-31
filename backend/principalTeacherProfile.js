//backend/principalTeacherProfile.js

(() => {
    "use strict";

    const API_BASE =
        `${window.location.protocol}//${window.location.hostname}:5000/api`;

    const teacherId = new URLSearchParams(
        window.location.search
    ).get("teacherId");

    const token = sessionStorage.getItem("principalAccessToken");

    const fallbackImage = "../assets/teacher.png";

    function unwrapResponse(response) {
        let data = response;

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

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
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

        return unwrapResponse(body);
    }

    function setText(element, value) {
        if (element) {
            element.textContent =
                value === undefined || value === null || value === ""
                    ? "—"
                    : String(value);
        }
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function setProfileRow(labelText, value) {
        const rows = document.querySelectorAll(
            ".teacher-details .teacher-row"
        );

        for (const row of rows) {
            const label = row
                .querySelector(".label")
                ?.textContent.trim()
                .replace(/:$/, "")
                .toLowerCase();

            if (label !== labelText.toLowerCase()) continue;

            const valueElement = row.querySelector(".value");

            if (valueElement) {
                valueElement.textContent =
                    value === undefined || value === null || value === ""
                        ? "—"
                        : String(value);
            }

            return;
        }
    }

    function setStatus(status) {
        const row = [...document.querySelectorAll(
            ".teacher-details .teacher-row"
        )].find((item) =>
            item
                .querySelector(".label")
                ?.textContent.toLowerCase()
                .includes("full name")
        );

        if (!row) return;

        let group = row.querySelector(".value-group");

        if (!group) {
            const value = row.querySelector(".value");

            if (!value) return;

            group = document.createElement("div");
            group.className = "value-group";
            value.parentNode.insertBefore(group, value);
            group.appendChild(value);
        }

        let badge = group.querySelector(".status-badge");

        if (!badge) {
            badge = document.createElement("span");
            badge.className = "status-badge";
            badge.innerHTML = '<span class="dot"></span>';
            group.appendChild(badge);
        }

        const normalized = String(status || "UNKNOWN").toUpperCase();

        badge.className = "status-badge";

        if (normalized === "ACTIVE") {
            badge.classList.add("active");
            badge.innerHTML = '<span class="dot"></span>Active';
        } else if (normalized === "SUSPENDED") {
            badge.classList.add("inactive");
            badge.innerHTML = '<span class="dot"></span>Paused';
        } else {
            badge.classList.add("inactive");
            badge.innerHTML =
                `<span class="dot"></span>${normalized}`;
        }
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

        setText(schoolName, school.name);

        if (schoolLogo && school.logo) {
            schoolLogo.src = school.logo;
        }

        setText(principalName, principal.name);

        if (principalImage && principal.image) {
            principalImage.src = principal.image;
        }
    }

    function updateTeacherDetails(teacher) {
        const photo = document.querySelector(".teacher-photo img");

        if (photo) {
            photo.src = teacher.avatar || fallbackImage;
            photo.alt = teacher.fullName || "Teacher profile photo";
            photo.onerror = () => {
                photo.onerror = null;
                photo.src = fallbackImage;
            };
        }

        setProfileRow(
            "full name",
            teacher.fullName ||
                [
                    teacher.title,
                    teacher.firstName,
                    teacher.lastName,
                ]
                    .filter(Boolean)
                    .join(" ")
        );

        setProfileRow("staff id", teacher.employeeId);
        setProfileRow("department", teacher.department);

        const subjectNames = (teacher.subjects || [])
            .map((subject) => subject.name)
            .filter(Boolean)
            .join(", ");

        setProfileRow("subjects taught", subjectNames);
        setProfileRow("phone number", teacher.phone);
        setProfileRow("qualification", teacher.qualification);
        setProfileRow("address", teacher.address);
        setProfileRow("date employed", formatDate(teacher.appointedAt));
        setStatus(teacher.status);

        // Add email to the existing details list if a matching row exists.
        setProfileRow("email", teacher.email);
    }

    function updateSummary(summary) {
        const cards = document.querySelectorAll(
            ".stats-grid .stat-card"
        );

        const values = [
            summary.totalStudents ?? 0,
            summary.totalClasses ?? 0,
            summary.examsSubmitted ?? 0,
            summary.pendingApprovalExams ?? 0,
            `${Number(summary.averageStudentScore || 0).toFixed(1)}%`,
        ];

        cards.forEach((card, index) => {
            const number = card.querySelector("h3");

            if (number && values[index] !== undefined) {
                number.textContent = String(values[index]);
            }
        });
    }

    function renderClasses(classes) {
        const tableBody = document.querySelector(
            ".table-section tbody"
        );

        if (!tableBody) return;

        if (!Array.isArray(classes) || classes.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No active classes or subjects assigned.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = classes
            .map(
                (item) => `
                    <tr>
                        <td>${escapeHtml(item.className || "—")}</td>
                        <td>${escapeHtml(item.subject || "—")}</td>
                        <td>${Number(item.studentCount || 0)}</td>
                        <td>${escapeHtml(item.term || "—")}</td>
                        <td>${escapeHtml(item.session || "—")}</td>
                    </tr>
                `
            )
            .join("");
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

    function setAccountButtonState(status) {
        const pauseButton = document.querySelector(
            ".account-management .btn-outline-danger"
        );

        if (!pauseButton) return;

        if (String(status).toUpperCase() === "ACTIVE") {
            pauseButton.textContent = "Pause Account";
            pauseButton.dataset.action = "pause";
        } else {
            pauseButton.textContent = "Reactivate Account";
            pauseButton.dataset.action = "activate";
        }
    }

    async function loadProfile() {
        if (!token) {
            alert("Your principal session has expired. Please sign in again.");
            return;
        }

        if (!teacherId) {
            alert("No teacher ID was provided in the profile page URL.");
            return;
        }

        const page = document.querySelector(".teacher-profile-page");

        try {
            page?.setAttribute("aria-busy", "true");

            const data = await apiRequest(
                `${API_BASE}/principal/teachers/${encodeURIComponent(
                    teacherId
                )}`
            );

            updateBranding(data);
            updateTeacherDetails(data.teacher || {});
            updateSummary(data.summary || {});
            renderClasses(data.classes || []);
            setAccountButtonState(data.teacher?.status);
        } catch (error) {
            alert(error.message || "Could not load the teacher profile.");
        } finally {
            page?.removeAttribute("aria-busy");
        }
    }

    document
        .getElementById("backButton")
        ?.addEventListener("click", () => {
            window.location.href = "./teachers.html";
        });

    const accountButtons = document.querySelectorAll(
        ".account-management button"
    );

    accountButtons[0]?.addEventListener("click", async () => {
        if (
            !confirm(
                "Reset this teacher's password? The current password will stop working."
            )
        ) {
            return;
        }

        try {
            const data = await apiRequest(
                `${API_BASE}/principal/teachers/${encodeURIComponent(
                    teacherId
                )}/password/reset`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            if (!data.temporaryPassword) {
                throw new Error(
                    "The server did not return a temporary password."
                );
            }

            prompt(
                "Copy this temporary password now. It will not be shown again:",
                data.temporaryPassword
            );
        } catch (error) {
            alert(error.message || "Could not reset the password.");
        }
    });

    accountButtons[1]?.addEventListener("click", async () => {
        const password = prompt(
            "Enter the new password (at least 6 characters):"
        );

        if (password === null) return;

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {
            await apiRequest(
                `${API_BASE}/principal/teachers/${encodeURIComponent(
                    teacherId
                )}/password`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password }),
                }
            );

            alert("Teacher password changed.");
        } catch (error) {
            alert(error.message || "Could not change the password.");
        }
    });

    const pauseButton = document.querySelector(
        ".account-management .btn-outline-danger"
    );

    pauseButton?.addEventListener("click", async () => {
        const action = pauseButton.dataset.action || "pause";
        const status = action === "pause" ? "SUSPENDED" : "ACTIVE";
        const verb = action === "pause" ? "Pause" : "Reactivate";

        if (!confirm(`${verb} this teacher's account?`)) return;

        try {
            await apiRequest(
                `${API_BASE}/principal/teachers/${encodeURIComponent(
                    teacherId
                )}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status }),
                }
            );

            location.reload();
        } catch (error) {
            alert(error.message || "Could not update the account status.");
        }
    });

    loadProfile();
})();