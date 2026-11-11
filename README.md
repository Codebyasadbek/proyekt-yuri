# Pin Zheng Dental — landing page

Bilingual (Russian / Chinese) one-page site for the «Пинь Чжэн» (品正口腔) dental clinic in Fuyuan, China.

Demo: https://codebyasadbek.github.io/proyekt-yuri/

## Stack

Plain HTML, CSS and vanilla JavaScript with no build step. `send.php` handles the booking form via PHP `mail()`.

## Structure

```
index.html      page markup with the Russian copy
js/i18n.js      Chinese translations and the Russian strings used from JS
js/main.js      language switch, mobile menu, dialogs, booking form
css/style.css   styles
send.php        booking form handler
policy.html     privacy policy (152-FZ)
img/            optimized photos
```

## Translations

- Every translatable element has `data-i18n="key"`, or `data-i18n-attr="attr:key"` for attributes.
- Russian text stays in the HTML; the Chinese text for the same key lives in `js/i18n.js`.
- Blocks shown in only one language use `data-lang-only="ru"` or `data-lang-only="zh"`.
- `?lang=zh` opens the Chinese version directly.

## Run locally

```sh
php -S 127.0.0.1:8000
```

## Deploy

Upload the folder to any hosting with PHP and set `MAIL_TO` and `MAIL_FROM` in `send.php`.
GitHub Pages has no PHP, so on the demo the form only shows a notice instead of sending.
