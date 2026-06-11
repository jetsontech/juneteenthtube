# apply-video-thumbnail-patch.ps1
# Usage: run from any location; it will cd into the repo root path below and apply a branch with files.
$repoRoot = "C:\Users\jetso\.gemini\antigravity\scratch\juneteenthtube"
$branch = "juneteenthtube/video-thumbnail-enhancements"

Write-Host "Checking repository at $repoRoot ..."
if (-not (Test-Path $repoRoot)) {
  Write-Error "Repo path not found: $repoRoot"
  exit 1
}

Push-Location $repoRoot
try {
  $isGit = (& git rev-parse --is-inside-work-tree) 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Not a git repository at $repoRoot. Initialize or point the script to the correct repo."
    exit 1
  }

  Write-Host "Creating branch $branch ..."
  & git checkout -b $branch

  # Ensure directories exist
  New-Item -ItemType Directory -Force -Path assets/css | Out-Null
  New-Item -ItemType Directory -Force -Path assets/js | Out-Null

  # Write CSS
  $cssPath = Join-Path $repoRoot "assets/css/video-thumbnails.css"
  @"
 /* video-thumbnails.css
    - Appended accessibility and interaction improvements
    - Add to your global CSS or component-level imports
 */

 /* ===== Base rules (preserve your original styles here) ===== */
 /* You can replace the block below with your actual CSS if needed. */
 .video-thumb { display:inline-block; position:relative; cursor:pointer; }
 .video-thumb img { display:block; width:100%; height:auto; }

 /* ===== Accessibility & Interaction Enhancements ===== */

 /* Active state */
 .video-thumb.is-active {
   outline: 3px solid rgba(59,130,246,0.6); /* blue focus ring */
   box-shadow: 0 6px 18px rgba(0,0,0,0.12);
   transform: translateY(-2px);
 }

 /* Reduced motion: remove transforms */
 @media (prefers-reduced-motion: reduce) {
   .video-thumb.is-active { transform: none; transition: none; }
 }

 /* Visually-hidden helper for screenreader-only text */
 .sr-only {
   position: absolute !important;
   width: 1px; height: 1px;
   padding: 0; margin: -1px;
   overflow: hidden; clip: rect(0,0,0,0);
   white-space: nowrap; border: 0;
 }

 /* Make thumbnail focusable when not an anchor/button */
 .video-thumb[tabindex] { outline: none; }

 /* Pressed state for aria-pressed support */
 .video-thumb[aria-pressed="true"] .thumb-play-icon {
   transform: scale(1.05);
   transition: transform 160ms ease;
 }

 /* Optional: ensure images don't get a weird border on focus for some browsers */
 .video-thumb img { border: 0; }

"@ | Out-File -Encoding utf8 $cssPath

  # Write JS
  $jsPath = Join-Path $repoRoot "assets/js/video-thumbnails.js"
  @"
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
"@ | Out-File -Encoding utf8 $jsPath

  # Write README snippet
  $readmePath = Join-Path $repoRoot "assets/css/VIDEO_THUMBNAILS_README.md"
  @"
Video Thumbnails - Integration Notes
------------------------------------

Files added:
- assets/css/video-thumbnails.css
- assets/js/video-thumbnails.js
Branch: $branch

How to include:
- Static HTML:
  <link rel=\"stylesheet\" href=\"/assets/css/video-thumbnails.css\">
  <script defer src=\"/assets/js/video-thumbnails.js\"></script>

- Next.js (Pages Router):
  import '../assets/css/video-thumbnails.css' in pages/_app.js or _app.tsx
  Add <script src=\"/assets/js/video-thumbnails.js\" strategy=\"afterInteractive\" /> via next/script OR place the file in public/ and include with a normal script tag.

- Next.js (App Router):
  Import the CSS in app/layout.js/layout.tsx and add a client component for the JS or include the script in a root layout as an external script.

Notes:
- Thumbnails should use class 'video-thumb'. If a thumbnail element is not focusable, the JS sets tabindex=\"0\".
- If a thumbnail is an anchor and you want toggling to prevent navigation (e.g., show a preview), add data-prevent-navigation=\"true\" to that anchor.
- The JS respects 'prefers-reduced-motion'.

Vercel & Cloudflare recommendations:
- Deploy via your existing Git -> Vercel flow.
- Set Cache-Control headers for static assets (CSS/JS) to at least 1 hour in Vercel or Cloudflare; purge Cloudflare cache after deploy if needed.

"@ | Out-File -Encoding utf8 $readmePath

  # Git add + commit + push
  & git add assets/css/video-thumbnails.css assets/js/video-thumbnails.js assets/css/VIDEO_THUMBNAILS_README.md
  & git commit -m "Add video thumbnails accessibility/interaction enhancements"
  & git push --set-upstream origin $branch

  Write-Host "Patch applied and branch pushed: $branch"
  Write-Host "Next steps:"
  Write-Host "1) Open a PR on GitHub from branch $branch"
  Write-Host "2) Merge to trigger Vercel deploy"
  Write-Host "3) Optionally purge Cloudflare cache for updated static assets"
} finally {
  Pop-Location
}