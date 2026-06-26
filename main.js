/* =========================================================
         ✅ Code Overview (JavaScript Part)
         ---------------------------------------------------------
         ✅ Goal:
            - Load currency list → fill dropdowns
            - Convert amount using /latest
            - Load 30-day history using time-series endpoint
            - Draw a line chart (Canvas) + show a small table

         ✅ Why AbortController?
            - If user clicks convert/swap quickly:
              old request may finish after new request
              and overwrite the UI with wrong results
            - AbortController cancels old request to prevent that ✅
         ========================================================= */

// =========================================================
// ✅ 1) API Base (Frankfurter)
// ---------------------------------------------------------
// ✅ Frankfurter provides currency rates (ECB reference rates)
// ✅ No API key required
// =========================================================
const API = "https://api.frankfurter.dev/v1";

// =========================================================
// ✅ 2) DOM References (UI object)
// ---------------------------------------------------------
// ✅ Store all needed elements once for clean code
// =========================================================
const UI = {
  // State areas
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  content: document.getElementById("content"),

  // Inputs + selectors
  amount: document.getElementById("amount"),
  from: document.getElementById("from"),
  to: document.getElementById("to"),

  // Buttons
  btnConvert: document.getElementById("btnConvert"),
  btnSwap: document.getElementById("btnSwap"),
  btnUseUSDJOD: document.getElementById("btnUseUSDJOD"),
  btnUseEURUSD: document.getElementById("btnUseEURUSD"),

  // Result display
  result: document.getElementById("result"),
  meta: document.getElementById("meta"),
  ratePill: document.getElementById("ratePill"),
  datePill: document.getElementById("datePill"),

  // History UI
  chart: document.getElementById("chart"),
  historyBody: document.getElementById("historyBody"),
};

// =========================================================
// ✅ 3) App State
// =========================================================
let controller = null; // used to cancel old in-flight requests
let currencyMap = {}; // example: { "USD": "United States Dollar", ... }

// =========================================================
// ✅ 4) UI Helpers (Loading + Error)
// =========================================================
function setLoading(isLoading) {
  UI.loading.style.display = isLoading ? "flex" : "none";

  // ✅ Disable buttons while loading to prevent spam clicks
  UI.btnConvert.disabled = isLoading;
  UI.btnSwap.disabled = isLoading;
  UI.btnUseUSDJOD.disabled = isLoading;
  UI.btnUseEURUSD.disabled = isLoading;
}

function setError(message) {
  // ✅ If message is empty/null → hide error box
  if (!message) {
    UI.error.style.display = "none";
    UI.error.textContent = "";
    return;
  }

  // ✅ Else show it
  UI.error.style.display = "block";
  UI.error.textContent = message;

}

