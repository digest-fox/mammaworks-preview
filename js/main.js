(function () {
  'use strict';

  // TODO: connect form backend (see docs/OPEN_QUESTIONS.md)
  const FORM_ENDPOINT = '';

  // Footer year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header shadow once scrolled
  const header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(!nav.classList.contains('open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Quotes carousel
  const track = document.getElementById('quotes-track');
  if (track) {
    const slides = track.children;
    const controls = document.querySelector('.carousel-controls');
    const dots = controls.querySelector('.carousel-dots');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goTo(i) {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[n].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function current() {
      return Math.round(track.scrollLeft / (slides[0].offsetWidth + 20));
    }

    Array.prototype.forEach.call(slides, function (_, i) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Show quote ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dots.appendChild(dot);
    });

    function updateDots() {
      const c = current();
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.setAttribute('aria-current', String(i === c));
      });
    }

    controls.addEventListener('click', function (e) {
      const btn = e.target.closest('.carousel-btn');
      if (btn) goTo(current() + Number(btn.dataset.dir));
    });
    track.addEventListener('scroll', updateDots, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
    });

    controls.hidden = false;
    updateDots();
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Waiting-list form
  const form = document.getElementById('waitlist-form');
  const success = document.getElementById('form-success');

  const rules = [
    { id: 'name', message: 'Please enter your name.', valid: function (el) { return el.value.trim() !== ''; } },
    { id: 'email', message: 'Please enter a valid email.', valid: function (el) { return el.value.trim() !== '' && el.checkValidity(); } },
    { id: 'age', message: "Please select your child's age.", valid: function (el) { return el.value !== ''; } },
    { id: 'consent', message: 'Please confirm your consent.', valid: function (el) { return el.checked; } }
  ];

  function validate() {
    let firstInvalid = null;
    rules.forEach(function (rule) {
      const el = document.getElementById(rule.id);
      const err = document.getElementById(rule.id + '-error');
      const ok = rule.valid(el);
      el.closest('.field').classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      err.textContent = ok ? '' : rule.message;
      if (!ok && !firstInvalid) firstInvalid = el;
    });
    return firstInvalid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      age: form.age.value,
      days: form.days.value,
      consent: form.consent.checked
    };

    // Honeypot: silently pretend success for bots
    if (form.website.value) {
      showSuccess();
      return;
    }

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        showSuccess();
      }).catch(function () {
        const err = document.getElementById('consent-error');
        err.textContent = 'Something went wrong. Please try again.';
      });
    } else {
      console.log('Waiting-list submission (stub):', data);
      showSuccess();
    }
  });

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }
})();
