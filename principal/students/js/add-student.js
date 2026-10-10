const form = document.getElementById("studentForm");
const modal = document.getElementById("successModal");

modal.style.display = "none";

form.addEventListener("submit", function (e) {
  e.preventDefault();

  modal.style.display = "flex";
});

document.querySelector(".btn-success").addEventListener("click", () => {
  window.location.href = "../students/students.html";
});

document.querySelector(".btn-primary").addEventListener("click", () => {
  const credentials = `Access Code: JS/58/2026
Password: Adegbola@2026`;

  navigator.clipboard.writeText(credentials);

  alert("Credentials copied.");
});
