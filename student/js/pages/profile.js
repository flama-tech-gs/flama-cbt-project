// profile.js

//const API = "http://localhost:5000/api";
const API = "https://flama-cbt-backend.onrender.com/api"; // Production backend

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const role = localStorage.getItem("role");

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.exp * 1000 < Date.now()) {
      localStorage.clear();
    }
  } catch (err) {
    localStorage.clear();
    window.location.href = "../index.html";
  }
}


document.querySelector(".back-btn")
  ?.addEventListener("click", () => {
    window.history.back();
  });


// =========================
// LOAD PROFILE
// =========================

async function loadProfile() {
  try {

    const res = await fetch(
      `${API}/students/profile/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const student = await res.json();

    if (!res.ok) {
      alert(student.message || "Failed to load profile");
      return null;
    }

    // Top Bar
    document.getElementById("topStudentName").textContent =
      `${student.surname} ${student.firstname}`;

    document.getElementById("topStudentClass").textContent =
      student.class || "-";

    // Profile Details
    document.getElementById("studentName").textContent =
      `${student.surname} ${student.firstname}`;

    document.getElementById("studentClass").textContent =
      student.class || "-";

    document.getElementById("studentDepartment").textContent =
      student.department || "-";

    document.getElementById("studentAge").textContent =
      student.age ?? "-";

    document.getElementById("studentAdmissionYear").textContent =
      student.admissionYear ?? "-";

    document.getElementById("studentParentPhone").textContent =
      student.parentPhoneNumber || "-";

    document.getElementById("studentCurrentTerm").textContent =
      student.currentTerm || "-";

    document.getElementById("studentAddress").textContent =
      student.address || "-";

    return student;

  } catch (err) {
    alert("Failed to load profile");
    return null;
  }
}


// =========================
// LOAD STUDENT SUBJECTS
// =========================

async function loadStudentSubjects(student) {
  try {

    if (!student) {
      return;
    }

    const studentIdentifier =
      student.access_code || student._id;


    const response = await fetch(
      `${API}/subject/student/${studentIdentifier}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();


    const subjectsGrid =
      document.getElementById("subjectsGrid");

    if (!subjectsGrid) return;

    if (!response.ok) {
      subjectsGrid.innerHTML =
        `<p>${data.message || "Unable to load subjects"}</p>`;
      return;
    }

    const subjects = data.subjects || [];

    if (subjects.length === 0) {
      subjectsGrid.innerHTML =
        "<p>No subjects assigned yet.</p>";
      return;
    }

    subjectsGrid.innerHTML = "";

    const ul = document.createElement("ul");

    subjects.forEach(subject => {
      const li = document.createElement("li");
      li.textContent = subject.name;
      ul.appendChild(li);
    });

    subjectsGrid.appendChild(ul);

  } catch (error) {


    const subjectsGrid =
      document.getElementById("subjectsGrid");

    if (subjectsGrid) {
      subjectsGrid.innerHTML =
        "<p>Failed to load subjects.</p>";
    }
  }
}


// =========================
// PAGE LOAD
// =========================

document.addEventListener("DOMContentLoaded", async () => {

  const student = await loadProfile();

  if (student) {
    await loadStudentSubjects(student);
  }

});