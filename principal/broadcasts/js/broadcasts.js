/*
==========================================
DATA
==========================================
*/

const broadcasts = [
  {
    title: "Mid-Term Break Resumption",
    audience: "Everyone",
    badge: "green",
    message:
      "School resumes on Monday, June 29th, 2026 after the mid-term break. All students should report by 7:30 AM in full uniform.",
    delivered: "Delivered to 1,247 students and 58 teachers",
    date: "Today, 9:00 AM",
  },

  {
    title: "Staff Meeting – Friday",
    audience: "All Teachers",
    badge: "green",
    message:
      "There will be a mandatory staff meeting this Friday at 3:00 PM in the staff room to discuss 2nd term exam scheduling.",
    delivered: "Delivered to 58 teachers",
    date: "Jun 18, 2026",
  },

  {
    title: "JSS 3 Mock Exam Timetable",
    audience: "Specific Class",
    badge: "gray",
    message:
      "The mock exam timetable for JSS 3A and JSS 3B has been released. Please check with your subject teachers for details.",
    delivered: "Delivered to 70 students (JSS 3A, JSS 3B)",
    date: "Jun 15, 2026",
  },

  {
    title: "New Library Hours",
    audience: "All Students",
    badge: "orange",
    message:
      "The school library will now be open from 7:00 AM to 5:00 PM on weekdays, including during lunch break.",
    delivered: "Delivered to 1,247 students",
    date: "Jun 10, 2026",
  },
];

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

<a class="edit-broadcast-btn" href="./new-broadcast.html?edit=${index}&title=${encodeURIComponent(item.title)}&message=${encodeURIComponent(item.message)}&audience=${encodeURIComponent(item.audience)}">

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
  window.location.href = "./new-broadcast.html";

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
