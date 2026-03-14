// 共通ユーティリティ
function parsePositiveNumber(value) {
  if (value === null || value === undefined) return null;
  const num = parseFloat(String(value).replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return null;
  return num;
}

function formatYen(value) {
  // 1円未満は四捨五入
  const rounded = Math.round(value);
  return '¥' + rounded.toLocaleString('ja-JP');
}

// タブ切り替え
(function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanels.forEach((panel) => panel.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add('active');
    });
  });
})();

// ピルボタン（税率・割引率）の選択状態管理
(function setupPills() {
  // 税率グループ
  document.querySelectorAll('[data-taxrate-group]').forEach((group) => {
    group.addEventListener('click', (event) => {
      const target = event.target.closest('.pill-button');
      if (!target) return;
      group.querySelectorAll('.pill-button').forEach((btn) => btn.classList.remove('active'));
      target.classList.add('active');
    });
  });

  // 割引率グループ
  document.querySelectorAll('[data-discount-group]').forEach((group) => {
    group.addEventListener('click', (event) => {
      const target = event.target.closest('.pill-button');
      if (!target) return;
      group.querySelectorAll('.pill-button').forEach((btn) => btn.classList.remove('active'));
      target.classList.add('active');

      const rate = target.getAttribute('data-discount');

      // グループに応じて対応する入力欄に反映
      if (group.getAttribute('data-discount-group') === 'single') {
        const input = document.getElementById('discount-rate');
        if (input) input.value = rate;
      } else if (group.getAttribute('data-discount-group') === 'dt') {
        const input = document.getElementById('dt-discount-rate');
        if (input) input.value = rate;
      }
    });
  });
})();

// -----------------------
// 1. 税込↔税抜タブ
// -----------------------

(function setupTaxTab() {
  const amountInput = document.getElementById('tax-amount');
  const errorEl = document.getElementById('tax-error');
  const resultEl = document.getElementById('tax-result');
  const calcBtn = document.getElementById('tax-calc-btn');

  function getTaxRate() {
    const group = document.querySelector('[data-taxrate-group="tax"]');
    const active = group ? group.querySelector('.pill-button.active') : null;
    const rate = active ? parseFloat(active.getAttribute('data-taxrate')) : 10;
    return rate / 100; // 0.1 / 0.08
  }

  function getMode() {
    const checked = document.querySelector('input[name="tax-mode"]:checked');
    return checked ? checked.value : 'inclusive';
  }

  function renderResult(html) {
    resultEl.innerHTML = html;
  }

  calcBtn.addEventListener('click', () => {
    errorEl.textContent = '';
    const amount = parsePositiveNumber(amountInput.value);
    if (amount === null) {
      errorEl.textContent = '1円より大きい金額を入力してください。';
      renderResult('<p class="result-placeholder">金額を正しく入力してから「計算する」を押してください。</p>');
      return;
    }

    const rate = getTaxRate(); // 0.1 など
    const mode = getMode();

    if (rate <= 0) {
      errorEl.textContent = '税率が正しく取得できませんでした。';
      return;
    }

    if (mode === 'inclusive') {
      // 税込 → 税抜
      const taxExclusiveRaw = amount / (1 + rate);
      const taxExclusive = Math.round(taxExclusiveRaw);
      const taxAmount = Math.round(amount - taxExclusive);

      const html = `
        <p class="result-main">
          ${formatYen(taxExclusive)}
          <small>税込 → 税抜</small>
        </p>
        <p class="result-sub">
          元の税込価格：${formatYen(amount)}<br>
          消費税額：${formatYen(taxAmount)}（税率 ${(rate * 100).toFixed(0)}％）<br>
          端数処理：1円未満を四捨五入
        </p>
      `;
      renderResult(html);
    } else {
      // 税抜 → 税込
      const taxAmountRaw = amount * rate;
      const taxAmount = Math.round(taxAmountRaw);
      const taxInclusive = Math.round(amount + taxAmount);

      const html = `
        <p class="result-main">
          ${formatYen(taxInclusive)}
          <small>税抜 → 税込</small>
        </p>
        <p class="result-sub">
          元の税抜価格：${formatYen(amount)}<br>
          消費税額：${formatYen(taxAmount)}（税率 ${(rate * 100).toFixed(0)}％）<br>
          端数処理：1円未満を四捨五入
        </p>
      `;
      renderResult(html);
    }
  });
})();

// -----------------------
// 2. 割引のみタブ
// -----------------------

