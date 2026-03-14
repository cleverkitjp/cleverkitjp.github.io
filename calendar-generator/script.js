// ======================================================
//  Calendar Generator - script.js  （保存・復元対応版）
// ======================================================

// 祝日データ
let holidaysMap = {};

// 記号まわり
let activeSymbol = "";
let appliedSymbols = {}; // {"2025-03-20": "●▲" など}

// ローカル保存キー
const STORAGE_KEY = "calendarGeneratorState";
const DEFAULT_PAPER_ALPHA = 0.92;

// ------------------------------------------------------
// ローカルタイムゾーンの日付キー（YYYY-MM-DD）を生成
// ------------------------------------------------------
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ------------------------------------------------------
// 共有フッター読込
// ------------------------------------------------------
function loadSharedFooter() {
  const footerEl = document.getElementById("sharedFooter");
  if (!footerEl) return;

  fetch("https://cleverkitjp.github.io/footer.html")
    .then((res) => res.text())
    .then((html) => {
      footerEl.innerHTML = html;
    })
    .catch(() => {
      footerEl.innerHTML = `<a class="footer-link" href="https://cleverkitjp.github.io/footer.html">フッターを表示</a>`;
    });
}

// ------------------------------------------------------
// 祝日データ取得
// ------------------------------------------------------
async function loadHolidays() {
  try {
    if (Object.keys(holidaysMap).length > 0) return; // 既に取得済みなら再取得しない
    const res = await fetch("https://holidays-jp.github.io/api/v1/date.json");
    if (!res.ok) return;
    holidaysMap = await res.json();
  } catch (e) {
    console.log("祝日データ取得エラー:", e);
  }
}

// ------------------------------------------------------
// テーマ反映
// ------------------------------------------------------
function applyTheme() {
  const themeSelect = document.getElementById("themeSelect");
  if (!themeSelect) return;
  const theme = themeSelect.value;
  document.body.className = (theme === "warm") ? "theme-warm" : "theme-cool";
}

// ------------------------------------------------------
// 下地透明度の反映
// ------------------------------------------------------
function updatePaperAlpha(alphaValue) {
  const alpha = Math.min(1, Math.max(0.6, Number(alphaValue) || DEFAULT_PAPER_ALPHA));
  const cellAlpha = Math.min(1, alpha + 0.04);
  const label = document.getElementById("paperAlphaValue");
  const slider = document.getElementById("paperAlpha");
  if (slider) slider.value = alpha.toFixed(2);
  if (label) label.textContent = `${Math.round(alpha * 100)}%`;
  document.documentElement.style.setProperty("--paper-alpha-frame", alpha);
  document.documentElement.style.setProperty("--paper-alpha-cell", cellAlpha);
}

// ------------------------------------------------------
// 背景画像の適用/解除
// ------------------------------------------------------
function setBackgroundImage(dataUrl) {
  const area = document.getElementById("calendarImageArea");
  if (!area) return;
  if (dataUrl) {
    area.style.setProperty("--calendar-bg-image", `url(${dataUrl})`);
  } else {
    area.style.setProperty("--calendar-bg-image", "none");
  }
}

