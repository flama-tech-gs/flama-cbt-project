//exam-start.js

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


// Example:
// exam-start.html?examId=6848b1d5e123456789abcd12
const params = new URLSearchParams(window.location.search);
const examId = params.get("examId");

// DOM
const topStudentName = document.getElementById("topStudentName");
const topStudentClass = document.getElementById("topStudentClass");

const studentName = document.getElementById("studentName");
const studentClass = document.getElementById("studentClass");

const subject = document.getElementById("subject");
const duration = document.getElementById("duration");
const totalQuestions = document.getElementById("totalQuestions");
const instructions = document.getElementById("instructions");
const term = document.getElementById("term");
const session = document.getElementById("session");

const startBtn = document.querySelector(".start-btn");
const backBtn = document.querySelector(".back-btn");





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

    
    return student;

  } catch (err) {
    alert("Failed to load profile");
    return null;
  }
}




// =========================
// LOAD EXAM DETAILS
// =========================

async function loadExam() {
  try {

    if (!examId) {
      alert("Exam ID not found");
      return;
    }

    const res = await fetch(
      `${API}/exam/${examId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to load exam");
      return;
    }

    const exam = data.exam;

    document.getElementById("subject").textContent =
      exam.subject?.name || "-";

    document.getElementById("duration").textContent =
      `${exam.duration} Minutes`;

    document.getElementById("totalQuestions").textContent =
      exam.maxQuestions || "-";

    document.getElementById("instructions").textContent =
      exam.instructions || "No instructions";

    // These fields don't exist in your schema yet
    document.getElementById("term").textContent =
      exam.term || "-";

    document.getElementById("session").textContent =
      exam.session || "-";

  } catch (err) {
    console.error(err);
    alert("Failed to load exam details");
  }
}





///
document.addEventListener("DOMContentLoaded", async () => {

  const student = await loadProfile();

  if (student) {

    document.getElementById("studentName").textContent =
      `${student.surname} ${student.firstname}`;

    document.getElementById("studentClass").textContent =
      student.class || "-";

    await loadExam();
  }

});









