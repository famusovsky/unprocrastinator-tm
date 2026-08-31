# Unprocrastinator for Tampermonkey

I took this idea from the [iOS Unprocrastinator](https://andadinosaur.com/launch-unprocrastinator) extension.

## How to use

1. Open the site you want to delay.
2. Tampermonkey / Violentmonkey menu → **Unprocrastinator: settings**.
3. Turn on the toggle for the current domain.

Every visit to that site (and its subdomains) shows a 30-second wait screen with **Go Back**. The delay is not configurable.

- **Unprocrastinator: toggle this site** — enable or disable the current domain quickly.
- The site list is stored locally (`GM_setValue`) and never sent anywhere.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in any Chromium-based Browser.
2. Open `unprocrastinator.user.js` — the manager will offer to install it. Or: Create a new script → paste the file → save.
3. Allow the script on all sites (default, via `@match *://*/*`).
