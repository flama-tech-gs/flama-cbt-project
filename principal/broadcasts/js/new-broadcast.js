/*
==========================================
AUDIENCE OPTIONS
==========================================
*/

const audienceOptions = [
  {
    title: "Everyone",
    subtitle: "All teachers & students",
    note: "This broadcast will be delivered immediately to all 1,247 students and 58 teachers.",
  },

  {
    title: "All Teachers",
    subtitle: "58 teachers",
    note: "This broadcast will be delivered to all 58 teachers.",
  },

  {
    title: "All Students",
    subtitle: "1,247 students",
    note: "This broadcast will be delivered to all 1,247 students.",
  },

  {
    title: "Specific Class",
    subtitle: "Choose one or more classes",
    note: "This broadcast will only be delivered to the selected classes.",
  },
];

/*
==========================================
RENDER AUDIENCE
==========================================
*/

const grid = document.getElementById("audienceGrid");

const note = document.getElementById("deliveryNote");

let selected = 0;

const editIndex = new URLSearchParams(window.location.search).get("edit");
const editParams = new URLSearchParams(window.location.search);

if (editIndex !== null && editParams.get("title")) {
  document.getElementById("broadcastTitle").value = editParams.get("title");
  document.getElementById("broadcastMessage").value =
    editParams.get("message") || "";
  selected = audienceOptions.findIndex(
    (option) => option.title === editParams.get("audience"),
  );

  if (selected < 0) selected = 0;
  document.querySelector(".topbar-title h1").textContent = "Edit Broadcast";
  document.querySelector(".send-btn").innerHTML =
    '<i data-lucide="save"></i> Update Broadcast';
}

renderAudience();

function renderAudience() {
  grid.innerHTML = audienceOptions
    .map(
      (item, index) => `

<div
class="audience-card ${index === selected ? "active" : ""}"
data-index="${index}">

<h3>${item.title}</h3>

<p>${item.subtitle}</p>

</div>

`,
    )
    .join("");

  note.innerHTML = audienceOptions[selected].note;

  lucide.createIcons();
}

/*
==========================================
SELECT AUDIENCE
==========================================
*/

document.addEventListener("click", (e) => {
  const card = e.target.closest(".audience-card");

  if (!card) return;

  selected = Number(card.dataset.index);

  renderAudience();
});

/*
==========================================
CANCEL
==========================================
*/

document.querySelector(".cancel-btn").addEventListener("click", () => {
  window.location.href = "../broadcasts/broadcasts.html";
});

/*
==========================================
SEND
==========================================
*/

document.getElementById("broadcastForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("broadcastTitle").value.trim();

  const message = document.getElementById("broadcastMessage").value.trim();

  if (title === "" || message === "") {
    alert("Please complete the form.");

    return;
  }

  /*

Replace with API

fetch(...)

*/

  alert("Broadcast Sent Successfully!");

  window.location.href = "../broadcasts/broadcasts.html";
});

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();
