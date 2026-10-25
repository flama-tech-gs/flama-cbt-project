//backend/principalExamControl.js

const PRINCIPAL_API =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

const TOKEN_KEY = "principalAccessToken";

let classesWithExams = [];
let examToGoLive = null;
let examToStop = null;

function unwrap(result) {
    let value = result;

    for (let i = 0; i < 5; i += 1) {
        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            value.data !== undefined
        ) {
            value = value.data;
        } else {
            break;
        }
    }

    return value;
}

function getToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        window.location.replace("../index.html");
        throw new Error("Your login session has expired. Please log in again.");
    }

    return token;
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        cache: "no-store",
        ...options,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${getToken()}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || `Request failed (${response.status})`);
    }

    return unwrap(result);
}

function setText(id, value, fallback = "—") {
    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value === null || value === undefined || value === ""
                ? fallback
                : String(value);
    }
}

function setFirstExistingText(ids, value, fallback = "—") {
    for (const id of ids) {
        if (document.getElementById(id)) {
            setText(id, value, fallback);
            return;
        }
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-NG", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function questionCount(exam) {
    if (typeof exam.questionCount === "number") {
        return exam.questionCount;
    }

    if (Array.isArray(exam.questions)) {
        return exam.questions.length;
    }

    if (typeof exam.questions === "number") {
        return exam.questions;
    }

    return 0;
}

function statusInfo(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ONGOING") {
        return { value, label: "Active", css: "active" };
    }

    if (value === "COMPLETED") {
        return { value, label: "Completed", css: "completed" };
    }

    if (value === "CANCELLED") {
        return { value, label: "Cancelled", css: "cancelled" };
    }

    if (value === "DRAFT") {
        return { value, label: "Draft", css: "ready" };
    }

    if (value === "PUBLISHED") {
        return { value, label: "Ready to Launch", css: "ready" };
    }

    return { value, label: value || "Draft", css: "ready" };
}

function renderExamCard(schoolClass, exam) {
    const id = escapeHtml(exam.id || exam._id);
    const status = statusInfo(exam.status);
    const count = questionCount(exam);
    const duration = Number(exam.durationMinutes || 0);

    let metadata;

    if (status.value === "ONGOING") {
        metadata =
            `${count} questions • ${duration} mins • ` +
            `Started ${formatTime(exam.startDate)} • Ends ${formatTime(exam.endDate)}`;
    } else {
        metadata =
            `${count} questions • ${duration} mins • ` +
            `${escapeHtml(exam.term)} • ${escapeHtml(exam.session)} • ` +
            `Approved ${formatDate(exam.approvedAt)}`;
    }

    let actionMarkup = "";

    // Draft exams can be started now or scheduled for later.
    if (["DRAFT", "PUBLISHED"].includes(status.value)) {
        actionMarkup = `
            <button
                type="button"
                class="exam-btn go-live"
                data-exam-action="go-live"
                data-exam-id="${id}">
                <i data-lucide="play"></i>
                Go Live
            </button>

            <button
                type="button"
                class="exam-btn schedule"
                data-exam-action="schedule"
                data-exam-id="${id}">
                <i data-lucide="clock-3"></i>
                Schedule
            </button>
        `;
    } else if (status.value === "ONGOING") {
        // Stop Exam only appears while the exam is ongoing.
        actionMarkup = `
            <button
                type="button"
                class="exam-btn stop"
                data-exam-action="stop"
                data-exam-id="${id}">
                <i data-lucide="square"></i>
                Stop Exam
            </button>
        `;
    }

    return `
        <div class="exam-card">
            <div>
                <div class="exam-title">
                    <h3>${escapeHtml(exam.subject)} – ${escapeHtml(schoolClass.className)}</h3>
                    <span class="status ${status.css}">
                        ${escapeHtml(status.label)}
                    </span>
                </div>
                <p class="exam-meta">${metadata}</p>
            </div>

            <div class="exam-actions">
                ${actionMarkup}
            </div>
        </div>
    `;
}

