# DevYHB — Portfolio Personal

> Portafolio personal de **Yared Henriquez**, Ingeniero de Sistemas especializado en arquitectura de software, automatización con IA y soluciones fullstack. Construido con HTML, CSS y Vanilla JS — sin frameworks de build, sin dependencias pesadas.

---

## Vista previa

```
┌──────────────────────────────────────────────────────────┐
│  DevYHB  ·  Sobre mí  ·  Habilidades  ·  Trayectoria  ☀ │  ← nav + dark mode
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Ingeniero de Sistemas      ← scramble animation         │
│  orientado a soluciones                                  │
│                                                          │
│  [ Ver portafolio ]   yared.henriquezb@gmail.com         │
│                                                          │
│  5+ años · Python + IA · <24h respuesta                  │
└──────────────────────────────────────────────────────────┘
```

---

## Características

- **Dark / Light mode** — toggle en el nav, persiste con `localStorage`, respeta `prefers-color-scheme`
- **Scramble animation** — efecto glitch en el título hero al cargar y al cambiar idioma
- **i18n ES / EN** — switch de idioma completo, persiste con `localStorage`
- **Menú hamburguesa** — overlay en móvil con cierre automático al navegar
- **Nav activo** — resalta la sección visible durante el scroll
- **Cursor personalizado** — anillo + punto animado, desactivado en touch y `prefers-reduced-motion`
- **Scroll progress bar** — barra de progreso en la parte superior
- **Lazy loading** — en todas las imágenes y el vídeo
- **Portfolio filtrable** — Certificaciones / Tecnologías con transición suave
- **Modal Flutter** — galería lightbox con navegación por teclado y flechas
- **Audit stream** — terminal SecOps animado en la sección de Ciberseguridad
- **Terminal popup 3D** — Three.js al llegar al final de la página (lazy visual)
- **Stat counter** — animación de contadores al entrar en viewport
- **SEO + Open Graph** — meta description, og:tags, twitter:card y JSON-LD Person
- **Scroll-to-top** — botón flotante que aparece al bajar 420 px

---

## Secciones

| # | Sección | Contenido |
|---|---------|-----------|
| 01 | About | Foto, descripción profesional, meta datos de contacto |
| 02 | Skills | Stack técnico por grupos: Backend, Frontend/Mobile, Cybersecurity, Cloud |
| 03 | Resume | Experiencia laboral y educación en timeline |
| 04 | Portfolio | Certificaciones, tecnologías, GitHub/Trailhead, Flutter, proyectos destacados |
| 05 | Services | Tarjetas de servicios: Transformación Digital, Web/Bots, Integraciones |
| 06 | Contact | Links directos email/WhatsApp/CV + panel de disponibilidad |

---

## Estructura

```
Responsive-PortfolioYHB/
├── index.html                  ← estructura HTML principal
├── CNAME                       ← dominio: devyared.dpdns.org
├── assets/
│   ├── css/
│   │   └── style.css           ← todos los estilos + variables de tema
│   ├── js/
│   │   └── main.js             ← lógica completa (cursor, scroll, i18n, Three.js, etc.)
│   ├── img/
│   │   ├── profile-img.{jpg,webp}
│   │   ├── flutter/{1-6}.{jpeg,webp}
│   │   ├── portfolio/portfolio-{1-12}.{jpg,png,webp}
│   │   └── ...
│   └── docs/
│       └── CV_yared_Henriquez.pdf
└── README.md
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Markup | HTML5 semántico |
| Estilos | CSS3 con custom properties (`:root`), sin preprocesador |
| Lógica | Vanilla JS (ES6+), sin bundler |
| 3D | Three.js r160 (CDN) |
| Íconos | Bootstrap Icons 1.11 + Devicon |
| Fuentes | Bricolage Grotesque + DM Mono (Google Fonts) |
| Hosting | GitHub Pages + dominio personalizado |

---

## Despliegue

El sitio se sirve directamente desde la rama `main` via GitHub Pages. El dominio `devyared.dpdns.org` apunta a GitHub Pages mediante el archivo `CNAME`.

No requiere build step ni servidor — abrir `index.html` en el navegador es suficiente para desarrollo local.
