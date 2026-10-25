//backend/principalAddStudent.js

(() => {
  const API_BASE =
    `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const TOKEN_KEY = "principalAccessToken";
  const form = document.querySelector("#studentForm");
  const successModal = document.querySelector("#successModal");

  if (!form) return;

  function token() {
    const value = sessionStorage.getItem(TOKEN_KEY);
    if (!value) {
      window.location.assign("../index.html");
      throw new Error("Your login session has expired.");
    }
    return value;
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token()}`,
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    return result.data;
  }

  function fieldByLabel(labelText) {
    const groups = [...form.querySelectorAll(".form-group")];

    const group = groups.find((item) =>
      item.querySelector("label")?.textContent
        .trim()
        .toLowerCase()
        .startsWith(labelText.toLowerCase())
    );

    return group?.querySelector("input, select, textarea") || null;
  }

  function unwrap(value) {
    let current = value;

    for (let i = 0; i < 5; i += 1) {
      if (
        current &&
        typeof current === "object" &&
        !Array.isArray(current) &&
        current.data !== undefined
      ) {
        current = current.data;
      } else {
        break;
      }
    }

    return current;
  }

  function fillSelect(select, items, placeholder, labelFor = (item) => item.name) {
    if (!select) return;

    select.replaceChildren();

    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);

    for (const item of items || []) {
      const option = document.createElement("option");
      option.value = String(item._id || item.id);
      option.textContent = labelFor(item);
      select.appendChild(option);
    }
  }

  function setBranding(school, principal) {
    const logoArea = document.querySelector(".logo-area");
    const schoolName = logoArea?.querySelector("h2");
    const schoolLogo = logoArea?.querySelector("img");

    if (schoolName && school.name) schoolName.textContent = school.name;

    const logo =
      school.logo ||
      school.image ||
      school.logoUrl ||
      school.images?.[0]?.url;

    if (schoolLogo && logo) {
      schoolLogo.src = logo;
      schoolLogo.alt = `${school.name || "School"} logo`;
    }

    const profile = document.querySelector(".topbar .teacher-profile");
    const principalName = profile?.querySelector("h3");
    const principalImage = profile?.querySelector("img");

    if (principalName && principal.name) {
      principalName.textContent = principal.name;
    }

    if (principalImage && principal.image) {
      principalImage.src = principal.image;
      principalImage.alt = `${principal.name || "Principal"} profile`;
    }
  }

  function setCredentialRow(label, value) {
    const rows = [...successModal.querySelectorAll(".credential-row")];
    const row = rows.find(
      (item) => item.querySelector("span")?.textContent.trim() === label
    );

    if (row) {
      row.querySelector("strong").textContent = value || "—";
    }
  }

  function showCreatedStudent(data) {
    const student = data.student || {};
    const credentials = data.credentials || {};

    setCredentialRow("Student", student.name);
    setCredentialRow("Class", student.class);
    setCredentialRow("Access Code", credentials.accessCode);
    setCredentialRow("Password", credentials.defaultPassword);

    // Keep credentials available for the existing Copy Credentials button.
    successModal.dataset.credentials = [
      `Student: ${student.name}`,
      `Class: ${student.class}`,
      `Term: ${student.term}`,
      `Session: ${student.session}`,
      `Access Code: ${credentials.accessCode}`,
      `Password: ${credentials.defaultPassword}`,
    ].join("\n");

    successModal.classList.add("show");
    window.lucide?.createIcons();
  }

  async function loadFormData() {
    const data = unwrap(
      await requestJson("/principal/students/create-data")
    );

    const classSelect = fieldByLabel("Class");
    let sessionSelect = fieldByLabel("Session");
    const termSelect = fieldByLabel("Term");

    // The current markup uses a text input for session; turn it into a select
    // while retaining its existing form-group styling.
    if (sessionSelect && sessionSelect.tagName !== "SELECT") {
      const replacement = document.createElement("select");
      replacement.className = sessionSelect.className;
      replacement.required = true;
      sessionSelect.replaceWith(replacement);
      sessionSelect = replacement;
    }

    fillSelect(classSelect, data.classes, "Select class");
    fillSelect(
      sessionSelect,
      data.sessions,
      "Select session",
      (item) => item.name
    );

    function fillTermsForSession() {
      const selectedSessionId = sessionSelect?.value;
      const terms = (data.terms || []).filter(
        (term) =>
          !selectedSessionId ||
          String(term.academicSession) === selectedSessionId
      );

      fillSelect(
        termSelect,
        terms,
        "Select term",
        (item) => {
          const labels = {
            FIRST_TERM: "1st Term",
            SECOND_TERM: "2nd Term",
            THIRD_TERM: "3rd Term",
          };

          return labels[item.name] || item.name;
        }
      );
    }

    sessionSelect?.addEventListener("change", fillTermsForSession);
    fillTermsForSession();

    const [schoolResponse, profileResponse] = await Promise.all([
      requestJson("/tenant/auth/school-info"),
      requestJson("/principal/profile"),
    ]);

    const schoolData = unwrap(schoolResponse);
    const profileData = unwrap(profileResponse);

    setBranding(
      schoolData?.school || schoolData || data.school || {},
      {
        name:
          profileData?.principal?.name ||
          profileData?.name ||
          data.principal?.name,
        image:
          profileData?.principal?.profileImage ||
          profileData?.principal?.avatar ||
          profileData?.principal?.image ||
          data.principal?.image,
      }
    );
  }

  // Capture the submit event so the mock add-student.js handler does not run.
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = form.querySelector('[type="submit"]');
    const surname = fieldByLabel("Surname");
    const firstName = fieldByLabel("First Name");
    const otherNames = fieldByLabel("Other Names");
    const dob = fieldByLabel("Date of Birth");
    const phone = fieldByLabel("Parent / Guardian Phone");
    const department = fieldByLabel("Department");
    const address = fieldByLabel("Home Address");
    const classSelect = fieldByLabel("Class");
    const sessionSelect = fieldByLabel("Session");
    const termSelect = fieldByLabel("Term");

    if (!surname?.value.trim() || !firstName?.value.trim()) {
      window.alert("Enter the student’s surname and first name.");
      return;
    }

    if (!classSelect?.value || !sessionSelect?.value || !termSelect?.value) {
      window.alert("Select a class, academic session, and term.");
      return;
    }

    const age = dob?.value
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(dob.value).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        )
      : "";

    const body = new FormData();
    body.append("lastName", surname.value.trim());
    body.append("firstName", firstName.value.trim());
    body.append("otherNames", otherNames?.value.trim() || "");
    body.append("phone", phone?.value.trim() || "");
    body.append("age", age);
    body.append("department", department?.value || "");
    body.append("address", address?.value.trim() || "");
    body.append("classId", classSelect.value);
    body.append("academicSessionId", sessionSelect.value);
    body.append("termId", termSelect.value);

    const photo = document.querySelector("#studentPhoto");
    if (photo?.files?.[0]) {
      body.append("avatar", photo.files[0]);
    }

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Creating student…";
      }

      const response = await fetch(`${API_BASE}/principal/students`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Could not create student.");
      }

      showCreatedStudent(unwrap(result));
    } catch (error) {
      console.error("Could not create student:", error);
      window.alert(error.message || "Could not create student.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Create Student Account";
      }
    }
  }, true);

  // Copy the actual values returned by the API.
  successModal?.querySelector(".modal-actions .btn-primary")
    ?.addEventListener("click", async () => {
      const credentials = successModal.dataset.credentials || "";
      if (!credentials) return;

      await navigator.clipboard.writeText(credentials);
      window.alert("Student details copied.");
    });

  successModal?.querySelector(".btn-success")
    ?.addEventListener("click", () => {
      window.location.assign("../students/students.html");
    });

  loadFormData().catch((error) => {
    console.error("Could not load student form data:", error);
    window.alert(error.message || "Could not load classes and sessions.");
  });
})();