/*==========================================================
    CONTACT SUPPORT
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  initializeLucide();
  initializeBackButton();
  initializePrioritySelector();
  initializeSupportForm();
  initializeFormReset();
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
    BACK BUTTON
==========================================================*/

function initializeBackButton() {
  const button = document.getElementById("backSupportBtn");

  if (!button) return;

  button.addEventListener("click", () => {
    window.location.href = "support.html";
  });
}

/*==========================================================
    PRIORITY SELECTOR
==========================================================*/

function initializePrioritySelector() {
  const pills = document.querySelectorAll(".priority-pill");

  const hiddenInput = document.getElementById("priority");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((item) => {
        item.classList.remove("active");
      });

      pill.classList.add("active");

      hiddenInput.value = pill.dataset.priority;
    });
  });
}

/*==========================================================
    SUPPORT FORM
==========================================================*/

function initializeSupportForm() {
  const form = document.getElementById("contactSupportForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);

    await submitSupportTicket(formData);
  });
}

/*==========================================================
    SUBMIT SUPPORT TICKET
==========================================================*/

async function submitSupportTicket(formData) {
  /*
    ===========================================

    Backend Endpoint

    POST

    /api/support/contact

    Example

    await fetch("/api/support/contact",{

        method:"POST",

        body:formData

    });

    ===========================================
    */

  console.log(Object.fromEntries(formData));

  notify("Support request submitted successfully.");
}

/*==========================================================
    RESET FORM
==========================================================*/

function initializeFormReset() {
  const form = document.getElementById("contactSupportForm");

  const resetButton = document.getElementById("clearFormBtn");

  if (!form || !resetButton) return;

  resetButton.addEventListener("click", () => {
    form.reset();

    document.querySelectorAll(".priority-pill").forEach((item) => {
      item.classList.remove("active");
    });

    const normal = document.querySelector('[data-priority="normal"]');

    if (normal) {
      normal.classList.add("active");
    }

    document.getElementById("priority").value = "normal";
  });
}

/*==========================================================
    NOTIFICATION
==========================================================*/

function notify(message) {
  /*
    Replace with dashboard toast
    notification component.
    */

  alert(message);
}
