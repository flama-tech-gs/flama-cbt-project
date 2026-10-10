//student.js

const surname = document.getElementById("surname");
const firstname = document.getElementById("firstname");
const email = document.getElementById("email");
const classInput = document.getElementById("classInput");
const department = document.getElementById("department");
const age = document.getElementById("age");
const admissionYear = document.getElementById("admissionYear");
const parentPhoneNumber = document.getElementById("parentPhoneNumber");
const currentTerm = document.getElementById("currentTerm");
const address = document.getElementById("address");

document.getElementById("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const data = {
      surname: surname.value,
      firstname: firstname.value,
      email: email.value,
      class: classInput.value,
      department: department.value,
      age: age.value,
      admissionYear: admissionYear.value,
      parentPhoneNumber: parentPhoneNumber.value,
      currentTerm: currentTerm.value,
      address: address.value,
    };

    const res = await request("/students", "POST", data, true);

    console.log(res);
    alert("Student created successfully");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});