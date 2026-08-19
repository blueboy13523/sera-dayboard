# Sera Dayboard

Sera Dayboard is a calm, ADHD-friendly workday guide for a tablet. It keeps attention on **NOW** and **NEXT**, while planning, captures, and review stay available without crowding focus mode.

The TODAY view also includes a guided **RESET** routine with 1-, 3-, and 5-minute breathing presets. RESET uses optional generated Web Audio, works offline, and always returns to the task that was active before the routine.

All workday data stays in IndexedDB on the device. There is no account or network dependency after the PWA is installed; the optional private home-sync service is used only on explicit request.

During the workday, Sera Dayboard remains completely offline. The optional home-sync server is contacted only when the user presses **Sync Home**.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

Because the production site is configured as a GitHub Pages project site, the local URL includes `/sera-dayboard/`.

## Build and test

```bash
npm test
npm run build
npm run preview
```

The production app is written to `dist/`.

## Deploy to GitHub Pages

The repository includes an automated deployment workflow at `.github/workflows/deploy-pages.yml`. It tests and builds the app, uploads `dist/`, and deploys it as a GitHub Pages artifact whenever the `main` branch is updated. It can also be started manually from the **Actions** tab.

1. Create a GitHub repository named `sera-dayboard`.
2. Push this project to the repository, with the production branch named `main`.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to `main` or run **Deploy Sera Dayboard to GitHub Pages** from the **Actions** tab.

The resulting project site uses this URL format:

```text
https://YOUR-GITHUB-USERNAME.github.io/sera-dayboard/
```

The Vite base path, PWA start URL, manifest scope, icons, service-worker registration, and generated asset URLs are configured for `/sera-dayboard/`. If the repository is renamed, update those values in `vite.config.ts`.

GitHub Pages hosts only the static application files. User tasks, captures, interruptions, and day plans remain exclusively in that browser’s IndexedDB; the deployment does not upload or synchronize them.

## End Day and Home Sync

**End Day** reviews completed, unfinished, and blocked work alongside captures. It lets the user build and reorder tomorrow’s queue, carry unfinished work forward, and leave a short note for Sera. **Save for Tomorrow** writes only to IndexedDB and works without a connection.

**Sync Home** is an explicit, user-started action. It sends the prepared day snapshot only to the configured private Sera address and can receive an updated DayPlan in response. There is no timer, background task-data sync, or automatic retry. If Sera is unavailable, the outbox and complete working database remain safely on the tablet.

The sync payload includes today’s tasks and timings, carry-over work, blockers, captures, interruptions, reset metadata, tomorrow’s queue, and the end-of-day note. It intentionally contains no streak or missed-goal data.

## Privacy and production architecture

The intended boundary is:

```text
GitHub Pages                       static application only
        ↓
Android tablet IndexedDB          offline/private working data; authoritative copy
        ↓ explicit Sync Home only
Tailscale private tailnet + HTTPS encrypted private transport
        ↓
Tailscale Serve on Sera desktop   HTTPS reverse proxy to localhost
        ↓
Sera FastAPI + SQLite             private home data store
```

GitHub stores only HTML, CSS, JavaScript, application icons, and other static resources. It must never receive task data, plans, notes, captures, interruptions, task timing, or Sera-generated personal data.

Use **Tailscale Serve**, which restricts the service to devices allowed on the private tailnet. **Do not use Tailscale Funnel**: Funnel makes a service reachable from the public Internet. Do not configure router port forwarding, UPnP, public API hosting, or public endpoints.

The private-network layer does not replace application authentication. Every Sera request must also present the configured Bearer token. The production token belongs in the server environment and the tablet’s local IndexedDB—never in source control.

## Private Sera server

The reference FastAPI service is in `server/`. It requires Python 3.11 or newer and stores received snapshots and returned plans in a local SQLite database. The LLM/planning behavior is deliberately not implemented yet.

Create a virtual environment, install the dependencies, and set the environment values represented in `server/.env.example`. Use a long random token and set `SERA_ALLOWED_ORIGINS` to the GitHub Pages origin, such as `https://YOUR-GITHUB-USERNAME.github.io`.

From the `server` directory, start the API bound to localhost:

```bash
python -m pip install -r requirements.txt
python run.py
```

The default listener is `127.0.0.1:8765`. Keep that localhost binding. On the Sera desktop, configure the current Tailscale client to proxy private HTTPS traffic to it:

```bash
tailscale serve --bg http://127.0.0.1:8765
```

Use the private `https://DEVICE-NAME.TAILNET-NAME.ts.net` URL printed by Tailscale Serve in Dayboard’s **Connection settings**. Both the tablet and Sera desktop must be connected to the same authorized tailnet. Review current [Tailscale Serve documentation](https://tailscale.com/docs/features/tailscale-serve) before production setup because CLI behavior can change.

## Install on Android Chrome

1. Open the deployed GitHub Pages site over HTTPS (or the development app from `localhost`).
2. Open the site in Chrome on the tablet.
3. Choose **Install app** from Chrome’s menu.
4. Launch Sera Dayboard from the home screen once while online. The application shell is then available offline; task, capture, interruption, and day-plan data remains in IndexedDB.

Clearing the site’s browser storage will remove local Sera Dayboard data.

## Structure

- `src/views/` contains the four primary views.
- `src/components/` contains reusable forms and dialogs.
- `src/db.ts` defines the Dexie database and demo workday seed.
- `src/taskService.ts` contains the task-flow operations and is the seam for a future synchronization adapter.
- `vite.config.ts` defines the installable manifest and offline service worker.

The included demo plan appears only when the database is empty.
