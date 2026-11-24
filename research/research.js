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


  // ─── TRANSLATIONS (I18N) ──────────────────────────────────────────────────
  const langToggle = document.getElementById('langToggle');
  const translations = {
    es: {
      "nav-portfolio": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Portafolio',
      "nav-all-research": '<i class="bi bi-grid" aria-hidden="true"></i> Todas las Investigaciones',
      "crumb-research": 'Investigaciones',
      "footer-portfolio": 'Portafolio',
      "footer-research": 'Centro de Investigaciones',
      "btn-back-to-top": 'Volver arriba',

      // Research Hub
      "hub-kicker": '<i class="bi bi-diagram-3" aria-hidden="true"></i> Centro de Investigación Ofensiva a Defensiva',
      "hub-title": 'Ingeniería de Detección e <em>Investigación de Amenazas</em>',
      "hub-lead": 'Análisis técnicos profundos de ingeniería que documentan ciclos completos de <strong>Ofensiva &rarr; Emulación &rarr; Detección</strong>: transformando técnicas nativas de Windows en entradas revisadas por pares en <strong>LOLBAS</strong>, pruebas en <strong>Atomic Red Team</strong>, monitores de handles en kernel Win32 y detecciones multi-SIEM verificadas en <strong>Sigma</strong>, <strong>Elastic EQL</strong> y <strong>Microsoft Sentinel KQL</strong>.',
      "hub-pill-focus": '<i class="bi bi-shield-check" aria-hidden="true"></i> Enfoque: Ingeniería de Detección y Seguridad de IA Aplicada',
      "hub-pill-cited": '<i class="bi bi-building" aria-hidden="true"></i> Herramientas citadas por CUHK ITSC',
      "kpi-merged-lbl": 'PRs Aprobados (Merged)',
      "kpi-approved-lbl": 'Detecciones Aprobadas',
      "kpi-review-lbl": 'PRs Activos en Revisión',
      "kpi-mitre-lbl": 'Técnicas MITRE ATT&CK',
      "method-01-title": 'LOLBAS e Internals',
      "method-01-sub": 'Aislar rutas de ejecución nativas y mecánicas de handles Win32.',
      "method-02-title": 'Pruebas Atómicas Seguras',
      "method-02-sub": 'Generar telemetría repetible en el endpoint sin saturar el sistema.',
      "method-03-title": 'Sigma · KQL · EQL',
      "method-03-sub": 'Contemplar binarios renombrados, indirección por config y casos borde en RE2 puro.',
      "method-04-title": 'Harnesses Empíricos',
      "method-04-sub": 'Medir tasas de TP/FP en ADX, evtx-sigma-checker y CI de repositorios.',
      "hub-ssh-title": 'Abuso de Windows OpenSSH (<code>KnownHostsCommand</code> y <code>PermitLocalCommand</code>) y Mitigación de Evasiones First-Match-Wins en KQL y Sigma',
      "hub-ssh-desc": 'Compara la ejecución previa a la autenticación (<code>KnownHostsCommand</code>) frente a la posterior a la autenticación (<code>PermitLocalCommand</code> / <code>LocalCommand</code>, Star Blizzard <em>RedFlick</em>) en <code>ssh.exe</code>, modela puntos ciegos de CLI con <code>-F</code> / <code>.ssh/config</code> mediante linaje de procesos hijos y construye un autómata KQL en RE2 puro validado en Azure Data Explorer.',
      "hub-ssh-cta": 'Leer investigación completa <i class="bi bi-arrow-right" aria-hidden="true"></i>',
      "hub-ssh-read": '2026-11-20 &middot; 9 min de lectura',
      "hub-bdb-title": 'De DoS por Agotamiento de Disco contra Windows Defender (<code>fsutil.exe</code> / BigDiskBuster) a Detección Multi-SIEM y Handles de Kernel',
      "hub-bdb-desc": 'Rastrea la evasión por agotamiento de disco (<code>ERROR_DISK_FULL</code>) tanto en asignación nativa de NT (BigDiskBuster) como en ejecución de LOLBins (<code>fsutil.exe file createnew</code>): desde <code>BDB-Guardian</code> (citado por CUHK ITSC) y la depuración de <code>0xC0000374</code> / bloqueos de tuberías en escaneo de handles Win32 hasta <strong>Atomic Red Team #3439</strong>, <strong>SigmaHQ #6310</strong> y <strong>Elastic #6946</strong>.',
      "hub-bdb-cta": 'Leer investigación completa <i class="bi bi-arrow-right" aria-hidden="true"></i>',
      "hub-bdb-read": '2026-11-20 &middot; 10 min de lectura',
      "mitre-kicker": '<i class="bi bi-bullseye" aria-hidden="true"></i> Mapa de Cobertura MITRE ATT&CK',
      "mitre-card-1-title": 'Ejecución Indirecta de Comandos (<code>ssh.exe</code>)',
      "mitre-card-2-title": 'Privación de Actualizaciones de Defender y <code>fsutil.exe</code>',
      "mitre-card-3-title": 'Gestores de Contraseñas (Descubrimiento KeePass)',
      "mitre-card-4-title": 'Software de Acceso Remoto (AnyDesk Personalizado)',
      "matrix-kicker": '<i class="bi bi-table" aria-hidden="true"></i> Matriz de Trazabilidad Upstream',
      "matrix-th-repo": 'Repositorio y PR',
      "matrix-th-domain": 'Dominio',
      "matrix-th-scope": 'MITRE / Alcance',
      "matrix-th-status": 'Estado',
      "matrix-filt-all": 'Todos',
      "matrix-filt-merged": 'Aprobados',
      "matrix-filt-approved": 'Aprobación parcial',
      "matrix-filt-review": 'En Revisión',
      "matrix-search-ph": 'Filtrar repositorio, código T, Sigma, KQL...',
      "matrix-empty": 'No hay contribuciones upstream que coincidan con el filtro actual.',
      "rfooter-back": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Volver a dev101x.online',
      "rfooter-dive1": 'Comenzar con Investigación 01 <i class="bi bi-arrow-right" aria-hidden="true"></i>',

      // BigDiskBuster Deep Dive
      "bdb-art-kicker": '<i class="bi bi-terminal" aria-hidden="true"></i> Evasión de Defensas &middot; Denegación de Servicio &middot; T1685 &middot; T1562.001',
      "bdb-art-title": 'De DoS por Agotamiento de Disco en Defender (<code>fsutil.exe</code> / <em>BigDiskBuster</em>) a Detección Multi-SIEM y Handles de Kernel',
      "bdb-art-read": '10 min de lectura · Publicado 2026-11-20',
      "bdb-toc-title": 'Contenido',
      "bdb-toc-1": '1. Modelo de Amenazas: NT Nativo vs. LOLBin',
      "bdb-toc-2": '2. BDB-Guardian y Lecciones Win32',
      "bdb-toc-3": '3. Emulación Segura (Atomic #3439)',
      "bdb-toc-4": '4. Reglas Multi-SIEM (Sigma y Elastic)',
      "bdb-toc-5": '5. Triaje y Respuesta a Incidentes',
      "bdb-toc-6": '6. Referencias Verificadas',
      "bdb-s1-title": '1. Modelo de Amenazas: Asignación Nativa NT vs. <code>fsutil.exe</code>',
      "bdb-s1-p1": 'Los atacantes que apuntan a las actualizaciones de firmas de Windows Defender (específicamente <code>MpSigStub.exe</code> y <code>MRT.exe</code>) explotan una invariante de almacenamiento físico: cuando un volumen NTFS cae por debajo de ~50 MB de espacio libre, las rutinas de descompresión de firmas fallan silenciosamente con <code>ERROR_DISK_FULL (0x80070070)</code>, dejando al host congelado con definiciones obsoletas.',
      "bdb-s2-title": '2. Cerrando el Punto Ciego de EDR: <code>BDB-Guardian</code> e Internals Win32',
      "bdb-s2-p1": 'Las reglas estándar de endpoint se activan con la creación de procesos (<code>fsutil.exe file createnew</code>). Sin embargo, son ciegas ante bucles nativos de asignación NT compilados en cargadores .NET o C++ en memoria que nunca invocan un proceso hijo. Para detectar ambos sin bloquear endpoints empresariales, <code>BDB-Guardian</code> combina la <strong>Restart Manager API</strong> con el escaneo de handles nativos mediante <code>NtQuerySystemInformation(SystemHandleInformation)</code>.',
      "bdb-s2-p2": '<strong>Veredicto de Correlación de Mismo PID:</strong> Cuando un único PID no incluido en lista blanca mantiene simultáneamente un handle abierto a <code>MRT.exe</code> y al volumen del sistema, el veredicto escala inmediatamente a <strong>CRÍTICO</strong> (falsos positivos cercanos a cero), y la presencia del archivo guía GUID confirma una ejecución activa de tipo BigDiskBuster. Para aislar la memoria nativa Win32/P/Invoke del orquestador de PowerShell, <code>BDBMonitor.ps1</code> delega todas las llamadas nativas a un proceso hijo dedicado (<code>Invoke-VolumeScan.ps1</code> + C# incrustado en <code>bdb-csharp.ps1</code>).',
      "callout-bdb-title": '<i class="bi bi-bug" aria-hidden="true"></i> Post-Mortem de Ingeniería: Corrección de <code>0xC0000374</code> Heap Corruption y Bloqueos en Named-Pipes',
      "callout-bdb-intro": 'Dos obstáculos reales de Win32 surgieron durante las pruebas en vivo de <code>BDB-Guardian</code>—documentados en el repositorio y reproducidos en el <a href="https://devcop95.github.io/BDB-Guardian/" target="_blank" rel="noopener">informe de evidencias</a>:',
      "callout-bdb-item1": '<strong>Discordancia de estructura en <code>RmGetList</code> (<code>0xC0000374</code>):</strong> Invocar <code>RmGetList</code> con un búfer dimensionado para <code>RM_UNIQUE_PROCESS</code> en lugar de <code>RM_PROCESS_INFO</code> (~668 bytes/entrada) provoca corrupción en el heap nativo (<code>STATUS_HEAP_CORRUPTION</code>). Cambiar a <code>RM_PROCESS_INFO</code> junto a un bucle de reintento con redimensionamiento eliminó por completo los bloqueos por <code>Application Error</code> en ejecuciones consecutivas.',
      "callout-bdb-item2": '<strong>Bloqueo de tuberías en <code>NtQueryObject</code>:</strong> Consultar nombres de objetos a través de handles duplicados arbitrarios se bloquea indefinidamente en named pipes sincrónicas. Filtrar los handles donde <code>GetFileType != FILE_TYPE_DISK</code> antes de llamar a <code>NtQueryObject</code>—respaldado por límites de tiempo por PID—eliminó los bloqueos y redujo el tiempo de escaneo de handles de todo el sistema de <strong>~45 segundos a entre 6 y 14 segundos</strong>.',
      "bdb-s3-title": '3. Emulación Segura de Adversarios (<code>Atomic Red Team #3439</code> &mdash; Test #79)',
      "bdb-s4-title": '4. Reglas de Detección Multi-SIEM (<code>SigmaHQ #6310</code> y <code>Elastic #6946</code>)',
      "bdb-s5-title": '5. Guía de Triaje y Respuesta a Incidentes',
      "bdb-s6-title": '6. Referencias Verificadas',
      "bdb-quick-title": 'Acceso Rápido a Artefactos de Detección',
      "bdb-foot-back": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Volver al Centro de Investigaciones',
      "bdb-foot-next": 'Siguiente: Investigación Windows OpenSSH <i class="bi bi-arrow-right" aria-hidden="true"></i>',

      // Windows OpenSSH Deep Dive
      "ssh-art-kicker": '<i class="bi bi-terminal-split" aria-hidden="true"></i> Living-off-the-Land &middot; Evasión de Defensas &middot; T1202 &middot; T1059',
      "ssh-art-title": 'Abuso de Windows OpenSSH y Mitigación de Evasiones <em>First-Match-Wins</em> en KQL y Sigma',
      "ssh-art-read": '9 min de lectura · Publicado 2026-11-20',
      "ssh-toc-title": 'Contenido',
      "ssh-toc-1": '1. Contexto de Amenaza y Límites de Autenticación',
      "ssh-toc-2": '2. Vectores de Ejecución y Puntos Ciegos de Telemetría',
      "ssh-toc-3": '3. Mitigando Evasión First-Match-Wins en RE2 Puro',
      "ssh-toc-4": '4. Consulta Completa de Hunting en Sentinel KQL',
      "ssh-toc-5": '5. Cobertura Portable en Sigma',
      "ssh-toc-6": '6. Validación Empírica en Azure Data Explorer',
      "ssh-toc-7": '7. Ajuste, Falsos Positivos y Hardening de Endpoints',
      "ssh-toc-8": '8. Referencias Verificadas',
      "ssh-s1-title": '1. Contexto de Amenaza y Por Qué Importan los Límites de Autenticación',
      "ssh-s2-title": '2. Vectores de Ejecución y Puntos Ciegos de Telemetría',
      "callout-ssh-title": '<i class="bi bi-eye-slash" aria-hidden="true"></i> Restricción Clave de Diseño: Binarios Renombrados e Indirección por Configuración',
      "callout-ssh-body": 'Verificar únicamente <code>FileName =~ "ssh.exe"</code> falla si un adversario copia <code>ssh.exe</code> a <code>svchost_helper.exe</code>, y verificar sólo <code>ProcessCommandLine</code> pasa por alto <code>-F</code> o <code>.ssh/config</code>. Por tanto, la consulta de Sentinel normaliza la identidad del proceso y del proceso padre con <code>ProcessVersionInfoOriginalFileName =~ "ssh.exe"</code> (al igual que para los LOLBins hijos) y combina la coincidencia en línea de comandos con un linaje estricto de procesos hijos.',
      "ssh-s3-title": '3. Mitigando Evasión <em>First-Match-Wins</em> en RE2 Puro',
      "ssh-s4-title": '4. Consulta Completa de Hunting en Sentinel KQL (<code>Azure/Azure-Sentinel #15693</code>)',
      "ssh-s5-title": '5. Cobertura Portable en Sigma (<code>SigmaHQ/sigma #6585</code>)',
      "ssh-s6-title": '6. Validación Empírica en Azure Data Explorer (Harness de 19 Casos)',
      "ssh-s7-title": '7. Ajuste, Falsos Positivos y Hardening de Endpoints',
      "ssh-s8-title": '8. Referencias Verificadas',
      "ssh-quick-title": 'Acceso Rápido a Artefactos de Detección',
      "ssh-foot-back": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Volver al Centro de Investigaciones',
      "ssh-foot-next": 'Siguiente: Investigación BigDiskBuster y fsutil <i class="bi bi-arrow-right" aria-hidden="true"></i>'
    },
    en: {
      "nav-portfolio": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Portfolio',
      "nav-all-research": '<i class="bi bi-grid" aria-hidden="true"></i> All Research',
      "crumb-research": 'Research',
      "footer-portfolio": 'Portfolio',
      "footer-research": 'Research Hub',
      "btn-back-to-top": 'Back to top',

      // Research Hub
      "hub-kicker": '<i class="bi bi-diagram-3" aria-hidden="true"></i> Offense-to-Defense Research Hub',
      "hub-title": 'Detection Engineering &amp; <em>Threat Research</em>',
      "hub-lead": 'Long-form engineering write-ups documenting end-to-end <strong>Offense &rarr; Emulation &rarr; Detection</strong> cycles: turning native Windows tradecraft into peer-reviewed <strong>LOLBAS</strong> entries, <strong>Atomic Red Team</strong> tests, Win32 kernel-handle monitors, and verified multi-SIEM detections across <strong>Sigma</strong>, <strong>Elastic EQL</strong>, and <strong>Microsoft Sentinel KQL</strong>.',
      "hub-pill-focus": '<i class="bi bi-shield-check" aria-hidden="true"></i> Focus: Detection Engineering &amp; Applied AI Security',
      "hub-pill-cited": '<i class="bi bi-building" aria-hidden="true"></i> Tooling Cited by CUHK ITSC',
      "kpi-merged-lbl": 'Merged Upstream PRs',
      "kpi-approved-lbl": 'Approved Detections',
      "kpi-review-lbl": 'Active PRs in Review',
      "kpi-mitre-lbl": 'MITRE ATT&amp;CK Techniques',
      "method-01-title": 'LOLBAS &amp; Internals',
      "method-01-sub": 'Isolate native execution paths &amp; Win32 handle mechanics.',
      "method-02-title": 'Safe Atomic Tests',
      "method-02-sub": 'Generate repeatable endpoint telemetry without host exhaustion.',
      "method-03-title": 'Sigma · KQL · EQL',
      "method-03-sub": 'Handle renamed binaries, config indirection &amp; pure-RE2 edge cases.',
      "method-04-title": 'Empirical Harnesses',
      "method-04-sub": 'Benchmark TP/FP rates in ADX, evtx-sigma-checker &amp; repo CI.',
      "hub-ssh-title": 'Abusing Windows OpenSSH (<code>KnownHostsCommand</code> &amp; <code>PermitLocalCommand</code>) and Closing First-Match-Wins Detection Bypasses in KQL &amp; Sigma',
      "hub-ssh-desc": 'Compares pre-authentication (<code>KnownHostsCommand</code>) vs. post-authentication (<code>PermitLocalCommand</code> / <code>LocalCommand</code>, Star Blizzard <em>RedFlick</em>) execution in <code>ssh.exe</code>, models <code>-F</code> / <code>.ssh/config</code> CLI blind spots via child-process lineage, and builds a pure-RE2 KQL automaton validated in Azure Data Explorer.',
      "hub-ssh-cta": 'Read full deep dive <i class="bi bi-arrow-right" aria-hidden="true"></i>',
      "hub-ssh-read": '2026-11-20 &middot; 9 min read',
      "hub-bdb-title": 'From Disk-Exhaustion DoS against Windows Defender (<code>fsutil.exe</code> / BigDiskBuster) to Multi-SIEM &amp; Kernel-Handle Detection',
      "hub-bdb-desc": 'Traces disk-exhaustion evasion (<code>ERROR_DISK_FULL</code>) across both native NT allocation (BigDiskBuster) and LOLBin execution (<code>fsutil.exe file createnew</code>): from <code>BDB-Guardian</code> (cited by CUHK ITSC) and debugging <code>0xC0000374</code> / pipe deadlocks in Win32 handle scanning to <strong>Atomic Red Team #3439</strong>, <strong>SigmaHQ #6310</strong>, and <strong>Elastic #6946</strong>.',
      "hub-bdb-cta": 'Read full deep dive <i class="bi bi-arrow-right" aria-hidden="true"></i>',
      "hub-bdb-read": '2026-11-20 &middot; 10 min read',
      "mitre-kicker": '<i class="bi bi-bullseye" aria-hidden="true"></i> MITRE ATT&amp;CK Coverage Map',
      "mitre-card-1-title": 'Indirect Command Execution (<code>ssh.exe</code>)',
      "mitre-card-2-title": 'Defender Update Starvation &amp; <code>fsutil.exe</code>',
      "mitre-card-3-title": 'Password Managers (KeePass Discovery)',
      "mitre-card-4-title": 'Remote Access Software (Custom AnyDesk)',
      "matrix-kicker": '<i class="bi bi-table" aria-hidden="true"></i> Upstream Traceability Matrix',
      "matrix-th-repo": 'Repository &amp; PR',
      "matrix-th-domain": 'Domain',
      "matrix-th-scope": 'MITRE / Scope',
      "matrix-th-status": 'Status',
      "matrix-filt-all": 'All',
      "matrix-filt-merged": 'Merged',
      "matrix-filt-approved": 'Approved',
      "matrix-filt-review": 'In Review',
      "matrix-search-ph": 'Filter repo, T-code, Sigma, KQL...',
      "matrix-empty": 'No upstream contributions match the current filter.',
      "rfooter-back": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Back to dev101x.online',
      "rfooter-dive1": 'Start with Deep Dive 01 <i class="bi bi-arrow-right" aria-hidden="true"></i>',

      // BigDiskBuster Deep Dive
      "bdb-art-kicker": '<i class="bi bi-terminal" aria-hidden="true"></i> Defense Evasion &middot; Denial of Service &middot; T1685 &middot; T1562.001',
      "bdb-art-title": 'From Defender Disk-Exhaustion DoS (<code>fsutil.exe</code> / <em>BigDiskBuster</em>) to Multi-SIEM &amp; Kernel-Handle Detection',
      "bdb-art-read": '10 min read · Published 2026-11-20',
      "bdb-toc-title": 'Contents',
      "bdb-toc-1": '1. Threat Model: Native NT vs. LOLBin',
      "bdb-toc-2": '2. BDB-Guardian &amp; Win32 Lessons',
      "bdb-toc-3": '3. Safe Emulation (Atomic #3439)',
      "bdb-toc-4": '4. Multi-SIEM Rules (Sigma &amp; Elastic)',
      "bdb-toc-5": '5. Triage &amp; Incident Response',
      "bdb-toc-6": '6. Verified References',
      "bdb-s1-title": '1. Threat Model: Native NT Allocation vs. <code>fsutil.exe</code>',
      "bdb-s1-p1": 'Adversaries targeting Windows Defender signature updates (specifically <code>MpSigStub.exe</code> and <code>MRT.exe</code>) exploit a physical storage invariant: when an NTFS volume drops below ~50 MB of free space, signature unpack routines fail silently with <code>ERROR_DISK_FULL (0x80070070)</code>, leaving the host frozen on obsolete definitions.',
      "bdb-s2-title": '2. Closing the EDR Blind Spot: <code>BDB-Guardian</code> &amp; Win32 Internals',
      "bdb-s2-p1": 'Standard endpoint detection rules trigger on process creation (<code>fsutil.exe file createnew</code>). They are blind to native NT allocation loops compiled into in-memory .NET or C++ loaders that never invoke a child process. To detect both without crashing enterprise endpoints, <code>BDB-Guardian</code> pairs <strong>Restart Manager API</strong> with native handle scanning via <code>NtQuerySystemInformation(SystemHandleInformation)</code>.',
      "bdb-s2-p2": '<strong>Same-PID Correlation Verdict:</strong> When a single non-whitelisted PID simultaneously holds an open handle to <code>MRT.exe</code> and the system volume, the verdict escalates immediately to <strong>CRITICAL</strong> (near-zero false positives), and presence of the GUID buster-file confirms active BigDiskBuster-like execution. To isolate native Win32/P/Invoke memory from the PowerShell orchestrator, <code>BDBMonitor.ps1</code> delegates all native calls to a dedicated child worker (<code>Invoke-VolumeScan.ps1</code> + inline C# in <code>bdb-csharp.ps1</code>).',
      "callout-bdb-title": '<i class="bi bi-bug" aria-hidden="true"></i> Engineering Post-Mortem: Fixing <code>0xC0000374</code> Heap Corruption &amp; Named-Pipe Deadlocks',
      "callout-bdb-intro": 'Two real Win32 pitfalls surfaced during live testing of <code>BDB-Guardian</code>—documented in the repo and reproduced in the <a href="https://devcop95.github.io/BDB-Guardian/" target="_blank" rel="noopener">evidence report</a>:',
      "callout-bdb-item1": '<strong><code>RmGetList</code> struct mismatch (<code>0xC0000374</code>):</strong> Calling <code>RmGetList</code> with a buffer sized for <code>RM_UNIQUE_PROCESS</code> instead of <code>RM_PROCESS_INFO</code> (~668 bytes/entry) triggers native heap corruption (<code>STATUS_HEAP_CORRUPTION</code>). Switching to <code>RM_PROCESS_INFO</code> with a proper resize retry loop eliminated all <code>Application Error</code> crashes across consecutive runs.',
      "callout-bdb-item2": '<strong><code>NtQueryObject</code> pipe hang:</strong> Querying object names across arbitrary duplicated handles stalls indefinitely on synchronous named pipes. Filtering out handles where <code>GetFileType != FILE_TYPE_DISK</code> before calling <code>NtQueryObject</code>—backed by per-PID timeouts—eliminated hangs and cut full-system handle scan runtime from <strong>~45 seconds down to 6–14 seconds</strong>.',
      "bdb-s3-title": '3. Safe Adversary Emulation (<code>Atomic Red Team #3439</code> &mdash; Test #79)',
      "bdb-s4-title": '4. Multi-SIEM Detection Rules (<code>SigmaHQ #6310</code> &amp; <code>Elastic #6946</code>)',
      "bdb-s5-title": '5. Triage &amp; Incident Response Playbook',
      "bdb-s6-title": '6. Verified References',
      "bdb-quick-title": 'Detection Artifacts Quick-Jump',
      "bdb-foot-back": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Back to Research Hub',
      "bdb-foot-next": 'Next: Windows OpenSSH Deep Dive <i class="bi bi-arrow-right" aria-hidden="true"></i>',

      // Windows OpenSSH Deep Dive
      "ssh-art-kicker": '<i class="bi bi-terminal-split" aria-hidden="true"></i> Living-off-the-Land &middot; Defense Evasion &middot; T1202 &middot; T1059',
      "ssh-art-title": 'Abusing Windows OpenSSH and Closing <em>First-Match-Wins</em> Bypasses in KQL &amp; Sigma',
      "ssh-art-read": '9 min read · Published 2026-11-20',
      "ssh-toc-title": 'Contents',
      "ssh-toc-1": '1. Threat Context &amp; Why Auth Boundaries Matter',
      "ssh-toc-2": '2. Execution Vectors &amp; Telemetry Blind Spots',
      "ssh-toc-3": '3. Closing OpenSSH First-Match-Wins Evasion in Pure RE2',
      "ssh-toc-4": '4. Full Sentinel KQL Hunting Query',
      "ssh-toc-5": '5. Portable Sigma Coverage',
      "ssh-toc-6": '6. Empirical Validation in Azure Data Explorer',
      "ssh-toc-7": '7. Tuning, False Positives &amp; Endpoint Hardening',
      "ssh-toc-8": '8. Verified References',
      "ssh-s1-title": '1. Threat Context &amp; Why Auth Boundaries Matter',
      "ssh-s2-title": '2. Execution Vectors &amp; Telemetry Blind Spots',
      "callout-ssh-title": '<i class="bi bi-eye-slash" aria-hidden="true"></i> Key Design Constraint: Renamed Binaries &amp; Config Indirection',
      "callout-ssh-body": 'Checking only <code>FileName =~ "ssh.exe"</code> breaks if an adversary copies <code>ssh.exe</code> to <code>svchost_helper.exe</code>, and checking only <code>ProcessCommandLine</code> misses <code>-F</code> or <code>.ssh/config</code>. Therefore, the Sentinel query normalizes both process and parent identity with <code>ProcessVersionInfoOriginalFileName =~ "ssh.exe"</code> (and the same for child LOLBins) and pairs CLI matching with strict child process lineage.',
      "ssh-s3-title": '3. Closing OpenSSH <em>First-Match-Wins</em> Evasion in Pure RE2',
      "ssh-s4-title": '4. Full Sentinel KQL Hunting Query (<code>Azure/Azure-Sentinel #15693</code>)',
      "ssh-s5-title": '5. Portable Sigma Coverage (<code>SigmaHQ/sigma #6585</code>)',
      "ssh-s6-title": '6. Empirical Validation in Azure Data Explorer (19-Case Harness)',
      "ssh-s7-title": '7. Tuning, False Positives &amp; Endpoint Hardening',
      "ssh-s8-title": '8. Verified References',
      "ssh-quick-title": 'Detection Artifacts Quick-Jump',
      "ssh-foot-back": '<i class="bi bi-arrow-left" aria-hidden="true"></i> Back to Research Hub',
      "ssh-foot-next": 'Next: BigDiskBuster &amp; fsutil Deep Dive <i class="bi bi-arrow-right" aria-hidden="true"></i>'
    }
  };

  const updateLanguage = (lang) => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
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
    root.setAttribute('lang', lang);
    try { localStorage.setItem('devyhb-lang', lang); } catch { /* Storage optional */ }
    announce(lang === 'es' ? 'Idioma cambiado a español' : 'Language changed to English');
  };

  let savedLang = 'es';
  try {
    const stored = localStorage.getItem('devyhb-lang');
    if (stored === 'en' || stored === 'es') savedLang = stored;
  } catch { /* optional */ }

  updateLanguage(savedLang);

  langToggle?.addEventListener('click', () => {
    const current = root.getAttribute('lang') || savedLang;
    const next = current === 'es' ? 'en' : 'es';
    updateLanguage(next);
  });

});
