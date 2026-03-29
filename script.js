/**
 * PainSync — script.js
 * ES6 Module · Three.js + GLTFLoader 
 * Versión Profesional Optimizada
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// ════════════════════════════════════════════════════════════════════════════
// 1. PENTAGON PARTICLE BACKGROUND (FONDO GENERATIVO)
// ════════════════════════════════════════════════════════════════════════════

(function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, mouse = { x: -9999, y: -9999 };

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

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

    const particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 4 + Math.random() * 14,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.004,
        baseAlpha: 0.04 + Math.random() * 0.08,
        alpha: 0,
    }));

    function animate() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
            p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed;
            if (p.x < -40) p.x = W + 40; if (p.x > W + 40) p.x = -40;
            if (p.y < -40) p.y = H + 40; if (p.y > H + 40) p.y = -40;

            const dist = Math.sqrt((p.x - mouse.x)**2 + (p.y - mouse.y)**2);
            const near = Math.max(0, 1 - dist / 160);
            p.alpha += (p.baseAlpha + near * 0.55 - p.alpha) * 0.1;

            ctx.save();
            drawPentagon(ctx, p.x, p.y, p.r, p.rot);
            ctx.strokeStyle = `rgba(56,189,248,${p.alpha})`;
            ctx.stroke();
            if (near > 0.1) {
                ctx.fillStyle = `rgba(56,189,248,${near * 0.06})`;
                ctx.fill();
            }
            ctx.restore();
        }
        requestAnimationFrame(animate);
    }
    animate();
})();

// ════════════════════════════════════════════════════════════════════════════
// 2. THREE.JS — MAIN BODY MODEL (humanbody.glb)
// ════════════════════════════════════════════════════════════════════════════

(function initMainModel() {
    const container = document.getElementById('three-container');
    const canvas = document.getElementById('three-canvas');
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 4, 15);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let mainModel;
    const loader = new GLTFLoader();

    loader.load('humanbody.glb', (gltf) => {
        mainModel = gltf.scene;
        mainModel.traverse(child => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x0d2137,
                
                });
            }
        });
        
        // Ajuste de escala y posición
        const box = new THREE.Box3().setFromObject(mainModel);
        const center = box.getCenter(new THREE.Vector3());
        mainModel.position.sub(center); 
        mainModel.position.x += 0; 
        mainModel.position.y += -50;
        mainModel.scale.setScalar(0.6);
        scene.add(mainModel);
    }, undefined, (error) => console.error("Error cargando cuerpo:", error));

    function animate() {
        requestAnimationFrame(animate);
        if (mainModel) {
            mainModel.rotation.y += 0.005;
            mainModel.position.y = Math.sin(Date.now() * 0.001) * 0.1;
        }
        renderer.render(scene, camera);
    }
    animate();
})();

// ════════════════════════════════════════════════════════════════════════════
// 3. THREE.JS — PATCH COMPOSITION MODEL (parche.glb)
// ════════════════════════════════════════════════════════════════════════════

(function initPatchModel() {
    const container = document.getElementById('patch-container');
    const canvas = document.getElementById('patch-canvas');
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(1, 1, 1);
    scene.add(light1);
    scene.add(new THREE.AmbientLight(0x38bdf8, 0.4));

    let patchModel;
    const loader = new GLTFLoader();

    loader.load('parche.glb', (gltf) => {
        patchModel = gltf.scene;
        // Centrar y escalar
        const box = new THREE.Box3().setFromObject(patchModel);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.5 / Math.max(size.x, size.y);
        patchModel.scale.setScalar(scale);
        scene.add(patchModel);
    }, undefined, (error) => console.error("Error cargando parche:", error));

    function animate() {
        requestAnimationFrame(animate);
        if (patchModel) {
            patchModel.rotation.y += 0.01;
            patchModel.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
        }
        renderer.render(scene, camera);
    }
    animate();
})();

// ════════════════════════════════════════════════════════════════════════════
// 4. UI INTERACTION & SCROLL ANIMATIONS
// ════════════════════════════════════════════════════════════════════════════

// Navbar glass effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// Fade-up Observer
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Registramos todos los elementos para animación
document.querySelectorAll(`
    .section-title, .section-body, .tech-card, .step, 
    .comp-item, .chroma-box, .discipline-card, .purpose-card
`).forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
});

// Staggered Delays para listas
document.querySelectorAll('.tech-cards, .chroma-scale, .purpose-grid').forEach(parent => {
    Array.from(parent.children).forEach((child, i) => {
        child.style.transitionDelay = `${i * 100}ms`;
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});
