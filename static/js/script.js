/**
 * LEKHAN P SIMHA — GALACTIC PORTFOLIO
 * script.js — Three.js + GSAP + Contact API
 */

'use strict';

// ============================================================
// 1. GSAP PLUGIN REGISTRATION
// ============================================================
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ============================================================
// 2. THREE.JS — GALAXY BACKGROUND
// ============================================================
(function initGalaxy() {
  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 1;

  // ---- Stars ----
  const starCount = 4000;
  const starGeom = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const idx = i * 3;
    starPos[idx]     = (Math.random() - 0.5) * 2000;
    starPos[idx + 1] = (Math.random() - 0.5) * 2000;
    starPos[idx + 2] = (Math.random() - 0.5) * 2000;

    // Vary star color: white, cyan-tint, purple-tint
    const r = Math.random();
    if (r < 0.6) {
      starColors[idx] = 0.85 + Math.random() * 0.15;
      starColors[idx+1] = 0.9 + Math.random() * 0.1;
      starColors[idx+2] = 1.0;
    } else if (r < 0.8) {
      starColors[idx] = 0.4;
      starColors[idx+1] = 0.95;
      starColors[idx+2] = 1.0;
    } else {
      starColors[idx] = 0.6;
      starColors[idx+1] = 0.2;
      starColors[idx+2] = 1.0;
    }
  }

  starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: false,
  });

  const stars = new THREE.Points(starGeom, starMat);
  scene.add(stars);

  // ---- Nebula / Fog ----
  const nebulaSpheres = [];
  const nebulaDefs = [
    { x: -200, y: 100, z: -400, r: 180, color: 0x7b2fff, op: 0.06 },
    { x: 300, y: -150, z: -600, r: 200, color: 0x00f5ff, op: 0.04 },
    { x: 0, y: 200, z: -800, r: 250, color: 0xff6b00, op: 0.03 },
  ];
  nebulaDefs.forEach(def => {
    const g = new THREE.SphereGeometry(def.r, 16, 16);
    const m = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: def.op,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(def.x, def.y, def.z);
    scene.add(mesh);
    nebulaSpheres.push(mesh);
  });

  // ---- Floating Planets ----
  const planets = [];

  function makePlanet(opts) {
    const g = new THREE.SphereGeometry(opts.r, 32, 32);
    const m = new THREE.MeshStandardMaterial({
      color: opts.color,
      emissive: opts.emissive,
      emissiveIntensity: opts.emissiveIntensity || 0.3,
      wireframe: opts.wireframe || false,
      transparent: true,
      opacity: opts.opacity || 0.85,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(opts.x, opts.y, opts.z);
    scene.add(mesh);
    planets.push({ mesh, ...opts });
  }

  makePlanet({ r: 80, color: 0x7b2fff, emissive: 0x3d00cc, emissiveIntensity: 0.5, x: 600, y: 200, z: -800, speedX: 0.001, speedY: 0.0015 });
  makePlanet({ r: 45, color: 0x00f5ff, emissive: 0x003344, emissiveIntensity: 0.4, x: -500, y: -150, z: -600, speedX: 0.002, speedY: 0.001 });
  makePlanet({ r: 20, color: 0xff6b00, emissive: 0x441100, emissiveIntensity: 0.6, x: 200, y: 400, z: -500, speedX: 0.003, speedY: 0.002 });
  makePlanet({ r: 100, color: 0x0a2444, emissive: 0x00f5ff, emissiveIntensity: 0.08, x: -700, y: 300, z: -1200, speedX: 0.0005, speedY: 0.0008, wireframe: true, opacity: 0.3 });

  // ---- Ambient & Directional Light ----
  scene.add(new THREE.AmbientLight(0x111133, 1));
  const dirLight = new THREE.DirectionalLight(0x00f5ff, 0.8);
  dirLight.position.set(1, 1, 1);
  scene.add(dirLight);

  // ---- Mouse parallax ----
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- Scroll-based camera movement ----
  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  });

  // ---- Animation Loop ----
  let rafId;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    // Rotate stars slowly
    stars.rotation.y = elapsed * 0.015 + targetX * 0.05;
    stars.rotation.x = elapsed * 0.008 + targetY * 0.03;

    // Animate planets
    planets.forEach(p => {
      p.mesh.rotation.x += p.speedX;
      p.mesh.rotation.y += p.speedY;
      p.mesh.position.y += Math.sin(elapsed * 0.3 + p.x) * 0.08;
    });

    // Camera subtle float
    camera.position.x += (targetX * 3 - camera.position.x) * 0.03;
    camera.position.y += (-targetY * 3 - camera.position.y) * 0.03;
    camera.position.z = 1 - scrollProgress * 80;

    renderer.render(scene, camera);
  }

  animate();

  // ---- Resize ----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
  });
})();

