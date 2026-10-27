/* Carrusel compartido de novedades Nexvia. Contenido administrado en novedades.json. */
(() => {
  'use strict';

  const API_BASE = 'https://nexvia-aula-api.mmo-nicolaspavon.workers.dev';
  const ROTATION_MS = 7500;
  const TRANSITION_MS = 900;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function safeHttpUrl(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function renderEmpty(root) {
    root.innerHTML = `
      <div class="nx-news-empty">
        <div>
          <div class="nx-news-empty-mark" aria-hidden="true">✦</div>
          <strong>Muy pronto, nuevas novedades</strong>
          <p>Estamos preparando anuncios, propuestas y eventos de Nexvia Educativa para compartir con vos.</p>
        </div>
      </div>`;
  }

  function buildSlide(item, index) {
    const title = escapeHtml(item.titulo || 'Novedad de Nexvia');
    const description = escapeHtml(item.descripcion || '');
    const category = escapeHtml(item.categoria || 'Novedades Nexvia');
    const alt = escapeHtml(item.alt || item.titulo || 'Imagen de novedad de Nexvia Educativa');
    const imageUrl = safeHttpUrl(item.imagen);
    const linkUrl = safeHttpUrl(item.enlace);
    const image = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${alt}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`
      : '';
    const titleMarkup = `<h3>${title}</h3>`;
    const more = linkUrl ? `<a class="nx-news-more" href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer">Ver más <span aria-hidden="true">↗</span></a>` : '';

    return `<article class="nx-news-slide${index === 0 ? ' is-current' : ''}" aria-hidden="${index === 0 ? 'false' : 'true'}" role="group" aria-roledescription="diapositiva" aria-label="${index + 1}">
      <div class="nx-news-photo${image ? '' : ' nx-news-photo--missing'}">${image}</div>
      <div class="nx-news-copy">
        <span class="nx-news-category">${category}</span>
        ${titleMarkup}
        <p>${description}</p>
        ${linkUrl ? more : ''}
      </div>
    </article>`;
  }

  function initCarousel(root, rawItems) {
    const items = (Array.isArray(rawItems) ? rawItems : [])
      .filter(item => item && item.visible !== false && String(item.titulo || '').trim() && String(item.descripcion || '').trim() && String(item.imagen || '').trim())
      .sort((a, b) => Number(a.orden || 9999) - Number(b.orden || 9999));

    if (!items.length) {
      renderEmpty(root);
      return;
    }

    root.dataset.count = String(items.length);
    root.setAttribute('aria-roledescription', 'carrusel');
    root.setAttribute('aria-label', root.getAttribute('aria-label') || 'Novedades de Nexvia Educativa');
    root.innerHTML = `
      <div class="nx-news-viewport">
        ${items.map(buildSlide).join('')}
        ${items.length > 1 ? `<div class="nx-news-arrows" aria-label="Controles del carrusel">
          <button class="nx-news-arrow" type="button" data-news-prev aria-label="Mostrar novedad anterior" title="Anterior">‹</button>
          <button class="nx-news-arrow" type="button" data-news-next aria-label="Mostrar novedad siguiente" title="Siguiente">›</button>
        </div>` : ''}
      </div>
      ${items.length > 1 ? `<div class="nx-news-dots" aria-label="Elegir novedad">${items.map((_, i) => `<button class="nx-news-dot${i === 0 ? ' is-current' : ''}" type="button" data-news-dot="${i}" aria-label="Mostrar novedad ${i + 1}" aria-current="${i === 0 ? 'true' : 'false'}"></button>`).join('')}</div>` : '<div class="nx-news-dots" aria-hidden="true"></div>'}`;

    const slides = Array.from(root.querySelectorAll('.nx-news-slide'));
    const dots = Array.from(root.querySelectorAll('[data-news-dot]'));
    const prev = root.querySelector('[data-news-prev]');
    const next = root.querySelector('[data-news-next]');
    let current = 0;
    let timer = null;
    let paused = false;

    root.querySelectorAll('.nx-news-photo img').forEach(img => {
      img.addEventListener('error', () => {
        img.remove();
        const frame = img.closest('.nx-news-photo');
        if (frame) frame.classList.add('nx-news-photo--missing');
      }, { once: true });
    });

    function goTo(index) {
      if (!slides.length || index === current) return;
      const target = (index + slides.length) % slides.length;
      const previousSlide = slides[current];
      const nextSlide = slides[target];
      previousSlide.classList.remove('is-current');
      previousSlide.classList.add('is-leaving');
      previousSlide.setAttribute('aria-hidden', 'true');
      nextSlide.classList.remove('is-leaving');
      nextSlide.classList.add('is-current');
      nextSlide.setAttribute('aria-hidden', 'false');
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === target;
        dot.classList.toggle('is-current', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
      current = target;
      window.setTimeout(() => previousSlide.classList.remove('is-leaving'), TRANSITION_MS);
    }

    function restartTimer() {
      if (timer) window.clearInterval(timer);
      timer = null;
      if (items.length > 1 && !reduceMotion) {
        timer = window.setInterval(() => {
          if (!paused && !document.hidden) goTo((current + 1) % slides.length);
        }, ROTATION_MS);
      }
    }

    if (prev) prev.addEventListener('click', () => { goTo(current - 1); restartTimer(); });
    if (next) next.addEventListener('click', () => { goTo(current + 1); restartTimer(); });
    dots.forEach(dot => dot.addEventListener('click', () => { goTo(Number(dot.dataset.newsDot)); restartTimer(); }));
    root.addEventListener('mouseenter', () => { paused = true; });
    root.addEventListener('mouseleave', () => { paused = false; });
    root.addEventListener('focusin', () => { paused = true; });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) paused = false;
    });
    restartTimer();
  }

  async function start() {
    const carousels = Array.from(document.querySelectorAll('[data-nx-news-carousel]'));
    if (!carousels.length) return;
    try {
      const response = await fetch(API_BASE + '/api/novedades', { cache: 'no-cache' });
      if (!response.ok) throw new Error('No se pudieron cargar las novedades (' + response.status + ')');
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items;
      carousels.forEach(root => initCarousel(root, items));
    } catch (error) {
      console.error('[Nexvia Novedades]', error);
      carousels.forEach(renderEmpty);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
