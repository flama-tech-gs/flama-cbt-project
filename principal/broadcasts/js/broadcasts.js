/*
==========================================
DATA
==========================================
*/

const broadcasts = [];

/*
==========================================
RENDER
==========================================
*/

const container = document.getElementById("broadcastList");

container.innerHTML = broadcasts
  .map(
    (item, index) => `

<div class="broadcast-card">

<div class="broadcast-left">

<div class="broadcast-top">

<h3>${item.title}</h3>

<span class="broadcast-badge badge-${item.badge}">

${item.audience}

</span>

</div>

<p class="broadcast-message">

${item.message}

</p>

<p class="broadcast-delivered">

${item.delivered}

</p>

</div>

<div class="broadcast-date">

${item.date}

<a class="edit-broadcast-btn" href="./new-broadcast?edit=${index}&title=${encodeURIComponent(item.title)}&message=${encodeURIComponent(item.message)}&audience=${encodeURIComponent(item.audience)}">

<i data-lucide="pencil"></i>

Edit

</a>

</div>

</div>

`,
  )
  .join("");

/*
==========================================
NEW BROADCAST
==========================================
*/

document.getElementById("newBroadcastBtn").addEventListener("click", () => {
  window.location.href = "./new-broadcast";

  // alert("Open New Broadcast");
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("principalSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function closeSidebar() {
  sidebar?.classList.remove("show");
  sidebarOverlay?.classList.remove("show");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = sidebar?.classList.toggle("show") ?? false;
  sidebarOverlay?.classList.toggle("show", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
});

sidebarOverlay?.addEventListener("click", closeSidebar);
sidebar?.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", closeSidebar);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSidebar();
});

// Reset the drawer when the viewport grows back to desktop width.
window.matchMedia("(max-width: 1024px)").addEventListener("change", (event) => {
  if (!event.matches) closeSidebar();
});
