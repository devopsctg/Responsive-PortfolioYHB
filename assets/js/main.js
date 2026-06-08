document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    const root = document.documentElement;
    const body = document.body;
    const loader = document.getElementById('loader');
    const scrollProgress = document.getElementById('scroll-progress');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('i');
    const mnav = document.getElementById('mnav');
    const scrollTopBtn = document.getElementById('scrollTop');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileClose = document.getElementById('mobileClose');
    const langToggle = document.getElementById('langToggle');

    // ─── TRANSLATIONS ────────────────────────────────────────────────────────
    const translations = {
        es: {
            "nav-about": "Sobre mi",
            "nav-skills": "Habilidades",
            "nav-resume": "Trayectoria",
            "nav-portfolio": "Portafolio",
            "nav-services": "Servicios",
            "nav-contact": "Contacto",
            "nav-cta": "Hablemos",
            "hero-tag": "Disponible para proyectos freelance",
            "hero-title-main": "Ingeniero de Sistemas",
            "hero-title-sub": "orientado a soluciones",
            "hero-copy": "Ingeniero en Sistemas especializado en <strong>arquitectura de software, Laravel, automatización de procesos, bots inteligentes (Telegram/WhatsApp) y flujos complejos</strong>. Desarrollo de soluciones con foco en ejecución real e impacto de negocio.",
            "hero-btn-portfolio": "Ver portafolio",
            "hero-stat-exp": "años de experiencia",
            "hero-stat-tech": "automatización e integraciones",
            "hero-stat-time": "tiempo de respuesta",
            "about-label": "01 - Sobre mi",
            "about-title": "Tecnología con foco en <em>impacto real</em>",
            "about-copy": "He liderado la implementación de soluciones tecnológicas en entornos reales, incluyendo la <strong>dirección de infraestructura digital</strong> en EXIA S.A.S dentro del sector de energía solar, donde integré sensores, monitoreo en tiempo real y automatización de reportes operativos. Mi experiencia abarca desde desarrollo backend hasta integraciones empresariales y análisis de datos.",
            "about-meta-email": "Email",
            "about-meta-avail": "Disponibilidad",
            "about-meta-avail-v": "Disponible",
            "about-meta-city": "Ciudad",
            "about-meta-city-v": "Cartagena, Colombia",
            "about-meta-edu": "Formación",
            "about-meta-edu-v": "Ingeniería en Sistemas + Master IA",
            "skills-label": "02 - Habilidades",
            "skills-title": "Stack técnico <em>y herramientas</em>",
            "skills-copy": "Mi conjunto de herramientas se centra en la eficiencia, escalabilidad y automatización inteligente para resolver problemas operativos reales.",
            "skills-group-1": "Core & Backend",
            "skills-group-2": "Frontend & Mobile",
            "skills-group-3": "Cybersecurity & SecOps",
            "skills-group-4": "Cloud & Tools",
            "skills-bots": "Bots",
            "skills-workflows": "Flujos Complejos",
            "resume-label": "03 - Trayectoria",
            "resume-exp-title": "Experiencia Laboral",
            "resume-exp-1-title": "<span class='text-bold'>Dirección de Infraestructura Digital</span>",
            "resume-exp-1-org": "EXIA S.A.S - Energía Solar",
            "resume-exp-1-desc": "Liderazgo técnico en la integración de sensores IoT, monitoreo en tiempo real y automatización de procesos operativos.",
            "resume-exp-2-title": "<span class='text-bold'>Consultoría en TI & Automatización</span>",
            "resume-exp-2-org": "Independiente / Freelance",
            "resume-exp-2-desc": "Desarrollo de soluciones personalizadas en Python y arquitecturas web para clientes en diversos sectores.",
            "resume-edu-title": "Educación",
            "resume-edu-1-title": "Máster en Inteligencia Artificial",
            "resume-edu-1-org": "Universidad de Barcelona",
            "resume-edu-1-desc": "Especialización en modelos generativos, agentes autónomos y visión por computadora.",
            "resume-edu-2-title": "Ingeniería en Sistemas",
            "resume-edu-2-org": "Universidad Tecnológica de Bolívar",
            "resume-edu-2-desc": "Formación integral en algoritmos, arquitectura de software y gestión de proyectos tecnológicos.",
            "portfolio-label": "04 - Portafolio",
            "portfolio-title": "Proyectos <em>y Certificaciones</em>",
            "portfolio-filter-cert": "Certificaciones",
            "portfolio-filter-tech": "Tecnologías",
            "portfolio-proof-title": "Engineering Presence · Social Proof",
            "portfolio-github-status": "GitHub Status",
            "portfolio-github-cta": "Acceder al código",
            "portfolio-trailhead-cta": "Ver perfil oficial",
            "portfolio-mobile-title": "Mobile & Multiplatform",
            "portfolio-ai-title": "AI Operations & Multi-Agent Systems",
            "portfolio-ai-project-tag": "AI Operations Hub · Featured Project",
            "portfolio-ai-project-title": "DevTeams: Multi-Agent 3D Simulation",
            "portfolio-ai-project-status": "System Live",
            "portfolio-ai-feature-1-title": "Planner A*",
            "portfolio-ai-feature-1-desc": "Pathfinding en Web Workers.",
            "portfolio-ai-feature-2-title": "Privacidad",
            "portfolio-ai-feature-2-desc": "File System Access API.",
            "portfolio-ai-project-copy": "Orquestación de 8 agentes especializados en un entorno 3D inmersivo con <strong>Three.js</strong> y <strong>Groq Llama 3.3</strong>.",
            "portfolio-ai-project-cta": "GitHub",
            "portfolio-backend-title": "Desarrollo Backend & Automatizaciones",
            "portfolio-aprendeapi-title": "Pokedex API Lab: Consumo de APIs",
            "portfolio-aprendeapi-copy": "Laboratorio interactivo para el aprendizaje práctico del consumo de APIs REST, incluyendo autocompletado, latencia de red y visualización de respuestas JSON.",
            "portfolio-dev101-title": "dev101_bot: Bot de Telegram",
            "portfolio-dev101-copy": "Bot de Telegram para envío automático 24/7 de noticias de ciberseguridad e IA, orquestado con Cloudflare Workers, GitHub Actions y resúmenes de Groq LLaMA 3.3.",
            "portfolio-backend-project-cta": "Explorar Código",
            "portfolio-epe-cta": "Ver Cliente LBH",
            "portfolio-epe-main-title": "Fullstack & Enterprise Solutions",
            "portfolio-epe-tag": "Fullstack · Featured Project",
            "portfolio-epe-title": "Motor de Cálculos EPE: Automatización Portuaria",
            "portfolio-epe-copy": "Desarrollo fullstack del motor central de <strong>Panorama EVO</strong> para la automatización de cálculos, tarifas y gastos portuarios complejos.",
            "portfolio-epe-backend-title": "Backend (Laravel)",
            "portfolio-epe-backend-1": "Reglas con Symfony Expression.",
            "portfolio-epe-backend-2": "Arquitectura Items & Rangos.",
            "portfolio-epe-backend-3": "Lexer de Sintaxis Propio.",
            "portfolio-epe-frontend-title": "Frontend (Vue 3)",
            "portfolio-epe-frontend-1": "Editor Fórmulas Real-time.",
            "portfolio-epe-frontend-2": "Estados Reactivos con Pinia.",
            "portfolio-epe-frontend-3": "Previsualización Dinámica PDA.",
            "services-label": "05 - Services",
            "services-title": "Lo que puedo <em>aportar</em>",
            "services-copy": "Soluciones pensadas para operar mejor, lanzar más rápido y sostener crecimiento con base técnica sólida.",
            "services-1-title": "Transformación Digital",
            "services-1-desc": "Herramientas y flujos que mejoran productividad, control operativo y calidad de entrega.",
            "services-2-title": "Desarrollo Laravel, Web & Bots",
            "services-2-desc": "Creación de aplicaciones web robustas, bots inteligentes (Telegram/WhatsApp) y automatización de flujos de trabajo complejos.",
            "services-3-title": "Integraciones & Arq.",
            "services-3-desc": "Conexión entre sistemas y decisiones de arquitectura pensadas para escalar.",
            "contact-label": "06 - Contact",
            "contact-title": "¿Listo para <em>ejecutar?</em>",
            "contact-copy": "Si tienes un problema complejo de software o un proceso que necesita IA y automatización, hablemos. Mi enfoque es la entrega de soluciones técnicas reales.",
            "contact-cta-whatsapp": "WhatsApp Directo",
            "contact-cta-cv": "Descargar Full Resume",
            "contact-status-title": "Disponibilidad Técnica",
            "contact-status-base": "Base",
            "contact-status-resp": "Respuesta",
            "contact-status-resp-v": "< 24 Horas",
            "contact-status-focus": "Enfoque",
            "contact-status-focus-v": "Software & IA",
            "contact-status-mod": "Modalidad",
            "contact-status-mod-v": "Freelance / Consultoría",
            "contact-status-signal": "Sistemas listos para nuevas integraciones y despliegues.",
            "github-scroll-hint": "Desliza para ver meses",
            "github-chart-header": "Contribuciones en GitHub",
            "github-chart-range": "Enero - Diciembre 2026",
            "footer-copy": "Construido por"
        },
        en: {
            "nav-about": "About me",
            "nav-skills": "Skills",
            "nav-resume": "Resume",
            "nav-portfolio": "Portfolio",
            "nav-services": "Services",
            "nav-contact": "Contact",
            "nav-cta": "Let's Talk",
            "hero-tag": "Available for freelance projects",
            "hero-title-main": "Systems Engineer",
            "hero-title-sub": "solution-oriented",
            "hero-copy": "Systems Engineer specializing in <strong>software architecture, Laravel, process automation, intelligent bots (Telegram & WhatsApp), and complex workflows</strong>. I build high-impact solutions with a focus on real execution.",
            "hero-btn-portfolio": "View Portfolio",
            "hero-stat-exp": "years of experience",
            "hero-stat-tech": "automation & integrations",
            "hero-stat-time": "response time",
            "about-label": "01 - About me",
            "about-title": "Technology with focus on <em>real impact</em>",
            "about-copy": "I have led the implementation of technological solutions in real environments, including the <strong>digital infrastructure management</strong> at EXIA S.A.S in the solar energy sector, where I integrated IoT sensors, real-time monitoring, and operational report automation. My experience ranges from backend development to enterprise integrations and data analysis.",
            "about-meta-email": "Email",
            "about-meta-avail": "Availability",
            "about-meta-avail-v": "Available",
            "about-meta-city": "City",
            "about-meta-city-v": "Cartagena, Colombia",
            "about-meta-edu": "Education",
            "about-meta-edu-v": "Systems Engineering + Master AI",
            "skills-label": "02 - Skills",
            "skills-title": "Tech Stack <em>& tools</em>",
            "skills-copy": "My toolkit focuses on efficiency, scalability, and intelligent automation to solve real operational problems.",
            "skills-group-1": "Core & Backend",
            "skills-group-2": "Frontend & Mobile",
            "skills-group-3": "Cybersecurity & SecOps",
            "skills-group-4": "Cloud & Tools",
            "skills-bots": "Bots",
            "skills-workflows": "Complex Workflows",
            "resume-label": "03 - Resume",
            "resume-exp-title": "Work Experience",
            "resume-exp-1-title": "<span class='text-bold'>Digital Infrastructure Management</span>",
            "resume-exp-1-org": "EXIA S.A.S - Solar Energy",
            "resume-exp-1-desc": "Technical leadership in IoT sensor integration, real-time monitoring, and operational process automation.",
            "resume-exp-2-title": "<span class='text-bold'>IT Consulting & Automation</span>",
            "resume-exp-2-org": "Independent / Freelance",
            "resume-exp-2-desc": "Development of custom solutions in Python and web architectures for clients in various sectors.",
            "resume-edu-title": "Education",
            "resume-edu-1-title": "Master in Artificial Intelligence",
            "resume-edu-1-org": "University of Barcelona",
            "resume-edu-1-desc": "Specialization in generative models, autonomous agents, and computer vision.",
            "resume-edu-2-title": "Systems Engineering",
            "resume-edu-2-org": "Technological University of Bolivar",
            "resume-edu-2-desc": "Comprehensive training in algorithms, software architecture, and technology project management.",
            "portfolio-label": "04 - Portfolio",
            "portfolio-title": "Projects <em>and Certifications</em>",
            "portfolio-filter-cert": "Certifications",
            "portfolio-filter-tech": "Technologies",
            "portfolio-proof-title": "Engineering Presence · Social Proof",
            "portfolio-github-status": "GitHub Status",
            "portfolio-github-cta": "Access Code",
            "portfolio-trailhead-cta": "View Official Profile",
            "portfolio-mobile-title": "Mobile & Multiplatform",
            "portfolio-ai-title": "AI Operations & Multi-Agent Systems",
            "portfolio-ai-project-tag": "AI Operations Hub · Featured Project",
            "portfolio-ai-project-title": "DevTeams: Multi-Agent 3D Simulation",
            "portfolio-ai-project-status": "System Live",
            "portfolio-ai-feature-1-title": "Planner A*",
            "portfolio-ai-feature-1-desc": "Pathfinding in Web Workers.",
            "portfolio-ai-feature-2-title": "Privacy",
            "portfolio-ai-feature-2-desc": "File System Access API.",
            "portfolio-ai-project-copy": "Orchestration of 8 specialized agents in an immersive 3D environment with <strong>Three.js</strong> and <strong>Groq Llama 3.3</strong>.",
            "portfolio-ai-project-cta": "Architecture on GitHub",
            "portfolio-backend-title": "Backend & Automations",
            "portfolio-aprendeapi-title": "Pokedex API Lab: API Consumption",
            "portfolio-aprendeapi-copy": "Interactive lab designed for hands-on learning of REST API integration, featuring search suggestions, response latency, and JSON view.",
            "portfolio-dev101-title": "dev101_bot: Telegram Bot",
            "portfolio-dev101-copy": "Automated Telegram bot sending 24/7 cybersecurity & AI news, orchestrated via Cloudflare Workers, GitHub Actions, and Groq LLaMA 3.3 summaries.",
            "portfolio-backend-project-cta": "Explore Code",
            "portfolio-epe-cta": "Ver Cliente LBH",
            "portfolio-epe-main-title": "Fullstack & Enterprise Solutions",
            "portfolio-epe-tag": "Fullstack · Featured Project",
            "portfolio-epe-title": "EPE Calculation Engine: Port Automation",
            "portfolio-epe-copy": "Fullstack development of the core module for <strong>Panorama EVO</strong>, automating complex port tariff and expense calculations.",
            "portfolio-epe-backend-title": "Backend (Laravel 10)",
            "portfolio-epe-backend-1": "Rule Engine using Symfony Expression Language.",
            "portfolio-epe-backend-2": "Architecture for Items, Formulas, and Ranges.",
            "portfolio-epe-backend-3": "Custom Lexer for formula syntax validation.",
            "portfolio-epe-frontend-title": "Frontend (Vue 3 + Ant Design)",
            "portfolio-epe-frontend-1": "Interactive formula editor with real-time validation.",
            "portfolio-epe-frontend-2": "Reactive state management with Pinia.",
            "portfolio-epe-frontend-3": "Result visualization and PDA preview.",
            "services-label": "05 - Services",
            "services-title": "What I can <em>offer</em>",
            "services-copy": "Solutions designed to operate better, launch faster, and sustain growth with a solid technical foundation.",
            "services-1-title": "Digital Transformation",
            "services-1-desc": "Tools and workflows that improve productivity, operational control, and delivery quality.",
            "services-2-title": "Laravel, Web & Bot Development",
            "services-2-desc": "Building robust web applications, intelligent bots (Telegram/WhatsApp), and complex workflow automations.",
            "services-3-title": "Integrations & Architecture",
            "services-3-desc": "Connection between systems and architectural decisions designed to scale.",
            "contact-label": "06 - Contact",
            "contact-title": "Ready to <em>execute?</em>",
            "contact-copy": "If you have a complex software problem or a process that needs AI and automation, let's talk. My focus is the delivery of real technical solutions.",
            "contact-cta-whatsapp": "Direct WhatsApp",
            "contact-cta-cv": "Download Full Resume",
            "contact-status-title": "Technical Availability",
            "contact-status-base": "Base",
            "contact-status-resp": "Response",
            "contact-status-resp-v": "< 24 Hours",
            "contact-status-focus": "Focus",
            "contact-status-focus-v": "Software & IA",
            "contact-status-mod": "Modalidad",
            "contact-status-mod-v": "Freelance / Consulting",
            "contact-status-signal": "Systems ready for new integrations and deployments.",
            "github-scroll-hint": "Swipe for months",
            "github-chart-header": "GitHub Contributions",
            "github-chart-range": "January - December 2026",
            "footer-copy": "Built by"
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
        localStorage.setItem('devyhb-lang', lang);
    };

    langToggle?.addEventListener('click', () => {
        const currentLang = localStorage.getItem('devyhb-lang') || 'es';
        const nextLang = currentLang === 'es' ? 'en' : 'es';
        updateLanguage(nextLang);
        runHeroScramble();
    });

    const savedLang = localStorage.getItem('devyhb-lang') || 'es';
    updateLanguage(savedLang);

    // ─── CUSTOM CURSOR ────────────────────────────────────────────────────────
    const cursorRing = document.getElementById('cursor-ring');
    const cursorDot = document.getElementById('cursor-dot');
    let ringX = 0, ringY = 0, dotX = 0, dotY = 0;
    let rafCursor;

    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    if (!isTouchDevice && cursorRing && cursorDot) {
        document.addEventListener('mousemove', e => {
            dotX = e.clientX;
            dotY = e.clientY;
            if (!body.classList.contains('cursor-ready')) body.classList.add('cursor-ready');
        });

        const animateCursor = () => {
            ringX += (dotX - ringX) * 0.14;
            ringY += (dotY - ringY) * 0.14;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
            cursorDot.style.left = dotX + 'px';
            cursorDot.style.top = dotY + 'px';
            rafCursor = requestAnimationFrame(animateCursor);
        };
        animateCursor();

        document.addEventListener('mousedown', () => body.classList.add('cursor-click'));
        document.addEventListener('mouseup', () => body.classList.remove('cursor-click'));
        document.addEventListener('mouseleave', () => body.classList.remove('cursor-ready'));
        document.addEventListener('mouseenter', () => body.classList.add('cursor-ready'));

        const hoverTargets = 'a, button, .skitag, .pitem, .proof-card, .svc-card, .clink, .pfbtn, .tcell, .flutter-item, .fmodal-close, .fmodal-btn';
        document.querySelectorAll(hoverTargets).forEach(el => {
            el.addEventListener('mouseenter', () => body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => body.classList.remove('cursor-hover'));
        });
    }

    // ─── SCROLL & NAV ────────────────────────────────────────────────────────
    const sections = [...document.querySelectorAll('section[id]')];
    const navLinks = [...document.querySelectorAll('.nlinks a')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateScrollProgress = () => {
        const winScroll = body.scrollTop || root.scrollTop;
        const height = root.scrollHeight - root.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (scrollProgress) scrollProgress.style.width = scrolled + '%';
        if (mnav) mnav.classList.toggle('scrolled', window.scrollY > 40);
        if (scrollTopBtn) scrollTopBtn.classList.toggle('vis', window.scrollY > 420);
        let current = '';
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 120) current = section.id;
        });
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + current));
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // ─── THEME ────────────────────────────────────────────────────────────────
    const syncThemeIcon = () => {
        if (!themeIcon) return;
        themeIcon.className = root.getAttribute('data-theme') === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    };

    themeToggle?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.classList.add('theme-transitioning');
        root.setAttribute('data-theme', next);
        localStorage.setItem('devyhb-theme', next);
        syncThemeIcon();
        setTimeout(() => {
            root.classList.remove('theme-transitioning');
        }, 800);
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
        'assets/img/flutter/1.jpeg','assets/img/flutter/2.jpeg',
        'assets/img/flutter/3.jpeg','assets/img/flutter/4.jpeg',
        'assets/img/flutter/5.jpeg','assets/img/flutter/6.jpeg'
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
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }

    // ─── PORTFOLIO FILTER ─────────────────────────────────────────────────────
    const certGrid = document.getElementById('cgrid');
    const techGrid = document.getElementById('tgrid');
    document.querySelectorAll('.pfbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pfbtn').forEach(item => item.classList.remove('active'));
            btn.classList.add('active');
            const techMode = btn.dataset.f === 'tech';
            if (certGrid) certGrid.style.display = techMode ? 'none' : 'grid';
            techGrid?.classList.toggle('vis', techMode);
        });
    });

    // ─── STAT COUNTER ANIMATION ───────────────────────────────────────────────
    const animateCounter = (el, target, suffix = '', duration = 1600) => {
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
            animateCounter(el, num, suffix);
            statsObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => statsObserver.observe(el));

    // ─── MAGNETIC BUTTON EFFECT ───────────────────────────────────────────────
    if (!isTouchDevice && !reducedMotion) {
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

        const currentLang = localStorage.getItem('devyhb-lang') || 'es';
        const originalText = translations[currentLang]["hero-title-main"];
        const chars = '▓░▒█!<>-_[]{}=+*^?#';
        const length = originalText.length;
        const queue = [];

        for (let i = 0; i < length; i++) {
            const char = originalText[i];
            const start = Math.floor(Math.random() * 12);
            const end = start + Math.floor(Math.random() * 25) + 25;
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

        let frame = 0;
        const tick = () => {
            let complete = 0;

            for (let i = 0; i < length; i++) {
                const { char, start, end } = queue[i];
                const node = nodes[i];

                if (frame >= end) {
                    complete++;
                    // Carácter final: texto plano sin estilos extra
                    node.textContent = char;
                    node.style.cssText = '';
                } else if (frame >= start) {
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
                frame++;
                scrambleRAF = requestAnimationFrame(tick);
            } else {
                // Limpiar: dejar sólo texto plano para no retener los spans
                target.textContent = originalText;
            }
        };
        tick();
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

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader?.classList.add('hide');
            body.classList.remove('is-loading');
            setTimeout(initHeroAnimation, 400);
        }, reducedMotion ? 50 : 700);
    });

    setTimeout(() => {
        if (!body.dataset.scrambleRun) initHeroAnimation();
    }, 3000);

    scrollTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ─── AUDIT STREAM LOGIC ───────────────────────────────────────────────────
    const auditStream = document.getElementById('audit-stream');
    const auditLogs = [
        '[!] Exploit: RemoteThreadInjection -> OK',
        '[!] Target: Win10_x64_Build_19044',
        '[!] Status: Beacon Active (C2)',
        '[+] Bypass: AMSI_PATCHED',
        '[+] Persistence: LNK_HIJACK',
        '[!] SCAN: CVE-2024-XXXX FOUND',
        '[+] AUTH: Kerberoasting SUCCESS'
    ];
    let lastAuditScroll = 0;

    window.addEventListener('scroll', () => {
        const skillsSec = document.getElementById('skills');
        if (!skillsSec || !auditStream) return;
        
        const rect = skillsSec.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const currentScroll = window.scrollY;
            if (Math.abs(currentScroll - lastAuditScroll) > 50) {
                const line = document.createElement('div');
                line.className = 'audit-line';
                const log = auditLogs[Math.floor(Math.random() * auditLogs.length)];
                line.innerText = log;
                auditStream.appendChild(line);
                if (auditStream.children.length > 4) auditStream.removeChild(auditStream.firstChild);
                lastAuditScroll = currentScroll;
            }
        }

        const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (scrollPercent > 0.98) {
            triggerTerminalPopup();
        }
    });

    // ─── TERMINAL POPUP & THREE.JS ────────────────────────────────────────────
    const tPopup = document.getElementById('terminal-popup');
    const tClose = document.getElementById('terminalPopupClose');
    let popupShown = false;
    let scene, camera, renderer;

    const triggerTerminalPopup = () => {
        if (popupShown) return;
        popupShown = true;
        tPopup?.classList.add('active');
        initCommandCircle();
    };

    tClose?.addEventListener('click', () => {
        tPopup?.classList.remove('active');
    });

    function initCommandCircle() {
        const container = document.getElementById('command-circle-container');
        if (!container) return;

        const getAccentColor = () => {
            const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            return new THREE.Color(color);
        };

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        const currentAccent = getAccentColor();
        const accentHex = `#${currentAccent.getHexString()}`;
        const commands = ['NMAP', 'GO_BUILD', 'OWASP', 'SEC_OPS', 'PYTHON', 'AI_AGENT', 'AUDIT_OK', 'HARDEN', 'DOCKER', 'DJANGO'];
        const nodes = [];
        const radius = 3.5;

        commands.forEach((cmd, i) => {
            const phi = Math.acos(-1 + (2 * i) / commands.length);
            const theta = Math.sqrt(commands.length * Math.PI) * phi;
            const pos = new THREE.Vector3(radius * Math.cos(theta) * Math.sin(phi), radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(phi));

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256; canvas.height = 64;
            ctx.font = 'Bold 36px DM Mono';
            ctx.fillStyle = accentHex;
            ctx.textAlign = 'center';
            ctx.fillText(cmd, 128, 45);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(pos);
            sprite.scale.set(1.8, 0.45, 1);
            group.add(sprite);
            nodes.push(pos);
        });

        const lineMaterial = new THREE.LineBasicMaterial({ color: currentAccent, transparent: true, opacity: 0.2 });
        const geometry = new THREE.BufferGeometry();
        const linePositions = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].distanceTo(nodes[j]) < 4.5) {
                    linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
                }
            }
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        group.add(new THREE.LineSegments(geometry, lineMaterial));

        const partGeo = new THREE.BufferGeometry();
        const partPos = [];
        for(let i=0; i<150; i++) partPos.push((Math.random()-0.5)*12, (Math.random()-0.5)*12, (Math.random()-0.5)*12);
        partGeo.setAttribute('position', new THREE.Float32BufferAttribute(partPos, 3));
        group.add(new THREE.Points(partGeo, new THREE.PointsMaterial({ color: currentAccent, size: 0.04, transparent: true, opacity: 0.4 })));

        camera.position.z = 8;
        group.scale.set(0, 0, 0); // Empezar desde escala cero

        function animate() {
            if (!tPopup?.classList.contains('active')) {
                group.scale.set(0, 0, 0); // Resetear escala al cerrar
                return;
            }
            requestAnimationFrame(animate);

            // Interpolación suave (lerp) hacia la escala 1
            group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);

            group.rotation.y += 0.002; group.rotation.x += 0.001;
            lineMaterial.opacity = 0.1 + Math.sin(Date.now() * 0.002) * 0.1;
            renderer.render(scene, camera);
        }
        animate();
    }
});