// ============================================================
// 3. CUSTOM CURSOR
// ============================================================
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  let ringX = 0, ringY = 0;
  let cursorX = 0, cursorY = 0;
  let isVisible = false;

  document.addEventListener('mousemove', e => {
    cursorX = e.clientX;
    cursorY = e.clientY;

    if (!isVisible) {
      cursor.style.opacity = '1';
      ring.style.opacity = '1';
      isVisible = true;
    }
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity = '0';
    isVisible = false;
  });

  // Hover detect
  const hoverTargets = 'a, button, .skill-badge, .project-card, .cert-badge, .human-card, input, textarea';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  function animateCursor() {
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    // Ring lags behind
    ringX += (cursorX - ringX) * 0.18;
    ringY += (cursorY - ringY) * 0.18;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';

    requestAnimationFrame(animateCursor);
  }
  animateCursor();
})();

// ============================================================
// 4. NAVIGATION
// ============================================================
(function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');

  // Scroll effect
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Mobile menu
  if (toggle) {
    toggle.addEventListener('click', () => {
      const links = nav.querySelector('.nav-links');
      if (links) {
        const isOpen = links.style.display === 'flex';
        links.style.display = isOpen ? 'none' : 'flex';
        links.style.flexDirection = 'column';
        links.style.position = 'absolute';
        links.style.top = '100%';
        links.style.left = '0';
        links.style.right = '0';
        links.style.background = 'rgba(2,3,9,0.98)';
        links.style.padding = '24px';
        links.style.gap = '20px';
        links.style.borderBottom = '1px solid rgba(0,245,255,0.1)';
      }
    });
  }

  // Active link on scroll
  const sections = document.querySelectorAll('.section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('[data-nav]').forEach(a => a.style.color = '');
        const link = document.querySelector(`[data-nav="${entry.target.id}"]`);
        if (link) link.style.color = 'var(--cyan)';
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => observer.observe(s));
})();

// ============================================================
// 5. TYPED TEXT EFFECT
// ============================================================
(function initTyped() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const words = [
    'Full Stack Developer',
    'API Engineer',
    'AI-Driven Builder',
    'System Designer',
    'Problem Solver',
  ];

  let wordIdx = 0, charIdx = 0, isDeleting = false;

  function type() {
    const word = words[wordIdx];

    if (!isDeleting) {
      el.textContent = word.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === word.length) {
        isDeleting = true;
        setTimeout(type, 2200);
        return;
      }
      setTimeout(type, 70);
    } else {
      el.textContent = word.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % words.length;
      }
      setTimeout(type, 35);
    }
  }
  setTimeout(type, 1200);
})();

// ============================================================
// 6. STAT COUNTER ANIMATION
// ============================================================
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  if (!stats.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const duration = 1500;
        const start = performance.now();

        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
})();

// ============================================================
// 7. SPACESHIP SCROLL MOVEMENT
// ============================================================
(function initSpaceship() {
  const ship = document.getElementById('spaceship');
  if (!ship) return;

  let ticking = false;

  function updateShip() {
    const scrolled = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = scrolled / maxScroll;

    // Move ship vertically from top to bottom as user scrolls
    const topPercent = 8 + progress * 80;
    ship.style.top = topPercent + 'vh';

    // Tilt ship based on scroll direction
    const rotation = Math.sin(scrolled * 0.003) * 12;
    ship.style.transform = `rotate(${rotation}deg)`;

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateShip);
      ticking = true;
    }
  }, { passive: true });
})();

