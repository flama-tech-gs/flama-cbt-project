//backend/supportTickets.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api";
  const TICKETS_URL = `${API_BASE_URL}/support/tickets/admin`;
  const PAGE_SIZE = 20;

  const tableBody = document.getElementById("supportTicketsTableBody");
  const searchInput = document.getElementById("supportSchoolSearch");
  const filterButtons = [
    ...document.querySelectorAll("[data-ticket-filter]"),
  ];

  const state = {
    filter: "all",
    search: "",
    page: 1,
    pages: 1,
    searchTimer: null,
  };

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

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }

  async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Admin token not found. Please log in again.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
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

  async function loadAdminProfile() {
    // Uses the same working profile source as adminDashboard.js.
    const data = await apiRequest(`${API_BASE_URL}/admin/dashboard`);

    if (data?.admin) {
      renderAdmin(data.admin);
    }
  }

  async function loadSummary() {
    const data = await apiRequest(`${TICKETS_URL}/summary`);
    const summary = data || {};

    setText("openTicketsCount", summary.totalTickets || 0);
    setText("inProgressCount", summary.inProgressTickets || 0);
    setText("resolvedTodayCount", summary.resolvedToday || 0);
  }

  function getFilterParams() {
    if (state.filter === "high") return { priority: "HIGH" };
    if (state.filter === "open") return { status: "OPEN" };
    if (state.filter === "resolved") return { status: "SOLVED" };
    return {};
  }

  function renderTickets(tickets = []) {
    if (!tableBody) return;

    if (!tickets.length) {
      tableBody.innerHTML =
        '<tr><td colspan="7">No support tickets found.</td></tr>';
      return;
    }

    tableBody.innerHTML = tickets.map((ticket) => {
      const priority = String(ticket.priority || "MEDIUM").toUpperCase();
      const status = String(ticket.status || "OPEN").toUpperCase();

      return `
        <tr>
          <td>${escapeHtml(ticket.ticketNumber || "—")}</td>
          <td>${escapeHtml(ticket.schoolName || "—")}</td>
          <td>
            <strong>${escapeHtml(ticket.subject || "—")}</strong>
            <div>${escapeHtml(ticket.ownerName || ticket.ownerEmail || "")}</div>
          </td>
          <td>
            <span class="priority-badge ${escapeHtml(priority.toLowerCase())}">
              ${escapeHtml(priority)}
            </span>
          </td>
          <td>
            <span class="ticket-status ${escapeHtml(status.toLowerCase())}">
              ${escapeHtml(status.replaceAll("_", " "))}
            </span>
          </td>
          <td>${escapeHtml(formatDate(ticket.createdAt))}</td>
          <td>
            <select
              class="ticket-status-select"
              data-ticket-id="${escapeHtml(ticket._id)}"
              aria-label="Update ticket status"
            >
              <option value="OPEN" ${status === "OPEN" ? "selected" : ""}>Open</option>
              <option value="IN_PROGRESS" ${status === "IN_PROGRESS" ? "selected" : ""}>In progress</option>
              <option value="SOLVED" ${status === "SOLVED" ? "selected" : ""}>Resolved</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadTickets() {
    if (!tableBody) return;

    tableBody.innerHTML =
      '<tr><td colspan="7">Loading tickets...</td></tr>';

    const params = new URLSearchParams({
      page: String(state.page),
      limit: String(PAGE_SIZE),
      search: state.search,
      ...getFilterParams(),
    });

    try {
      const data = await apiRequest(`${TICKETS_URL}?${params}`);
      const result = data || {};

      state.pages = result.pagination?.pages || 1;
      renderTickets(result.tickets || []);
    } catch (error) {
      console.error("Failed to load support tickets:", error);
      tableBody.innerHTML =
        `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.ticketFilter || "all";
      state.page = 1;

      filterButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      loadTickets();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(state.searchTimer);

      state.searchTimer = setTimeout(() => {
        state.search = searchInput.value.trim();
        state.page = 1;
        loadTickets();
      }, 300);
    });
  }

  if (tableBody) {
    tableBody.addEventListener("change", async (event) => {
      const select = event.target.closest(".ticket-status-select");
      if (!select) return;

      const ticketId = select.dataset.ticketId;
      const newStatus = select.value;

      select.disabled = true;

      try {
        await apiRequest(
          `${TICKETS_URL}/${encodeURIComponent(ticketId)}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          }
        );

        await Promise.all([loadTickets(), loadSummary()]);
      } catch (error) {
        console.error("Failed to update ticket status:", error);
        window.alert(error.message || "Could not update ticket status.");
        await loadTickets();
      } finally {
        select.disabled = false;
      }
    });
  }

  loadAdminProfile().catch((error) => {
    console.error("Failed to load admin profile:", error);
  });

  loadSummary().catch((error) => {
    console.error("Failed to load support ticket summary:", error);
  });

  loadTickets();
});