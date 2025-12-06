document.addEventListener("DOMContentLoaded", () => {
  // フッターの年号自動更新
  const yearEl = document.getElementById("js-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // カテゴリフィルタ
  const filterButtons = document.querySelectorAll(".filter-btn");
  const toolCards = document.querySelectorAll(".tool-card");

  if (filterButtons.length && toolCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter || "all";

        // ボタンの見た目更新
        filterButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        // カードの表示・非表示
        toolCards.forEach((card) => {
          const category = (card.dataset.category || "").split(" ");
          if (filter === "all" || category.includes(filter)) {
            card.classList.remove("is-hidden");
          } else {
            card.classList.add("is-hidden");
          }
        });
      });
    });
  }
});
