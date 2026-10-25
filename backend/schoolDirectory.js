//backend/schoolDirectory


document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api";
  const ADMIN_PROFILE_URL = `${API_BASE_URL}/admin/auth/me`;
  const PAGE_SIZE = 8;

  const elements = {
    search: document.getElementById("schoolSearch"),
    table: document.getElementById("schoolsTableBody"),
    resultCount: document.getElementById("schoolsResultCount"),
    registeredSchoolsText: document.getElementById("registeredSchoolsText"),
    previous: document.getElementById("previousPage"),
    next: document.getElementById("nextPage"),
    export: document.getElementById("exportSchoolsBtn"),
    filters: [...document.querySelectorAll(".school-filter")],

    sidebarAdminName: document.getElementById("sidebarAdminName"),
    sidebarAdminAvatar: document.getElementById("sidebarAdminAvatar"),
    topbarAdminName: document.getElementById("topbarAdminName"),
    topbarAdminRole: document.getElementById("topbarAdminRole"),
    topbarAdminAvatar: document.getElementById("topbarAdminAvatar"),
  };



  const profileAvatarStyles = document.createElement("style")
	profileAvatarStyles.textContent = `
	  #sidebarAdminAvatar,
	  #topbarAdminAvatar {
	    width: 30px;
	    height: 30px;
	    min-width: 30px;
	    min-height: 30px;
	    border-radius: 50%;
	    overflow: hidden;
	    display: flex;
	    align-items: center;
	    justify-content: center;
	  }

	  #sidebarAdminAvatar img,
	  #topbarAdminAvatar img {
	    display: block;
	    width: 100%;
	    height: 100%;
	    border-radius: 50%;
	    object-fit: cover;
	  }
	`;

	document.head.appendChild(profileAvatarStyles);

  const required = [
    "search",
    "table",
    "resultCount",
    "previous",
    "next",
    "export",
  ];

  const missing = required.filter((key) => !elements[key]);

  if (missing.length) {
    console.error("Missing school directory HTML elements:", missing);
    return;
  }

  const state = {
    search: "",
    status: "all",
    page: 1,
    totalPages: 0,
    requestId: 0,
    controller: null,
  };

  let searchTimer;

  function getToken() {
    return (
      sessionStorage.getItem("flamaAccessToken") ||
      sessionStorage.getItem("adminAccessToken") ||
      localStorage.getItem("adminAccessToken") ||
      localStorage.getItem("accessToken")
    );
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function statusInfo(value) {
    const status = String(value || "").toUpperCase();

    const map = {
      ACTIVE: { label: "Active", css: "active" },
      PENDING: { label: "Trial", css: "trial" },
      SUSPENDED: { label: "Suspended", css: "suspended" },
      REJECTED: { label: "Rejected", css: "rejected" },
    };

    return map[status] || {
      label: status || "Unknown",
      css: "unknown",
    };
  }

  function showMessage(message) {
    elements.table.innerHTML = `
      <tr>
        <td colspan="7" class="schools-empty-state">
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  function updateCounts(counts = {}) {
    const labels = {
      all: "All",
      active: "Active",
      trial: "Trial",
      suspended: "Suspended",
      rejected: "Rejected",
    };

    elements.filters.forEach((button) => {
      const filter = button.dataset.filter;
      if (!filter) return;

      const count = filter === "trial"
        ? (counts.trial ?? counts.pending ?? 0)
        : (counts[filter] ?? 0);

      button.textContent = `${labels[filter] || filter} (${count})`;

      const selected = filter === state.status;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function updateRegisteredSchoolTotal(counts = {}, pagination = {}) {
    if (!elements.registeredSchoolsText) return;

    const total = Number(counts.all ?? pagination.total ?? 0);
    const label = total === 1 ? "school" : "schools";

    elements.registeredSchoolsText.textContent =
      `${total} registered ${label} across the CBT School platform.`;
  }

  function renderSchools(schools) {
    if (!Array.isArray(schools) || schools.length === 0) {
      showMessage("No schools found.");
      return;
    }

    elements.table.innerHTML = schools.map((school) => {
      const name = school.name || "Unnamed school";
      const subdomain = school.subdomain || "—";
      const status = statusInfo(school.status);
      const initial = name.trim().charAt(0).toUpperCase() || "S";
      const id = encodeURIComponent(school._id || "");

      const plan = school.planName || school.plan || "—";
      const students = school.studentCount ?? "—";
      const teachers = school.teacherCount ?? "—";

      return `
        <tr data-status="${escapeHtml(status.css)}">
          <td>
            <div class="school-name-cell">
              <span class="school-avatar">${escapeHtml(initial)}</span>
              <div>
                <strong>${escapeHtml(name)}</strong>
                <span>${escapeHtml(subdomain)}</span>
              </div>
            </div>
          </td>

          <td>${escapeHtml(plan)}</td>
          <td>${escapeHtml(students)}</td>
          <td>${escapeHtml(teachers)}</td>

          <td>
            <span class="school-status ${escapeHtml(status.css)}">
              ${escapeHtml(status.label)}
            </span>
          </td>

          <td>${escapeHtml(formatDate(school.createdAt))}</td>

          <td>
            <div class="school-actions">
              <a
                href="./school-details.html?id=${id}"
                class="school-view-btn"
              >View</a>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function updatePagination(pagination = {}) {
    const page = Number(pagination.page || 1);
    const limit = Number(pagination.limit || PAGE_SIZE);
    const total = Number(pagination.total || 0);
    const start = total ? ((page - 1) * limit) + 1 : 0;
    const end = Math.min(page * limit, total);

    elements.resultCount.textContent =
      `Showing ${start}–${end} of ${total} schools`;

    elements.previous.disabled = !pagination.hasPreviousPage;
    elements.next.disabled = !pagination.hasNextPage;

    state.totalPages = Number(pagination.totalPages || 0);
  }

  async function request(url, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Log in again and confirm your login code saves the access token."
      );
    }

    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  function getInitials(name) {
    return (
      String(name || "Admin")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase() || "A"
    );
  }

  function setAvatar(element, name, pictureUrl) {
    if (!element) return;

    const initials = getInitials(name);
    element.replaceChildren();

    if (!pictureUrl) {
      element.textContent = initials;
      return;
    }

    const image = document.createElement("img");
    image.src = pictureUrl;
    image.alt = `${name} profile picture`;
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";

    image.onerror = () => {
      element.replaceChildren();
      element.textContent = initials;
    };

    element.appendChild(image);
  }

  async function loadAdminProfile() {
	  const token = getToken();

	  if (!token) {
	    console.error("No admin access token found. Please log in again.");
	    return;
	  }

	  try {
	    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
	      method: "GET",
	      headers: {
	        Authorization: `Bearer ${token}`,
	        Accept: "application/json",
	      },
	    });

	    const result = await response.json();

	    if (!response.ok || result.success === false) {
	      throw new Error(
	        typeof result.message === "string"
	          ? result.message
	          : "Unable to load the admin profile."
	      );
	    }

	    const admin = result.data?.admin;

	    if (!admin) {
	      throw new Error(
	        "The dashboard response does not contain data.admin."
	      );
	    }

	    const name =
	      admin.fullName ||
	      [admin.firstName, admin.lastName].filter(Boolean).join(" ") ||
	      "Administrator";

	    const role =
	      typeof admin.role === "string"
	        ? admin.role
	        : admin.role?.name || "ADMIN";

	    const pictureUrl =
	      typeof admin.avatar === "string"
	        ? admin.avatar.trim()
	        : "";

	    if (elements.sidebarAdminName) {
	      elements.sidebarAdminName.textContent = name;
	    }

	    if (elements.topbarAdminName) {
	      elements.topbarAdminName.textContent = name;
	    }

	    if (elements.topbarAdminRole) {
	      elements.topbarAdminRole.textContent = role;
	    }

	    setAvatar(elements.sidebarAdminAvatar, name, pictureUrl);
	    setAvatar(elements.topbarAdminAvatar, name, pictureUrl);
	  } catch (error) {
	    console.error("Failed to load admin profile:", error.message);
	  }
	}

  async function loadSchools() {
    const requestId = ++state.requestId;

    if (state.controller) {
      state.controller.abort();
    }

    state.controller = new AbortController();
    showMessage("Loading schools...");

    const params = new URLSearchParams({
      search: state.search,
      status: state.status,
      page: String(state.page),
      limit: String(PAGE_SIZE),
    });

    try {
      const response = await request(
        `${API_BASE_URL}/admin/schools?${params}`,
        { signal: state.controller.signal }
      );

      const result = await response.json().catch(() => ({}));

      if (requestId !== state.requestId) return;

      if (!response.ok) {
        throw new Error(
          result.message || `Request failed (${response.status})`
        );
      }

      const data = result.data;

      if (!data || !Array.isArray(data.schools)) {
        throw new Error("Unexpected API response. Expected data.schools.");
      }

      renderSchools(data.schools);
      updateCounts(data.counts);
      updatePagination(data.pagination);
      updateRegisteredSchoolTotal(data.counts, data.pagination);
    } catch (error) {
      if (error.name === "AbortError") return;
      if (requestId !== state.requestId) return;

      console.error("Failed to load schools:", error);
      showMessage(error.message || "Unable to load schools.");
      elements.resultCount.textContent = "Could not load schools";
      elements.previous.disabled = true;
      elements.next.disabled = true;

      if (elements.registeredSchoolsText) {
        elements.registeredSchoolsText.textContent =
          "Could not load registered schools.";
      }
    }
  }

  elements.search.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      state.search = elements.search.value.trim();
      state.page = 1;
      loadSchools();
    }, 300);
  });

  elements.filters.forEach((button) => {
    button.addEventListener("click", () => {
      const status = button.dataset.filter;
      if (!status || status === state.status) return;

      state.status = status;
      state.page = 1;
      loadSchools();
    });
  });

  elements.previous.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      loadSchools();
    }
  });

  elements.next.addEventListener("click", () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      loadSchools();
    }
  });

  elements.export.addEventListener("click", async () => {
    const originalText = elements.export.textContent;

    try {
      elements.export.disabled = true;
      elements.export.textContent = "Exporting...";

      const params = new URLSearchParams({
        search: state.search,
        status: state.status,
      });

      const response = await request(
        `${API_BASE_URL}/admin/schools/export?${params}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Export failed (${response.status})`
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `flama-schools-${state.status}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error("School export failed:", error);
      window.alert(error.message || "Could not export schools.");
    } finally {
      elements.export.disabled = false;
      elements.export.textContent = originalText;
    }
  });

  window.loadSchoolDirectory = loadSchools;

  loadSchools();
  loadAdminProfile();
});