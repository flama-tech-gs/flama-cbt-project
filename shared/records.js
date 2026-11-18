(() => {
  const page = document.querySelector("[data-record-kind]");
  if (!page) return;
  const kind = page.dataset.recordKind;
  const principal = page.dataset.portal === "principal";
  const readOnly = principal && (kind === "sessions" || kind === "terms");
  const tokenKey = principal ? "principalAccessToken" : "flamaAccessToken";
  const endpoint = principal
    ? ({ sessions: "/session", terms: "/term", classes: "/class" }[kind])
    : `/owner/${kind}`;
  const apiBase = window.FLAMA_API_BASE || ((["localhost", "127.0.0.1"].includes(location.hostname) || location.hostname.endsWith(".localhost")) ? `${location.protocol}//${location.hostname}:5000/api` : "https://flama.onrender.com/api");
  const token = sessionStorage.getItem(tokenKey);
  const list = document.getElementById("recordList");
  const form = document.getElementById("recordForm");
  const dialog = document.getElementById("recordDialog");
  const confirmDialog = document.getElementById("deleteDialog");
  const toastRegion = document.getElementById("recordToasts");
  let records = [];
  let sessions = [];
  let editingId = null;
  let deletingId = null;

  const title = ({ sessions: "Academic Sessions", terms: "Academic Terms", classes: "Classes" })[kind];
  document.title = `${title} | Flama`;
  document.querySelector("[data-page-title]").textContent = title;

  function toast(message, error = false) {
    const node = document.createElement("div");
    node.className = `record-toast${error ? " is-error" : ""}`;
    node.textContent = message;
    toastRegion.appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }
  function unwrap(value) {
    let data = value;
    for (let i = 0; i < 5 && data && typeof data === "object" && data.data !== undefined; i += 1) data = data.data;
    return data;
  }
  async function request(path = "", options = {}) {
    if (!token) throw new Error("Your access session has expired. Please sign in again.");
    const response = await fetch(`${apiBase}${endpoint}${path}`, {
      ...options,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) throw new Error(result.message || `Request failed (${response.status})`);
    return unwrap(result);
  }
  function recordsFrom(payload) {
    if (kind === "sessions") return payload.sessions || (Array.isArray(payload) ? payload : []);
    if (kind === "terms") return payload.terms || (Array.isArray(payload) ? payload : []);
    return payload.classes || (Array.isArray(payload) ? payload : []);
  }
  function dateValue(value) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
  function niceTerm(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

  async function loadSessions() {
    if (kind !== "terms") return;
    const saved = await fetch(`${apiBase}${principal ? "/session" : "/owner/sessions"}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    const body = unwrap(await saved.json());
    sessions = body.sessions || (Array.isArray(body) ? body : []);
    const select = form?.elements.namedItem("academicSession");
    if (!select) return;
    select.replaceChildren(new Option("Select academic session", ""));
    sessions.forEach((session) => select.add(new Option(session.name, session._id || session.id)));
  }
  function render() {
    if (!records.length) {
      const emptyMessage = readOnly
        ? "The school owner has not added any yet."
        : "Create one using the form to get started.";
      list.innerHTML = `<div class="records-empty"><span>▤</span><h2>No ${title.toLowerCase()} yet</h2><p>${emptyMessage}</p></div>`;
      return;
    }
    list.innerHTML = records.map((record) => {
      const id = record._id || record.id;
      const detail = kind === "sessions"
        ? `${dateValue(record.startDate)} to ${dateValue(record.endDate)} · ${record.status || "UPCOMING"}`
        : kind === "terms"
          ? `${niceTerm(record.name)} · ${record.academicSession?.name || sessions.find((s) => (s._id || s.id) === (record.academicSession?._id || record.academicSession))?.name || "Session"} · ${dateValue(record.startDate)} to ${dateValue(record.endDate)} · ${record.status || "UPCOMING"}`
          : `${record.code || "—"} · ${record.level || "—"}${record.description ? ` · ${record.description}` : ""}`;
      const statusControl = !principal && (kind === "sessions" || kind === "terms")
        ? `<label class="record-status-control"><span class="sr-only">Status for ${escapeHtml(record.name)}</span><select data-status-for="${escapeHtml(id)}">${["UPCOMING", "ACTIVE", "COMPLETED"].map((status) => `<option value="${status}"${(record.status || "UPCOMING") === status ? " selected" : ""}>${status.charAt(0)}${status.slice(1).toLowerCase()}</option>`).join("")}</select><button class="record-btn" data-save-status="${escapeHtml(id)}">Update</button></label>`
        : "";
      const actions = readOnly ? "" : `<div class="record-actions">${statusControl}<button class="record-btn" data-edit="${escapeHtml(id)}">Edit</button><button class="record-btn danger" data-delete="${escapeHtml(id)}">Delete</button></div>`;
      return `<article class="record-card"><div><h2>${escapeHtml(kind === "terms" ? niceTerm(record.name) : record.name)}</h2><p>${escapeHtml(detail)}</p></div>${actions}</article>`;
    }).join("");
  }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  async function refresh() {
    try {
      if (kind === "terms") await loadSessions();
      records = recordsFrom(await request());
      render();
    } catch (error) { toast(error.message, true); }
  }
  function fields(record = {}) {
    document.getElementById("recordFields").replaceChildren();
    const definitions = kind === "sessions"
      ? [{ name: "name", label: "Session name", placeholder: "2026/2027", required: true }, { name: "startDate", label: "Start date", type: "date", required: true }, { name: "endDate", label: "End date", type: "date", required: true }]
      : kind === "terms"
        ? [{ name: "academicSession", label: "Academic session", type: "session", required: true }, { name: "name", label: "Term", type: "term", required: true }, { name: "startDate", label: "Start date", type: "date", required: true }, { name: "endDate", label: "End date", type: "date", required: true }]
        : [{ name: "name", label: "Class name", placeholder: "JSS 1A", required: true }, { name: "code", label: "Class code", placeholder: "JSS1A", required: true }, { name: "level", label: "Level", placeholder: "JSS 1", required: true }, { name: "description", label: "Description", placeholder: "Optional description" }];
    for (const item of definitions) {
      const group = document.createElement("label"); group.className = "record-field"; group.textContent = item.label;
      let input;
      if (item.type === "session") {
        input = document.createElement("select");
        input.name = "academicSession";
        input.add(new Option("Select academic session", ""));
        sessions.forEach((session) => input.add(new Option(session.name, session._id || session.id)));
      } else {
        input = item.type === "term" ? document.createElement("select") : document.createElement("input");
        input.name = item.name;
        if (item.type && item.type !== "term") input.type = item.type;
        if (item.type === "term") ["FIRST_TERM", "SECOND_TERM", "THIRD_TERM"].forEach((value) => input.add(new Option(niceTerm(value), value)));
      }
      input.required = Boolean(item.required);
      if (item.placeholder) input.placeholder = item.placeholder;
      if (record[item.name]) input.value = item.type === "date" ? dateValue(record[item.name]) : record[item.name];
      if (item.name === "academicSession" && record.academicSession) input.value = record.academicSession._id || record.academicSession;
      group.appendChild(input); document.getElementById("recordFields").appendChild(group);
    }
  }
  function openEditor(record) {
    editingId = record ? (record._id || record.id) : null;
    document.getElementById("recordDialogTitle").textContent = editingId ? `Edit ${kind === "sessions" ? "session" : kind === "terms" ? "term" : "class"}` : `Create ${kind === "sessions" ? "session" : kind === "terms" ? "term" : "class"}`;
    form.reset(); fields(record || {}); dialog.showModal();
  }

  document.getElementById("createRecordBtn")?.addEventListener("click", () => openEditor());
  document.getElementById("closeRecordDialog")?.addEventListener("click", () => dialog?.close());
  document.getElementById("closeDeleteDialog")?.addEventListener("click", () => confirmDialog?.close());
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    try {
      await request(editingId ? `/${encodeURIComponent(editingId)}` : "", { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      dialog.close(); toast(editingId ? "Changes saved successfully." : `${kind.slice(0, -1)} created successfully.`); await refresh();
    } catch (error) { toast(error.message, true); } finally { button.disabled = false; }
  });
  list.addEventListener("click", (event) => {
    if (readOnly) return;
    const saveStatus = event.target.closest("[data-save-status]");
    if (saveStatus) {
      const recordId = saveStatus.dataset.saveStatus;
      const statusSelect = list.querySelector(`[data-status-for="${CSS.escape(recordId)}"]`);
      const status = statusSelect?.value;
      if (!status) return;
      saveStatus.disabled = true;
      request(`/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status, isCurrent: status === "ACTIVE" }),
      }).then(() => {
        toast(`${kind === "sessions" ? "Session" : "Term"} status updated.`);
        return refresh();
      }).catch((error) => {
        toast(error.message, true);
      }).finally(() => {
        saveStatus.disabled = false;
      });
      return;
    }
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-delete]");
    if (edit) openEditor(records.find((item) => (item._id || item.id) === edit.dataset.edit));
    if (remove) { deletingId = remove.dataset.delete; confirmDialog.showModal(); }
  });
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", async () => {
    const button = document.getElementById("confirmDeleteBtn"); button.disabled = true;
    try { await request(`/${encodeURIComponent(deletingId)}`, { method: "DELETE" }); confirmDialog.close(); toast("Record deleted successfully."); await refresh(); }
    catch (error) { confirmDialog.close(); toast(error.message, true); }
    finally { button.disabled = false; }
  });
  refresh();
})();
