// ==UserScript==
// @name         Unprocrastinator
// @namespace    unprocrastinator-tm
// @version      1.0.1
// @description  Wait 30 seconds before you can see chosen websites
// @match        *://*/*
// @run-at       document-start
// @inject-into  content
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const DELAY_SEC = 30;
  const KEY = 'sites';
  const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const load = () => {
    const v = GM_getValue(KEY, []);
    return Array.isArray(v) ? v : [];
  };
  const save = (sites) => GM_setValue(KEY, sites);

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
  let keeper = null;

  function node(tag, props, kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'className') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'css') el.style.cssText = v;
        else if (k === 'onClick') el.addEventListener('click', v);
        else if (k === 'onChange') el.addEventListener('change', v);
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    if (kids) for (const c of kids) if (c) el.appendChild(c);
    return el;
  }

  function addCss(root, css) {
    root.appendChild(node('style', { text: css }));
  }

  function mount(el) {
    const root = document.documentElement;
    if (root && !el.isConnected) root.appendChild(el);
  }

  function hostEl(z) {
    const el = node('div', {
      css: `position:fixed;inset:0;z-index:${z || 2147483646};display:block;background:#fff;color-scheme:light;pointer-events:auto;`,
    });
    mount(el);
    return el;
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

    const ends = Date.now() + DELAY_SEC * 1000;
    const el = hostEl();
    const root = el.attachShadow({ mode: 'closed' });
    waitHost = { el };
    keeper = setInterval(() => mount(el), 200);

    addCss(root, `
      .wrap {
        position: fixed; inset: 0; background: #fff; color: #111;
        font: 400 17px/1.3 ${FONT};
        display: flex; flex-direction: column; align-items: center;
        padding: 22vh 24px 24px; text-align: center; user-select: none;
      }
      h1 { font-size: 34px; font-weight: 700; letter-spacing: -0.4px; margin: 0 0 10px; }
      p { margin: 0 0 22px; max-width: 28em; }
      button {
        appearance: none; border: 0; background: #007aff; color: #fff;
        font: 600 17px/1 ${FONT};
        padding: 14px 36px; border-radius: 999px; cursor: pointer;
      }
      button:active { opacity: 0.75; }
    `);
    const msg = node('p', { 'aria-live': 'polite' });
    root.appendChild(node('div', { className: 'wrap' }, [
      node('h1', { text: 'Unprocrastinator' }),
      msg,
      node('button', { type: 'button', text: 'Go Back', onClick: goBack }),
    ]));

    const render = () => {
      const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      msg.textContent = `Wait ${left} ${left === 1 ? 'second' : 'seconds'} for “${pageTitle()}”.`;
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
    if (keeper) clearInterval(keeper);
    tick = pauseTick = keeper = null;
    if (!waitHost) return;
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

  function switchRow(siteHost, on) {
    return node('label', { className: 'row' }, [
      node('span', { className: 'name', text: siteHost }),
      node('span', { className: 'sw' }, [
        node('input', {
          type: 'checkbox',
          checked: on,
          dataset: { host: siteHost },
          onChange: (e) => {
            toggleRow(siteHost, e.target.checked);
            paintSettings();
          },
        }),
        node('i'),
      ]),
    ]);
  }

  function paintSettings() {
    if (!settingsHost) return;
    const { root } = settingsHost;
    root.replaceChildren();
    addCss(root, `
      .bg { position: fixed; inset: 0; background: rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; padding: 24px; }
      .sheet {
        width: 100%; max-width: 400px; max-height: min(80vh, 640px); overflow: auto;
        background: #f2f2f7; border-radius: 14px; color: #111;
        font: 400 17px/1.25 ${FONT};
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
    `);
    const sites = load();
    const others = sites.filter((s) => s.host !== host);
    const more = others.length
      ? node('div', { className: 'group' }, others.map((s) => switchRow(s.host, s.enabled)))
      : null;
    const bg = node('div', {
      className: 'bg',
      onClick: (e) => { if (e.target === bg) closeSettings(); },
    }, [
      node('div', { className: 'sheet', role: 'dialog', 'aria-label': 'Unprocrastinator' }, [
        node('div', { className: 'bar' }, [
          node('div', { className: 'sp' }),
          node('h2', { text: 'Unprocrastinator' }),
          node('button', { type: 'button', className: 'done', text: 'Done', onClick: closeSettings }),
        ]),
        node('div', { className: 'sec', text: 'ENABLE UNPROCRASTINATOR ON' }),
        node('div', { className: 'group' }, [switchRow(host, !!(find(host)?.enabled))]),
        more,
      ]),
    ]);
    root.appendChild(bg);
  }

  function openSettings() {
    if (settingsHost) return;
    const el = hostEl(2147483647);
    settingsHost = { el, root: el.attachShadow({ mode: 'closed' }) };
    paintSettings();
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
