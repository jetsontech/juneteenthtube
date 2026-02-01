Video Thumbnails - Integration Notes
------------------------------------

Files added:
- assets/css/video-thumbnails.css
- assets/js/video-thumbnails.js
Branch: juneteenthtube/video-thumbnail-enhancements

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

