//backend/subscriptions.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api";
  const ADMIN_BILLING_URL = `${API_BASE_URL}/admin/billing`;

  const getToken = () =>
    sessionStorage.getItem("flamaAccessToken") ||
    sessionStorage.getItem("adminAccessToken") ||
    localStorage.getItem("adminAccessToken") ||
    localStorage.getItem("accessToken");

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  const formatNaira = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("Admin token not found. Please log in again.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(
        typeof result.message === "string"
          ? result.message
          : `Request failed (${response.status})`
      );
    }

    return result.data;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function renderMetrics(metrics = {}) {
    setText(
      "mrrValue",
      formatNaira(metrics.monthlyRecurringRevenue)
    );

    setText(
      "mrrDescription",
      "Active monthly plans and yearly plans divided by 12"
    );

    setText("collectedValue", formatNaira(metrics.collectedThisTerm));
    setText(
      "collectedDescription",
      `${metrics.periodLabel || "This month"} · ${metrics.collectedPaymentCount || 0} successful payments`
    );

    setText("outstandingValue", formatNaira(metrics.outstandingPayments));
    setText(
      "outstandingDescription",
      `${metrics.outstandingPaymentCount || 0} pending or abandoned payments · ${metrics.outstandingSchoolCount || 0} schools`
    );

    setText("churnedSchoolsValue", metrics.churnedSchools || 0);
  }

  function intervalLabel(interval) {
    if (interval === "MONTHLY") return "/month";
    if (interval === "YEARLY") return "/year";
    return "/custom";
  }

  function renderPlans(plans = []) {
    const cards = [...document.querySelectorAll(".pricing-card")];

    plans.forEach((plan) => {
      const card = cards.find((item) => {
        const title = item.querySelector("h3")?.textContent
          ?.trim()
          .toUpperCase();

        const dataName = item.dataset.plan?.trim().toUpperCase();

        return (
          dataName === plan.name.toUpperCase() ||
          title === plan.name.toUpperCase()
        );
      });

      if (!card) return;

      card.dataset.planId = plan._id;

      const priceElement = card.querySelector("[data-plan-price], .price");
      if (priceElement) {
        priceElement.textContent =
          plan.price == null
            ? "Custom pricing"
            : `${formatNaira(plan.price)} ${intervalLabel(plan.billingInterval)}`;
      }

      const button = card.querySelector(".pricing-edit-btn");
      if (button) {
        button.dataset.planId = plan._id;
        button.dataset.planName = plan.name;
      }

      const description = card.querySelector(".pricing-description");
      if (description && plan.description) {
        description.textContent = plan.description;
      }

      const featuresElement = card.querySelector(".pricing-features");
      if (featuresElement && Array.isArray(plan.features) && plan.features.length) {
        featuresElement.innerHTML = plan.features
          .map((feature) => (
            `<li><i data-lucide="check"></i>${escapeHtml(feature)}</li>`
          ))
          .join("");
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function statusLabel(status) {
    return String(status || "PENDING").toLowerCase();
  }

  function renderTransactions(transactions = []) {
    const tbody = document.getElementById("transactionsTableBody");
    if (!tbody) return;

    if (!transactions.length) {
      tbody.innerHTML = '<tr><td colspan="7">No transactions found.</td></tr>';
      return;
    }

    tbody.innerHTML = transactions.map((transaction) => {
      const status = statusLabel(transaction.status);
      const statusText = String(transaction.status || "PENDING")
        .toLowerCase()
        .replace(/^./, (letter) => letter.toUpperCase());

      return `
        <tr>
          <td>${escapeHtml(formatDate(transaction.date))}</td>
          <td>${escapeHtml(transaction.school || "—")}</td>
          <td>${escapeHtml(transaction.plan || "—")}</td>
          <td class="transaction-amount">${escapeHtml(formatNaira(transaction.amount))}</td>
          <td>${escapeHtml(transaction.method || "—")}</td>
          <td>
            <span class="payment-status ${escapeHtml(status)}">
              ${escapeHtml(statusText)}
            </span>
          </td>
          <td>${escapeHtml(transaction.reference || "—")}</td>
        </tr>
      `;
    }).join("");
  }

  function getInitials(name) {
    return String(name || "Admin")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "A";
  }

  function renderAdmin(admin = {}) {
    const name =
      admin.fullName ||
      [admin.firstName, admin.lastName].filter(Boolean).join(" ") ||
      "Administrator";

    const role =
      typeof admin.role === "string"
        ? admin.role
        : admin.role?.name || "ADMIN";

    const avatarUrl =
      typeof admin.avatar === "string" ? admin.avatar.trim() : "";

    setText("sidebarAdminName", name);
    setText("topbarAdminName", name);
    setText("topbarAdminRole", role);

    document
      .querySelectorAll("#sidebarAdminAvatar, #topbarAdminAvatar")
      .forEach((element) => {
        element.replaceChildren();

        if (avatarUrl) {
          const image = document.createElement("img");
          image.src = avatarUrl;
          image.alt = `${name} profile picture`;
          image.referrerPolicy = "no-referrer";

          Object.assign(image.style, {
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          });

          image.onerror = () => {
            element.replaceChildren();
            element.textContent = getInitials(name);
          };

          element.appendChild(image);
        } else {
          element.textContent = getInitials(name);
        }
      });
  }

  async function loadAdminProfile() {
    // Match the working adminDashboard.js endpoint and response shape.
    const data = await apiRequest(`${API_BASE_URL}/admin/dashboard`);

    if (data?.admin) {
      renderAdmin(data.admin);
    }
  }

  async function loadBillingPage() {
    try {
      const [overview, plansData, transactionsData] = await Promise.all([
        apiRequest(`${ADMIN_BILLING_URL}/overview`),
        apiRequest(`${ADMIN_BILLING_URL}/plans`),
        apiRequest(`${ADMIN_BILLING_URL}/transactions?limit=10`),
      ]);

      renderMetrics(overview.metrics);
      renderPlans(plansData.plans || []);
      renderTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error("Failed to load billing data:", error);

      const tbody = document.getElementById("transactionsTableBody");
      if (tbody) {
        tbody.innerHTML =
          `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
      }
    }
  }

  document.querySelectorAll(".pricing-edit-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const planId = button.dataset.planId;
      const planName = button.dataset.planName || button.dataset.plan || "plan";

      if (!planId) {
        window.alert(`Could not find the ID for the ${planName} plan.`);
        return;
      }

      const enteredPrice = window.prompt(
        `Enter the new price for ${planName} in naira:`
      );

      if (enteredPrice === null) return;

      const price = Number(enteredPrice);

      if (!Number.isFinite(price) || price < 0) {
        window.alert("Enter a valid price of 0 or more.");
        return;
      }

      try {
        await apiRequest(
          `${ADMIN_BILLING_URL}/plans/${encodeURIComponent(planId)}/price`,
          {
            method: "PATCH",
            body: JSON.stringify({ price }),
          }
        );

        await loadBillingPage();
        window.alert(`${planName} pricing was updated.`);
      } catch (error) {
        console.error("Plan price update failed:", error);
        window.alert(error.message || "Could not update plan pricing.");
      }
    });
  });

  loadAdminProfile().catch((error) => {
    console.error("Failed to load admin profile:", error);
  });

  loadBillingPage();
});