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
      const isEs = root.getAttribute('lang') === 'es';
      try {
        await navigator.clipboard.writeText(rawText);
        btn.classList.add('copied');
        if (icon) icon.className = 'bi bi-check2';
        if (label) label.textContent = isEs ? 'Copiado' : 'Copied';
        announce(isEs ? 'Fragmento de código copiado al portapapeles.' : 'Code snippet copied to clipboard.');
      } catch {
        if (label) label.textContent = isEs ? 'Seleccionar texto' : 'Select text';
        announce(isEs ? 'Portapapeles no disponible; seleccione el texto manualmente.' : 'Clipboard unavailable; please select text manually.');
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
        announce(root.getAttribute('lang') === 'es' ? 'Enlace de sección copiado.' : 'Section link copied.');
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
      const isEs = root.getAttribute('lang') === 'es';
      try {
        await navigator.clipboard.writeText(canonical);
        shareBtn.classList.add('copied');
        if (icon) icon.className = 'bi bi-check2';
        if (label) label.textContent = isEs ? 'Enlace copiado' : 'Link copied';
        announce(isEs ? 'Enlace del artículo copiado al portapapeles.' : 'Article link copied to clipboard.');
      } catch {
        if (label) label.textContent = isEs ? 'Copie la URL del navegador' : 'Copy URL from bar';
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
      matrixCount.textContent = (root.getAttribute('lang') === 'es' ? `Mostrando ${visible} / ${matrixRows.length}` : `Showing ${visible} / ${matrixRows.length}`);
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


  // ─── TRANSLATIONS (I18N) ──────────────────────────────────────────────────
  const langToggle = document.getElementById('langToggle');
  const translations = {
  "es": {
    "nav-portfolio": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Portafolio",
    "nav-all-research": "<i class=\"bi bi-grid\" aria-hidden=\"true\"></i> Todas las Investigaciones",
    "crumb-research": "Investigaciones",
    "footer-portfolio": "Portafolio",
    "footer-research": "Centro de Investigaciones",
    "btn-back-to-top": "Volver arriba",
    "btn-share-article": "Compartir artículo",
    "footer-copy": "&copy; 2026 <strong>Yared Henriquez (DevCop95 / Dev101x)</strong> &middot; Cartagena, Colombia",
    "footer-links-hub": "<a href=\"../\">Portafolio</a> &middot; <a href=\"feed.xml\">Canal RSS</a> &middot; <a href=\"https://github.com/DevCop95\" rel=\"noopener\" target=\"_blank\">GitHub</a> &middot; <a href=\"https://www.linkedin.com/in/yared-dev\" rel=\"noopener\" target=\"_blank\">LinkedIn</a>",
    "footer-links-art": "<a href=\"../../\">Portafolio</a> &middot; <a href=\"../\">Centro de Investigaciones</a> &middot; <a href=\"../feed.xml\">Canal RSS</a> &middot; <a href=\"https://github.com/DevCop95\" rel=\"noopener\" target=\"_blank\">GitHub</a>",
    "hub-kicker": "<i class=\"bi bi-diagram-3\" aria-hidden=\"true\"></i> Centro de Investigación Ofensiva a Defensiva",
    "hub-title": "Ingeniería de Detección e <em>Investigación de Amenazas</em>",
    "hub-lead": "Análisis técnicos profundos de ingeniería que documentan ciclos completos de <strong>Ofensiva &rarr; Emulación &rarr; Detección</strong>: transformando técnicas nativas de Windows en entradas revisadas por pares en <strong>LOLBAS</strong>, pruebas en <strong>Atomic Red Team</strong>, monitores de handles en kernel Win32 y detecciones multi-SIEM verificadas en <strong>Sigma</strong>, <strong>Elastic EQL</strong> y <strong>Microsoft Sentinel KQL</strong>.",
    "hub-meta-author": "<i aria-hidden=\"true\" class=\"bi bi-person-badge\"></i> Yared Henriquez (DevCop95)",
    "hub-pill-focus": "<i class=\"bi bi-shield-check\" aria-hidden=\"true\"></i> Enfoque: Ingeniería de Detección y Seguridad de IA Aplicada",
    "hub-pill-cited": "<i class=\"bi bi-building\" aria-hidden=\"true\"></i> Herramientas citadas por CUHK ITSC",
    "kpi-merged-lbl": "PRs Aprobados (Merged)",
    "kpi-approved-lbl": "Detecciones Aprobadas",
    "kpi-review-lbl": "PRs Activos en Revisión",
    "kpi-mitre-lbl": "Técnicas MITRE ATT&CK",
    "method-01-num": "01 · Tácticas",
    "method-01-title": "LOLBAS e Internals",
    "method-01-sub": "Aislar rutas de ejecución nativas y mecánicas de handles Win32.",
    "method-02-num": "02 · Emulación",
    "method-02-title": "Pruebas Atómicas Seguras",
    "method-02-sub": "Generar telemetría repetible en el endpoint sin saturar el sistema.",
    "method-03-num": "03 · Detección",
    "method-03-title": "Sigma · KQL · EQL",
    "method-03-sub": "Contemplar binarios renombrados, indirección por config y casos borde en RE2 puro.",
    "method-04-num": "04 · Verificación",
    "method-04-title": "Harnesses Empíricos",
    "method-04-sub": "Medir tasas de TP/FP en ADX, evtx-sigma-checker y CI de repositorios.",
    "hub-ssh-title": "Abuso de Windows OpenSSH (<code>KnownHostsCommand</code> y <code>PermitLocalCommand</code>) y Mitigación de Evasiones First-Match-Wins en KQL y Sigma",
    "hub-ssh-stat": "12/12 TP · 0/9 FP (ADX)",
    "hub-ssh-telemetry": "DeviceProcessEvents · Sysmon EID 1 · 24/24 Sentinel CI",
    "hub-ssh-tag-1": "LOLBAS #539 &amp; #532 (Aprobados)",
    "hub-ssh-tag-2": "SigmaHQ #6585",
    "hub-ssh-tag-3": "Azure-Sentinel #15693 (Aprobado)",
    "hub-ssh-tag-4": "RE2 / KQL",
    "hub-ssh-desc": "Compara la ejecución previa a la autenticación (<code>KnownHostsCommand</code>) frente a la posterior a la autenticación (<code>PermitLocalCommand</code> / <code>LocalCommand</code>, Star Blizzard <em>RedFlick</em>) en <code>ssh.exe</code>, modela puntos ciegos de CLI con <code>-F</code> / <code>.ssh/config</code> mediante linaje de procesos hijos y construye un autómata KQL en RE2 puro validado en Azure Data Explorer.",
    "hub-ssh-cta": "Leer investigación completa <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "hub-ssh-read": "2026-11-20 &middot; 9 min de lectura",
    "hub-bdb-title": "De DoS por Agotamiento de Disco contra Windows Defender (<code>fsutil.exe</code> / BigDiskBuster) a Detección Multi-SIEM y Handles de Kernel",
    "hub-bdb-stat": "45s &rarr; 6–14s &middot; Citado por CUHK ITSC",
    "hub-bdb-telemetry": "Win32 Restart Manager · NtQuerySystemInformation · Sysmon EID 11 · EQL",
    "hub-bdb-tag-1": "Citado por CUHK ITSC",
    "hub-bdb-tag-2": "LOLBAS #525 (Aprobado)",
    "hub-bdb-tag-3": "Atomic #3439 (Aprobado)",
    "hub-bdb-tag-4": "Sigma #6310 (Aprobado)",
    "hub-bdb-tag-5": "Elastic #6946 (Aprobado &times;2)",
    "hub-bdb-desc": "Rastrea la evasión por agotamiento de disco (<code>ERROR_DISK_FULL</code>) tanto en asignación nativa de NT (BigDiskBuster) como en ejecución de LOLBins (<code>fsutil.exe file createnew</code>): desde <code>BDB-Guardian</code> (citado por CUHK ITSC) y la depuración de <code>0xC0000374</code> / bloqueos de tuberías en escaneo de handles Win32 hasta <strong>Atomic Red Team #3439</strong>, <strong>SigmaHQ #6310</strong> y <strong>Elastic #6946</strong>.",
    "hub-bdb-cta": "Leer investigación completa <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "hub-bdb-read": "2026-11-20 &middot; 10 min de lectura",
    "mitre-kicker": "<i class=\"bi bi-bullseye\" aria-hidden=\"true\"></i> Mapa de Cobertura MITRE ATT&CK",
    "mitre-card-1-title": "Ejecución Indirecta de Comandos (<code>ssh.exe</code>)",
    "mitre-card-1-tactic": "Ejecución / Evasión",
    "mitre-card-1-desc": "Abuso de vectores CLI previos (<code>KnownHostsCommand</code>) y posteriores (<code>PermitLocalCommand</code>) a la autenticación en <code>ssh.exe</code>; caza de linaje de procesos hijos en Microsoft Sentinel KQL y Sigma.",
    "mitre-card-2-title": "Privación de Actualizaciones de Defender y <code>fsutil.exe</code>",
    "mitre-card-2-tactic": "Evasión de Defensas",
    "mitre-card-2-desc": "Denegación de servicio contra actualizaciones de Defender mediante agotamiento de espacio libre (<code>BigDiskBuster</code> y <code>fsutil.exe</code>); monitoreo de handles Win32 y reglas multi-SIEM.",
    "mitre-card-3-title": "Gestores de Contraseñas (Descubrimiento KeePass)",
    "mitre-card-3-tactic": "Acceso a Credenciales",
    "mitre-card-3-desc": "Emulación de adversarios para descubrimiento de bases de datos KeePass, análisis de archivos de configuración y preparación de credenciales en Atomic Red Team (<code>#3433</code>).",
    "mitre-card-4-title": "Software de Acceso Remoto (AnyDesk Personalizado)",
    "mitre-card-4-tactic": "Comando y Control",
    "mitre-card-4-desc": "Reglas de detección para esquemas personalizados de nombres de clientes de acceso remoto AnyDesk por organización en LOLRMM (<code>#253</code>).",
    "matrix-kicker": "<i class=\"bi bi-table\" aria-hidden=\"true\"></i> Matriz de Trazabilidad Upstream",
    "matrix-sync-pill": "Captura: 2026-11-27",
    "matrix-th-repo": "Repositorio y PR",
    "matrix-th-domain": "Dominio",
    "matrix-th-scope": "MITRE / Alcance",
    "matrix-th-status": "Estado",
    "matrix-filt-all": "Todos",
    "matrix-filt-merged": "Aprobados",
    "matrix-filt-approved": "Aprobación parcial",
    "matrix-filt-review": "En Revisión",
    "matrix-search-ph": "Filtrar repositorio, código T, Sigma, KQL...",
    "matrix-empty": "No hay contribuciones upstream que coincidan con el filtro actual.",
    "matrix-status-merged": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> APROBADO",
    "matrix-status-7merged": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> 7 APROBADOS",
    "matrix-status-appr2": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> APROBADO (&times;2)",
    "matrix-status-appr1": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> APROBADO (1/2)",
    "matrix-status-review": "<i aria-hidden=\"true\" class=\"bi bi-hourglass-split\"></i> EN REVISIÓN",
    "matrix-r1-dom": "Documentación LOLBins",
    "matrix-r1-scope": "<code>Fsutil.exe</code> <code>file createnew</code> (T1562.001 / T1685)",
    "matrix-r2-dom": "Documentación LOLBins",
    "matrix-r2-scope": "<code>Ssh.exe</code> pre-auth <code>KnownHostsCommand</code> (T1202)",
    "matrix-r3-dom": "Documentación LOLBins",
    "matrix-r3-scope": "<code>Ssh.exe</code> <code>PermitLocalCommand=yes</code> (T1202)",
    "matrix-r4-dom": "Emulación de Adversarios",
    "matrix-r4-scope": "Descubrimiento de KeePass y análisis de configuración (T1555.005)",
    "matrix-r5-dom": "Emulación de Adversarios",
    "matrix-r5-scope": "Agotamiento de disco en Defender mediante <code>fsutil</code> (T1685)",
    "matrix-r6-dom": "Detección de RMM y Sigma",
    "matrix-r6-scope": "Cobertura de cliente personalizado de AnyDesk por organización (T1219)",
    "matrix-r7-dom": "Integridad de Señal OSINT",
    "matrix-r7-scope": "Eliminación de falsos positivos y manejo de desafíos",
    "matrix-r8-dom": "Detección EQL para Elastic",
    "matrix-r8-scope": "Uso sospechoso de <code>fsutil file createnew</code> (T1562.001)",
    "matrix-r9-dom": "Regla Sigma para Eventos de Archivo",
    "matrix-r9-scope": "Archivo GUID buster de BigDiskBuster en <code>%TEMP%</code> (T1685)",
    "matrix-r10-dom": "Paquete de Reglas Sigma para WAF",
    "matrix-r10-scope": "SafeLine WAF SQLi / XSS / CMDi (<code>product: safeline</code>)",
    "matrix-r11-dom": "Regla Sigma para Creación de Procesos",
    "matrix-r11-scope": "Windows <code>ssh.exe</code> <code>KnownHostsCommand</code> (T1202)",
    "matrix-r12-dom": "Consulta de Caza (Hunting) KQL en Sentinel",
    "matrix-r12-scope": "Ejecución indirecta en Windows OpenSSH (21 casos ADX · 24/24 CI)",
    "matrix-r13-dom": "Ingeniería de Red Teaming para IA",
    "matrix-r13-scope": "Prevención de carga útil duplicada en adjuntos de NVMultimodal",
    "rfooter-back": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver a dev101x.online",
    "rfooter-dive1": "Comenzar con Investigación 01 <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "bdb-crumb-title": "BigDiskBuster y fsutil",
    "bdb-art-kicker": "<i class=\"bi bi-terminal\" aria-hidden=\"true\"></i> Evasión de Defensas &middot; Denegación de Servicio &middot; T1685 &middot; T1562.001",
    "bdb-art-title": "De DoS por Agotamiento de Disco en Defender (<code>fsutil.exe</code> / <em>BigDiskBuster</em>) a Detección Multi-SIEM y Handles de Kernel",
    "bdb-art-read": "10 min de lectura · Publicado 2026-11-20",
    "bdb-lead": "El agotamiento de espacio en disco contra las actualizaciones de Microsoft Defender (<code>ERROR_DISK_FULL</code> / <code>0x80070070</code>) congela silenciosamente las actualizaciones de firmas y plataforma manteniendo los servicios superficialmente nominales. Este estudio de caso rastrea cómo un único modelo de amenazas evolucionó en un ecosistema defensivo de 5 etapas: desde la correlación de handles de kernel Win32 en <strong>BDB-Guardian</strong> (citado formalmente por <strong>CUHK ITSC</strong>) hasta documentación aprobada en <strong>LOLBAS</strong>, emulación segura de adversarios en <strong>Red Canary Atomic Red Team</strong> y detecciones aprobadas en <strong>SigmaHQ</strong> y <strong>Elastic Security</strong>.",
    "bdb-meta-mitre": "<i aria-hidden=\"true\" class=\"bi bi-shield-exclamation\"></i> MITRE ATT&amp;CK: T1685 · T1562.001",
    "bdb-meta-win32": "<i aria-hidden=\"true\" class=\"bi bi-cpu\"></i> Win32: Restart Manager · <code>NtQuerySystemInformation</code>",
    "bdb-meta-cited": "<i aria-hidden=\"true\" class=\"bi bi-building\"></i> Citado por: CUHK ITSC",
    "bdb-meta-read": "<i aria-hidden=\"true\" class=\"bi bi-clock\"></i> 10 min de lectura",
    "pipe-bdb-s1-stage": "01 · Monitor de Handles",
    "pipe-bdb-s1-title": "BDB-Guardian",
    "pipe-bdb-s1-status": "<i aria-hidden=\"true\" class=\"bi bi-award-fill\"></i> Citado por CUHK ITSC",
    "pipe-bdb-s2-stage": "02 · Docs LOLBin",
    "pipe-bdb-s2-title": "LOLBAS #525",
    "pipe-status-merged-live": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> Aprobado y En Vivo",
    "pipe-bdb-s3-stage": "03 · Emulación",
    "pipe-bdb-s3-title": "Atomic #3439 (T1685)",
    "pipe-bdb-s3-status": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> Aprobado (#79)",
    "pipe-bdb-s4-stage": "04 · Telemetría de Archivo",
    "pipe-bdb-s4-title": "SigmaHQ #6310",
    "pipe-bdb-s4-status": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> Aprobado (14/14 CI)",
    "pipe-bdb-s5-stage": "05 · EQL de Procesos",
    "pipe-bdb-s5-title": "Elastic #6946",
    "pipe-bdb-s5-status": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> Aprobado (&times;2)",
    "pipe-bdb-s6-stage": "06 · Producción",
    "pipe-bdb-s6-title": "Invariantes Seguras",
    "pipe-bdb-s6-status": "<i aria-hidden=\"true\" class=\"bi bi-shield-check\"></i> Cero Pérdida de Datos",
    "bdb-toc-title": "Contenido",
    "bdb-toc-1": "1. Modelo de Amenazas: NT Nativo vs. LOLBin",
    "bdb-toc-2": "2. BDB-Guardian y Lecciones Win32",
    "bdb-toc-3": "3. Emulación Segura (Atomic #3439)",
    "bdb-toc-4": "4. Reglas Multi-SIEM (Sigma y Elastic)",
    "bdb-toc-5": "5. Triaje y Respuesta a Incidentes",
    "bdb-toc-6": "6. Referencias Verificadas",
    "bdb-s1-title": "1. Modelo de Amenazas: Asignación Nativa NT vs. <code>fsutil.exe</code>",
    "bdb-s1-p1": "Los atacantes que apuntan a las actualizaciones de firmas de Windows Defender (específicamente <code>MpSigStub.exe</code> y <code>MRT.exe</code>) explotan una invariante de almacenamiento físico: cuando un volumen NTFS cae por debajo de ~50 MB de espacio libre, las rutinas de descompresión de firmas fallan silenciosamente con <code>ERROR_DISK_FULL (0x80070070)</code>, dejando al host congelado con definiciones obsoletas.",
    "bdb-s1-p2": "El agotamiento de disco como primitiva de neutralización de defensas se divide en dos implementaciones operativas que requieren capas de telemetría totalmente distintas:",
    "bdb-s1-li-varA": "<strong>Variante A — API Nativa de NT (<code>BigDiskBuster</code>):</strong> Divulgado en <a href=\"https://github.com/MSNightmare/BigDiskBuster\" rel=\"noopener\" target=\"_blank\">MSNightmare/BigDiskBuster</a> y analizado por LevelBlue SpiderLabs. El binario monitorea el volumen <code>C:</code> en busca de rutas de preparación de Defender (<code>ProgramData\\Microsoft\\Windows Defender\\Platform\\...</code> y <code>...\\Definition Updates\\{GUID}</code>) y mantiene un handle abierto sobre <code>C:\\Windows\\System32\\MRT.exe</code>. En cuanto inicia una actualización, asigna un archivo oculto con nombre GUID en <code>%TEMP%</code> dimensionado para ocupar todo el espacio libre disponible mediante <code>FILE_DELETE_ON_CLOSE</code>. Las actualizaciones de Defender fallan con <code>ERROR_DISK_FULL</code>, y al abortar la actualización, el PoC libera su handle y vuelve al estado de reposo.",
    "bdb-s1-li-varB": "<strong>Variante B — LOLBin Integrado (<code>fsutil.exe file createnew</code>):</strong> Documentado de forma upstream en <a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/525\" rel=\"noopener\" target=\"_blank\"><code>LOLBAS #525</code></a> (<code>yml/OSBinaries/Fsutil.yml</code>). Cualquier cuenta <code>User</code> sin privilegios puede invocar <code>fsutil.exe file createnew {RUTA_ABSOLUTA} {LONGITUD_EN_BYTES}</code> para preasignar archivos ficticios arbitrarios de manera instantánea sin descargar binarios nativos personalizados.",
    "bdb-s1-fig1": "Figura 1 — Telemetría de defensa en profundidad a través de Creación de Procesos (Elastic EQL), Eventos de Archivo (Sigma) y Handles de Kernel de Mismo PID (BDB-Guardian).",
    "bdb-t1-th-layer": "Capa de Telemetría",
    "bdb-t1-th-catch-native": "¿Detecta <code>BigDiskBuster</code> Nativo?",
    "bdb-t1-th-catch-lolbin": "¿Detecta LOLBin <code>fsutil</code>?",
    "bdb-t1-th-noise": "Señal-Ruido en Producción",
    "bdb-t1-r1-c1": "<strong>Creación de Procesos EDR</strong> (Sysmon 1 / Defender 4688)",
    "bdb-t1-r1-c2": "<span class=\"badge-danger\">No</span> (Las asignaciones ocurren en memoria sin generar procesos hijos)",
    "bdb-t1-r1-c3": "<span class=\"badge-success\">Sí</span> (<code>process.name == 'fsutil.exe'</code>)",
    "bdb-t1-r1-c4": "Alto ruido salvo filtrado por tamaño de argumento y ruta",
    "bdb-t1-r2-c1": "<strong>Telemetría de Eventos de Archivo</strong> (Sysmon 11 / MDE FileCreated)",
    "bdb-t1-r2-c2": "<span class=\"badge-success\">Sí</span> (Regex de GUID en <code>%TEMP%</code>)",
    "bdb-t1-r2-c3": "<span class=\"badge-success\">Sí</span> (Creación de archivo en ruta objetivo)",
    "bdb-t1-r2-c4": "Medio (instaladores legítimos usan GUIDs; exige anclaje de ruta)",
    "bdb-t1-r3-c1": "<strong>Correlación de Handles de Kernel</strong> (<code>BDB-Guardian</code>)",
    "bdb-t1-r3-c2": "<span class=\"badge-success\">Sí</span> (Mismo PID mantiene handle a <code>MRT.exe</code> + Volumen)",
    "bdb-t1-r3-c3": "<span class=\"badge-neutral\">Indirecto</span> (Detecta bloqueo de handle de escritura al volumen)",
    "bdb-t1-r3-c4": "Falsos positivos cercanos a cero (solo la correlación MRT/MpSigStub activa alerta)",
    "bdb-s2-title": "2. Cerrando el Punto Ciego de EDR: <code>BDB-Guardian</code> e Internals Win32",
    "bdb-s2-p1": "Las reglas estándar de endpoint se activan con la creación de procesos (<code>fsutil.exe file createnew</code>). Sin embargo, son ciegas ante bucles nativos de asignación NT compilados en cargadores .NET o C++ en memoria que nunca invocan un proceso hijo. Para detectar ambos sin bloquear endpoints empresariales, <code>BDB-Guardian</code> combina la <strong>Restart Manager API</strong> con el escaneo de handles nativos mediante <code>NtQuerySystemInformation(SystemHandleInformation)</code>.",
    "bdb-s2-p2": "<strong>Veredicto de Correlación de Mismo PID:</strong> Cuando un único PID no incluido en lista blanca mantiene simultáneamente un handle abierto a <code>MRT.exe</code> y al volumen del sistema, el veredicto escala inmediatamente a <strong>CRÍTICO</strong> (falsos positivos cercanos a cero), y la presencia del archivo guía GUID confirma una ejecución activa de tipo BigDiskBuster. Para aislar la memoria nativa Win32/P/Invoke del orquestador de PowerShell, <code>BDBMonitor.ps1</code> delega todas las llamadas nativas a un proceso hijo dedicado (<code>Invoke-VolumeScan.ps1</code> + C# incrustado en <code>bdb-csharp.ps1</code>).",
    "callout-bdb-title": "<i class=\"bi bi-bug\" aria-hidden=\"true\"></i> Post-Mortem de Ingeniería: Corrección de <code>0xC0000374</code> Heap Corruption y Bloqueos en Named-Pipes",
    "callout-bdb-intro": "Dos obstáculos reales de Win32 surgieron durante las pruebas en vivo de <code>BDB-Guardian</code>—documentados en el repositorio y reproducidos en el <a href=\"https://devcop95.github.io/BDB-Guardian/\" target=\"_blank\" rel=\"noopener\">informe de evidencias</a>:",
    "callout-bdb-item1": "<strong>Discordancia de estructura en <code>RmGetList</code> (<code>0xC0000374</code>):</strong> Invocar <code>RmGetList</code> con un búfer dimensionado para <code>RM_UNIQUE_PROCESS</code> en lugar de <code>RM_PROCESS_INFO</code> (~668 bytes/entrada) provoca corrupción en el heap nativo (<code>STATUS_HEAP_CORRUPTION</code>). Cambiar a <code>RM_PROCESS_INFO</code> junto a un bucle de reintento con redimensionamiento eliminó por completo los bloqueos por <code>Application Error</code> en ejecuciones consecutivas.",
    "callout-bdb-item2": "<strong>Bloqueo de tuberías en <code>NtQueryObject</code>:</strong> Consultar nombres de objetos a través de handles duplicados arbitrarios se bloquea indefinidamente en named pipes sincrónicas. Filtrar los handles donde <code>GetFileType != FILE_TYPE_DISK</code> antes de llamar a <code>NtQueryObject</code>—respaldado por límites de tiempo por PID—eliminó los bloqueos y redujo el tiempo de escaneo de handles de todo el sistema de <strong>~45 segundos a entre 6 y 14 segundos</strong>.",
    "bdb-t2-th-metric": "Dimensión Técnica",
    "bdb-t2-th-rm": "Restart Manager API (<code>RstrtMgr.dll</code>)",
    "bdb-t2-th-nt": "<code>NtQuerySystemInformation</code> (P/Invoke)",
    "bdb-t2-r1-c1": "Propósito Primario",
    "bdb-t2-r1-c2": "Handle abierto sobre <code>C:\\Windows\\System32\\MRT.exe</code>",
    "bdb-t2-r1-c3": "Windows Restart Manager (instantáneo, exacto) + escaneo por nombres nativo como respaldo",
    "bdb-t2-r2-c1": "Costo de Rendimiento",
    "bdb-t2-r2-c2": "Handle abierto sobre volumen <code>C:</code> (<code>\\Device\\HarddiskVolumeN</code>)",
    "bdb-t2-r2-c3": "<code>NtQuerySystemInformation(SystemHandleInformation)</code> + <code>NtQueryObject</code>",
    "bdb-t2-r3-c1": "Modo de Falla / Riesgo de Estabilidad",
    "bdb-t2-r3-c2": "Mismo PID mantiene ambos bloqueos simultáneamente",
    "bdb-t2-r3-c3": "Correlación en memoria a través de ambas capas de escaneo",
    "bdb-t2-r4-c1": "Rol en BDB-Guardian",
    "bdb-t2-r4-c2": "Archivo <code>{GUID}</code> oculto en <code>%TEMP%</code> dimensionado al espacio libre",
    "bdb-t2-r4-c3": "Flujo de eventos Sysmon Event ID 11 / MDE FileCreated",
    "bdb-s3-title": "3. Emulación Segura de Adversarios (<code>Atomic Red Team #3439</code> &mdash; Test #79)",
    "bdb-s3-p1": "La emulación de adversarios para agotamiento de disco conlleva un riesgo operativo inherente: las pruebas ingenuas que asignan todo el espacio libre pueden provocar la caída de hipervisores, bloquear bases de datos o disparar alertas en infraestructura ajena. Para solucionar esto, <strong>Atomic Red Team #3439</strong> introdujo el <code>Test #79 (T1685)</code> bajo estrictas invariantes de seguridad:",
    "code-cap-atomic": "YAML · T1685.yaml — Test #79 (Atomic Red Team #3439)",
    "bdb-s3-inv-1": "<strong>Tamaño de Archivo Delimitado:</strong> Asigna un archivo de prueba fijo de <code>1 MB</code> (por defecto <code>1.048.576</code> bytes) en lugar de agotar el volumen, validando la telemetría de línea de comandos sin riesgo operativo.",
    "bdb-s3-inv-2": "<strong>Objetivo GUID Determinista:</strong> Crea archivos que cumplen el patrón regex de BigDiskBuster en <code>%TEMP%</code>, permitiendo validar detecciones de eventos de archivo junto a la creación de procesos.",
    "bdb-s3-inv-3": "<strong>Comando de Limpieza sin Residuos:</strong> Acompaña cada ejecución de un <code>cleanup_command</code> automatizado que elimina el archivo de prueba inmediatamente tras la comprobación.",
    "bdb-s4-title": "4. Reglas de Detección Multi-SIEM (<code>SigmaHQ #6310</code> y <code>Elastic #6946</code>)",
    "bdb-s4-h3-sigma": "Regla de Evento de Archivo Sigma — <code>SigmaHQ/sigma #6310</code> (Aprobada)",
    "bdb-s4-p-sigma": "Para la variante nativa NT, <a href=\"https://github.com/SigmaHQ/sigma/pull/6310\" rel=\"noopener\" target=\"_blank\"><code>SigmaHQ/sigma #6310</code></a> modela creaciones de archivos en <code>%TEMP%</code> que coinciden con el patrón buster GUID. La depuración exhaustiva de falsos positivos en entornos corporativos permitió aislar creadores legítimos de temporales GUID como HP Support Assistant, TeamViewer (<code>tv_x64.exe</code>/<code>tv_w32.exe</code>) y <code>cpptools.exe</code> de VS Code, los cuales fueron excluidos sin debilitar la expresión regular central:",
    "code-cap-sigma-bdb": "YAML · file_event_win_bigdiskbuster_temp_file.yml (SigmaHQ #6310)",
    "bdb-s4-h3-elastic": "Regla EQL de Elastic Security — <code>elastic/detection-rules #6946</code> (Aprobada ×2)",
    "bdb-s4-p-elastic": "Para la variante LOLBin, <a href=\"https://github.com/elastic/detection-rules/pull/6946\" rel=\"noopener\" target=\"_blank\"><code>elastic/detection-rules #6946</code></a> detecta <code>fsutil.exe file createnew</code> en Elastic Defend, Microsoft Defender XDR, CrowdStrike, SentinelOne, Sysmon y registros de eventos de seguridad de Windows, siendo resiliente al cambio de nombre de binarios gracias a <code>?process.pe.original_file_name</code>:",
    "code-cap-elastic-bdb": "EQL · defense_evasion_suspicious_file_creation_with_fsutil.toml (Elastic #6946)",
    "bdb-s5-title": "5. Guía de Triaje y Respuesta a Incidentes",
    "bdb-s5-intro": "Cuando se dispara una alerta por <code>fsutil.exe file createnew</code> o creación sospechosa de temporales GUID, los analistas de SOC deben seguir esta secuencia rápida de triaje:",
    "bdb-s5-step-1": "<strong>Verificar estado operativo de Defender:</strong> Inspeccionar los registros de Microsoft-Windows-Windows Defender/Operational en busca de los <strong>Event IDs 2000, 2001 y 1151</strong> (fallos en actualización de firmas o plataforma con <code>0x80070070</code> / <code>ERROR_DISK_FULL</code>).",
    "bdb-s5-step-2": "<strong>Inspeccionar árbol de procesos padre y handles abiertos:</strong> Rastrear el proceso padre de <code>fsutil.exe</code> (o ejecutar <code>BDBMonitor.ps1</code> para capturar binarios nativos NT que mantengan handles a <code>MRT.exe</code> + volumen sin artefactos de creación de procesos).",
    "bdb-s5-step-3": "<strong>Remediar agotamiento y verificar recuperación:</strong> Terminar el árbol de procesos infractor, eliminar archivos ficticios o GUID sobredimensionados en <code>%TEMP%</code>, confirmar la recuperación del espacio en disco y forzar una actualización de firmas de Defender junto a un escaneo completo en busca de cargas maliciosas concurrentes.",
    "bdb-quick-title": "Acceso Rápido a Artefactos de Detección",
    "art-bdb-k1": "Monitor de Kernel",
    "art-bdb-m1": "Citado por CUHK ITSC · PowerShell + C#",
    "art-bdb-k2": "Emulación",
    "art-bdb-m2": "PR #3439 (Aprobado)",
    "art-bdb-k3": "Evento de Archivo Sigma",
    "art-bdb-m3": "SigmaHQ #6310 (Aprobado)",
    "art-bdb-k4": "EQL de Elastic",
    "art-bdb-m4": "Elastic #6946 (Aprobado ×2)",
    "bdb-s6-title": "6. Referencias Verificadas",
    "bdb-ref-1": "<a href=\"https://www.itsc.cuhk.edu.hk/en/all-it/information-security/information-security-alerts/microsoft-denial-of-service-vulnerability-bigdiskbuster-cve-unknown/\" rel=\"noopener\" target=\"_blank\">Alerta de Seguridad de CUHK ITSC — Vulnerabilidad de Denegación de Servicio en Microsoft (BigDiskBuster)</a> (<a href=\"https://www.itsc.cuhk.edu.hk/tc/all-it/information-security/information-security-alerts/microsoft-denial-of-service-vulnerability-bigdiskbuster-cve-unknown/\" rel=\"noopener\" target=\"_blank\">繁體中文</a> · <a href=\"https://www.itsc.cuhk.edu.hk/sc/all-it/information-security/information-security-alerts/microsoft-denial-of-service-vulnerability-bigdiskbuster-cve-unknown/\" rel=\"noopener\" target=\"_blank\">简体中文</a>)",
    "bdb-ref-2": "<a href=\"https://github.com/DevCop95/BDB-Guardian\" rel=\"noopener\" target=\"_blank\">DevCop95/BDB-Guardian</a> y <a href=\"https://devcop95.github.io/BDB-Guardian/\" rel=\"noopener\" target=\"_blank\">Informe de Evidencia en Vivo</a>",
    "bdb-ref-3": "<a href=\"https://lolbas-project.github.io/lolbas/Binaries/Fsutil/\" rel=\"noopener\" target=\"_blank\">Proyecto LOLBAS — Documentación Oficial de <code>Fsutil.exe</code></a> (<a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/525\" rel=\"noopener\" target=\"_blank\">PR #525, Aprobado</a>)",
    "bdb-ref-4": "<a href=\"https://atomicredteam.io/docs/atomics/T1685\" rel=\"noopener\" target=\"_blank\">Red Canary Atomic Red Team — T1685 Test #79</a> (<a href=\"https://github.com/redcanaryco/atomic-red-team/pull/3439\" rel=\"noopener\" target=\"_blank\">PR #3439, Aprobado</a>)",
    "bdb-ref-5": "<a href=\"https://github.com/SigmaHQ/sigma/pull/6310\" rel=\"noopener\" target=\"_blank\">SigmaHQ/sigma #6310 — Creación Potencial de Buster-File en TEMP Tipo BigDiskBuster (Aprobado)</a>",
    "bdb-ref-6": "<a href=\"https://github.com/elastic/detection-rules/pull/6946\" rel=\"noopener\" target=\"_blank\">elastic/detection-rules #6946 — Creación Sospechosa de Archivos con Fsutil (Aprobado ×2)</a>",
    "bdb-ref-7": "<a href=\"https://www.levelblue.com/blogs/spiderlabs-blog/filling-the-well-nightmare-eclipses-bigdiskbuster-and-the-defender-update-that-never-lands\" rel=\"noopener\" target=\"_blank\">LevelBlue SpiderLabs — Filling the Well: BigDiskBuster and the Defender Update That Never Lands</a>",
    "bdb-ref-8": "<a href=\"https://github.com/MSNightmare/BigDiskBuster\" rel=\"noopener\" target=\"_blank\">MSNightmare/BigDiskBuster (PoC Original de Investigación de Amenazas)</a>",
    "bdb-foot-back": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver al Centro de Investigaciones",
    "bdb-foot-next": "Siguiente: Investigación Windows OpenSSH <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "ssh-crumb-title": "Windows OpenSSH",
    "ssh-art-kicker": "<i class=\"bi bi-terminal-split\" aria-hidden=\"true\"></i> Living-off-the-Land &middot; Evasión de Defensas &middot; T1202 &middot; T1059",
    "ssh-art-title": "Abuso de Windows OpenSSH y Mitigación de Evasiones <em>First-Match-Wins</em> en KQL y Sigma",
    "ssh-art-read": "9 min de lectura · Publicado 2026-11-20",
    "ssh-lead": "El binario nativo <code>C:\\Windows\\System32\\OpenSSH\\ssh.exe</code> se distribuye en endpoints modernos de Windows como un Living-off-the-Land Binary (LOLBin) estándar. Aunque Microsoft Threat Intelligence documentó el abuso posterior a la autenticación (<code>PermitLocalCommand</code> / Star Blizzard <em>RedFlick</em>), la ejecución previa a la autenticación mediante <code>KnownHostsCommand</code> permite ejecutar código de forma inmediata durante el intercambio de claves antes de enviar credenciales. Este análisis técnico detalla cómo ambos vectores fueron incorporados a <strong>LOLBAS</strong>, modela los puntos de indirección por configuración, elimina evasiones por precedencia <em>first-match-wins</em> en RE2 puro y provee una consulta para <strong>Microsoft Sentinel KQL</strong> integrada en <strong>Azure-Sentinel #15693</strong> y verificada empíricamente en Azure Data Explorer con un banco de pruebas de 21 casos (12 TP y 9 TN).",
    "ssh-meta-mitre": "<i aria-hidden=\"true\" class=\"bi bi-shield-exclamation\"></i> MITRE ATT&amp;CK: T1202 · T1059",
    "ssh-meta-telemetry": "<i aria-hidden=\"true\" class=\"bi bi-activity\"></i> Telemetría: <code>DeviceProcessEvents</code> · Sysmon EID 1",
    "ssh-meta-date": "<i aria-hidden=\"true\" class=\"bi bi-calendar3\"></i> Publicado: 2026-11-20",
    "ssh-meta-read": "<i aria-hidden=\"true\" class=\"bi bi-clock\"></i> 9 min de lectura",
    "pipe-ssh-s1-stage": "01 · Tácticas (Pre-Auth)",
    "pipe-ssh-s1-title": "LOLBAS #539",
    "pipe-ssh-s2-stage": "02 · Tácticas (Post-Auth)",
    "pipe-ssh-s2-title": "LOLBAS #532",
    "pipe-ssh-s3-stage": "03 · Regla Portable",
    "pipe-ssh-s3-title": "SigmaHQ #6585",
    "pipe-ssh-s3-status": "<i aria-hidden=\"true\" class=\"bi bi-hourglass-split\"></i> En Revisión",
    "pipe-ssh-s4-stage": "04 · Caza en Sentinel KQL",
    "pipe-ssh-s4-title": "Azure-Sentinel #15693",
    "pipe-ssh-s4-status": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> Aprobado y En Vivo",
    "pipe-ssh-s5-stage": "05 · Benchmark ADX",
    "pipe-ssh-s5-title": "Harness de 21 Casos",
    "pipe-ssh-s5-status": "<i aria-hidden=\"true\" class=\"bi bi-shield-check\"></i> 12 TP / 9 TN",
    "pipe-ssh-s6-stage": "06 · Ajuste en Producción",
    "pipe-ssh-s6-title": "Filtros de Jump-Hosts",
    "pipe-ssh-s6-status": "<i aria-hidden=\"true\" class=\"bi bi-speedometer2\"></i> Sub-10ms ADX",
    "ssh-toc-title": "Contenido",
    "ssh-toc-1": "1. Contexto de Amenaza y Límites de Autenticación",
    "ssh-toc-2": "2. Vectores de Ejecución y Puntos Ciegos de Telemetría",
    "ssh-toc-3": "3. Mitigando Evasión First-Match-Wins en RE2 Puro",
    "ssh-toc-4": "4. Consulta Completa de Hunting en Sentinel KQL",
    "ssh-toc-5": "5. Cobertura Portable en Sigma",
    "ssh-toc-6": "6. Validación Empírica en Azure Data Explorer",
    "ssh-toc-7": "7. Ajuste, Falsos Positivos y Hardening de Endpoints",
    "ssh-toc-8": "8. Referencias Verificadas",
    "ssh-s1-title": "1. Contexto de Amenaza y Por Qué Importan los Límites de Autenticación",
    "ssh-s1-p1": "En septiembre de 2026, Microsoft Threat Intelligence reportó que <strong>Star Blizzard</strong> refinó su entrega de malware y phishing con nuevas técnicas abusando de <code>PermitLocalCommand=yes</code> junto con <code>LocalCommand</code> en OpenSSH para ejecutar scripts maliciosos en estaciones de trabajo Windows. Esta técnica depende de que una sesión interactiva complete la autenticación contra un servidor controlado por el adversario antes de que el comando se ejecute.",
    "ssh-s1-p2": "Sin embargo, enfocar las detecciones únicamente en <code>PermitLocalCommand</code> deja sin monitoreo un vector de ejecución más veloz y sigiloso: <code>KnownHostsCommand</code> (documentado en <a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/539\" rel=\"noopener\" target=\"_blank\"><code>LOLBAS #539</code></a>). En OpenSSH, <code>KnownHostsCommand</code> se ejecuta localmente durante el intercambio de claves—<em>antes</em> de la verificación de la clave del servidor y previo al envío de credenciales de usuario. Un atacante o payload de spear-phishing dirigido a desarrolladores puede desencadenar la ejecución inmediata de código con tan solo abrir una conexión, sin importar si la autenticación prospera o falla.",
    "ssh-s1-p3": "Para cubrir tanto los vectores documentados en LOLBAS como la ejecución basada en configuraciones en entornos Windows, la lógica de detección debe abordar el ciclo completo a través de las fronteras de autenticación:",
    "ssh-s1-fig1": "Figura 1 — Modelo de telemetría dual (CLI + proceso padre-hijo) que mitiga tanto la sobreescritura de parámetros CLI por first-match-wins como la indirección por archivos de configuración.",
    "ssh-t1-th-dir": "Directiva / Variante",
    "ssh-t1-th-stage": "Etapa de Autenticación",
    "ssh-t1-th-syntax": "Sintaxis LOLBAS / Observada",
    "ssh-t1-th-blind": "Punto Ciego Principal",
    "ssh-t1-r1-c2": "<strong>Pre-Autenticación</strong> (Intercambio de Claves)",
    "ssh-t1-r1-c4": "No requiere <code>PermitLocalCommand</code>; pasa desapercibido ante reglas Sigma heredadas que solo auditan <code>ProxyCommand</code> o <code>LocalCommand</code>.",
    "ssh-t1-r2-c2": "<strong>Post-Autenticación</strong> (Sesión Establecida)",
    "ssh-t1-r2-c4": "<code>LocalCommand</code> se ejecuta mediante <code>cmd.exe</code>; se enmascara fácilmente si una consulta ingenua filtra procesos hijos literales <code>cmd.exe</code> sin auditar intérpretes renombrados.",
    "ssh-t1-r3-c2": "<strong>Pre-Autenticación</strong> (Configuración de Transporte)",
    "ssh-t1-r3-c4": "Herramientas de desarrollo legítimas (ej. <code>cloudflared access ssh</code>) emplean <code>ProxyCommand</code> frecuentemente; exige discriminar wrappers conocidos frente a invocaciones directas de LOLBins.",
    "ssh-t1-r4-c2": "Pre- o Post-Autenticación",
    "ssh-t1-r4-c4": "<strong>No aparece ningún flag de directiva en la línea de comandos de <code>ssh.exe</code>.</strong> Únicamente el linaje de procesos padre-hijo (<code>InitiatingProcessFileName =~ \"ssh.exe\"</code>) puede interceptar la ejecución.",
    "ssh-s2-title": "2. Vectores de Ejecución y Puntos Ciegos de Telemetría",
    "ssh-s2-p1": "Para cubrir tanto los vectores documentados en LOLBAS como la ejecución basada en configuraciones en entornos Windows, la lógica de detección debe abordar el ciclo completo a través de las fronteras de autenticación:",
    "ssh-s2-p2": "Conforme a <code>ssh_config(5)</code>, OpenSSH evalúa las opciones estrictamente bajo el principio de <strong>first-match-wins</strong> (la primera coincidencia prevalece) tanto en archivos de configuración como en argumentos de línea de comandos:",
    "code-cap-evasion": "Payload de Evasión · OpenSSH First-Match-Wins",
    "ssh-s2-p3": "OpenSSH asocia <code>KnownHostsCommand</code> con <code>\"cmd /c calc.exe\"</code> (la primera ocurrencia). El segundo argumento (<code>=none</code>) es ignorado en tiempo de ejecución, pero una regla SIEM ingenua que evalúe <code>CommandLine contains \"KnownHostsCommand\" and not(CommandLine contains \"KnownHostsCommand=none\")</code> devuelve <strong>FALSE</strong>, silenciando la alerta por completo.",
    "callout-ssh-title": "<i class=\"bi bi-eye-slash\" aria-hidden=\"true\"></i> Restricción Clave de Diseño: Binarios Renombrados e Indirección por Configuración",
    "callout-ssh-body": "Verificar únicamente <code>FileName =~ \"ssh.exe\"</code> falla si un adversario copia <code>ssh.exe</code> a <code>svchost_helper.exe</code>, y verificar sólo <code>ProcessCommandLine</code> pasa por alto <code>-F</code> o <code>.ssh/config</code>. Por tanto, la consulta de Sentinel normaliza la identidad del proceso y del proceso padre con <code>ProcessVersionInfoOriginalFileName =~ \"ssh.exe\"</code> (al igual que para los LOLBins hijos) y combina la coincidencia en línea de comandos con un linaje estricto de procesos hijos.",
    "ssh-s3-title": "3. Mitigando Evasión <em>First-Match-Wins</em> en RE2 Puro",
    "ssh-s3-p1": "Surge un error sutil cuando los autores de reglas intentan excluir flags benignos de hardening como <code>-o KnownHostsCommand=none</code> utilizando coincidencias simples de subcadena. Si una regla de detección busca <code>KnownHostsCommand</code> pero excluye <code>KnownHostsCommand=none</code>, un adversario puede evadirla aprovechando las reglas de precedencia de OpenSSH.",
    "ssh-s3-b1": "<strong>Admite formato flexible:</strong> Coincide con <code>-o KnownHostsCommand=...</code>, <code>-o \"KnownHostsCommand = cmd.exe\"</code> y la variante compacta <code>-oKnownHostsCommand=...</code>.",
    "ssh-s3-b2": "<strong>Rechaza coincidencia exacta <code>=none</code> (y comillas vacías):</strong> Cualquier directiva cuyo valor sea literalmente <code>none</code> seguido de espacio, fin de línea o comilla de cierre es descartada antes de validar coincidencia.",
    "ssh-s3-b3": "<strong>Preserva comandos que inician con <code>n</code>/<code>no</code>/<code>non</code>/<code>none_</code>:</strong> Cargas nombradas <code>net.exe</code>, <code>notepad.exe</code>, <code>none_malware.exe</code> o <code>nonexistent.exe</code> se detectan correctamente y nunca se descartan erróneamente como <code>none</code>.",
    "ssh-s3-b4": "<strong>Evalúa cada token <code>-o</code> de forma independiente:</strong> En el comando de evasión anterior, el primer token <code>-o KnownHostsCommand=...</code> coincide con el patrón malicioso; la presencia de un token posterior <code>-o KnownHostsCommand=none</code> en la misma línea no puede anular la coincidencia previa.",
    "ssh-s4-title": "4. Consulta Completa de Hunting en Sentinel KQL (<code>Azure/Azure-Sentinel #15693</code>)",
    "ssh-s4-p1": "Integrada (Merged) en <a href=\"https://github.com/Azure/Azure-Sentinel/pull/15693\" rel=\"noopener\" target=\"_blank\"><code>Azure/Azure-Sentinel #15693</code></a> (Hunting Queries/Microsoft 365 Defender/Execution/SshIndirectCommandExecution.yaml), esta consulta integra el análisis de CLI y el rastreo de procesos padre-hijo en una sola pasada sobre <code>DeviceProcessEvents</code>:",
    "code-cap-kql": "KQL · SshIndirectCommandExecution.yaml (MITRE T1202 / T1059)",
    "ssh-s5-title": "5. Cobertura Portable en Sigma (<code>SigmaHQ/sigma #6585</code>)",
    "ssh-s5-p1": "Si bien la regla existente de Sigma <code>proc_creation_win_ssh_proxy_execution.yml</code> cubría <code>ProxyCommand</code>, carecía de soporte para <code>KnownHostsCommand</code> y <code>PermitLocalCommand</code>. En <a href=\"https://github.com/SigmaHQ/sigma/pull/6585\" rel=\"noopener\" target=\"_blank\"><code>SigmaHQ/sigma #6585</code></a>, la regla fue ampliada con ejecución pre-autenticación, normalización estricta de identidad de procesos y etiquetas actualizadas de ATT&CK v18:",
    "code-cap-sigma-ssh": "YAML · proc_creation_win_ssh_proxy_execution.yml (Diff de Cambios)",
    "ssh-s6-title": "6. Validación Empírica en Azure Data Explorer (Harness de 21 Casos)",
    "ssh-s6-p1": "El análisis sintáctico estático jamás equivale a probar que un autómata RE2 maneje adecuadamente entrecomillados y condiciones de frontera reales. La consulta KQL se implementó en un clúster de Azure Data Explorer con ingesta de telemetría representativa de producción y se validó contra un banco de pruebas empírico de 21 escenarios:",
    "ssh-s6-sum-1": "<strong>12 Verdaderos Positivos (TP) comprobados:</strong> Patrón <em>RedFlick</em> de Star Blizzard (<code>PermitLocalCommand=yes</code> + <code>LocalCommand</code>), <code>KnownHostsCommand</code> pre-auth con diversos formatos de entrecomillado, binarios renombrados de <code>ssh.exe</code>, indirección por configuración (<code>-F</code> / <code>.ssh/config</code>) generando shells hijas, <code>KnownHostsCommand=no</code> / <code>LocalCommand=\"no\"</code> literales (interpretados por OpenSSH como el comando <code>no</code>, no deshabilitados) y evasiones first-match-wins.",
    "ssh-s6-sum-2": "<strong>9 Verdaderos Negativos (TN) comprobados:</strong> Conexión interactiva SSH estándar, flags explícitos de hardening (<code>-o KnownHostsCommand=none</code>, <code>-o LocalCommand=none</code>, variantes entrecomilladas y <code>-o PermitLocalCommand=no</code> / <code>=false</code>), igualdades con espacios, comillas vacías y herramientas legítimas (ej. <code>cloudflared</code>, <code>ssh-askpass.exe</code>).",
    "ssh-s6-sum-3": "<strong>Validación en CI del repositorio:</strong> Superó las pruebas <code>KqlValidations</code> (Microsoft.Azure.Kusto.Language sobre el esquema de <code>DeviceProcessEvents</code>) con 24/24 comprobaciones exitosas en GitHub Actions.",
    "ssh-s6-harness-summary": "Inspeccionar el Desglose Completo del Banco de Pruebas de 21 Casos en ADX (12 TP / 9 TN)",
    "ssh-th-case": "#",
    "ssh-th-expected": "Resultado Esperado",
    "ssh-th-scenario": "Escenario Evaluado en <code>DeviceProcessEvents</code>",
    "ssh-th-signal": "Señal Ejercida",
    "ssh-exp-detect": "Detectar",
    "ssh-exp-benign": "Benigno",
    "ssh-tp01-scen": "Patrón <em>RedFlick</em> de Star Blizzard (<code>PermitLocalCommand=yes</code> + <code>LocalCommand</code>)",
    "ssh-tp01-sig": "<code>CLI:PermitLocalCommand=yes</code>; <code>CLI:LocalCommand</code>",
    "ssh-tp02-scen": "Pre-autenticación <code>-o KnownHostsCommand=\"cmd.exe /c ...\"</code>",
    "ssh-tp02-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp03-scen": "Flag compacto sin espacios (<code>-oKnownHostsCommand=...</code>)",
    "ssh-tp03-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp04-scen": "Sintaxis OpenSSH separada por espacios (<code>-o KnownHostsCommand \"...\"</code>)",
    "ssh-tp04-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp05-scen": "Binario renombrado (<code>svchost_helper.exe</code> con <code>OriginalFileName=ssh.exe</code>)",
    "ssh-tp05-sig": "Normalización <code>IsSshProcess</code>",
    "ssh-tp06-scen": "Evasión First-match-wins: payload malicioso seguido de <code>-o KnownHostsCommand=none</code>",
    "ssh-tp06-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp07-scen": "Evasión First-match-wins: <code>PermitLocalCommand=yes</code> con sufijo posterior <code>=no</code>",
    "ssh-tp07-sig": "<code>CLI:PermitLocalCommand=yes</code>",
    "ssh-tp08-scen": "<code>ProxyCommand</code> invocando intérprete PowerShell / LOLBin",
    "ssh-tp08-sig": "<code>CLI:ProxyCommand</code>",
    "ssh-tp09-scen": "Indirección oculta con <code>-F</code> / <code>.ssh/config</code> invocando shell hija (<code>ssh.exe &rarr; cmd.exe</code>)",
    "ssh-tp09-sig": "<code>ChildProcess:SpawnedBySsh</code>",
    "ssh-tp10-scen": "Comando con prefijo límite que inicia con <code>n</code>/<code>no</code>/<code>non</code> (ej., <code>notepad.exe</code>)",
    "ssh-tp10-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp11-scen": "Comando con prefijo límite que inicia con <code>none_</code> (ej., <code>none_tool.exe</code>)",
    "ssh-tp11-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp12-scen": "Valor literal <code>=no</code> / <code>=\"no\"</code> en <code>KnownHostsCommand</code> y <code>LocalCommand</code> (OpenSSH lo ejecuta como comando <code>no</code>)",
    "ssh-tp12-sig": "<code>CLI:KnownHostsCommand</code>; <code>CLI:LocalCommand</code>",
    "ssh-tn01-scen": "Inicio de sesión interactivo estándar por SSH (<code>ssh usuario@host</code>)",
    "ssh-tn01-sig": "Sin señal",
    "ssh-tn02-scen": "Flag explícito de hardening <code>-o KnownHostsCommand=none</code>",
    "ssh-tn02-sig": "Excluido por el autómata de prefijos RE2",
    "ssh-tn03-scen": "Flag explícito de hardening <code>-o LocalCommand=none</code>",
    "ssh-tn03-sig": "Excluido por el autómata de prefijos RE2",
    "ssh-tn04-scen": "Flag explícito de hardening <code>-o PermitLocalCommand=no</code>",
    "ssh-tn04-sig": "Excluido por <code>(?:yes|true)</code>",
    "ssh-tn05-scen": "Wrapper legítimo <code>ProxyCommand</code> de <code>cloudflared access ssh</code>",
    "ssh-tn05-sig": "Excluido (sin binario hijo LOLBin ni argumentos sospechosos)",
    "ssh-tn06-scen": "Proceso hijo benigno <code>ssh-askpass.exe</code> generado por <code>ssh.exe</code>",
    "ssh-tn06-sig": "Excluido de la lista de procesos hijos sospechosos",
    "ssh-tn07-scen": "Hardening con igualdad y espacios (<code>-o \"KnownHostsCommand = none\"</code>)",
    "ssh-tn07-sig": "Excluido por el autómata de prefijos RE2",
    "ssh-tn08-scen": "Directiva con comillas vacías (<code>-o KnownHostsCommand=\"\"</code>)",
    "ssh-tn08-sig": "Excluido por el comparador de valores RE2",
    "ssh-tn09-scen": "Hardening con comillas en <code>=none</code> (<code>\"KnownHostsCommand=none\"</code>, <code>LocalCommand='none'</code>) y <code>PermitLocalCommand=false</code>",
    "ssh-tn09-sig": "Excluido por autómata RE2 y booleano",
    "ssh-s7-title": "7. Ajuste, Falsos Positivos y Hardening de Endpoints",
    "ssh-s7-tune-1": "<strong>Jump hosts administrativos y túneles de IDE:</strong> Las herramientas para desarrolladores (VS Code Remote-SSH, automatizaciones de Git) utilizan legítimamente <code>ProxyCommand</code> o archivos de configuración. Inclúyalas en lista blanca autenticando hashes de procesos o restringiendo identidades de procesos padre, en lugar de desactivar la regla globalmente.",
    "ssh-s7-tune-2": "<strong>Hardening pre-autenticación:</strong> En estaciones de trabajo donde el acceso SSH saliente no sea necesario o esté estandarizado, considere deshabilitar la característica opcional del Cliente OpenSSH o restringir las conexiones salientes al puerto 22 a nivel de firewall de host.",
    "ssh-s7-lim-title": "Limitaciones Conocidas y Endurecimiento Avanzado (v1.0.0)",
    "ssh-s7-lim-1": "<strong>Flags <code>getopt</code> agrupadas y <code>-o</code> entrecomillado:</strong> Verificado en <code>OpenSSH_for_Windows_9.5p2</code>, <code>ssh.exe</code> acepta opciones cortas concatenadas (<code>-vo KnownHostsCommand=...</code>, <code>-4o ...</code>) y argumentos entrecomillados (<code>\"-oKnownHostsCommand=...\"</code>, <code>\"-o\" \"KnownHostsCommand=...\"</code>). Dado que la consulta comunitaria v1.0.0 ancla en <code>(?:^|\\s)-o</code>, los equipos SOC que desplieguen reglas analíticas propias pueden endurecer el prefijo a <code>(?:^|\\s)[\"']{0,1}-[A-Za-z0-9]*o[\"']{0,1}\\s{0,}</code> manteniendo intacto el autómata RE2.",
    "ssh-s7-lim-2": "<strong>Lista cerrada de LOLBins frente a <em>allowlist</em> de procesos hijos:</strong> Las pruebas locales de linaje en Windows OpenSSH confirman una diferencia clave: <code>LocalCommand</code> siempre pasa por <code>cmd.exe</code> (<code>ssh.exe &rarr; cmd.exe &rarr; payload</code>, capturado por <code>HasSuspiciousChild</code>), mientras que <code>KnownHostsCommand</code> (que exige ruta absoluta en Windows) y <code>ProxyCommand</code> lanzan el binario configurado directamente (<code>ssh.exe &rarr; payload</code>). Para detectar ejecutables propios lanzados desde <code>-F</code>/<code>.ssh/config</code> sin shell, los SOC maduros pueden invertir <code>HasSuspiciousChild</code> para alertar cualquier hijo de <code>ssh.exe</code> fuera de una lista corta permitida (<code>ssh-askpass.exe</code>, <code>conhost.exe</code>, <code>sftp-server.exe</code>, <code>cloudflared.exe</code>).",
    "ssh-s7-lim-3": "<strong>Cadenas contradictorias de override (compromiso conservador en hunting):</strong> Si una línea pasa una directiva deshabilitadora antes de una habilitadora (ej. <code>-o PermitLocalCommand=no -o PermitLocalCommand=yes</code> o <code>-o KnownHostsCommand=none -o KnownHostsCommand=...</code>), OpenSSH respeta la primera coincidencia y no ejecuta el payload, pero la consulta alerta intencionalmente: las cadenas contradictorias en un mismo comando son anómalas y ameritan triaje.",
    "ssh-s7-lim-4": "<strong>Por qué Sigma <code>#6585</code> omite una exclusión ingenua de <code>=none</code>:</strong> Añadir un filtro de subcadena <code>not contains 'KnownHostsCommand=none'</code> en Sigma reintroduciría exactamente la evasión <em>first-match-wins</em> demostrada en la Sección 3. Mantener amplia la detección CLI en Sigma y delegar la negación por ocurrencia en RE2 puro a reglas nativas de SIEM (como Sentinel KQL) preserva la resistencia frente a evasiones.",
    "ssh-quick-title": "Acceso Rápido a Artefactos de Detección",
    "art-ssh-k1": "Documentación LOLBAS",
    "art-ssh-m1": "PRs #539 y #532 (Aprobados)",
    "art-ssh-k2": "KQL de Sentinel",
    "art-ssh-m2": "Azure-Sentinel #15693 (Aprobado · 24/24 CI)",
    "art-ssh-k3": "Regla Sigma",
    "art-ssh-m3": "SigmaHQ #6585 (ATT&amp;CK v18)",
    "ssh-s8-title": "8. Referencias Verificadas",
    "ssh-ref-1": "<a href=\"https://lolbas-project.github.io/lolbas/Binaries/Ssh/\" rel=\"noopener\" target=\"_blank\">Proyecto LOLBAS — Documentación Oficial de <code>Ssh.exe</code></a> (<a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/539\" rel=\"noopener\" target=\"_blank\">PR #539</a> y <a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/532\" rel=\"noopener\" target=\"_blank\">PR #532</a>, Aprobados)",
    "ssh-ref-2": "<a href=\"https://www.microsoft.com/en-us/security/blog/2026/09/29/star-blizzard-refines-phishing-and-malware-delivery-with-new-techniques/\" rel=\"noopener\" target=\"_blank\">Microsoft Threat Intelligence — Star Blizzard Refines Phishing and Malware Delivery With New Techniques (RedFlick)</a>",
    "ssh-ref-3": "<a href=\"https://github.com/SigmaHQ/sigma/pull/6585\" rel=\"noopener\" target=\"_blank\">SigmaHQ/sigma #6585 — Mejora de proc_creation_win_ssh_proxy_execution.yml</a>",
    "ssh-ref-4": "<a href=\"https://github.com/Azure/Azure-Sentinel/pull/15693\" rel=\"noopener\" target=\"_blank\">Azure/Azure-Sentinel #15693 — Consulta de Caza SshIndirectCommandExecution.yaml (Aprobado)</a>",
    "ssh-ref-5": "<a href=\"https://attack.mitre.org/techniques/T1202/\" rel=\"noopener\" target=\"_blank\">MITRE ATT&amp;CK T1202 — Ejecución Indirecta de Comandos</a>",
    "ssh-foot-back": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Volver al Centro de Investigaciones",
    "ssh-foot-next": "Siguiente: Investigación BigDiskBuster y fsutil <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "bdb-t2-th-num": "#",
    "bdb-t2-th-ioc": "Señal IoC",
    "bdb-t2-th-mech": "Mecanismo de Recolección",
    "bdb-t2-th-fp": "Perfil de Falsos Positivos",
    "bdb-t2-r1-c4": "<strong>Señal muy alta:</strong> los procesos legítimos no mantienen bloqueos persistentes sobre <code>MRT.exe</code>.",
    "bdb-t2-r2-c4": "Débil de forma aislada (servicios del SO mantienen handles de volumen) &rarr; se aplica lista blanca de servicios del SO.",
    "bdb-t2-r3-c4": "Determinante para comportamiento de BigDiskBuster; escala automáticamente a acción de terminación (kill).",
    "bdb-t2-r4-c4": "Medio (instaladores legítimos preparan archivos GUID ocasionalmente).",
    "bdb-s2-p3": "Dado que la Variante A no genera ningún evento de creación de procesos de <code>fsutil.exe</code>, un atacante sofisticado evade por completo las reglas EDR tradicionales. <code>BDB-Guardian</code> cierra esta brecha mediante un enfoque de telemetría de triple capa:",
    "bdb-s3-p2": "Validar las detecciones de endpoint en infraestructura real requiere emular la técnica de forma segura sin comprometer la disponibilidad del sistema ni generar agotamiento destructivo:",
    "bdb-s3-p3": "Utilizando una asignación ficticia predeterminada de 10 MB y registrando las variaciones exactas de bytes libres en NTFS, el test valida tanto las reglas de creación de procesos como los monitores de handles sin riesgos operativos en producción:",
    "bdb-s4-p3": "Interceptar la etapa del archivo buster <code>%TEMP%\\{GUID}</code> en el Event ID 11 de Sysmon o <code>DeviceFileEvents</code> de Defender proporciona detección temprana antes de que comience el ciclo de asignación de espacio:",
    "btn-copy": "Copiar",
    "btn-copied": "Copiado",
    "ssh-s2-fig1": "Figura 1 — Modelo de telemetría dual (CLI + proceso padre-hijo) que mitiga tanto la sobreescritura de parámetros CLI por first-match-wins como la indirección por archivos de configuración.",
    "ssh-t1-r1-c1": "<code>KnownHostsCommand</code>",
    "ssh-t1-r2-c1": "<code>PermitLocalCommand</code> + <code>LocalCommand</code>",
    "ssh-t1-r3-c1": "<code>ProxyCommand</code>",
    "ssh-t1-r4-c1": "<code>-F &lt;archivo&gt;</code> o <code>%USERPROFILE%\\.ssh\\config</code>",
    "ssh-s3-p2": "Conforme a <code>ssh_config(5)</code>, OpenSSH evalúa las opciones estrictamente bajo el principio de <strong>first-match-wins</strong> (la primera coincidencia prevalece):",
    "ssh-s3-p3": "OpenSSH asocia <code>KnownHostsCommand</code> con <code>\"cmd /c calc.exe\"</code> e ignora el <code>-o KnownHostsCommand=none</code> posterior. Sin embargo, una regla ingenua que verifique la presencia del flag malicioso y niegue <code>=none</code> evalúa a falso y descarta el evento.",
    "ssh-s3-p4": "Solucionar esto de forma limpia en Microsoft Sentinel requiere una negación por ocurrencia dentro del motor de expresiones regulares, garantizando que cada token <code>-o</code> se evalúe por separado sin requerir aserciones lookahead/lookbehind no soportadas en RE2:",
    "code-cap-pure-re2": "RE2 Puro · Comparador de No-none por Ocurrencia"
  },
  "en": {
    "nav-portfolio": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Portfolio",
    "nav-all-research": "<i class=\"bi bi-grid\" aria-hidden=\"true\"></i> All Research",
    "crumb-research": "Research",
    "footer-portfolio": "Portfolio",
    "footer-research": "Research Hub",
    "btn-back-to-top": "Back to top",
    "btn-share-article": "Share article",
    "footer-copy": "&copy; 2026 <strong>Yared Henriquez (DevCop95 / Dev101x)</strong> &middot; Cartagena, Colombia",
    "footer-links-hub": "<a href=\"../\">Portfolio</a> &middot; <a href=\"feed.xml\">RSS Feed</a> &middot; <a href=\"https://github.com/DevCop95\" rel=\"noopener\" target=\"_blank\">GitHub</a> &middot; <a href=\"https://www.linkedin.com/in/yared-dev\" rel=\"noopener\" target=\"_blank\">LinkedIn</a>",
    "footer-links-art": "<a href=\"../../\">Portfolio</a> &middot; <a href=\"../\">Research Hub</a> &middot; <a href=\"../feed.xml\">RSS Feed</a> &middot; <a href=\"https://github.com/DevCop95\" rel=\"noopener\" target=\"_blank\">GitHub</a>",
    "hub-kicker": "<i class=\"bi bi-diagram-3\" aria-hidden=\"true\"></i> Offense-to-Defense Research Hub",
    "hub-title": "Detection Engineering &amp; <em>Threat Research</em>",
    "hub-lead": "Long-form engineering write-ups documenting end-to-end <strong>Offense &rarr; Emulation &rarr; Detection</strong> cycles: turning native Windows tradecraft into peer-reviewed <strong>LOLBAS</strong> entries, <strong>Atomic Red Team</strong> tests, Win32 kernel-handle monitors, and verified multi-SIEM detections across <strong>Sigma</strong>, <strong>Elastic EQL</strong>, and <strong>Microsoft Sentinel KQL</strong>.",
    "hub-meta-author": "<i aria-hidden=\"true\" class=\"bi bi-person-badge\"></i> Yared Henriquez (DevCop95)",
    "hub-pill-focus": "<i class=\"bi bi-shield-check\" aria-hidden=\"true\"></i> Focus: Detection Engineering &amp; Applied AI Security",
    "hub-pill-cited": "<i class=\"bi bi-building\" aria-hidden=\"true\"></i> Tooling Cited by CUHK ITSC",
    "kpi-merged-lbl": "Merged Upstream PRs",
    "kpi-approved-lbl": "Approved Detections",
    "kpi-review-lbl": "Active PRs in Review",
    "kpi-mitre-lbl": "MITRE ATT&amp;CK Techniques",
    "method-01-num": "01 · Tradecraft",
    "method-01-title": "LOLBAS &amp; Internals",
    "method-01-sub": "Isolate native execution paths &amp; Win32 handle mechanics.",
    "method-02-num": "02 · Emulation",
    "method-02-title": "Safe Atomic Tests",
    "method-02-sub": "Generate repeatable endpoint telemetry without host exhaustion.",
    "method-03-num": "03 · Detection",
    "method-03-title": "Sigma · KQL · EQL",
    "method-03-sub": "Handle renamed binaries, config indirection &amp; pure-RE2 edge cases.",
    "method-04-num": "04 · Verification",
    "method-04-title": "Empirical Harnesses",
    "method-04-sub": "Benchmark TP/FP rates in ADX, evtx-sigma-checker &amp; repo CI.",
    "hub-ssh-title": "Abusing Windows OpenSSH (<code>KnownHostsCommand</code> &amp; <code>PermitLocalCommand</code>) and Closing First-Match-Wins Detection Bypasses in KQL &amp; Sigma",
    "hub-ssh-stat": "12/12 TP · 0/9 FP (ADX)",
    "hub-ssh-telemetry": "DeviceProcessEvents · Sysmon EID 1 · 24/24 Sentinel CI",
    "hub-ssh-tag-1": "LOLBAS #539 &amp; #532 (Merged)",
    "hub-ssh-tag-2": "SigmaHQ #6585",
    "hub-ssh-tag-3": "Azure-Sentinel #15693 (Merged)",
    "hub-ssh-tag-4": "RE2 / KQL",
    "hub-ssh-desc": "Compares pre-authentication (<code>KnownHostsCommand</code>) vs. post-authentication (<code>PermitLocalCommand</code> / <code>LocalCommand</code>, Star Blizzard <em>RedFlick</em>) execution in <code>ssh.exe</code>, models <code>-F</code> / <code>.ssh/config</code> CLI blind spots via child-process lineage, and builds a pure-RE2 KQL automaton validated in Azure Data Explorer.",
    "hub-ssh-cta": "Read full deep dive <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "hub-ssh-read": "2026-11-20 &middot; 9 min read",
    "hub-bdb-title": "From Disk-Exhaustion DoS against Windows Defender (<code>fsutil.exe</code> / BigDiskBuster) to Multi-SIEM &amp; Kernel-Handle Detection",
    "hub-bdb-stat": "45s &rarr; 6–14s &middot; CUHK ITSC Cited",
    "hub-bdb-telemetry": "Win32 Restart Manager · NtQuerySystemInformation · Sysmon EID 11 · EQL",
    "hub-bdb-tag-1": "CUHK ITSC Cited",
    "hub-bdb-tag-2": "LOLBAS #525 (Merged)",
    "hub-bdb-tag-3": "Atomic #3439 (Merged)",
    "hub-bdb-tag-4": "Sigma #6310 (Approved)",
    "hub-bdb-tag-5": "Elastic #6946 (Approved &times;2)",
    "hub-bdb-desc": "Traces disk-exhaustion evasion (<code>ERROR_DISK_FULL</code>) across both native NT allocation (BigDiskBuster) and LOLBin execution (<code>fsutil.exe file createnew</code>): from <code>BDB-Guardian</code> (cited by CUHK ITSC) and debugging <code>0xC0000374</code> / pipe deadlocks in Win32 handle scanning to <strong>Atomic Red Team #3439</strong>, <strong>SigmaHQ #6310</strong>, and <strong>Elastic #6946</strong>.",
    "hub-bdb-cta": "Read full deep dive <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "hub-bdb-read": "2026-11-20 &middot; 10 min read",
    "mitre-kicker": "<i class=\"bi bi-bullseye\" aria-hidden=\"true\"></i> MITRE ATT&amp;CK Coverage Map",
    "mitre-card-1-title": "Indirect Command Execution (<code>ssh.exe</code>)",
    "mitre-card-1-tactic": "Execution / Evasion",
    "mitre-card-1-desc": "Abuse of <code>ssh.exe</code> pre-auth (<code>KnownHostsCommand</code>) and post-auth (<code>PermitLocalCommand</code>) CLI vectors; child-process hunting in Microsoft Sentinel KQL and Sigma.",
    "mitre-card-2-title": "Defender Update Starvation &amp; <code>fsutil.exe</code>",
    "mitre-card-2-tactic": "Defense Evasion",
    "mitre-card-2-desc": "Denial-of-Service against Defender updates via free-space exhaustion (<code>BigDiskBuster</code> &amp; <code>fsutil.exe</code>); Win32 handle monitoring and multi-SIEM rules.",
    "mitre-card-3-title": "Password Managers (KeePass Discovery)",
    "mitre-card-3-tactic": "Credential Access",
    "mitre-card-3-desc": "Adversary emulation for KeePass database discovery, configuration parsing, and credential staging in Atomic Red Team (<code>#3433</code>).",
    "mitre-card-4-title": "Remote Access Software (Custom AnyDesk)",
    "mitre-card-4-tactic": "Command & Control",
    "mitre-card-4-desc": "Detection rules for customized per-organization AnyDesk remote access client naming schemes in LOLRMM (<code>#253</code>).",
    "matrix-kicker": "<i class=\"bi bi-table\" aria-hidden=\"true\"></i> Upstream Traceability Matrix",
    "matrix-sync-pill": "Snapshot: 2026-11-27",
    "matrix-th-repo": "Repository &amp; PR",
    "matrix-th-domain": "Domain",
    "matrix-th-scope": "MITRE / Scope",
    "matrix-th-status": "Status",
    "matrix-filt-all": "All",
    "matrix-filt-merged": "Merged",
    "matrix-filt-approved": "Approved",
    "matrix-filt-review": "In Review",
    "matrix-search-ph": "Filter repo, T-code, Sigma, KQL...",
    "matrix-empty": "No upstream contributions match the current filter.",
    "matrix-status-merged": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> MERGED",
    "matrix-status-7merged": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> 7 MERGED",
    "matrix-status-appr2": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> APPROVED (&times;2)",
    "matrix-status-appr1": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> APPROVED (1/2)",
    "matrix-status-review": "<i aria-hidden=\"true\" class=\"bi bi-hourglass-split\"></i> IN REVIEW",
    "matrix-r1-dom": "Living-Off-The-Land Docs",
    "matrix-r1-scope": "<code>Fsutil.exe</code> <code>file createnew</code> (T1562.001 / T1685)",
    "matrix-r2-dom": "Living-Off-The-Land Docs",
    "matrix-r2-scope": "<code>Ssh.exe</code> pre-auth <code>KnownHostsCommand</code> (T1202)",
    "matrix-r3-dom": "Living-Off-The-Land Docs",
    "matrix-r3-scope": "<code>Ssh.exe</code> <code>PermitLocalCommand=yes</code> (T1202)",
    "matrix-r4-dom": "Adversary Emulation",
    "matrix-r4-scope": "KeePass discovery &amp; config parsing (T1555.005)",
    "matrix-r5-dom": "Adversary Emulation",
    "matrix-r5-scope": "Defender disk exhaustion via <code>fsutil</code> (T1685)",
    "matrix-r6-dom": "RMM Detection &amp; Sigma",
    "matrix-r6-scope": "AnyDesk custom per-org client coverage (T1219)",
    "matrix-r7-dom": "OSINT Signal Integrity",
    "matrix-r7-scope": "False-positive elimination &amp; challenge handling",
    "matrix-r8-dom": "Elastic EQL Detection",
    "matrix-r8-scope": "Suspicious <code>fsutil file createnew</code> (T1562.001)",
    "matrix-r9-dom": "Sigma File Event Rule",
    "matrix-r9-scope": "BigDiskBuster GUID buster-file in <code>%TEMP%</code> (T1685)",
    "matrix-r10-dom": "Sigma WAF Rule Pack",
    "matrix-r10-scope": "SafeLine WAF SQLi / XSS / CMDi (<code>product: safeline</code>)",
    "matrix-r11-dom": "Sigma Process Creation",
    "matrix-r11-scope": "Windows <code>ssh.exe</code> <code>KnownHostsCommand</code> (T1202)",
    "matrix-r12-dom": "Sentinel KQL Hunting",
    "matrix-r12-scope": "Windows OpenSSH indirect execution (21-case ADX · 24/24 CI)",
    "matrix-r13-dom": "AI Red Teaming Engineering",
    "matrix-r13-scope": "Prevent duplicate attachment payload in NVMultimodal",
    "rfooter-back": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Back to dev101x.online",
    "rfooter-dive1": "Start with Deep Dive 01 <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "bdb-crumb-title": "BigDiskBuster &amp; fsutil",
    "bdb-art-kicker": "<i class=\"bi bi-terminal\" aria-hidden=\"true\"></i> Defense Evasion &middot; Denial of Service &middot; T1685 &middot; T1562.001",
    "bdb-art-title": "From Defender Disk-Exhaustion DoS (<code>fsutil.exe</code> / <em>BigDiskBuster</em>) to Multi-SIEM &amp; Kernel-Handle Detection",
    "bdb-art-read": "10 min read · Published 2026-11-20",
    "bdb-lead": "Disk-space starvation against Microsoft Defender updates (<code>ERROR_DISK_FULL</code> / <code>0x80070070</code>) silently freezes platform and signature updates while keeping Defender services superficially nominal. This case study traces how a single threat model became a 5-stage defensive ecosystem—from Win32 kernel-handle correlation in <strong>BDB-Guardian</strong> (formally cited by <strong>CUHK ITSC</strong>) to merged documentation in <strong>LOLBAS</strong>, safe adversary emulation in <strong>Red Canary Atomic Red Team</strong>, and approved detections in <strong>SigmaHQ</strong> and <strong>Elastic Security</strong>.",
    "bdb-meta-mitre": "<i aria-hidden=\"true\" class=\"bi bi-shield-exclamation\"></i> MITRE ATT&amp;CK: T1685 · T1562.001",
    "bdb-meta-win32": "<i aria-hidden=\"true\" class=\"bi bi-cpu\"></i> Win32: Restart Manager · <code>NtQuerySystemInformation</code>",
    "bdb-meta-cited": "<i aria-hidden=\"true\" class=\"bi bi-building\"></i> Cited by: CUHK ITSC",
    "bdb-meta-read": "<i aria-hidden=\"true\" class=\"bi bi-clock\"></i> 10 min read",
    "pipe-bdb-s1-stage": "01 · Handle Monitor",
    "pipe-bdb-s1-title": "BDB-Guardian",
    "pipe-bdb-s1-status": "<i aria-hidden=\"true\" class=\"bi bi-award-fill\"></i> CUHK ITSC Cited",
    "pipe-bdb-s2-stage": "02 · LOLBin Docs",
    "pipe-bdb-s2-title": "LOLBAS #525",
    "pipe-status-merged-live": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> Merged &amp; Live",
    "pipe-bdb-s3-stage": "03 · Emulation",
    "pipe-bdb-s3-title": "Atomic #3439 (T1685)",
    "pipe-bdb-s3-status": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> Merged (#79)",
    "pipe-bdb-s4-stage": "04 · File Telemetry",
    "pipe-bdb-s4-title": "SigmaHQ #6310",
    "pipe-bdb-s4-status": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> Approved (14/14 CI)",
    "pipe-bdb-s5-stage": "05 · Process EQL",
    "pipe-bdb-s5-title": "Elastic #6946",
    "pipe-bdb-s5-status": "<i aria-hidden=\"true\" class=\"bi bi-patch-check-fill\"></i> Approved (&times;2)",
    "pipe-bdb-s6-stage": "06 · Production",
    "pipe-bdb-s6-title": "Safe Invariants",
    "pipe-bdb-s6-status": "<i aria-hidden=\"true\" class=\"bi bi-shield-check\"></i> Zero Data Loss",
    "bdb-toc-title": "Contents",
    "bdb-toc-1": "1. Threat Model: Native NT vs. LOLBin",
    "bdb-toc-2": "2. BDB-Guardian &amp; Win32 Lessons",
    "bdb-toc-3": "3. Safe Emulation (Atomic #3439)",
    "bdb-toc-4": "4. Multi-SIEM Rules (Sigma &amp; Elastic)",
    "bdb-toc-5": "5. Triage &amp; Incident Response",
    "bdb-toc-6": "6. Verified References",
    "bdb-s1-title": "1. Threat Model: Native NT Allocation vs. <code>fsutil.exe</code>",
    "bdb-s1-p1": "Adversaries targeting Windows Defender signature updates (specifically <code>MpSigStub.exe</code> and <code>MRT.exe</code>) exploit a physical storage invariant: when an NTFS volume drops below ~50 MB of free space, signature unpack routines fail silently with <code>ERROR_DISK_FULL (0x80070070)</code>, leaving the host frozen on obsolete definitions.",
    "bdb-s1-p2": "Disk exhaustion as a defense-impairment primitive splits into two operational implementations that require completely different telemetry layers:",
    "bdb-s1-li-varA": "<strong>Variant A — Native NT API (<code>BigDiskBuster</code>):</strong> Disclosed in <a href=\"https://github.com/MSNightmare/BigDiskBuster\" rel=\"noopener\" target=\"_blank\">MSNightmare/BigDiskBuster</a> and analyzed by LevelBlue SpiderLabs. The binary monitors the <code>C:</code> volume for Defender staging paths (<code>ProgramData\\Microsoft\\Windows Defender\\Platform\\...</code> and <code>...\\Definition Updates\\{GUID}</code>) and holds an open handle on <code>C:\\Windows\\System32\\MRT.exe</code>. The moment an update begins, it allocates a hidden GUID-braced file in <code>%TEMP%</code> sized to all available free space with <code>FILE_DELETE_ON_CLOSE</code>. Defender updates fail with <code>ERROR_DISK_FULL</code>, and when the update aborts, the PoC releases its handle and goes back to sleep.",
    "bdb-s1-li-varB": "<strong>Variant B — Built-in LOLBin (<code>fsutil.exe file createnew</code>):</strong> Documented upstream in <a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/525\" rel=\"noopener\" target=\"_blank\"><code>LOLBAS #525</code></a> (<code>yml/OSBinaries/Fsutil.yml</code>). Any unprivileged <code>User</code> account can invoke <code>fsutil.exe file createnew {PATH_ABSOLUTE} {LENGTH_IN_BYTES}</code> to pre-allocate arbitrary dummy files instantly without dropping custom native binaries.",
    "bdb-s1-fig1": "Figure 1 — Defense-in-depth telemetry across Process Creation (Elastic EQL), File Events (Sigma), and Same-PID Kernel Handles (BDB-Guardian).",
    "bdb-t1-th-layer": "Telemetry Layer",
    "bdb-t1-th-catch-native": "Catches Native <code>BigDiskBuster</code>?",
    "bdb-t1-th-catch-lolbin": "Catches LOLBin <code>fsutil</code>?",
    "bdb-t1-th-noise": "Production Signal-to-Noise",
    "bdb-t1-r1-c1": "<strong>EDR Process Creation</strong> (Sysmon 1 / Defender 4688)",
    "bdb-t1-r1-c2": "<span class=\"badge-danger\">No</span> (Allocations occur within memory without spawning child processes)",
    "bdb-t1-r1-c3": "<span class=\"badge-success\">Yes</span> (<code>process.name == 'fsutil.exe'</code>)",
    "bdb-t1-r1-c4": "High noise unless filtered by argument size &amp; path",
    "bdb-t1-r2-c1": "<strong>File Creation Telemetry</strong> (Sysmon 11 / MDE FileCreated)",
    "bdb-t1-r2-c2": "<span class=\"badge-success\">Yes</span> (GUID regex in <code>%TEMP%</code>)",
    "bdb-t1-r2-c3": "<span class=\"badge-success\">Yes</span> (File creation at target path)",
    "bdb-t1-r2-c4": "Medium (benign installers use GUIDs; requires path anchor)",
    "bdb-t1-r3-c1": "<strong>Kernel Handle Correlation</strong> (<code>BDB-Guardian</code>)",
    "bdb-t1-r3-c2": "<span class=\"badge-success\">Yes</span> (Same-PID holds <code>MRT.exe</code> + Volume handle)",
    "bdb-t1-r3-c3": "<span class=\"badge-neutral\">Indirect</span> (Detects volume write handle lock)",
    "bdb-t1-r3-c4": "Near-zero FP (only MRT/MpSigStub correlation triggers alert)",
    "bdb-s2-title": "2. Closing the EDR Blind Spot: <code>BDB-Guardian</code> &amp; Win32 Internals",
    "bdb-s2-p1": "Standard endpoint detection rules trigger on process creation (<code>fsutil.exe file createnew</code>). They are blind to native NT allocation loops compiled into in-memory .NET or C++ loaders that never invoke a child process. To detect both without crashing enterprise endpoints, <code>BDB-Guardian</code> pairs <strong>Restart Manager API</strong> with native handle scanning via <code>NtQuerySystemInformation(SystemHandleInformation)</code>.",
    "bdb-s2-p2": "<strong>Same-PID Correlation Verdict:</strong> When a single non-whitelisted PID simultaneously holds an open handle to <code>MRT.exe</code> and the system volume, the verdict escalates immediately to <strong>CRITICAL</strong> (near-zero false positives), and presence of the GUID buster-file confirms active BigDiskBuster-like execution. To isolate native Win32/P/Invoke memory from the PowerShell orchestrator, <code>BDBMonitor.ps1</code> delegates all native calls to a dedicated child worker (<code>Invoke-VolumeScan.ps1</code> + inline C# in <code>bdb-csharp.ps1</code>).",
    "callout-bdb-title": "<i class=\"bi bi-bug\" aria-hidden=\"true\"></i> Engineering Post-Mortem: Fixing <code>0xC0000374</code> Heap Corruption &amp; Named-Pipe Deadlocks",
    "callout-bdb-intro": "Two real Win32 pitfalls surfaced during live testing of <code>BDB-Guardian</code>—documented in the repo and reproduced in the <a href=\"https://devcop95.github.io/BDB-Guardian/\" target=\"_blank\" rel=\"noopener\">evidence report</a>:",
    "callout-bdb-item1": "<strong><code>RmGetList</code> struct mismatch (<code>0xC0000374</code>):</strong> Calling <code>RmGetList</code> with a buffer sized for <code>RM_UNIQUE_PROCESS</code> instead of <code>RM_PROCESS_INFO</code> (~668 bytes/entry) triggers native heap corruption (<code>STATUS_HEAP_CORRUPTION</code>). Switching to <code>RM_PROCESS_INFO</code> with a proper resize retry loop eliminated all <code>Application Error</code> crashes across consecutive runs.",
    "callout-bdb-item2": "<strong><code>NtQueryObject</code> pipe hang:</strong> Querying object names across arbitrary duplicated handles stalls indefinitely on synchronous named pipes. Filtering out handles where <code>GetFileType != FILE_TYPE_DISK</code> before calling <code>NtQueryObject</code>—backed by per-PID timeouts—eliminated hangs and cut full-system handle scan runtime from <strong>~45 seconds down to 6–14 seconds</strong>.",
    "bdb-t2-th-metric": "Engineering Dimension",
    "bdb-t2-th-rm": "Restart Manager API (<code>RstrtMgr.dll</code>)",
    "bdb-t2-th-nt": "<code>NtQuerySystemInformation</code> (P/Invoke)",
    "bdb-t2-r1-c1": "Primary Purpose",
    "bdb-t2-r1-c2": "Open handle on <code>C:\\Windows\\System32\\MRT.exe</code>",
    "bdb-t2-r1-c3": "Windows Restart Manager (instant, exact) + native name-scan fallback",
    "bdb-t2-r2-c1": "Performance Cost",
    "bdb-t2-r2-c2": "Open handle on <code>C:</code> volume (<code>\\Device\\HarddiskVolumeN</code>)",
    "bdb-t2-r2-c3": "<code>NtQuerySystemInformation(SystemHandleInformation)</code> + <code>NtQueryObject</code>",
    "bdb-t2-r3-c1": "Failure Mode / Stability Pitfall",
    "bdb-t2-r3-c2": "Same-PID holds both locks simultaneously",
    "bdb-t2-r3-c3": "In-memory correlation across both scan layers",
    "bdb-t2-r4-c1": "BDB-Guardian Role",
    "bdb-t2-r4-c2": "Hidden <code>{GUID}</code> file in <code>%TEMP%</code> sized to free space",
    "bdb-t2-r4-c3": "Sysmon Event ID 11 / MDE FileCreated event stream",
    "bdb-s3-title": "3. Safe Adversary Emulation (<code>Atomic Red Team #3439</code> &mdash; Test #79)",
    "bdb-s3-p1": "Adversary emulation for disk exhaustion poses an inherent production risk: naive tests allocating full disk space can crash hypervisors, freeze databases, or trigger alerts across unrelated IT infrastructure. To address this, <strong>Atomic Red Team #3439</strong> introduced <code>Test #79 (T1685)</code> with strict safety invariants:",
    "code-cap-atomic": "YAML · T1685.yaml — Test #79 (Atomic Red Team #3439)",
    "bdb-s3-inv-1": "<strong>Bounded Dummy File Size:</strong> Allocates a fixed <code>1 MB</code> test file (default <code>1,048,576</code> bytes) rather than draining the volume, verifying command-line telemetry without operational hazard.",
    "bdb-s3-inv-2": "<strong>Deterministic GUID Target:</strong> Creates files matching the BigDiskBuster regex pattern in <code>%TEMP%</code>, allowing validation of file-event detections alongside process creation.",
    "bdb-s3-inv-3": "<strong>Zero-Leak Cleanup Command:</strong> Pairs every execution with an automated <code>cleanup_command</code> removing the allocated test file immediately after assertion.",
    "bdb-s4-title": "4. Multi-SIEM Detection Rules (<code>SigmaHQ #6310</code> &amp; <code>Elastic #6946</code>)",
    "bdb-s4-h3-sigma": "Sigma File Event Rule — <code>SigmaHQ/sigma #6310</code> (Approved)",
    "bdb-s4-p-sigma": "For the native NT variant, <a href=\"https://github.com/SigmaHQ/sigma/pull/6310\" rel=\"noopener\" target=\"_blank\"><code>SigmaHQ/sigma #6310</code></a> models file creations in <code>%TEMP%</code> matching the GUID buster pattern. Extensive false-positive tuning across production enterprise datasets identified legitimate GUID-named temp file creators, including HP Support Assistant, TeamViewer (<code>tv_x64.exe</code>/<code>tv_w32.exe</code>), and VS Code's <code>cpptools.exe</code>, which were explicitly filtered without weakening the core path regex:",
    "code-cap-sigma-bdb": "YAML · file_event_win_bigdiskbuster_temp_file.yml (SigmaHQ #6310)",
    "bdb-s4-h3-elastic": "Elastic Security EQL Rule — <code>elastic/detection-rules #6946</code> (Approved ×2)",
    "bdb-s4-p-elastic": "For the LOLBin variant, <a href=\"https://github.com/elastic/detection-rules/pull/6946\" rel=\"noopener\" target=\"_blank\"><code>elastic/detection-rules #6946</code></a> detects <code>fsutil.exe file createnew</code> across Elastic Defend, Microsoft Defender XDR, CrowdStrike, SentinelOne, Sysmon, and Windows Security Event Logs, resilient to binary renaming via <code>?process.pe.original_file_name</code>:",
    "code-cap-elastic-bdb": "EQL · defense_evasion_suspicious_file_creation_with_fsutil.toml (Elastic #6946)",
    "bdb-s5-title": "5. Triage &amp; Incident Response Playbook",
    "bdb-s5-intro": "When an alert fires for <code>fsutil.exe file createnew</code> or suspicious GUID temp file creation, SOC analysts should follow this rapid triage sequence:",
    "bdb-s5-step-1": "<strong>Verify Defender operational health:</strong> Inspect Microsoft-Windows-Windows Defender/Operational logs for <strong>Event IDs 2000, 2001, and 1151</strong> (signature/platform update failures with <code>0x80070070</code> / <code>ERROR_DISK_FULL</code>).",
    "bdb-s5-step-2": "<strong>Inspect parent process tree &amp; open handles:</strong> Trace the parent of <code>fsutil.exe</code> (or run <code>BDBMonitor.ps1</code> to catch native NT binaries holding <code>MRT.exe</code> + volume handles without process-creation artifacts).",
    "bdb-s5-step-3": "<strong>Remediate starvation &amp; verify recovery:</strong> Terminate the offending parent tree, remove oversized dummy/GUID files in <code>%TEMP%</code>, confirm free disk space recovery, and force a Defender signature update + full scan for concurrent staging payloads.",
    "bdb-quick-title": "Detection Artifacts Quick-Jump",
    "art-bdb-k1": "Kernel Monitor",
    "art-bdb-m1": "CUHK ITSC Cited · PowerShell + C#",
    "art-bdb-k2": "Emulation",
    "art-bdb-m2": "PR #3439 (Merged)",
    "art-bdb-k3": "Sigma File Event",
    "art-bdb-m3": "SigmaHQ #6310 (Approved)",
    "art-bdb-k4": "Elastic EQL",
    "art-bdb-m4": "Elastic #6946 (Approved ×2)",
    "bdb-s6-title": "6. Verified References",
    "bdb-ref-1": "<a href=\"https://www.itsc.cuhk.edu.hk/en/all-it/information-security/information-security-alerts/microsoft-denial-of-service-vulnerability-bigdiskbuster-cve-unknown/\" rel=\"noopener\" target=\"_blank\">CUHK ITSC Security Alert — Microsoft Denial-of-Service Vulnerability (BigDiskBuster)</a> (<a href=\"https://www.itsc.cuhk.edu.hk/tc/all-it/information-security/information-security-alerts/microsoft-denial-of-service-vulnerability-bigdiskbuster-cve-unknown/\" rel=\"noopener\" target=\"_blank\">繁體中文</a> · <a href=\"https://www.itsc.cuhk.edu.hk/sc/all-it/information-security/information-security-alerts/microsoft-denial-of-service-vulnerability-bigdiskbuster-cve-unknown/\" rel=\"noopener\" target=\"_blank\">简体中文</a>)",
    "bdb-ref-2": "<a href=\"https://github.com/DevCop95/BDB-Guardian\" rel=\"noopener\" target=\"_blank\">DevCop95/BDB-Guardian</a> &amp; <a href=\"https://devcop95.github.io/BDB-Guardian/\" rel=\"noopener\" target=\"_blank\">Live Evidence Report</a>",
    "bdb-ref-3": "<a href=\"https://lolbas-project.github.io/lolbas/Binaries/Fsutil/\" rel=\"noopener\" target=\"_blank\">LOLBAS Project — Official <code>Fsutil.exe</code> Documentation</a> (<a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/525\" rel=\"noopener\" target=\"_blank\">PR #525, Merged</a>)",
    "bdb-ref-4": "<a href=\"https://atomicredteam.io/docs/atomics/T1685\" rel=\"noopener\" target=\"_blank\">Red Canary Atomic Red Team — T1685 Test #79</a> (<a href=\"https://github.com/redcanaryco/atomic-red-team/pull/3439\" rel=\"noopener\" target=\"_blank\">PR #3439, Merged</a>)",
    "bdb-ref-5": "<a href=\"https://github.com/SigmaHQ/sigma/pull/6310\" rel=\"noopener\" target=\"_blank\">SigmaHQ/sigma #6310 — Potential BigDiskBuster-Like Buster-File Creation in TEMP (Approved)</a>",
    "bdb-ref-6": "<a href=\"https://github.com/elastic/detection-rules/pull/6946\" rel=\"noopener\" target=\"_blank\">elastic/detection-rules #6946 — Suspicious File Creation with Fsutil (Approved ×2)</a>",
    "bdb-ref-7": "<a href=\"https://www.levelblue.com/blogs/spiderlabs-blog/filling-the-well-nightmare-eclipses-bigdiskbuster-and-the-defender-update-that-never-lands\" rel=\"noopener\" target=\"_blank\">LevelBlue SpiderLabs — Filling the Well: BigDiskBuster and the Defender Update That Never Lands</a>",
    "bdb-ref-8": "<a href=\"https://github.com/MSNightmare/BigDiskBuster\" rel=\"noopener\" target=\"_blank\">MSNightmare/BigDiskBuster (Original Threat Research PoC)</a>",
    "bdb-foot-back": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Back to Research Hub",
    "bdb-foot-next": "Next: Windows OpenSSH Deep Dive <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "ssh-crumb-title": "Windows OpenSSH",
    "ssh-art-kicker": "<i class=\"bi bi-terminal-split\" aria-hidden=\"true\"></i> Living-off-the-Land &middot; Defense Evasion &middot; T1202 &middot; T1059",
    "ssh-art-title": "Abusing Windows OpenSSH and Closing <em>First-Match-Wins</em> Bypasses in KQL &amp; Sigma",
    "ssh-art-read": "9 min read · Published 2026-11-20",
    "ssh-lead": "Native <code>C:\\Windows\\System32\\OpenSSH\\ssh.exe</code> ships on modern Windows endpoints as a standard Living-off-the-Land Binary (LOLBin). While Microsoft Threat Intelligence documented post-authentication abuse (<code>PermitLocalCommand</code> / Star Blizzard <em>RedFlick</em>), pre-authentication execution via <code>KnownHostsCommand</code> allows immediate code execution during key exchange before credentials are exchanged. This engineering analysis details how both vectors were documented in <strong>LOLBAS</strong>, models configuration indirection points, closes <em>first-match-wins</em> regex bypasses in pure RE2, and provides a production-grade <strong>Microsoft Sentinel KQL</strong> query merged in <strong>Azure-Sentinel #15693</strong> and empirically verified in Azure Data Explorer across a 21-case harness (12 TP / 9 TN).",
    "ssh-meta-mitre": "<i aria-hidden=\"true\" class=\"bi bi-shield-exclamation\"></i> MITRE ATT&amp;CK: T1202 · T1059",
    "ssh-meta-telemetry": "<i aria-hidden=\"true\" class=\"bi bi-activity\"></i> Telemetry: <code>DeviceProcessEvents</code> · Sysmon EID 1",
    "ssh-meta-date": "<i aria-hidden=\"true\" class=\"bi bi-calendar3\"></i> Published: 2026-11-20",
    "ssh-meta-read": "<i aria-hidden=\"true\" class=\"bi bi-clock\"></i> 9 min read",
    "pipe-ssh-s1-stage": "01 · Tradecraft (Pre-Auth)",
    "pipe-ssh-s1-title": "LOLBAS #539",
    "pipe-ssh-s2-stage": "02 · Tradecraft (Post-Auth)",
    "pipe-ssh-s2-title": "LOLBAS #532",
    "pipe-ssh-s3-stage": "03 · Portable Rule",
    "pipe-ssh-s3-title": "SigmaHQ #6585",
    "pipe-ssh-s3-status": "<i aria-hidden=\"true\" class=\"bi bi-hourglass-split\"></i> In Review",
    "pipe-ssh-s4-stage": "04 · Sentinel KQL Hunt",
    "pipe-ssh-s4-title": "Azure-Sentinel #15693",
    "pipe-ssh-s4-status": "<i aria-hidden=\"true\" class=\"bi bi-check-circle-fill\"></i> Merged &amp; Live",
    "pipe-ssh-s5-stage": "05 · ADX Benchmark",
    "pipe-ssh-s5-title": "21-Case Harness",
    "pipe-ssh-s5-status": "<i aria-hidden=\"true\" class=\"bi bi-shield-check\"></i> 12 TP / 9 TN",
    "pipe-ssh-s6-stage": "06 · Production Tuning",
    "pipe-ssh-s6-title": "Jump-Host Filters",
    "pipe-ssh-s6-status": "<i aria-hidden=\"true\" class=\"bi bi-speedometer2\"></i> Sub-10ms ADX",
    "ssh-toc-title": "Contents",
    "ssh-toc-1": "1. Threat Context &amp; Auth Boundary",
    "ssh-toc-2": "2. Vectors &amp; CLI Blind Spots",
    "ssh-toc-3": "3. Closing First-Match-Wins in RE2",
    "ssh-toc-4": "4. Sentinel KQL Hunting Query",
    "ssh-toc-5": "5. Portable Sigma Coverage",
    "ssh-toc-6": "6. Empirical ADX Validation",
    "ssh-toc-7": "7. Tuning &amp; Hardening",
    "ssh-toc-8": "8. Verified References",
    "ssh-s1-title": "1. Threat Context &amp; Why Auth Boundaries Matter",
    "ssh-s1-p1": "In September 2026, Microsoft Threat Intelligence reported that <strong>Star Blizzard</strong> refined its phishing and malware delivery with new techniques by abusing <code>PermitLocalCommand=yes</code> alongside <code>LocalCommand</code> in OpenSSH to execute malicious scripts on Windows workstations. This technique relies on an interactive session establishing authentication against an adversary-controlled server before the command executes.",
    "ssh-s1-p2": "However, focusing detections solely on <code>PermitLocalCommand</code> leaves a faster, less-noisy execution vector unmonitored: <code>KnownHostsCommand</code> (documented in <a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/539\" rel=\"noopener\" target=\"_blank\"><code>LOLBAS #539</code></a>). In OpenSSH, <code>KnownHostsCommand</code> executes locally during key exchange—<em>before</em> server host key verification and prior to sending any user credentials. An attacker or spear-phishing payload targeting developers can trigger immediate code execution simply by opening a connection, regardless of whether authentication succeeds or fails.",
    "ssh-s1-p3": "To cover both LOLBAS-documented vectors and config-based execution in Windows environments, detection logic must address the full lifecycle across authentication boundaries:",
    "ssh-s1-fig1": "Figure 1 — Dual CLI + parent-child telemetry model closing both first-match-wins CLI overrides and configuration file indirection.",
    "ssh-t1-th-dir": "Directive / Variant",
    "ssh-t1-th-stage": "Auth Stage",
    "ssh-t1-th-syntax": "LOLBAS / Observed Syntax",
    "ssh-t1-th-blind": "Primary Blind Spot",
    "ssh-t1-r1-c2": "<strong>Pre-Auth</strong> (Key Exchange)",
    "ssh-t1-r1-c4": "Does not require <code>PermitLocalCommand</code>; missed by legacy Sigma rules checking only <code>ProxyCommand</code> or <code>LocalCommand</code>.",
    "ssh-t1-r2-c2": "<strong>Post-Auth</strong> (Session Established)",
    "ssh-t1-r2-c4": "<code>LocalCommand</code> executes via <code>cmd.exe</code>; easily masked if a naive query filters on literal <code>cmd.exe</code> child processes without checking renamed interpreters.",
    "ssh-t1-r3-c2": "<strong>Pre-Auth</strong> (Transport Setup)",
    "ssh-t1-r3-c4": "Legitimate dev tools (e.g., <code>cloudflared access ssh</code>) use <code>ProxyCommand</code> heavily; requires filtering on known proxy wrappers vs. raw LOLBin execution.",
    "ssh-t1-r4-c2": "Pre- or Post-Auth",
    "ssh-t1-r4-c4": "<strong>Zero directive flags appear on the <code>ssh.exe</code> command line.</strong> Only parent-child lineage (<code>InitiatingProcessFileName =~ \"ssh.exe\"</code>) can catch execution.",
    "ssh-s2-title": "2. Execution Vectors &amp; Telemetry Blind Spots",
    "ssh-s2-p1": "To cover both LOLBAS-documented vectors and config-based execution in Windows environments, detection logic must address the full lifecycle across authentication boundaries:",
    "ssh-s2-p2": "Per <code>ssh_config(5)</code>, OpenSSH evaluates options strictly on a <strong>first-match-wins</strong> basis across both configuration files and command-line arguments:",
    "code-cap-evasion": "Evasion Payload · OpenSSH First-Match-Wins",
    "ssh-s2-p3": "OpenSSH binds <code>KnownHostsCommand</code> to <code>\"cmd /c calc.exe\"</code> (the first match). The second argument (<code>=none</code>) is ignored by OpenSSH during runtime, but a naive SIEM rule checking <code>CommandLine contains \"KnownHostsCommand\" and not(CommandLine contains \"KnownHostsCommand=none\")</code> evaluates to <strong>FALSE</strong>, silently suppressing the alert.",
    "callout-ssh-title": "<i class=\"bi bi-eye-slash\" aria-hidden=\"true\"></i> Key Design Constraint: Renamed Binaries &amp; Config Indirection",
    "callout-ssh-body": "Checking only <code>FileName =~ \"ssh.exe\"</code> breaks if an adversary copies <code>ssh.exe</code> to <code>svchost_helper.exe</code>, and checking only <code>ProcessCommandLine</code> misses <code>-F</code> or <code>.ssh/config</code>. Therefore, the Sentinel query normalizes both process and parent identity with <code>ProcessVersionInfoOriginalFileName =~ \"ssh.exe\"</code> (and the same for child LOLBins) and pairs CLI matching with strict child process lineage.",
    "ssh-s3-title": "3. Closing OpenSSH <em>First-Match-Wins</em> Evasion in Pure RE2",
    "ssh-s3-p1": "A subtle bug appears when rule authors try to exclude benign hardening flags like <code>-o KnownHostsCommand=none</code> using standard substring matches. If a detection rule checks for <code>KnownHostsCommand</code> but excludes <code>KnownHostsCommand=none</code>, an adversary can bypass it using OpenSSH's configuration precedence rules.",
    "ssh-s3-b1": "<strong>Permits flexible formatting:</strong> Matches <code>-o KnownHostsCommand=...</code>, <code>-o \"KnownHostsCommand = cmd.exe\"</code>, and compact <code>-oKnownHostsCommand=...</code>.",
    "ssh-s3-b2": "<strong>Rejects exact <code>=none</code> (and empty quotes):</strong> Any directive whose value is literally <code>none</code> followed by whitespace, end-of-string, or a closing quote is rejected before matching.",
    "ssh-s3-b3": "<strong>Preserves commands starting with <code>n</code>/<code>no</code>/<code>non</code>/<code>none_</code>:</strong> A payload named <code>net.exe</code>, <code>notepad.exe</code>, <code>none_malware.exe</code>, or <code>nonexistent.exe</code> is correctly captured and never falsely dismissed as <code>none</code>.",
    "ssh-s3-b4": "<strong>Evaluates each <code>-o</code> token independently:</strong> In the bypass command above, the first <code>-o KnownHostsCommand=...</code> token matches the malicious pattern; the presence of a trailing <code>-o KnownHostsCommand=none</code> token on the same line cannot cancel the earlier match.",
    "ssh-s4-title": "4. Full Sentinel KQL Hunting Query (<code>Azure/Azure-Sentinel #15693</code>)",
    "ssh-s4-p1": "Merged in <a href=\"https://github.com/Azure/Azure-Sentinel/pull/15693\" rel=\"noopener\" target=\"_blank\"><code>Azure/Azure-Sentinel #15693</code></a> (Hunting Queries/Microsoft 365 Defender/Execution/SshIndirectCommandExecution.yaml), this query unites CLI parsing and parent-child tracking in a single pass across <code>DeviceProcessEvents</code>:",
    "code-cap-kql": "KQL · SshIndirectCommandExecution.yaml (MITRE T1202 / T1059)",
    "ssh-s5-title": "5. Portable Sigma Coverage (<code>SigmaHQ/sigma #6585</code>)",
    "ssh-s5-p1": "While the existing Sigma rule <code>proc_creation_win_ssh_proxy_execution.yml</code> covered <code>ProxyCommand</code>, it lacked <code>KnownHostsCommand</code> and <code>PermitLocalCommand</code> coverage. In <a href=\"https://github.com/SigmaHQ/sigma/pull/6585\" rel=\"noopener\" target=\"_blank\"><code>SigmaHQ/sigma #6585</code></a>, the rule was enhanced with pre-auth execution, strict process identity normalization, and updated ATT&CK v18 tagging:",
    "code-cap-sigma-ssh": "YAML · proc_creation_win_ssh_proxy_execution.yml (Diff Highlight)",
    "ssh-s6-title": "6. Empirical Validation in Azure Data Explorer (21-Case Harness)",
    "ssh-s6-p1": "Static syntax parsing is never proof that an RE2 automaton handles real quoting and boundary conditions. The KQL query was deployed against an Azure Data Explorer cluster ingesting production-style endpoint telemetry, exercised against an empirical 21-case test harness:",
    "ssh-s6-sum-1": "<strong>12 True Positives verified:</strong> Star Blizzard <em>RedFlick</em> pattern (<code>PermitLocalCommand=yes</code> + <code>LocalCommand</code>), pre-auth <code>KnownHostsCommand</code> with various quoting formats, renamed <code>ssh.exe</code> binaries, config indirection (<code>-F</code> / <code>.ssh/config</code>) spawning child shells, literal <code>KnownHostsCommand=no</code> / <code>LocalCommand=\"no\"</code> (parsed by OpenSSH as command <code>no</code>, not disabled), and first-match-wins evasions.",
    "ssh-s6-sum-2": "<strong>9 True Negatives verified:</strong> Standard interactive SSH login, explicit hardening flags (<code>-o KnownHostsCommand=none</code>, <code>-o LocalCommand=none</code>, quoted <code>=none</code> variants, and <code>-o PermitLocalCommand=no</code> / <code>=false</code>), spaced equalities, empty quotes, and legitimate tool wrappers (e.g., <code>cloudflared</code>, <code>ssh-askpass.exe</code>).",
    "ssh-s6-sum-3": "<strong>Repo CI validations:</strong> Passed <code>KqlValidations</code> (Microsoft.Azure.Kusto.Language against <code>DeviceProcessEvents</code> schema) with 24/24 successful checks in GitHub Actions.",
    "ssh-s6-harness-summary": "Inspect Complete 21-Case ADX Test Harness Breakdown (12 TP / 9 TN)",
    "ssh-th-case": "#",
    "ssh-th-expected": "Expected",
    "ssh-th-scenario": "Scenario Tested in <code>DeviceProcessEvents</code>",
    "ssh-th-signal": "Signal Exercised",
    "ssh-exp-detect": "Detect",
    "ssh-exp-benign": "Benign",
    "ssh-tp01-scen": "Star Blizzard <em>RedFlick</em> (<code>PermitLocalCommand=yes</code> + <code>LocalCommand</code>)",
    "ssh-tp01-sig": "<code>CLI:PermitLocalCommand=yes</code>; <code>CLI:LocalCommand</code>",
    "ssh-tp02-scen": "Pre-auth <code>-o KnownHostsCommand=\"cmd.exe /c ...\"</code>",
    "ssh-tp02-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp03-scen": "Compact flag without spacing (<code>-oKnownHostsCommand=...</code>)",
    "ssh-tp03-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp04-scen": "Space-separated OpenSSH syntax (<code>-o KnownHostsCommand \"...\"</code>)",
    "ssh-tp04-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp05-scen": "Renamed binary (<code>svchost_helper.exe</code> with <code>OriginalFileName=ssh.exe</code>)",
    "ssh-tp05-sig": "<code>IsSshProcess</code> normalization",
    "ssh-tp06-scen": "First-match-wins override: payload followed by <code>-o KnownHostsCommand=none</code>",
    "ssh-tp06-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp07-scen": "First-match-wins override: <code>PermitLocalCommand=yes</code> + trailing <code>=no</code>",
    "ssh-tp07-sig": "<code>CLI:PermitLocalCommand=yes</code>",
    "ssh-tp08-scen": "<code>ProxyCommand</code> spawning PowerShell / LOLBin interpreter",
    "ssh-tp08-sig": "<code>CLI:ProxyCommand</code>",
    "ssh-tp09-scen": "Hidden <code>-F</code> / <code>.ssh/config</code> spawning child shell (<code>ssh.exe &rarr; cmd.exe</code>)",
    "ssh-tp09-sig": "<code>ChildProcess:SpawnedBySsh</code>",
    "ssh-tp10-scen": "Boundary prefix command starting with <code>n</code>/<code>no</code>/<code>non</code> (e.g., <code>notepad.exe</code>)",
    "ssh-tp10-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp11-scen": "Boundary prefix command starting with <code>none_</code> (e.g., <code>none_tool.exe</code>)",
    "ssh-tp11-sig": "<code>CLI:KnownHostsCommand</code>",
    "ssh-tp12-scen": "Literal <code>=no</code> / <code>=\"no\"</code> on <code>KnownHostsCommand</code> &amp; <code>LocalCommand</code> (parsed as command <code>no</code>, not disabled)",
    "ssh-tp12-sig": "<code>CLI:KnownHostsCommand</code>; <code>CLI:LocalCommand</code>",
    "ssh-tn01-scen": "Standard interactive SSH login (<code>ssh user@host</code>)",
    "ssh-tn01-sig": "No signal",
    "ssh-tn02-scen": "Explicit hardening flag <code>-o KnownHostsCommand=none</code>",
    "ssh-tn02-sig": "Excluded by RE2 prefix automaton",
    "ssh-tn03-scen": "Explicit hardening flag <code>-o LocalCommand=none</code>",
    "ssh-tn03-sig": "Excluded by RE2 prefix automaton",
    "ssh-tn04-scen": "Explicit hardening flag <code>-o PermitLocalCommand=no</code>",
    "ssh-tn04-sig": "Excluded by <code>(?:yes|true)</code>",
    "ssh-tn05-scen": "Legitimate <code>cloudflared access ssh</code> <code>ProxyCommand</code> wrapper",
    "ssh-tn05-sig": "Excluded (no LOLBin child/arg)",
    "ssh-tn06-scen": "Benign <code>ssh-askpass.exe</code> child process spawned by <code>ssh.exe</code>",
    "ssh-tn06-sig": "Excluded from suspicious child list",
    "ssh-tn07-scen": "Spaced equality hardening (<code>-o \"KnownHostsCommand = none\"</code>)",
    "ssh-tn07-sig": "Excluded by RE2 prefix automaton",
    "ssh-tn08-scen": "Empty quoted directive value (<code>-o KnownHostsCommand=\"\"</code>)",
    "ssh-tn08-sig": "Excluded by RE2 value matcher",
    "ssh-tn09-scen": "Quoted <code>=none</code> (<code>\"KnownHostsCommand=none\"</code>, <code>LocalCommand='none'</code>) &amp; <code>PermitLocalCommand=false</code>",
    "ssh-tn09-sig": "Excluded by RE2 &amp; boolean matcher",
    "ssh-s7-title": "7. Tuning, False Positives &amp; Endpoint Hardening",
    "ssh-s7-tune-1": "<strong>Administrative jump hosts &amp; IDE tunnels:</strong> Developer tools (VS Code Remote-SSH, Git automation) legitimately pass <code>ProxyCommand</code> or config files. Whitelist these by authenticating process hashes or constraining parent process identities rather than disabling the rule globally.",
    "ssh-s7-tune-2": "<strong>Pre-auth hardening:</strong> Where remote SSH access from workstations is unneeded or standardized, consider disabling the optional OpenSSH Client feature or restricting outbound port 22 at host firewall boundaries.",
    "ssh-s7-lim-title": "Known Limitations &amp; Advanced Hardening (v1.0.0)",
    "ssh-s7-lim-1": "<strong>Bundled <code>getopt</code> flags &amp; quoted <code>-o</code> tokens:</strong> Verified against <code>OpenSSH_for_Windows_9.5p2</code>, <code>ssh.exe</code> accepts bundled short options (<code>-vo KnownHostsCommand=...</code>, <code>-4o ...</code>) and quoted option arguments (<code>\"-oKnownHostsCommand=...\"</code>, <code>\"-o\" \"KnownHostsCommand=...\"</code>). Because the merged v1.0.0 community query anchors strictly on <code>(?:^|\\s)-o</code>, SOC teams deploying custom Sentinel analytics can harden the prefix to <code>(?:^|\\s)[\"']{0,1}-[A-Za-z0-9]*o[\"']{0,1}\\s{0,}</code> while preserving the same RE2 non-<code>none</code> automaton.",
    "ssh-s7-lim-2": "<strong>Closed LOLBin list vs. allowlist child hunting:</strong> Live process-lineage testing on Windows OpenSSH confirms a key split: <code>LocalCommand</code> always invokes <code>cmd.exe</code> (<code>ssh.exe &rarr; cmd.exe &rarr; payload</code>, caught by <code>HasSuspiciousChild</code>), whereas <code>KnownHostsCommand</code> (which requires an absolute path on Windows) and <code>ProxyCommand</code> spawn the configured binary directly (<code>ssh.exe &rarr; payload</code>). To catch custom executables launched via <code>-F</code>/<code>.ssh/config</code> without a shell, mature SOCs should invert <code>HasSuspiciousChild</code> to alert on any child of <code>ssh.exe</code> outside an environment-tuned allowlist (e.g., <code>ssh-askpass.exe</code>, <code>conhost.exe</code>, <code>sftp-server.exe</code>, <code>cloudflared.exe</code>).",
    "ssh-s7-lim-3": "<strong>Contradictory override chains (conservative hunting trade-off):</strong> If a command line passes a disabling directive before an enabling one (e.g., <code>-o PermitLocalCommand=no -o PermitLocalCommand=yes</code> or <code>-o KnownHostsCommand=none -o KnownHostsCommand=...</code>), OpenSSH honors the first match and skips execution, but the query intentionally still alerts—conflicting override chains on a single command line are anomalous and warrant analyst triage.",
    "ssh-s7-lim-4": "<strong>Why Sigma <code>#6585</code> omits a naive <code>=none</code> exclusion:</strong> Adding a substring <code>not contains 'KnownHostsCommand=none'</code> filter in Sigma would re-introduce the exact <em>first-match-wins</em> bypass analyzed in Section 3. Keeping Sigma's CLI match broad while delegating pure-RE2 per-occurrence negation to SIEM-native queries (like Sentinel KQL) preserves evasion resistance across platforms.",
    "ssh-quick-title": "Detection Artifacts Quick-Jump",
    "art-ssh-k1": "LOLBAS Docs",
    "art-ssh-m1": "PRs #539 &amp; #532 (Merged)",
    "art-ssh-k2": "Sentinel KQL",
    "art-ssh-m2": "Azure-Sentinel #15693 (Merged · 24/24 CI)",
    "art-ssh-k3": "Sigma Rule",
    "art-ssh-m3": "SigmaHQ #6585 (ATT&amp;CK v18)",
    "ssh-s8-title": "8. Verified References",
    "ssh-ref-1": "<a href=\"https://lolbas-project.github.io/lolbas/Binaries/Ssh/\" rel=\"noopener\" target=\"_blank\">LOLBAS Project — Official <code>Ssh.exe</code> Documentation</a> (<a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/539\" rel=\"noopener\" target=\"_blank\">PR #539</a> &amp; <a href=\"https://github.com/LOLBAS-Project/LOLBAS/pull/532\" rel=\"noopener\" target=\"_blank\">PR #532</a>, Merged)",
    "ssh-ref-2": "<a href=\"https://www.microsoft.com/en-us/security/blog/2026/09/29/star-blizzard-refines-phishing-and-malware-delivery-with-new-techniques/\" rel=\"noopener\" target=\"_blank\">Microsoft Threat Intelligence — Star Blizzard refines phishing and malware delivery with new techniques</a>",
    "ssh-ref-3": "<a href=\"https://github.com/SigmaHQ/sigma/pull/6585\" rel=\"noopener\" target=\"_blank\">SigmaHQ/sigma #6585 — <code>proc_creation_win_ssh_proxy_execution.yml</code> enhancement</a>",
    "ssh-ref-4": "<a href=\"https://github.com/Azure/Azure-Sentinel/pull/15693\" rel=\"noopener\" target=\"_blank\">Azure/Azure-Sentinel #15693 — <code>SshIndirectCommandExecution.yaml</code> Hunting Query (Merged)</a>",
    "ssh-ref-5": "<a href=\"https://attack.mitre.org/techniques/T1202/\" rel=\"noopener\" target=\"_blank\">MITRE ATT&amp;CK T1202 — Indirect Command Execution</a>",
    "ssh-foot-back": "<i class=\"bi bi-arrow-left\" aria-hidden=\"true\"></i> Back to Research Hub",
    "ssh-foot-next": "Next: BigDiskBuster &amp; fsutil Deep Dive <i class=\"bi bi-arrow-right\" aria-hidden=\"true\"></i>",
    "bdb-t2-th-num": "#",
    "bdb-t2-th-ioc": "IoC Signal",
    "bdb-t2-th-mech": "Collection Mechanism",
    "bdb-t2-th-fp": "False-Positive Profile",
    "bdb-t2-r1-c4": "<strong>Very high signal:</strong> legitimate processes do not hold persistent locks on <code>MRT.exe</code>.",
    "bdb-t2-r2-c4": "Weak alone (OS services hold volume handles) &rarr; OS-service whitelist applied.",
    "bdb-t2-r3-c4": "Definitive for BigDiskBuster behavior; auto-escalates to kill action.",
    "bdb-t2-r4-c4": "Medium (installers occasionally stage GUID fixtures).",
    "bdb-s2-p3": "Because Variant A leaves zero <code>fsutil.exe</code> process-creation events, a sophisticated operator bypasses traditional EDR rules entirely. <code>BDB-Guardian</code> bridges this gap with a three-layer telemetry approach:",
    "bdb-s3-p2": "Validating endpoint detections on live infrastructure requires safely emulating the tradecraft without crashing host services or causing destructive disk depletion:",
    "bdb-s3-p3": "Using a default 10 MB dummy allocation and recording exact NTFS free-byte deltas, the test validates both process creation rules and handle monitors without operational risk in production:",
    "bdb-s4-p3": "Catching the <code>%TEMP%\\{GUID}</code> buster-file stage in Sysmon Event ID 11 or Defender <code>DeviceFileEvents</code> gives early warning before the full disk allocation cycle begins:",
    "btn-copy": "Copy",
    "btn-copied": "Copied",
    "ssh-s2-fig1": "Figure 1 — Dual CLI + parent-child telemetry model closing both first-match-wins CLI overrides and configuration file indirection.",
    "ssh-t1-r1-c1": "<code>KnownHostsCommand</code>",
    "ssh-t1-r2-c1": "<code>PermitLocalCommand</code> + <code>LocalCommand</code>",
    "ssh-t1-r3-c1": "<code>ProxyCommand</code>",
    "ssh-t1-r4-c1": "<code>-F &lt;file&gt;</code> or <code>%USERPROFILE%\\.ssh\\config</code>",
    "ssh-s3-p2": "Per <code>ssh_config(5)</code>, OpenSSH evaluates options strictly on a <strong>first-match-wins</strong> basis:",
    "ssh-s3-p3": "OpenSSH binds <code>KnownHostsCommand</code> to <code>\"cmd /c calc.exe\"</code> and ignores the trailing <code>-o KnownHostsCommand=none</code>. However, a naive rule checking for the malicious flag and negating <code>=none</code> evaluates to false and drops the event.",
    "ssh-s3-p4": "Fixing this cleanly in Microsoft Sentinel requires per-occurrence negation inside the regex engine, ensuring each <code>-o</code> token is evaluated separately without lookaround assertions that RE2 disallows:",
    "code-cap-pure-re2": "Pure RE2 · Per-Occurrence Non-none Matcher"
  }
};

  const updateLanguage = (lang) => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        const anchor = el.querySelector('.heading-anchor');
        el.innerHTML = translations[lang][key];
        if (anchor) el.appendChild(anchor);
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang] && translations[lang][key]) {
        el.setAttribute('placeholder', translations[lang][key]);
      }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (translations[lang] && translations[lang][key]) {
        el.setAttribute('aria-label', translations[lang][key]);
      }
    });
    if (langToggle) {
      langToggle.textContent = lang === 'es' ? 'EN' : 'ES';
      langToggle.setAttribute('aria-label', lang === 'es' ? 'Switch language to English' : 'Cambiar idioma a español');
    }
    const isEs = lang === 'es';
    document.querySelectorAll('.code-block .copy-btn span').forEach(sp => {
      const b = sp.closest('.copy-btn');
      if (b && !b.classList.contains('copied')) {
        sp.textContent = isEs ? 'Copiar' : 'Copy';
      }
    });
    if (shareBtn && !shareBtn.classList.contains('copied')) {
      const sp = shareBtn.querySelector('span');
      if (sp) sp.textContent = isEs ? 'Compartir artículo' : 'Share article';
    }
    root.setAttribute('lang', lang);
    root.lang = lang;
    try { localStorage.setItem('devyhb-lang', lang); } catch { /* Storage optional */ }
    announce(lang === 'es' ? 'Idioma cambiado a español' : 'Language changed to English');
  };

  let savedLang = 'es';
  try {
    const stored = localStorage.getItem('devyhb-lang');
    if (stored === 'en' || stored === 'es') savedLang = stored;
  } catch { /* optional */ }

  updateLanguage(savedLang);

  let lastToggleTime = 0;
  const handleLangToggle = (e) => {
    const now = Date.now();
    if (now - lastToggleTime < 300) return;
    lastToggleTime = now;
    const current = root.getAttribute('lang') || root.lang || savedLang || 'es';
    const next = current === 'es' ? 'en' : 'es';
    updateLanguage(next);
  };

  langToggle?.addEventListener('click', handleLangToggle);
  langToggle?.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleLangToggle(e);
  }, { passive: false });

});
