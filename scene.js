// Hero 3D scene: a small glowing city the camera orbits as you scroll.
// If WebGL or the CDN is unavailable, the CSS gradient fallback stays visible.
(() => {
if (!window.THREE) return;

const canvas = document.getElementById("scene");
const hero = canvas.parentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch {
  canvas.remove();
}

if (renderer) {
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a1a48, 18, 48);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x0a1a48, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(8, 14, 6);
  scene.add(sun);

  // Window texture drawn once on a canvas
  function windowTexture() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#13306e";
    g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 12) {
      for (let x = 6; x < 64; x += 14) {
        const lit = Math.random();
        g.fillStyle = lit > 0.6 ? "#ffc247" : lit > 0.35 ? "#fff1b8" : "#1d3a80";
        g.fillRect(x, y, 8, 6);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  const city = new THREE.Group();
  scene.add(city);
  const textures = [windowTexture(), windowTexture(), windowTexture()];
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1f3672, roughness: 0.6 });
  const buildings = [];

  for (let gx = -4; gx <= 4; gx++) {
    for (let gz = -4; gz <= 4; gz++) {
      if (Math.random() < 0.22) continue;
      const dist = Math.hypot(gx, gz);
      const h = Math.max(1, (6 - dist) * (0.6 + Math.random() * 0.9));
      const w = 0.8 + Math.random() * 0.5;
      const tex = textures[(gx + gz + 12) % 3].clone();
      tex.needsUpdate = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, Math.ceil(h / 1.5));
      const side = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.5 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), [side, side, roofMat, roofMat, side, side]);
      mesh.position.set(gx * 1.6, h / 2, gz * 1.6);
      mesh.userData = { h, delay: dist * 0.12 + Math.random() * 0.2 };
      mesh.scale.y = 0.001;
      city.add(mesh);
      buildings.push(mesh);
    }
  }

  // Ground grid
  const grid = new THREE.GridHelper(40, 40, 0x4cc35a, 0x1c3577);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  // Floating sparkles
  const count = 500;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = Math.random() * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffc247, size: 0.06, transparent: true, opacity: 0.8 }));
  scene.add(sparks);

  // A ring orbiting the tallest tower
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.03, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x8fe36b, transparent: true, opacity: 0.7 }),
  );
  ring.rotation.x = Math.PI / 2.2;
  ring.position.y = 4;
  scene.add(ring);

  function resize() {
    const { clientWidth: w, clientHeight: h } = hero;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Shift the picture right on wide screens so the city sits beside the headline, not behind it.
    // On phones it stays centred and drops lower, behind the darkened text area.
    if (w > 860) camera.setViewOffset(w, h, -w * 0.27, 0, w, h);
    else camera.setViewOffset(w, h, 0, -h * 0.18, w, h);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
  });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const s = Math.min(1, (window.__scrollProgress || 0) * 6); // 0 → 1 over the hero

    // Buildings grow up from the ground on load
    for (const b of buildings) {
      const k = reduceMotion ? 1 : Math.min(1, Math.max(0, (t - b.userData.delay) / 1.2));
      b.scale.y = 0.001 + (1 - Math.pow(1 - k, 3));
      b.position.y = (b.userData.h * b.scale.y) / 2;
    }

    // Camera orbits and dives in as you scroll, with a little mouse parallax
    const angle = (reduceMotion ? 0 : t * 0.05) + s * 1.4 + mouse.x * 0.3;
    const radius = 22 - s * 8;
    camera.position.set(
      city.position.x + Math.sin(angle) * radius,
      10 - s * 4 - mouse.y * 2,
      Math.cos(angle) * radius,
    );
    camera.lookAt(city.position.x, 2.5, 0);

    ring.rotation.z = t * 0.4;
    ring.position.y = 4 + Math.sin(t) * 0.4;
    sparks.rotation.y = t * 0.02;
    renderer.render(scene, camera);
  }
  frame();
}
})();
