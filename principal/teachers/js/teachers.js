/*
==========================================
DATA
==========================================
*/

const teacherData = [
  {
    department: "Science Department",
    teachers: 3,
    open: true,

    records: [
      {
        name: "Mrs. Adebayo Folake",
        staffId: "TCH/2025/014",
        subjects: "Biology, Basic Science & Tech",
        active: true,
      },

      {
        name: "Mr. Chukwu Emeka",
        staffId: "TCH/2025/021",
        subjects: "Mathematics, Further Maths",
        active: true,
      },

      {
        name: "Mrs. Yusuf Halima",
        staffId: "TCH/2025/009",
        subjects: "Chemistry, Physics",
        active: false,
      },

      {
        name: "Mr. Ibrahim Tunde",
        staffId: "TCH/2025/013",
        subjects: "English Language, Literature",
        active: true,
      },

      {
        name: "Ms. Okoro Nneka",
        staffId: "TCH/2025/017",
        subjects: "History, Government",
        active: true,
      },

      {
        name: "Mr. Adeyemi Sola",
        staffId: "TCH/2025/022",
        subjects: "Physical Education, Health Science",
        active: false,
      },

      {
        name: "Mrs. Nwosu Chika",
        staffId: "TCH/2025/016",
        subjects: "Creative Arts, Music",
        active: true,
      },

      {
        name: "Mr. Johnstone Clive",
        staffId: "TCH/2025/015",
        subjects: "Computer Science, ICT",
        active: true,
      },
    ],
  },

  {
    department: "Arts Department",
    teachers: 12,
    open: false,
    records: [],
  },

  {
    department: "Languages Department",
    teachers: 9,
    open: false,
    records: [],
  },

  {
    department: "Social Science Department",
    teachers: 8,
    open: false,
    records: [],
  },

  {
    department: "Vocational & Technical",
    teachers: 6,
    open: false,
    records: [],
  },

  {
    department: "Mathematics Department",
    teachers: 10,
    open: false,
    records: [],
  },

  {
    department: "Science Department",
    teachers: 11,
    open: false,
    records: [],
  },

  {
    department: "Physical Education Department",
    teachers: 5,
    open: false,
    records: [],
  },

  {
    department: "Music Department",
    teachers: 7,
    open: false,
    records: [],
  },
];

/*
==========================================
RENDER
==========================================
*/

const container = document.getElementById("teachersAccordion");

container.innerHTML = teacherData
  .map(
    (item) => `

<section class="teacher-section">

<div class="department-header ${item.open ? "active" : ""}">

<div class="department-left">

<h2>${item.department}</h2>

<span class="teacher-count">

${item.teachers} teachers

</span>

</div>

<i data-lucide="${item.open ? "chevron-up" : "chevron-down"}"></i>

</div>

<div class="department-body ${item.open ? "" : "hidden"}">

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>S/N</th>
<th>Teacher Name</th>
<th>Staff ID</th>
<th>Subjects / Classes</th>
<th>Status</th>
<th>Actions</th>

</tr>

</thead>

<tbody>

${item.records
  .map(
    (teacher, index) => `

<tr>

<td>${index + 1}</td>

<td>${teacher.name}</td>

<td>

<span class="staff-id">

${teacher.staffId}

</span>

</td>

<td>${teacher.subjects}</td>

<td>

<span class="status-dot ${teacher.active ? "active-dot" : "inactive-dot"}"></span>

</td>

<td>

<div class="actions">

<a class="action-link">View Profile</a>

<a class="action-link">Reset Code</a>

<a class="action-link">Change Password</a>

${
  teacher.active
    ? `<a class="action-link action-danger">
Pause Account
</a>`
    : `<a class="action-link action-success">
Reactivate
</a>`
}

</div>

</td>

</tr>

`,
  )
  .join("")}

</tbody>

</table>

</div>

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

document.querySelectorAll(".department-header").forEach((header) => {
  header.addEventListener("click", () => {
    header.classList.toggle("active");

    const body = header.nextElementSibling;

    body.classList.toggle("hidden");

    const icon = header.querySelector("i");

    icon.setAttribute(
      "data-lucide",

      body.classList.contains("hidden") ? "chevron-down" : "chevron-up",
    );

    lucide.createIcons();
  });
});

/*
==========================================
ADD TEACHER
==========================================
*/

document.getElementById("addTeacherBtn").addEventListener("click", () => {
  /*

Later

window.location.href =
"add-teacher.html";

*/

  alert("Add Teacher");
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

// modal

/* ==========================================
   CREDENTIAL SUCCESS MODAL
========================================== */

const credentialModal = document.getElementById("credentialModal");

const closeCredentialModal = document.getElementById("closeCredentialModal");

const copyCodeBtn = document.getElementById("copyCodeBtn");

const miniCopyBtn = document.getElementById("miniCopyBtn");

const shareCodeBtn = document.getElementById("shareCodeBtn");

const generatedCode = document.getElementById("generatedCode");

const teacherName = document.getElementById("teacherName");

/* ==========================================
   OPEN MODAL
========================================== */

function openCredentialModal(name, code) {
  teacherName.textContent = name;

  generatedCode.textContent = code;

  credentialModal.classList.add("show");

  document.body.style.overflow = "hidden";
}

/* ==========================================
   CLOSE MODAL
========================================== */

function closeModal() {
  credentialModal.classList.remove("show");

  document.body.style.overflow = "";
}

closeCredentialModal.addEventListener("click", closeModal);

/* ==========================================
   CLOSE WHEN CLICKING OVERLAY
========================================== */

credentialModal.addEventListener("click", (e) => {
  if (e.target === credentialModal) {
    closeModal();
  }
});

/* ==========================================
   ESC KEY
========================================== */

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

/* ==========================================
   COPY ACCESS CODE
========================================== */

async function copyAccessCode() {
  const code = generatedCode.textContent.trim();

  try {
    await navigator.clipboard.writeText(code);

    copyCodeBtn.textContent = "Copied!";

    miniCopyBtn.innerHTML = `
            <i data-lucide="check"></i>
            Copied
        `;

    lucide.createIcons();

    setTimeout(() => {
      copyCodeBtn.textContent = "Copy Code";

      miniCopyBtn.innerHTML = `
                <i data-lucide="copy"></i>
                Copy Code
            `;

      lucide.createIcons();
    }, 2000);
  } catch {
    alert("Unable to copy code.");
  }
}

copyCodeBtn.addEventListener("click", copyAccessCode);

miniCopyBtn.addEventListener("click", copyAccessCode);

/* ==========================================
   SHARE CODE
========================================== */

shareCodeBtn.addEventListener("click", async () => {
  const code = generatedCode.textContent.trim();

  const message = `New CBT Access Code

Teacher: ${teacherName.textContent}

Access Code: ${code}

The previous code has been deactivated.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "New CBT Access Code",

        text: message,
      });
    } catch (err) {}
  } else {
    try {
      await navigator.clipboard.writeText(message);

      alert("Message copied to clipboard.");
    } catch {
      alert(message);
    }
  }
});

/* ==========================================
   EXAMPLE
   Remove this when backend is connected
========================================== */

// Example:
//
// document
//     .querySelector(".reset-access-btn")
//     .addEventListener("click", () => {
//
//         openCredentialModal(
//             "Bello Tunde Ibrahim",
//             "JS/52/2026"
//         );
//
//     });
