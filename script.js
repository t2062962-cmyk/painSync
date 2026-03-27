/**
 * PainSync — script.js
 * ES6 Module · Three.js + GLTFLoader + Particle Background
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// ── GLTFLoader (CDN compatible with r128) ──────────────────────────────────
// We inline a minimal GLTFLoader import path for r128
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

let GLTFLoader;
try {
  const mod = await import(GLTF_LOADER_URL);
  GLTFLoader = mod.GLTFLoader;
} catch (e) {
  console.warn('GLTFLoader not available:', e);
}


// ════════════════════════════════════════════════════════════════════════════
// 1. PENTAGON PARTICLE BACKGROUND
// ════════════════════════════════════════════════════════════════════════════

(function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H, mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Pentagon path helper
  function drawPentagon(ctx, cx, cy, r, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = rotation + (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // Generate particles
  const N = 60;
  const particles = Array.from({ length: N }, () => ({
    x:        Math.random() * window.innerWidth,
    y:        Math.random() * window.innerHeight,
    r:        4 + Math.random() * 14,
    vx:       (Math.random() - 0.5) * 0.3,
    vy:       (Math.random() - 0.5) * 0.3,
    rot:      Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.004,
    baseAlpha:0.04 + Math.random() * 0.08,
    alpha:    0,
  }));

  function animate() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // Move
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rotSpeed;

      // Wrap
      if (p.x < -40) p.x = W + 40;
      if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40;
      if (p.y > H + 40) p.y = -40;

      // Proximity to mouse
      const dx   = p.x - mouse.x;
      const dy   = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const near = Math.max(0, 1 - dist / 160);
      const targetAlpha = p.baseAlpha + near * 0.55;
      p.alpha += (targetAlpha - p.alpha) * 0.1;

      // Draw
      const glowR = near > 0.05 ? p.r * 2.5 : 0;

      if (glowR > 0) {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR + p.r);
        grd.addColorStop(0, `rgba(56,189,248,${near * 0.18})`);
        grd.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR + p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      drawPentagon(ctx, p.x, p.y, p.r, p.rot);
      ctx.strokeStyle = `rgba(56,189,248,${p.alpha})`;
      ctx.lineWidth   = 1;
      ctx.stroke();

      if (near > 0.1) {
        ctx.fillStyle = `rgba(56,189,248,${near * 0.06})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw faint connection lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a  = particles[i];
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          const alpha = (1 - d / 120) * 0.04;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
})();


// ════════════════════════════════════════════════════════════════════════════
// 2. THREE.JS — 3D BODY MODEL
// ════════════════════════════════════════════════════════════════════════════

(function initThree() {
  const container = document.getElementById('three-container');
  const canvas    = document.getElementById('three-canvas');

  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  // Scene
  const scene    = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping    = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Camera
  const camera = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 100);
  camera.position.set(0, 0.5, 3.8);

  // Lighting
  const ambient = new THREE.AmbientLight(0x38bdf8, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0x38bdf8, 3.5, 20);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x0ea5e9, 1.5, 15);
  fillLight.position.set(-2, 1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xbae6fd, 1.2, 12);
  rimLight.position.set(0, -2, -3);
  scene.add(rimLight);

  // Fog for depth
  scene.fog = new THREE.FogExp2(0x030712, 0.08);

  // Fallback geometry while model loads (or if no GLB provided)
  let modelGroup = new THREE.Group();
  scene.add(modelGroup);

  function buildFallback() {
    const mat = new THREE.MeshStandardMaterial({
      color:       0x0a2540,
      emissive:    0x38bdf8,
      emissiveIntensity: 0.25,
      roughness:   0.3,
      metalness:   0.7,
      wireframe:   false,
    });

    // Stylized body stand-in
    const parts = [
      // torso
      { geo: new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.22, 0.55, 6, 12) : new THREE.CylinderGeometry(0.22, 0.19, 0.55, 12), pos: [0, 0, 0] },
      // head
      { geo: new THREE.SphereGeometry(0.17, 12, 12), pos: [0, 0.52, 0] },
      // upper arms
      { geo: new THREE.CylinderGeometry(0.06, 0.055, 0.38, 8), pos: [0.32, 0.1, 0], rot: [0, 0, Math.PI / 5] },
      { geo: new THREE.CylinderGeometry(0.06, 0.055, 0.38, 8), pos: [-0.32, 0.1, 0], rot: [0, 0, -Math.PI / 5] },
      // lower arms
      { geo: new THREE.CylinderGeometry(0.05, 0.045, 0.35, 8), pos: [0.44, -0.17, 0], rot: [0, 0, Math.PI / 3.5] },
      { geo: new THREE.CylinderGeometry(0.05, 0.045, 0.35, 8), pos: [-0.44, -0.17, 0], rot: [0, 0, -Math.PI / 3.5] },
      // upper legs
      { geo: new THREE.CylinderGeometry(0.09, 0.08, 0.44, 8), pos: [0.13, -0.55, 0] },
      { geo: new THREE.CylinderGeometry(0.09, 0.08, 0.44, 8), pos: [-0.13, -0.55, 0] },
      // lower legs
      { geo: new THREE.CylinderGeometry(0.07, 0.055, 0.38, 8), pos: [0.13, -0.95, 0] },
      { geo: new THREE.CylinderGeometry(0.07, 0.055, 0.38, 8), pos: [-0.13, -0.95, 0] },
    ];

    for (const { geo, pos, rot } of parts) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      modelGroup.add(mesh);
    }

    // Wireframe overlay for tech feel
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.08 });
    for (const { geo, pos, rot } of parts) {
      const wire = new THREE.Mesh(geo, wireMat);
      wire.position.set(...pos);
      if (rot) wire.rotation.set(...rot);
      modelGroup.add(wire);
    }
  }

  // Try loading GLB
  if (GLTFLoader) {
    const loader = new GLTFLoader();
    loader.load(
      'humanbody.glb',
      (gltf) => {
        scene.remove(modelGroup);
        modelGroup = gltf.scene;

        // Apply cyan material tint to all meshes
        modelGroup.traverse(child => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color:    0x0d2137,
              emissive: 0x38bdf8,
              emissiveIntensity: 0.18,
              roughness: 0.4,
              metalness: 0.6,
            });
          }
        });

        // Auto-scale to fit
        const box    = new THREE.Box3().setFromObject(modelGroup);
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 2.2 / maxDim;
        modelGroup.scale.setScalar(scale);

        // Center
        const center = box.getCenter(new THREE.Vector3());
        modelGroup.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        scene.add(modelGroup);
      },
      undefined,
      (err) => {
        console.warn('GLB not loaded, using fallback:', err.message);
        buildFallback();
      }
    );
  } else {
    buildFallback();
  }

  // Scan line effect (horizontal plane that moves up/down)
  const scanGeo = new THREE.PlaneGeometry(4, 0.006);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
  });
  const scanLine = new THREE.Mesh(scanGeo, scanMat);
  scene.add(scanLine);

  // Grid floor
  const grid = new THREE.GridHelper(6, 20, 0x38bdf8, 0x0a2540);
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  grid.position.y = -1.4;
  scene.add(grid);

  // Resize handler
  function onResize() {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  }
  window.addEventListener('resize', onResize);

  // Animation loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotate model
    if (modelGroup) {
      modelGroup.rotation.y = t * 0.35;
      modelGroup.position.y = Math.sin(t * 0.7) * 0.06;
    }

    // Scan line sweep
    scanLine.position.y = Math.sin(t * 0.8) * 1.2;
    scanMat.opacity = 0.2 + Math.abs(Math.sin(t * 0.8)) * 0.25;

    // Subtle camera drift
    camera.position.x = Math.sin(t * 0.12) * 0.08;
    camera.position.y = 0.5 + Math.sin(t * 0.08) * 0.05;
    camera.lookAt(0, 0, 0);

    // Key light orbit
    keyLight.position.x = Math.cos(t * 0.4) * 3;
    keyLight.position.z = Math.sin(t * 0.4) * 3;

    renderer.render(scene, camera);
  }

  animate();
})();


// ════════════════════════════════════════════════════════════════════════════
// 3. UI INTERACTIONS
// ════════════════════════════════════════════════════════════════════════════

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Scroll-triggered fade-up animations
const fadeEls = document.querySelectorAll(
  '.tech-card, .step, .discipline-card, .purpose-card, .about-quote, .hero-stats .stat, .section-title, .section-body'
);

fadeEls.forEach(el => el.classList.add('fade-up'));

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

fadeEls.forEach(el => observer.observe(el));

// Stagger children
document.querySelectorAll('.tech-cards, .steps-container, .purpose-grid').forEach(parent => {
  [...parent.children].forEach((child, i) => {
    child.style.transitionDelay = `${i * 80}ms`;
  });
});

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  });
});
