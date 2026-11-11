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
send.php        booking form handler (honeypot + 5 requests per IP per hour)
policy.html     privacy policy (152-FZ)
404.html        self-contained "not found" page
img/            photos: JPEG originals, WebP sizes (-640, -960…) and 3:4 gallery thumbnails (-thumb)
fonts/          Onest (OFL), self-hosted: Google Fonts is blocked in China
.htaccess       compression, caching and 404 for Apache hosting
```

## Images

Each photo is served as WebP through `<picture>` with the JPEG as a fallback; the JPEG also opens in the lightbox.
When replacing a photo, regenerate its WebP sizes and give the file a new name, because images are cached for a week.

## Assets cache

After changing CSS or JS, bump `?v=N` in `index.html` and `policy.html`.

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

1. Upload the folder to any hosting with PHP 7.4+.
2. Set `MAIL_TO` and `MAIL_FROM` in `send.php`.
3. Replace `https://codebyasadbek.github.io/proyekt-yuri/` with the real domain in `index.html`, `robots.txt` and `sitemap.xml`.
4. Fill in the operator details in `policy.html`.
5. Turn on HTTPS and the redirect to it in the hosting panel.
6. Send a test request from the form and check that the email arrives.

GitHub Pages has no PHP, so on the demo the form only shows a notice instead of sending.