(function setupDiscountTab() {
  const originalInput = document.getElementById('discount-original');
  const rateInput = document.getElementById('discount-rate');
  const errorEl = document.getElementById('discount-error');
  const resultEl = document.getElementById('discount-result');
  const calcBtn = document.getElementById('discount-calc-btn');

  function renderResult(html) {
    resultEl.innerHTML = html;
  }

  calcBtn.addEventListener('click', () => {
    errorEl.textContent = '';

    const original = parsePositiveNumber(originalInput.value);
    if (original === null) {
      errorEl.textContent = '元の価格を 1円より大きい金額で入力してください。';
      renderResult('<p class="result-placeholder">元の価格と割引率を入力してから「計算する」を押してください。</p>');
      return;
    }

    const rateVal = parseFloat(rateInput.value);
    if (isNaN(rateVal) || rateVal <= 0 || rateVal >= 100) {
      errorEl.textContent = '割引率は 0〜100 の間で入力してください。';
      renderResult('<p class="result-placeholder">割引率を正しく入力してから「計算する」を押してください。</p>');
      return;
    }

    const rate = rateVal / 100; // 0.2 など
    const discountRaw = original * rate;
    const discountAmount = Math.round(discountRaw);
    const discountedPrice = Math.round(original - discountAmount);

    const html = `
      <p class="result-main">
        ${formatYen(discountedPrice)}
        <small>割引後価格</small>
      </p>
      <p class="result-sub">
        元の価格：${formatYen(original)}<br>
        割引額：${formatYen(discountAmount)}（${rateVal.toFixed(1).replace(/\.0$/, '')}％OFF）<br>
        端数処理：1円未満を四捨五入
      </p>
    `;
    renderResult(html);
  });
})();

// -----------------------
// 3. 割引＋税込タブ
// -----------------------

(function setupDiscountTaxTab() {
  const originalInput = document.getElementById('dt-original');
  const rateInput = document.getElementById('dt-discount-rate');
  const errorEl = document.getElementById('dt-error');
  const resultEl = document.getElementById('dt-result');
  const calcBtn = document.getElementById('dt-calc-btn');

  function renderResult(html) {
    resultEl.innerHTML = html;
  }

  function getTaxRate() {
    const group = document.querySelector('[data-taxrate-group="dt"]');
    const active = group ? group.querySelector('.pill-button.active') : null;
    const rate = active ? parseFloat(active.getAttribute('data-taxrate')) : 10;
    return rate / 100;
  }

  calcBtn.addEventListener('click', () => {
    errorEl.textContent = '';

    const original = parsePositiveNumber(originalInput.value);
    if (original === null) {
      errorEl.textContent = '元の価格を 1円より大きい金額で入力してください。';
      renderResult('<p class="result-placeholder">元の価格・割引率・税率を入力してから「計算する」を押してください。</p>');
      return;
    }

    const rateVal = parseFloat(rateInput.value);
    if (isNaN(rateVal) || rateVal <= 0 || rateVal >= 100) {
      errorEl.textContent = '割引率は 0〜100 の間で入力してください。';
      renderResult('<p class="result-placeholder">割引率を正しく入力してから「計算する」を押してください。</p>');
      return;
    }

    const taxRate = getTaxRate();
    if (taxRate <= 0) {
      errorEl.textContent = '税率が正しく取得できませんでした。';
      return;
    }

    const discountRate = rateVal / 100;

    // 割引額 → 割引後税抜 → 税額 → 割引後税込
    const discountRaw = original * discountRate;
    const discountAmount = Math.round(discountRaw);
    const discountedExcl = Math.round(original - discountAmount);

    const taxRaw = discountedExcl * taxRate;
    const taxAmount = Math.round(taxRaw);
    const totalIncl = Math.round(discountedExcl + taxAmount);

    const html = `
      <p class="result-main">
        ${formatYen(totalIncl)}
        <small>割引後 税込価格</small>
      </p>
      <p class="result-sub">
        元の価格：${formatYen(original)}<br>
        割引額：${formatYen(discountAmount)}（${rateVal.toFixed(1).replace(/\.0$/, '')}％OFF）<br>
        割引後税抜価格：${formatYen(discountedExcl)}<br>
        消費税額：${formatYen(taxAmount)}（税率 ${(taxRate * 100).toFixed(0)}％）<br>
        端数処理：1円未満を四捨五入
      </p>
    `;
    renderResult(html);
  });
})();
