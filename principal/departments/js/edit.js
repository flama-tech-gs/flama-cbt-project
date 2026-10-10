/* ==========================================
   EDIT DEPARTMENT PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeEditDepartment();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

/* ==========================================
   ELEMENTS
========================================== */

const saveBtn = document.querySelector(".btn-success");
const cancelBtn = document.querySelector(".btn-secondary");
const deleteBtn = document.querySelector(".btn-danger");

const addTeacherBtn = document.querySelector(".add-teacher-btn");

const removeButtons = document.querySelectorAll(".remove-btn");
const replaceButtons = document.querySelectorAll(".replace-btn");

const departmentNameInput = document.querySelector(".detail-item input");

const hodSelect = document.querySelector(".detail-item select");

/* ==========================================
   INITIALIZE
========================================== */

function initializeEditDepartment() {
  initializeRemoveButtons();

  initializeReplaceButtons();

  initializeFooterButtons();
}

/* ==========================================
   REMOVE TEACHER
========================================== */

function initializeRemoveButtons() {
  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      const teacher = row.children[0].innerText.trim();

      const confirmed = confirm(`Remove ${teacher} from this department?`);

      if (!confirmed) return;

      row.remove();

      // TODO:
      // Backend:
      // removeTeacherFromDepartment(id)
    });
  });
}

/* ==========================================
   REPLACE TEACHER
========================================== */

function initializeReplaceButtons() {
  replaceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");

      const teacher = row.children[0].innerText.trim();

      // TODO:
      // Open Replace Teacher Modal

      console.log("Replace:", teacher);
    });
  });
}

/* ==========================================
   ADD TEACHER
========================================== */

addTeacherBtn.addEventListener("click", () => {
  // TODO:
  // Open Add Teacher Modal

  console.log("Add Teacher");
});

/* ==========================================
   SAVE
========================================== */

saveBtn.addEventListener("click", () => {
  const payload = {
    department: departmentNameInput.value,

    hod: hodSelect.value,
  };

  console.log(payload);

  // TODO:
  // updateDepartment(payload)

  alert("Department updated successfully.");
});

/* ==========================================
   CANCEL
========================================== */

cancelBtn.addEventListener("click", () => {
  window.location.href = "./departments.html";
});

/* ==========================================
   DELETE
========================================== */

deleteBtn.addEventListener("click", () => {
  const confirmed = confirm(
    "Delete this department?\n\nAll teachers will become unassigned.",
  );

  if (!confirmed) return;

  // TODO:
  // deleteDepartment(id)

  window.location.href = "./departments.html";
});

/* ==========================================
   FUTURE API
========================================== */

function updateDepartment(data) {
  console.log(data);
}

function removeTeacher(id) {
  console.log(id);
}

function replaceTeacher(id) {
  console.log(id);
}

function deleteDepartment(id) {
  console.log(id);
}