// ============================================================
// 8. GSAP SCROLL ANIMATIONS
// ============================================================
(function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // --- Hero section entrance ---
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTL
    .fromTo('.hero-badge', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, 0.5)
    .fromTo('#name-line-1', { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.8 }, 0.8)
    .fromTo('#name-line-2', { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.8 }, 1.0)
    .fromTo('.hero-role', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 1.3)
    .fromTo('#hero-tagline', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 1.5)
    .fromTo('.hero-location', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.7)
    .fromTo('.hero-ctas', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 1.9)
    .fromTo('.hero-stats', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 2.1)
    .fromTo('.scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 2.5)
    .fromTo('.hero-planet', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.6)' }, 1.0);

  // --- Nav ---
  gsap.fromTo('.nav', { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.3 });

  // --- Section: Skills ---
  gsap.fromTo('.section-header', {
    opacity: 0, y: 50
  }, {
    opacity: 1, y: 0, duration: 0.8,
    scrollTrigger: { trigger: '#skills', start: 'top 80%', toggleActions: 'play none none none' }
  });

  gsap.fromTo('.skill-galaxy', {
    opacity: 0, y: 60, scale: 0.95
  }, {
    opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out',
    scrollTrigger: { trigger: '#skills .skills-universe', start: 'top 80%' }
  });

  // --- Projects section ---
  gsap.fromTo('#projects .section-header', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.7,
    scrollTrigger: { trigger: '#projects', start: 'top 80%' }
  });

  gsap.fromTo('.project-card', {
    opacity: 0, y: 80, rotateX: -5
  }, {
    opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.projects-grid', start: 'top 85%' }
  });

  // --- Experience section ---
  gsap.fromTo('#experience .section-header', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.7,
    scrollTrigger: { trigger: '#experience', start: 'top 80%' }
  });

  gsap.fromTo('.timeline-item', {
    opacity: 0, x: (i, el) => el.dataset.side === 'right' ? 80 : -80
  }, {
    opacity: 1, x: 0, duration: 0.9, stagger: 0.3, ease: 'power3.out',
    scrollTrigger: { trigger: '.timeline', start: 'top 80%' }
  });

  // --- Education ---
  gsap.fromTo('.edu-card', {
    opacity: 0, y: 40
  }, {
    opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out',
    scrollTrigger: { trigger: '.edu-grid', start: 'top 85%' }
  });

  gsap.fromTo('.cert-badge', {
    opacity: 0, scale: 0.8, y: 20
  }, {
    opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '.certs-grid', start: 'top 85%' }
  });

  // --- Human section ---
  gsap.fromTo('.human-card', {
    opacity: 0, y: 60
  }, {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out',
    scrollTrigger: { trigger: '.human-grid', start: 'top 85%' }
  });

  gsap.fromTo('.mission-quote', {
    opacity: 0, scale: 0.95
  }, {
    opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '.mission-block', start: 'top 85%' }
  });

  // --- Contact section ---
  gsap.fromTo('#contact .section-header', { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.7,
    scrollTrigger: { trigger: '#contact', start: 'top 80%' }
  });

  gsap.fromTo('.contact-info', {
    opacity: 0, x: -50
  }, {
    opacity: 1, x: 0, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' }
  });

  gsap.fromTo('.contact-form', {
    opacity: 0, x: 50
  }, {
    opacity: 1, x: 0, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' }
  });

  gsap.fromTo('.final-cta', {
    opacity: 0, y: 60, scale: 0.96
  }, {
    opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.final-cta', start: 'top 85%' }
  });

  // --- Edu fill bars ---
  ScrollTrigger.create({
    trigger: '.edu-grid',
    start: 'top 80%',
    onEnter: () => {
      document.querySelectorAll('.edu-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => { bar.style.width = width; }, 300);
      });
    }
  });

  // --- Timeline line draw ---
  gsap.fromTo('.timeline-line', {
    scaleY: 0, transformOrigin: 'top center'
  }, {
    scaleY: 1, duration: 1.5, ease: 'power2.out',
    scrollTrigger: { trigger: '.timeline', start: 'top 80%' }
  });

  // --- Planet scale on scroll hero ---
  gsap.to('.hero-planet', {
    scale: 1.4,
    opacity: 0,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    }
  });

  // --- Parallax text in hero ---
  gsap.to('.hero-content', {
    y: 100,
    opacity: 0.3,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    }
  });

})();

