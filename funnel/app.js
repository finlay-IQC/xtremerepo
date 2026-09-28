/* Xtreme Commercial Services funnel: attribution carry-through and the slim quote bar.
   Runs at the end of <body>, ahead of the LeadConnector embed script. */
(function () {
  'use strict';

  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                'fbclid', 'gclid', 'ttclid', 'msclkid'];
  var KEY = 'xcs_attr';

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(obj) {
    try { sessionStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* private mode etc. */ }
  }

  // Fresh tags on the URL win (a new ad click); otherwise keep whatever this visit already saved.
  var query = new URLSearchParams(window.location.search);
  var incoming = {};
  FIELDS.forEach(function (f) {
    var val = query.get(f);
    if (val) incoming[f] = val;
  });
  var attr = Object.keys(incoming).length ? incoming : load();
  save(attr);

  function tag(url) {
    var u = new URL(url, window.location.href);
    Object.keys(attr).forEach(function (f) {
      if (!u.searchParams.has(f)) u.searchParams.set(f, attr[f]);
    });
    return u.toString();
  }
  window.xcsTagUrl = tag;

  if (Object.keys(attr).length) {
    // Internal links keep the tags (landing -> legal pages, thank-you -> legal pages)
    document.querySelectorAll('a[data-utm-link]').forEach(function (a) {
      a.href = tag(a.getAttribute('href'));
    });
    // The form reads matching hidden fields from its own iframe URL
    document.querySelectorAll('iframe[data-form-id]').forEach(function (f) {
      f.src = tag(f.getAttribute('src'));
    });
  }

  // Slim quote bar: on once the hero has scrolled away, off while the form is in view
  var bar = document.querySelector('[data-xcs-topcta]');
  var hero = document.querySelector('.xcs-hero');
  var form = document.getElementById('quote');
  if (bar && hero && 'IntersectionObserver' in window) {
    var heroGone = false, formShowing = false;
    var sync = function () {
      var on = heroGone && !formShowing;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      bar.querySelectorAll('a').forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    };
    new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; sync(); }).observe(hero);
    if (form) {
      new IntersectionObserver(function (e) { formShowing = e[0].isIntersecting; sync(); }, { threshold: 0.1 }).observe(form);
    }
  }

  document.querySelectorAll('[data-xcs-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
