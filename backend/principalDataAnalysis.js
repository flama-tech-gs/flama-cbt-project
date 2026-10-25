//backend/principalDataAnalysis.js

const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

const TOKEN_KEY = "principalAccessToken";

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

function setText(id, value, fallback = "—") {
    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value === null || value === undefined || value === ""
                ? fallback
                : value;
    }
}

function formatPercent(value) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toFixed(1)}%` : "—";
}

async function requestJson(url, token) {
    const response = await fetch(url, {
        cache: "no-store",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || `Request failed (${response.status})`);
    }

    return unwrapResponse(result);
}

function populateSelect(select, items, placeholder, selectedId = "") {
    if (!select) return;

    const previousValue = selectedId || select.value;
    select.replaceChildren();

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    for (const item of items || []) {
        const option = document.createElement("option");
        option.value = item.id || item._id;
        option.textContent = item.name;
        select.appendChild(option);
    }

    if (
        previousValue &&
        [...select.options].some((option) => option.value === previousValue)
    ) {
        select.value = previousValue;
    }
}

function renderBranding(school, principal) {
    const schoolName = school?.name || school?.schoolName;
    const schoolLogo =
        school?.logo ||
        school?.image ||
        school?.logoUrl ||
        school?.images?.[0]?.url;

    if (schoolName) {
        setText("schoolName", schoolName, "School");
        document.title = `Data Analysis | ${schoolName}`;
    }

    const logoElement = document.getElementById("schoolLogo");
    if (logoElement && schoolLogo) {
        logoElement.src = schoolLogo;
        logoElement.alt = `${schoolName || "School"} logo`;
    }

    setText("principalName", principal?.name, "Principal");

    const principalImage = document.getElementById("principalImage");
    if (principalImage && principal?.image) {
        principalImage.src = principal.image;
        principalImage.alt = principal.name || "Principal";
    }
}

function renderSummary(summary = {}) {
    const grid = document.getElementById("statsGrid");
    if (!grid) return;

    const cards = [
        {
            value: `${Number(summary.overallPassRate || 0).toFixed(1)}%`,
            title: "Overall Pass Rate",
            color: "lime",
        },
        {
            value: `${Number(summary.averageScore || 0).toFixed(1)}%`,
            title: "Average Score",
            color: "green",
        },
        {
            value: summary.completedExams ?? 0,
            title: "Exams Completed",
            color: "green",
        },
        {
            value: summary.inProgressExams ?? 0,
            title: "Exams In Progress",
            color: "orange",
        },
        {
            value: summary.scriptsGraded ?? 0,
            title: "Total Scripts Graded",
            color: "green",
        },
    ];

    grid.replaceChildren();

    for (const item of cards) {
        const card = document.createElement("div");
        card.className = `stat-card ${item.color}`;

        const value = document.createElement("h2");
        value.textContent = String(item.value);

        const title = document.createElement("p");
        title.textContent = item.title;

        card.append(value, title);
        grid.appendChild(card);
    }
}

function renderClassDetails(selection = {}) {
    // Add these IDs to the existing strong elements in .class-banner.
    setText("selectedClassName", selection.className, "All classes");
    setText("selectedClassTeacher", selection.classTeacher, "—");
    setText("selectedClassStudentCount", selection.studentCount ?? "—");
    setText("selectedTermName", selection.termName, "—");
}

function renderClassChart(classes = []) {
    const chart = document.getElementById("classChart");
    if (!chart) return;

    chart.replaceChildren();

    for (const item of classes) {
        const score = Number(item.averageScore || 0);

        const chartItem = document.createElement("div");
        chartItem.className = "chart-item";

        const label = document.createElement("span");
        label.textContent = `${score.toFixed(1)}%`;

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${score * 2.2}px`;

        const className = document.createElement("p");
        className.textContent = item.className;

        chartItem.append(label, bar, className);
        chart.appendChild(chartItem);
    }
}

function renderSubjectRows(subjects = []) {
    const tbody = document.getElementById("performanceTable");
    if (!tbody) return;

    tbody.replaceChildren();

    if (!subjects.length) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.textContent = "No subject performance data for this selection.";
        return;
    }

    for (const subject of subjects) {
        const row = tbody.insertRow();

        row.insertCell().textContent =
            subject.subjectName || subject.subject || "—";
        row.insertCell().textContent =
            `${Number(subject.averageScore || 0).toFixed(1)}%`;
        row.insertCell().textContent =
            `${Number(subject.passRate || 0).toFixed(1)}%`;
        row.insertCell().textContent =
            subject.highestScore == null
                ? "—"
                : `${Number(subject.highestScore).toFixed(1)}%`;
        row.insertCell().textContent =
            subject.lowestScore == null
                ? "—"
                : `${Number(subject.lowestScore).toFixed(1)}%`;

        const trendCell = row.insertCell();
        const trend = subject.trend || "flat";
        const iconName =
            trend === "up"
                ? "arrow-up"
                : trend === "down"
                    ? "arrow-down"
                    : "arrow-right";

        trendCell.innerHTML =
            `<span class="trend ${trend}"><i data-lucide="${iconName}"></i></span>`;
    }

    if (window.lucide) window.lucide.createIcons();
}

function currentFilters() {
    return {
        classId: document.getElementById("classFilter")?.value || "",
        sessionId: document.getElementById("sessionFilter")?.value || "",
        termId: document.getElementById("termFilter")?.value || "",
    };
}

async function loadAnalysis({ populateFilters = false } = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        window.location.replace("./index.html");
        return;
    }

    const filters = currentFilters();
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) query.set(key, value);
    }

    const endpoint = `${API_BASE}/principal/analysis${
        query.size ? `?${query.toString()}` : ""
    }`;

    try {
        const data = await requestJson(endpoint, token);

        if (populateFilters) {
            populateSelect(
                document.getElementById("classFilter"),
                data.filterOptions?.classes,
                "Select class",
                data.selection?.classId
            );
            populateSelect(
                document.getElementById("sessionFilter"),
                data.filterOptions?.sessions,
                "Select session",
                data.selection?.sessionId
            );
            populateSelect(
                document.getElementById("termFilter"),
                data.filterOptions?.terms,
                "Select term",
                data.selection?.termId
            );
        }

        renderBranding(data.school, data.principal);
		renderSummary(data.summary);
		renderClassDetails(data.selection);
		renderClassChart(data.classPerformance || []);
		renderSubjectRows(data.subjects || []);

        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error("Could not load principal data analysis:", error);

        if (error.message?.toLowerCase().includes("unauthorized") ||
            error.message?.toLowerCase().includes("authentication")) {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem("principalRefreshToken");
            sessionStorage.removeItem("principalAccount");
            window.location.replace("./index.html");
            return;
        }

        alert(error.message || "Could not load data analysis.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadAnalysis({ populateFilters: true });

    for (const id of ["classFilter", "sessionFilter", "termFilter"]) {
        document.getElementById(id)?.addEventListener("change", () => {
            loadAnalysis();
        });
    }
});



