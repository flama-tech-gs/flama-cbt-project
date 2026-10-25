//backend/adminProfile.js

document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE_URL = "http://localhost:5000/api";

  function getStoredValue(key) {
    return (
      sessionStorage.getItem(key) ||
      localStorage.getItem(key)
    );
  }

  function getToken() {
    return (
      getStoredValue("adminAccessToken") ||
      getStoredValue("flamaAccessToken") ||
      getStoredValue("accessToken")
    );
  }

  function getStoredAdmin() {
    const raw = getStoredValue("adminUser");

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function getRoleName(role) {
    if (!role) return "Admin";

    if (typeof role === "string") return role;

    return (
      role.name ||
      role.title ||
      role.roleName ||
      "Admin"
    );
  }

  function renderAdmin(admin) {
    if (!admin) return;

    const fullName =
      admin.fullName ||
      [admin.firstName, admin.lastName]
        .filter(Boolean)
        .join(" ") ||
      admin.name ||
      admin.email ||
      "Admin";

    const roleName = getRoleName(admin.role);
    const avatarUrl = admin.avatar || admin.profilePicture || "";
    const initials = fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "A";

    // Sidebar profile
    const sidebarName = document.querySelector(
      ".sidebar-admin .admin-account strong"
    );

    const sidebarAvatar = document.querySelector(
      ".sidebar-admin .admin-avatar"
    );

    if (sidebarName) {
      sidebarName.textContent = fullName;
    }

    // Topbar profile
    const topbarName = document.querySelector(
      ".topbar-admin-info strong"
    );

    const topbarRole = document.querySelector(
      ".topbar-admin-info span"
    );

    const topbarAvatar = document.querySelector(
      ".topbar-avatar"
    );

    if (topbarName) {
      topbarName.textContent = fullName;
    }

    if (topbarRole) {
      topbarRole.textContent = roleName;
    }

    function renderAvatar(element) {
      if (!element) return;

      if (avatarUrl) {
        const image = document.createElement("img");

        image.src = avatarUrl;
        image.alt = `${fullName} profile picture`;
        image.className = "admin-profile-image";

        image.onerror = () => {
          element.textContent = initials;
        };

        element.replaceChildren(image);
      } else {
        element.textContent = initials;
      }
    }

    renderAvatar(sidebarAvatar);
    renderAvatar(topbarAvatar);
  }

  // Display saved admin details immediately if available.
  renderAdmin(getStoredAdmin());

  const token = getToken();

  if (!token) {
    console.error(
      "Admin profile: access token not found. Check the admin login session."
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

    if (!response.ok) {
      throw new Error(
        result.message || "Could not load admin profile."
      );
    }

    const admin = result.data?.admin;

    if (!admin) {
      throw new Error(
        "The dashboard response does not contain data.admin."
      );
    }

    renderAdmin(admin);

    // Keep the profile available to other dashboard pages.
    const storage = sessionStorage.getItem("adminAccessToken")
      ? sessionStorage
      : localStorage;

    storage.setItem("adminUser", JSON.stringify(admin));
  } catch (error) {
    console.error("Admin profile loading failed:", error);
  }
});
