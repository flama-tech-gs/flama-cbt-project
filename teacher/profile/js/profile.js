/*
==========================================
TEACHER DATA
(REPLACE WITH API)
==========================================
*/

const teacher = {
  fullName: "Adebayo Folake Mojisola",

  staffId: "TCH/2025/014",

  department: "Science Department",

  subjects: "Biology, Basic Science & Technology",

  phone: "+2348023456789",

  qualification: "B.Sc Biology Education (Hons), NCE",

  address: "12, Adeola Crescent, Abeokuta, Ogun State.",

  employed: "September 2022",

  image: "../assets/teacher.png",
};

/*
==========================================
SUMMARY
(REPLACE WITH API)
==========================================
*/

const summary = [
  {
    title: "Total Students",
    value: 191,
  },

  {
    title: "Classes Assigned",
    value: 6,
  },

  {
    title: "Subjects Taught",
    value: 2,
  },

  {
    title: "Years of Service",
    value: 4,
  },
];

/*
==========================================
ASSIGNED CLASSES
(REPLACE WITH API)
==========================================
*/

const assignedClasses = [
  {
    class: "JSS 1A",
    subject: "Biology",
    students: 30,
    term: "2nd Term",
    session: "2025/2026",
  },

  {
    class: "JSS 1B",
    subject: "Biology",
    students: 28,
    term: "2nd Term",
    session: "2025/2026",
  },

  {
    class: "JSS 2A",
    subject: "Biology",
    students: 33,
    term: "2nd Term",
    session: "2025/2026",
  },

  {
    class: "JSS 2B",
    subject: "Biology",
    students: 31,
    term: "2nd Term",
    session: "2025/2026",
  },

  {
    class: "JSS 3A",
    subject: "Biology",
    students: 34,
    term: "2nd Term",
    session: "2025/2026",
  },

  {
    class: "JSS 3B",
    subject: "Biology, Basic Science & Tech",
    students: 35,
    term: "2nd Term",
    session: "2025/2026",
  },
];

/*
==========================================
PROFILE CARD
==========================================
*/

const profileCard = document.getElementById("profileCard");

profileCard.innerHTML = `
<img
class="profile-image"
src="${teacher.image}"
alt="${teacher.fullName}">

<div class="profile-details">

<div class="profile-label">Full Name:</div>
<div class="profile-value">${teacher.fullName}</div>

<div class="profile-label">Staff ID:</div>
<div class="profile-value">${teacher.staffId}</div>

<div class="profile-label">Department:</div>
<div class="profile-value">${teacher.department}</div>

<div class="profile-label">Subjects Taught:</div>
<div class="profile-value">${teacher.subjects}</div>

<div class="profile-label">Phone Number:</div>
<div class="profile-value">${teacher.phone}</div>

<div class="profile-label">Qualification:</div>
<div class="profile-value">${teacher.qualification}</div>

<div class="profile-label">Address:</div>
<div class="profile-value">${teacher.address}</div>

<div class="profile-label">Date Employed:</div>
<div class="profile-value">${teacher.employed}</div>

</div>

`;

/*
==========================================
SUMMARY CARDS
==========================================
*/

const summaryCards = document.getElementById("summaryCards");

summaryCards.innerHTML = summary
  .map(
    (item) => `

<div class="stat-card">

<h2>${item.value}</h2>

<p>${item.title}</p>

</div>

`,
  )
  .join("");

/*
==========================================
ASSIGNED CLASSES TABLE
==========================================
*/

const tbody = document.getElementById("assignedClasses");

tbody.innerHTML = assignedClasses
  .map(
    (item) => `

<tr>

<td>${item.class}</td>

<td>${item.subject}</td>

<td>${item.students}</td>

<td>${item.term}</td>

<td>${item.session}</td>

</tr>

`,
  )
  .join("");

/*
==========================================
INIT
==========================================
*/

lucide.createIcons();
