document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".account-dropdown");
  const menu = document.querySelector(".account-menu");
  const logoutButton = document.querySelector(".account-menu__logout");

  if (!dropdown || !menu) return;

  const closeMenu = () => {
    dropdown.classList.remove("active");
    menu.classList.remove("show");
    dropdown.setAttribute("aria-expanded", "false");
  };

  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menu.classList.toggle("show");
    dropdown.classList.toggle("active", isOpen);
    dropdown.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target) && !menu.contains(event.target)) {
      closeMenu();
    }
  });

  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("schoolRegistration");
    sessionStorage.clear();
    window.location.href = "../auth/login.html";
  });
});
