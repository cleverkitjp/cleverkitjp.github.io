(function () {
  "use strict";

  // DOM取得
  var modeButtons = document.querySelectorAll(".mode-btn");
  var diffPanel = document.getElementById("diffPanel");
  var sumPanel = document.getElementById("sumPanel");

  var resultLabel = document.getElementById("resultLabel");
  var resultMain = document.getElementById("resultMain");
  var resultSub = document.getElementById("resultSub");

  // 時間差分モード要素
  var startTimeInput = document.getElementById("startTime");
  var endTimeInput = document.getElementById("endTime");
  var breakMinutesInput = document.getElementById("breakMinutes");
  var breakChipButtons = document.querySelectorAll(".chip-btn");
  var clearDiffButton = document.getElementById("clearDiff");
  var diffError = document.getElementById("diffError");

  // 合計モード要素
  var timeAInput = document.getElementById("timeA");
  var timeBInput = document.getElementById("timeB");
  var clearSumButton = document.getElementById("clearSum");
  var sumError = document.getElementById("sumError");

  var currentMode = "diff"; // "diff" or "sum"

  /* ========= 共通ユーティリティ ========= */

  // 分から「X時間Y分」と「hh:mm」を生成
  function formatMinutes(totalMinutes) {
    if (totalMinutes < 0 || !isFinite(totalMinutes)) {
      totalMinutes = 0;
    }
    totalMinutes = Math.round(totalMinutes);

    var hours = Math.floor(totalMinutes / 60);
    var mins = totalMinutes % 60;

    var text = hours + "時間" + mins + "分";
    var hm =
      String(hours).padStart(2, "0") +
      ":" +
      String(mins).padStart(2, "0");

    return {
      text: text,
      hm: hm
    };
  }

  // 結果表示をまとめて更新
  function setResult(label, mainText, subText) {
    resultLabel.textContent = label || "";
    resultMain.textContent = mainText || "";
    resultSub.textContent = subText || "";
  }

  // "HH:MM" を分に変換（type="time"専用）
  function timeInputToMinutes(value) {
    if (!value) return null; // 未入力
    var parts = value.split(":");
    if (parts.length < 2) return null;

    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);

    if (isNaN(h) || isNaN(m) || h < 0 || m < 0 || m > 59) {
      return null;
    }
    return h * 60 + m;
  }

  // "hh:mm" または "mm" の文字列を分に変換（合計モード用）
  function parseTimeStringToMinutes(str) {
    if (str == null) return null;
    var trimmed = String(str).trim();
    if (trimmed === "") return null;

    // "hh:mm" 形式
    if (trimmed.indexOf(":") !== -1) {
      var parts = trimmed.split(":");
      if (parts.length > 2) return NaN; // 想定外

      var h = parseInt(parts[0], 10);
      var m = parts.length === 2 ? parseInt(parts[1], 10) : 0;

      if (
        isNaN(h) ||
        isNaN(m) ||
        h < 0 ||
        m < 0 ||
        m > 59
      ) {
        return NaN;
      }
      return h * 60 + m;
    }

    // 分だけ
    var mins = parseInt(trimmed, 10);
    if (isNaN(mins) || mins < 0) {
      return NaN;
    }
    return mins;
  }

  /* ========= 時間差分モード ========= */

  function computeDiffMode() {
    diffError.textContent = "";

    var startMin = timeInputToMinutes(startTimeInput.value);
    var endMin = timeInputToMinutes(endTimeInput.value);

    if (startMin === null || endMin === null) {
      setResult(
        "時間差分（開始〜終了）",
        "結果未計算",
        "開始時刻と終了時刻を入力してください"
      );
      return;
    }

    // 終了 < 開始 の場合は翌日として計算
    var duration;
    if (endMin >= startMin) {
      duration = endMin - startMin;
    } else {
      duration = (endMin + 24 * 60) - startMin;
    }

    if (duration <= 0) {
      setResult(
        "時間差分（開始〜終了）",
        "0時間0分",
        "開始と終了が同じか、正しい範囲になっていません"
      );
      return;
    }

    // 休憩
    var breakRaw = breakMinutesInput.value;
    var breakMin = 0;
    if (breakRaw !== "") {
      var parsedBreak = parseInt(breakRaw, 10);
      if (!isNaN(parsedBreak) && parsedBreak > 0) {
        breakMin = parsedBreak;
      }
    }

    if (breakMin > duration) {
      breakMin = duration; // 自動調整
    }

    var worked = duration - breakMin;

    var durationFmt = formatMinutes(duration);
    var workedFmt = formatMinutes(worked);

    setResult(
      "時間差分（開始〜終了）",
      "実働 " + workedFmt.text,
      "滞在 " +
        durationFmt.text +
        "（" +
        durationFmt.hm +
        "） / 実働 " +
        workedFmt.hm
    );
  }

  // 休憩チップボタンのクリック
  breakChipButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var val = btn.getAttribute("data-break");
      breakMinutesInput.value = val;
      computeDiffMode();
    });
  });

  // 入力変更で即時計算
  startTimeInput.addEventListener("input", computeDiffMode);
  endTimeInput.addEventListener("input", computeDiffMode);
  breakMinutesInput.addEventListener("input", computeDiffMode);

  // 入力クリア
  clearDiffButton.addEventListener("click", function () {
    startTimeInput.value = "";
    endTimeInput.value = "";
    breakMinutesInput.value = "";
    diffError.textContent = "";
    setResult(
      "時間差分（開始〜終了）",
      "ここに結果が表示されます",
      "開始時刻と終了時刻を入力してください"
    );
  });

  /* ========= 合計モード ========= */

  function computeSumMode() {
    sumError.textContent = "";

    var aStr = timeAInput.value;
    var bStr = timeBInput.value;

    if (!aStr && !bStr) {
      setResult(
        "時間の合計（A + B）",
        "結果未計算",
        "時間Aまたは時間Bを入力してください"
      );
      return;
    }

    var aMin = parseTimeStringToMinutes(aStr);
    var bMin = parseTimeStringToMinutes(bStr);

    if (isNaN(aMin)) {
      sumError.textContent = "時間Aの形式が正しくありません（例：1:30 または 45）";
      setResult(
        "時間の合計（A + B）",
        "エラー",
        "時間Aを修正してください"
      );
      return;
    }
    if (isNaN(bMin)) {
      sumError.textContent = "時間Bの形式が正しくありません（例：0:45 または 90）";
      setResult(
        "時間の合計（A + B）",
        "エラー",
        "時間Bを修正してください"
      );
      return;
    }

    // 片方が空の場合は0として扱う
    if (aMin == null) aMin = 0;
    if (bMin == null) bMin = 0;

    var total = aMin + bMin;
    var totalFmt = formatMinutes(total);

    setResult(
      "時間の合計（A + B）",
      "合計 " + totalFmt.text,
      "（" + totalFmt.hm + "）"
    );
  }

  timeAInput.addEventListener("input", computeSumMode);
  timeBInput.addEventListener("input", computeSumMode);

  clearSumButton.addEventListener("click", function () {
    timeAInput.value = "";
    timeBInput.value = "";
    sumError.textContent = "";
    setResult(
      "時間の合計（A + B）",
      "ここに結果が表示されます",
      "時間Aまたは時間Bを入力してください"
    );
  });

  /* ========= モード切替 ========= */

  function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    modeButtons.forEach(function (btn) {
      var btnMode = btn.getAttribute("data-mode");
      if (btnMode === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (mode === "diff") {
      diffPanel.classList.remove("is-hidden");
      sumPanel.classList.add("is-hidden");
      // ラベルと結果を時間差分用に戻す
      setResult(
        "時間差分（開始〜終了）",
        "ここに結果が表示されます",
        "開始時刻と終了時刻を入力してください"
      );
      diffError.textContent = "";
    } else {
      diffPanel.classList.add("is-hidden");
      sumPanel.classList.remove("is-hidden");
      // ラベルと結果を合計用に戻す
      setResult(
        "時間の合計（A + B）",
        "ここに結果が表示されます",
        "時間Aまたは時間Bを入力してください"
      );
      sumError.textContent = "";
    }
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-mode");
      switchMode(mode);
    });
  });

  /* ========= 初期状態 ========= */

  // 初期は時間差分モード
  switchMode("diff");
})();
