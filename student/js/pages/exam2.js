//exam2.js

//const API = "http://localhost:5000/api";
const API = "https://flama-cbt-backend.onrender.com/api"; // Production backend

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const role = localStorage.getItem("role");

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.exp * 1000 < Date.now()) {
      localStorage.clear();
    }
  } catch (err) {
    localStorage.clear();
    window.location.href = "../index.html";
  }
}


const params = new URLSearchParams(window.location.search);

const examId = params.get("examId");

let questions = [];
let currentQuestion = 0;
let answers = {};

let timerInterval;
let timeLeft = 0;



//Load profile
async function loadProfile() {
  try {
    const res = await fetch(`${API}/students/profile/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const student = await res.json();

    document.getElementById("studentName").textContent =
      `${student.surname} ${student.firstname}`;

    document.getElementById("studentClass").textContent =
      student.class;

    return student;

  } catch (err) {
    console.error("Profile load failed:", err);
  }
}



//load attempt
//restore attempts
let attemptId;


async function restoreAttempt() {
    const res = await fetch(
    `${API}/attempt/active/${examId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (res.ok) {

    const data = await res.json();

    const attempt = data.attempt;


    attemptId = attempt._id;

    timeLeft = attempt.remainingTime;

    answers = {};

    attempt.answers.forEach(answer => {

      answers[answer.question] =
        answer.selectedAnswer;

    });

  }
  else {

    const startRes = await fetch(
      `${API}/exam-attempts/start`,
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify({
          examId
        })
      }
    );

    const startData =
      await startRes.json();

    attemptId =
      startData.attempt._id;
  }

}




//load exam
async function loadExam() {

  const res = await fetch(
    `${API}/exam/${examId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  const exam = data.exam;

  document.getElementById("examTitle").textContent =
    exam.title;

  document.getElementById("examInstruction").textContent =
    exam.instructions || "Answer all questions";

  document.getElementById("subjectName").textContent =
    exam.subject.name;

  document.getElementById("modalSubject").textContent =
    exam.subject.name;


  if (!timeLeft) {
    timeLeft = exam.duration * 60;
  }

}







//load Questions
async function loadQuestions() {

  const res = await fetch(
    `${API}/question/exam/${examId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  questions = data.questions;

  generateQuestionGrid();

  questions.forEach((q, index) => {
    if (answers[q._id]) {
      document
        .getElementById(`q-${index}`)
        .classList.add("answered");
    }
  });

  showQuestion(0);
}



//Question Grid
function generateQuestionGrid() {

  const grid =
    document.getElementById("questionGrid");

  grid.innerHTML = "";

  questions.forEach((q, index) => {

    const btn =
      document.createElement("button");

    btn.textContent = index + 1;

    btn.onclick = () => {
      currentQuestion = index;
      showQuestion(index);
    };

    btn.id = `q-${index}`;

    grid.appendChild(btn);
  });
}



//Questions Display
function showQuestion(index) {

  const q = questions[index];

  document.getElementById(
    "questionNumber"
  ).textContent =
    `Question ${index + 1}`;

  document.getElementById(
    "questionText"
  ).textContent =
    q.question;

  const optionsDiv =
    document.getElementById("options");

  optionsDiv.innerHTML = "";

  Object.entries(q.options)
    .forEach(([key, value]) => {

      const checked =
        answers[q._id] === key
          ? "checked"
          : "";

      optionsDiv.innerHTML += `
        <label class="option">
          <input
            type="radio"
            name="option"
            value="${key}"
            ${checked}
          />
          ${key.toUpperCase()}. ${value}
        </label>
      `;
    });

  document
    .querySelectorAll(
      'input[name="option"]'
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          answers[q._id] = input.value;

          localStorage.setItem(
              `exam_answers_${examId}`,
              JSON.stringify(answers)
          );

          saveAnswer(
              q._id,
              input.value
          );

          document
            .getElementById(
              `q-${index}`
            )
            .classList.add(
              "answered"
            );
        }
      );
    });
}



//Navigation buttons
document
  .getElementById("nextBtn")
  .addEventListener("click", () => {

    if (
      currentQuestion <
      questions.length - 1
    ) {
      currentQuestion++;
      showQuestion(currentQuestion);
    }
  });

document
  .getElementById("prevBtn")
  .addEventListener("click", () => {

    if (currentQuestion > 0) {
      currentQuestion--;
      showQuestion(currentQuestion);
    }
  });





//Timer
function startTimer() {


  timerInterval =
    setInterval(() => {

      const mins =
        Math.floor(timeLeft / 60);

      const secs =
        timeLeft % 60;

      document.getElementById(
        "timer"
      ).textContent =
        `${mins}:${
          secs < 10
            ? "0" + secs
            : secs
        }`;

      timeLeft--;

      if (timeLeft < 0) {

        clearInterval(
          timerInterval
        );

        confirmSubmit();
      }

    }, 1000);
}




//Save timer 30sec
async function saveRemainingTime() {

    try {

        await fetch(
            `${API}/attempt/save-time`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        `Bearer ${token}`
                },
                body: JSON.stringify({
                    attemptId,
                    remainingTime: timeLeft
                })
            }
        );

    } catch(err) {
        console.log(err);
    }
}




//Save Answer
async function saveAnswer(
    questionId,
    selectedAnswer
) {

    try {

        await fetch(
            `${API}/attempt/update-answer`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        `Bearer ${token}`
                },
                body: JSON.stringify({
                    attemptId,
                    questionId,
                    selectedAnswer
                })
            }
        );

    } catch (err) {
        console.error(
            "Answer save failed",
            err
        );
    }
}


//Submit Modal
function openModal() {

  const answered =
    Object.keys(answers).length;

  const unanswered =
    questions.length - answered;

  document.getElementById(
    "answeredCount"
  ).textContent = answered;

  document.getElementById(
    "unansweredCount"
  ).textContent = unanswered;

  document
    .getElementById(
      "submitModal"
    )
    .classList.remove("hidden");
}

function closeModal() {

  document
    .getElementById(
      "submitModal"
    )
    .classList.add("hidden");
}




//Submit Exam
async function confirmSubmit() {

  clearInterval(timerInterval);

  const formattedAnswers =
    Object.entries(answers).map(
      ([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer
      })
    );

  try {

    const res = await fetch(
      `${API}/attempt/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId,
          answers: formattedAnswers
        })
      }
    );

    const data =
      await res.json();

    if (!res.ok)
      throw new Error(
        data.message
      );

    localStorage.removeItem(
      `exam_answers_${examId}`
    );

    document
      .getElementById(
        "submitModal"
      )
      .classList.add("hidden");

    document
      .getElementById(
        "successModal"
      )
      .classList.remove("hidden");

  } catch (err) {

    alert(err.message);

  }
}




//auto save before closig browser
window.addEventListener(
  "beforeunload",
  () => {

    localStorage.setItem(
      `exam_answers_${examId}`,
      JSON.stringify(answers)
    );

    navigator.sendBeacon(
      `${API}/attempt/save-time`,
      new Blob(
        [
          JSON.stringify({
            attemptId,
            remainingTime:
              timeLeft
          })
        ],
        {
          type:
            "application/json"
        }
      )
    );
  }
);




//Dashboard
function goToDashboard() {
  window.location.href = "./profile.html"; // adjust path
}

//DOM
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (!examId) {
      alert("Exam ID missing");
      return;
    }

    await loadProfile();

    await restoreAttempt();

    await loadExam();

    await loadQuestions();

    startTimer();

    setInterval(
      saveRemainingTime,
      30000
    );
  }
);