// ------------------------------------------------------
// 現在の状態を localStorage に保存
// ------------------------------------------------------
function saveState() {
  try {
    const titleInput   = document.getElementById("calendarTitle");
    const startInput   = document.getElementById("startDate");
    const endInput     = document.getElementById("endDate");
    const weekStartSel = document.getElementById("weekStart");
    const themeSelect  = document.getElementById("themeSelect");
    const layoutModeSel= document.getElementById("layoutMode");
    const memoEl       = document.getElementById("memoText");
    const paperAlphaEl = document.getElementById("paperAlpha");

    const symbols = [];
    for (let i = 1; i <= 4; i++) {
      const charEl  = document.getElementById(`sym${i}`);
      const labelEl = document.getElementById(`sym${i}label`);
      symbols.push({
        char:  (charEl  && charEl.value)  || "",
        label: (labelEl && labelEl.value) || ""
      });
    }

    const state = {
      title:      titleInput   ? (titleInput.value   || "") : "",
      startDate:  startInput   ? (startInput.value   || "") : "",
      endDate:    endInput     ? (endInput.value     || "") : "",
      weekStart:  weekStartSel ? (weekStartSel.value || "sun")  : "sun",
      theme:      themeSelect  ? (themeSelect.value  || "cool") : "cool",
      layoutMode: layoutModeSel? (layoutModeSel.value|| "month"): "month",
      symbols,
      memo:       memoEl       ? (memoEl.value       || "") : "",
      paperAlpha: paperAlphaEl ? (paperAlphaEl.value || DEFAULT_PAPER_ALPHA) : DEFAULT_PAPER_ALPHA,
      appliedSymbols
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.log("状態保存エラー:", e);
  }
}

// ------------------------------------------------------
// 状態を復元してカレンダーを再生成
// ------------------------------------------------------
function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      alert("前回のカレンダーが見つかりません。");
      return;
    }

    const state = JSON.parse(raw) || {};

    const titleInput   = document.getElementById("calendarTitle");
    const startInput   = document.getElementById("startDate");
    const endInput     = document.getElementById("endDate");
    const weekStartSel = document.getElementById("weekStart");
    const themeSelect  = document.getElementById("themeSelect");
    const layoutModeSel= document.getElementById("layoutMode");
    const memoEl       = document.getElementById("memoText");
    const paperAlphaEl = document.getElementById("paperAlpha");

    if (titleInput)   titleInput.value   = state.title      || "";
    if (startInput)   startInput.value   = state.startDate  || "";
    if (endInput)     endInput.value     = state.endDate    || "";
    if (weekStartSel) weekStartSel.value = state.weekStart  || "sun";
    if (themeSelect)  themeSelect.value  = state.theme      || "cool";
    if (layoutModeSel)layoutModeSel.value= state.layoutMode || "month";
    if (memoEl)       memoEl.value       = state.memo       || "";
    if (paperAlphaEl) paperAlphaEl.value = state.paperAlpha || DEFAULT_PAPER_ALPHA;

    // 記号とラベル
    if (Array.isArray(state.symbols)) {
      for (let i = 1; i <= 4; i++) {
        const s = state.symbols[i - 1] || {};
        const charEl  = document.getElementById(`sym${i}`);
        const labelEl = document.getElementById(`sym${i}label`);
        if (charEl  && typeof s.char  === "string") charEl.value  = s.char;
        if (labelEl && typeof s.label === "string") labelEl.value = s.label;
      }
    }

    // 記号配置を復元
    appliedSymbols = state.appliedSymbols || {};

    applyTheme();
    updatePaperAlpha(state.paperAlpha || DEFAULT_PAPER_ALPHA);
    autoResizeMemo();
    createSymbolButtons();
    generateCalendar(); // appliedSymbols を見ながら描画

  } catch (e) {
    console.log("状態復元エラー:", e);
    alert("復元に失敗しました。");
  }
}

// ------------------------------------------------------
// 記号ボタンの生成（最大4つ）
// ------------------------------------------------------
function createSymbolButtons() {
  const container = document.getElementById("symbolButtons");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 1; i <= 4; i++) {
    const symCharInput = document.getElementById(`sym${i}`);
    const symChar = symCharInput ? symCharInput.value.trim() : "";
    if (!symChar) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "symbol-btn";
    btn.textContent = symChar;

    btn.addEventListener("click", () => {
      activeSymbol = (activeSymbol === symChar ? "" : symChar);
      document.querySelectorAll(".symbol-btn").forEach(b => b.classList.remove("active"));
      if (activeSymbol) btn.classList.add("active");
    });

    container.appendChild(btn);
  }
}

// ------------------------------------------------------
// 文字列の記号を 2×2 グリッド表示にする
// ------------------------------------------------------
function updateSymbolElement(symElement, symbolString) {
  symElement.innerHTML = "";
  if (!symbolString) return;

  const chars = symbolString.split("");
  chars.forEach(c => {
    const span = document.createElement("span");
    span.textContent = c;
    symElement.appendChild(span);
  });
}

// ------------------------------------------------------
// 指定日付の記号 ON/OFF
// ------------------------------------------------------
function toggleSymbolForDate(dateKey, symbol, symElement) {
  let current = appliedSymbols[dateKey] || "";

  if (current.includes(symbol)) {
    current = current.replace(symbol, "");
  } else {
    if (current.length >= 4) return; // 最大4つ
    current += symbol;
  }

  appliedSymbols[dateKey] = current;
  updateSymbolElement(symElement, current);
  saveState();
}

