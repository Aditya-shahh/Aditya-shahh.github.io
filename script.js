// ===== Scroll-triggered fade-in animations =====
document.addEventListener('DOMContentLoaded', () => {

  // Observe top-level fade-in sections
  const sections = document.querySelectorAll('.fade-in');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);

        // Once section is visible, stagger its children
        const children = entry.target.querySelectorAll('.fade-in-child');
        children.forEach((child, i) => {
          setTimeout(() => {
            child.classList.add('visible');
          }, 80 + i * 60);
        });
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  sections.forEach(section => sectionObserver.observe(section));

  // ===== Sticky nav shadow on scroll =====
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }
});
