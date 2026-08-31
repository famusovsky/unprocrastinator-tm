# Unprocrastinator for Tampermonkey

Та же логика, что у [Safari-расширения Unprocrastinator](https://andadinosaur.com/launch-unprocrastinator): 30 секунд ожидания на выбранных сайтах, потом страница открывается. Задержка специально не настраивается.

## Установка

1. Поставь [Tampermonkey](https://www.tampermonkey.net/) в Chrome / Edge / Brave / Arc.
2. Открой `unprocrastinator.user.js` в редакторе или в браузере — Tampermonkey предложит установить. Либо: иконка Tampermonkey → Create a new script → вставь содержимое файла → Ctrl/Cmd+S.
3. В Tampermonkey для скрипта должен быть доступ ко всем сайтам (по умолчанию так и есть из‑за `@match *://*/*`).

## Как пользоваться

1. Зайди на сайт, который хочешь замедлить.
2. Иконка Tampermonkey → **Unprocrastinator: settings**.
3. Включи тоггл для текущего домена.

Дальше при каждом заходе на этот сайт (и его поддомены) будет экран ожидания и кнопка **Go Back**.

- **Unprocrastinator: toggle this site** — быстро включить/выключить текущий домен.
- Список сайтов хранится локально (`GM_setValue`), никуда не уходит.