// ------------------------------------------------------
// 日付範囲の月一覧を取得
// ------------------------------------------------------
function getMonthsInRange(start, end) {
  const months = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

// ------------------------------------------------------
// 曜日ヘッダーを作成
// ------------------------------------------------------
function createWeekdayHeader(weekStart) {
  const names = ["日", "月", "火", "水", "木", "金", "土"];
  let order = [];

  if (weekStart === "mon") {
    order = ["月", "火", "水", "木", "金", "土", "日"];
  } else {
    order = names;
  }

  const div = document.createElement("div");
  div.className = "weekday-header";

  order.forEach(w => {
    const c = document.createElement("div");
    c.textContent = w;
    div.appendChild(c);
  });

  return div;
}

// ------------------------------------------------------
// 月ごとレイアウト
// ------------------------------------------------------
function renderMonthLayout(startDate, endDate, weekStart, area) {
  const months = getMonthsInRange(startDate, endDate);

  months.forEach(monthDate => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();

    const block = document.createElement("div");
    block.className = "month-block";

    const title = document.createElement("div");
    title.className = "month-title";
    title.textContent = `${y}年 ${m + 1}月`;
    block.appendChild(title);

    const weekdayHeader = createWeekdayHeader(weekStart);
    block.appendChild(weekdayHeader);

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    const firstDay   = new Date(y, m, 1);
    const lastDay    = new Date(y, m + 1, 0);
    const daysInMonth= lastDay.getDate();

    const offset =
      weekStart === "sun"
        ? firstDay.getDay()
        : (firstDay.getDay() + 6) % 7;

    const totalCells = offset + daysInMonth;
    const rows       = Math.ceil(totalCells / 7);
    const cells      = rows * 7;

    for (let i = 0; i < cells; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell";

      if (i < offset || i >= offset + daysInMonth) {
        cell.classList.add("day-disabled");
        grid.appendChild(cell);
        continue;
      }

      const day = i - offset + 1;
      const curDate = new Date(y, m, day);
      const dateKey = formatDateKey(curDate);

      const dayNumber = document.createElement("div");
      dayNumber.textContent = day;

      const dow       = curDate.getDay();
      const isSat     = (dow === 6);
      const isSun     = (dow === 0);
      const isHoliday = !!holidaysMap[dateKey];
      const outOfRange= (curDate < startDate || curDate > endDate);

      if (outOfRange) {
        cell.classList.add("day-disabled");
      } else {
        if (isSat) cell.classList.add("sat");
        if (isSun || isHoliday) {
          cell.classList.add("sun");
          if (isHoliday && !isSun) cell.classList.add("holiday");
        }
      }

      cell.appendChild(dayNumber);

      const sym = document.createElement("div");
      sym.className = "symbol";
      updateSymbolElement(sym, appliedSymbols[dateKey] || "");
      cell.appendChild(sym);

      if (!outOfRange) {
        cell.addEventListener("click", () => {
          if (!activeSymbol) return;
          toggleSymbolForDate(dateKey, activeSymbol, sym);
        });
      }

      grid.appendChild(cell);
    }

    block.appendChild(grid);
    area.appendChild(block);
  });
}
// ------------------------------------------------------
// 連続レイアウト（期間全体を1本で表示）
// ------------------------------------------------------
function renderContinuousLayout(startDate, endDate, weekStart, area) {
  const block = document.createElement("div");
  block.className = "month-block";

  const title = document.createElement("div");
  title.className = "month-title";
  title.textContent = `${formatDateKey(startDate)} 〜 ${formatDateKey(endDate)}`;
  block.appendChild(title);

  const weekdayHeader = createWeekdayHeader(weekStart);
  block.appendChild(weekdayHeader);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const startKey = formatDateKey(startDate);

  const first = new Date(startDate);
  const nativeDowStart = first.getDay();
  const offsetDays =
    weekStart === "sun"
      ? nativeDowStart
      : (nativeDowStart + 6) % 7;
  first.setDate(first.getDate() - offsetDays);

  const last = new Date(endDate);
  const nativeDowEnd = last.getDay();
  const offsetEnd =
    weekStart === "sun"
      ? nativeDowEnd
      : (nativeDowEnd + 6) % 7;
  const tailDays = 6 - offsetEnd;
  last.setDate(last.getDate() + tailDays);

  let cur = new Date(first);
  while (cur <= last) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    const dateKey = formatDateKey(cur);
    const dow       = cur.getDay();
    const isSat     = (dow === 6);
    const isSun     = (dow === 0);
    const isHoliday = !!holidaysMap[dateKey];
    const outOfRange= (cur < startDate || cur > endDate);

    const dayNumber = document.createElement("div");
    if (!outOfRange && (dateKey === startKey || cur.getDate() === 1)) {
      dayNumber.textContent = `${cur.getMonth() + 1}/${cur.getDate()}`;
    } else {
      dayNumber.textContent = cur.getDate();
    }

    if (outOfRange) {
      cell.classList.add("day-disabled");
    } else {
      if (isSat) cell.classList.add("sat");
      if (isSun || isHoliday) {
        cell.classList.add("sun");
        if (isHoliday && !isSun) cell.classList.add("holiday");
      }
    }

    cell.appendChild(dayNumber);

    const sym = document.createElement("div");
    sym.className = "symbol";
    updateSymbolElement(sym, appliedSymbols[dateKey] || "");
    cell.appendChild(sym);

    if (!outOfRange) {
      cell.addEventListener("click", () => {
        if (!activeSymbol) return;
        toggleSymbolForDate(dateKey, activeSymbol, sym);
      });
    }

    grid.appendChild(cell);
    cur.setDate(cur.getDate() + 1);
  }

  block.appendChild(grid);
  area.appendChild(block);
}

