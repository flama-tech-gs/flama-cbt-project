document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const sidebar = document.querySelector(".platform-sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (!toggle || !sidebar || !overlay) return;

  const closeMenu = () => {
    document.body.classList.remove("platform-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  };

  toggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("platform-menu-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );
  });

  overlay.addEventListener("click", closeMenu);

  sidebar.querySelectorAll(".platform-nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  // Reset the drawer when the viewport grows past the mobile breakpoint.
  window.matchMedia("(max-width: 480px)").addEventListener("change", (event) => {
    if (!event.matches) closeMenu();
  });
});
