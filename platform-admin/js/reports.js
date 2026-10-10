/* ==========================================
   REPORTS & ANALYTICS
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================
     CHART DATA
  =========================================== */

  const charts = [
    {
      selector: "#schoolGrowthChart",
      max: 12,
    },
    {
      selector: "#examActivityChart",
      max: 800,
    },
  ];

  /* ==========================================
     INITIALIZE BAR CHARTS
  =========================================== */

  function initializeCharts() {
    charts.forEach((chart) => {
      const container = document.querySelector(chart.selector);

      if (!container) return;

      const columns = container.querySelectorAll(".chart-column");

      columns.forEach((column) => {
        const value = Number(column.dataset.value);

        const percentage = (value / chart.max) * 100;

        const bar = column.querySelector(".bar-fill");

        if (!bar) return;

        bar.style.height = `${percentage}%`;
      });
    });
  }

  /* ==========================================
     GLOBAL SEARCH
  =========================================== */

  const globalSearch = document.getElementById("globalSearch");

  if (globalSearch) {
    globalSearch.addEventListener("input", (event) => {
      const value = event.target.value.trim().toLowerCase();

      /*
       * Global search can later be connected
       * to platform-wide search results.
       */

      if (!value) return;

      console.log(`Searching platform for: ${value}`);
    });
  }

  initializeCharts();
});
