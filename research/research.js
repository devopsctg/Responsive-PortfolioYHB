document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle?.querySelector('i');
  const progressBar = document.getElementById('scroll-progress');
  const scrollTopBtn = document.getElementById('scrollTop');
  const liveRegion = document.getElementById('researchLiveRegion');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const announce = (msg) => {
    if (!liveRegion) return;
    liveRegion.textContent = '';
    requestAnimationFrame(() => { liveRegion.textContent = msg; });
  };

  // ─── THEME TOGGLE ────────────────────────────────────────────────────────
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

  // ─── SCROLL PROGRESS & BACK TO TOP ───────────────────────────────────────
  let scrollScheduled = false;
  const updateProgress = () => {
    scrollScheduled = false;
    const maxScroll = Math.max(1, root.scrollHeight - root.clientHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;
    if (scrollTopBtn) scrollTopBtn.classList.toggle('vis', window.scrollY > 420);
  };
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // ─── SYNTAX HIGHLIGHTER (ZERO DEPENDENCY) ────────────────────────────────
  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const LANG_GRAMMARS = {
    kql: {
      regex: /(?<com>\/\/[^\n]*)|(?<str>@"(?:""|[^"])*"|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<fn>\b(?:ago|isempty|iff|strcat_array|pack_array|trim|replace_regex|tostring)\b)|(?<kw>\b(?:let|where|extend|project|sort|by|and|or|not|desc|asc|in~|has_any|has|contains|matches|regex)\b)|(?<num>\b\d+[dhms]?\b)|(?<op>\|)/g
    },
    yaml: {
      regex: /(?<com>#[^\n]*)|(?<str>"(?:\\.|[^"\\])*"|'(?:[^']|'')*')|(?<op>^[ \t]*-[ \t]+)|(?<key>(?:[A-Za-z0-9_.*|-]+)(?=:))|(?<kw>\b(?:true|false|experimental|stable|medium|high|critical|low)\b)/gm
    },
    powershell: {
      regex: /(?<com>#[^\n]*)|(?<str>"(?:\\.|[^"\\])*"|'[^']*')|(?<var>\$[A-Za-z_][A-Za-z0-9_]*)|(?<fn>\[[A-Za-z0-9_.]+(?:\[\])?\])|(?<kw>\b(?:if|else|throw|return|foreach|function|param)\b|-(?:bor|band|not|and|or|eq|ne|match|like)\b)|(?<num>\b\d+\b)/g
    },
    eql: {
      regex: /(?<com>\/\/[^\n]*)|(?<str>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<kw>\b(?:process|file|network|registry|where|and|or|not)\b)|(?<var>\??[a-z_]+(?:\.[a-z_]+)+)|(?<op>==|!=|:)/g
    },
    bash: {
      regex: /(?<str>"(?:\\.|[^"\\])*"|'[^']*')|(?<kw>\b(?:ssh\.exe|cmd|powershell|user@host)\b)|(?<op>(?:^|\s)-[A-Za-z0-9]+\b)/gm
    },
    regex: {
      regex: /(?<kw>\(\?[imxs:-]+\)|\(\?:)|(?<rx>\[[^\]]+\]|\\[dDwWsSbB]|[*+?{}()|])/g
    }
  };

  const highlightCode = (raw, lang) => {
    const grammar = LANG_GRAMMARS[lang];
    if (!grammar) return escapeHtml(raw);
    const re = new RegExp(grammar.regex.source, grammar.regex.flags);
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(raw)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      if (m.index > last) out += escapeHtml(raw.slice(last, m.index));
      let cls = '';
      if (m.groups) {
        for (const [k, v] of Object.entries(m.groups)) {
          if (v !== undefined) { cls = k; break; }
        }
      }
      out += cls ? `<span class="tok-${cls}">${escapeHtml(m[0])}</span>` : escapeHtml(m[0]);
      last = m.index + m[0].length;
    }
    if (last < raw.length) out += escapeHtml(raw.slice(last));
    return out;
  };

  document.querySelectorAll('.code-block').forEach(block => {
    const lang = block.dataset.lang;
    const codeEl = block.querySelector('pre code');
    if (!codeEl) return;
    const raw = codeEl.textContent || '';
    codeEl.dataset.rawCode = raw;
    if (lang && LANG_GRAMMARS[lang]) {
      codeEl.innerHTML = highlightCode(raw, lang);
    }
  });

  // ─── COPY BUTTONS ON CODE BLOCKS ─────────────────────────────────────────
  document.querySelectorAll('.code-block').forEach(block => {
    const btn = block.querySelector('.copy-btn');
    const pre = block.querySelector('pre');
    const codeEl = pre?.querySelector('code');
    if (!btn || !pre) return;

    btn.addEventListener('click', async () => {
      const label = btn.querySelector('span');
      const icon = btn.querySelector('i');
      const original = label ? label.textContent : btn.textContent;
      const rawText = codeEl?.dataset.rawCode ?? pre.textContent ?? '';
      try {
        await navigator.clipboard.writeText(rawText);
        btn.classList.add('copied');
        if (icon) icon.className = 'bi bi-check2';
        if (label) label.textContent = 'Copied';
        announce('Code snippet copied to clipboard.');
      } catch {
        if (label) label.textContent = 'Select text';
        announce('Clipboard unavailable; please select text manually.');
      }
      setTimeout(() => {
        btn.classList.remove('copied');
        if (icon) icon.className = 'bi bi-clipboard';
        if (label) label.textContent = original;
      }, 1600);
    });
  });

  // ─── HEADING PERMALINK ANCHORS ───────────────────────────────────────────
  document.querySelectorAll('.prose section[id] > h2, .prose h3[id]').forEach(heading => {
    const id = heading.id || heading.closest('section[id]')?.id;
    if (!id) return;
    const anchor = document.createElement('button');
    anchor.type = 'button';
    anchor.className = 'heading-anchor';
    anchor.textContent = '#';
    anchor.setAttribute('aria-label', `Copy link to ${heading.textContent.trim()}`);
    anchor.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}#${id}`;
      history.replaceState(null, '', `#${id}`);
      try {
        await navigator.clipboard.writeText(url);
        anchor.classList.add('copied');
        anchor.textContent = '✓';
        announce('Section link copied.');
        setTimeout(() => {
          anchor.classList.remove('copied');
          anchor.textContent = '#';
        }, 1200);
      } catch {
        location.hash = id;
      }
    });
    heading.appendChild(anchor);
  });

  // ─── SHARE ARTICLE BUTTON ────────────────────────────────────────────────
  const shareBtn = document.getElementById('shareArticleBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
      const label = shareBtn.querySelector('span');
      const icon = shareBtn.querySelector('i');
      const original = label ? label.textContent : 'Copy link';
      try {
        await navigator.clipboard.writeText(canonical);
        shareBtn.classList.add('copied');
        if (icon) icon.className = 'bi bi-check2';
        if (label) label.textContent = 'Link copied';
        announce('Article link copied to clipboard.');
      } catch {
        if (label) label.textContent = 'Copy URL from bar';
      }
      setTimeout(() => {
        shareBtn.classList.remove('copied');
        if (icon) icon.className = 'bi bi-share';
        if (label) label.textContent = original;
      }, 1600);
    });
  }

  // ─── STICKY & MOBILE COLLAPSIBLE TABLE OF CONTENTS ───────────────────────
  const tocDetails = document.querySelector('.toc-details');
  const mobileMq = window.matchMedia('(max-width: 980px)');
  if (tocDetails && mobileMq.matches) {
    tocDetails.removeAttribute('open');
  }

  const tocLinks = Array.from(document.querySelectorAll('.toc-list a[href^="#"]'));
  tocLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (tocDetails && mobileMq.matches) {
        tocDetails.removeAttribute('open');
      }
    });
  });

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

  // ─── UPSTREAM MATRIX FILTER, SEARCH & TELEMETRY SYNC ─────────────────────
  const matrixTable = document.getElementById('upstreamMatrix');
  const matrixRows = matrixTable ? Array.from(matrixTable.querySelectorAll('tbody tr')) : [];
  const filterButtons = Array.from(document.querySelectorAll('.mfilt-btn[data-filter]'));
  const matrixSearch = document.getElementById('matrixSearch');
  const matrixCount = document.getElementById('matrixCount');
  const matrixEmpty = document.getElementById('matrixEmpty');
  let activeFilter = 'all';

  const applyMatrixFilters = () => {
    if (!matrixRows.length) return;
    const query = (matrixSearch?.value || '').trim().toLowerCase();
    let visible = 0;

    matrixRows.forEach(row => {
      const status = row.dataset.status || 'review';
      const matchesStatus = activeFilter === 'all' || status === activeFilter;
      const matchesQuery = !query || (row.textContent || '').toLowerCase().includes(query);
      const show = matchesStatus && matchesQuery;
      row.hidden = !show;
      if (show) visible++;
    });

    if (matrixCount) {
      matrixCount.textContent = `Showing ${visible} / ${matrixRows.length}`;
    }
    if (matrixEmpty) {
      matrixEmpty.hidden = visible > 0;
    }
  };

  const refreshHubCounts = () => {
    if (!matrixRows.length) return;
    let mergedTotal = 0;
    let approvedTotal = 0;
    let reviewTotal = 0;
    let mergedRows = 0;
    let approvedRows = 0;
    let reviewRows = 0;

    matrixRows.forEach(row => {
      const status = row.dataset.status || 'review';
      const count = Number(row.dataset.prCount || '1');
      if (status === 'merged') {
        mergedRows++;
        mergedTotal += count;
      } else if (status === 'approved') {
        approvedRows++;
        approvedTotal += count;
      } else {
        reviewRows++;
        reviewTotal += count;
      }
    });

    const kpiMerged = document.getElementById('kpiMergedCount');
    const kpiApproved = document.getElementById('kpiApprovedCount');
    const kpiReview = document.getElementById('kpiReviewCount');
    if (kpiMerged) kpiMerged.textContent = String(mergedTotal);
    if (kpiApproved) kpiApproved.textContent = String(approvedTotal);
    if (kpiReview) kpiReview.textContent = String(reviewTotal);

    filterButtons.forEach(btn => {
      const f = btn.dataset.filter;
      const countSpan = btn.querySelector('.mfilt-count');
      if (!countSpan) return;
      if (f === 'all') countSpan.textContent = String(matrixRows.length);
      else if (f === 'merged') countSpan.textContent = String(mergedRows);
      else if (f === 'approved') countSpan.textContent = String(approvedRows);
      else if (f === 'review') countSpan.textContent = String(reviewRows);
    });
  };

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter || 'all';
      filterButtons.forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', String(isCurrent));
      });
      applyMatrixFilters();
    });
  });

  matrixSearch?.addEventListener('input', applyMatrixFilters);

  const syncHost = document.querySelector('[data-telemetry-src]');
  if (syncHost) {
    const telemetrySrc = syncHost.dataset.telemetrySrc;
    fetch(telemetrySrc, { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(snap => {
        const prs = snap.prs || {};
        document.querySelectorAll('[data-pr]').forEach(el => {
          const info = prs[el.dataset.pr];
          if (!info) return;
          const badge = el.querySelector('.pipe-status');
          if (!badge) return;

          if (info.merged) {
            if (el.tagName === 'TR') el.dataset.status = 'merged';
            badge.className = 'pipe-status status-merged';
            const icon = document.createElement('i');
            icon.className = 'bi bi-check-circle-fill';
            icon.setAttribute('aria-hidden', 'true');
            const label = el.classList.contains('pipe-node') ? ' Merged & Live' : ' MERGED';
            badge.replaceChildren(icon, document.createTextNode(label));
          } else if (info.state === 'open' && Number.isInteger(info.approvals) && info.approvals > 0) {
            if (el.tagName === 'TR') el.dataset.status = 'approved';
            badge.className = 'pipe-status status-approved';
            const icon = document.createElement('i');
            icon.className = 'bi bi-patch-check-fill';
            icon.setAttribute('aria-hidden', 'true');
            const suffix = info.approvals >= 2 ? ` (×${info.approvals})` : ` (${info.approvals}/2)`;
            badge.replaceChildren(icon, document.createTextNode(el.classList.contains('pipe-node') ? ` Approved${suffix}` : ` APPROVED${suffix}`));
          } else if (info.state === 'open') {
            if (el.tagName === 'TR') el.dataset.status = 'review';
            badge.className = 'pipe-status status-review';
            const icon = document.createElement('i');
            icon.className = 'bi bi-hourglass-split';
            icon.setAttribute('aria-hidden', 'true');
            badge.replaceChildren(icon, document.createTextNode(el.classList.contains('pipe-node') ? ' In Review' : ' IN REVIEW'));
          }
        });

        const syncBadge = document.getElementById('telemetrySyncBadge');
        if (syncBadge && typeof snap.generated_at === 'string') {
          syncBadge.textContent = `Snapshot: ${snap.generated_at.slice(0, 10)}`;
        }

        refreshHubCounts();
        applyMatrixFilters();
      })
      .catch(() => {
        refreshHubCounts();
        applyMatrixFilters();
      });
  } else {
    refreshHubCounts();
    applyMatrixFilters();
  }
});
