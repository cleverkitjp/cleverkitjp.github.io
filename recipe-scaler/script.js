// 単位→ml の変換（体積系のみ）
const UNIT_TO_ML = {
  "小さじ": 5,
  "大さじ": 15,
  "カップ": 200,
  "ml": 1
};

const VOLUME_UNITS = ["小さじ", "大さじ", "カップ", "ml"];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("ingredientsContainer");
  const addBtn = document.getElementById("addIngredientBtn");
  const calcBtn = document.getElementById("calcBtn");
  const copyBtn = document.getElementById("copyBtn");
  const resultCard = document.getElementById("resultCard");

  // 初期カードを3つ追加
  addIngredientCard(container, { name: "醤油", amount: 2, unit: "大さじ" });
  addIngredientCard(container, { name: "砂糖", amount: 1, unit: "小さじ" });
  addIngredientCard(container, { name: "卵", amount: 2, unit: "個" });

  addBtn.addEventListener("click", () => {
    addIngredientCard(container);
  });

  calcBtn.addEventListener("click", () => {
    calculateAndRender();
    resultCard.style.display = "block";
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  copyBtn.addEventListener("click", () => {
    copyResultsToClipboard();
  });
});

/**
 * 材料カードを追加
 */
function addIngredientCard(container, defaults = {}) {
  const card = document.createElement("div");
  card.className = "ingredient-card";

  card.innerHTML = `
    <div class="ingredient-card-header">
      <div class="ingredient-card-header-title">材料</div>
      <button type="button" class="btn-danger" onclick="deleteIngredientCard(this)">削除</button>
    </div>
    <div class="field">
      <label>食材名</label>
      <input type="text" class="ing-name" placeholder="例：醤油" value="${defaults.name ?? ""}">
    </div>
    <div class="ingredient-row">
      <div class="field field-amount">
        <label>分量</label>
        <input type="number" class="ing-amount" step="0.1" min="0" value="${defaults.amount ?? ""}">
      </div>
      <div class="field field-unit">
        <label>単位</label>
        <select class="ing-unit">
          ${renderUnitOptions(defaults.unit)}
        </select>
      </div>
    </div>
  `;

  container.appendChild(card);
}

function renderUnitOptions(selected) {
  const units = ["小さじ", "大さじ", "カップ", "ml", "個"];
  return units
    .map(
      (u) =>
        `<option value="${u}" ${u === selected ? "selected" : ""}>${u}</option>`
    )
    .join("");
}

/**
 * 材料カードを削除
 */
function deleteIngredientCard(button) {
  const container = document.getElementById("ingredientsContainer");
  const cards = container.querySelectorAll(".ingredient-card");
  if (cards.length <= 1) {
    showToast("材料は少なくとも1つ必要です");
    return;
  }
  const card = button.closest(".ingredient-card");
  card.remove();
}

/**
 * 計算＆結果テーブル描画
 */
function calculateAndRender() {
  const originalServings = parseFloat(
    document.getElementById("originalServings").value
  );
  const targetServings = parseFloat(
    document.getElementById("targetServings").value
  );
  const recipeName = document.getElementById("recipeName").value.trim();

  if (!originalServings || !targetServings || originalServings <= 0) {
    showToast("人数を正しく入力してください");
    return;
  }

  const ratio = targetServings / originalServings;

  const container = document.getElementById("ingredientsContainer");
  const cards = container.querySelectorAll(".ingredient-card");

  const rows = [];

  cards.forEach((card) => {
    const nameInput = card.querySelector(".ing-name");
    const amountInput = card.querySelector(".ing-amount");
    const unitSelect = card.querySelector(".ing-unit");

    const name = (nameInput.value || "").trim();
    const amount = parseFloat(amountInput.value);
    const unit = unitSelect.value;

    if (!name && !amount) {
      return; // 両方空は無視
    }
    if (!amount || amount <= 0) {
      return; // 0や未入力はスキップ
    }

    const scaled = amount * ratio;

    let naturalText = "";
    let mlText = "-";

    if (unit === "個") {
      naturalText = formatPieces(scaled, name);
    } else if (VOLUME_UNITS.includes(unit)) {
      const baseMl = UNIT_TO_ML[unit] * scaled;
      naturalText = formatVolumeNice(baseMl);
      mlText = round1(baseMl) + "ml";
    } else {
      // 未対応単位
      naturalText = round1(scaled) + unit;
    }

    rows.push({ name, naturalText, mlText });
  });

  renderResult(recipeName, targetServings, rows);
}

