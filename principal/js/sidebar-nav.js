// ==========================================
// SIDEBAR NAVIGATION (TABLET & MOBILE DRAWER)
// Used by pages without their own sidebar toggle.
// Reuses the page's .menu-toggle, or adds one to the page header.
// ==========================================

(function () {
  const DRAWER_QUERY = "(max-width: 1024px)";

  const MENU_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="4" x2="20" y1="6" y2="6" />' +
    '<line x1="4" x2="20" y1="12" y2="12" />' +
    '<line x1="4" x2="20" y1="18" y2="18" />' +
    "</svg>";

  function createToggle() {
    const header = document.querySelector(
      ".main-content .topbar, .main-content .page-header, .main-content .profile-topbar",
    );

    if (!header) return null;

    const button = document.createElement("button");
    button.className = "menu-toggle";
    button.innerHTML = MENU_ICON;

    // Headers without .topbar-left get one wrapped around their title block,
    // so the button sits beside the title exactly like the other dashboard pages.
    let left = header.querySelector(".topbar-left");

    if (!left) {
      const title = header.firstElementChild;
      left = document.createElement("div");
      left.className = "topbar-left";
      header.insertBefore(left, title);
      if (title) left.appendChild(title);
    }

    left.insertBefore(button, left.firstChild);

    return button;
  }

  function init() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar) return;

    const toggle =
      document.querySelector(".main-content .menu-toggle") || createToggle();

    if (!toggle) return;

    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");

    function openSidebar() {
      sidebar.classList.add("show");
      overlay?.classList.add("show");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation");
      sidebar.querySelector("a, button")?.focus({ preventScroll: true });
    }

    function closeSidebar({ returnFocus = false } = {}) {
      if (!sidebar.classList.contains("show")) return;

      sidebar.classList.remove("show");
      overlay?.classList.remove("show");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      if (returnFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener("click", () => {
      if (sidebar.classList.contains("show")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay?.addEventListener("click", () => closeSidebar());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSidebar({ returnFocus: true });
    });

    sidebar.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => closeSidebar());
    });

    // Reset the drawer when the viewport grows back to desktop width.
    window.matchMedia(DRAWER_QUERY).addEventListener("change", (event) => {
      if (!event.matches) closeSidebar();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
