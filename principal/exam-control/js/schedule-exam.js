/*
==========================================
DATA (Replace with API)
==========================================
*/

const subjects = [
  "Biology",
  "Mathematics",
  "English Language",
  "Chemistry",
  "Physics",
];

const classes = ["JSS 1A", "JSS 1B", "JSS 2A", "JSS 2B", "JSS 3A", "JSS 3B"];

const durations = [
  "30 Minutes",
  "45 Minutes",
  "60 Minutes",
  "90 Minutes",
  "120 Minutes",
];

/*
==========================================
POPULATE SELECTS
==========================================
*/

const subjectSelect = document.getElementById("subject");

subjects.forEach((subject) => {
  subjectSelect.innerHTML += `<option>${subject}</option>`;
});

const classSelect = document.getElementById("class");

classes.forEach((item) => {
  classSelect.innerHTML += `<option>${item}</option>`;
});

const durationSelect = document.getElementById("duration");

durations.forEach((item) => {
  durationSelect.innerHTML += `<option>${item}</option>`;
});

/*
==========================================
QUICK SCHEDULE BUTTONS
==========================================
*/

document.querySelectorAll(".quick-buttons button").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".quick-buttons button")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    /*
Future:
Automatically calculate date/time here.
*/
  });
});

/*
==========================================
CONFIRM
==========================================
*/

document.getElementById("confirmSchedule").addEventListener("click", () => {
  const subject = subjectSelect.value;

  const className = classSelect.value;

  const duration = durationSelect.value;

  if (
    subject.startsWith("Select") ||
    className.startsWith("Select") ||
    duration.startsWith("Select")
  ) {
    alert("Please complete all required fields.");

    return;
  }

  /*
Replace with API
*/

  alert("Exam scheduled successfully!");
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();
