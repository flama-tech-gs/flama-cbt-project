//auth.js

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const data = {
      surname: surname.value,
      firstname: firstname.value,
      email: email.value,
      password: password.value,
    };

    const res = await request("/auth/register", "POST", data);

    console.log("Registered:", res);
    alert("Teacher registered successfully");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});