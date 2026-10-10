// Mobile Navigation

const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

navToggle.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

lucide.createIcons();

// Part 7
// Homepage

/* ==========================
   STATS COUNTER
========================== */

const counters = document.querySelectorAll(".counter");

const animateCounter = (counter) => {
  const target = Number(counter.dataset.target);
  let count = 0;
  const step = Math.ceil(target / 100);

  const update = () => {
    count += step;

    if (count >= target) {
      count = target;
    }

    if (target >= 1000000) {
      counter.textContent = "1M+";
    } else if (target >= 1000) {
      counter.textContent = count.toLocaleString() + "+";
    } else {
      counter.textContent = count + "+";
    }

    if (count < target) {
      requestAnimationFrame(update);
    }
  };

  update();
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }
  });
});

counters.forEach((counter) => observer.observe(counter));

lucide.createIcons();
