const classes = [
  {
    name: "JSS 1A",
    subject: "Biology",
    students: 30,
  },

  {
    name: "JSS 1B",
    subject: "Biology",
    students: 28,
  },

  {
    name: "JSS 2A",
    subject: "Biology",
    students: 33,
  },

  {
    name: "JSS 2B",
    subject: "Biology",
    students: 31,
  },

  {
    name: "JSS 3A",
    subject: "Biology",
    students: 34,
  },

  {
    name: "JSS 3B",
    subject: "Biology",
    students: 35,
  },
];

const students = [
  {
    name: "Adegbola Abiodun Odunyemi",
    code: "JS/50/2024",
    year: 2024,
    gender: "Male",
  },

  {
    name: "Chukwu Ngozi Adaeze",
    code: "JS/51/2024",
    year: 2024,
    gender: "Female",
  },

  {
    name: "Bello Tunde Ibrahim",
    code: "JS/52/2024",
    year: 2024,
    gender: "Male",
  },

  {
    name: "Okafor Chidinma Grace",
    code: "JS/53/2024",
    year: 2024,
    gender: "Female",
  },

  {
    name: "Yusuf Aisha Mohammed",
    code: "JS/54/2024",
    year: 2024,
    gender: "Female",
  },
];

const tabs = document.getElementById("classTabs");

tabs.innerHTML = classes
  .map(
    (item, index) => `

<button
class="class-tab ${index === 5 ? "active" : ""}">

${item.name}

</button>

`,
  )
  .join("");

const table = document.getElementById("studentsTable");

table.innerHTML = students
  .map(
    (student, index) => `

<tr>

<td>${index + 1}</td>

<td>${student.name}</td>

<td>

<span class="access-badge">

${student.code}

</span>

</td>

<td>${student.year}</td>

<td>${student.gender}</td>

<td>

<a
href="#"
class="profile-btn">

View Profile

</a>

</td>

</tr>

`,
  )
  .join("");

lucide.createIcons();
