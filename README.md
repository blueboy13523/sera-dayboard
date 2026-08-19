# Sera Dayboard

Sera Dayboard is a calm, ADHD-friendly workday guide for a tablet. It keeps attention on **NOW** and **NEXT**, while planning, captures, and review stay available without crowding focus mode.

The TODAY view also includes a guided **RESET** routine with 1-, 3-, and 5-minute breathing presets. RESET uses optional generated Web Audio, works offline, and always returns to the task that was active before the routine.

All data stays in IndexedDB on the device. There is no account, backend, sync service, or network dependency after the PWA is installed.

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