// ------------------------------------------------------
// 凡例の描画
// ------------------------------------------------------
function renderLegend() {
  const legendArea = document.getElementById("legendArea");
  if (!legendArea) return;
  legendArea.innerHTML = "";

  const pairs = [];
  for (let i = 1; i <= 4; i++) {
    const charEl  = document.getElementById(`sym${i}`);
    const labelEl = document.getElementById(`sym${i}label`);
    const char  = charEl  ? charEl.value.trim()  : "";
    const label = labelEl ? labelEl.value.trim() : "";
    if (char && label) {
      pairs.push({ char, label });
    }
  }

  if (pairs.length === 0) return;

  const row = document.createElement("div");
  row.className = "legend-row";

  pairs.forEach(p => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const symSpan = document.createElement("span");
    symSpan.className = "legend-symbol";
    symSpan.textContent = p.char;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = p.label;

    item.appendChild(symSpan);
    item.appendChild(labelSpan);
    row.appendChild(item);
  });

  legendArea.appendChild(row);
}

// ------------------------------------------------------
// メモ欄の自動リサイズ
// ------------------------------------------------------
function autoResizeMemo() {
  const ta = document.getElementById("memoText");
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

// ------------------------------------------------------
// カレンダー生成（メイン処理）
// ------------------------------------------------------
async function generateCalendar() {
  const startDateStr = document.getElementById("startDate").value;
  const endDateStr   = document.getElementById("endDate").value;
  const weekStart    = document.getElementById("weekStart").value;
  const layoutMode   = document.getElementById("layoutMode").value;

  if (!startDateStr || !endDateStr) {
    alert("開始日と終了日を入力してください。");
    return;
  }

  // タイムゾーンのズレを避けるため、明示的に時刻を付与
  const startDate = new Date(startDateStr + "T00:00:00");
  const endDate   = new Date(endDateStr   + "T23:59:59");

  if (endDate < startDate) {
    alert("終了日は開始日より後にしてください。");
    return;
  }

  // 最大6ヶ月
  const maxEnd = new Date(startDate);
  maxEnd.setMonth(maxEnd.getMonth() + 6);
  if (endDate > maxEnd) {
    alert("期間は最大6ヶ月までです。");
    return;
  }

  await loadHolidays();

  // タイトル反映
  const titleInput = document.getElementById("calendarTitle");
  const titleArea  = document.getElementById("titleArea");
  if (titleInput && titleArea) {
    const t = titleInput.value.trim();
    if (t) {
      titleArea.textContent = t;
      titleArea.style.display = "block";
    } else {
      titleArea.textContent = "";
      titleArea.style.display = "none";
    }
  }

  const calendarArea = document.getElementById("calendarArea");
  calendarArea.innerHTML = "";
  document.getElementById("resultArea").innerHTML = "";
  document.getElementById("shareBtn").style.display = "none";

  if (layoutMode === "continuous") {
    renderContinuousLayout(startDate, endDate, weekStart, calendarArea);
  } else {
    renderMonthLayout(startDate, endDate, weekStart, calendarArea);
  }

  renderLegend();
  createSymbolButtons();
  document.getElementById("makeImgBtn").style.display = "inline-block";
  saveState();
}

// ------------------------------------------------------
// 画像生成（html2canvas）
// ------------------------------------------------------
function makeImage() {
  autoResizeMemo();

  const target = document.getElementById("calendarImageArea");
  if (!target) return;

  const memoBlock = document.querySelector(".memo-block");
  const memoTextEl = document.getElementById("memoText");
  let hideMemo = false;

  if (memoBlock && memoTextEl) {
    if (memoTextEl.value.trim() === "") {
      hideMemo = true;
      memoBlock.style.display = "none";
    }
  }

  html2canvas(target, {
    scale: 2,
    backgroundColor: "#ffffff"
  })
    .then(canvas => {
      if (hideMemo && memoBlock) {
        memoBlock.style.display = "";
      }

      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.className = "result-img";

      const result = document.getElementById("resultArea");
      result.innerHTML = "";
      result.appendChild(img);

      const shareBtn = document.getElementById("shareBtn");
      shareBtn.style.display = "block";
      shareBtn.dataset.image = img.src;
    })
    .catch(err => {
      if (hideMemo && memoBlock) {
        memoBlock.style.display = "";
      }
      console.error(err);
      alert("画像の生成に失敗しました。");
    });
}

// ------------------------------------------------------
// Web Share API による共有
// ------------------------------------------------------
async function shareImage() {
  const base64 = document.getElementById("shareBtn").dataset.image;
  if (!base64) {
    alert("先に画像を作成してください。");
    return;
  }

  try {
    const res  = await fetch(base64);
    const blob = await res.blob();
    const file = new File([blob], "calendar.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "記号入りカレンダー",
        text: "記号入りカレンダーを共有します。"
      });
    } else if (navigator.share) {
      await navigator.share({
        title: "記号入りカレンダー",
        text: "記号入りカレンダーを共有します。"
      });
      alert("一部端末では画像が添付されない場合があります。画像を保存してから送信してください。");
    } else {
      alert("この端末では共有機能が使えません。画像を保存してからSNS等に貼り付けてください。");
    }
  } catch (e) {
    console.error(e);
    alert("共有に失敗しました。画像を保存してから送信してください。");
  }
}

