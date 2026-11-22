//backend/principalTeacherProfile.js

(() => {
    "use strict";

    const API_BASE =
        window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

    const teacherId = new URLSearchParams(
        window.location.search
    ).get("teacherId");

    const token = sessionStorage.getItem("principalAccessToken");
    let currentTeacher = {};

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
            currentTeacher = data.teacher || {};
            updateTeacherDetails(currentTeacher);
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
            window.location.href = "./teachers";
        });

    const actionDialog = document.getElementById("teacherActionDialog");
    const successDialog = document.getElementById("teacherActionSuccessDialog");
    const actionError = document.getElementById("teacherActionError");
    const passwordField = document.getElementById("teacherPasswordField");
    const passwordInput = document.getElementById("newTeacherPassword");
    const confirmButton = document.getElementById("confirmTeacherAction");
    let pendingAction = "";
    let copyStaffId = "";

    function openAction(action) {
        pendingAction = action;
        actionError.hidden = true;
        actionError.textContent = "";
        passwordInput.value = "";
        passwordField.hidden = action !== "password";
        confirmButton.textContent = action === "password" ? "Update Password" : "Yes, continue";
        const name = currentTeacher.fullName || [currentTeacher.title, currentTeacher.firstName, currentTeacher.otherNames, currentTeacher.lastName].filter(Boolean).join(" ") || "this teacher";
        const email = currentTeacher.email ? ` (${currentTeacher.email})` : "";
        if (action === "reset") {
            document.getElementById("teacherActionTitle").textContent = "Change teacher staff ID?";
            document.getElementById("teacherActionDescription").textContent = `Generate a new staff ID for ${name}${email}. The current ID will stop working.`;
        } else if (action === "password") {
            document.getElementById("teacherActionTitle").textContent = "Change teacher password?";
            document.getElementById("teacherActionDescription").textContent = `Enter a new password for ${name}${email}.`;
        } else {
            const paused = action === "pause";
            document.getElementById("teacherActionTitle").textContent = paused ? "Pause teacher account?" : "Reactivate teacher account?";
            document.getElementById("teacherActionDescription").textContent = `${paused ? "Pause" : "Reactivate"} ${name}${email}?`;
        }
        actionDialog.showModal();
        if (action === "password") passwordInput.focus();
    }

    document.querySelector("#teacher-profile-reset-id")?.addEventListener("click", () => openAction("reset"));
    document.querySelector("#teacher-profile-change-password")?.addEventListener("click", () => openAction("password"));
    document.querySelector("#teacher-profile-pause")?.addEventListener("click", () => openAction(document.querySelector("#teacher-profile-pause").dataset.action || "pause"));
    document.getElementById("cancelTeacherAction")?.addEventListener("click", () => actionDialog.close());
    document.getElementById("closeTeacherActionSuccess")?.addEventListener("click", () => successDialog.close());
    document.getElementById("copyTeacherActionValue")?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(copyStaffId);
            document.getElementById("copyTeacherActionValue").textContent = "Copied";
        } catch {
            actionError.hidden = false;
            actionError.textContent = "Could not copy automatically. Copy the staff ID from the details above.";
        }
    });

    confirmButton?.addEventListener("click", async () => {
        if (!pendingAction) return;
        const action = pendingAction;
        const endpoint = `${API_BASE}/principal/teachers/${encodeURIComponent(teacherId)}`;
        confirmButton.disabled = true;
        confirmButton.textContent = "Updating…";
        actionError.hidden = true;
        try {
            let title;
            let message;
            let details = [["Teacher", currentTeacher.fullName || [currentTeacher.firstName, currentTeacher.lastName].filter(Boolean).join(" ")], ["Email", currentTeacher.email || "—"]];
            copyStaffId = "";
            if (action === "reset") {
                const result = await apiRequest(`${endpoint}/employee-id/reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                const updated = result.teacher || result;
                if (!updated.employeeId) throw new Error("The server did not return the new staff ID.");
                details.push(["Previous staff ID", updated.previousEmployeeId || currentTeacher.employeeId || "—"], ["New staff ID", updated.employeeId]);
                copyStaffId = updated.employeeId;
                currentTeacher.employeeId = updated.employeeId;
                setProfileRow("staff id", updated.employeeId);
                title = "Staff ID changed";
                message = "The teacher can now use the new staff ID.";
            } else if (action === "password") {
                const password = passwordInput.value;
                if (password.length < 6 || password.length > 128) throw new Error("Password must be between 6 and 128 characters.");
                await apiRequest(`${endpoint}/password`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
                title = "Password changed";
                message = "The teacher password was updated successfully.";
            } else {
                const paused = action === "pause";
                await apiRequest(`${endpoint}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: paused ? "SUSPENDED" : "ACTIVE" }) });
                currentTeacher.status = paused ? "SUSPENDED" : "ACTIVE";
                setStatus(currentTeacher.status);
                setAccountButtonState(currentTeacher.status);
                title = paused ? "Account paused" : "Account reactivated";
                message = `${currentTeacher.fullName || "The teacher"}’s account was ${paused ? "paused" : "reactivated"} successfully.`;
            }
            pendingAction = "";
            actionDialog.close();
            document.getElementById("teacherActionSuccessTitle").textContent = title;
            document.getElementById("teacherActionSuccessMessage").textContent = message;
            const resultDetails = document.getElementById("teacherActionResultDetails");
            resultDetails.replaceChildren();
            details.forEach(([label, value]) => {
                const row = document.createElement("div");
                const term = document.createElement("dt");
                const description = document.createElement("dd");
                term.textContent = label;
                description.textContent = value || "—";
                row.append(term, description);
                resultDetails.append(row);
            });
            const copyButton = document.getElementById("copyTeacherActionValue");
            copyButton.hidden = !copyStaffId;
            copyButton.textContent = "Copy staff ID";
            successDialog.showModal();
        } catch (error) {
            actionError.hidden = false;
            actionError.textContent = error.message || "The action failed.";
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = action === "password" ? "Update Password" : "Yes, continue";
        }
    });

    loadProfile();
})();
