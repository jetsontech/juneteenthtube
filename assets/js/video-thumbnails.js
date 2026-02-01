/* video-thumbnails.js
   - Vanilla JS toggler for .video-thumb elements.
   - Requirements:
     * Thumbnails use class 'video-thumb'
     * If the clickable element is a link and you want to prevent navigation while toggled, add attribute data-prevent-navigation="true"
     * Ensure thumbnails that are not naturally focusable include tabindex="0"
*/
(function () {
  'use strict';

  // Utility: detect reduced motion
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Single active thumbnail at a time
  let activeThumb = null;

  function activateThumb(el) {
    if (!el) return;
    if (activeThumb && activeThumb !== el) {
      deactivateThumb(activeThumb);
    }
    el.classList.add('is-active');
    el.setAttribute('aria-pressed', 'true');
    activeThumb = el;
  }

  function deactivateThumb(el) {
    if (!el) return;
    el.classList.remove('is-active');
    el.setAttribute('aria-pressed', 'false');
    if (activeThumb === el) activeThumb = null;
  }

  function toggleThumb(el) {
    if (!el) return;
    const isActive = el.classList.contains('is-active');
    if (isActive) deactivateThumb(el);
    else activateThumb(el);
  }

  function setupThumb(el) {
    // Ensure aria-pressed is present for assistive tech
    if (!el.hasAttribute('role')) {
      el.setAttribute('role', 'button');
    }
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
    if (!el.hasAttribute('aria-pressed')) {
      el.setAttribute('aria-pressed', 'false');
    }

    // Click / touch handler
    el.addEventListener('click', function (evt) {
      // If element is an anchor and navigation should not be prevented unless data-prevent-navigation="true"
      const isLink = el.tagName.toLowerCase() === 'a';
      const preventNav = el.getAttribute('data-prevent-navigation') === 'true';

      toggleThumb(el);

      if (isLink && preventNav) {
        // Prevent navigation to allow interaction like toggling a preview
        evt.preventDefault();
      }
    });

    // Keyboard support: Enter / Space to toggle, Escape to close
    el.addEventListener('keydown', function (evt) {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        toggleThumb(el);
      } else if (evt.key === 'Escape' || evt.key === 'Esc') {
        // Close if active
        if (el.classList.contains('is-active')) {
          deactivateThumb(el);
          // move focus back to the thumbnail for clarity
          el.focus();
        }
      }
    });
  }

  // Dismiss active on outside click
  document.addEventListener('click', function (evt) {
    if (!activeThumb) return;
    if (!activeThumb.contains(evt.target)) {
      deactivateThumb(activeThumb);
    }
  });

  // Initialize on DOMContentLoaded (or now if already loaded)
  function init() {
    const thumbs = Array.from(document.querySelectorAll('.video-thumb'));
    thumbs.forEach(setupThumb);

    // If reduced motion is preferred, avoid adding transition classes or heavy animations
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
