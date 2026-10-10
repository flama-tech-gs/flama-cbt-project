/* ==========================================
   CREATE DEPARTMENT PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeCreateDepartmentPage();
});

function initializeCreateDepartmentPage() {
  initializeTeacherSelection();
  initializeTeacherSearch();
  initializeFormActions();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

/* ==========================================
   ELEMENTS
========================================== */

const teacherCheckboxes = document.querySelectorAll(
  'tbody input[type="checkbox"]',
);

const selectedList = document.querySelector(".selected-list");

const selectedCount = document.querySelector(".selected-wrapper p");

const searchInput = document.querySelector(".search-box input");

const departmentForm = document.querySelector(".department-form");

const cancelButton = document.querySelector(".btn-secondary");

/* ==========================================
   TEACHER SELECTION
========================================== */

function initializeTeacherSelection() {
  teacherCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectedTeachers);
  });

  updateSelectedTeachers();
}

/* ==========================================
   UPDATE SELECTED CHIPS
========================================== */

function updateSelectedTeachers() {
  selectedList.innerHTML = "";

  let count = 0;

  teacherCheckboxes.forEach((checkbox) => {
    if (!checkbox.checked) return;

    count++;

    const row = checkbox.closest("tr");

    const teacherName = row.children[1].textContent.trim();

    const chip = document.createElement("span");

    chip.className = "teacher-chip";

    chip.innerHTML = `
            ${teacherName}
            <button type="button">
                <i data-lucide="x"></i>
            </button>
        `;

    chip.querySelector("button").addEventListener("click", () => {
      checkbox.checked = false;

      updateSelectedTeachers();
    });

    selectedList.appendChild(chip);
  });

  selectedCount.textContent = `Selected (${count})`;

  lucide.createIcons();
}

/* ==========================================
   SEARCH
========================================== */

function initializeTeacherSearch() {
  searchInput.addEventListener("input", function () {
    const keyword = this.value.toLowerCase();

    document.querySelectorAll("tbody tr").forEach((row) => {
      const teacher = row.children[1].textContent.toLowerCase();

      const subject = row.children[3].textContent.toLowerCase();

      const department = row.children[2].textContent.toLowerCase();

      row.style.display =
        teacher.includes(keyword) ||
        subject.includes(keyword) ||
        department.includes(keyword)
          ? ""
          : "none";
    });
  });
}

/* ==========================================
   SAVE
========================================== */

function initializeFormActions() {
  departmentForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const departmentName =
      this.querySelector('input[type="text"]').value.trim();

    const hod = this.querySelector("select").value;

    if (!departmentName) {
      alert("Please enter a department name.");

      return;
    }

    if (!hod || hod === "Select a teacher") {
      alert("Please select a Head of Department.");

      return;
    }

    // TODO:
    // Send data to backend

    alert("Department created successfully.");
  });

  cancelButton.addEventListener("click", () => {
    window.location.href = "./departments.html";
  });
}

/* ==========================================
   FUTURE API
========================================== */

function saveDepartment(payload) {
  console.log(payload);
}

// modal

/* ==========================================
   DEPARTMENT SUCCESS MODAL
========================================== */

const successModal = document.getElementById("departmentSuccessModal");

const viewDepartmentsBtn = document.getElementById("viewDepartmentsBtn");

const createAnotherBtn = document.getElementById("createAnotherBtn");

/* ==========================================
   OPEN MODAL
========================================== */

function openSuccessModal(departmentName, teacherCount) {
  const message = successModal.querySelector("p");

  message.innerHTML = `
        "<strong>${departmentName}</strong>"
        has been created with
        <strong>${teacherCount} teacher${teacherCount > 1 ? "s" : ""}</strong>
        assigned.

        You can edit it anytime from
        Departments.
    `;

  successModal.classList.add("show");

  document.body.style.overflow = "hidden";
}

/* ==========================================
   CLOSE MODAL
========================================== */

function closeSuccessModal() {
  successModal.classList.remove("show");

  document.body.style.overflow = "";
}

/* ==========================================
   CLOSE ON OVERLAY
========================================== */

successModal.addEventListener("click", function (e) {
  if (e.target === successModal) {
    closeSuccessModal();
  }
});

/* ==========================================
   ESC KEY
========================================== */

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeSuccessModal();
  }
});

/* ==========================================
   VIEW DEPARTMENTS
========================================== */

viewDepartmentsBtn.addEventListener("click", () => {
  window.location.href = "./departments.html";
});

/* ==========================================
   CREATE ANOTHER
========================================== */

createAnotherBtn.addEventListener("click", () => {
  closeSuccessModal();

  departmentForm.reset();

  document.querySelector(".selected-list").innerHTML = "";

  document.querySelector(".selected-wrapper p").textContent = "Selected (0)";

  document
    .querySelectorAll('tbody input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = false;
    });
});

/* ==========================================
   SAVE DEPARTMENT
========================================== */

departmentForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const departmentName = this.querySelector('input[type="text"]').value.trim();

  const teacherCount = document.querySelectorAll(
    'tbody input[type="checkbox"]:checked',
  ).length;

  if (!departmentName) {
    alert("Please enter a department name.");

    return;
  }

  // ======================================
  // Future Backend Call
  // ======================================

  // await createDepartment(...)

  openSuccessModal(departmentName, teacherCount);
});

/* ==========================================
   OPTIONAL
========================================== */

// Example:
//
// openSuccessModal(
//     "Sciences Department",
//     2
// );
