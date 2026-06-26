# Currency-Converter



 Currency Converter with Live Rates, 30-Day History Chart, and Safe Request Handling (Frankfurter API)
 
🗝️ Introduction Currency conversion is a common real-world feature in finance apps, travel tools, e-commerce, and dashboards.



This project shows how to build a clean client-side currency converter using a public API (no API key), with a conversion result, rate details, and a 30-day history chart + table.


🧩 Project Overview
This is a single-page currency converter with a two-column layout:
🔹 Left side: enter amount + choose “From” and “To” currencies, then convert.
🔹 Right side: shows the last 30 days exchange-rate history as a Canvas line chart + a small table.

It also includes quick buttons for:
🔹 Swap currencies
🔹 USD → JOD
🔹 EUR → USD

🧬 Core Concepts
🔹 Public API Integration (No API Key)
➡️ Uses Frankfurter API endpoints to fetch currencies and rates.
➡️ Works directly from the browser without backend setup.

🔹 Fetch + async/await + HTTP Error Handling
➡️ Uses fetch() with async/await for clean asynchronous calls.
➡️ Checks response.ok manually because fetch only throws on network errors.

🔹 Safe Request Handling (AbortController ✅)
➡️ If the user clicks quickly (swap / convert / presets), old requests may finish late and overwrite new results.
➡️ AbortController cancels the previous request to keep UI always correct and up-to-date.

🔹 UI State Control (Loading + Disabled Buttons)
➡️ While requests run, a spinner appears and buttons are disabled.
➡️ Prevents double clicks, race conditions, and confusing UI changes.

🔹 Validation Gate (Prevent Wrong Results)
➡️ Amount must be a valid positive number.
➡️ “From” and “To” cannot be the same currency.
➡️ Errors appear in a clear message box.

🔹 Currency List Loading + Dropdown Population
➡️ Loads all supported currencies from the API and fills both dropdowns.
➡️ Adds friendly labels like: USD — United States Dollar.
➡️ Picks smart defaults (USD and JOD if available, else fallback).

🔹 Conversion Endpoint (Latest Rate)
➡️ Uses /latest?base=FROM&symbols=TO to get the current rate.
➡️ Displays:
🔹 Converted amount
🔹 Rate (1 FROM = X TO)
🔹 Date of the rate

🔹 30-Day History (Time-Series Endpoint)
➡️ Builds a date range for the last 30 days.
➡️ Calls the time-series endpoint and extracts daily rates.
➡️ Sorts results by date for correct chart plotting.

🔹 Canvas Chart (No Libraries)
➡️ Draws a simple line chart using <canvas> without Chart.js or libraries.
➡️ Auto-scales based on min/max values.
➡️ Shows min/max labels for quick reading.

🔹 History Table (Readable Snapshot)
➡️ Displays the last ~12 days to keep the UI clean.
➡️ Rates are formatted with fixed decimal precision.
