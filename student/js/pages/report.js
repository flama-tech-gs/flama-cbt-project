// TERM SWITCHING
const termButtons = document.querySelectorAll(".term-selector button");

termButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    termButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Simulate content change (later connect to backend)
    console.log(`${btn.textContent} selected`);
  });
});

// PRINT FUNCTION
const printBtn = document.querySelector(".print-btn");

printBtn.addEventListener("click", () => {
  window.print();
});

const toggles = document.querySelectorAll(".term-toggle");

toggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const content = toggle.nextElementSibling;
    content.classList.toggle("hidden");
  });
});

const subjects = [{ name: "Math", total: 100 }];

// updated changes to be made

// SIDEBAR ACTIVE STATE
const classButtons = document.querySelectorAll(".sidebar button");

classButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    classButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// TERM DROPDOWN LOGIC
const termToggles = document.querySelectorAll(".term-toggle");

termToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const content = toggle.nextElementSibling;

    // close others (accordion behavior)
    document.querySelectorAll(".term-content").forEach((c) => {
      if (c !== content) c.classList.add("hidden");
    });

    document.querySelectorAll(".term-toggle").forEach((t) => {
      if (t !== toggle) t.classList.remove("active");
    });

    // toggle current
    content.classList.toggle("hidden");
    toggle.classList.toggle("active");
  });
});

// PRINT FUNCTION
const printBtn = document.querySelector(".print-btn");

printBtn.addEventListener("click", () => {
  window.print();
});
