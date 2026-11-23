# Dev101x — Security Research & Detection Engineering Portfolio

> Portafolio y centro de investigación técnica de **Yared Henriquez (Dev101x / DevCop95)**, Security Researcher especializado en **Detection Engineering (Offense-to-Defense)**, seguridad ofensiva e **IA aplicada**. Construido con HTML5, CSS3 y Vanilla JS sin bundler, optimizado para accesibilidad WCAG AA, rendimiento y seguridad estática.

---

## Características principales

- **Offense-to-Defense Research Hub (`/research/`)** — Casos de estudio de ingeniería de detección (*Windows OpenSSH* y *BigDiskBuster / fsutil.exe*), diagramas arquitectónicos SVG adaptativos al tema, resaltado de sintaxis sin dependencias (KQL, Sigma YAML, Elastic EQL, PowerShell, Bash, Regex), enlaces `#` por sección, matriz de cobertura MITRE ATT&CK y tabla interactiva filtrable de PRs upstream.
- **Feed RSS (`/research/feed.xml`)** — Sindicación RSS 2.0 enlazada vía `<link rel="alternate">` en todas las páginas.
- **Snapshot automático de telemetría** — Workflow diario en GitHub Actions (`scripts/update_telemetry.py` → `assets/data/telemetry.json`) que actualiza métricas de GitHub, calendario de contribuciones y estado de PRs upstream sin depender de rate limits en cliente (con fallback en vivo).
- **Dark / Light mode** — Inicialización síncrona (`assets/js/theme-init.js`) respetando `prefers-color-scheme` y persistencia en `localStorage`, con transiciones de vista suaves.
- **i18n ES / EN completo** — Cambio de idioma dinámico con localización de fechas, calendario de contribuciones, `aria-label` y persistencia en `localStorage`.
- **Project Showcase Deck & Carrusel de Certificaciones** — Deck interactivo accesible con navegación por teclado/tabs y modal lightbox para credenciales HTB (con verificación y enlaces PDF).
- **Seguridad & SEO** — CSP estricta (`script-src 'self'`), hashes SRI en CDN CSS, `/.well-known/security.txt` (RFC 9116), página personalizada `404.html`, tarjetas Open Graph `1200×630` dedicadas, JSON-LD (`Person`, `ProfilePage`, `CollectionPage`, `TechArticle`, `BreadcrumbList`) y `sitemap.xml`.

---

## Secciones

| # | Sección | Contenido |
|---|---------|-----------|
| 01 | About | Perfil profesional, Ranking `#16` GitHub Colombia (`committers.top`), Open Source Colombia y `cYHBernews` |
| 02 | Research & Deep Dives | Pipeline `Offense → Emulation → Detection → Verification`, casos de estudio y acceso al Research Hub + RSS |
| 03 | Skills | Detection Engineering & Threat Emulation, Offensive & Applied AI Security, Systems/Security y Web/Data |
| 04 | Resume | Experiencia laboral (Henkel, EXIA S.A.S, Google Affiliate, Consultoría) y Educación (M.Sc. IA Universitat de Barcelona, UTB) |
| 05 | Portfolio | Deck de 7 proyectos (Upstream Research, `bugbounty-lab101`, `BDB-Guardian`, `pullgoscript`, `dev101x-pentest-lab`, `dev101_bot`, Social Proof), proyectos destacados y certificaciones/tecnologías |
| 06 | Services | Detection Engineering & Threat Emulation, AI Security & SecOps Automation, Pentesting & Security Engineering |
| 07 | Contact | Enlaces directos email, LinkedIn, Hack The Box, CV en inglés (PDF) y WhatsApp |

---

## Estructura

```
Responsive-PortfolioYHB/
├── index.html                                  ← Portafolio principal
├── 404.html                                    ← Página 404 personalizada para GitHub Pages
├── CNAME                                       ← Dominio: dev101x.online
├── robots.txt
├── sitemap.xml
├── .well-known/
│   └── security.txt                            ← Política de contacto de seguridad (RFC 9116)
├── .github/workflows/
│   └── update-telemetry.yml                    ← Action diaria para actualizar telemetry.json
├── scripts/
│   └── update_telemetry.py                     ← Script Python stdlib para métricas y PRs
├── research/
│   ├── index.html                              ← Offense-to-Defense Research Hub
│   ├── research.css                            ← Estilos del Hub, artículos, diagramas y print
│   ├── research.js                             ← Highlighter, copy, anchors, filtros y sync PRs
│   ├── feed.xml                                ← Feed RSS 2.0 del Research Hub
│   ├── windows-openssh-indirect-execution/
│   │   └── index.html                          ← Deep Dive 01 (T1202 · Pure-RE2 · KQL · Sigma)
│   └── bigdiskbuster-fsutil-defense-evasion/
│       └── index.html                          ← Deep Dive 02 (T1685 · BDB-Guardian · Atomic · EQL)
└── assets/
    ├── css/style.css                           ← Estilos principales + contraste WCAG AA
    ├── js/
    │   ├── theme-init.js                       ← Inicialización síncrona de tema (sin inline JS)
    │   └── main.js                             ← Lógica principal (i18n, deck, modal, telemetría)
    ├── data/
    │   └── telemetry.json                      ← Snapshot de métricas GitHub y PRs upstream
    ├── img/                                    ← Assets WebP/PNG optimizados + OG cards (1200×630)
    └── docs/
        ├── CV_yared_Henriquez.en.html          ← Fuente del CV en inglés
        ├── CV_yared_Henriquez.pdf              ← Versión PDF publicada (A4, 2 páginas)
        ├── Mythical.pdf                        ← Certificado HTB Mini Pro Labs: Mythical
        └── Puppet.pdf                          ← Certificado HTB Mini Pro Labs: Puppet
```

---

## CV en inglés

La fuente editable es `assets/docs/CV_yared_Henriquez.en.html`, autocontenida y sin dependencias de red. El enlace de contacto abre `assets/docs/CV_yared_Henriquez.pdf`.

Para regenerar el PDF con Chrome headless respetando las 2 páginas A4:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="assets\docs\CV_yared_Henriquez.pdf" "file:///$(Resolve-Path assets/docs/CV_yared_Henriquez.en.html)"
```

---

## Despliegue

El sitio se sirve directamente desde la rama `main` vía GitHub Pages (`dev101x.online` mediante `CNAME`) sin paso de build obligatorio.
