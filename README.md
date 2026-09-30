# Sticker Press

Open `Sticker.html` in a browser. Keep `styles.css`, `app.js`, and `numbering.js` in the same folder. No build or installation is required. Google Fonts are optional; browser fonts work offline.

- Choose an inclusive number range and 1–50 kits. Every kit contains the complete range.
- Default order runs down columns, then across sheets. Each column holds at most 50 stickers, or fewer when the sticker dimensions and spacing require it.
- For 1–165 at 50 rows: columns begin at 1, 51, 101, and 151. A second kit restarts at 1 immediately after 165. After the final kit, remaining spaces stay blank.
- Optional last-sheet filling adds extra stickers beyond the requested kits; leave it off for exact quantities.
- Print on A4 at 100% scale with browser headers and footers disabled.

Files: `Sticker.html` contains markup, `styles.css` contains presentation and print styles, `app.js` handles controls and rendering, and `numbering.js` builds kit sequences and pages.

Run sequence regression checks with `node tests/numbering.cjs`.