// ============================================================
// 9. SECTION BACKGROUND GRADIENTS ON SCROLL
// ============================================================
(function initScrollColor() {
  const sectionColors = {
    'hero': 'radial-gradient(ellipse at 70% 50%, rgba(123,47,255,0.12), transparent 60%)',
    'skills': 'radial-gradient(ellipse at 30% 50%, rgba(0,245,255,0.08), transparent 60%)',
    'projects': 'radial-gradient(ellipse at 60% 50%, rgba(0,245,255,0.06), transparent 60%)',
    'experience': 'radial-gradient(ellipse at 40% 50%, rgba(123,47,255,0.1), transparent 60%)',
    'education': 'radial-gradient(ellipse at 70% 50%, rgba(0,255,157,0.05), transparent 60%)',
    'about': 'radial-gradient(ellipse at 30% 50%, rgba(255,107,0,0.06), transparent 60%)',
    'contact': 'radial-gradient(ellipse at 50% 50%, rgba(0,245,255,0.08), transparent 60%)',
  };

  const body = document.body;
  const sections = document.querySelectorAll('.section[id]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (sectionColors[id]) {
          body.style.background = `var(--bg-deep)`;
        }
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

// ============================================================
// 10. CONTACT FORM
// ============================================================
// (function initContactForm() {
//   const form = document.getElementById('contactForm');
//   const submitBtn = document.getElementById('submitBtn');
//   const responseEl = document.getElementById('formResponse');

//   if (!form) return;

//   function showFieldError(fieldId, msg) {
//     const errEl = document.getElementById(fieldId + '-error');
//     if (errEl) {
//       errEl.textContent = msg;
//       errEl.classList.toggle('visible', !!msg);
//     }
//   }

//   function clearErrors() {
//     ['name', 'email', 'message'].forEach(f => showFieldError(f, ''));
//   }

//   function validateForm(data) {
//     let valid = true;
//     clearErrors();

//     if (!data.name || data.name.length < 2) {
//       showFieldError('name', 'Please enter your name (at least 2 characters).');
//       valid = false;
//     }
//     const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!data.email || !emailRe.test(data.email)) {
//       showFieldError('email', 'Please enter a valid email address.');
//       valid = false;
//     }
//     if (!data.message || data.message.length < 10) {
//       showFieldError('message', 'Message must be at least 10 characters.');
//       valid = false;
//     }
//     return valid;
//   }

//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const data = {
//       name: form.querySelector('#name').value.trim(),
//       email: form.querySelector('#email').value.trim(),
//       message: form.querySelector('#message').value.trim(),
//     };

//     if (!validateForm(data)) return;

//     // Loading state
//     submitBtn.classList.add('loading');
//     submitBtn.disabled = true;
//     responseEl.className = 'form-response';
//     responseEl.textContent = '';

//     // Get CSRF token from cookie
//     function getCookie(name) {
//       const val = `; ${document.cookie}`;
//       const parts = val.split(`; ${name}=`);
//       if (parts.length === 2) return parts.pop().split(';').shift();
//       return '';
//     }

//     try {
//       const res = await fetch('/api/contact/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'X-CSRFToken': getCookie('csrftoken'),
//         },
//         body: JSON.stringify(data),
//       });

//       const result = await res.json();

//       if (res.ok && result.success) {
//         responseEl.textContent = '✓ ' + result.message;
//         responseEl.className = 'form-response success';
//         form.reset();

//         // Animate success
//         gsap.fromTo(responseEl, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 });

//         // Reset button state after delay
//         setTimeout(() => {
//           submitBtn.classList.remove('loading');
//           submitBtn.disabled = false;
//         }, 2000);

//       } else if (result.errors) {
//         // Field-level errors
//         Object.entries(result.errors).forEach(([field, msg]) => showFieldError(field, msg));
//         submitBtn.classList.remove('loading');
//         submitBtn.disabled = false;
//       } else {
//         throw new Error(result.error || 'Unknown error');
//       }

//     } catch (err) {
//       responseEl.textContent = '✗ Transmission failed. Please try again or email directly.';
//       responseEl.className = 'form-response error';
//       gsap.fromTo(responseEl, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 });
//       submitBtn.classList.remove('loading');
//       submitBtn.disabled = false;
//       console.error('Contact form error:', err);
//     }
//   });

//   // Live validation
//   ['name', 'email', 'message'].forEach(field => {
//     const input = form.querySelector('#' + field);
//     if (input) {
//       input.addEventListener('blur', () => {
//         const val = input.value.trim();
//         if (field === 'name' && val.length > 0 && val.length < 2)
//           showFieldError('name', 'Name too short.');
//         else if (field === 'email' && val.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
//           showFieldError('email', 'Please enter a valid email.');
//         else if (field === 'message' && val.length > 0 && val.length < 10)
//           showFieldError('message', 'Message is too short.');
//         else
//           showFieldError(field, '');
//       });
//     }
//   });
// })();
  (function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const responseEl = document.getElementById('formResponse');
  if (!form) return;

  function showFieldError(fieldId, msg) {
    const errEl = document.getElementById(fieldId + '-error');
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.toggle('visible', !!msg);
    }
  }

  function clearErrors() {
    ['name','email','message'].forEach(f => showFieldError(f,''));
  }

  function validateForm(data){
    let valid = true;
    clearErrors();
    if(!data.name || data.name.length < 2){ showFieldError('name','Please enter your name (min 2 chars)'); valid=false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!data.email || !emailRe.test(data.email)){ showFieldError('email','Please enter a valid email'); valid=false; }
    if(!data.message || data.message.length < 10){ showFieldError('message','Message must be at least 10 chars'); valid=false; }
    return valid;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = {
      name: form.querySelector('#name').value.trim(),
      email: form.querySelector('#email').value.trim(),
      message: form.querySelector('#message').value.trim()
    };
    if(!validateForm(data)) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    responseEl.className = 'form-response';
    responseEl.textContent = '';

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('message', data.message);

      const res = await fetch('https://formspree.io/f/xgopnbbw', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      const result = await res.json();
      if(res.ok){
        responseEl.textContent = '✓ Your message has been transmitted successfully! I will respond within 24 hours.';
        responseEl.className = 'form-response success';
        form.reset();
        gsap.fromTo(responseEl, {opacity:0,y:-10},{opacity:1,y:0,duration:0.5});
      } else {
        responseEl.textContent = '✗ Transmission failed. Please try again.';
        responseEl.className = 'form-response error';
      }
    } catch(err){
      responseEl.textContent = '✗ Transmission failed. Please try again.';
      responseEl.className = 'form-response error';
      console.error('Contact form error:', err);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
})();

// ============================================================
// 11. SMOOTH SECTION TRANSITIONS (GSAP)
// ============================================================
(function initSmoothNav() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 60 },
        duration: 0.6,
        ease: 'power2.inOut',
      });
    });
  });
})();