// ------------------------------------------------------
// 初期化＆イベント登録
// ------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  const genBtn      = document.getElementById("generateCalBtn");
  const makeImgBtn  = document.getElementById("makeImgBtn");
  const shareBtn    = document.getElementById("shareBtn");
  const themeSelect = document.getElementById("themeSelect");
  const memoEl      = document.getElementById("memoText");
  const restoreBtn  = document.getElementById("restoreBtn");
  const paperAlphaEl= document.getElementById("paperAlpha");
  const bgInput     = document.getElementById("backgroundImageInput");
  const clearBgBtn  = document.getElementById("clearBackgroundBtn");

  if (genBtn)     genBtn.addEventListener("click", generateCalendar);
  if (makeImgBtn) makeImgBtn.addEventListener("click", makeImage);
  if (shareBtn)   shareBtn.addEventListener("click", shareImage);
  if (themeSelect) themeSelect.addEventListener("change", () => { applyTheme(); saveState(); });
  if (memoEl)     memoEl.addEventListener("input", () => { autoResizeMemo(); saveState(); });
  if (restoreBtn) restoreBtn.addEventListener("click", restoreState);
  if (paperAlphaEl) {
    paperAlphaEl.addEventListener("input", (e) => {
      updatePaperAlpha(e.target.value);
      saveState();
    });
  }
  if (bgInput) {
    bgInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBackgroundImage(ev.target?.result || "");
      };
      reader.readAsDataURL(file);
    });
  }
  if (clearBgBtn) {
    clearBgBtn.addEventListener("click", () => {
      const input = document.getElementById("backgroundImageInput");
      if (input) input.value = "";
      setBackgroundImage(null);
    });
  }

  loadSharedFooter();
  applyTheme();
  updatePaperAlpha(paperAlphaEl ? paperAlphaEl.value : DEFAULT_PAPER_ALPHA);
  createSymbolButtons();
  autoResizeMemo();
});
