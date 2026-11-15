(() => {
  "use strict";

  const mobileOrTablet = window.matchMedia("(max-width: 1024px)");
  const redirectToLogin = () => {
    window.location.replace(new URL("../index.html", window.location.href).href);
  };

  if (mobileOrTablet.matches) {
    redirectToLogin();
    return;
  }

  mobileOrTablet.addEventListener("change", (event) => {
    if (event.matches) redirectToLogin();
  });
})();
