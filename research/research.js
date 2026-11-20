document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle?.querySelector('i');
  const progressBar = document.getElementById('scroll-progress');

  const syncThemeIcon = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    if (themeIcon) themeIcon.className = dark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    themeToggle?.setAttribute('aria-pressed', String(dark));
  };

  themeToggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('devyhb-theme', next); } catch { /* Storage optional. */ }
    syncThemeIcon();
  });
  syncThemeIcon();

  let scrollScheduled = false;
  const updateProgress = () => {
    scrollScheduled = false;
    if (!progressBar) return;
    const maxScroll = Math.max(1, root.scrollHeight - root.clientHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    progressBar.style.transform = `scaleX(${ratio})`;
  };
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  // Wire Copy buttons on preformatted code blocks.
  document.querySelectorAll('.code-block').forEach(block => {
    const btn = block.querySelector('.copy-btn');
    const pre = block.querySelector('pre');
    if (!btn || !pre) return;
    btn.addEventListener('click', async () => {
      const label = btn.querySelector('span');
      const original = label ? label.textContent : btn.textContent;
      try {
        await navigator.clipboard.writeText(pre.textContent || '');
        if (label) label.textContent = 'Copied';
        setTimeout(() => { if (label) label.textContent = original; }, 1600);
      } catch {
        if (label) label.textContent = 'Select text';
        setTimeout(() => { if (label) label.textContent = original; }, 1600);
      }
    });
  });

  // Highlight active section in sticky Table of Contents.
  const tocLinks = Array.from(document.querySelectorAll('.toc-list a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const sections = tocLinks
      .map(link => document.getElementById(link.getAttribute('href').slice(1)))
      .filter(Boolean);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    sections.forEach(sec => observer.observe(sec));
  }
});
