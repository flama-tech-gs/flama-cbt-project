(() => {
  "use strict";

  let dialog;
  let messageElement;
  const pendingMessages = [];
  let isOpen = false;

  function createDialog() {
    if (!document.body || dialog) return;

    const style = document.createElement("style");
    style.textContent = `
      .teacher-feedback-dialog { position: fixed; inset: 50% auto auto 50%; transform: translate(-50%, -50%); margin: 0; z-index: 2147483000; width: min(440px, calc(100vw - 32px)); max-width: none; padding: 0; border: 0; border-radius: 18px; color: #1f2937; box-shadow: 0 24px 80px rgba(15, 35, 20, .28); }
      .teacher-feedback-dialog::backdrop { background: rgba(20, 35, 24, .5); backdrop-filter: blur(3px); }
      .teacher-feedback-dialog__content { padding: 26px; font: 15px/1.55 Inter, system-ui, sans-serif; }
      .teacher-feedback-dialog h2 { margin: 0 0 9px; color: #203a23; font-size: 1.15rem; }
      .teacher-feedback-dialog p { margin: 0; color: #52615a; white-space: pre-wrap; overflow-wrap: anywhere; }
      .teacher-feedback-dialog__actions { display: flex; justify-content: flex-end; margin-top: 22px; }
      .teacher-feedback-dialog button { min-height: 42px; padding: 9px 20px; border: 0; border-radius: 9px; color: #fff; background: #16713b; font: inherit; font-weight: 650; cursor: pointer; }
    `;
    document.head.append(style);

    dialog = document.createElement("dialog");
    dialog.className = "teacher-feedback-dialog";
    dialog.setAttribute("aria-labelledby", "teacherFeedbackTitle");
    dialog.innerHTML = `
      <div class="teacher-feedback-dialog__content">
        <h2 id="teacherFeedbackTitle">Teacher Portal</h2>
        <p id="teacherFeedbackMessage"></p>
        <div class="teacher-feedback-dialog__actions"><button type="button">Okay</button></div>
      </div>
    `;
    messageElement = dialog.querySelector("#teacherFeedbackMessage");
    dialog.querySelector("button").addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", () => {
      isOpen = false;
      if (pendingMessages.length) showNext();
    });
    document.body.append(dialog);
    if (pendingMessages.length) showNext();
  }

  function closeDialog() {
    if (dialog?.open) dialog.close();
  }

  function showNext() {
    if (!dialog || isOpen || !pendingMessages.length) return;
    messageElement.textContent = pendingMessages.shift();
    isOpen = true;
    dialog.showModal();
    dialog.querySelector("button").focus();
  }

  window.alert = (message) => {
    pendingMessages.push(String(message ?? ""));
    createDialog();
    showNext();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createDialog, { once: true });
  } else {
    createDialog();
  }
})();
