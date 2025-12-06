document.addEventListener("DOMContentLoaded", () => {
  // フッターの年号を自動更新
  const yearEl = document.getElementById("js-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
});
