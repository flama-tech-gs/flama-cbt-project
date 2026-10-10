/*
==========================================
SAMPLE DATA
(REPLACE WITH API)
==========================================
*/

const questions = [
  {
    id: 1,
    question: "Which part of the cell controls its activities?",
    options: {
      A: "Cytoplasm",
      B: "Nucleus",
      C: "Mitochondria",
      D: "Cell Wall",
      E: "Ribosome",
    },
    correct: "B",
  },

  {
    id: 2,
    question: "The process by which plants lose water vapour is called?",
    options: {
      A: "Respiration",
      B: "Photosynthesis",
      C: "Transpiration",
      D: "Osmosis",
      E: "Diffusion",
    },
    correct: "C",
  },

  {
    id: 3,
    question: "The basic unit of life is ____.",
    options: {
      A: "Cell",
      B: "Organ",
      C: "Tissue",
      D: "System",
      E: "Organism",
    },
    correct: "A",
  },
];

/*
==========================================
GET QUESTION ID
==========================================
*/

const params = new URLSearchParams(window.location.search);

let currentQuestion = parseInt(params.get("question")) || 1;

let hasChanges = false;

/*
==========================================
ELEMENTS
==========================================
*/

const questionText = document.getElementById("questionText");

const optionA = document.getElementById("optionA");

const optionB = document.getElementById("optionB");

const optionC = document.getElementById("optionC");

const optionD = document.getElementById("optionD");

const optionE = document.getElementById("optionE");

/*
==========================================
LOAD QUESTION
==========================================
*/

function loadQuestion(id) {
  const question = questions.find((q) => q.id === id);

  if (!question) return;

  document.getElementById("questionNumber").textContent = id;

  document.getElementById("questionCounter").textContent =
    `${id} of ${questions.length}`;

  document.getElementById("navigationCounter").textContent =
    `Question ${id} of ${questions.length}`;

  questionText.value = question.question;

  optionA.value = question.options.A;

  optionB.value = question.options.B;

  optionC.value = question.options.C;

  optionD.value = question.options.D;

  optionE.value = question.options.E;

  document.querySelectorAll(".correct-btn").forEach((button) => {
    button.classList.remove("active");

    button.textContent = "Mark as Correct";

    if (button.dataset.option === question.correct) {
      button.classList.add("active");

      button.textContent = "✓ Correct";
    }
  });

  hasChanges = false;
}

/*
==========================================
MARK CORRECT
==========================================
*/

document.querySelectorAll(".correct-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".correct-btn").forEach((btn) => {
      btn.classList.remove("active");

      btn.textContent = "Mark as Correct";
    });

    button.classList.add("active");

    button.textContent = "✓ Correct";

    hasChanges = true;
  });
});

/*
==========================================
TRACK CHANGES
==========================================
*/

document.querySelectorAll("textarea,input").forEach((input) => {
  input.addEventListener("input", () => {
    hasChanges = true;
  });
});

/*
==========================================
SAVE
==========================================
*/

document.getElementById("saveChanges").addEventListener("click", () => {
  const question = questions.find((q) => q.id === currentQuestion);

  question.question = questionText.value;

  question.options.A = optionA.value;

  question.options.B = optionB.value;

  question.options.C = optionC.value;

  question.options.D = optionD.value;

  question.options.E = optionE.value;

  question.correct = document.querySelector(
    ".correct-btn.active",
  ).dataset.option;

  /*

Backend

PUT

/api/questions/${currentQuestion}

*/

  hasChanges = false;

  alert("Changes saved successfully.");
});

/*
==========================================
DISCARD
==========================================
*/

document.getElementById("discardChanges").addEventListener("click", () => {
  loadQuestion(currentQuestion);
});

/*
==========================================
NEXT
==========================================
*/

document.getElementById("nextQuestion").addEventListener("click", () => {
  if (currentQuestion < questions.length) {
    currentQuestion++;

    loadQuestion(currentQuestion);
  }
});

/*
==========================================
PREVIOUS
==========================================
*/

document.getElementById("previousQuestion").addEventListener("click", () => {
  if (currentQuestion > 1) {
    currentQuestion--;

    loadQuestion(currentQuestion);
  }
});

/*
==========================================
SUBMIT
==========================================
*/

document.getElementById("submitQuestion").addEventListener("click", () => {
  /*

POST

/api/questions/resubmit

*/

  alert("Question submitted successfully for approval.");
});

/*
==========================================
UNSAVED CHANGES
==========================================
*/

window.addEventListener("beforeunload", (e) => {
  if (!hasChanges) return;

  e.preventDefault();

  e.returnValue = "";
});

/*
==========================================
INIT
==========================================
*/

loadQuestion(currentQuestion);

lucide.createIcons();

// Submission success message

/*
==========================================
SUCCESS
==========================================
*/

const today = new Date();

document.getElementById("submittedDate").textContent = today.toLocaleDateString(
  "en-GB",
  {
    day: "numeric",

    month: "short",

    year: "numeric",
  },
);

document.getElementById("submittedQuestions").textContent = progress.total;

successModal.classList.remove("hidden");

document.getElementById("backToSubmitted").addEventListener("click", () => {
  window.location.href = "../submitted-questions/submitted-questions.html";
});

document.getElementById("closeSuccess").addEventListener("click", () => {
  successModal.classList.add("hidden");
});
