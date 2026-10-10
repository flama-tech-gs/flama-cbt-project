// login.js

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
    window.location.href = "index.html";
  }
}


// PASSWORD TOGGLE
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password"
      ? "text"
      : "password";

  passwordInput.setAttribute("type", type);
});


// LOGIN
const loginForm = document.querySelector(".login-form");

const accessCode = document.getElementById("accessCode");
const password = document.getElementById("password");

const accessError = document.getElementById("accessError");
const passwordError = document.getElementById("passwordError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  accessError.style.display = "none";
  passwordError.style.display = "none";

  accessCode.classList.remove("input-error");
  password.classList.remove("input-error");

  const identifier = accessCode.value.trim();
  const userPassword = password.value.trim();

  if (!identifier || !userPassword) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password: userPassword,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // Save user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data._id);
      localStorage.setItem("role", data.role);

      localStorage.setItem("firstname", data.firstname);
      localStorage.setItem("surname", data.surname);

      if (data.access_code) {
        localStorage.setItem(
          "access_code",
          data.access_code
        );
      }

      alert("Login successful");

      window.location.href = "./pages/profile.html";
    } else {
      if (
        data.message === "Student not found" ||
        data.message === "User not found"
      ) {
        accessCode.classList.add("input-error");
        accessError.textContent = data.message;
        accessError.style.display = "block";
      } else {
        password.classList.add("input-error");
        passwordError.textContent =
          data.message || "Login failed";
        passwordError.style.display = "block";
      }
    }
  } catch (err) {
    console.error(err);
    alert("Unable to connect to server");
  }
});


// FORGOT PASSWORD MODAL
const forgotPasswordLink =
  document.getElementById("forgotPasswordLink");

const forgotModal =
  document.getElementById("forgotModal");

const closeModal =
  document.getElementById("closeModal");

forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  forgotModal.classList.add("active");
});

closeModal.addEventListener("click", () => {
  forgotModal.classList.remove("active");
});

forgotModal.addEventListener("click", (e) => {
  if (e.target === forgotModal) {
    forgotModal.classList.remove("active");
  }
});