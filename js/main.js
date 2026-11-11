(() => {
  'use strict';

  const DEFAULT_LANG = 'ru';
  const SUPPORTED_LANGS = ['ru', 'zh'];
  const CLINIC_ADDRESS_ZH = '黑龙江省抚远市迎宾路93号 品正口腔门诊部';
  // GitHub Pages has no PHP, so the form only works after moving to real hosting.
  const IS_STATIC_DEMO = window.location.hostname.endsWith('github.io');

  const translations = window.I18N || { ru: {}, zh: {} };
  let currentLang = DEFAULT_LANG;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* storage disabled */ }
    }
  };

  const t = (key) => translations[currentLang]?.[key] ?? translations.ru[key] ?? key;

  /* ---------- Language ---------- */

  // The page is authored in Russian; originals are kept to switch back without a reload.
  const original = {
    title: document.title,
    description: $('meta[name="description"]')?.content ?? '',
    html: new WeakMap(),
    attrs: new WeakMap()
  };

  function translateContent(lang) {
    const dict = lang === DEFAULT_LANG ? {} : translations[lang] || {};

    $$('[data-i18n]').forEach((el) => {
      if (!original.html.has(el)) original.html.set(el, el.innerHTML);
      el.innerHTML = dict[el.dataset.i18n] ?? original.html.get(el);
    });

    $$('[data-i18n-attr]').forEach((el) => {
      if (!original.attrs.has(el)) original.attrs.set(el, {});
      const saved = original.attrs.get(el);

      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        if (!(attr in saved)) saved[attr] = el.getAttribute(attr) ?? '';
        el.setAttribute(attr, dict[key] ?? saved[attr]);
      });
    });

    $$('[data-lang-only]').forEach((el) => {
      el.hidden = el.dataset.langOnly !== lang;
    });
  }

  function updateDocumentMeta(lang) {
    const dict = translations[lang] || {};
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'ru';
    document.title = dict['meta.title'] ?? original.title;
    const description = $('meta[name="description"]');
    if (description) description.content = dict['meta.description'] ?? original.description;
  }

  function updateLangUrl(lang) {
    const url = new URL(window.location.href);
    if (lang === DEFAULT_LANG) url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function setLanguage(lang) {
    currentLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;

    translateContent(currentLang);
    updateDocumentMeta(currentLang);
    updateLangUrl(currentLang);
    storage.set('lang', currentLang);

    $$('.lang-switch__btn').forEach((btn) => {
      const isActive = btn.dataset.lang === currentLang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    const langField = $('#booking-form input[name="lang"]');
    if (langField) langField.value = currentLang;
  }

  function detectLanguage() {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (SUPPORTED_LANGS.includes(fromUrl)) return fromUrl;

    const saved = storage.get('lang');
    if (SUPPORTED_LANGS.includes(saved)) return saved;

    return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : DEFAULT_LANG;
  }

  function initLanguage() {
    $$('.lang-switch__btn').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    setLanguage(detectLanguage());
  }

  /* ---------- Header and mobile menu ---------- */

  function initMenu() {
    const burger = $('#burger');
    const nav = $('#nav');
    if (!burger || !nav) return;

    const setOpen = (isOpen) => {
      nav.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    };

    burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    $$('a', nav).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  }

  function initHeaderShadow() {
    const header = $('.header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Toast ---------- */

  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  /* ---------- Address copy ---------- */

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;opacity:0';
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      copied ? resolve() : reject(new Error('Copy failed'));
    });
  }

  function initAddressCopy() {
    $('#address-copy')?.addEventListener('click', () => {
      copyToClipboard(CLINIC_ADDRESS_ZH)
        .then(() => showToast(t('route.copied')))
        .catch(() => { /* nothing to do: the address stays visible on the page */ });
    });
  }

  /* ---------- Dialogs: taxi card and photo lightbox ---------- */

  function initDialogs() {
    $$('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog || event.target.closest('[data-dialog-close]')) dialog.close();
      });
    });

    const taxiDialog = $('#taxi-dialog');
    $('#taxi-open')?.addEventListener('click', () => taxiDialog?.showModal());

    const lightbox = $('#lightbox');
    const lightboxImage = lightbox && $('img', lightbox);
    $$('.zoom').forEach((button) => {
      button.addEventListener('click', () => {
        lightboxImage.src = button.dataset.full;
        lightboxImage.alt = $('img', button)?.alt ?? '';
        lightbox.showModal();
      });
    });
  }

  /* ---------- Booking form ---------- */

  function initBookingForm() {
    const form = $('#booking-form');
    const status = $('#form-status');
    if (!form || !status) return;

    const field = (name) => form.elements.namedItem(name);
    const setStatus = (message, type = '') => {
      status.textContent = message;
      status.className = type ? `form__status is-${type}` : 'form__status';
    };
    const isValid = () =>
      field('name').value.trim() !== '' &&
      field('phone').value.trim().length >= 5 &&
      field('consent').checked;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!isValid()) {
        setStatus(t('form.invalid'), 'error');
        return;
      }
      if (IS_STATIC_DEMO) {
        setStatus(t('form.demo'), 'info');
        return;
      }

      const submitButton = $('button[type="submit"]', form);
      submitButton.disabled = true;
      setStatus(t('form.sending'));

      try {
        const data = new FormData(form);
        data.append('ajax', '1');
        const response = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        const result = await response.json().catch(() => ({ ok: false }));

        if (result.ok) {
          form.reset();
          field('lang').value = currentLang;
          setStatus(t('form.success'), 'ok');
        } else {
          setStatus(t('form.error'), 'error');
        }
      } catch {
        setStatus(t('form.error'), 'error');
      } finally {
        submitButton.disabled = false;
      }
    });

    // Result of a submission made without JavaScript (send.php redirects back with ?sent=1|0).
    const sent = new URLSearchParams(window.location.search).get('sent');
    if (sent === '1') setStatus(t('form.success'), 'ok');
    if (sent === '0') setStatus(t('form.error'), 'error');
  }

  /* ---------- Init ---------- */

  initLanguage();
  initMenu();
  initHeaderShadow();
  initAddressCopy();
  initDialogs();
  initBookingForm();

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
