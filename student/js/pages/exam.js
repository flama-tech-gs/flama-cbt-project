// SAMPLE QUESTIONS (replace later with API/backend)
const questions = [
  {
    question: "Which of the following is the basic unit of life?",
    options: ["Tissue", "Organ", "Cell", "Organism"],
    answer: "Cell",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },

  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
  {
    question: "What carries genetic information?",
    options: ["Protein", "DNA", "Fat", "Water"],
    answer: "DNA",
  },
];

let currentQuestion = 0;
let answers = JSON.parse(localStorage.getItem("answers")) || {};

// ELEMENTS
const qText = document.getElementById("questionText");
const qNumber = document.getElementById("questionNumber");
const optionsBox = document.getElementById("options");
const grid = document.getElementById("questionGrid");

// LOAD GRID
questions.forEach((_, i) => {
  const btn = document.createElement("button");
  btn.textContent = i + 1;

  btn.addEventListener("click", () => {
    currentQuestion = i;
    loadQuestion();
  });

  grid.appendChild(btn);
});

// LOAD QUESTION
function loadQuestion() {
  const q = questions[currentQuestion];

  qNumber.textContent = `Question ${currentQuestion + 1}:`;
  qText.textContent = q.question;

  optionsBox.innerHTML = "";

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    if (answers[currentQuestion] === opt) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      answers[currentQuestion] = opt;
      localStorage.setItem("answers", JSON.stringify(answers));
      loadQuestion();
      updateGrid();
    };

    optionsBox.appendChild(btn);
  });

  updateGrid();
}

// UPDATE GRID COLORS
function updateGrid() {
  const buttons = grid.querySelectorAll("button");

  buttons.forEach((btn, i) => {
    btn.classList.remove("active", "answered");

    if (i === currentQuestion) {
      btn.classList.add("active");
    }

    if (answers[i]) {
      btn.classList.add("answered");
    }
  });
}

// NAVIGATION
document.getElementById("nextBtn").onclick = () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    loadQuestion();
  }
};

document.getElementById("prevBtn").onclick = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    loadQuestion();
  }
};

// TIMER
let duration = 45 * 60; // 45 mins
const timerEl = document.getElementById("timer");

setInterval(() => {
  const min = Math.floor(duration / 60);
  const sec = duration % 60;

  timerEl.textContent = `${String(min).padStart(2, "0")} : ${String(sec).padStart(2, "0")}`;

  if (duration <= 0) {
    submitExam();
  }

  duration--;
}, 1000);

// SUBMIT
document.getElementById("submitBtn").onclick = () => {
  const confirmSubmit = confirm("Submit exam?");
  if (confirmSubmit) submitExam();
};

function submitExam() {
  alert("Exam submitted!");
  localStorage.removeItem("answers");
  window.location.href = "report.html";
}

// function confirmSubmit() {
//   localStorage.removeItem("answers");

//   document.getElementById("submitModal").classList.add("hidden");
//   document.getElementById("successModal").classList.remove("hidden");
// }

// function goToDashboard() {

//   window.location.href = "index.html";
// }

// function confirmSubmit() {
//   document.getElementById("submitModal").classList.add("hidden");

//   setTimeout(() => {
//     localStorage.removeItem("answers");
//     document.getElementById("successModal").classList.remove("hidden");
//   }, 800);
// }

// INIT
loadQuestion();

// For submitmodal
// function openModal() {
//   const answered = Object.keys(answers).length;
//   const total = questions.length;
//   const unanswered = total - answered;

//   document.getElementById("answeredCount").textContent =
//     `${answered} out of ${total}`;

//   document.getElementById("unansweredCount").textContent =
//     `${unanswered} Questions`;

//   document.getElementById("submitModal").classList.remove("hidden");
// }

// function closeModal() {
//   document.getElementById("submitModal").classList.add("hidden");
// }

// function confirmSubmit() {
//   alert("Exam Submitted Successfully!");
//   localStorage.removeItem("answers");
//   window.location.reload();
// }
