/* ===== Scroll Animations ===== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      // Stagger children
      const children = entry.target.querySelectorAll('.fade-in-child');
      children.forEach((child, i) => {
        setTimeout(() => child.classList.add('visible'), i * 80);
      });
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ===== Nav Scroll Shadow ===== */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ===== Flowing Wave Canvas ===== */
(function() {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, animationId;
  let time = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  // Rich watercolor palette — highly visible and vibrant
  const waves = [
    { color: 'rgba(160, 150, 130, 0.35)', amplitude: 40, frequency: 0.003, speed: 0.008, yOffset: 0.25, phase: 0 },
    { color: 'rgba(120, 150, 170, 0.4)', amplitude: 35, frequency: 0.004, speed: 0.006, yOffset: 0.38, phase: 1.2 },
    { color: 'rgba(180, 160, 120, 0.25)', amplitude: 45, frequency: 0.002, speed: 0.010, yOffset: 0.52, phase: 2.4 },
    { color: 'rgba(100, 145, 135, 0.35)', amplitude: 30, frequency: 0.005, speed: 0.005, yOffset: 0.65, phase: 3.8 },
    { color: 'rgba(170, 145, 110, 0.25)', amplitude: 50, frequency: 0.0015, speed: 0.012, yOffset: 0.48, phase: 5.0 },
    { color: 'rgba(140, 165, 185, 0.2)', amplitude: 25, frequency: 0.006, speed: 0.007, yOffset: 0.75, phase: 0.8 },
  ];

  function drawWave(wave, t) {
    ctx.beginPath();
    const baseY = height * wave.yOffset;

    ctx.moveTo(0, height);

    for (let x = 0; x <= width; x += 2) {
      const y = baseY
        + Math.sin(x * wave.frequency + t * wave.speed + wave.phase) * wave.amplitude
        + Math.sin(x * wave.frequency * 0.5 + t * wave.speed * 1.3 + wave.phase * 0.7) * wave.amplitude * 0.5
        + Math.cos(x * wave.frequency * 0.3 + t * wave.speed * 0.7) * wave.amplitude * 0.3;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = wave.color;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw flowing waves
    waves.forEach(wave => drawWave(wave, time));

    // Subtle floating particles
    for (let i = 0; i < 12; i++) {
      const px = (width * 0.1 + (width * 0.8) * ((Math.sin(time * 0.002 + i * 2.5) + 1) / 2));
      const py = (height * 0.15 + (height * 0.7) * ((Math.cos(time * 0.003 + i * 1.8) + 1) / 2));
      const radius = 1 + Math.sin(time * 0.01 + i) * 0.5;
      const alpha = 0.06 + Math.sin(time * 0.005 + i * 0.7) * 0.03;

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 145, 130, ${alpha})`;
      ctx.fill();
    }

    time++;
    animationId = requestAnimationFrame(draw);
  }

  // Smooth entrance
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 1.5s ease';

  window.addEventListener('resize', resize);
  resize();

  // Delay start for smooth page load
  setTimeout(() => {
    canvas.style.opacity = '1';
    draw();
  }, 300);

  // Pause when not visible
  const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animationId) draw();
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });
  });
  canvasObserver.observe(canvas);
})();

/* ===== Smooth text entrance ===== */
document.addEventListener('DOMContentLoaded', () => {
  const heroContent = document.querySelector('.hero__content');
  if (heroContent) {
    setTimeout(() => heroContent.classList.add('entered'), 200);
  }
});
