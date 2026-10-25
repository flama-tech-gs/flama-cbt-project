//backend/adminDashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api";

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  const getAccessToken = () =>
    sessionStorage.getItem("flamaAccessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    localStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken");

  // ==========================================
  // SECURITY HELPERS
  // ==========================================
  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  // ==========================================
  // DATE FORMATTING
  // ==========================================
  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const timeAgo = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    const minutes = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 60000)
    );

    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
  };

  // ==========================================
  // DOM HELPERS
  // ==========================================
  const setText = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value ?? "—";
    }
  };

  // ==========================================
  // CURRENCY FORMATTING
  //
  // The backend statistic is assumed to be
  // stored/aggregated in Paystack kobo.
  //
  // Example:
  // 15000000 kobo = ₦150,000
  // ==========================================
  const formatNairaFromKobo = (amountInKobo) => {
    const amount = Number(amountInKobo);

    if (!Number.isFinite(amount)) {
      return "₦0";
    }

    const amountInNaira = amount / 100;

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountInNaira);
  };

  // ==========================================
  // STATUS HELPERS
  // ==========================================
  const statusClass = (status = "") => {
    const normalized = String(status).toLowerCase();

    if (
      normalized === "active" ||
      normalized === "approved"
    ) {
      return "active";
    }

    if (
      normalized === "suspended" ||
      normalized === "rejected"
    ) {
      return "suspended";
    }

    if (
      normalized === "pending" ||
      normalized === "trial"
    ) {
      return "trial";
    }

    return "";
  };

  // ==========================================
  // ADMIN PROFILE AND AVATAR
  // ==========================================
  const renderAdmin = (admin = {}) => {
    const name =
      admin.fullName ||
      [admin.firstName, admin.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Administrator";

    setText("sidebarAdminName", name);
    setText("topbarAdminName", name);
    setText("topbarAdminRole", admin.role || "ADMIN");

    const hour = new Date().getHours();

    const greeting =
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";

    setText("dashboardGreeting", `${greeting}, ${name} 👋`);

    const initials = name
      .split(/\s+/)
      .map((part) => part[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    document
      .querySelectorAll(".admin-avatar, .topbar-avatar")
      .forEach((element) => {
        // Clear the previous image or initials.
        element.replaceChildren();

        const avatarUrl =
          typeof admin.avatar === "string"
            ? admin.avatar.trim()
            : "";

        if (
          avatarUrl &&
          /^https:\/\/res\.cloudinary\.com\//i.test(avatarUrl)
        ) {
          const image = document.createElement("img");

          // Cloudinary URL is used only as an image source.
          // It is not displayed as text or made into a link.
          image.src = avatarUrl;
          image.alt = `${name} profile picture`;
          image.loading = "eager";
          image.decoding = "async";
          image.referrerPolicy = "no-referrer";

          Object.assign(image.style, {
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          });

          image.addEventListener("error", () => {
            // Fall back to initials if the image cannot load.
            element.replaceChildren();
            element.textContent = initials;
          }, { once: true });

          element.appendChild(image);
        } else {
          element.textContent = initials;
        }
      });
  };

  // ==========================================
  // RENDER RECENT SCHOOLS
  // ==========================================
  const renderSchools = (schools = []) => {
    const tbody = document.getElementById("recentSchoolsTable");

    if (!tbody) return;

    if (!Array.isArray(schools) || schools.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">No schools registered yet.</td></tr>';
      return;
    }

    tbody.innerHTML = schools.map((school) => {
      const name = school.name || "Unnamed School";
      const initial = escapeHTML(name.charAt(0).toUpperCase());
      const status = school.status || "PENDING";

      const schoolId = encodeURIComponent(
        school.id || school._id || ""
      );

      return `
        <tr>
          <td>
            <div class="school-cell">
              <div class="school-avatar">${initial}</div>
              <div>
                <strong>${escapeHTML(name)}</strong>
                <span>${escapeHTML(school.subdomain || "—")}</span>
              </div>
            </div>
          </td>

          <td>${escapeHTML(school.plan || "No plan")}</td>

          <td>${escapeHTML(school.studentCount ?? "—")}</td>

          <td>
            <span class="status-badge ${statusClass(status)}">
              ${escapeHTML(status)}
            </span>
          </td>

          <td>${formatDate(school.joinedAt || school.createdAt)}</td>

          <td>
            <div class="table-actions">
              <a
                href="./school-details.html?id=${schoolId}"
                class="action-view"
              >
                View
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  };

  // ==========================================
  // RENDER SUPPORT TICKETS
  // ==========================================
  const renderTickets = (tickets = []) => {
    const tbody = document.getElementById("supportTicketsTable");

    if (!tbody) return;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7">No support tickets submitted yet.</td></tr>';
      return;
    }

    tbody.innerHTML = tickets.map((ticket) => {
      const priority = String(
        ticket.priority || "MEDIUM"
      ).toLowerCase();

      const status = String(
        ticket.status || "OPEN"
      ).toUpperCase();

      const statusLabel = {
        OPEN: "Open",
        IN_PROGRESS: "In Progress",
        SOLVED: "Solved",
        RESOLVED: "Resolved",
        CLOSED: "Closed",
      }[status] || status;

      const statusClassName = {
        OPEN: "open",
        IN_PROGRESS: "progress",
        SOLVED: "resolved",
        RESOLVED: "resolved",
        CLOSED: "resolved",
      }[status] || "open";

      const ticketId = encodeURIComponent(
        ticket.id || ticket._id || ""
      );

      return `
        <tr>
          <td>
            <strong>${escapeHTML(ticket.ticketNumber || ticketId)}</strong>
          </td>

          <td>${escapeHTML(ticket.schoolName || "—")}</td>

          <td>${escapeHTML(ticket.subject || "—")}</td>

          <td>
            <span class="priority-badge ${escapeHTML(priority)}">
              ${escapeHTML(priority.toUpperCase())}
            </span>
          </td>

          <td>
            <span class="ticket-status ${statusClassName}">
              ${escapeHTML(statusLabel)}
            </span>
          </td>

          <td>${timeAgo(ticket.updatedAt || ticket.createdAt)}</td>

          <td>
            <a
              href="./ticket-details.html?id=${ticketId}"
              class="ticket-action"
            >
              Open →
            </a>
          </td>
        </tr>
      `;
    }).join("");
  };

  // ==========================================
  // LOAD ADMIN DASHBOARD
  // ==========================================
  async function loadDashboard() {
    const token = getAccessToken();

    if (!token) {
      console.error(
        "No admin access token found. Please log in again."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        console.error(
          "Admin authentication failed:",
          typeof result.message === "string"
            ? result.message
            : "Your session is invalid or expired."
        );

        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : "Unable to load the admin dashboard."
        );
      }

      const data = result.data;

      if (!data || typeof data !== "object") {
        throw new Error(
          "The dashboard API did not return a valid data object."
        );
      }

      const {
        admin,
        statistics,
        recentSchools,
        recentTickets,
      } = data;

      // Render admin profile.
      if (admin) {
        renderAdmin(admin);
      }

      // Render dashboard statistics.
      if (statistics) {
        setText(
          "totalSchoolsValue",
          Number(statistics.totalSchools) || 0
        );

        setText(
          "activeSubscriptionsValue",
          Number(statistics.activeSubscriptions) || 0
        );

        // Convert Paystack kobo to Naira for display.
        setText(
          "monthlyRevenueValue",
          formatNairaFromKobo(statistics.monthlyRevenue)
        );

        setText(
          "openTicketsValue",
          Number(statistics.openTickets) || 0
        );
      }

      // Render recent activity.
      renderSchools(recentSchools || []);
      renderTickets(recentTickets || []);

    } catch (error) {
      console.error(
        "Dashboard loading failed:",
        error.message
      );
    }
  }

  // ==========================================
  // INITIALIZE
  // ==========================================
  loadDashboard();

  // Allow a refresh button or another script to reload data.
  window.loadAdminDashboard = loadDashboard;
});