// =========================================================
// ✅ 5) Fetch Helper (JSON + HTTP error checking)
// ---------------------------------------------------------
// ✅ fetch() throws only for network errors
// ✅ If server returns 404/500, fetch() still resolves
//    so we must check res.ok manually ✅
// =========================================================
async function apiFetchJson(url, signal) {
  const res = await fetch(url, { signal });

  // ✅ Convert HTTP failures into readable errors
  if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText})`);

  // ✅ Parse response JSON
  return res.json();
}

// =========================================================
// ✅ 6) Load supported currencies: GET /v1/currencies
// ---------------------------------------------------------
// ✅ Response is usually:
//    { "USD": "United States Dollar", "EUR": "Euro", ... }
// =========================================================
async function loadCurrencies() {
  const data = await apiFetchJson(`${API}/currencies`, controller.signal);
  currencyMap = data;

  // ✅ Sort currency codes (USD, EUR, JOD...)
  const codes = Object.keys(currencyMap).sort();

  // ✅ Clear dropdowns first
  UI.from.innerHTML = "";
  UI.to.innerHTML = "";

  // ✅ Add each code as an option
  for (const code of codes) {
    const name = currencyMap[code];

    const opt1 = document.createElement("option");
    opt1.value = code;
    opt1.textContent = `${code} — ${name}`;
    UI.from.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = code;
    opt2.textContent = `${code} — ${name}`;
    UI.to.appendChild(opt2);
  }

  // ✅ Default selections (nice for Jordan-based example)
  UI.from.value = "USD";

  // ✅ Try JOD, if not supported fallback to EUR
  UI.to.value = "JOD";
  if (!currencyMap["JOD"]) UI.to.value = "EUR";

  // ✅ Show main content now that dropdowns are ready
  UI.content.style.display = "grid";
}

// =========================================================
// ✅ 7) Convert once: GET /v1/latest?base=FROM&symbols=TO
// ---------------------------------------------------------
// ✅ Returns latest rate and date
// =========================================================
async function convertOnce(from, to, amount) {
  const url = `${API}/latest?base=${encodeURIComponent(
    from,
  )}&symbols=${encodeURIComponent(to)}`;

  const data = await apiFetchJson(url, controller.signal);

  // ✅ Rate is inside data.rates
  const rate = data.rates?.[to];
  if (!rate) throw new Error(`Rate not found for ${from} → ${to}`);

  // ✅ Converted result = amount × rate
  const converted = amount * rate;

  return { rate, converted, date: data.date, base: data.base };
}

// =========================================================
// ✅ 8) History (time-series): GET /v1/YYYY-MM-DD..?
// ---------------------------------------------------------
// ✅ We request last 30 days and only one symbol (TO)
// ✅ Returned shape:
//    data.rates = { "2025-01-01": { "USD": 1.09 }, ... }
// =========================================================

// ✅ Helper: format Date to YYYY-MM-DD (UTC-based for simplicity)
function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");//* check pads method
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function loadHistory(from, to, days = 30) {
  // ✅ End = today
  const end = new Date();

  // ✅ Start = end - (days) days
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const startStr = formatDate(start);

  // ✅ “start..” means from start date to latest available
  const url = `${API}/${startStr}..?base=${encodeURIComponent(
    from,
  )}&symbols=${encodeURIComponent(to)}`;

  const data = await apiFetchJson(url, controller.signal);

  // ✅ Convert object map into sorted array rows
  const rows = Object.entries(data.rates)//** try manpulate this fuc */
    .map(([date, obj]) => ({ date, rate: obj[to] }))
    .filter((r) => typeof r.rate === "number")
    .sort((a, b) => a.date.localeCompare(b.date));

  return rows;
}

// =========================================================
// ✅ 9) Draw a simple line chart (Canvas)
// ---------------------------------------------------------
// ✅ No chart libraries used: pure Canvas drawing
// =========================================================
function drawChart(canvas, points) {
  const ctx = canvas.getContext("2d");

  // ✅ Clear old drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ✅ If no points: show a message
  if (!points.length) {
    ctx.font = "16px system-ui";
    ctx.fillText("No history data available.", 18, 40);
    return;
  }

  // ✅ Padding gives some space from borders
  const padding = 24;
  const W = canvas.width;
  const H = canvas.height;

  // ✅ Find min/max to scale the chart
  const ys = points.map((p) => p.rate);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // ✅ Avoid division by zero if all values are equal
  const safeRange = maxY - minY || 1;

  // ✅ Draw baseline axis (simple horizontal line)
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(padding, H - padding);
  ctx.lineTo(W - padding, H - padding);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ✅ Plot the line
  ctx.beginPath();
  points.forEach((p, i) => {
    // x goes from left padding to right padding
    const x = padding + (i * (W - padding * 2)) / (points.length - 1 || 1);

    // y is scaled so min is bottom and max is top
    const y = H - padding - ((p.rate - minY) * (H - padding * 2)) / safeRange;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // ✅ Add small labels for min/max
  ctx.globalAlpha = 0.85;
  ctx.font = "14px system-ui";
  ctx.fillText(`Min: ${minY.toFixed(6)}`, padding, 18);
  ctx.fillText(`Max: ${maxY.toFixed(6)}`, padding + 160, 18);
  ctx.globalAlpha = 1;
}

// =========================================================
// ✅ 10) Render history table (last ~12 rows)
// ---------------------------------------------------------
// ✅ We show only the last part to keep UI readable
// =========================================================
function renderHistoryTable(rows) {
  const last = rows.slice(-12).reverse();

  UI.historyBody.innerHTML = last
    .map(
      (r) => `
        <tr>
          <td>${r.date}</td>
          <td>${r.rate.toFixed(6)}</td>
        </tr>
      `,
    )
    .join("");
}

// =========================================================
// ✅ 11) Main action (Convert + History)
// ---------------------------------------------------------
// ✅ Called when:
//   - user clicks Convert
//   - user swaps currencies
//   - user uses presets (USD→JOD, EUR→USD)
// =========================================================
async function run() {
  // ✅ Cancel previous request (prevents old response overwriting new response)
  if (controller) controller.abort();
  controller = new AbortController();

  // ✅ Reset UI state
  setError("");

  const amount = Number(UI.amount.value);
  const from = UI.from.value;
  const to = UI.to.value;

  // ✅ Basic validations
  if (!Number.isFinite(amount) || amount <= 0)
    return setError("❌ Enter a valid positive amount.");
  if (from === to) return setError("❌ Choose two different currencies.");

  setLoading(true);

  try {
    // ✅ 1) Convert
    const { rate, converted, date } = await convertOnce(from, to, amount);

    UI.result.textContent = `${converted.toFixed(2)} ${to}`;
    UI.meta.textContent = `${amount.toFixed(2)} ${from} → ${to}`;
    UI.ratePill.textContent = `Rate: 1 ${from} = ${rate.toFixed(6)} ${to}`;
    UI.datePill.textContent = `Date: ${date}`;

    // ✅ 2) History (last 30 days)
    const rows = await loadHistory(from, to, 30);

    // ✅ Draw chart + show table
    drawChart(UI.chart, rows);
    renderHistoryTable(rows);
    
  } catch (err) {
    // ✅ AbortError is expected when user clicks quickly (not a real failure)
    if (err.name === "AbortError") return;

    // ✅ Show error
    setError(`❌ ${err.message}`);
  } finally {
    setLoading(false);
  }
}

// =========================================================
// ✅ 12) Wire events
// =========================================================

// ✅ Convert button
UI.btnConvert.addEventListener("click", run);

// ✅ Swap From/To currencies then convert again
UI.btnSwap.addEventListener("click", () => {
  const tmp = UI.from.value;
  UI.from.value = UI.to.value;
  UI.to.value = tmp;
  run();
});

// ✅ Preset: USD → JOD (fallback to EUR if JOD missing)
UI.btnUseUSDJOD.addEventListener("click", () => {
  UI.from.value = "USD";
  UI.to.value = currencyMap["JOD"] ? "JOD" : "EUR";
  run();
});

// ✅ Preset: EUR → USD
UI.btnUseEURUSD.addEventListener("click", () => {
  UI.from.value = "EUR";
  UI.to.value = "USD";
  run();
});

// ✅ Enter on amount triggers convert
UI.amount.addEventListener("keydown", (e) => {
  if (e.key === "Enter") run();
});

// =========================================================
// ✅ 13) Boot: load currencies then auto-run first conversion
// =========================================================
(async function boot() {
  setLoading(true);

  try {
    // ✅ Create controller for the initial currency load
    controller = new AbortController();

    // ✅ 1) Load dropdowns
    await loadCurrencies();

    // ✅ 2) Run initial conversion so user sees results instantly
    await run();
  } catch (err) {
    setError(`❌ ${err.message}`);
  } finally {
    setLoading(false);
  }
})();