function renderExamList(classes = []) {
    const container = document.getElementById("examAccordion");

    if (!container) {
        console.error('Exam control HTML is missing #examAccordion.');
        return;
    }

    classesWithExams = classes;

    if (!classes.length) {
        container.innerHTML = "<p>No exams found.</p>";
        return;
    }

    container.innerHTML = classes
        .map((schoolClass, index) => {
            const exams = schoolClass.exams || [];
            const open = index === 0;

            return `
                <section class="exam-section">
                    <div
                        class="exam-header ${open ? "active" : ""}"
                        data-exam-accordion>
                        <div class="exam-header-left">
                            <h2>${escapeHtml(schoolClass.className)}</h2>
                            <span class="exam-count">
                                ${exams.length} exam${exams.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        <i data-lucide="${open ? "chevron-up" : "chevron-down"}"></i>
                    </div>

                    <div class="exam-body ${open ? "" : "hidden"}">
                        ${
                            exams.length
                                ? exams
                                      .map((exam) =>
                                          renderExamCard(schoolClass, exam)
                                      )
                                      .join("")
                                : "<p>No exams for this class.</p>"
                        }
                    </div>
                </section>
            `;
        })
        .join("");

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function findExam(examId) {
    for (const schoolClass of classesWithExams) {
        const exam = (schoolClass.exams || []).find(
            (item) => String(item.id || item._id) === String(examId)
        );

        if (exam) return { schoolClass, exam };
    }

    return null;
}

function showModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.hidden = false;
        modal.classList.add("show");
    }

    if (window.lucide) window.lucide.createIcons();
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
        modal.hidden = true;
    }
}

function openGoLiveModal(examId) {
    const match = findExam(examId);

    if (!match) {
        alert("Could not find the selected exam.");
        return;
    }

    examToGoLive = match;

    const className = match.schoolClass.className;
    const subject = match.exam.subject;
    const students = match.schoolClass.studentCount ?? 0;
    const duration = match.exam.durationMinutes ?? 0;
    const questions = questionCount(match.exam);

    setText("liveClassName", className);
    setText("liveSubjectName", subject);
    setText("goLiveClass", className);
    setText("goLiveSubject", subject);
    setText("liveStudentCount", students);
    setFirstExistingText(["liveDuration", "LiveDuration"], `${duration} minutes`);
    setFirstExistingText(["liveQuestionCount", "LiveQuestionCount"], questions);

    showModal("goLiveModal");
}

function openStopModal(examId) {
    const match = findExam(examId);

    if (!match) {
        alert("Could not find the selected exam.");
        return;
    }

    examToStop = match;

    const exam = match.exam;
    const className = match.schoolClass.className;
    const remaining = Math.max(
        0,
        Math.ceil((new Date(exam.endDate).getTime() - Date.now()) / 60000)
    );

    setText("stopExamSubject", exam.subject);
    setText("stopExamClass", className);
    setText(
        "stopExamTimeRemaining",
        Number.isFinite(remaining) ? `${remaining} minutes` : "—"
    );
    setText(
        "stopExamStudentsInProgress",
        `${exam.studentsInProgress ?? 0} of ${match.schoolClass.studentCount ?? 0}`
    );

    showModal("stopExamModal");
}

async function loadBranding() {
    const [schoolResult, profileResult] = await Promise.all([
        apiRequest(`${PRINCIPAL_API}/tenant/auth/school-info`),
        apiRequest(`${PRINCIPAL_API}/principal/profile`),
    ]);

    const school = schoolResult?.school || schoolResult;
    const profile = profileResult?.principal
        ? profileResult
        : profileResult?.data || profileResult;
    const principal = profile?.principal || {};

    const schoolName = school?.name || school?.schoolName;
    const logoUrl =
        school?.logo ||
        school?.image ||
        school?.logoUrl ||
        school?.images?.[0]?.url;

    if (schoolName) setText("schoolName", schoolName);

    const logo = document.getElementById("schoolLogo");
    if (logo && logoUrl) {
        logo.src = logoUrl;
        logo.alt = `${schoolName || "School"} logo`;
    }

    setText(
        "principalName",
        principal.fullName || principal.name,
        "Principal"
    );

    const principalImage = document.getElementById("principalImage");
    const principalImageUrl =
        principal.profileImage || principal.avatar || principal.image;

    if (principalImage && principalImageUrl) {
        principalImage.src = principalImageUrl;
        principalImage.alt =
            principal.fullName || principal.name || "Principal";
    }
}

