### Quick orientation

This is a browser-first demo trading frontend (static HTML + ES modules) with server-backed modes. The app is intentionally DOM-centric and attaches many shared objects to `window`.

Key patterns and files

- Entry pages : `index.html`, `login.html`, `dashboard.html`, `admin.html`, `withdraw.html`.
- Important JS modules: `js/utils.js` (toasts/formatters), `js/realtime.js` (price engine), `js/auth.js`, `js/api.js`, `js/supabase.js`, `js/dashboard.js`, `js/admin.js`.
- Configuration hook: toggle data layer via `js/config.js` (browser-local: `lokijs`; server: `nedb` or Supabase client usage in `js/supabase.js`).

Developer workflows (concrete)

- Quick static serve: `npx http-server .` or `python -m http.server 8000` and open `http://localhost:8000`.
- If a Node/Vite workflow is present: `npm install && npm run dev` (multi-page Vite dev server). If `vite.config.js` exists, add new HTML pages to `rollupOptions.input`.

Project conventions agents must follow

- Globals-first: many modules expose globals (e.g. `window.apiClient`, `window.supabase`, `window.realTimePrices`). When renaming symbols, add compatibility shims instead of changing call sites: e.g. `window.apiClient = apiClient`.
- Minimal refactors: avoid removing or rewriting `js/utils.js` helpers — they are referenced widely from multiple pages.
- Dual/offline modes: keep browser fallbacks intact (LokiJS/IndexedDB paths) — code expects fallbacks when Supabase or CoinGecko are unreachable.

Integration notes and gotchas

- Supabase: `js/supabase.js` holds the client init and anon key (demo). Many auth flows rely on `supabase.auth.onAuthStateChange` in `js/auth.js`.
- API shapes: `js/api.js` and `js/realtime.js` assume specific column/field names (e.g. `change_24h`, `change_percent_24h`, `updated_at`). Do not change DB row shapes without updating both files.
- Price data: to add symbols or initial prices, edit `js/realtime.js` (search for `initialPrices` and `fetchCryptoPrices`).

Safe edit patterns (concrete examples)

- Rename global export: keep a shim — `window.apiClient = apiClient`.
- Add new page: create the HTML in project root and add it to `rollupOptions.input` in `vite.config.js` (if present).
- Add symbol / price source: update `js/realtime.js` mapping and any UI that lists symbols (search for `initialPrices`).

What NOT to change without cross-updating

- Supabase/DB column names (must update `js/api.js`, `js/realtime.js`, and any server seeds).
- `js/utils.js` API (toasts, formatters, theme helpers) — used across many files.

Where to look for more context

- Start with `js/realtime.js`, `js/auth.js`, `js/api.js`, and `js/supabase.js` to understand auth, price flow, and data shapes.
- Inspect HTML pages in the repo root to see which globals and functions each page expects.

If anything here is unclear or you'd like short examples for a specific task (add symbol, switch data layer, rename a global), tell me which task and I will extend this file with a step-by-step example.
always ask me questions if anything is unclear
this is to be built for producton
all data is to be properly available for use in all page where needed
admin has pull controle with high priority
always look for potential errors
prioritize firebase and make sure all needed code are at the needed place
set up everything that is needed and fix all syntax errs and make sure the dashboard displays the user name of the logedin user
all activities of a loged in suer is tied to the user account all needed schma/tables should be available (tell me hot to create them if it cannot be done automatically)
admin has access to every activities of every user in the platform
remember i want to still get mail verification like with supabese
make plans for eact action asd ask detaild question for each task

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyATBRU4Fdsm2wlpjkdErdthd6iBRT8sAok",
    authDomain: "maxprofit-ca096.firebaseapp.com",
    projectId: "maxprofit-ca096",
    storageBucket: "maxprofit-ca096.firebasestorage.app",
    messagingSenderId: "28491983145",
    appId: "1:28491983145:web:4dce7f18c23208c8186f38",
    measurementId: "G-567P3EJQV3"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

DO well to apply every where it is needed
and i want to push to https://github.com/Walter-sdq/mx
