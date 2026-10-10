/*
==========================================
QUESTION DATA
(REPLACE WITH API)
==========================================
*/

const questions = [
  {
    id: 1,
    question: "Which part of the cell controls its activities?",
    options: [
      "A. Cytoplasm",
      "B. Nucleus",
      "C. Mitochondria",
      "D. Cell wall",
      "E. Ribosome",
    ],
    correct: "B",
  },

  {
    id: 2,
    question:
      "The process by which plants lose water vapour through their leaves is called?",
    options: [
      "A. Respiration",
      "B. Photosynthesis",
      "C. Transpiration",
      "D. Germination",
      "E. Osmosis",
    ],
    correct: "C",
  },

  {
    id: 3,
    question:
      "Which of these is NOT a function of the skeleton in the human body?",
    options: [
      "A. Support",
      "B. Protection",
      "C. Movement",
      "D. Digestion",
      "E. Blood cell production",
    ],
    correct: "D",
  },

  {
    id: 4,
    question: "The basic structural and functional unit of life is the ____.",
    options: ["A. Tissue", "B. Organ", "C. Cell", "D. Organelle", "E. System"],
    correct: "C",
  },
];

/*
==========================================
RENDER QUESTIONS
==========================================
*/

const questionList = document.getElementById("questionList");

renderQuestions();

function renderQuestions() {
  questionList.innerHTML = questions
    .map(
      (question) => `

<div class="question-card">

<div class="question-header">

<div class="question-title">

<div class="question-number">

${question.id}

</div>

<div class="question-text">

${question.question}

</div>

</div>

<button
class="edit-btn"
data-id="${question.id}">

<i data-lucide="pencil"></i>

Edit

</button>

</div>

<div class="options">

${question.options
  .map((option) => {
    const letter = option.charAt(0);

    return `

<div class="option
${letter === question.correct ? "correct" : ""}">

<div class="option-letter">

${letter}

</div>

<div class="option-text">

${option.substring(3)}

</div>

</div>

`;
  })
  .join("")}

</div>

</div>

`,
    )
    .join("");

  lucide.createIcons();
}

/*
==========================================
EDIT QUESTION
==========================================
*/

document.addEventListener("click", (e) => {
  const button = e.target.closest(".edit-btn");

  if (!button) return;

  const questionId = button.dataset.id;

  window.location.href = `../edit-question/edit-question.html?question=${questionId}`;
});

/*
==========================================
PAGINATION
==========================================
*/

document
  .querySelectorAll(".page-btn")

  .forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".page-btn.active")?.classList.remove("active");

      button.classList.add("active");

      /*

Backend later

fetchQuestions(page)

*/

      window.scrollTo({
        top: 0,

        behavior: "smooth",
      });
    });
  });
