//question.js

document.getElementById("questionForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const data = {
      examId: examId.value,
      question: question.value,
      options: {
        a: a.value,
        b: b.value,
        c: c.value,
        d: d.value,
        e: e.value,
      },
      correctAnswer: correctAnswer.value,
      marks: marks.value,
    };

    const res = await request("/question", "POST", data, true);

    console.log(res);
    alert("Question added");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});