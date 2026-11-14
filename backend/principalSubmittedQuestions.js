//backend/principalSubmittedQuestions.js

(() => {
  "use strict";

  const API_BASE =
    window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api");

  const ROOT = `${API_BASE}/principal/submitted-questions`;
  const token = sessionStorage.getItem("principalAccessToken");

  const mainContainer = document.querySelector(".main-container");
  const searchInput = document.querySelector(".search-box input");
  const filterCard = document.querySelector(".filter-card");
  const filterSelects = filterCard
    ? [...filterCard.querySelectorAll("select")]
    : [];
  const applyFilterButton =
    filterCard?.querySelector(".apply-filter-btn");

  if (!mainContainer) {
    console.error(
      "Submitted questions integration: .main-container was not found."
    );
    return;
  }

  // The page's selects are ordered: session, class, subject.
  const [sessionFilter, classFilter, subjectFilter] = filterSelects;

  let sessions = [];
  let searchText = "";

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  async function api(url, options = {}) {
    const requestUrl = new URL(url);

    // Add a unique query parameter to prevent cached GET responses.
    if (!options.method || options.method.toUpperCase() === "GET") {
      requestUrl.searchParams.set(
        "_requestTime",
        String(Date.now())
      );
    }

    const response = await fetch(requestUrl.toString(), {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    if (response.status === 304) {
      throw new Error(
        "The server returned 304 without a response body. Restart the backend and reload the page."
      );
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.message ||
          body.error ||
          `Request failed (${response.status})`
      );
    }

    // Return the complete response. Don't unwrap `.data`: the response
    // wrapper can otherwise lead to its message string instead of its payload.
    return body;
  }

  function findSessions(value, depth = 0) {
    if (!value || depth > 10) return null;

    if (
      typeof value === "object" &&
      Array.isArray(value.sessions)
    ) {
      return value.sessions;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findSessions(item, depth + 1);
        if (found !== null) return found;
      }
      return null;
    }

    if (typeof value === "object") {
      for (const child of Object.values(value)) {
        const found = findSessions(child, depth + 1);
        if (found !== null) return found;
      }
    }

    return null;
  }

  function findNestedValue(root, key, depth = 0) {
    if (!root || typeof root !== "object" || depth > 10) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(root, key)) {
      return root[key];
    }

    for (const value of Object.values(root)) {
      if (value && typeof value === "object") {
        const found = findNestedValue(value, key, depth + 1);
        if (found !== undefined) return found;
      }
    }

    return undefined;
  }

  function getImageUrl(value) {
    if (typeof value === "string") return value;
    if (value && typeof value.url === "string") return value.url;
    return "";
  }

  function applyBranding(profileResponse) {
    const school =
      profileResponse?.school ||
      profileResponse?.schoolProfile ||
      findNestedValue(profileResponse, "school") ||
      findNestedValue(profileResponse, "schoolProfile") ||
      null;

    const principal =
      profileResponse?.principal ||
      profileResponse?.principalProfile ||
      profileResponse?.user ||
      findNestedValue(profileResponse, "principal") ||
      findNestedValue(profileResponse, "principalProfile") ||
      findNestedValue(profileResponse, "user") ||
      null;

    const schoolNameElement =
      document.querySelector(".logo-area h2");
    const schoolLogoElement =
      document.querySelector(".logo-area img");
    const principalNameElement =
      document.querySelector(
        ".principal-profile .principal-details h4"
      );
    const principalImageElement =
      document.querySelector(
        ".principal-profile .principal-avatar img"
      );

    const schoolName =
      school?.name ||
      findNestedValue(profileResponse, "schoolName") ||
      "";

    const schoolLogo =
      getImageUrl(school?.logo) ||
      getImageUrl(school?.logoUrl) ||
      getImageUrl(school?.images?.[0]);

    const principalName =
      principal?.fullName ||
      [
        principal?.title,
        principal?.firstName,
        principal?.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      findNestedValue(profileResponse, "principalName") ||
      "";

    const principalImage =
      getImageUrl(principal?.avatar) ||
      getImageUrl(principal?.profilePicture) ||
      getImageUrl(principal?.image);

    if (schoolNameElement && schoolName) {
      schoolNameElement.textContent = schoolName;
    }

    if (schoolLogoElement && schoolLogo) {
      schoolLogoElement.src = schoolLogo;
      schoolLogoElement.alt = `${schoolName || "School"} logo`;
    }

    if (principalNameElement && principalName) {
      principalNameElement.textContent = principalName;
    }

    if (principalImageElement && principalImage) {
      principalImageElement.src = principalImage;
      principalImageElement.alt = principalName || "Principal";
    }
  }

  async function loadBranding() {
    if (!token) return;

    try {
      const profileResponse = await api(
        `${API_BASE}/principal/profile`
      );
      applyBranding(profileResponse);
    } catch (error) {
      console.error(
        "Could not load school/principal profile:",
        error
      );
    }
  }

  function setSelectOptions(select, options, allLabel) {
    if (!select) return;

    const previousValue = select.value;
    select.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = allLabel;
    select.appendChild(allOption);

    for (const item of options) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    }

    const valueStillExists = [...select.options].some(
      (option) => option.value === previousValue
    );

    select.value = valueStillExists ? previousValue : "";
  }

  function populateFilters() {
    const classesById = new Map();
    const subjectsByName = new Map();

    for (const session of sessions) {
      for (const schoolClass of session.classes || []) {
        classesById.set(schoolClass.id, schoolClass.name);

        for (const submission of schoolClass.submissions || []) {
          if (submission.subjectName) {
            subjectsByName.set(
              submission.subjectName,
              submission.subjectName
            );
          }
        }
      }
    }

    setSelectOptions(
      sessionFilter,
      sessions.map((session) => ({
        value: session.id,
        label: session.name,
      })),
      "All Sessions"
    );

    setSelectOptions(
      classFilter,
      [...classesById.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
      "All Classes"
    );

    setSelectOptions(
      subjectFilter,
      [...subjectsByName.values()]
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name })),
      "All Subjects"
    );
  }

  function getReviewUrl(submission) {
    const params = new URLSearchParams();
    params.set(
      "questionIds",
      (submission.questionIds || []).join(",")
    );

    return `./review.html?${params.toString()}`;
  }

  function getVisibleSessions() {
    const query = searchText.trim().toLocaleLowerCase();
    const selectedSession = sessionFilter?.value || "";
    const selectedClass = classFilter?.value || "";
    const selectedSubject = subjectFilter?.value || "";

    return sessions
      .filter(
        (session) =>
          !selectedSession || session.id === selectedSession
      )
      .map((session) => {
        const classes = (session.classes || [])
          .filter(
            (schoolClass) =>
              !selectedClass || schoolClass.id === selectedClass
          )
          .map((schoolClass) => {
            const submissions = (
              schoolClass.submissions || []
            ).filter((submission) => {
              if (
                selectedSubject &&
                submission.subjectName !== selectedSubject
              ) {
                return false;
              }

              if (!query) return true;

              const searchableText = [
                session.name,
                schoolClass.name,
                submission.subjectName,
                submission.subjectCode,
                submission.teacherName,
                submission.employeeId,
                submission.termName,
                submission.status,
              ]
                .join(" ")
                .toLocaleLowerCase();

              return searchableText.includes(query);
            });

            return { ...schoolClass, submissions };
          })
          .filter(
            (schoolClass) => schoolClass.submissions.length > 0
          );

        return { ...session, classes };
      })
      .filter((session) => session.classes.length > 0);
  }

  function removeDynamicContent() {
    mainContainer
      .querySelectorAll(
        ".year-group, .submitted-questions-message, .submitted-questions-loading"
      )
      .forEach((element) => element.remove());
  }

  function renderMessage(message, className = "") {
    removeDynamicContent();

    const paragraph = document.createElement("p");
    paragraph.className =
      `submitted-questions-message ${className}`.trim();
    paragraph.textContent = message;
    mainContainer.appendChild(paragraph);
  }

  function render() {
    removeDynamicContent();

    const visibleSessions = getVisibleSessions();

    if (visibleSessions.length === 0) {
      const hasActiveFilter = Boolean(
        searchText.trim() ||
          sessionFilter?.value ||
          classFilter?.value ||
          subjectFilter?.value
      );

      renderMessage(
        hasActiveFilter
          ? "No submitted questions match your search or filters."
          : "No submitted questions were found."
      );
      return;
    }

    visibleSessions.forEach((session, sessionIndex) => {
      const submissionCount = session.classes.reduce(
        (total, schoolClass) =>
          total + schoolClass.submissions.length,
        0
      );

      const yearGroup = document.createElement("section");
      yearGroup.className =
        `year-group${sessionIndex === 0 ? " open" : ""}`;

      const yearHeader = document.createElement("button");
      yearHeader.type = "button";
      yearHeader.className = "year-header accordion-toggle";
      yearHeader.setAttribute(
        "aria-expanded",
        String(sessionIndex === 0)
      );
      yearHeader.innerHTML = `
        <div>
          <span class="year-title">${escapeHtml(session.name)}</span>
          <span class="submission-count">
            ${submissionCount}
            ${submissionCount === 1 ? "submission" : "submissions"}
          </span>
        </div>
        <i data-lucide="${
          sessionIndex === 0 ? "chevron-up" : "chevron-down"
        }"></i>
      `;

      const yearContent = document.createElement("div");
      yearContent.className = "year-content";
      yearContent.hidden = sessionIndex !== 0;

      session.classes.forEach((schoolClass, classIndex) => {
        const classGroup = document.createElement("div");
        classGroup.className =
          `class-group${classIndex === 0 ? " open" : ""}`;

        const classHeader = document.createElement("button");
        classHeader.type = "button";
        classHeader.className = "class-header accordion-toggle";
        classHeader.setAttribute(
          "aria-expanded",
          String(classIndex === 0)
        );
        classHeader.innerHTML = `
          <div>
            <span class="class-title">${escapeHtml(schoolClass.name)}</span>
            <span class="submission-count">
              ${schoolClass.submissions.length}
              ${
                schoolClass.submissions.length === 1
                  ? "submission"
                  : "submissions"
              }
            </span>
          </div>
          <i data-lucide="${
            classIndex === 0 ? "chevron-up" : "chevron-down"
          }"></i>
        `;

        const classContent = document.createElement("div");
        classContent.className = "class-content";
        classContent.hidden = classIndex !== 0;

        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";

        const table = document.createElement("table");
        table.innerHTML = `
          <thead>
            <tr>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Term</th>
              <th>Questions</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${schoolClass.submissions
              .map((submission) => {
                const status = String(
                  submission.status || "PENDING"
                ).toUpperCase();

                const statusClass =
                  status === "APPROVED"
                    ? "approved"
                    : status === "REJECTED"
                      ? "rejected"
                      : "pending";

                const legacyNote =
                  submission.hasUnrecordedSubmissionDetails
                    ? ""
                    : "";

                return `
                  <tr>
                    <td>${escapeHtml(
                      submission.subjectName || "—"
                    )}</td>
                    <td>
                      ${escapeHtml(
                        submission.teacherName || "Unknown teacher"
                      )}
                      ${
                        submission.employeeId
                          ? `<small> (${escapeHtml(
                              submission.employeeId
                            )})</small>`
                          : ""
                      }
                    </td>
                    <td>${escapeHtml(
                      submission.termName || "Term not recorded"
                    )}</td>
                    <td>${Number(submission.questionCount) || 0}</td>
                    <td>
                      <span class="status ${statusClass}">
                        ${escapeHtml(status)}
                      </span>${legacyNote}
                    </td>
                    <td>
                      <a
                        class="view-btn"
                        href="${escapeHtml(getReviewUrl(submission))}"
                      >View</a>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        `;

        wrapper.appendChild(table);
        classContent.appendChild(wrapper);
        classGroup.append(classHeader, classContent);
        yearContent.appendChild(classGroup);
      });

      yearGroup.append(yearHeader, yearContent);
      mainContainer.appendChild(yearGroup);
    });

    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  }

  mainContainer.addEventListener("click", (event) => {
    const header = event.target.closest(
      ".year-header.accordion-toggle, .class-header.accordion-toggle"
    );

    if (!header || !mainContainer.contains(header)) return;

    const content = header.nextElementSibling;
    if (!content) return;

    content.hidden = !content.hidden;
    const expanded = !content.hidden;

    header.setAttribute("aria-expanded", String(expanded));

    const group = header.closest(".year-group, .class-group");
    group?.classList.toggle("open", expanded);

    const icon = header.querySelector("[data-lucide]");
    if (icon) {
      icon.setAttribute(
        "data-lucide",
        expanded ? "chevron-up" : "chevron-down"
      );
    }

    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  });

  async function loadSubmissions() {
    if (!token) {
      renderMessage(
        "Your principal session has expired. Please sign in again.",
        "error"
      );
      return;
    }

    removeDynamicContent();

    const loading = document.createElement("p");
    loading.className = "submitted-questions-loading";
    loading.textContent = "Loading submitted questions…";
    mainContainer.appendChild(loading);

    try {
      const responseBody = await api(ROOT);
      const foundSessions = findSessions(responseBody);

     

      sessions = Array.isArray(foundSessions) ? foundSessions : [];

      populateFilters();
      render();
    } catch (error) {
      console.error("Could not load submitted questions:", error);
      renderMessage(
        error.message || "Could not load submitted questions.",
        "error"
      );
    }
  }

  searchInput?.addEventListener("input", () => {
    searchText = searchInput.value || "";
    render();
  });

  filterSelects.forEach((select) => {
    select.addEventListener("change", render);
  });

  applyFilterButton?.addEventListener("click", (event) => {
    event.preventDefault();
    render();
  });

  loadBranding();
  loadSubmissions();
})();