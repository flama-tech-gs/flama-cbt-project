/* ==========================================
   SUPPORT TICKETS
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("ticketSearch");

  const filterButtons = document.querySelectorAll(".ticket-filter");

  const rows = document.querySelectorAll("#ticketsTableBody tr");

  let currentFilter = "all";

  /* ==========================================
     FILTER TICKETS
  =========================================== */

  function filterTickets() {
    const searchValue = searchInput.value.trim().toLowerCase();

    rows.forEach((row) => {
      const priority = row.dataset.priority;

      const status = row.dataset.status;

      const rowText = row.textContent.toLowerCase();

      const matchesSearch = !searchValue || rowText.includes(searchValue);

      let matchesFilter = true;

      if (currentFilter === "high") {
        matchesFilter = priority === "high";
      }

      if (currentFilter === "open") {
        matchesFilter = status === "open";
      }

      if (currentFilter === "resolved") {
        matchesFilter = status === "resolved";
      }

      row.style.display = matchesSearch && matchesFilter ? "" : "none";
    });
  }

  /* ==========================================
     SEARCH
  =========================================== */

  searchInput.addEventListener("input", filterTickets);

  /* ==========================================
     FILTER BUTTONS
  =========================================== */

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      currentFilter = button.dataset.filter;

      filterTickets();
    });
  });

  /* ==========================================
     OPEN TICKET
  =========================================== */

  const openButtons = document.querySelectorAll(".open-ticket-btn");

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const ticketId = button.dataset.ticket;

      /*
       * Later:
       *
       * window.location.href =
       * `./ticket-details.html?id=${ticketId}`;
       */

      console.log(`Opening support ticket #${ticketId}`);
    });
  });
});
