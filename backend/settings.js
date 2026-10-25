document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api";
  const ADMINS_URL = `${API_BASE_URL}/admin/users`;

  const tbody = document.getElementById("adminsTableBody");
  const searchInput = document.getElementById("adminSearch");
  const pageInfo = document.getElementById("adminsPaginationInfo");
  const previousButton = document.getElementById("adminsPreviousPage");
  const nextButton = document.getElementById("adminsNextPage");


  const adminRowAvatarStyles = document.createElement("style");

adminRowAvatarStyles.textContent = `
  .admin-users-table .user-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    overflow: hidden;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .admin-users-table .user-avatar img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

document.head.appendChild(adminRowAvatarStyles);


  const state = {
    currentAdmin: null,
    roles: [],
    admins: [],
    page: 1,
    pages: 1,
    limit: 20,
    search: "",
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

  function getInitials(name) {
    return String(name || "Admin")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "A";
  }

  function renderAvatar(element, name, avatarUrl) {
    if (!element) return;

    element.replaceChildren();

    if (!avatarUrl) {
      element.textContent = getInitials(name);
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
      element.textContent = getInitials(name);
    };

    element.appendChild(image);
  }

  function renderProfile(admin = {}) {
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

    renderAvatar(
      document.getElementById("sidebarAdminAvatar"),
      name,
      admin.avatar
    );

    renderAvatar(
      document.getElementById("topbarAdminAvatar"),
      name,
      admin.avatar
    );

    state.currentAdmin = { ...admin, role };
  }

  async function loadCurrentAdmin() {
    // Same endpoint and response shape as the working admin dashboard.
    const data = await apiRequest(`${API_BASE_URL}/admin/dashboard`);

    if (!data?.admin) {
      throw new Error("Dashboard response did not include the admin profile.");
    }

    renderProfile(data.admin);

    const roleName =
      typeof data.admin.role === "string"
        ? data.admin.role
        : data.admin.role?.name;

    return String(roleName || "").toUpperCase() === "SUPER_ADMIN";
  }

  function renderAdmins() {
    if (!tbody) return;

    if (!state.admins.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">No administrators found.</td></tr>';
      return;
    }

    tbody.innerHTML = state.admins.map((admin) => {
      const name = admin.fullName || "Administrator";
      const roleName = admin.role?.name || "No role";
      const status = String(admin.status || "UNKNOWN").toLowerCase();
      const statusClass = status.replace(/[^a-z0-9_-]/g, "");

      const initials = getInitials(name);
      const avatar = admin.avatar
        ? `<img src="${escapeHtml(admin.avatar)}" alt="" class="admin-row-avatar-image">`
        : escapeHtml(initials);

      return `
        <tr data-admin-row="${escapeHtml(admin.id)}">
          <td>
            <div class="user-name">
              <span class="user-avatar">${avatar}</span>
              <strong>${escapeHtml(name)}</strong>
            </div>
          </td>

          <td>${escapeHtml(admin.email)}</td>

          <td>
            <span class="admin-role-label">
              ${escapeHtml(roleName)}
            </span>

            <select
              class="admin-role-editor"
              data-admin-id="${escapeHtml(admin.id)}"
              aria-label="Choose role for ${escapeHtml(name)}"
              hidden
            >
              ${state.roles.map((role) => `
                <option
                  value="${escapeHtml(role.id)}"
                  ${admin.role?.id === role.id ? "selected" : ""}
                >${escapeHtml(role.name)}</option>
              `).join("")}
            </select>
          </td>

          <td>
            <span class="status ${escapeHtml(statusClass)}">
              ${escapeHtml(admin.status || "UNKNOWN")}
            </span>
          </td>

          <td>
            <div class="user-actions">
              <button
                type="button"
                class="edit-btn"
                data-action="edit"
                data-admin-id="${escapeHtml(admin.id)}"
              >Edit</button>

              <button
                type="button"
                class="save-role-btn"
                data-action="save"
                data-admin-id="${escapeHtml(admin.id)}"
                hidden
              >Save</button>

              <button
                type="button"
                class="cancel-role-btn"
                data-action="cancel"
                data-admin-id="${escapeHtml(admin.id)}"
                hidden
              >Cancel</button>

              <button
                type="button"
                class="remove-btn"
                data-action="delete"
                data-admin-id="${escapeHtml(admin.id)}"
                data-admin-name="${escapeHtml(name)}"
              >Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (pageInfo) {
      pageInfo.textContent = `Page ${state.page} of ${state.pages}`;
    }

    if (previousButton) previousButton.disabled = state.page <= 1;
    if (nextButton) nextButton.disabled = state.page >= state.pages;
  }

  function setRowEditing(row, editing) {
    const roleLabel = row.querySelector(".admin-role-label");
    const roleEditor = row.querySelector(".admin-role-editor");
    const editButton = row.querySelector('[data-action="edit"]');
    const saveButton = row.querySelector('[data-action="save"]');
    const cancelButton = row.querySelector('[data-action="cancel"]');

    roleLabel.hidden = editing;
    roleEditor.hidden = !editing;
    editButton.hidden = editing;
    saveButton.hidden = !editing;
    cancelButton.hidden = !editing;
  }

  async function loadAdmins() {
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="5">Loading administrators...</td></tr>';

    const params = new URLSearchParams({
      page: String(state.page),
      limit: String(state.limit),
      search: state.search,
    });

    try {
      const data = await apiRequest(`${ADMINS_URL}?${params}`);

      state.admins = data?.admins || [];
      state.pages = data?.pagination?.pages || 1;

      renderAdmins();
    } catch (error) {
      console.error("Failed to load administrators:", error);
      tbody.innerHTML =
        `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  async function loadRoles() {
    const data = await apiRequest(`${ADMINS_URL}/roles`);
    state.roles = data?.roles || [];
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(state.searchTimer);

      state.searchTimer = setTimeout(() => {
        state.search = searchInput.value.trim();
        state.page = 1;
        loadAdmins();
      }, 300);
    });
  }

  if (previousButton) {
    previousButton.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        loadAdmins();
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (state.page < state.pages) {
        state.page += 1;
        loadAdmins();
      }
    });
  }

  if (tbody) {
    tbody.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const adminId = button.dataset.adminId;
      const row = button.closest("tr");

      if (!row) return;

      if (action === "edit") {
        setRowEditing(row, true);
        return;
      }

      if (action === "cancel") {
        const admin = state.admins.find((item) => item.id === adminId);
        const editor = row.querySelector(".admin-role-editor");

        if (admin && editor) {
          editor.value = admin.role?.id || "";
        }

        setRowEditing(row, false);
        return;
      }

      if (action === "save") {
        const editor = row.querySelector(".admin-role-editor");
        const roleId = editor?.value;

        if (!roleId) {
          window.alert("Choose a role first.");
          return;
        }

        button.disabled = true;

        try {
          await apiRequest(
            `${ADMINS_URL}/${encodeURIComponent(adminId)}/role`,
            {
              method: "PATCH",
              body: JSON.stringify({ roleId }),
            }
          );

          await loadAdmins();
        } catch (error) {
          console.error("Failed to update administrator role:", error);
          window.alert(error.message || "Could not update the admin role.");
          button.disabled = false;
        }

        return;
      }

      if (action === "delete") {
        const name = button.dataset.adminName || "this administrator";

        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) {
          return;
        }

        button.disabled = true;

        try {
          await apiRequest(
            `${ADMINS_URL}/${encodeURIComponent(adminId)}`,
            { method: "DELETE" }
          );

          await loadAdmins();
        } catch (error) {
          console.error("Failed to delete administrator:", error);
          window.alert(error.message || "Could not delete administrator.");
          button.disabled = false;
        }
      }
    });
  }

  async function initialize() {
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="5">Checking administrator access...</td></tr>';
    }

    try {
      const isSuperAdmin = await loadCurrentAdmin();

      if (!isSuperAdmin) {
        if (tbody) {
          tbody.innerHTML =
            '<tr><td colspan="5">Only Super Admins can manage administrator roles.</td></tr>';
        }

        return;
      }

      await loadRoles();
      await loadAdmins();
    } catch (error) {
      console.error("Admin management initialization failed:", error);

      if (tbody) {
        tbody.innerHTML =
          `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
      }
    }
  }

  initialize();
});