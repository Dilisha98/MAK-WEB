'use strict';
document.addEventListener('DOMContentLoaded', function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Fixed header: add background once the page scrolls ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---- Mobile menu: close after tapping a link, on Escape, or when resized to desktop ---- */
  var navToggle = document.getElementById('navToggle');
  if (navToggle) {
    document.querySelectorAll('.nav-menu a').forEach(function (a) {
      a.addEventListener('click', function () { navToggle.checked = false; });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') navToggle.checked = false; });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) navToggle.checked = false; });
  }

  /* ---- Land exactly on #section links after images finish loading ---- */
  if (location.hash.length > 1) {
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) window.addEventListener('load', function () { target.scrollIntoView({ behavior: 'auto' }); });
  }

  /* ---- Client photos: use the placeholder until a real photo exists ---- */
  document.querySelectorAll('.client-photo img').forEach(function (img) {
    var fallback = function () {
      if (img.dataset.fb !== '1') { img.dataset.fb = '1'; img.src = 'assets/images/clients/placeholder.svg'; }
    };
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  });

  /* ---- Campaign slider ---- */
  var track = document.getElementById('sliderTrack');
  var dotsWrap = document.getElementById('sliderDots');
  var prevBtn = document.getElementById('sliderPrev');
  var nextBtn = document.getElementById('sliderNext');
  if (track && dotsWrap && prevBtn && nextBtn) {
    var slides = track.querySelectorAll('.slide'), current = 0, timer = null, startX = 0;
    var dots = [];
    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'slider-dot';
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(d); dots.push(d);
    });
    function render() {
      track.style.transform = 'translateX(-' + current * 100 + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }
    function goTo(i) { current = (i + slides.length) % slides.length; render(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!reduce) timer = setInterval(function () { goTo(current + 1); }, 5000); }
    function restart() { start(); }
    prevBtn.addEventListener('click', function () { goTo(current - 1); restart(); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); restart(); });
    var box = track.closest('.campaign-slider');
    box.addEventListener('mouseenter', stop); box.addEventListener('mouseleave', start);
    box.addEventListener('focusin', stop); box.addEventListener('focusout', start);
    track.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { goTo(current + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });
    render(); start();
  }


  /* ---- Balanced gallery: spread artworks over columns so every column ends at about the same height ---- */
  var gallery = document.querySelector('.content-design-gallery');
  if (gallery) {
    var figs = Array.prototype.slice.call(gallery.children);
    var ratios = figs.map(function (f) { var i = f.querySelector('img'); return i.getAttribute('height') / i.getAttribute('width'); });
    var cols = 0;
    var best = function (n) {
      var total = Math.pow(n, figs.length), pick = null, score = Infinity, k, j, c, h, mx, mn, code;
      for (k = 0; k < total; k++) {
        h = []; for (c = 0; c < n; c++) h.push(0);
        code = k; for (j = 0; j < figs.length; j++) { h[code % n] += ratios[j]; code = Math.floor(code / n); }
        mx = Math.max.apply(null, h); mn = Math.min.apply(null, h);
        if (mn > 0 && mx - mn < score) { score = mx - mn; pick = k; }
      }
      return pick;
    };
    var layout = function () {
      var n = window.innerWidth <= 760 ? 2 : window.innerWidth <= 1000 ? 3 : 4;
      if (n === cols) return; cols = n;
      var code = best(n), cl = [], j, c;
      for (c = 0; c < n; c++) { var d = document.createElement('div'); d.className = 'gallery-col'; cl.push(d); }
      for (j = 0; j < figs.length; j++) { cl[code % n].appendChild(figs[j]); code = Math.floor(code / n); }
      gallery.textContent = ''; cl.forEach(function (d) { gallery.appendChild(d); });
      gallery.classList.add('is-balanced');
    };
    layout(); window.addEventListener('resize', layout);
  }

  /* ---- Artwork lightbox (Our Work page) ---- */
  var lb = document.getElementById('contentArtLightbox');
  var lbImg = document.getElementById('contentArtLightboxImage');
  var lbClose = document.getElementById('contentArtLightboxClose');
  if (lb && lbImg && lbClose) {
    var opener = null;
    var open = function (img) {
      opener = img; lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || 'Artwork full view';
      lb.classList.add('is-open'); document.body.classList.add('lightbox-open'); lbClose.focus();
    };
    var close = function () {
      lb.classList.remove('is-open'); document.body.classList.remove('lightbox-open');
      lbImg.removeAttribute('src'); if (opener) opener.focus();
    };
    document.querySelectorAll('.content-art-card img, .poster-marquee img').forEach(function (img) {
      img.addEventListener('click', function () { open(img); });
      if (img.closest('[aria-hidden="true"]')) return;   /* looped duplicates: mouse/touch only */
      img.tabIndex = 0; img.setAttribute('role', 'button');
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
    });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  }

});