/**
 * 個数の自然な表現
 */
function formatPieces(value, name) {
  const intPart = Math.floor(value);
  const frac = value - intPart;

  if (value < 1 && frac > 0) {
    return `${name} 少々`;
  }

  if (frac < 0.25) {
    return `${intPart}個`;
  } else if (frac > 0.75) {
    return `${intPart + 1}個`;
  } else {
    return `${intPart}個＋少々`;
  }
}

/**
 * mlを「大さじ＋小さじ」などに分解
 */
function formatVolumeNice(totalMl) {
  if (!totalMl || totalMl <= 0) return "-";

  let ml = totalMl;

  const tbsp = Math.floor(ml / 15);
  ml -= tbsp * 15;

  let tsp = ml / 5;
  // 小さじは0.5刻みに丸める
  tsp = Math.round(tsp * 2) / 2;

  const parts = [];
  if (tbsp > 0) {
    parts.push(`大さじ${tbsp}`);
  }
  if (tsp > 0) {
    parts.push(`小さじ${tsp}`);
  }

  if (parts.length === 0) {
    return `${round1(totalMl)}ml`;
  }
  return parts.join("＋");
}

/**
 * 結果テーブルをDOMに描画
 */
function renderResult(recipeName, targetServings, rows) {
  const titleEl = document.getElementById("resultRecipeTitle");
  const servingsEl = document.getElementById("resultServings");
  const tbody = document
    .getElementById("resultTable")
    .querySelector("tbody");

  titleEl.textContent = recipeName || "レシピ名未入力";
  servingsEl.textContent = targetServings
    ? `${targetServings}人分`
    : "";

  tbody.innerHTML = "";

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "有効な材料が入力されていません。";
    tbody.appendChild(tr);
    tr.appendChild(td);
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    const tdNatural = document.createElement("td");
    const tdMl = document.createElement("td");

    tdName.textContent = r.name;
    tdNatural.textContent = r.naturalText;
    tdMl.textContent = r.mlText;

    tr.appendChild(tdName);
    tr.appendChild(tdNatural);
    tr.appendChild(tdMl);
    tbody.appendChild(tr);
  });
}

/**
 * 結果をテキストにしてクリップボードへコピー
 */
function copyResultsToClipboard() {
  const recipeName = document.getElementById("resultRecipeTitle").textContent;
  const servingsText = document.getElementById("resultServings").textContent;

  const rows = document.querySelectorAll("#resultTable tbody tr");
  if (!rows.length) {
    showToast("コピーする結果がありません");
    return;
  }

  const lines = [];
  lines.push(`【${recipeName}】${servingsText}`);
  lines.push("");

  rows.forEach((tr) => {
    const tds = tr.querySelectorAll("td");
    if (tds.length !== 3) return;
    const name = tds[0].textContent.trim();
    const nat = tds[1].textContent.trim();
    const ml = tds[2].textContent.trim();
    if (!name) return;

    if (ml && ml !== "-") {
      lines.push(`${name}：${nat}（${ml}）`);
    } else {
      lines.push(`${name}：${nat}`);
    }
  });

  const text = lines.join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("コピーしました");
      })
      .catch(() => {
        legacyCopy(text);
      });
  } else {
    legacyCopy(text);
  }
}

function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
    showToast("コピーしました");
  } catch (e) {
    showToast("コピーに失敗しました");
  }
  document.body.removeChild(area);
}

/**
 * 小数1桁に丸め
 */
function round1(value) {
  return Math.round(value * 10) / 10;
}

/**
 * トースト表示
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}
