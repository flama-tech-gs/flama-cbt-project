(() => {
  "use strict";

  document.documentElement.style.visibility = "hidden";

  const hostname = window.location.hostname.toLowerCase();
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");
  const schoolDomainSuffixes = [".creativesbee.site", ".cbt-frontend-sjlh.onrender.com", ".flama.com", ".localhost"];
  const isSchoolHost = schoolDomainSuffixes.some((suffix) => hostname.endsWith(suffix));
  const schoolSubdomain = String(schoolDomainSuffixes
    .filter((suffix) => hostname.endsWith(suffix))
    .map((suffix) => hostname.slice(0, -suffix.length))[0] || "").trim().toLowerCase();
  const validSchoolSubdomain =
    schoolSubdomain.length >= 3 &&
    schoolSubdomain.length <= 30 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(schoolSubdomain);

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function renderError({
    code = "404",
    eyebrow = "FLAMA · SCHOOL PORTAL",
    title = "We can’t find this school",
    message = "The school address may be incorrect, or this school may not be registered on Flama.",
    detail = hostname,
    buttonText = "Try again",
  } = {}) {
    document.title = `${code} — ${title}`;

    const render = () => {
      document.body.innerHTML = `
        <main class="tenant-error">
          <div class="ambient ambient-one"></div>
          <div class="ambient ambient-two"></div>

          <header class="error-brand">
            <div class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M20 3.5 35.5 12.4v15.2L20 36.5 4.5 27.6V12.4L20 3.5Z"
                  stroke="currentColor" stroke-width="2.5"/>
                <path d="m12.5 20.5 5 5 10-11"
                  stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span>flama</span>
          </header>

          <section class="error-card" aria-labelledby="errorTitle">
            <div class="illustration" aria-hidden="true">
              <div class="orbit orbit-a"></div>
              <div class="orbit orbit-b"></div>
              <div class="error-number">${escapeHtml(code)}</div>
              <div class="floating-dot dot-a"></div>
              <div class="floating-dot dot-b"></div>
              <div class="floating-dot dot-c"></div>
              <div class="search-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="21" cy="21" r="12.5"
                    stroke="currentColor" stroke-width="3"/>
                  <path d="m30 30 10 10"
                    stroke="currentColor" stroke-width="3"
                    stroke-linecap="round"/>
                  <path d="M17 21h8M21 17v8"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round"/>
                </svg>
              </div>
            </div>

            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h1 id="errorTitle">${escapeHtml(title)}</h1>
            <p class="error-message">${escapeHtml(message)}</p>

            <div class="address-box">
              <span class="address-indicator"></span>
              <span class="address-label">Address checked</span>
              <code>${escapeHtml(detail)}</code>
            </div>

            <button class="retry-button" type="button">
              <span>${escapeHtml(buttonText)}</span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10h12M10 4l6 6-6 6"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <p class="help-text">
              Check the school subdomain or contact your school administrator.
            </p>
          </section>

          <footer class="error-footer">
            <span>Learning starts here.</span>
            <span>Flama CBT</span>
          </footer>
        </main>

        <style>
          :root {
            color-scheme: light;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system,
              BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f4f6fb;
            color: #19233b;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            min-width: 320px;
          }

          .tenant-error {
            position: relative;
            isolation: isolate;
            min-height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 30px clamp(20px, 5vw, 72px) 24px;
            background:
              radial-gradient(ellipse at 50% 42%, #fff 0%, #f7f8fc 45%, #eef1f8 100%);
          }

          .ambient {
            position: absolute;
            z-index: -1;
            width: 360px;
            height: 360px;
            border-radius: 50%;
            filter: blur(80px);
            opacity: .38;
            pointer-events: none;
          }

          .ambient-one {
            top: -170px;
            left: -130px;
            background: #93a8ff;
          }

          .ambient-two {
            right: -150px;
            bottom: -190px;
            background: #a3e8dc;
          }

          .error-brand {
            width: min(100%, 1080px);
            display: flex;
            align-items: center;
            gap: 10px;
            color: #273c8f;
            font-size: 1.3rem;
            font-weight: 800;
            letter-spacing: -.06em;
          }

          .brand-mark {
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border-radius: 11px;
            background: #e8edff;
          }

          .brand-mark svg { width: 26px; height: 26px; }

          .error-card {
            width: min(100%, 520px);
            margin: 30px 0;
            padding: clamp(28px, 6vw, 54px);
            border: 1px solid rgba(222, 227, 240, .9);
            border-radius: 28px;
            background: rgba(255, 255, 255, .88);
            box-shadow:
              0 30px 90px rgba(35, 48, 91, .10),
              0 4px 14px rgba(35, 48, 91, .04);
            text-align: center;
            backdrop-filter: blur(14px);
            animation: card-enter .55s cubic-bezier(.2,.75,.25,1) both;
          }

          .illustration {
            position: relative;
            width: 190px;
            height: 150px;
            margin: 0 auto 24px;
            display: grid;
            place-items: center;
          }

          .error-number {
            color: #e9edfb;
            font-size: 5.7rem;
            line-height: 1;
            font-weight: 850;
            letter-spacing: -.09em;
          }

          .orbit {
            position: absolute;
            inset: 13px 8px;
            border: 1px solid #e3e8f7;
            border-radius: 50%;
            transform: rotate(-22deg);
          }

          .orbit-b {
            inset: 27px 0;
            border-color: #e8eef5;
            transform: rotate(27deg);
          }

          .search-icon {
            position: absolute;
            top: 42px;
            left: 73px;
            width: 54px;
            height: 54px;
            display: grid;
            place-items: center;
            color: #fff;
            border: 5px solid #fff;
            border-radius: 18px;
            background: linear-gradient(145deg, #596fe0, #394fc0);
            box-shadow: 0 12px 25px rgba(68, 87, 194, .27);
            transform: rotate(-9deg);
          }

          .search-icon svg { width: 32px; height: 32px; }

          .floating-dot {
            position: absolute;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #8e9dec;
            animation: float 3s ease-in-out infinite;
          }

          .dot-a { top: 23px; left: 37px; }
          .dot-b { top: 34px; right: 27px; width: 6px; height: 6px; background: #79cdbd; animation-delay: .6s; }
          .dot-c { bottom: 18px; right: 52px; width: 7px; height: 7px; background: #f0c16a; animation-delay: 1.1s; }

          .eyebrow {
            margin: 0 0 12px;
            color: #566bd1;
            font-size: .72rem;
            font-weight: 800;
            letter-spacing: .16em;
          }

          .error-card h1 {
            margin: 0;
            color: #1c2742;
            font-size: clamp(1.65rem, 5vw, 2.15rem);
            letter-spacing: -.045em;
          }

          .error-message {
            max-width: 390px;
            margin: 14px auto 24px;
            color: #65708a;
            font-size: .98rem;
            line-height: 1.7;
          }

          .address-box {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 12px 14px;
            border: 1px solid #e8ebf4;
            border-radius: 12px;
            background: #f8f9fc;
            text-align: left;
          }

          .address-indicator {
            flex: 0 0 auto;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #e17070;
            box-shadow: 0 0 0 4px #fcecec;
          }

          .address-label {
            color: #858da1;
            font-size: .78rem;
            white-space: nowrap;
          }

          .address-box code {
            min-width: 0;
            margin-left: auto;
            overflow: hidden;
            color: #35415f;
            font-size: .8rem;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .retry-button {
            width: 100%;
            min-height: 50px;
            margin-top: 18px;
            padding: 0 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: 0;
            border-radius: 13px;
            color: #fff;
            background: linear-gradient(105deg, #4d64d3, #394db5);
            box-shadow: 0 10px 22px rgba(67, 85, 190, .2);
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            transition: transform .18s ease, box-shadow .18s ease;
          }

          .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 26px rgba(67, 85, 190, .27);
          }

          .retry-button svg { width: 19px; height: 19px; }

          .help-text {
            margin: 18px 0 0;
            color: #9299aa;
            font-size: .78rem;
            line-height: 1.5;
          }

          .error-footer {
            width: min(100%, 1080px);
            display: flex;
            justify-content: space-between;
            color: #9299aa;
            font-size: .78rem;
          }

          @keyframes card-enter {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }

          @media (max-width: 480px) {
            .tenant-error { padding-top: 20px; padding-bottom: 18px; }
            .error-card { border-radius: 22px; }
            .illustration { transform: scale(.9); margin-bottom: 12px; }
            .address-box { gap: 7px; }
            .address-label { font-size: .7rem; }
            .address-box code { font-size: .72rem; }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: .01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: .01ms !important;
            }
          }
        </style>
      `;

      document.querySelector(".retry-button")
        ?.addEventListener("click", () => window.location.reload());

      document.documentElement.style.visibility = "visible";
    };

    if (document.body) {
      render();
    } else {
      document.addEventListener("DOMContentLoaded", render, { once: true });
    }
  }

  if (!isSchoolHost || !validSchoolSubdomain) {
    renderError({
      title: "School address required",
      message: "Open the portal using your school's Flama subdomain.",
      code: "404",
    });
    return;
  }

  const apiBase = isLocalHost
    ? `${window.location.protocol}//${hostname}:5000/api`
    : "https://flama.onrender.com/api";

  const schoolInfoUrl = new URL(
    `${apiBase}/tenant/auth/school-info`
  );
  schoolInfoUrl.searchParams.set("_tenantCheck", Date.now());

  fetch(schoolInfoUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-School-Subdomain": schoolSubdomain,
    },
  })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          body.message || body.error || "School was not found."
        );
        error.status = response.status;
        throw error;
      }

      let data = body;

      for (let i = 0; i < 5; i += 1) {
        if (
          data &&
          typeof data === "object" &&
          Object.prototype.hasOwnProperty.call(data, "data")
        ) {
          data = data.data;
        } else {
          break;
        }
      }

      if (!data?.name) {
        throw new Error("The API did not return a school.");
      }

      // This hostname belongs to a registered school; reveal the page.
      document.documentElement.style.visibility = "visible";
    })
    .catch((error) => {
      console.error("Tenant hostname check failed:", error);

      if (error.status === 404) {
        renderError({
          title: "School not found",
          message:
            "This school address isn’t registered with Flama. Check the subdomain and try again.",
          code: "404",
        });
      } else {
        renderError({
          code: "503",
          title: "School portal unavailable",
          message:
            "We couldn’t verify this school right now. Check your connection and try again.",
          detail: hostname,
          buttonText: "Retry connection",
        });
      }
    });
})();
