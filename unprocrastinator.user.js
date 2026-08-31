// ==UserScript==
// @name         Unprocrastinator
// @namespace    unprocrastinator-tm
// @version      1.0.0
// @description  Wait 30 seconds before you can see chosen websites
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const DELAY_SEC = 30;
  const KEY = 'sites';

  const load = () => GM_getValue(KEY, []);
  const save = (sites) => GM_setValue(KEY, sites);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const bare = (h) => h.replace(/^www\./, '');
  const matches = (host, site) => {
    const h = bare(host);
    const s = bare(site);
    return h === s || h.endsWith('.' + s);
  };
  const enabledFor = (host) => load().some((s) => s.enabled && matches(host, s.host));
  const find = (host) => load().find((s) => s.host === host);

  const host = location.hostname;
  let waitHost = null;
  let settingsHost = null;
  let tick = null;
  let pauseTick = null;

  function mount(el) {
    if (!el.isConnected) document.documentElement.appendChild(el);
    return el;
  }

  function hostEl(z) {
    const el = document.createElement('div');
    el.style.cssText = `all:initial;position:fixed;inset:0;z-index:${z || 2147483646};`;
    document.documentElement.appendChild(el);
    return el;
  }

  function keep(el) {
    const obs = new MutationObserver(() => mount(el));
    obs.observe(document.documentElement, { childList: true });
    return obs;
  }

  function goBack() {
    const prev = document.referrer;
    location.replace(prev && prev !== location.href ? prev : 'about:blank');
  }

  function pageTitle() {
    return (document.title || '').trim() || host;
  }

  function startWait() {
    if (waitHost) return;

    const hide = document.createElement('style');
    hide.id = 'unpro-hide';
    hide.textContent = 'html{background:#fff!important}html>body{opacity:0!important;pointer-events:none!important}';
    document.documentElement.appendChild(hide);

    const el = hostEl();
    const root = el.attachShadow({ mode: 'closed' });
    waitHost = { el, root, hide, obs: keep(el) };

    const ends = Date.now() + DELAY_SEC * 1000;
    root.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; }
        .wrap {
          position: fixed; inset: 0; background: #fff; color: #111;
          font: 400 17px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          display: flex; flex-direction: column; align-items: center;
          padding: 22vh 24px 24px; text-align: center; user-select: none;
        }
        h1 { font-size: 34px; font-weight: 700; letter-spacing: -0.4px; margin: 0 0 10px; }
        p { margin: 0 0 22px; max-width: 28em; }
        button {
          appearance: none; border: 0; background: #007aff; color: #fff;
          font: 600 17px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 14px 36px; border-radius: 999px; cursor: pointer;
        }
        button:active { opacity: 0.75; }
      </style>
      <div class="wrap">
        <h1>Unprocrastinator</h1>
        <p id="msg" aria-live="polite"></p>
        <button type="button" id="back">Go Back</button>
      </div>
    `;
    root.getElementById('back').onclick = goBack;

    const msg = root.getElementById('msg');
    const render = () => {
      const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      const unit = left === 1 ? 'second' : 'seconds';
      msg.textContent = `Wait ${left} ${unit} for “${pageTitle()}”.`;
      if (left <= 0) finishWait();
    };
    render();
    tick = setInterval(render, 250);

    const pause = () => {
      document.querySelectorAll('video, audio').forEach((m) => {
        try { m.pause(); m.muted = true; } catch (_) {}
      });
    };
    pause();
    pauseTick = setInterval(pause, 300);
  }

  function finishWait() {
    if (tick) clearInterval(tick);
    if (pauseTick) clearInterval(pauseTick);
    tick = pauseTick = null;
    if (!waitHost) return;
    waitHost.obs.disconnect();
    waitHost.hide.remove();
    waitHost.el.remove();
    waitHost = null;
  }

  function toggleRow(siteHost, on) {
    const sites = load();
    const i = sites.findIndex((s) => s.host === siteHost);
    if (i >= 0) sites[i].enabled = on;
    else sites.push({ host: siteHost, enabled: on });
    save(sites);
    if (matches(host, siteHost)) {
      if (on && !waitHost) startWait();
      if (!on && waitHost) finishWait();
    }
  }

  function openSettings() {
    if (settingsHost) return;
    const el = hostEl(2147483647);
    const root = el.attachShadow({ mode: 'closed' });
    settingsHost = { el, root };

    const paint = () => {
      const sites = load();
      const others = sites.filter((s) => s.host !== host);
      const currentOn = !!(find(host)?.enabled);
      root.innerHTML = `
        <style>
          :host { all: initial; }
          * { box-sizing: border-box; }
          .bg { position: fixed; inset: 0; background: rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; padding: 24px; }
          .sheet {
            width: 100%; max-width: 400px; max-height: min(80vh, 640px); overflow: auto;
            background: #f2f2f7; border-radius: 14px; color: #111;
            font: 400 17px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 8px; }
          .bar h2 { margin: 0; font-size: 17px; font-weight: 600; flex: 1; text-align: center; }
          .bar .sp { width: 52px; }
          .done { border: 0; background: none; color: #007aff; font: 600 17px/1 inherit; cursor: pointer; width: 52px; text-align: right; padding: 0; }
          .sec { color: #6d6d72; font-size: 13px; font-weight: 400; letter-spacing: .02em; padding: 18px 20px 8px; }
          .group { background: #fff; margin: 0 12px 12px; border-radius: 12px; overflow: hidden; }
          .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; }
          .row + .row { border-top: 0.5px solid #c6c6c8; }
          .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .sw { position: relative; width: 51px; height: 31px; flex: 0 0 auto; }
          .sw input { opacity: 0; width: 0; height: 0; }
          .sw i { position: absolute; inset: 0; background: #e9e9eb; border-radius: 31px; transition: background .2s; }
          .sw i::after {
            content: ""; position: absolute; width: 27px; height: 27px; left: 2px; top: 2px;
            background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s;
          }
          .sw input:checked + i { background: #34c759; }
          .sw input:checked + i::after { transform: translateX(20px); }
        </style>
        <div class="bg">
          <div class="sheet" role="dialog" aria-label="Unprocrastinator">
            <div class="bar">
              <div class="sp"></div>
              <h2>Unprocrastinator</h2>
              <button type="button" class="done" id="done">Done</button>
            </div>
            <div class="sec">ENABLE UNPROCRASTINATOR ON</div>
            <div class="group">
              <label class="row"><span class="name">${esc(host)}</span>
                <span class="sw"><input type="checkbox" data-host="${esc(host)}" ${currentOn ? 'checked' : ''}><i></i></span>
              </label>
            </div>
            ${others.length ? `<div class="group">${others.map((s) => `
              <label class="row"><span class="name">${esc(s.host)}</span>
                <span class="sw"><input type="checkbox" data-host="${esc(s.host)}" ${s.enabled ? 'checked' : ''}><i></i></span>
              </label>`).join('')}</div>` : ''}
          </div>
        </div>
      `;
      root.getElementById('done').onclick = closeSettings;
      root.querySelector('.bg').addEventListener('click', (e) => {
        if (e.target.classList.contains('bg')) closeSettings();
      });
      root.querySelectorAll('input[data-host]').forEach((input) => {
        input.addEventListener('change', () => {
          toggleRow(input.dataset.host, input.checked);
          paint();
        });
      });
    };
    paint();
  }

  function closeSettings() {
    if (!settingsHost) return;
    settingsHost.el.remove();
    settingsHost = null;
  }

  function toggleCurrent() {
    toggleRow(host, !(find(host)?.enabled));
  }

  if (enabledFor(host)) startWait();

  GM_registerMenuCommand('Unprocrastinator: settings', openSettings);
  GM_registerMenuCommand('Unprocrastinator: toggle this site', toggleCurrent);
})();
