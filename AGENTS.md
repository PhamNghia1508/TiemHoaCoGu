# Base44 Dev Environment

## Project
Static HTML/CSS/JS website (no backend, no build step, no framework).
Pages: `index.html`, `shop.html`, `product.html`, `gallery.html`, `workshop.html`, `ve-xuong.html`, `cau-chuyen.html`, `lien-he.html`, `faq.html`, `blog.html`, `tra-cuu.html`, `studio.html`.
Assets in `assets/` (WebP), styles in `css/`, scripts in `js/`, data in `data/`.
UX enhancements (dark mode, wishlist, back-to-top, chat widget, social proof, cookie consent, promo banner, skeleton loading) are in `css/enhancements.css` and `js/enhancements.js` — included on all customer-facing pages.

## Running
`docker compose -f docker-compose.base44.yml up -d` — nginx:alpine serves the repo root on host port 3000.
Source is bind-mounted read-only, so edits appear on browser refresh (no reload needed beyond a page refresh).

## No secrets required
No external services or credentials are needed.
