document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    const root = document.documentElement;
    const body = document.body;
    const loader = document.getElementById('loader');
    const loaderCopy = loader?.querySelector('.loader-copy');

    const scrambleLoaderText = (target, text, duration = 650, callback) => {
        if (!target) {
            if (callback) callback();
            return;
        }
        const chars = '▓░▒█!<>-_[]{}=+*^?#';
        const length = text.length;
        const queue = [];
        for (let i = 0; i < length; i++) {
            const char = text[i];
            const start = Math.random() * duration * 0.25;
            const end = start + duration * (0.5 + Math.random() * 0.35);
            queue.push({ char, start, end });
        }
        const nodes = Array.from({ length }, () => document.createElement('span'));
        target.textContent = '';
        const fragment = document.createDocumentFragment();
        nodes.forEach(n => fragment.appendChild(n));
        target.appendChild(fragment);

        const startedAt = performance.now();
        const tick = (now) => {
            const elapsed = now - startedAt;
            let complete = 0;
            for (let i = 0; i < length; i++) {
                const { char, start, end } = queue[i];
                const node = nodes[i];
                if (elapsed >= end) {
                    complete++;
                    node.textContent = char;
                    node.style.cssText = '';
                } else if (elapsed >= start) {
                    node.textContent = chars[Math.floor(Math.random() * chars.length)];
                    node.style.cssText = 'color:var(--accent);text-shadow:0 0 8px var(--accent);opacity:0.9;';
                } else {
                    node.textContent = '░▒'[Math.floor(Math.random() * 2)];
                    node.style.cssText = 'color:var(--accent);opacity:0.4;';
                }
            }
            if (complete < length) {
                requestAnimationFrame(tick);
            } else {
                target.textContent = text;
                if (callback) callback();
            }
        };
        requestAnimationFrame(tick);
    };

    if (loader) {
        body.classList.remove('is-loading');
        requestAnimationFrame(() => {
            loader.classList.add('hide');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 220);
        });
    } else {
        body.classList.remove('is-loading');
    }
    const scrollProgress = document.getElementById('scroll-progress');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('i');
    const mnav = document.getElementById('mnav');
    const scrollTopBtn = document.getElementById('scrollTop');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileClose = document.getElementById('mobileClose');
    const langToggle = document.getElementById('langToggle');

    // ─── LIVE GITHUB STARS ───────────────────────────────────────────────────
    (function updateRepoStars() {
        const badge = document.querySelector('.flagship-stars[data-repo]');
        if (!badge) return;
        const countEl = badge.querySelector('[data-stars]');
        if (!countEl) return;
        fetch(`https://api.github.com/repos/${badge.dataset.repo}`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                if (Number.isSafeInteger(data.stargazers_count) && data.stargazers_count >= 0) countEl.textContent = data.stargazers_count;
            })
            .catch(() => { /* A dash means unavailable, never an estimated count. */ });
    })();

    // GitHub profile metrics share one request and keep unavailable values as dashes.
    (function updateProfileStats() {
        const stats = document.querySelectorAll('[data-gh-stat]');
        if (!stats.length) return;
        fetch('https://api.github.com/users/DevCop95', { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                stats.forEach(stat => {
                    const value = data[stat.dataset.ghStat];
                    if (Number.isSafeInteger(value) && value >= 0) stat.textContent = value;
                });
            })
            .catch(() => { /* Leave unavailable metrics without a fabricated fallback. */ });
    })();

    // ─── GITHUB CONTRIBUTION CALENDAR ────────────────────────────────────────
    (function renderContributionChart() {
        const chart = document.getElementById('ghChart');
        if (!chart) return;
        const totalEl = document.querySelector('[data-gh-total]');
        const user = chart.dataset.ghUser;

        fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                const days = data.contributions || [];
                if (!days.length) return Promise.reject('empty');

                const grid = document.createElement('div');
                grid.className = 'gh-chart-grid';
                const months = document.createElement('div');
                months.className = 'gh-chart-months';

                // Rellenar hasta el domingo previo para que las columnas sean semanas completas
                const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
                for (let i = 0; i < offset; i++) {
                    const pad = document.createElement('div');
                    pad.className = 'gh-day gh-pad';
                    grid.appendChild(pad);
                }

                const lang = root.lang === 'en' ? 'en-US' : 'es-ES';
                days.forEach(day => {
                    const cell = document.createElement('div');
                    cell.className = 'gh-day';
                    cell.dataset.level = day.level;
                    cell.title = `${day.count} · ${day.date}`;
                    grid.appendChild(cell);
                });

                // Una etiqueta por columna (semana); solo se escribe al cambiar de mes
                const columns = Math.ceil((offset + days.length) / 7);
                let lastMonth = -1;
                for (let c = 0; c < columns; c++) {
                    const day = days[Math.max(0, c * 7 - offset)];
                    const date = new Date(`${day.date}T00:00:00Z`);
                    const month = date.getUTCMonth();
                    const label = document.createElement('span');
                    if (month !== lastMonth) {
                        label.textContent = date.toLocaleDateString(lang, { month: 'short', timeZone: 'UTC' });
                        lastMonth = month;
                    }
                    months.appendChild(label);
                }

                chart.replaceChildren(months, grid);
                const total = data.total?.lastYear;
                if (totalEl && typeof total === 'number') totalEl.textContent = total.toLocaleString(lang);
            })
            .catch(() => {
                chart.classList.add('gh-chart-error');
                chart.textContent = '—';
                if (totalEl) totalEl.textContent = '—';
            });
    })();

    // ─── TRANSLATIONS ────────────────────────────────────────────────────────
    const translations = {
        es: {
            "nav-about": "Sobre mi",
            "nav-research": "Investigación",
            "nav-skills": "Habilidades",
            "nav-resume": "Trayectoria",
            "nav-portfolio": "Portafolio",
            "nav-services": "Servicios",
            "nav-contact": "Contacto",
            "nav-cta": "Hablemos",
            "hero-tag": "Detection Engineering &amp; AI Security · Cartagena, Colombia 🇨🇴",
            "hero-title-main": "Security Researcher",
            "hero-title-sub": "Detection Engineering, seguridad ofensiva &amp; IA aplicada",
            "hero-copy": "Investigador de seguridad ofensiva y detección (<strong>DevCop95 / Dev101x</strong>). Cierro el ciclo completo <strong>Offense &rarr; Emulation &rarr; Detection</strong> con contribuciones mergeadas en <strong>LOLBAS</strong>, <strong>Atomic Red Team</strong>, <strong>LOLRMM</strong> y <strong>Maigret</strong>, monitorización citada por <strong>CUHK ITSC</strong>, pentesting en Henkel y seguridad aplicada a agentes de IA.",
            "hero-btn-research": "Leer Deep Dives",
            "hero-btn-portfolio": "Ver portafolio",
            "hero-stat-exp": "PRs upstream mergeados",
            "hero-stat-tech": "LOLBAS &middot; Atomic &middot; Sigma &middot; KQL &middot; EQL",
            "hero-stat-time": "GitHub Colombia &middot; committers.top",
            "about-label": "01 - Sobre mi",
            "about-title": "De la explotación a la <em>detección verificada</em>",
            "about-copy": "Soy <strong>Yared Henriquez (Dev101x / DevCop95)</strong>, investigador de seguridad especializado en <strong>Detection Engineering</strong> y <strong>Seguridad en IA Aplicada</strong>, radicado en Cartagena, Colombia. Posicionado en el <strong>Top #16 de Colombia en GitHub</strong> (committers.top) y registrado en <strong>Open Source Colombia</strong>. Mi foco es traducir técnicas reales de evasión en estándares abiertos — con <strong>10+ PRs mergeados</strong> en <strong>LOLBAS</strong>, <strong>Red Canary Atomic Red Team</strong>, <strong>LOLRMM</strong> y <strong>Maigret</strong>, investigación defensiva citada por <strong>The Chinese University of Hong Kong (CUHK ITSC)</strong>, pruebas de penetración en <strong>Henkel</strong> y M.Sc. en Inteligencia Artificial (Universitat de Barcelona).",
            "about-meta-role": "Especialidad",
            "about-meta-role-v": "Detection &amp; AI Security",
            "about-meta-city": "Ubicación",
            "about-meta-city-v": "Cartagena, Colombia 🇨🇴",
            "about-meta-rank": "Ranking Nacional",
            "about-meta-rank-v": "Top #16 GitHub Colombia",
            "about-meta-dir": "Directorio Oficial",
            "about-meta-dir-v": "Open Source Colombia",
            "about-meta-email": "Email",
            "about-meta-avail": "Disponibilidad",
            "about-meta-avail-v": "Disponible",
            "about-meta-edu": "Formación",
            "about-meta-edu-v": "Ingeniería en Sistemas + Master IA",
            "research-label": "02 - Investigación &amp; Deep Dives",
            "research-title": "Investigación técnica <em>de punta a punta</em>",
            "research-intro": "Casos de estudio completos (en inglés) que conectan la anatomía del abuso en Windows con telemetría real, emulación segura y reglas verificadas en producción.",
            "research-1-title": "Windows OpenSSH Indirect Execution &amp; Pure-RE2 First-Match-Wins Bypass",
            "research-1-copy": "Análisis comparativo entre <code>KnownHostsCommand</code> (pre-auth) y <code>PermitLocalCommand</code>/<code>LocalCommand</code> (Star Blizzard RedFlick), detección de configuraciones ocultas vía <code>-F</code>/<code>.ssh/config</code> por linaje de procesos hijos y autómata RE2 puro para KQL validado en 19 escenarios en Azure Data Explorer.",
            "research-2-stat": "Citado por CUHK ITSC",
            "research-2-title": "Defender Disk-Exhaustion DoS (<code>fsutil.exe</code> / BigDiskBuster) &rarr; Multi-SIEM &amp; Kernel Handles",
            "research-2-copy": "Desde llamadas NT nativas sin rastro CLI hasta <code>fsutil.exe file createnew</code>: arquitectura Win32 de <strong>BDB-Guardian</strong> (resolución de heap corruption <code>0xC0000374</code> en <code>RM_PROCESS_INFO</code> y deadlocks de pipes), emulación segura en Atomic Red Team #3439 y reglas aprobadas en SigmaHQ #6310 y Elastic #6946.",
            "research-read-cta": "Leer Deep Dive",
            "research-hub-cta": "Explorar Research Hub &amp; Matriz Upstream",
            "skills-label": "03 - Habilidades",
            "skills-title": "Stack técnico<br><em>y especialización</em>",
            "skills-copy": "Especializado en ingeniería de detección multiplataforma, emulación de adversarios y seguridad aplicada a sistemas de IA y agentes autónomos.",
            "skills-group-1": "Detection Engineering &amp; Threat Emulation",
            "skills-group-2": "Offensive &amp; Applied AI Security",
            "skills-group-3": "Systems &amp; Security Engineering",
            "skills-group-4": "Web, Data &amp; Enterprise",
            "skills-bots": "Bots",
            "skills-workflows": "Flujos",
            "resume-label": "04 - Trayectoria",
            "resume-exp-title": "Experiencia Laboral",
            "resume-exp-0-title": "<span class='text-bold'>Evaluador de Penetración</span>",
            "resume-exp-0-org": "Henkel · Suiza (Remoto · Jornada parcial)",
            "resume-exp-0-desc": "Pruebas de penetración ofensivas, auditorías de seguridad de redes y evaluación de vulnerabilidades en infraestructura corporativa.",
            "resume-exp-1-title": "<span class='text-bold'>Chief Technology Officer (CTO)</span>",
            "resume-exp-1-org": "EXIA S.A.S - Energía Solar",
            "resume-exp-1-desc": "Liderazgo técnico en la integración de sensores IoT, monitoreo en tiempo real y automatización de procesos operativos.",
            "resume-exp-2-title": "<span class='text-bold'>Associate Software Developer (QA & Testing)</span>",
            "resume-exp-2-org": "Google (Filial / Extended Workforce)",
            "resume-exp-2-desc": "Desarrollo de software, aseguramiento de calidad (QA) y mejora de flujos de ingeniería en proyectos de alta escala.",
            "resume-exp-3-title": "<span class='text-bold'>Consultoría en TI & Automatización</span>",
            "resume-exp-3-org": "Independiente / Freelance",
            "resume-exp-3-desc": "Desarrollo de soluciones personalizadas en Python y arquitecturas web para clientes en diversos sectores.",
            "resume-exp-4-title": "<span class='text-bold'>Asistente Administrativo</span>",
            "resume-exp-4-org": "Proyecto CIER NORTE",
            "resume-exp-4-desc": "Gestión administrativa y soporte operativo del proyecto.",
            "resume-edu-title": "Educación",
            "resume-edu-1-title": "<span class='text-bold'>Máster en Inteligencia Artificial</span>",
            "resume-edu-1-org": "Universitat de Barcelona",
            "resume-edu-1-desc": "Especialización en modelos generativos, agentes autónomos y visión por computadora.",
            "resume-edu-2-title": "<span class='text-bold'>Ingeniería en Sistemas</span>",
            "resume-edu-2-org": "Universidad Tecnológica de Bolívar",
            "resume-edu-2-desc": "Formación integral en algoritmos, arquitectura de software y gestión de proyectos tecnológicos.",
            "resume-edu-3-title": "<span class='text-bold'>Tecnólogo en Sistemas</span>",
            "resume-edu-3-org": "Universidad Tecnológica de Bolívar",
            "resume-edu-3-desc": "Base tecnológica en programación, redes y fundamentos de sistemas.",
            "portfolio-label": "05 - Portafolio",
            "portfolio-title": "Ingeniería &amp; <em>arsenal técnico</em>",
            "portfolio-intro": "Contribuciones upstream, monitores defensivos, herramientas en Go/Python y laboratorios con código abierto.",
            "portfolio-learning-title": "Formación y herramientas",
            "portfolio-project-design": "Decisiones técnicas",
            "portfolio-project-evidence": "Evidencia y alcance",
            "portfolio-recons-tag": "Reconocimiento pasivo · CLI",
            "portfolio-recons-copy": "Herramienta en Python para enumerar hostnames publicados en Shodan CTL. Funciona en Windows, Linux y Termux sin una API key de Shodan ni paquetes de terceros.",
            "portfolio-recons-design": "Reconocimiento pasivo por defecto, salidas TXT/JSON y mensajes de estado separados para integrarse con otros procesos.",
            "portfolio-recons-evidence": "Pruebas con unittest, CI y versiones publicadas. Las comprobaciones activas son opcionales y requieren autorización sobre los objetivos.",
            "portfolio-cyhber-tag": "IA aplicada · DevSecOps",
            "portfolio-cyhber-copy": "Skill de revisión de seguridad asistida por IA para Claude Code (Grade A en SkillsDirectory). Organiza el análisis en cinco capas: código, dependencias, secretos y datos personales, CI/CD e infraestructura.",
            "portfolio-cyhber-design": "Hallazgos estructurados por severidad, evidencia y remediación; un renderizador Python genera los reportes en terminal.",
            "portfolio-cyhber-evidence": "Ejemplos y evaluaciones manuales documentadas, no benchmarks automatizados. Complementa, pero no sustituye, una auditoría profesional.",
            "portfolio-releases-cta": "Ver versiones",
            "portfolio-evaluation-cta": "Ver evaluación",
            "portfolio-cursos-tag": "Cursos · Supabase",
            "portfolio-cursos-copy": "Cursos en español con terminal simulada en el navegador: Nmap desde Windows (gratis) y Git y GitHub desde cero (premium). Progreso y acceso validados en el servidor.",
            "portfolio-cursos-cta": "Ver los cursos",
            "portfolio-filter-cert": "Certificaciones",
            "portfolio-filter-tech": "Tecnologías",
            "cert-carousel-title": "Certificaciones & Credenciales",
            "cert-tag-comp": "Complementario",
            "deck-title-badge": "Project Showcase Deck",
            "deck-btn-prev": "Anterior",
            "deck-btn-next": "Siguiente",
            "deck-tab-0": "Upstream Research",
            "deck-tab-1": "BugBounty",
            "deck-tab-2": "BDB-Guardian",
            "deck-tab-3": "pullgoscript",
            "deck-tab-4": "Pentest Lab",
            "deck-tab-5": "dev101_bot",
            "deck-tab-6": "Social Proof",
            "portfolio-cert-mini-title": "Certificaciones complementarias",
            "portfolio-security-title": "Security Research · Proyecto Estrella",
            "portfolio-flagship-tag": "Bug Bounty Workspace · HackerOne",
            "portfolio-flagship-copy": "Workspace completo de bug bounty para investigadores de HackerOne: enforcement de scope, pipeline automatizado de recon/vulnerabilidades con <strong>400+ herramientas</strong>, plantillas de reportes, watchlists de CVE/CWE y un lab local en VM. Construido para hunting disciplinado y ético.",
            "portfolio-flagship-cta": "Ver el repositorio",
            "portfolio-proof-title": "Engineering Presence · Social Proof",
            "portfolio-github-status": "GitHub Status",
            "portfolio-github-cta": "Acceder al código",
            "portfolio-trailhead-cta": "Ver perfil oficial",
            "portfolio-bdb-header": "Kernel Handle Correlation · CUHK ITSC Cited",
            "portfolio-bdb-tag": "Defensive Windows Monitor · PowerShell &amp; Win32/C#",
            "portfolio-bdb-copy": "Monitor defensivo para ataques DoS tipo BigDiskBuster contra actualizaciones de Windows Defender. Correlaciona handles abiertos sobre <code>MRT.exe</code> y el volumen <code>C:</code> bajo un mismo PID mediante Restart Manager y <code>NtQuerySystemInformation</code>, e incluye reglas portables en Sigma y MDE KQL.",
            "portfolio-bdb-cta": "Ver BDB-Guardian",
            "portfolio-bdb-report-cta": "Reporte de evidencia",
            "portfolio-pullgo-header": "Systems Security Engineering · Go &amp; Assembly",
            "portfolio-pullgo-tag": "Windows Audit &amp; Hardened Console · Go + Assembly",
            "portfolio-pullgo-copy": "Toolkit en Go y Assembly para auditoría headless de exposición de credenciales en Windows orientada a equipos Blue Team y CI, junto a una consola endurecida en <code>127.0.0.1</code> con pruebas de fuzzing sobre guardas <code>Host</code>/<code>Origin</code> y análisis estático con <code>gosec</code>.",
            "portfolio-research-cta": "Leer Deep Dives",
            "portfolio-lolbas-title": "Upstream Security Research · Contribuciones Oficiales",
            "portfolio-lolbas-project-tag": "Upstream Security Research · MITRE ATT&CK T1685 · T1202 · T1555.005 · T1219",
            "portfolio-lolbas-project-title": "LOLBAS, Atomic Red Team, LOLRMM &amp; Maigret",
            "portfolio-lolbas-project-copy": "Diez contribuciones upstream fusionadas en estándares de seguridad y OSINT: <strong>LOLBAS (#525, #532, #539)</strong> en <code>Fsutil.exe</code> (T1685) y <code>Ssh.exe</code> (T1202); <strong>Red Canary Atomic Red Team (#3433, #3439)</strong> en KeePass (T1555.005) y Windows Defender (T1685); <strong>LOLRMM (#253)</strong> para clientes AnyDesk (T1219); y <strong>Maigret (&times;4)</strong> eliminando falsos positivos OSINT. En revisión activa: <strong>Elastic #6946 (Approved &times;2)</strong>, <strong>SigmaHQ #6310/#6323 (Approved) &amp; #6585</strong>, y <strong>Azure-Sentinel #15693</strong>.",
            "portfolio-lolbas-cta-web": "Ver en LOLBAS",
            "portfolio-lolbas-cta-pr": "LOLBAS (#525, #532, #539)",
            "portfolio-atomic-cta": "Atomic Red Team (#3433, #3439)",
            "portfolio-lolrmm-cta": "LOLRMM #253",
            "portfolio-lolbas-cta-cuhk": "Alerta CUHK",
            "portfolio-backend-title": "Threat Intelligence Pipeline · Serverless",
            "portfolio-pentestlab-header": "Docker Security Lab · Multi-Stage Kill Chain",
            "portfolio-pentestlab-tag": "Pro Lab Simulation · Docker & Python",
            "portfolio-aprendeapi-title": "dev101x-pentest-lab: Multi-Stage Red Team Box",
            "portfolio-aprendeapi-copy": "Laboratorio autocontenido en Docker estilo Pro Lab para entrenamiento de seguridad ofensiva: encadena SQL Injection ciego en el perímetro, pivoteo hacia red interna aislada y escalada de privilegios vía binarios SUID en Linux, con validación de banderas en tiempo real.",
            "portfolio-dev101-title": "dev101_bot + cYHBernews",
            "portfolio-dev101-copy": "Sistema que recopila y resume inteligencia de amenazas e IA con Python y Groq, automatizado con Cloudflare Workers y GitHub Actions. Distribuye las alertas a Telegram y alimenta <strong>cYHBernews</strong>.",
            "portfolio-dev101-demo": "Ver cYHBernews",
            "portfolio-demo-cta": "Probar demo",
            "portfolio-backend-project-cta": "Explorar Código",
            "services-label": "06 - Servicios",
            "services-title": "Lo que puedo <em>aportar</em>",
            "services-copy": "Ingeniería de detección, seguridad en ecosistemas de IA y evaluación ofensiva respaldada por evidencia reproducible.",
            "services-1-title": "Detection Engineering &amp; Threat Emulation",
            "services-1-desc": "Diseño de reglas Sigma, KQL (Sentinel/MDE) y Elastic EQL validadas con emulación Atomic Red Team, mapeo MITRE ATT&amp;CK y telemetría de endpoints.",
            "services-2-title": "AI Security &amp; SecOps Automation",
            "services-2-desc": "Auditoría de agentes autónomos, servidores MCP y guardrails de LLMs, junto a pipelines de reconocimiento y respuesta en Python y Go.",
            "services-3-title": "Pentesting &amp; Security Engineering",
            "services-3-desc": "Pruebas de penetración en infraestructura, web y APIs, desarrollo de herramientas defensivas en Go/PowerShell y endurecimiento AppSec (OWASP).",
            "contact-label": "07 - Contacto",
            "contact-signal-title": "Tu próxima idea.<br><em>La aseguramos y construimos.</em>",
            "contact-signal-copy": "Detection Engineering, seguridad ofensiva e IA aplicada. Cuéntame qué quieres resolver.",
            "contact-signal-cta": "Hablemos por WhatsApp",
            "contact-signal-note": "Conversación directa, sin formularios.",
            "contact-title": "¿Listo para <em>ejecutar?</em>",
            "contact-copy": "Si buscas ingeniería de detección, investigación de amenazas, auditoría de agentes de IA o pentesting con evidencia reproducible, hablemos.",
            "contact-cta-linkedin": "Perfil en LinkedIn",
            "contact-cta-htb": "Perfil en Hack The Box",
            "contact-cta-cv": "CV en inglés (PDF)",
            "contact-status-title": "Disponibilidad Técnica",
            "contact-status-base": "Base",
            "contact-status-resp": "Respuesta",
            "contact-status-resp-v": "< 24 Horas",
            "contact-status-focus": "Enfoque",
            "contact-status-focus-v": "Detection · OffSec · IA",
            "contact-status-mod": "Modalidad",
            "contact-status-mod-v": "Research / Consultoría",
            "contact-status-signal": "Sistemas listos para nuevas integraciones y despliegues.",
            "github-scroll-hint": "Desliza para ver meses",
            "github-chart-header": "Contribuciones en GitHub",
            "github-chart-range": "Últimos 12 meses",
            "github-chart-total-label": "contribuciones",
            "github-stars": "estrellas",
            "github-followers": "Seguidores",
            "github-public-repos": "Repositorios públicos",
            "github-metrics-note": "Fuente: API de GitHub. Un guion indica un dato no disponible.",
            "github-rank-colombia": "Rank Colombia",
            "footer-copy": "Construido por",
            "footer-colombia": "Detection Engineering &amp; AI Security · Cartagena, Colombia 🇨🇴",
            "footer-courses": "Cursos"
        },
        en: {
            "nav-about": "About me",
            "nav-research": "Research",
            "nav-skills": "Skills",
            "nav-resume": "Resume",
            "nav-portfolio": "Portfolio",
            "nav-services": "Services",
            "nav-contact": "Contact",
            "nav-cta": "Let's Talk",
            "hero-tag": "Detection Engineering &amp; AI Security · Cartagena, Colombia 🇨🇴",
            "hero-title-main": "Security Researcher",
            "hero-title-sub": "Detection Engineering, offensive security &amp; applied AI",
            "hero-copy": "Offensive security &amp; detection researcher (<strong>DevCop95 / Dev101x</strong>). Closing the full <strong>Offense &rarr; Emulation &rarr; Detection</strong> loop with merged contributions in <strong>LOLBAS</strong>, <strong>Atomic Red Team</strong>, <strong>LOLRMM</strong> and <strong>Maigret</strong>, defensive monitoring cited by <strong>CUHK ITSC</strong>, pentesting at Henkel, and applied AI agent security.",
            "hero-btn-research": "Read Deep Dives",
            "hero-btn-portfolio": "View Portfolio",
            "hero-stat-exp": "merged upstream PRs",
            "hero-stat-tech": "LOLBAS &middot; Atomic &middot; Sigma &middot; KQL &middot; EQL",
            "hero-stat-time": "GitHub Colombia &middot; committers.top",
            "about-label": "01 - About me",
            "about-title": "From exploitation to <em>verified detection</em>",
            "about-copy": "I am <strong>Yared Henriquez (Dev101x / DevCop95)</strong>, a Security Researcher specializing in <strong>Detection Engineering</strong> and <strong>Applied AI Security</strong> based in Cartagena, Colombia. Ranked <strong>Top #16 nationwide in Colombia on GitHub</strong> (committers.top) and listed in <strong>Open Source Colombia</strong>. My work turns real-world evasion tradecraft into open standards — with <strong>10+ merged PRs</strong> in <strong>LOLBAS</strong>, <strong>Red Canary Atomic Red Team</strong>, <strong>LOLRMM</strong> and <strong>Maigret</strong>, defensive research cited by <strong>The Chinese University of Hong Kong (CUHK ITSC)</strong>, penetration testing at <strong>Henkel</strong>, and an M.Sc. in Artificial Intelligence (Universitat de Barcelona).",
            "about-meta-role": "Specialty",
            "about-meta-role-v": "Detection &amp; AI Security",
            "about-meta-city": "Location",
            "about-meta-city-v": "Cartagena, Colombia 🇨🇴",
            "about-meta-rank": "National Rank",
            "about-meta-rank-v": "Top #16 GitHub Colombia",
            "about-meta-dir": "Official Directory",
            "about-meta-dir-v": "Open Source Colombia",
            "about-meta-email": "Email",
            "about-meta-avail": "Availability",
            "about-meta-avail-v": "Available",
            "about-meta-edu": "Education",
            "about-meta-edu-v": "Systems Engineering + Master AI",
            "research-label": "02 - Research &amp; Deep Dives",
            "research-title": "End-to-end <em>technical research</em>",
            "research-intro": "Long-form engineering write-ups connecting Windows abuse mechanics with real endpoint telemetry, safe emulation, and production-verified detections.",
            "research-1-title": "Windows OpenSSH Indirect Execution &amp; Pure-RE2 First-Match-Wins Bypass",
            "research-1-copy": "Side-by-side breakdown of pre-auth <code>KnownHostsCommand</code> vs. post-auth <code>PermitLocalCommand</code>/<code>LocalCommand</code> (Star Blizzard RedFlick), catching hidden <code>-F</code>/<code>.ssh/config</code> runs via child-process lineage, and a pure-RE2 KQL automaton validated across 19 ADX test cases.",
            "research-2-stat": "Cited by CUHK ITSC",
            "research-2-title": "Defender Disk-Exhaustion DoS (<code>fsutil.exe</code> / BigDiskBuster) &rarr; Multi-SIEM &amp; Kernel Handles",
            "research-2-copy": "Tracing native NT allocation vs. <code>fsutil.exe file createnew</code>: <strong>BDB-Guardian</strong> Win32 architecture (fixing <code>0xC0000374</code> heap corruption in <code>RM_PROCESS_INFO</code> and pipe deadlocks), safe emulation in Atomic Red Team #3439, and approved rules in SigmaHQ #6310 &amp; Elastic #6946.",
            "research-read-cta": "Read Deep Dive",
            "research-hub-cta": "Explore Research Hub &amp; Upstream Matrix",
            "skills-label": "03 - Skills",
            "skills-title": "Tech Stack<br><em>&amp; specialization</em>",
            "skills-copy": "Focused on cross-SIEM detection engineering, adversary emulation, and security engineering for AI systems and autonomous agents.",
            "skills-group-1": "Detection Engineering &amp; Threat Emulation",
            "skills-group-2": "Offensive &amp; Applied AI Security",
            "skills-group-3": "Systems &amp; Security Engineering",
            "skills-group-4": "Web, Data &amp; Enterprise",
            "skills-bots": "Bots",
            "skills-workflows": "Workflows",
            "resume-label": "04 - Resume",
            "resume-exp-title": "Work Experience",
            "resume-exp-0-title": "<span class='text-bold'>Penetration Tester</span>",
            "resume-exp-0-org": "Henkel · Switzerland (Remote · Part-time)",
            "resume-exp-0-desc": "Offensive security assessments, infrastructure & application penetration testing, and enterprise network security evaluations.",
            "resume-exp-1-title": "<span class='text-bold'>Chief Technology Officer (CTO)</span>",
            "resume-exp-1-org": "EXIA S.A.S - Solar Energy",
            "resume-exp-1-desc": "Technical leadership in IoT sensor integration, real-time monitoring, and operational process automation.",
            "resume-exp-2-title": "<span class='text-bold'>Associate Software Developer (QA & Testing)</span>",
            "resume-exp-2-org": "Google (Affiliate / Extended Workforce)",
            "resume-exp-2-desc": "Software development, QA testing, and engineering workflow improvements on high-scale projects.",
            "resume-exp-3-title": "<span class='text-bold'>IT Consulting & Automation</span>",
            "resume-exp-3-org": "Independent / Freelance",
            "resume-exp-3-desc": "Development of custom solutions in Python and web architectures for clients in various sectors.",
            "resume-exp-4-title": "<span class='text-bold'>Administrative Assistant</span>",
            "resume-exp-4-org": "CIER NORTE Project",
            "resume-exp-4-desc": "Administrative management and operational support for the project.",
            "resume-edu-title": "Education",
            "resume-edu-1-title": "<span class='text-bold'>Master in Artificial Intelligence</span>",
            "resume-edu-1-org": "Universitat de Barcelona",
            "resume-edu-1-desc": "Specialization in generative models, autonomous agents, and computer vision.",
            "resume-edu-2-title": "<span class='text-bold'>Systems Engineering</span>",
            "resume-edu-2-org": "Technological University of Bolivar",
            "resume-edu-2-desc": "Comprehensive training in algorithms, software architecture, and technology project management.",
            "resume-edu-3-title": "<span class='text-bold'>Systems Technologist</span>",
            "resume-edu-3-org": "Technological University of Bolivar",
            "resume-edu-3-desc": "Technological foundation in programming, networks, and systems fundamentals.",
            "portfolio-label": "05 - Portfolio",
            "portfolio-title": "Engineering &amp; <em>security arsenal</em>",
            "portfolio-intro": "Upstream contributions, defensive monitors, Go/Python tooling, and open-source labs.",
            "portfolio-learning-title": "Learning and tools",
            "portfolio-project-design": "Technical decisions",
            "portfolio-project-evidence": "Evidence and scope",
            "portfolio-recons-tag": "Passive reconnaissance · CLI",
            "portfolio-recons-copy": "A Python tool for enumerating hostnames published in Shodan CTL. Runs on Windows, Linux and Termux without a Shodan API key or third-party packages.",
            "portfolio-recons-design": "Passive reconnaissance by default, TXT/JSON output and separate status messages for integration with other processes.",
            "portfolio-recons-evidence": "unittest coverage, CI and published releases. Active checks are opt-in and require authorization for the targets.",
            "portfolio-cyhber-tag": "Applied AI · DevSecOps",
            "portfolio-cyhber-copy": "An AI-assisted security review skill for Claude Code (Grade A on SkillsDirectory). Structures analysis across five layers: code, dependencies, secrets and personal data, CI/CD, and infrastructure.",
            "portfolio-cyhber-design": "Findings structured by severity, evidence and remediation; a Python renderer produces terminal reports.",
            "portfolio-cyhber-evidence": "Documented examples and manual evaluations, not automated benchmarks. Complements, but does not replace, a professional audit.",
            "portfolio-releases-cta": "View releases",
            "portfolio-evaluation-cta": "View evaluation",
            "portfolio-cursos-tag": "Courses · Supabase",
            "portfolio-cursos-copy": "Spanish-language courses with a simulated browser terminal: Nmap on Windows (free) and Git & GitHub from scratch (premium). Progress and access validated server-side.",
            "portfolio-cursos-cta": "View the courses",
            "portfolio-filter-cert": "Certifications",
            "portfolio-filter-tech": "Technologies",
            "cert-carousel-title": "Official Certifications & Credentials",
            "cert-tag-comp": "Complementary",
            "deck-title-badge": "Project Showcase Deck",
            "deck-btn-prev": "Previous",
            "deck-btn-next": "Next",
            "deck-tab-0": "Upstream Research",
            "deck-tab-1": "BugBounty",
            "deck-tab-2": "BDB-Guardian",
            "deck-tab-3": "pullgoscript",
            "deck-tab-4": "Pentest Lab",
            "deck-tab-5": "dev101_bot",
            "deck-tab-6": "Social Proof",
            "portfolio-cert-mini-title": "Complementary certifications",
            "portfolio-security-title": "Security Research · Flagship",
            "portfolio-flagship-tag": "Bug Bounty Workspace · HackerOne",
            "portfolio-flagship-copy": "A complete bug bounty workspace for HackerOne researchers: scope enforcement, an automated recon/vulnerability pipeline with <strong>400+ tools</strong>, report templates, CVE/CWE watchlists and a local VM practice lab. Built for disciplined, ethical hunting.",
            "portfolio-flagship-cta": "View the repository",
            "portfolio-proof-title": "Engineering Presence · Social Proof",
            "portfolio-github-status": "GitHub Status",
            "portfolio-github-cta": "Access Code",
            "portfolio-trailhead-cta": "View Official Profile",
            "portfolio-bdb-header": "Kernel Handle Correlation · CUHK ITSC Cited",
            "portfolio-bdb-tag": "Defensive Windows Monitor · PowerShell &amp; Win32/C#",
            "portfolio-bdb-copy": "Defensive monitor for BigDiskBuster-style DoS attacks against Windows Defender updates. Correlates open handles on <code>MRT.exe</code> and volume <code>C:</code> under the same PID via Restart Manager and <code>NtQuerySystemInformation</code>, plus portable Sigma &amp; MDE KQL rules.",
            "portfolio-bdb-cta": "View BDB-Guardian",
            "portfolio-bdb-report-cta": "Evidence Report",
            "portfolio-pullgo-header": "Systems Security Engineering · Go &amp; Assembly",
            "portfolio-pullgo-tag": "Windows Audit &amp; Hardened Console · Go + Assembly",
            "portfolio-pullgo-copy": "Go and Assembly toolkit for headless Windows credential-exposure auditing built for Blue Teams and CI, paired with a hardened <code>127.0.0.1</code> console protected by fuzz-tested <code>Host</code>/<code>Origin</code> guards and <code>gosec</code> static analysis.",
            "portfolio-research-cta": "Read Deep Dives",
            "portfolio-lolbas-title": "Upstream Security Research · Official Contributions",
            "portfolio-lolbas-project-tag": "Upstream Security Research · MITRE ATT&CK T1685 · T1202 · T1555.005 · T1219",
            "portfolio-lolbas-project-title": "LOLBAS, Atomic Red Team, LOLRMM &amp; Maigret",
            "portfolio-lolbas-project-copy": "Ten upstream PRs merged across security &amp; OSINT standards: <strong>LOLBAS (#525, #532, #539)</strong> on <code>Fsutil.exe</code> (T1685) and <code>Ssh.exe</code> (T1202); <strong>Red Canary Atomic Red Team (#3433, #3439)</strong> on KeePass (T1555.005) and Windows Defender (T1685); <strong>LOLRMM (#253)</strong> for custom AnyDesk clients (T1219); and <strong>Maigret (&times;4)</strong> eliminating OSINT false positives. Active in review: <strong>Elastic #6946 (Approved &times;2)</strong>, <strong>SigmaHQ #6310/#6323 (Approved) &amp; #6585</strong>, and <strong>Azure-Sentinel #15693</strong>.",
            "portfolio-lolbas-cta-web": "View on LOLBAS",
            "portfolio-lolbas-cta-pr": "LOLBAS (#525, #532, #539)",
            "portfolio-atomic-cta": "Atomic Red Team (#3433, #3439)",
            "portfolio-lolrmm-cta": "LOLRMM #253",
            "portfolio-lolbas-cta-cuhk": "CUHK Advisory",
            "portfolio-backend-title": "Threat Intelligence Pipeline · Serverless",
            "portfolio-pentestlab-header": "Docker Security Lab · Multi-Stage Kill Chain",
            "portfolio-pentestlab-tag": "Pro Lab Simulation · Docker & Python",
            "portfolio-aprendeapi-title": "dev101x-pentest-lab: Multi-Stage Red Team Box",
            "portfolio-aprendeapi-copy": "Self-contained Pro Lab-style Docker environment for offensive security training: chains perimeter blind SQL injection, internal network pivoting, and SUID privilege escalation with live server-side flag validation.",
            "portfolio-dev101-title": "dev101_bot + cYHBernews",
            "portfolio-dev101-copy": "Automated cybersecurity &amp; AI threat-intelligence pipeline powered by Python and Groq, orchestrated with Cloudflare Workers and GitHub Actions, streaming alerts to Telegram and <strong>cYHBernews</strong>.",
            "portfolio-dev101-demo": "View cYHBernews",
            "portfolio-demo-cta": "Try demo",
            "portfolio-backend-project-cta": "Explore Code",
            "services-label": "06 - Services",
            "services-title": "What I can <em>offer</em>",
            "services-copy": "Detection engineering, AI ecosystem security, and offensive assessments backed by reproducible evidence.",
            "services-1-title": "Detection Engineering &amp; Threat Emulation",
            "services-1-desc": "Sigma, KQL (Sentinel/MDE), and Elastic EQL rule engineering validated with Atomic Red Team emulation, MITRE ATT&amp;CK mapping, and endpoint telemetry.",
            "services-2-title": "AI Security &amp; SecOps Automation",
            "services-2-desc": "Security auditing for autonomous AI agents, MCP servers, and LLM guardrails, plus Python/Go reconnaissance and response pipelines.",
            "services-3-title": "Pentesting &amp; Security Engineering",
            "services-3-desc": "Infrastructure, web and API penetration testing, defensive tooling in Go/PowerShell, and OWASP AppSec hardening.",
            "contact-label": "07 - Contact",
            "contact-signal-title": "Your next idea.<br><em>Secured &amp; built.</em>",
            "contact-signal-copy": "Detection Engineering, offensive security, and applied AI. Tell me what you want to solve.",
            "contact-signal-cta": "Let's talk on WhatsApp",
            "contact-signal-note": "A direct conversation. No forms.",
            "contact-title": "Ready to <em>execute?</em>",
            "contact-copy": "Whether you need detection engineering, threat research, AI agent auditing, or reproducible pentesting, let's talk.",
            "contact-cta-linkedin": "LinkedIn profile",
            "contact-cta-htb": "Hack The Box profile",
            "contact-cta-cv": "English CV (PDF)",
            "contact-status-title": "Technical Availability",
            "contact-status-base": "Base",
            "contact-status-resp": "Response",
            "contact-status-resp-v": "< 24 Hours",
            "contact-status-focus": "Focus",
            "contact-status-focus-v": "Detection · OffSec · AI",
            "contact-status-mod": "Mode",
            "contact-status-mod-v": "Research / Consulting",
            "contact-status-signal": "Systems ready for new integrations and deployments.",
            "github-scroll-hint": "Swipe for months",
            "github-chart-header": "GitHub Contributions",
            "github-chart-range": "Last 12 months",
            "github-chart-total-label": "contributions",
            "github-stars": "stars",
            "github-followers": "Followers",
            "github-public-repos": "Public repositories",
            "github-metrics-note": "Source: GitHub API. A dash indicates unavailable data.",
            "github-rank-colombia": "Colombia Rank",
            "footer-copy": "Built by",
            "footer-colombia": "Detection Engineering &amp; AI Security · Cartagena, Colombia 🇨🇴",
            "footer-courses": "Courses"
        }
    };

    const updateLanguage = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) el.innerHTML = translations[lang][key];
        });
        
        // Sincronizar capas de texto inmediatamente
        const ghost = document.getElementById('scramble-ghost');
        const target = document.getElementById('scramble-target');
        const text = translations[lang]["hero-title-main"];
        if (ghost) ghost.textContent = text;
        if (target) target.textContent = text;

        if (langToggle) langToggle.textContent = lang === 'es' ? 'EN' : 'ES';
        root.setAttribute('lang', lang);
        try { localStorage.setItem('devyhb-lang', lang); } catch { /* Storage is optional. */ }
    };

    langToggle?.addEventListener('click', () => {
        const currentLang = root.lang;
        const nextLang = currentLang === 'es' ? 'en' : 'es';
        updateLanguage(nextLang);
        runHeroScramble();
    });

    let savedLang = 'es';
    try { if (localStorage.getItem('devyhb-lang') === 'en') savedLang = 'en'; } catch { /* Use Spanish when storage is unavailable. */ }
    updateLanguage(savedLang);

    // ─── SCROLL & NAV ────────────────────────────────────────────────────────
    const sections = [...document.querySelectorAll('section[id]')];
    const navLinks = [...document.querySelectorAll('.nlinks a')];
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducedMotion = motionPreference.matches;
    let scrollFrame = null;

    let cachedMaxScroll = 1;
    let cachedSectionOffsets = [];

    const recomputeScrollMetrics = () => {
        cachedMaxScroll = Math.max(1, root.scrollHeight - root.clientHeight);
        cachedSectionOffsets = sections.map(s => ({ id: s.id, top: s.offsetTop - 120 }));
    };

    const updateScrollProgress = () => {
        scrollFrame = null;
        const winScroll = window.scrollY;
        const ratio = Math.min(1, Math.max(0, winScroll / cachedMaxScroll));
        let current = '';
        for (let i = 0; i < cachedSectionOffsets.length; i++) {
            if (winScroll >= cachedSectionOffsets[i].top) current = cachedSectionOffsets[i].id;
        }

        if (scrollProgress) scrollProgress.style.transform = `scaleX(${ratio})`;
        if (mnav) {
            if (winScroll > 50) {
                mnav.classList.add('scrolled');
            } else if (winScroll < 20) {
                mnav.classList.remove('scrolled');
            }
        }
        if (scrollTopBtn) scrollTopBtn.classList.toggle('vis', winScroll > 420);
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + current));
    };

    const scheduleScrollUpdate = () => {
        if (scrollFrame !== null) return;
        scrollFrame = requestAnimationFrame(updateScrollProgress);
    };
    recomputeScrollMetrics();
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', () => { recomputeScrollMetrics(); scheduleScrollUpdate(); }, { passive: true });
    window.addEventListener('load', () => { recomputeScrollMetrics(); scheduleScrollUpdate(); }, { once: true });
    scheduleScrollUpdate();

    // ─── THEME ────────────────────────────────────────────────────────────────
    const syncThemeIcon = () => {
        const dark = root.getAttribute('data-theme') === 'dark';
        if (themeIcon) themeIcon.className = dark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        themeToggle?.setAttribute('aria-pressed', String(dark));
    };

    let themeTransition = null;
    let requestedTheme = root.getAttribute('data-theme');
    themeToggle?.addEventListener('click', () => {
        requestedTheme = requestedTheme === 'dark' ? 'light' : 'dark';
        themeTransition?.skipTransition();
        const applyTheme = () => {
            root.setAttribute('data-theme', requestedTheme);
            try { localStorage.setItem('devyhb-theme', requestedTheme); } catch { /* Keep the toggle usable without storage. */ }
            syncThemeIcon();
        };

        root.classList.add('theme-transitioning');
        if (motionPreference.matches || !document.startViewTransition) {
            applyTheme();
            // Commit the new colors before restoring normal hover transitions.
            void root.offsetWidth;
            root.classList.remove('theme-transitioning');
            return;
        }

        const transition = document.startViewTransition(applyTheme);
        themeTransition = transition;
        // Rapid clicks can skip a snapshot before it is ready.
        transition.ready.catch(() => {});
        transition.finished.catch(() => {}).finally(() => {
            if (themeTransition !== transition) return;
            root.classList.remove('theme-transitioning');
            themeTransition = null;
        });
    });
    syncThemeIcon();

    // ─── MOBILE MENU ─────────────────────────────────────────────────────────
    const toggleMenu = () => {
        const isOpen = mobileMenu?.classList.contains('open');
        mobileMenu?.classList.toggle('open', !isOpen);
        body.classList.toggle('menu-open', !isOpen);
    };
    const closeMenu = () => {
        mobileMenu?.classList.remove('open');
        body.classList.remove('menu-open');
    };

    hamburgerBtn?.addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
    mobileClose?.addEventListener('click', closeMenu);
    document.querySelectorAll('.mobile-link').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', e => {
        if (!mobileMenu?.classList.contains('open')) return;
        if (e.target.closest('.mobile-menu') || e.target.closest('#hamburgerBtn')) return;
        closeMenu();
    });

    // ─── FLUTTER MODAL ───────────────────────────────────────────────────────
    const flutterImages = [
        'assets/img/flutter/1.webp','assets/img/flutter/2.webp',
        'assets/img/flutter/3.webp','assets/img/flutter/4.webp',
        'assets/img/flutter/5.webp','assets/img/flutter/6.webp'
    ];
    let currentFlutterIdx = 0;
    const fmodal = document.getElementById('flutterModal');
    const fmodalImg = document.getElementById('fmodal-img');

    let lastFocusedElement;
    window.openFlutterModal = idx => {
        lastFocusedElement = document.activeElement;
        currentFlutterIdx = idx;
        if (fmodalImg) fmodalImg.src = flutterImages[currentFlutterIdx];
        fmodal?.classList.add('active');
        fmodal?.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const closeBtn = fmodal?.querySelector('.fmodal-close');
            closeBtn?.focus();
        }, 100);
    };
    window.closeFlutterModal = () => {
        fmodal?.classList.remove('active');
        fmodal?.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
        if (lastFocusedElement) lastFocusedElement.focus();
    };
    fmodal?.addEventListener('click', e => { if (e.target === fmodal) closeFlutterModal(); });
    window.changeFlutterImg = dir => {
        currentFlutterIdx = (currentFlutterIdx + dir + flutterImages.length) % flutterImages.length;
        if (fmodalImg) {
            fmodalImg.style.opacity = '0';
            setTimeout(() => {
                fmodalImg.src = flutterImages[currentFlutterIdx];
                fmodalImg.style.opacity = '1';
            }, 150);
        }
    };
    document.addEventListener('keydown', e => {
        if (!fmodal?.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') changeFlutterImg(-1);
        if (e.key === 'ArrowRight') changeFlutterImg(1);
        if (e.key === 'Escape') closeFlutterModal();
    });

    // ─── CERTIFICATE MODAL ───────────────────────────────────────────────────
    const certModal = document.getElementById('certModal');
    const cmodalImg = document.getElementById('cmodal-img');
    const cmodalCaption = document.getElementById('cmodal-caption');
    const miniItems = Array.from(document.querySelectorAll('#certTrack .pitem, .pitem-mini'));
    const certData = miniItems.map(el => {
        const img = el.querySelector('img');
        const src = img?.getAttribute('src') || '';
        return {
            img: src,
            title: img?.getAttribute('alt') || '',
            pdf: el.dataset.pdf || '',
            cred: el.dataset.cred || '',
            recipient: el.dataset.recipient || '',
            profile: el.dataset.profile || ''
        };
    });
    let currentCertIdx = 0;
    let lastCertFocus = null;

    const renderCert = () => {
        const c = certData[currentCertIdx];
        if (!c) return;
        if (cmodalImg) { cmodalImg.src = c.img; cmodalImg.alt = c.title; }
        if (cmodalCaption) {
            cmodalCaption.innerHTML = '';
            const topRow = document.createElement('div');
            topRow.className = 'cmodal-top-row';
            const titleEl = document.createElement('strong');
            titleEl.className = 'cmodal-title';
            titleEl.textContent = c.title;
            topRow.appendChild(titleEl);
            cmodalCaption.appendChild(topRow);

            if (c.recipient || c.cred || c.pdf) {
                const metaRow = document.createElement('div');
                metaRow.className = 'cmodal-meta-row';
                if (c.recipient) {
                    const rSpan = document.createElement('span');
                    rSpan.className = 'cmodal-recipient';
                    rSpan.innerHTML = `<i class="bi bi-person-check-fill"></i> ${c.recipient}`;
                    metaRow.appendChild(rSpan);
                }
                if (c.cred) {
                    const cSpan = document.createElement('span');
                    cSpan.className = 'cmodal-cred-id';
                    cSpan.innerHTML = `<i class="bi bi-shield-check"></i> ID: <strong>${c.cred}</strong>`;
                    metaRow.appendChild(cSpan);
                }
                if (c.profile) {
                    const profLink = document.createElement('a');
                    profLink.href = c.profile;
                    profLink.target = '_blank';
                    profLink.rel = 'noopener';
                    profLink.className = 'cmodal-htb-link';
                    const isEn = document.documentElement.lang === 'en';
                    profLink.innerHTML = `<i class="bi bi-box-arrow-up-right"></i> ${isEn ? 'HTB Profile' : 'Perfil HTB'}`;
                    metaRow.appendChild(profLink);
                }
                if (c.pdf) {
                    const pLink = document.createElement('a');
                    pLink.href = c.pdf;
                    pLink.target = '_blank';
                    pLink.rel = 'noopener';
                    pLink.className = 'cmodal-pdf-link';
                    const isEn = document.documentElement.lang === 'en';
                    pLink.innerHTML = `<i class="bi bi-file-earmark-pdf-fill"></i> ${isEn ? 'View official PDF' : 'Ver documento PDF'}`;
                    metaRow.appendChild(pLink);
                }
                cmodalCaption.appendChild(metaRow);
            }
        }
    };
    window.openCertModal = idx => {
        currentCertIdx = idx;
        lastCertFocus = document.activeElement;
        renderCert();
        certModal?.classList.add('active');
        certModal?.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
    };
    window.closeCertModal = () => {
        certModal?.classList.remove('active');
        certModal?.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
        if (lastCertFocus) lastCertFocus.focus();
    };
    window.changeCertImg = dir => {
        currentCertIdx = (currentCertIdx + dir + certData.length) % certData.length;
        if (cmodalImg) {
            cmodalImg.style.opacity = '0';
            setTimeout(() => { renderCert(); cmodalImg.style.opacity = '1'; }, 150);
        }
    };
    certModal?.addEventListener('click', e => { if (e.target === certModal) closeCertModal(); });
    miniItems.forEach((el, i) => {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Ver certificado: ${certData[i].title}`);
        el.addEventListener('click', () => openCertModal(i));
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCertModal(i); }
        });
    });
    document.addEventListener('keydown', e => {
        if (!certModal?.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') changeCertImg(-1);
        if (e.key === 'ArrowRight') changeCertImg(1);
        if (e.key === 'Escape') closeCertModal();
    });

    // ─── REVEAL OBSERVER ─────────────────────────────────────────────────────
    if (reducedMotion) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    } else {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0, rootMargin: '0px 0px 180px 0px' });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }

    // ─── PORTFOLIO FILTER ─────────────────────────────────────────────────────
    const certGrid = document.getElementById('cgrid');
    const certMini = document.getElementById('cgrid-mini');
    const techGrid = document.getElementById('tgrid');
    document.querySelectorAll('.pfbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pfbtn').forEach(item => item.classList.remove('active'));
            btn.classList.add('active');
            const techMode = btn.dataset.f === 'tech';
            if (certGrid) certGrid.style.display = techMode ? 'none' : 'grid';
            if (certMini) certMini.style.display = techMode ? 'none' : 'block';
            techGrid?.classList.toggle('vis', techMode);
        });
    });

    // ─── STAT COUNTER ANIMATION ───────────────────────────────────────────────
    const animateCounter = (el, target, suffix = '', duration = 700) => {
        const start = performance.now();
        const update = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    };

    const statsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const raw = el.dataset.count;
            if (!raw) return;
            const num = parseFloat(raw);
            const suffix = el.dataset.suffix || '';
            if (reducedMotion) el.textContent = num + suffix;
            else animateCounter(el, num, suffix);
            statsObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => statsObserver.observe(el));

    // ─── MAGNETIC BUTTON EFFECT ───────────────────────────────────────────────
    if (!window.matchMedia('(hover: none)').matches && !reducedMotion) {
        document.querySelectorAll('.btn-solid, .btn-line, .ncta').forEach(btn => {
            btn.addEventListener('mousemove', e => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.18}px, ${y * 0.24}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // ─── HERO TEXT SCRAMBLE ───────────────────────────────────────────────────
    let scrambleRAF = null;
    const runHeroScramble = () => {
        const target = document.getElementById('scramble-target');
        if (!target || reducedMotion) return;

        // Cancelar animación previa si existe
        if (scrambleRAF) cancelAnimationFrame(scrambleRAF);

        const currentLang = root.lang;
        const originalText = translations[currentLang]["hero-title-main"];
        const chars = '▓░▒█!<>-_[]{}=+*^?#';
        const length = originalText.length;
        const duration = 420;
        const queue = [];

        for (let i = 0; i < length; i++) {
            const char = originalText[i];
            const start = Math.random() * duration * 0.2;
            const end = start + duration * (0.45 + Math.random() * 0.35);
            queue.push({ char, start, end });
        }

        // Pre-crear nodos DOM una sola vez: evita parsear innerHTML en cada frame
        const nodes = Array.from({ length }, () => {
            const span = document.createElement('span');
            return span;
        });

        // Limpiar y adjuntar todos los nodos de una vez (un solo reflow)
        target.textContent = '';
        const fragment = document.createDocumentFragment();
        nodes.forEach(n => fragment.appendChild(n));
        target.appendChild(fragment);

        const startedAt = performance.now();
        const tick = (now) => {
            const elapsed = now - startedAt;
            let complete = 0;

            for (let i = 0; i < length; i++) {
                const { char, start, end } = queue[i];
                const node = nodes[i];

                if (elapsed >= end) {
                    complete++;
                    // Carácter final: texto plano sin estilos extra
                    node.textContent = char;
                    node.style.cssText = '';
                } else if (elapsed >= start) {
                    const symbol = chars[Math.floor(Math.random() * chars.length)];
                    const opacity = Math.random() > 0.5 ? 1 : 0.7;
                    node.textContent = symbol;
                    node.style.cssText = `color:#00ff41;text-shadow:0 0 10px #00ff41;opacity:${opacity}`;
                } else {
                    node.textContent = '░▒'[Math.floor(Math.random() * 2)];
                    node.style.cssText = 'color:#00ff41;opacity:0.4';
                }
            }

            if (complete < length) {
                scrambleRAF = requestAnimationFrame(tick);
            } else {
                // Limpiar: dejar sólo texto plano para no retener los spans
                target.textContent = originalText;
                scrambleRAF = null;
            }
        };
        tick(startedAt);
    };

    // ─── INIT ─────────────────────────────────────────────────────────────────
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const initHeroAnimation = () => {
        if (body.dataset.scrambleRun) return;
        body.dataset.scrambleRun = "true";
        
        const heroReveal = document.querySelector('#hero .reveal');
        if (heroReveal) heroReveal.classList.add('in');
        runHeroScramble();
    };

    initHeroAnimation();

    scrollTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Decorative examples only; no audit or scan is executed.
    const auditStream = document.getElementById('audit-stream');
    const auditLogs = [
        '[AUDIT] HTB: Active Directory & Kerberos audit verified (Mythical - HTBCERT-28139E357A)',
        '[AUDIT] HTB: C2 Operations & DevOps exploitation completed (Puppet - HTBCERT-CD631B515C)',
        '[AUDIT] OWASP TOP 10: Review checklist passed',
        '[AUDIT] IAM: Least privilege policy verified',
        '[AUDIT] Network: Port inventory updated',
        '[AUDIT] TLS: Strong cipher configuration active',
        '[AUDIT] Auth: MFA and token rotation workflow',
        '[AUDIT] SAST: Secret detection pipeline clean',
        '[AUDIT] AppSec: CSRF / XSS review checklist passed'
    ];
    let lastAuditScroll = 0;
    let auditVisible = false;

    if (auditStream) {
        const auditObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => { auditVisible = entry.isIntersecting; });
        }, { threshold: 0 });
        auditObserver.observe(auditStream);
    }

    // CSS owns the animation; JavaScript only gates visibility and pointer tilt.
    (function initContactSignal() {
        const panel = document.getElementById('contact-signal');
        if (!panel) return;
        const scene = panel.querySelector('.contact-scene');
        const pointerPreference = window.matchMedia('(pointer: fine) and (hover: hover)');
        let intersecting = false;
        let parallaxEnabled = false;
        let tiltFrame = null;
        let pointerX = 0;
        let pointerY = 0;

        const resetTilt = () => {
            if (tiltFrame !== null) cancelAnimationFrame(tiltFrame);
            tiltFrame = null;
            scene?.style.setProperty('--tilt-x', '0deg');
            scene?.style.setProperty('--tilt-y', '0deg');
        };

        const syncAnimation = () => {
            const active = intersecting && !document.hidden && !motionPreference.matches;
            panel.classList.toggle('is-animating', active);
            parallaxEnabled = active && pointerPreference.matches;
            if (!parallaxEnabled) resetTilt();
        };

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => { intersecting = entry.isIntersecting; });
            syncAnimation();
        }, { threshold: 0 });
        observer.observe(panel);
        document.addEventListener('visibilitychange', syncAnimation);
        motionPreference.addEventListener('change', syncAnimation);
        pointerPreference.addEventListener('change', syncAnimation);

        scene?.addEventListener('pointermove', e => {
            if (!parallaxEnabled || e.pointerType === 'touch') return;
            pointerX = e.clientX;
            pointerY = e.clientY;
            if (tiltFrame !== null) return;
            tiltFrame = requestAnimationFrame(() => {
                tiltFrame = null;
                const rect = scene.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) {
                    resetTilt();
                    return;
                }
                const x = Math.max(-1, Math.min(1, ((pointerX - rect.left) / rect.width - 0.5) * 2));
                const y = Math.max(-1, Math.min(1, ((pointerY - rect.top) / rect.height - 0.5) * 2));
                scene.style.setProperty('--tilt-x', `${-y * 6}deg`);
                scene.style.setProperty('--tilt-y', `${x * 8}deg`);
            });
        }, { passive: true });
        scene?.addEventListener('pointerleave', resetTilt);
        syncAnimation();
    })();

    // ─── CERTIFICATE CAROUSEL ──────────────────────────────────────────
    (function initCertCarousel() {
        const certTrack = document.getElementById('certTrack');
        const prevBtn = document.getElementById('certPrevBtn');
        const nextBtn = document.getElementById('certNextBtn');
        const dotsContainer = document.getElementById('certDots');
        const certContainer = document.getElementById('cgrid');
        const techGrid = document.getElementById('tgrid');
        const filterBtns = document.querySelectorAll('.pfbtn');

        if (!certTrack) return;

        // Filter tabs logic (Certificaciones vs Tecnologías)
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.f;
                if (filter === 'cert') {
                    certContainer.classList.remove('hidden');
                    techGrid.classList.remove('vis');
                } else if (filter === 'tech') {
                    certContainer.classList.add('hidden');
                    techGrid.classList.add('vis');
                }
            });
        });

        // Navigation scroll
        const scrollAmount = 280;
        prevBtn?.addEventListener('click', () => {
            certTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        nextBtn?.addEventListener('click', () => {
            certTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        // Dots setup
        const items = certTrack.querySelectorAll('.pitem');
        if (dotsContainer && items.length > 0) {
            const pageCount = Math.ceil(items.length / 3);
            for (let i = 0; i < pageCount; i++) {
                const dot = document.createElement('div');
                dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    certTrack.scrollTo({ left: i * (scrollAmount * 2), behavior: 'smooth' });
                });
                dotsContainer.appendChild(dot);
            }

            certTrack.addEventListener('scroll', () => {
                const maxScroll = certTrack.scrollWidth - certTrack.clientWidth;
                if (maxScroll <= 0) return;
                const progress = certTrack.scrollLeft / maxScroll;
                const activeIndex = Math.min(pageCount - 1, Math.floor(progress * pageCount));
                const dots = dotsContainer.querySelectorAll('.carousel-dot');
                dots.forEach((d, idx) => d.classList.toggle('active', idx === activeIndex));
            });
        }
    })();

    // ─── PROJECTS PRESENTATION DECK (POWERPOINT STYLE) ─────────────────────
    (function initProjectsDeck() {
        const deck = document.getElementById('projectsDeck');
        if (!deck) return;

        const slides = deck.querySelectorAll('.deck-slide');
        const tabs = deck.querySelectorAll('.deck-tab');
        const prevBtn = document.getElementById('deckPrevBtn');
        const nextBtn = document.getElementById('deckNextBtn');
        const counterCurrent = document.getElementById('deckCurrentIndex');
        const counterTotal = document.getElementById('deckTotalCount');
        const dotsContainer = document.getElementById('deckDots');

        let currentIndex = 0;
        const totalSlides = slides.length;

        if (counterTotal) counterTotal.textContent = totalSlides;

        // Build dots
        if (dotsContainer) {
            slides.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `deck-dot ${idx === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => goToSlide(idx));
                dotsContainer.appendChild(dot);
            });
        }

        function goToSlide(index) {
            if (index < 0 || index >= totalSlides) return;

            slides[currentIndex]?.classList.remove('active');
            tabs[currentIndex]?.classList.remove('active');

            const dots = dotsContainer?.querySelectorAll('.deck-dot');
            if (dots && dots[currentIndex]) dots[currentIndex].classList.remove('active');

            currentIndex = index;

            slides[currentIndex]?.classList.add('active');
            tabs[currentIndex]?.classList.add('active');
            if (dots && dots[currentIndex]) dots[currentIndex].classList.add('active');

            if (counterCurrent) counterCurrent.textContent = currentIndex + 1;

            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex === totalSlides - 1;
        }

        prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1));
        nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1));

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetSlide = parseInt(tab.dataset.slide, 10);
                if (!isNaN(targetSlide)) goToSlide(targetSlide);
            });
        });

        // Initialize state
        goToSlide(0);

        // Keyboard arrow navigation when user is near deck
        document.addEventListener('keydown', (e) => {
            const rect = deck.getBoundingClientRect();
            const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
            if (!inViewport) return;

            if (e.key === 'ArrowLeft') {
                goToSlide(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                goToSlide(currentIndex + 1);
            }
        });
    })();

    // ─── RESUME TABS CONTROLLER ─────────────────────────────────────────────
    (function initResumeTabs() {
        const rtabBtns = document.querySelectorAll('.rtab-btn');
        const rtabPanes = document.querySelectorAll('.rtab-pane');
        if (!rtabBtns.length || !rtabPanes.length) return;

        rtabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.rtab;
                rtabBtns.forEach(b => b.classList.remove('active'));
                rtabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const activePane = document.getElementById(`rtab-${target}`);
                if (activePane) {
                    activePane.classList.add('active');
                }
            });
        });
    })();
});
