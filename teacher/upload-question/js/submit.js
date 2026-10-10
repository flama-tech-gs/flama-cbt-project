const submitBtn = document.getElementById("submitExamBtn");

const confirmModal = document.getElementById("confirmModal");

const successModal = document.getElementById("successModal");

submitBtn.addEventListener("click", () => {
  const progress = getProgress();

  if (progress.completed !== progress.total) {
    alert("Please complete all questions before submission.");

    return;
  }

  document.getElementById("summaryQuestions").textContent = progress.total;

  document.getElementById("summaryClass").textContent =
    examState.exam.className || "JSS 3B";

  document.getElementById("summarySubject").textContent =
    examState.exam.subjectName || "Biology";

  confirmModal.classList.remove("hidden");
});

document.getElementById("cancelSubmit").addEventListener("click", () => {
  confirmModal.classList.add("hidden");
});

document.getElementById("confirmSubmit").addEventListener("click", async () => {
  confirmModal.classList.add("hidden");

  /*
    Backend

    await fetch("/api/teacher/upload",{

        method:"POST",

        body:JSON.stringify(examState)

    });

    */

  await new Promise((resolve) => setTimeout(resolve, 1500));

  clearDraft();

  successModal.classList.remove("hidden");
});

document.getElementById("viewQuestionsBtn").addEventListener("click", () => {
  window.location.href = "uploaded-questions.html";
});

document.getElementById("newExamBtn").addEventListener("click", () => {
  location.reload();
});
