/*==========================================================
    HELP & SUPPORT
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeLucide();
  initializeFAQ();
  initializeSupportForm();
  initializeSupportButtons();
});

/*==========================================================
    LUCIDE
==========================================================*/

function initializeLucide() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/*==========================================================
    FAQ ACCORDION
==========================================================*/

function initializeFAQ() {
  const items = document.querySelectorAll(".faq-item");

  items.forEach((item) => {
    const button = item.querySelector(".faq-question");

    button.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      items.forEach((faq) => {
        faq.classList.remove("active");
      });

      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

/*==========================================================
    SUPPORT FORM
==========================================================*/

function initializeSupportForm() {
  const form = document.getElementById("supportForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const data = new FormData(form);

    const submitted = await submitSupportTicket(data);
    if (submitted) form.reset();
  });
}

async function submitSupportTicket(formData) {
  void formData;
  notify("Support ticket submission is not available yet. Your message was not sent.");
  return false;
}

/*==========================================================
    SUPPORT BUTTONS
==========================================================*/

function initializeSupportButtons() {
  document
    .getElementById("documentationBtn")
    ?.addEventListener("click", openDocumentation);

  document
    .getElementById("liveChatBtn")
    ?.addEventListener("click", openLiveChat);

  document
    .getElementById("emailSupportBtn")
    ?.addEventListener("click", sendSupportEmail);

  document
    .getElementById("phoneSupportBtn")
    ?.addEventListener("click", callSupport);
}

/*==========================================================
    DOCUMENTATION
==========================================================*/

function openDocumentation() {
  /*
    Replace with documentation URL

    Example:
    window.location.href="/documentation";

    */

  console.log("Documentation");

  notify("Documentation is not available yet.");
}

/*==========================================================
    LIVE CHAT
==========================================================*/

function openLiveChat() {
  /*
    Integrate:

    Crisp

    Tawk.to

    Intercom

    Zendesk

    etc.

    */

  console.log("Live Chat");

  notify("Live chat is not available yet.");
}

/*==========================================================
    EMAIL SUPPORT
==========================================================*/

function sendSupportEmail() {
  window.location.href =
    "mailto:support@cbtportal.com?subject=School Support Request";
}

/*==========================================================
    PHONE SUPPORT
==========================================================*/

function callSupport() {
  window.location.href = "tel:+2348002280000";
}

/*==========================================================
    NOTIFICATION
==========================================================*/

function notify(message) {
  /*
    Replace with reusable dashboard
    Toast Notification component.
    */

  alert(message);
}
