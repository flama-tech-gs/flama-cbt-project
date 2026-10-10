const nameInput = document.getElementById("name");
const codeInput = document.getElementById("code");
const descriptionInput = document.getElementById("description");
const classInput = document.getElementById("class");
const teacherInput = document.getElementById("teacher");

document.getElementById("subjectForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const data = {
      name: nameInput.value,
      code: codeInput.value,
      description: descriptionInput.value,
      class: classInput.value,
      teacher: teacherInput.value,
    };

    const res = await request("/subject", "POST", data, true);

    console.log(res);
    alert("Subject created");
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to create subject");
  }
});