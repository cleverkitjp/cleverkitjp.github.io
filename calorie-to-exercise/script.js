// ==== 設定値 ====

// 体重未入力時のデフォルト（kg）
const DEFAULT_WEIGHT = 60;

// 運動ごとの設定
const EXERCISES = [
  {
    key: "walk",
    label: "ウォーキング（普通）",
    icon: "🚶",
    mets: 3.3
  },
  {
    key: "run",
    label: "ランニング（ゆっくり）",
    icon: "🏃",
    mets: 7.0
  },
  {
    key: "bike",
    label: "自転車（街乗り）",
    icon: "🚲",
    mets: 4.0
  },
  {
    key: "stairs",
    label: "階段を昇る",
    icon: "🪜",
    mets: 8.0
  }
];

// ==== DOM要素参照 ====

const calorieInput = document.getElementById("calorieInput");
const weightInput = document.getElementById("weightInput");
const inputError = document.getElementById("inputError");
const calculateBtn = document.getElementById("calculateBtn");

const resultCard = document.getElementById("resultCard");
const summaryText = document.getElementById("summaryText");
const exerciseCardsContainer = document.getElementById("exerciseCards");

// チャレンジモード用
const overlay = document.getElementById("challengeOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const challengeIcon = document.getElementById("challengeIcon");
const challengeTitle = document.getElementById("challengeTitle");
const challengeSubtitle = document.getElementById("challengeSubtitle");
const challengeReady = document.getElementById("challengeReady");
const challengeTimer = document.getElementById("challengeTimer");
const challengeStartBtn = document.getElementById("challengeStartBtn");

const timerDisplay = document.getElementById("timerDisplay");
const timerTargetText = document.getElementById("timerTargetText");
const timerProgress = document.getElementById("timerProgress");
const timerMessage = document.getElementById("timerMessage");
const pauseResumeBtn = document.getElementById("pauseResumeBtn");
const stopBtn = document.getElementById("stopBtn");

// ==== タイマー状態管理 ====

let currentExercise = null;
let targetSeconds = 0;
let elapsedSeconds = 0;
let timerId = null;
let timerRunning = false;

// ==== ユーティリティ関数 ====

// カロリーと体重から必要時間（秒）を計算
function calcRequiredSeconds(kcal, weightKg, mets) {
  // 必要時間[h] = kcal ÷ ( METs × 体重(kg) × 1.05 )
  const hours = kcal / (mets * weightKg * 1.05);
  const seconds = hours * 3600;
  // 秒は四捨五入
  return Math.max(1, Math.round(seconds));
}

// 秒 → {hours, minutes, seconds} に分解
function splitTime(sec) {
  const total = Math.max(0, Math.round(sec));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds };
}

