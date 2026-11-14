//onboarding.js

//const API = (window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api"));
const API = (window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api")); // Production backend

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






// =========================
// LOAD STUDENT PROFILE
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
      return;
    }

    // Welcome Text
    document.getElementById("welcomeName").textContent =
      `Welcome, ${student.firstname}!`;

    // Optional: Save student data
    localStorage.setItem(
      "studentData",
      JSON.stringify(student)
    );

  } catch (err) {
    console.error(err);
    alert("Failed to load profile");
  }
}

// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});