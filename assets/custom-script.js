
import { onDocumentLoaded, onDocumentReady } from '@theme/utilities';

const ANIMATION_PRESETS = {
    'fade':    { opacity: 0 },
    'fade-up':    { opacity: 0, y: 40 },
    'fade-down':  { opacity: 0, y: -40 },
    'fade-left':  { opacity: 0, x: 40 },
    'fade-right': { opacity: 0, x: -40 },
  };
  

// onDocumentLoaded(() => {
    initRevealObserver();
// });
document.addEventListener('shopify:section:load', e => {
  matchMedia(e.target);
});

function initRevealObserver(root = document) {
  // return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;

      // Read data attrs
      const delay = parseFloat(el.dataset.animateDelay) || 0;
      const duration = parseFloat(el.dataset.animateDuration) || 0.6;
      const stagger = parseFloat(el.dataset.animateStagger) || 0;

      // Set CSS variables for transition timing
      el.style.setProperty('--animate-delay', `${delay}s`);
      el.style.setProperty('--animate-duration', `${duration}s`);

      if (stagger && el.children.length) {
        // stagger children delays
        Array.from(el.children).forEach((child, i) => {
          child.style.transitionDelay = `${delay + i * stagger}s`;
        });
      }

      // Add visible class
      el.classList.add('is-visible');

      // Once played, unobserve
      obs.unobserve(el);
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px',
  });

  root.querySelectorAll('[data-animate]').forEach(el => {
    if (el.dataset.animateObserved) return;
    el.dataset.animateObserved = 'true';

    // If trigger is not self, observe the closest ancestor matching trigger selector
    if (el.dataset.animateTrigger && el.dataset.animateTrigger !== 'self') {
      const triggerEl = el.closest(el.dataset.animateTrigger);
      if (triggerEl) {
        observer.observe(triggerEl);
        return;
      }
    }

    observer.observe(el);
  });
}
