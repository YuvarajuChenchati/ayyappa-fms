// ---- Business details: change these and every WhatsApp link on the page updates ----
const CONFIG = {
  // Country code + number, digits only. The first one also receives the contact form.
  whatsapp: ["919666674002", "919666674003"],
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waUrl = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// WhatsApp links: data-number picks which number (0 = first, 1 = second)
document.querySelectorAll(".wa-link").forEach((a) => {
  const number = CONFIG.whatsapp[Number(a.dataset.number || 0)];
  a.href = waUrl(number, a.dataset.msg || "Hi Ayyappa FMS");
  a.target = "_blank";
  a.rel = "noopener";
});
document.getElementById("year").textContent = new Date().getFullYear();

// Contact form: build the message and open WhatsApp
document.getElementById("wa-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const lines = [
    "Hi Ayyappa FMS, I'd like to know more about your services.",
    `Name: ${f.get("name")}`,
    `Service: ${f.get("service")}`,
    f.get("location") && `Property: ${f.get("location")}`,
    f.get("message") && `Message: ${f.get("message")}`,
  ].filter(Boolean);
  window.open(waUrl(CONFIG.whatsapp[0], lines.join("\n")), "_blank", "noopener");
});

// Scroll reveal, staggered within each group: an element tilts in once its top passes 90% of the screen
let pending = [...document.querySelectorAll(".reveal")];
pending.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.setProperty("--d", `${siblings.indexOf(el) * 0.1}s`);
});
function revealInView() {
  pending = pending.filter((el) => {
    if (el.getBoundingClientRect().top > innerHeight * 0.9) return true;
    el.classList.add("in");
    return false;
  });
}

// 3D tilt on the service cards
if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) translateZ(10px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });
}

// Scroll-driven effects: progress bar, nav background
const nav = document.querySelector(".nav");
const bar = document.querySelector(".scroll-progress");
const cube = document.querySelector(".cube");

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle("scrolled", y > 40);
  window.__scrollProgress = max > 0 ? y / max : 0; // read by the 3D hero scene
  revealInView();
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// Cube: drag (mouse or touch) to rotate, with momentum; spins slowly on its own and faster on hover.
// Page scroll still adds a little turn.
if (!reduceMotion) {
  const wrap = document.querySelector(".cube-wrap");
  let ry = 38, rx = -22, vy = 0, vx = 0, hover = false, drag = null;

  wrap.addEventListener("pointerenter", () => (hover = true));
  wrap.addEventListener("pointerleave", () => (hover = false));
  wrap.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY };
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("dragging");
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!drag) return;
    vy = (e.clientX - drag.x) * 0.5;
    vx = -(e.clientY - drag.y) * 0.5;
    ry += vy; rx = Math.max(-80, Math.min(80, rx + vx));
    drag = { x: e.clientX, y: e.clientY };
  });
  const endDrag = () => { drag = null; wrap.classList.remove("dragging"); };
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  (function spin() {
    if (!drag) {
      vy *= 0.94; vx *= 0.94;                  // momentum fades after release
      ry += vy + (hover ? 0.6 : 0.15);          // idle spin, faster on hover
      rx = Math.max(-80, Math.min(80, rx + vx + (-22 - rx) * 0.02)); // ease back to the default tilt
    }
    const scrollTurn = window.scrollY * 0.12;
    cube.style.setProperty("--ry", `${ry + scrollTurn}deg`);
    cube.style.setProperty("--rx", `${rx}deg`);
    requestAnimationFrame(spin);
  })();
}
