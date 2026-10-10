/*
==========================================
DATA (Replace with API)
==========================================
*/

const examSections = [
  {
    class: "JSS 1A",
    count: 1,
    open: true,
    exams: [
      {
        subject: "Biology",
        status: "ready",
        questions: 40,
        duration: 45,
        term: "2nd Term",
        session: "2025/2026",
        date: "Jun 15, 2026",
      },

      {
        subject: "English",
        status: "ready",
        questions: 40,
        duration: 45,
        term: "2nd Term",
        session: "2025/2026",
        date: "Jun 15, 2026",
      },

      {
        subject: "Mathematics",
        status: "ready",
        questions: 40,
        duration: 45,
        term: "2nd Term",
        session: "2025/2026",
        date: "Jun 15, 2026",
      },

      {
        subject: "Chemistry",
        status: "ready",
        questions: 40,
        duration: 45,
        term: "2nd Term",
        session: "2025/2026",
        date: "Jun 15, 2026",
      },

      {
        subject: "Physics",
        status: "ready",
        questions: 40,
        duration: 45,
        term: "2nd Term",
        session: "2025/2026",
        date: "Jun 15, 2026",
      },
    ],
  },

  {
    class: "JSS 2A",
    count: 1,
    open: true,
    exams: [
      {
        subject: "Mathematics",
        status: "active",
        questions: 40,
        duration: 60,
        started: "11:00 AM",
        ends: "12:00 PM",
        startedStudents: "28 of 33 students have started",
      },
    ],
  },

  {
    class: "JSS 3A",
    count: 1,
    open: false,
    exams: [],
  },

  {
    class: "JSS 3B",
    count: 1,
    open: false,
    exams: [],
  },
];

/*
==========================================
RENDER
==========================================
*/

const container = document.getElementById("examAccordion");

container.innerHTML = examSections
  .map(
    (section, index) => `

<section class="exam-section">

<div
class="exam-header ${section.open ? "active" : ""}"
data-index="${index}">

<div class="exam-header-left">

<h2>${section.class}</h2>

<span class="exam-count">

${section.count} exam

</span>

</div>

<i data-lucide="${section.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="exam-body ${section.open ? "" : "hidden"}">

${section.exams
  .map(
    (exam) => `

<div class="exam-card">

<div>

<div class="exam-title">

<h3>

${exam.subject} – ${section.class}

</h3>

<span class="status ${exam.status}">

${exam.status === "ready" ? "Ready to Launch" : "Active"}

</span>

</div>

<p class="exam-meta">

${
  exam.status === "ready"
    ? `${exam.questions} questions •
${exam.duration} mins •
${exam.term},
${exam.session} •
Approved ${exam.date}`
    : `${exam.questions} questions •
${exam.duration} mins •
Started ${exam.started} •
Ends ${exam.ends} •
${exam.startedStudents}`
}

</p>

</div>

<div class="exam-actions">

${
  exam.status === "ready"
    ? `

<button class="exam-btn go-live">

<i data-lucide="play"></i>

Go Live

</button>

<button class="exam-btn schedule">

<i data-lucide="clock-3"></i>

Schedule

</button>

`
    : `

<button class="exam-btn stop">

<i data-lucide="square"></i>

Stop Exam

</button>

`
}

</div>

</div>

`,
  )
  .join("")}

</div>

</section>

`,
  )
  .join("");

/*
==========================================
ACCORDION
==========================================
*/

document.querySelectorAll(".exam-header").forEach((header) => {
  header.addEventListener("click", () => {
    const body = header.nextElementSibling;

    body.classList.toggle("hidden");

    header.classList.toggle("active");

    const icon = header.querySelector("i");

    if (body.classList.contains("hidden")) {
      icon.setAttribute("data-lucide", "chevron-down");
    } else {
      icon.setAttribute("data-lucide", "chevron-up");
    }

    lucide.createIcons();
  });
});

/*
==========================================
BUTTONS
==========================================
*/

document.addEventListener("click", (e) => {
  if (e.target.closest(".go-live")) {
    // alert("Launch exam (API)");

    document.getElementById("goLiveModal").classList.add("show");

    lucide.createIcons();
  }

  if (e.target.closest(".schedule")) {
    alert("Schedule exam (API)");
  }

  if (e.target.closest(".stop")) {
    // alert("Stop exam (API)");

    document.getElementById("stopExamModal").classList.add("show");

    lucide.createIcons();
  }
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function closeSidebar() {
  sidebar?.classList.remove("show");
  sidebarOverlay?.classList.remove("show");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("show");

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

/*
==========================================
GO LIVE MODAL
==========================================
*/

const goLiveModal = document.getElementById("goLiveModal");

document.getElementById("closeGoLive").addEventListener("click", () => {
  goLiveModal.classList.remove("show");
});

goLiveModal.addEventListener("click", (e) => {
  if (e.target === goLiveModal) {
    goLiveModal.classList.remove("show");
  }
});

document.getElementById("confirmGoLive").addEventListener("click", () => {
  goLiveModal.classList.remove("show");

  /*
Replace with API
*/

  alert("Exam is now live.");
});

/*
==========================================
STOP EXAM MODAL
==========================================
*/

const stopExamModal = document.getElementById("stopExamModal");

document.getElementById("closeStopExam").addEventListener("click", () => {
  stopExamModal.classList.remove("show");
});

stopExamModal.addEventListener("click", (e) => {
  if (e.target === stopExamModal) {
    stopExamModal.classList.remove("show");
  }
});

document.getElementById("confirmStopExam").addEventListener("click", () => {
  stopExamModal.classList.remove("show");

  /*
Replace with API
*/

  alert("Exam stopped successfully.");
});
