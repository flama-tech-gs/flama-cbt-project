// ==========================================
// PHOTO UPLOAD (optional profile photo field)
// Previews the chosen image, validates type and size, and clears on
// "Remove" or when the form is reset. The file stays in the <input name>,
// so it is included when the form is submitted to a backend.
// ==========================================

(function () {
  const MAX_BYTES = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/png", "image/jpeg"];
  const ALLOWED_EXTENSIONS = /\.(png|jpe?g)$/i;

  function init(field) {
    const input = field.querySelector(".photo-upload__input");
    const button = field.querySelector(".photo-upload__button");
    const remove = field.querySelector(".photo-upload__remove");
    const preview = field.querySelector(".photo-upload__preview");
    const placeholder = preview.querySelector("svg");
    const image = preview.querySelector("img");
    const error = field.querySelector(".photo-upload__error");
    let objectUrl = null;

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
    }

    function clear() {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      input.value = "";
      image.removeAttribute("src");
      image.hidden = true;
      placeholder.style.display = "";
      remove.hidden = true;
      button.textContent = "Upload photo";
      field.classList.remove("has-photo");
    }

    input.addEventListener("change", () => {
      const file = input.files[0];

      error.hidden = true;
      error.textContent = "";
      input.removeAttribute("aria-invalid");

      if (!file) {
        clear();
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.test(file.name)) {
        clear();
        showError("Please choose a PNG or JPG image.");
        return;
      }

      if (file.size > MAX_BYTES) {
        clear();
        showError("The photo must be 2MB or smaller.");
        return;
      }

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      image.src = objectUrl;
      image.hidden = false;
      placeholder.style.display = "none";
      remove.hidden = false;
      button.textContent = "Change photo";
      field.classList.add("has-photo");
    });

    remove.addEventListener("click", () => {
      clear();
      error.hidden = true;
      input.removeAttribute("aria-invalid");
      input.focus();
    });

    // form.reset() clears the input value but not the preview; resync after it runs
    input.form?.addEventListener("reset", () => {
      setTimeout(() => {
        clear();
        error.hidden = true;
        input.removeAttribute("aria-invalid");
      });
    });
  }

  document.querySelectorAll("[data-photo-upload]").forEach(init);
})();