async function loadExamControl() {
    const data = await apiRequest(
        `${PRINCIPAL_API}/principal/exam-control`
    );

    renderExamList(data.classes || []);
}

async function confirmGoLive() {
    if (!examToGoLive) {
        alert("Select an exam first.");
        return;
    }

    const examId = examToGoLive.exam.id || examToGoLive.exam._id;
    const button = document.getElementById("confirmGoLive");

    if (button) button.disabled = true;

    try {
        const result = await apiRequest(
            `${PRINCIPAL_API}/principal/exam-control/${encodeURIComponent(
                examId
            )}/go-live`,
            { method: "PATCH" }
        );

        closeModal("goLiveModal");
        examToGoLive = null;
        alert(result.message || "Exam is now live.");
        await loadExamControl();
    } catch (error) {
        console.error("Could not start exam:", error);
        alert(error.message || "Could not start exam.");
    } finally {
        if (button) button.disabled = false;
    }
}

async function confirmStopExam() {
    if (!examToStop) {
        alert("Select an exam first.");
        return;
    }

    const examId = examToStop.exam.id || examToStop.exam._id;
    const button = document.getElementById("confirmStopExam");

    if (button) button.disabled = true;

    try {
        const result = await apiRequest(
            `${PRINCIPAL_API}/principal/exam-control/${encodeURIComponent(
                examId
            )}/stop`,
            { method: "PATCH" }
        );

        closeModal("stopExamModal");
        examToStop = null;
        alert(result.message || "Exam stopped and marked completed.");
        await loadExamControl();
    } catch (error) {
        console.error("Could not stop exam:", error);
        alert(error.message || "Could not stop exam.");
    } finally {
        if (button) button.disabled = false;
    }
}

function handleIntegrationClick(event) {
    const target = event.target instanceof Element
        ? event.target
        : event.target?.parentElement;

    if (!target) return;

    const actionButton = target.closest("[data-exam-action]");

    if (actionButton) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const examId = actionButton.dataset.examId;
        const action = actionButton.dataset.examAction;

        if (action === "go-live") openGoLiveModal(examId);
        if (action === "stop") openStopModal(examId);

        if (action === "schedule") {
            window.location.assign(
                `./schedule-exam.html?examId=${encodeURIComponent(examId)}`
            );
        }

        return;
    }

    if (target.closest("#confirmGoLive")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        confirmGoLive();
        return;
    }

    if (target.closest("#confirmStopExam")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        confirmStopExam();
        return;
    }

    if (target.closest("#closeGoLive")) {
        closeModal("goLiveModal");
        return;
    }

    if (target.closest("#closeStopExam")) {
        closeModal("stopExamModal");
        return;
    }

    const header = target.closest("[data-exam-accordion]");

    if (header) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const body = header.nextElementSibling;
        const icon = header.querySelector("i");

        body?.classList.toggle("hidden");
        header.classList.toggle("active");

        if (icon) {
            icon.setAttribute(
                "data-lucide",
                body?.classList.contains("hidden")
                    ? "chevron-down"
                    : "chevron-up"
            );
        }

        if (window.lucide) window.lucide.createIcons();
    }
}

document.addEventListener("click", handleIntegrationClick, true);

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadBranding();
        await loadExamControl();

        // Refresh the list so elapsed exams change from Active to Completed
        // while the page is open.
        window.setInterval(() => {
            loadExamControl().catch((error) => {
                console.error("Could not refresh exam statuses:", error);
            });
        }, 30000);
    } catch (error) {
        console.error("Exam Control integration failed:", error);
        alert(error.message || "Could not load Exam Control.");
    }
});