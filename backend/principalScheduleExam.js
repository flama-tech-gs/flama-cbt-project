//backend/principalScheduleExam.j

const SCHEDULE_API =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

const SCHEDULE_TOKEN_KEY = "principalAccessToken";
const selectedExamId = new URLSearchParams(window.location.search).get("examId");

let selectedQuickSchedule = null;

function unwrapScheduleResponse(result) {
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

function scheduleSetText(id, value, fallback = "—") {
    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value === null || value === undefined || value === ""
                ? fallback
                : String(value);
    }
}

function scheduleGetToken() {
    const token = sessionStorage.getItem(SCHEDULE_TOKEN_KEY);

    if (!token) {
        window.location.replace("../index.html");
        throw new Error("Your login session has expired. Please log in again.");
    }

    return token;
}

async function scheduleRequest(url, options = {}) {
    const response = await fetch(url, {
        cache: "no-store",
        ...options,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${scheduleGetToken()}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || `Request failed (${response.status})`);
    }

    return unwrapScheduleResponse(result);
}

function findScheduleExam(classes, examId) {
    for (const schoolClass of classes || []) {
        const exam = (schoolClass.exams || []).find(
            (item) => String(item.id || item._id) === String(examId)
        );

        if (exam) return { schoolClass, exam };
    }

    return null;
}

function setSelectValue(select, value, label) {
    if (!select) return;

    select.replaceChildren();

    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = true;
    select.appendChild(option);

    select.disabled = true;
}

function toLocalDateAndTime(date) {
    const pad = (number) => String(number).padStart(2, "0");

    return {
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
}

function selectScheduleDate(date) {
    const value = toLocalDateAndTime(date);

    const dateInput = document.getElementById("examDate");
    const timeInput = document.getElementById("examTime");

    if (dateInput) dateInput.value = value.date;
    if (timeInput) timeInput.value = value.time;
}

function showScheduleMessage(message) {
    const element = document.getElementById("scheduleMessage");

    if (element) {
        element.textContent = message;
    } else {
        alert(message);
    }
}

async function loadScheduleExam() {
    if (!selectedExamId) {
        throw new Error("No exam was selected. Return to Exam Control and choose Schedule.");
    }

    const data = await scheduleRequest(
        `${SCHEDULE_API}/principal/exam-control`
    );

    const match = findScheduleExam(data.classes, selectedExamId);

    if (!match) {
        throw new Error("The selected exam was not found.");
    }

    const { schoolClass, exam } = match;

    const subjectSelect = document.getElementById("subject");
    const classSelect = document.getElementById("class");
    const durationSelect = document.getElementById("duration");

    setSelectValue(subjectSelect, exam.subject, exam.subject);
    setSelectValue(classSelect, schoolClass.className, schoolClass.className);

    const duration = Number(exam.durationMinutes || exam.duration || 0);
    setSelectValue(
        durationSelect,
        String(duration),
        `${duration} Minutes`
    );

    scheduleSetText(
        "questionCount",
        exam.questionCount ?? exam.questions?.length ?? exam.questions ?? 0
    );

    scheduleSetText(
        "scheduleTitle",
        `Schedule ${exam.subject} — ${schoolClass.className}`
    );

    return exam;
}

function setQuickScheduleButtons() {
    document.querySelectorAll(".quick-buttons button").forEach((button) => {
        button.addEventListener("click", () => {
            document
                .querySelectorAll(".quick-buttons button")
                .forEach((item) => item.classList.remove("active"));

            button.classList.add("active");

            if (button.dataset.hours) {
                selectedQuickSchedule = {
                    type: "hours",
                    value: Number(button.dataset.hours),
                };

                const start = new Date(
                    Date.now() + selectedQuickSchedule.value * 60 * 60 * 1000
                );
                selectScheduleDate(start);
                return;
            }

            if (button.dataset.schedule === "tomorrow-8") {
                selectedQuickSchedule = {
                    type: "tomorrow-8",
                };

                const start = new Date();
                start.setDate(start.getDate() + 1);
                start.setHours(8, 0, 0, 0);
                selectScheduleDate(start);
            }
        });
    });

    document.getElementById("examDate")?.addEventListener("input", () => {
        selectedQuickSchedule = null;
        document
            .querySelectorAll(".quick-buttons button")
            .forEach((button) => button.classList.remove("active"));
    });

    document.getElementById("examTime")?.addEventListener("input", () => {
        selectedQuickSchedule = null;
        document
            .querySelectorAll(".quick-buttons button")
            .forEach((button) => button.classList.remove("active"));
    });
}

function getSelectedStartDate() {
    const dateValue = document.getElementById("examDate")?.value;
    const timeValue = document.getElementById("examTime")?.value;

    if (!dateValue || !timeValue) return null;

    const [year, month, day] = dateValue.split("-").map(Number);
    const [hour, minute] = timeValue.split(":").map(Number);

    const date = new Date(year, month - 1, day, hour, minute, 0, 0);

    return Number.isNaN(date.getTime()) ? null : date;
}

async function submitSchedule() {
    if (!selectedExamId) {
        showScheduleMessage("No exam was selected.");
        return;
    }

    const startDate = getSelectedStartDate();

    if (!startDate || startDate <= new Date()) {
        showScheduleMessage("Choose a valid future date and time.");
        return;
    }

    const button = document.getElementById("confirmSchedule");

    if (button) button.disabled = true;

    try {
        const result = await scheduleRequest(
            `${SCHEDULE_API}/principal/exam-control/${encodeURIComponent(
                selectedExamId
            )}/schedule`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    startDate: startDate.toISOString(),
                }),
            }
        );

        showScheduleMessage(result.message || "Exam scheduled successfully.");
    } catch (error) {
        console.error("Could not schedule exam:", error);
        showScheduleMessage(error.message || "Could not schedule exam.");
    } finally {
        if (button) button.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    setQuickScheduleButtons();

    document
        .getElementById("confirmSchedule")
        ?.addEventListener("click", submitSchedule);

    document
        .getElementById("cancelSchedule")
        ?.addEventListener("click", () => {
            window.location.assign("./exam-control.html");
        });

    try {
        await loadScheduleExam();

        const [schoolResult, profileResult] = await Promise.all([
            scheduleRequest(`${SCHEDULE_API}/tenant/auth/school-info`),
            scheduleRequest(`${SCHEDULE_API}/principal/profile`),
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

        if (schoolName) scheduleSetText("schoolName", schoolName);

        const logo = document.getElementById("schoolLogo");
        if (logo && logoUrl) {
            logo.src = logoUrl;
            logo.alt = `${schoolName || "School"} logo`;
        }

        scheduleSetText(
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
    } catch (error) {
        console.error("Could not load schedule page:", error);
        showScheduleMessage(error.message || "Could not load the selected exam.");
    }

    if (window.lucide) window.lucide.createIcons();
});