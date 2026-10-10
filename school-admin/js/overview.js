/*=========================================
  OVERVIEW DASHBOARD
=========================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeIcons();
  initializeCopyButtons();
  initializePortalLinks();
  initializeQuickActions();
  initializeDropdown();
  initializeButtons();
});

/*=========================================
  LUCIDE ICONS
=========================================*/

function initializeIcons() {
  if (window.lucide) lucide.createIcons();
}

/*=========================================
  COPY BUTTONS
=========================================*/

function initializeCopyButtons() {
  const buttons = document.querySelectorAll(".copy-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const value =
        button.dataset.copy || button.parentElement?.textContent.trim();

      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);

        const original = button.innerHTML;

        button.innerHTML = '<i data-lucide="check"></i> Copied';
        lucide.createIcons();

        setTimeout(() => {
          button.innerHTML = original;
          lucide.createIcons();
        }, 1800);
      } catch (error) {
        console.error("Copy failed:", error);
      }
    });
  });
}

/*=========================================
  OPEN PORTAL LINKS
=========================================*/

function initializePortalLinks() {
  const links = document.querySelectorAll(".portal-link__url a");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const url = link.parentElement.querySelector("span").textContent.trim();

      window.open(url, "_blank");
    });
  });
}

/*=========================================
  ACCOUNT DROPDOWN
=========================================*/

function initializeDropdown() {
  const dropdown = document.querySelector(".account-dropdown");
  const menu = document.querySelector(".account-menu");
  const logoutButton = document.querySelector(".account-menu__logout");

  if (!dropdown || !menu) return;

  dropdown.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("show");

    dropdown.classList.toggle("active", isOpen);
    dropdown.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (dropdown.contains(event.target) || menu.contains(event.target)) return;

    menu.classList.remove("show");
    dropdown.classList.remove("active");
    dropdown.setAttribute("aria-expanded", "false");
  });

  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem("schoolRegistration");
    sessionStorage.clear();
    window.location.href = "../auth/login.html";
  });
}

/*=========================================
  QUICK ACTIONS
=========================================*/

function initializeQuickActions() {
  const actions = document.querySelectorAll(".quick-card");

  actions.forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.querySelector("h3").textContent.trim();

      switch (action) {
        case "Change Password":
          console.log("Navigate to Change Password");
          break;

        case "Change School URL":
          console.log("Navigate to School URL");
          break;

        case "Update School Logo":
          console.log("Open Logo Upload");
          break;

        case "Principal Account":
          console.log("Navigate to Principal");
          break;

        case "Change Subscription":
          console.log("Navigate to Subscription");
          break;
      }
    });
  });
}

/*=========================================
  BUTTON EVENTS
=========================================*/

function initializeButtons() {
  const buttons = document.querySelectorAll(".btn");

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      /*
            =======================================

            Placeholder for backend integration.

            Examples:

            Open Modal
            Submit Form
            Redirect
            AJAX Request

            =======================================

            */
    });
  });
}

/*=========================================
  HELPER FUNCTIONS
=========================================*/

function showNotification(message) {
  /*
    Future reusable toast component.

    Example:

    Toast.success(message);

    */

  console.log(message);
}

// Event listener for the "Edit Details" button

const aboutBtn = document.getElementById("aboutBtn");

aboutBtn.addEventListener("click", () => {
  window.location.href = "./edit-school-details.html";
});
