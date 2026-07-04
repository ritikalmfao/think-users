import * as THREE from "three";

const container = document.getElementById("particle-bg");

function getPageHeight() {
    return Math.max(document.body.scrollHeight, window.innerHeight);
}

let width = window.innerWidth;
let height = getPageHeight();
container.style.height = height + "px";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// --- Circular particle texture ---
function createCircleTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

const circleTexture = createCircleTexture();

// --- Particles ---
const PARTICLE_COUNT = 150;
const positions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = [];

for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

    velocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
    });
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
    map: circleTexture,
    color: 0x333333,      // darker
    size: 0.35,            // smaller
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// --- Connecting lines ---
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x333333,
    transparent: true,
    opacity: 0.1
});

let lineMesh = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
scene.add(lineMesh);

const maxDistance = 12;

function updateLines() {
    const linePositions = [];
    const pos = particleGeometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < maxDistance) {
                linePositions.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
                linePositions.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
            }
        }
    }

    lineMesh.geometry.dispose();
    lineMesh.geometry = new THREE.BufferGeometry();
    lineMesh.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePositions, 3)
    );
}

// --- Scroll parallax ---
let targetScrollY = 0;
let currentScrollY = 0;

window.addEventListener("scroll", () => {
    targetScrollY = window.scrollY;
});

// --- Animation loop ---
let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    // smooth scroll value for fluid parallax
    currentScrollY += (targetScrollY - currentScrollY) * 0.05;
    particles.position.y = currentScrollY * 0.02;
    lineMesh.position.y = currentScrollY * 0.02;

    // drift particles
    const pos = particleGeometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        if (Math.abs(pos[i * 3]) > 45) velocities[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 60) velocities[i].y *= -1;
        if (Math.abs(pos[i * 3 + 2]) > 20) velocities[i].z *= -1;
    }

    particleGeometry.attributes.position.needsUpdate = true;

    // throttle line recalculation for performance
    if (frameCount % 2 === 0) updateLines();

    particles.rotation.y += 0.0004;
    lineMesh.rotation.y += 0.0004;

    renderer.render(scene, camera);
}

animate();

// --- Handle resize + page height changes ---
function handleResize() {
    width = window.innerWidth;
    height = getPageHeight();

    container.style.height = height + "px";
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener("resize", handleResize);
window.addEventListener("load", handleResize);
function initCtaParticles() {
    const canvas = document.getElementById("cta-particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    function resize() {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Each ring has its own imperfect center offset, squash, and rotation
    // so nothing lines up too neatly — deliberate asymmetry
    const rings = [
        {
            baseRadius: 95,
            speed: 0.01,
            dotCount: 14,
            phase: 0.3,
            offsetX: -6, offsetY: 4,
            squashX: 1, squashY: 0.92,
            rotation: 0.2,
            jitter: 0.15
        },
        {
            baseRadius: 125,
            speed: 0.007,
            dotCount: 20,
            phase: 1.7,
            offsetX: 10, offsetY: -8,
            squashX: 1.08, squashY: 0.95,
            rotation: -0.4,
            jitter: 0.2
        },
        {
            baseRadius: 235,
            speed: 0.005,
            dotCount: 26,
            phase: 3.1,
            offsetX: -14, offsetY: 10,
            squashX: 0.95, squashY: 1.05,
            rotation: 0.6,
            jitter: 0.25
        },
        {
            baseRadius: 305,
            speed: 0.004,
            dotCount: 32,
            phase: 0.8,
            offsetX: 18, offsetY: -6,
            squashX: 1.05, squashY: 0.9,
            rotation: -0.15,
            jitter: 0.3
        },
    ];

    // pre-generate a stable random jitter per dot so it doesn't flicker each frame
    rings.forEach((ring) => {
        ring.dotJitters = [];
        for (let i = 0; i < ring.dotCount; i++) {
            ring.dotJitters.push({
                r: (Math.random() - 0.5) * ring.jitter * ring.baseRadius,
                sizeVar: Math.random() * 0.8 + 0.7,
                alphaVar: Math.random() * 0.4 + 0.4
            });
        }
    });

    let time = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        time += 1; // much slower increment = smoother, slower motion

        

        rings.forEach((ring) => {
            const ringCx = cx + ring.offsetX;
            const ringCy = cy + ring.offsetY;

            // gentle breathing, very subtle amplitude
            const pulse = Math.sin(time * ring.speed + ring.phase) * 3;
            const radius = ring.baseRadius + pulse;

            for (let i = 0; i < ring.dotCount; i++) {
                const jitter = ring.dotJitters[i];

                // uneven spacing: nudge angle per-dot using its index + jitter seed
                const angle =
                    (i / ring.dotCount) * Math.PI * 2 +
                    ring.rotation +
                    time * ring.speed;

                const r = radius + jitter.r;

                const x = ringCx + Math.cos(angle) * r * ring.squashX;
                const y = ringCy + Math.sin(angle) * r * ring.squashY;

                ctx.beginPath();
                ctx.arc(x, y, 1.1 * jitter.sizeVar, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(120, 180, 255, ${0.55 * jitter.alphaVar})`;
                ctx.fill();
            }
        });

        requestAnimationFrame(draw);
    }

    draw();
}

initCtaParticles();
function initElevateParticles() {
    const canvas = document.getElementById("elevate-particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    function resize() {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 90;
    const particles = [];

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            baseX: 0,
            baseY: 0,
            orbitRadius: Math.random() * 40 + 10,
            orbitSpeed: (Math.random() - 0.5) * 0.09,
            angle: Math.random() * Math.PI * 2,
            size: Math.random() * 1.4 + 0.5,
            alpha: Math.random() * 0.4 + 0.3
        };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = createParticle();
        p.baseX = p.x;
        p.baseY = p.y;
        particles.push(p);
    }

    let time = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time += 1.3;

        particles.forEach((p) => {
            p.angle += p.orbitSpeed;
            const x = p.baseX + Math.cos(p.angle) * p.orbitRadius * 0.15;
            const y = p.baseY + Math.sin(p.angle) * p.orbitRadius * 0.15;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 92, 92, ${p.alpha})`; // red tint
            ctx.fill();

            p.currentX = x;
            p.currentY = y;
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].currentX - particles[j].currentX;
                const dy = particles[i].currentY - particles[j].currentY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 90) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].currentX, particles[i].currentY);
                    ctx.lineTo(particles[j].currentX, particles[j].currentY);
                    ctx.strokeStyle = `rgba(255, 92, 92, ${0.06 * (1 - dist / 90)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
}

initElevateParticles();
width = window.innerWidth;