// ============================================================
// 12. INTERACTIVE SKILL BADGES
// ============================================================
(function initSkillBadges() {
  document.querySelectorAll('.skill-badge').forEach(badge => {
    badge.addEventListener('mouseenter', () => {
      gsap.to(badge, { scale: 1.08, duration: 0.2, ease: 'back.out(2)' });
    });
    badge.addEventListener('mouseleave', () => {
      gsap.to(badge, { scale: 1, duration: 0.3, ease: 'power2.out' });
    });
    badge.addEventListener('click', () => {
      gsap.to(badge, {
        scale: 0.95, duration: 0.1,
        onComplete: () => gsap.to(badge, { scale: 1.05, duration: 0.15,
          onComplete: () => gsap.to(badge, { scale: 1, duration: 0.2 })
        })
      });
    });
  });
})();

// ============================================================
// 13. FLOATING PARTICLES ON HERO MOUSE MOVE
// ============================================================
(function initHeroParticles() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  let throttle = false;

  hero.addEventListener('mousemove', e => {
    if (throttle) return;
    throttle = true;
    setTimeout(() => { throttle = false; }, 120);

    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      width: ${Math.random() * 6 + 3}px;
      height: ${Math.random() * 6 + 3}px;
      border-radius: 50%;
      background: ${Math.random() > 0.5 ? 'rgba(0,245,255,0.7)' : 'rgba(123,47,255,0.7)'};
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(particle);

    gsap.to(particle, {
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60 - 40,
      opacity: 0,
      scale: 0,
      duration: 0.8 + Math.random() * 0.4,
      ease: 'power2.out',
      onComplete: () => particle.remove(),
    });
  });
})();

// ============================================================
// 14. PERFORMANCE: PAUSE ANIMATIONS WHEN TAB IS HIDDEN
// ============================================================
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gsap.globalTimeline.pause();
  } else {
    gsap.globalTimeline.resume();
  }
});

// Hide scroll hint when at bottom of page
const scrollHint = document.querySelector('.scroll-hint');

function checkScrollHint() {
  if (!scrollHint) return;
  
  const scrollPosition = window.scrollY + window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;
  const isAtBottom = scrollPosition >= pageHeight - 50; // 50px threshold
  
  if (isAtBottom) {
    scrollHint.style.opacity = '0';
    scrollHint.style.visibility = 'hidden';
    scrollHint.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
  } else {
    scrollHint.style.opacity = '0.8';
    scrollHint.style.visibility = 'visible';
  }
}

// Listen for scroll events
window.addEventListener('scroll', checkScrollHint);
// Check on page load
window.addEventListener('load', checkScrollHint);
// ============================================================
// 15. PAGE LOAD COMPLETE
// ============================================================
window.addEventListener('load', () => {
  document.body.style.visibility = 'visible';
  console.log('%c🚀 LEKHAN P SIMHA — Portfolio Initialized', 'color:#00f5ff;font-size:14px;font-weight:bold;font-family:monospace');
  console.log('%cSoftware Engineer | Full Stack Developer | AI-Driven Builder', 'color:#7b2fff;font-family:monospace');
  console.log('%c📍 Bangalore, India | lekhansimhap@gmail.com', 'color:#aaa;font-family:monospace');
});