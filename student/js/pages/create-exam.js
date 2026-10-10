//create-exam.js

document.getElementById("examForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const data = {
      title: title.value,
      subjectIdentifier: subjectIdentifier.value,
      instructions: instructions.value,
      duration: duration.value,
      term: term.value,
      session: session.value,
      startDate: startDate.value,
      endDate: endDate.value,
    };

    const res = await request("/exam", "POST", data, true);

    console.log(res);
    alert("Exam created");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});