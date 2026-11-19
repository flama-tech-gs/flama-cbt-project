(() => {
  "use strict";

  const mobileOrTablet = window.matchMedia("(max-width: 1024px)");
  const returnToExamList = () => {
    window.location.replace(new URL("/student/pages/exam-start?device=unsupported", window.location.origin).href);
  };

  if (mobileOrTablet.matches) {
    returnToExamList();
    return;
  }

  mobileOrTablet.addEventListener("change", (event) => {
    if (event.matches) returnToExamList();
  });
})();
