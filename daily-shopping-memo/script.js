(function () {
  "use strict";

  var STORAGE_KEY = "ck-daily-shopping-memo-v1";

  // プリセット品目（Gemini 提案 52 品目）
  var PRESET_ITEMS = [
    // 冷蔵
    { id: "milk", name: "牛乳", category: "冷蔵", builtin: true },
    { id: "egg", name: "卵", category: "冷蔵", builtin: true },
    { id: "tofu", name: "豆腐", category: "冷蔵", builtin: true },
    { id: "natto", name: "納豆", category: "冷蔵", builtin: true },
    { id: "cheese", name: "チーズ", category: "冷蔵", builtin: true },
    { id: "yogurt", name: "ヨーグルト", category: "冷蔵", builtin: true },
    { id: "ham-bacon", name: "ハム・ベーコン", category: "冷蔵", builtin: true },
    { id: "cucumber", name: "きゅうり", category: "冷蔵", builtin: true },
    { id: "tomato", name: "トマト", category: "冷蔵", builtin: true },
    { id: "leafy", name: "葉物野菜", category: "冷蔵", builtin: true },
    { id: "meat", name: "肉（鶏・豚・牛）", category: "冷蔵", builtin: true },
    { id: "fish", name: "魚（刺身・切り身）", category: "冷蔵", builtin: true },

    // 冷凍
    { id: "frozen-noodle", name: "冷凍うどん／そば", category: "冷凍", builtin: true },
    { id: "frozen-rice", name: "冷凍ご飯（パック）", category: "冷凍", builtin: true },
    { id: "frozen-veg", name: "冷凍野菜", category: "冷凍", builtin: true },
    { id: "frozen-gyoza", name: "冷凍餃子", category: "冷凍", builtin: true },
    { id: "frozen-karaage", name: "冷凍からあげ", category: "冷凍", builtin: true },
    { id: "bread", name: "食パン（スライス）", category: "冷凍", builtin: true },

    // 常温食品
    { id: "rice", name: "米（お米）", category: "常温食品", builtin: true },
    { id: "pasta", name: "パスタ／麺", category: "常温食品", builtin: true },
    { id: "canned", name: "缶詰（ツナ／鯖など）", category: "常温食品", builtin: true },
    { id: "dried", name: "乾物（海苔／ワカメなど）", category: "常温食品", builtin: true },
    { id: "retort", name: "レトルト食品", category: "常温食品", builtin: true },
    { id: "cereal", name: "シリアル／グラノーラ", category: "常温食品", builtin: true },
    { id: "snack", name: "お菓子／スナック", category: "常温食品", builtin: true },

    // 調味料
    { id: "soy-sauce", name: "醤油", category: "調味料", builtin: true },
    { id: "miso", name: "味噌", category: "調味料", builtin: true },
    { id: "sugar", name: "砂糖", category: "調味料", builtin: true },
    { id: "salt", name: "塩", category: "調味料", builtin: true },
    { id: "oil", name: "油（サラダ油／オリーブ等）", category: "調味料", builtin: true },
    { id: "vinegar", name: "酢", category: "調味料", builtin: true },
    { id: "mayo", name: "マヨネーズ", category: "調味料", builtin: true },
    { id: "ketchup", name: "ケチャップ", category: "調味料", builtin: true },
    { id: "dashi", name: "顆粒だし", category: "調味料", builtin: true },

    // 飲み物
    { id: "water", name: "水（ミネラルウォーター）", category: "飲み物", builtin: true },
    { id: "tea", name: "お茶（緑茶／麦茶パック）", category: "飲み物", builtin: true },
    { id: "coffee-tea", name: "コーヒー／紅茶", category: "飲み物", builtin: true },
    { id: "juice", name: "ジュース", category: "飲み物", builtin: true },
    { id: "alcohol", name: "ビール／アルコール", category: "飲み物", builtin: true },

    // 日用品
    { id: "toilet-paper", name: "トイレットペーパー", category: "日用品", builtin: true },
    { id: "tissue", name: "ティッシュペーパー", category: "日用品", builtin: true },
    { id: "kitchen-paper", name: "キッチンペーパー", category: "日用品", builtin: true },
    { id: "dish-soap", name: "食器用洗剤", category: "日用品", builtin: true },
    { id: "laundry-soap", name: "洗濯用洗剤", category: "日用品", builtin: true },
    { id: "garbage-bag", name: "ゴミ袋", category: "日用品", builtin: true },
    { id: "sponge", name: "スポンジ／たわし", category: "日用品", builtin: true },
    { id: "wrap-foil", name: "ラップ／アルミホイル", category: "日用品", builtin: true },

    // ドラッグ
    { id: "shampoo", name: "シャンプー／コンディショナー", category: "ドラッグ", builtin: true },
    { id: "body-soap", name: "ボディソープ", category: "ドラッグ", builtin: true },
    { id: "toothpaste", name: "歯磨き粉", category: "ドラッグ", builtin: true },
    { id: "mask", name: "マスク", category: "ドラッグ", builtin: true },
    { id: "bandage", name: "バンドエイド（絆創膏）", category: "ドラッグ", builtin: true }
  ];

  var CATEGORY_ORDER = [
    "冷蔵",
    "冷凍",
    "常温食品",
    "調味料",
    "飲み物",
    "日用品",
    "ドラッグ",
    "カスタム"
  ];

  var state = null;

  var modeStockBtn;
  var modeShoppingBtn;
  var filterTodayCheckbox;
  var itemsContainer;
  var customSection;
  var customForm;
  var customNameInput;
  var resetTodayBtn;
  var resetAllBtn;
  var freeMemoTextarea;

  // -------------------------
  // state 初期化・保存
  // -------------------------

  function createDefaultState() {
    return {
      version: 2,
      items: PRESET_ITEMS.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          builtin: item.builtin,
          buy: false,
          done: false,
          hidden: false
        };
      }),
      settings: {
        mode: "stock",          // "stock" | "shopping"
        filterToday: false,
        collapsedCategories: {} // { "冷凍": true, ... }
      },
      memo: ""
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createDefaultState();
      }
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.items) {
        return createDefaultState();
      }

      data.items = data.items.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          category: item.category || "カスタム",
          builtin: !!item.builtin,
          buy: !!item.buy,
          done: !!item.done,
          hidden: !!item.hidden
        };
      });

      data.settings = data.settings || {};
      if (data.settings.mode !== "stock" && data.settings.mode !== "shopping") {
        data.settings.mode = "stock";
      }
      data.settings.filterToday = !!data.settings.filterToday;
      data.settings.collapsedCategories =
        data.settings.collapsedCategories && typeof data.settings.collapsedCategories === "object"
          ? data.settings.collapsedCategories
          : {};

      data.memo = typeof data.memo === "string" ? data.memo : "";

      data.version = 2;

      return data;
    } catch (e) {
      console.warn("loadState error", e);
      return createDefaultState();
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("saveState error", e);
    }
  }

  // -------------------------
  // 状態変更ヘルパ
  // -------------------------

  function setMode(mode) {
    if (mode !== "stock" && mode !== "shopping") return;
    state.settings.mode = mode;
    render();
    saveState();
  }

  function setFilterToday(flag) {
    state.settings.filterToday = !!flag;
    render();
    saveState();
  }

  function toggleCategoryCollapsed(category) {
    var map = state.settings.collapsedCategories || {};
    var current = !!map[category];
    map[category] = !current;
    state.settings.collapsedCategories = map;
    render();
    saveState();
  }

  function addCustomItem(name) {
    var trimmed = name.trim();
    if (!trimmed) return;

    var baseId =
      "custom-" +
      trimmed
        .replace(/\s+/g, "-")
        .replace(/[^\w\-ぁ-んァ-ン一-龠]/g, "")
        .toLowerCase();

    if (!baseId) {
      baseId = "custom-item";
    }

    var id = baseId;
    var suffix = 1;
    while (
      state.items.some(function (it) {
        return it.id === id;
      })
    ) {
      id = baseId + "-" + suffix;
      suffix += 1;
    }

    state.items.push({
      id: id,
      name: trimmed,
      category: "カスタム",
      builtin: false,
      buy: true,
      done: false,
      hidden: false
    });

    render();
    saveState();
  }

  function deleteItemById(id) {
    state.items = state.items.filter(function (item) {
      return item.id !== id;
    });
    render();
    saveState();
  }

  function resetToday() {
    state.items.forEach(function (item) {
      item.buy = false;
      item.done = false;
    });
    state.settings.mode = "stock";
    render();
    saveState();
  }

  function resetAll() {
    state = createDefaultState();
    render();
    saveState();
  }

  function handleBuyChange(item, checked) {
    item.buy = !!checked;
    if (!item.buy) {
      item.done = false;
    }
    render();
    saveState();
  }

  function handleDoneToggle(item) {
    if (state.settings.mode !== "shopping") return;
    if (!item.buy) return;
    item.done = !item.done;
    render();
    saveState();
  }

  function hideOrDeleteItem(item) {
    // 在庫チェックモードでのみ呼ばれる想定
    if (item.builtin) {
      if (
        window.confirm(
          "この品目をリストから非表示にしますか？\n（「すべて初期化」を押すと元に戻せます）"
        )
      ) {
        item.hidden = true;
        render();
        saveState();
      }
    } else {
      if (window.confirm("この品目をリストから削除しますか？")) {
        deleteItemById(item.id);
      }
    }
  }

  function setMemo(text) {
    state.memo = text;
    autoResizeMemo();
    saveState();
  }

  // -------------------------
  // 描画
  // -------------------------

  function render() {
    // モード・フィルタの反映
    modeStockBtn.classList.toggle("active", state.settings.mode === "stock");
    modeShoppingBtn.classList.toggle("active", state.settings.mode === "shopping");
    filterTodayCheckbox.checked = state.settings.filterToday;

    // その他の買うものを追加カードは、買い物中モードでは非表示
    if (customSection) {
      if (state.settings.mode === "shopping") {
        customSection.style.display = "none";
      } else {
        customSection.style.display = "";
      }
    }

    // メモ欄の内容を state から反映
    if (freeMemoTextarea) {
      if (freeMemoTextarea.value !== state.memo) {
        freeMemoTextarea.value = state.memo || "";
      }
      autoResizeMemo();
    }

    itemsContainer.innerHTML = "";

    CATEGORY_ORDER.forEach(function (category) {
      var catItems = state.items.filter(function (item) {
        return item.category === category && !item.hidden;
      });

      if (state.settings.filterToday) {
        catItems = catItems.filter(function (item) {
          return item.buy;
        });
      }

      if (catItems.length === 0) {
        return;
      }

      var collapsed = !!(
        state.settings.collapsedCategories &&
        state.settings.collapsedCategories[category]
      );

      var card = document.createElement("section");
      card.className = "category-card card";

      var header = document.createElement("div");
      header.className = "category-header";

      var title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = category;

      var rightBox = document.createElement("div");
      rightBox.style.display = "flex";
      rightBox.style.alignItems = "center";
      rightBox.style.gap = "8px";

      var count = document.createElement("div");
      count.className = "category-count";
      count.textContent = catItems.length + "件";

      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.textContent = collapsed ? "＋" : "−";
      toggleBtn.style.border = "none";
      toggleBtn.style.background = "transparent";
      toggleBtn.style.fontSize = "1rem";
      toggleBtn.style.cursor = "pointer";
      toggleBtn.setAttribute(
        "aria-label",
        collapsed ? "カテゴリを展開" : "カテゴリを折り畳み"
      );

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleCategoryCollapsed(category);
      });

      rightBox.appendChild(count);
      rightBox.appendChild(toggleBtn);

      header.appendChild(title);
      header.appendChild(rightBox);

      header.addEventListener("click", function () {
        toggleCategoryCollapsed(category);
      });

      card.appendChild(header);

      if (!collapsed) {
        catItems.forEach(function (item) {
          var row = document.createElement("div");
          row.className = "item-row";
          row.dataset.id = item.id;

          if (item.buy) {
            row.classList.add("is-buy");
          }
          if (item.done) {
            row.classList.add("is-done");
          }

          var main = document.createElement("div");
          main.className = "item-main";

          var buyLabel = document.createElement("label");
          buyLabel.className = "buy-label";

          var buyCheckbox = document.createElement("input");
          buyCheckbox.type = "checkbox";
          buyCheckbox.className = "buy-checkbox";
          buyCheckbox.checked = item.buy;

          buyCheckbox.addEventListener("change", function () {
            handleBuyChange(item, buyCheckbox.checked);
          });

          var buyText = document.createElement("span");
          buyText.textContent = "買う";

          buyLabel.appendChild(buyCheckbox);
          buyLabel.appendChild(buyText);

          var nameSpan = document.createElement("span");
          nameSpan.className = "item-name";
          nameSpan.textContent = item.name;
          if (item.done) {
            nameSpan.classList.add("done");
          }

          main.appendChild(buyLabel);
          main.appendChild(nameSpan);

          var actions = document.createElement("div");
          actions.className = "item-actions";

          var doneButton = document.createElement("button");
          doneButton.type = "button";
          doneButton.className = "done-button";

          if (state.settings.mode === "shopping") {
            if (item.buy) {
              if (item.done) {
                doneButton.classList.add("completed");
                doneButton.textContent = "購入済み";
              } else {
                doneButton.classList.add("pending");
                doneButton.textContent = "カゴに入れたらタップ";
              }
              doneButton.addEventListener("click", function () {
                handleDoneToggle(item);
              });
            } else {
              doneButton.classList.add("disabled");
              doneButton.textContent = "対象外";
            }
          } else {
            doneButton.classList.add("disabled");
            doneButton.textContent = "買い物中に使用";
          }

          actions.appendChild(doneButton);

          // 在庫チェックモードのときだけ × ボタンを表示
          if (state.settings.mode === "stock") {
            var delButton = document.createElement("button");
            delButton.type = "button";
            delButton.className = "delete-button";
            delButton.textContent = "×";
            delButton.setAttribute(
              "aria-label",
              item.builtin
                ? "この品目をリストから非表示にする"
                : "この品目をリストから削除する"
            );

            delButton.addEventListener("click", function (e) {
              e.stopPropagation();
              hideOrDeleteItem(item);
            });

            actions.appendChild(delButton);
          }

          row.appendChild(main);
          row.appendChild(actions);
          card.appendChild(row);
        });
      }

      itemsContainer.appendChild(card);
    });
  }

  // メモ欄の高さ自動調整
  function autoResizeMemo() {
    if (!freeMemoTextarea) return;
    freeMemoTextarea.style.height = "auto";
    freeMemoTextarea.style.height = freeMemoTextarea.scrollHeight + "px";
  }

  // -------------------------
  // 初期化
  // -------------------------

  function init() {
    modeStockBtn = document.getElementById("mode-stock-btn");
    modeShoppingBtn = document.getElementById("mode-shopping-btn");
    filterTodayCheckbox = document.getElementById("filter-today");
    itemsContainer = document.getElementById("items-container");
    customSection = document.getElementById("custom-section");
    customForm = document.getElementById("custom-form");
    customNameInput = document.getElementById("custom-name");
    resetTodayBtn = document.getElementById("reset-today-btn");
    resetAllBtn = document.getElementById("reset-all-btn");
    freeMemoTextarea = document.getElementById("free-memo");

    state = loadState();

    // モード切替
    modeStockBtn.addEventListener("click", function () {
      setMode("stock");
    });

    modeShoppingBtn.addEventListener("click", function () {
      setMode("shopping");
    });

    // フィルタ
    filterTodayCheckbox.addEventListener("change", function () {
      setFilterToday(filterTodayCheckbox.checked);
    });

    // カスタム追加
    customForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = customNameInput.value || "";
      if (!value.trim()) return;
      addCustomItem(value);
      customNameInput.value = "";
    });

    // リセット
    resetTodayBtn.addEventListener("click", function () {
      if (
        window.confirm(
          "今日の買い物フラグ（買う／購入済み）をすべてリセットしますか？\n追加した品目自体は残ります。"
        )
      ) {
        resetToday();
      }
    });

    resetAllBtn.addEventListener("click", function () {
      if (
        window.confirm(
          "すべて初期化して、プリセットだけの状態に戻しますか？\n追加した品目や非表示設定、メモはすべて削除されます。"
        )
      ) {
        resetAll();
      }
    });

    // メモ欄
    if (freeMemoTextarea) {
      freeMemoTextarea.value = state.memo || "";
      autoResizeMemo();
      freeMemoTextarea.addEventListener("input", function () {
        setMemo(freeMemoTextarea.value || "");
      });
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
