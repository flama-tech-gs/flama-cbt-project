//backend/principalOverview.js

const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

const PRINCIPAL_TOKEN_KEY = "principalAccessToken";

function unwrapResponse(result) {
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

function setText(elementId, value, fallback = "—") {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent =
            value === null || value === undefined || value === ""
                ? fallback
                : value;
    }
}

async function loadSchoolBranding() {
    const response = await fetch(
        `${API_BASE}/tenant/auth/school-info`,
        {
            headers: { Accept: "application/json" },
            cache: "no-store",
        }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Could not load school details.");
    }

    const school = unwrapResponse(result)?.school || unwrapResponse(result);
    const name = school?.name || school?.schoolName;
    const logo =
        school?.logo ||
        school?.image ||
        school?.logoUrl ||
        school?.images?.[0]?.url;

    if (name) {
        setText("schoolName", name, "School");
        document.title = `Principal Overview | ${name}`;
    }

    if (logo) {
        const image = document.getElementById("schoolLogo");
        if (image) image.src = logo;
    }
}

function renderPrincipal(principal) {
    setText("principalName", principal?.name, "Principal");

    const image = document.getElementById("principalImage");
    if (image && principal?.image) {
        image.src = principal.image;
    }
}

function renderStats(totals) {
    const grid = document.getElementById("statsGrid");
    if (!grid) return;

    const cards = [
        ["Total Students", totals.students],
        ["Total Teachers", totals.teachers],
        ["Total Classes", totals.classes],
        ["Total Subjects", totals.subjects],
        ["Upcoming Exams", totals.upcomingExams],
        ["Submitted Questions", totals.submittedQuestions],
        ["Approved Questions", totals.approvedQuestions],
        ["Pending Questions", totals.pendingQuestions],
        ["Exam Attempts Not Submitted", totals.unsubmittedExamAttempts],
    ];

    grid.replaceChildren();

    for (const [label, value] of cards) {
        const card = document.createElement("div");
        card.className = "stat-card";

        const number = document.createElement("h3");
        number.textContent = value ?? 0;

        const caption = document.createElement("p");
        caption.textContent = label;

        card.append(number, caption);
        grid.appendChild(card);
    }
}

function renderQuestions(questions) {
    const tbody = document.getElementById("approvalTable");
    if (!tbody) return;

    tbody.replaceChildren();

    if (!questions?.length) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = "No questions are awaiting approval.";
        return;
    }

    for (const question of questions) {
        const row = tbody.insertRow();

        row.insertCell().textContent = question.subject || "—";
        row.insertCell().textContent = question.className || "—";
        row.insertCell().textContent = question.teacherName || "—";

        const questionCell = row.insertCell();
        questionCell.textContent = question.questionText || "—";
        questionCell.title = question.questionText || "";

        row.insertCell().textContent = question.submittedAt
            ? new Intl.DateTimeFormat("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              }).format(new Date(question.submittedAt))
            : "—";

        const actionCell = row.insertCell();
        const reviewLink = document.createElement("a");
        reviewLink.textContent = "Review";
        reviewLink.href =
            `./submitted-questions/submitted-questions.html?questionId=${encodeURIComponent(question.id)}`;
        actionCell.appendChild(reviewLink);
    }
}

async function loadOverview() {
    const token = sessionStorage.getItem(PRINCIPAL_TOKEN_KEY);

    if (!token) {
        window.location.assign("./index.html");
        return;
    }

    try {
        const [overviewResponse] = await Promise.all([
            fetch(`${API_BASE}/principal/overview`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
            loadSchoolBranding(),
        ]);

        const result = await overviewResponse.json().catch(() => ({}));

        if (!overviewResponse.ok) {
            if (overviewResponse.status === 401) {
                sessionStorage.removeItem("principalAccessToken");
                sessionStorage.removeItem("principalRefreshToken");
                sessionStorage.removeItem("principalAccount");
                window.location.assign("./index.html");
                return;
            }

            throw new Error(
                result.message || "Could not load the principal overview."
            );
        }

        const data = unwrapResponse(result);

        setText("currentSession", data.currentSession);
        setText("currentTerm", data.currentTerm);
        renderPrincipal(data.principal);
        renderStats(data.totals || {});
        renderQuestions(data.questionsAwaitingApproval || []);

        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error("Could not load principal overview:", error);
        alert(error.message || "Could not load the principal overview.");
    }
}

document.addEventListener("DOMContentLoaded", loadOverview);