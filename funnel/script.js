/* Xtreme Commercial Services — funnel helpers
   UTM capture + pass-through, form iframe params, sticky CTA, FAQ accordion.
   Loaded at the end of <body>, before the form embed script. */
(function () {
  'use strict';

  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
              'fbclid', 'gclid', 'ttclid', 'msclkid'];
  var STORE = 'xcs_attribution';

  document.documentElement.classList.add('js');

  /* ---------- UTM capture (sessionStorage) ---------- */
  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function writeStore(data) {
    try { sessionStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
  }

  var params = new URLSearchParams(window.location.search);
  var stored = readStore();
  var fresh = {};
  KEYS.forEach(function (k) {
    var v = params.get(k);
    if (v) fresh[k] = v;
  });
  // A new ad click replaces the old attribution set; otherwise keep what we have.
  var attribution = Object.keys(fresh).length ? fresh : stored;
  writeStore(attribution);

  function withAttribution(url) {
    var u = new URL(url, window.location.href);
    Object.keys(attribution).forEach(function (k) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, attribution[k]);
    });
    return u.toString();
  }

  window.XCS = { attribution: attribution, withAttribution: withAttribution };

  /* ---------- Append UTMs to internal links (landing -> thank-you, legal pages) ---------- */
  if (Object.keys(attribution).length) {
    document.querySelectorAll('a[data-keep-utm]').forEach(function (a) {
      a.href = withAttribution(a.getAttribute('href'));
    });

    /* ---------- Pass UTMs into the form embed ----------
       The LeadConnector form reads query params from its iframe URL into hidden fields
       with matching keys. Add those hidden fields in the form builder (see landing.html). */
    document.querySelectorAll('iframe[data-form-id]').forEach(function (frame) {
      frame.src = withAttribution(frame.getAttribute('src'));
    });
  }

  /* ---------- Sticky CTA: show after the hero, hide while the form is on screen ---------- */
  var sticky = document.querySelector('[data-sticky-cta]');
  var hero = document.querySelector('.hero');
  var form = document.getElementById('quote');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var pastHero = false;
    var formVisible = false;
    var update = function () {
      var show = pastHero && !formVisible;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      sticky.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    };
    new IntersectionObserver(function (entries) {
      pastHero = !entries[0].isIntersecting;
      update();
    }).observe(hero);
    if (form) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.15 }).observe(form);
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('[data-faq]').forEach(function (faq, fi) {
    faq.querySelectorAll('.faq__item').forEach(function (item, i) {
      var btn = item.querySelector('.faq__q');
      var panel = item.querySelector('.faq__a');
      if (!btn || !panel) return;
      var id = 'faq-' + fi + '-' + i;
      panel.id = id;
      btn.setAttribute('aria-controls', id);
      panel.hidden = true;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