// 秒 → 画面表示用（00:00 / 00:00:00）
function formatTimer(sec) {
  const { hours, minutes, seconds } = splitTime(sec);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

// 分表記用（例：60分→1時間0分）のテキスト
function formatMinutesLabel(totalMinutes) {
  const rounded = Math.max(1, Math.round(totalMinutes));
  if (rounded < 60) {
    return `約 ${rounded} 分`;
  }
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (minutes === 0) {
    return `約 ${hours} 時間`;
  }
  return `約 ${hours} 時間 ${minutes} 分`;
}

// 入力バリデーション
function validateInputs() {
  inputError.textContent = "";

  const kcalRaw = calorieInput.value.trim();
  if (!kcalRaw) {
    inputError.textContent = "カロリーを入力してください。";
    return null;
  }

  const kcal = Number(kcalRaw);
  if (!Number.isFinite(kcal) || kcal <= 0) {
    inputError.textContent = "カロリーは1以上の数値で入力してください。";
    return null;
  }

  let weightKg;
  const weightRaw = weightInput.value.trim();
  if (!weightRaw) {
    weightKg = DEFAULT_WEIGHT;
  } else {
    weightKg = Number(weightRaw);
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      inputError.textContent = "体重は正しい数値で入力してください。";
      return null;
    }
  }

  return { kcal, weightKg };
}
// 運動カードの生成
function renderExerciseCards(kcal, weightKg) {
  exerciseCardsContainer.innerHTML = "";

  EXERCISES.forEach((ex) => {
    const seconds = calcRequiredSeconds(kcal, weightKg, ex.mets);
    const minutes = seconds / 60;
    const timeLabel = formatMinutesLabel(minutes);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "exercise-card";
    card.dataset.key = ex.key;
    card.dataset.icon = ex.icon;
    card.dataset.label = ex.label;
    card.dataset.targetSeconds = String(seconds);

    card.innerHTML = `
      <div class="exercise-icon">${ex.icon}</div>
      <div class="exercise-main">
        <div class="exercise-label">${ex.label}</div>
        <div class="exercise-time">${timeLabel}</div>
        <div class="exercise-meta">METs: ${ex.mets.toFixed(1)}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      openChallengeModal(ex, seconds, timeLabel);
    });

    exerciseCardsContainer.appendChild(card);
  });
}

// 計算ボタン押下
calculateBtn.addEventListener("click", () => {
  const values = validateInputs();
  if (!values) return;

  const { kcal, weightKg } = values;

  summaryText.textContent = `${kcal} kcal / 体重 ${weightKg} kg の場合の目安です。`;
  renderExerciseCards(kcal, weightKg);

  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

// チャレンジモードを開く
function openChallengeModal(exercise, seconds, timeLabel) {
  currentExercise = exercise;
  targetSeconds = seconds;
  elapsedSeconds = 0;
  clearTimer();

  challengeIcon.textContent = exercise.icon;
  challengeTitle.textContent = `${exercise.label} チャレンジ`;
  challengeSubtitle.textContent = timeLabel + " にチャレンジ";

  // 準備画面を表示
  challengeReady.classList.remove("hidden");
  challengeTimer.classList.add("hidden");

  timerDisplay.textContent = "00:00";
  timerTargetText.textContent = `目標：${timeLabel}`;
  timerProgress.style.width = "0%";
  timerMessage.textContent = "";

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

// タイマーを開始
function startTimer() {
  if (!currentExercise || targetSeconds <= 0) return;

  challengeReady.classList.add("hidden");
  challengeTimer.classList.remove("hidden");

  elapsedSeconds = 0;
  timerRunning = true;
  timerDisplay.textContent = "00:00";
  timerMessage.textContent = "";
  timerProgress.style.width = "0%";
  pauseResumeBtn.textContent = "一時停止";

  timerId = setInterval(() => {
    elapsedSeconds += 1;
    updateTimerUI();
  }, 1000);
}

// タイマーUI更新
function updateTimerUI() {
  timerDisplay.textContent = formatTimer(elapsedSeconds);

  const ratio = Math.min(1, elapsedSeconds / targetSeconds);
  timerProgress.style.width = `${ratio * 100}%`;

  if (elapsedSeconds >= targetSeconds && !timerMessage.textContent) {
    timerMessage.textContent = "おつかれさま！目安時間をクリアしました。";
  }
}

// タイマー停止・リセット
function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  timerRunning = false;
}

// ポーズ／再開
function togglePauseResume() {
  if (!currentExercise || targetSeconds <= 0) return;

  if (timerRunning) {
    // 一時停止
    clearTimer();
    pauseResumeBtn.textContent = "再開";
  } else {
    // 再開
    timerRunning = true;
    pauseResumeBtn.textContent = "一時停止";
    timerId = setInterval(() => {
      elapsedSeconds += 1;
      updateTimerUI();
    }, 1000);
  }
}

// モーダルを閉じる
function closeChallengeModal() {
  clearTimer();
  currentExercise = null;
  targetSeconds = 0;
  elapsedSeconds = 0;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

// ==== イベント登録 ====

// 準備OK → スタート
challengeStartBtn.addEventListener("click", () => {
  startTimer();
});

// 一時停止／再開
pauseResumeBtn.addEventListener("click", () => {
  togglePauseResume();
});

// 終了
stopBtn.addEventListener("click", () => {
  closeChallengeModal();
});

// × ボタン
modalCloseBtn.addEventListener("click", () => {
  closeChallengeModal();
});

// 背景タップで閉じる
overlay.addEventListener("click", (e) => {
  if (e.target === overlay || e.target.classList.contains("overlay-backdrop")) {
    closeChallengeModal();
  }
});
