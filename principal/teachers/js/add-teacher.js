/* ==========================================
   ADD NEW TEACHER
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initialiseTeacherForm();

  generateCredentials();

  lucide.createIcons();
});

/* ==========================================
   ELEMENTS
========================================== */

const teacherForm = document.getElementById("teacherForm");

const subjectContainer = document.getElementById("subjectContainer");

const addSubjectBtn = document.getElementById("addSubject");

const surnameInput = document.getElementById("surname");

const firstNameInput = document.getElementById("firstname");

const phoneInput = document.getElementById("phone");

const emailInput = document.getElementById("email");

const departmentSelect = document.getElementById("department");

const staffIdPreview = document.getElementById("staffIdPreview");

const accessCodePreview = document.getElementById("accessCodePreview");

const passwordPreview = document.getElementById("passwordPreview");

/* ==========================================
   INITIALISE
========================================== */

function initialiseTeacherForm() {
  surnameInput.addEventListener("input", generateCredentials);

  addSubjectBtn.addEventListener("click", addSubjectRow);

  subjectContainer.addEventListener("click", removeSubjectRow);

  teacherForm.addEventListener("submit", submitTeacherForm);
}

/* ==========================================
   GENERATE LOGIN DETAILS
========================================== */

function generateCredentials() {
  const number = Math.floor(Math.random() * 900) + 100;

  staffIdPreview.textContent = `TCH/2026/${number}`;

  accessCodePreview.textContent = `TC/${number}/2026`;

  const surname = surnameInput.value.trim() || "Teacher";

  passwordPreview.textContent = `${surname}@2026`;
}

/* ==========================================
   ADD SUBJECT ROW
========================================== */

function addSubjectRow() {
  const row = document.createElement("div");

  row.className = "assignment-row";

  row.innerHTML = `

        <div class="form-group">

            <label>Subject</label>

            <select>

                <option>Biology</option>

                <option>Physics</option>

                <option>Chemistry</option>

                <option>Mathematics</option>

                <option>English</option>

                <option>Basic Science & Technology</option>

            </select>

        </div>

        <div class="form-group">

            <label>Class</label>

            <select>

                <option>JSS 1A</option>

                <option>JSS 1B</option>

                <option>JSS 2A</option>

                <option>JSS 2B</option>

                <option>JSS 3A</option>

                <option>JSS 3B</option>

            </select>

        </div>

        <button
            type="button"
            class="remove-row"
        >

            <i data-lucide="x"></i>

        </button>

    `;

  subjectContainer.appendChild(row);

  lucide.createIcons();
}

/* ==========================================
   REMOVE SUBJECT
========================================== */

function removeSubjectRow(e) {
  const button = e.target.closest(".remove-row");

  if (!button) return;

  const rows = document.querySelectorAll(".assignment-row");

  if (rows.length === 1) {
    alert("At least one subject must remain.");

    return;
  }

  button.closest(".assignment-row").remove();
}

/* ==========================================
   FORM SUBMIT
========================================== */

function submitTeacherForm(e) {
  e.preventDefault();

  if (!validateForm()) return;

  /*
    Replace this with your existing
    success modal function.
    */

  // openSuccessModal();

  alert("Teacher account created successfully.");

  teacherForm.reset();

  generateCredentials();
}

/* ==========================================
   VALIDATION
========================================== */

function validateForm() {
  if (surnameInput.value.trim() === "") {
    surnameInput.focus();

    return false;
  }

  if (firstNameInput.value.trim() === "") {
    firstNameInput.focus();

    return false;
  }

  if (phoneInput.value.trim() === "") {
    phoneInput.focus();

    return false;
  }

  if (emailInput.value.trim() === "") {
    emailInput.focus();

    return false;
  }

  if (departmentSelect.value === "") {
    departmentSelect.focus();

    return false;
  }

  return true;
}
