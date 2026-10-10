/*
==========================================
UPLOAD QUESTION STATE
==========================================
*/

const examState = {
  exam: {
    classId: "",
    className: "",
    subjectId: "",
    subjectName: "",
    term: "",
    session: "",
    duration: 45,
    totalQuestions: 40,
    instructions: "",
  },

  currentQuestion: 0,

  questions: [],

  draftSaved: false,

  lastSaved: null,
};

/*
==========================================
INITIALIZE QUESTIONS
==========================================
*/

function initializeQuestions(totalQuestions) {
  examState.questions = [];

  for (let i = 0; i < totalQuestions; i++) {
    examState.questions.push({
      id: i + 1,

      question: "",

      explanation: "",

      image: null,

      options: [
        {
          id: "A",
          text: "",
          correct: false,
        },

        {
          id: "B",
          text: "",
          correct: false,
        },

        {
          id: "C",
          text: "",
          correct: false,
        },

        {
          id: "D",
          text: "",
          correct: false,
        },
      ],
    });
  }
}

/*
==========================================
HELPERS
==========================================
*/

function getCurrentQuestion() {
  return examState.questions[examState.currentQuestion];
}

function nextQuestion() {
  if (examState.currentQuestion < examState.questions.length - 1) {
    examState.currentQuestion++;
  }
}

function previousQuestion() {
  if (examState.currentQuestion > 0) {
    examState.currentQuestion--;
  }
}

function jumpToQuestion(index) {
  examState.currentQuestion = index;
}

/*
==========================================
CORRECT ANSWER
==========================================
*/

function setCorrectAnswer(optionId) {
  const question = getCurrentQuestion();

  question.options.forEach((option) => {
    option.correct = option.id === optionId;
  });
}

/*
==========================================
PROGRESS
==========================================
*/

function getProgress() {
  const completed = examState.questions.filter((question) => {
    const hasQuestion = question.question.trim() !== "";

    const optionsFilled = question.options.every(
      (option) => option.text.trim() !== "",
    );

    const hasCorrect = question.options.some((option) => option.correct);

    return hasQuestion && optionsFilled && hasCorrect;
  }).length;

  return {
    completed,

    total: examState.questions.length,

    percentage: Math.round((completed / examState.questions.length) * 100),
  };
}

/*
==========================================
DRAFT
==========================================
*/

function saveDraft() {
  localStorage.setItem(
    "teacherExamDraft",

    JSON.stringify(examState),
  );

  examState.lastSaved = new Date();

  examState.draftSaved = true;
}

function restoreDraft() {
  const draft = localStorage.getItem("teacherExamDraft");

  if (!draft) return;

  Object.assign(examState, JSON.parse(draft));
}

function clearDraft() {
  localStorage.removeItem("teacherExamDraft");
}
