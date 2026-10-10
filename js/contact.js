const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const button = contactForm.querySelector("button");

    button.disabled = true;
    button.textContent = "Sending...";

    // Replace with API call later

    setTimeout(() => {
      button.disabled = false;
      button.textContent = "Send Message";
      contactForm.reset();
    }, 1500);
  });
}
