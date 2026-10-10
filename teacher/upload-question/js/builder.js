/*
==========================================
QUESTION BUILDER
==========================================
*/

const questionContainer = document.getElementById("questionContainer");
const questionCounter = document.getElementById("questionCounter");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const progressSummary = document.getElementById("progressSummary");

/*
==========================================
INITIALIZE
==========================================
*/

document.addEventListener("DOMContentLoaded", () => {
  initializeQuestions(40);

  renderQuestion();
});

/*
==========================================
RENDER QUESTION
==========================================
*/

function renderQuestion() {
  const question = getCurrentQuestion();

  questionCounter.textContent = `Question ${question.id} of ${examState.questions.length}`;

  questionContainer.innerHTML = `

        <div class="question-field">

            <label>Question Text</label>

            <textarea
                id="questionText"
                placeholder="Type your question here..."
            >${question.question}</textarea>

        </div>

        <div class="options-grid">

            ${question.options
              .map(
                (option) => `

                <div class="option-card">

                    <div class="option-header">

                        <h3>Option ${option.id}</h3>

                        <button
                            class="correct-btn ${option.correct ? "active" : ""}"
                            data-option="${option.id}"
                            type="button">

                            ${
                              option.correct
                                ? "✓ Correct Answer"
                                : "Mark as Correct"
                            }

                        </button>

                    </div>

                    <input
                        class="option-input"
                        data-option="${option.id}"
                        type="text"
                        value="${option.text}"
                        placeholder="Enter option ${option.id}">

                </div>

            `,
              )
              .join("")}

        </div>

    `;

  attachEvents();

  updateProgress();
}

/*
==========================================
ATTACH EVENTS
==========================================
*/

function attachEvents() {
  const question = getCurrentQuestion();

  const questionText = document.getElementById("questionText");

  questionText.addEventListener("input", (e) => {
    question.question = e.target.value;

    saveDraft();

    updateProgress();
  });

  document.querySelectorAll(".option-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const option = question.options.find(
        (item) => item.id === e.target.dataset.option,
      );

      option.text = e.target.value;

      saveDraft();

      updateProgress();
    });
  });

  document.querySelectorAll(".correct-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setCorrectAnswer(button.dataset.option);

      saveDraft();

      renderQuestion();
    });
  });
}

/*
==========================================
SAVE & NEXT
==========================================
*/

document.getElementById("saveNextBtn").addEventListener("click", () => {
  if (examState.currentQuestion < examState.questions.length - 1) {
    nextQuestion();

    renderQuestion();

    window.scrollTo({
      top: 0,

      behavior: "smooth",
    });
  }
});

/*
==========================================
CLEAR
==========================================
*/

document.getElementById("clearBtn").addEventListener("click", () => {
  const question = getCurrentQuestion();

  question.question = "";

  question.options.forEach((option) => {
    option.text = "";

    option.correct = false;
  });

  renderQuestion();

  saveDraft();
});

/*
==========================================
PROGRESS
==========================================
*/

function updateProgress() {
  const progress = getProgress();

  progressFill.style.width = `${progress.percentage}%`;

  progressText.textContent = `${progress.completed} / ${progress.total}
        Questions Completed (${progress.percentage}%)`;

  progressSummary.textContent = `${progress.completed} Questions Added`;
}

/*
==========================================
KEYBOARD SHORTCUTS
==========================================
*/

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "ArrowRight") {
    e.preventDefault();

    nextQuestion();

    renderQuestion();
  }

  if (e.ctrlKey && e.key === "ArrowLeft") {
    e.preventDefault();

    previousQuestion();

    renderQuestion();
  }
});
