(() => {
  const nativeAlert = window.alert.bind(window);
  window.alert = (message) => {
    if (!document.body) return nativeAlert(message);
    let region = document.getElementById("principalToastRegion");
    if (!region) {
      region = document.createElement("div");
      region.id = "principalToastRegion";
      region.className = "principal-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "false");
      document.body.appendChild(region);
    }
    const toast = document.createElement("section");
    toast.className = "principal-toast";
    toast.setAttribute("role", "status");
    const mark = document.createElement("span");
    mark.className = "principal-toast__mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "i";
    const content = document.createElement("p");
    content.textContent = String(message ?? "");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "principal-toast__close";
    close.setAttribute("aria-label", "Close notification");
    close.textContent = "×";
    const dismiss = () => toast.remove();
    close.addEventListener("click", dismiss);
    toast.append(mark, content, close);
    region.appendChild(toast);
    window.setTimeout(dismiss, 5000);
  };
  const style = document.createElement("style");
  style.textContent = `
    .principal-toast-region{position:fixed;z-index:99999;top:20px;right:20px;display:grid;gap:12px;width:min(390px,calc(100vw - 40px));pointer-events:none}
    .principal-toast{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:15px 16px;background:#fff;border:1px solid #cfe4d1;border-left:4px solid #2e7d32;border-radius:14px;box-shadow:0 16px 40px rgba(20,50,25,.18);color:#243b27;font:500 14px/1.45 Inter,system-ui,sans-serif;animation:principalToastIn .22s ease-out}
    .principal-toast__mark{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#eaf6eb;color:#2e7d32;font-weight:800}
    .principal-toast p{flex:1;margin:0}.principal-toast__close{border:0;background:transparent;color:#64748b;font-size:22px;line-height:1;cursor:pointer}
    @keyframes principalToastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  `;
  (document.head || document.documentElement).appendChild(style);
})();
