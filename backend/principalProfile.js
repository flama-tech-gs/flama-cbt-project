//backend/principalProfile.js

const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

const TOKEN_KEY = "principalAccessToken";

function unwrapApiResponse(result) {
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

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function setImage(id, url) {
    const image = document.getElementById(id);

    if (image && url) {
        image.src = url;
    }
}

async function loadSchoolBranding() {
    const nameElement = document.getElementById("schoolName");
    const noticeElement = document.getElementById("schoolNameForNotice");
    const logoElement = document.getElementById("schoolLogo");

    try {
        const response = await fetch(
            `${API_BASE}/tenant/auth/school-info`,
            {
                headers: {
                    Accept: "application/json",
                },
                cache: "no-store",
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || `School info request failed (${response.status})`
            );
        }

        const payload = unwrapApiResponse(result);
        const school = payload?.school || payload;

        const schoolName =
            school?.name ||
            school?.schoolName;

        const schoolLogo =
            school?.logo ||
            school?.image ||
            school?.logoUrl ||
            school?.images?.[0]?.url;

        if (schoolName) {
            if (nameElement) nameElement.textContent = schoolName;
            if (noticeElement) noticeElement.textContent = schoolName;

            document.title = `Principal Profile | ${schoolName}`;
        } else {
            console.error("School info response has no name:", payload);
        }

        if (schoolLogo && logoElement) {
            logoElement.src = schoolLogo;
            logoElement.alt = `${schoolName || "School"} logo`;
        } else {
            //console.warn("School info response has no logo:", payload);
        }
    } catch (error) {
        console.error("Could not load school branding:", error);
    }
}


function renderPrincipal(principal) {
    setText("principalHeaderName", principal.fullName);
    setText("principalHeaderRole", principal.role, "School Principal");

    setText("principalFullName", principal.fullName);
    setText("principalStaffId", principal.staffId);
    setText("principalRole", principal.role, "School Principal");
    setText("principalPhone", principal.phone);
    setText("principalEmail", principal.email);
    setText("principalQualification", principal.qualification);
    setText("principalAddress", principal.address);
    setText(
        "principalAppointedAt",
        formatDate(principal.appointedAt)
    );

    setImage("principalHeaderImage", principal.profileImage);
    setImage("principalProfileImage", principal.profileImage);
}

function renderTotals(totals) {
    setText("totalStudents", totals.students, "0");
    setText("totalTeachers", totals.teachers, "0");
    setText("totalClasses", totals.classes, "0");
    setText("totalSubjects", totals.subjects, "0");
}

function renderDepartments(departments) {
    const tbody = document.querySelector(".table-section table tbody");

    if (!tbody) return;

    // Reuse the existing designed rows. Clone the first row only if needed.
    let rows = Array.from(tbody.querySelectorAll("tr"));
    const templateRow = rows[0];

    if (!templateRow) return;

    while (rows.length < departments.length) {
        const newRow = templateRow.cloneNode(true);
        tbody.appendChild(newRow);
        rows.push(newRow);
    }

    if (!departments.length) {
        rows.forEach((row, index) => {
            row.hidden = index !== 0;

            if (index === 0) {
                const cells = row.querySelectorAll("td");
                if (cells[0]) cells[0].textContent = "No departments found.";
                for (let cellIndex = 1; cellIndex < cells.length; cellIndex += 1) {
                    cells[cellIndex].textContent = "";
                }
            }
        });

        return;
    }

    rows.forEach((row, index) => {
        if (index >= departments.length) {
            row.hidden = true;
            return;
        }

        row.hidden = false;

        const department = departments[index];
        const cells = row.querySelectorAll("td");
        const head = department.headOfDepartment;

        const values = [
            department.name,
            department.teacherCount,
            department.subjectCount,
            head?.name
                ? `${head.name}${head.employeeId ? ` (${head.employeeId})` : ""}`
                : "Not assigned",
        ];

        values.forEach((value, cellIndex) => {
            if (cells[cellIndex]) {
                cells[cellIndex].textContent = value ?? "—";
            }
        });
    });
}

async function loadPrincipalProfile() {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
        window.location.assign("./index.html");
        return;
    }

    // Load branding separately, so a branding error won't block profile data.
    loadSchoolBranding();

    try {
        const response = await fetch(`${API_BASE}/principal/profile`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401) {
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem("principalRefreshToken");
                sessionStorage.removeItem("principalAccount");
                window.location.assign("./index.html");
                return;
            }

            throw new Error(
                result.message || "Could not load principal profile."
            );
        }

        const data = unwrapApiResponse(result);

        if (!data?.principal) {
            throw new Error("Principal profile data was missing.");
        }

        renderPrincipal(data.principal);
        renderTotals(data.totals || {});
        renderDepartments(data.departments || []);

        if (data.school?.name) {
            setText("schoolName", data.school.name, "School");
            setText("schoolNameForNotice", data.school.name, "the school");
            document.title = `Principal Profile | ${data.school.name}`;
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error("Could not load principal profile:", error);
        alert(error.message || "Could not load principal profile.");
    }
}

document.addEventListener("DOMContentLoaded", loadPrincipalProfile);