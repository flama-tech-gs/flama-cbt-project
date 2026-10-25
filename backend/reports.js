//backend/reports.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api";

  const getToken = () =>
    sessionStorage.getItem("flamaAccessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    localStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken");

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "—";
  }

  async function apiRequest(url) {
    const token = getToken();

    if (!token) {
      throw new Error("Admin token not found. Please log in again.");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(
        typeof result.message === "string"
          ? result.message
          : `Request failed (${response.status})`
      );
    }

    return result.data;
  }

  function initials(name) {
    return String(name || "Administrator")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "A";
  }

  function renderAdmin(admin = {}) {
    const name =
      admin.fullName ||
      [admin.firstName, admin.lastName].filter(Boolean).join(" ") ||
      "Administrator";

    const role =
      typeof admin.role === "string"
        ? admin.role
        : admin.role?.name || "ADMIN";

    setText("sidebarAdminName", name);
    setText("topbarAdminName", name);
    setText("topbarAdminRole", role);

    const avatarUrl =
      typeof admin.avatar === "string" ? admin.avatar.trim() : "";

    document
      .querySelectorAll("#sidebarAdminAvatar, #topbarAdminAvatar")
      .forEach((element) => {
        element.replaceChildren();

        if (!avatarUrl) {
          element.textContent = initials(name);
          return;
        }

        const image = document.createElement("img");
        image.src = avatarUrl;
        image.alt = `${name} profile picture`;
        image.referrerPolicy = "no-referrer";

        Object.assign(image.style, {
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        });

        image.onerror = () => {
          element.replaceChildren();
          element.textContent = initials(name);
        };

        element.appendChild(image);
      });
  }

  function renderMetrics(metrics = {}) {
    setText("newSchoolsThisTerm", metrics.newSchoolsThisTerm ?? 0);

    const growth = metrics.studentGrowthPercent;
    setText(
      "studentGrowthValue",
      growth === null || growth === undefined
        ? "—"
        : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`
    );

    setText(
      "studentGrowthDescription",
      `${Number(metrics.totalStudents || 0).toLocaleString()} active students · ` +
        `${Number(metrics.currentTermAdmissions || 0).toLocaleString()} registered this term`
    );

    setText(
      "examsConductedValue",
      Number(metrics.examsConducted || 0).toLocaleString()
    );

    setText(
      "averagePassRateValue",
      metrics.averagePassRate === null ||
        metrics.averagePassRate === undefined
        ? "—"
        : `${Number(metrics.averagePassRate).toFixed(1)}%`
    );
  }

  function renderTopSchools(schools = []) {
    const tbody = document.getElementById("topPerformingSchoolsBody");
    if (!tbody) return;

    if (!schools.length) {
      tbody.innerHTML =
        '<tr><td colspan="4">No completed exam results for the current terms yet.</td></tr>';
      return;
    }

    tbody.innerHTML = schools.map((school) => `
      <tr>
        <td>
          <div class="school-ranking">
            <span class="rank-badge">${escapeHtml(school.rank)}</span>
            <strong>${escapeHtml(school.schoolName)}</strong>
          </div>
        </td>
        <td>${Number(school.examsConducted || 0).toLocaleString()}</td>
        <td>
          <strong class="pass-rate">
            ${Number(school.passRate || 0).toFixed(1)}%
          </strong>
        </td>
        <td>${Number(school.averageScore || 0).toFixed(1)}%</td>
      </tr>
    `).join("");
  }

  async function loadReports() {
    try {
      const [dashboardData, reportData] = await Promise.all([
        apiRequest(`${API_BASE_URL}/admin/dashboard`),
        apiRequest(`${API_BASE_URL}/admin/reports`),
      ]);

      if (dashboardData?.admin) {
        renderAdmin(dashboardData.admin);
      }

      renderMetrics(reportData?.metrics || {});
      renderTopSchools(reportData?.topPerformingSchools || []);
    } catch (error) {
      console.error("Reports loading failed:", error);

      const tbody = document.getElementById("topPerformingSchoolsBody");
      if (tbody) {
        tbody.innerHTML =
          `<tr><td colspan="4">${escapeHtml(error.message)}</td></tr>`;
      }
    }
  }

  loadReports();
});