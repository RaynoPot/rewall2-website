/**
 * SEO HTML Update Script for ReWall Website
 * Updates all image src paths (to new SEO names), improves alt text, and
 * renames internal navigation links to the new SEO-friendly HTML filenames.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname);
const HTML_FILES = ['index.html','about.html','blog.html','contact.html','gallery.html','quote.html','services.html','terms.html','testupload.html'];

// ─── IMAGE PATH REPLACEMENTS ─────────────────────────────────────────────────
// Order matters: more specific patterns first (longer strings before shorter)
const IMAGE_REPLACEMENTS = [
  // Logos
  ['images/Logos/re wall logo WHITE.png',   'images/logos/rewall-logo-white.png'],
  ['images/Logos/re wall logo (1).png',     'images/logos/rewall-logo.png'],
  ['images/Logos/1.Nemean.jpg',             'images/logos/nemean-engineering-logo.jpg'],
  ['images/Logos/2.data bloc.png',          'images/logos/data-bloc-logo.png'],
  ['images/Logos/3.Fineway.png',            'images/logos/fineway-earthmovers-logo.png'],

  // Animation wall-type icons (root level)
  ['images/Block Animation.jfif',            'images/block-retaining-wall-animation.webp'],
  ['images/Concrete Animation.jfif',         'images/concrete-gravity-wall-animation.webp'],
  ['images/Steel and Timber Animation.jfif', 'images/steel-timber-hybrid-wall-animation.webp'],
  ['images/Timber Animation.jfif',           'images/timber-retaining-wall-animation.webp'],

  // Project Photos — more specific (with number) first
  ['images/Project Photos/MSC 1.JPG',                  'images/project-photos/mse-retaining-wall-construction-nz.webp'],
  ['images/Project Photos/MSC.JPG',                    'images/project-photos/mechanically-stabilised-earth-wall-nz.webp'],
  ['images/Project Photos/Steel and concrete 1.jpg',   'images/project-photos/steel-concrete-hybrid-retaining-wall-nz.webp'],
  ['images/Project Photos/Steel and concrete.jpg',     'images/project-photos/steel-concrete-retaining-wall-nz.webp'],
  ['images/Project Photos/Timber 1.jpeg',              'images/project-photos/timber-retaining-wall-residential-auckland.webp'],
  ['images/Project Photos/Timber 2.jpeg',              'images/project-photos/premium-timber-retaining-wall-complex-nz.webp'],
  ['images/Project Photos/Timber 3.jpg',               'images/project-photos/timber-garden-retaining-wall-nz.webp'],
  ['images/Project Photos/Timber 4.jpg',               'images/project-photos/timber-retaining-wall-installation-nz.webp'],
  ['images/Project Photos/Timber 5.jpg',               'images/project-photos/multi-level-timber-retaining-wall-nz.webp'],
  ['images/Project Photos/Timber 6.jpg',               'images/project-photos/timber-retaining-wall-premium-finish-nz.webp'],
  ['images/Project Photos/Timber.jpeg',                'images/project-photos/timber-retaining-wall-nz.webp'],
  ['images/Project Photos/Stone.png',                  'images/project-photos/natural-stone-retaining-wall-nz.webp'],
  ['images/Project Photos/Interbloc.jpg',              'images/project-photos/interbloc-concrete-block-wall-nz.webp'],
  ['images/Project Photos/Brick.jpg',                  'images/project-photos/heritage-brick-retaining-wall-nz.webp'],
  ['images/Project Photos/Landscape 1.jpg',            'images/project-photos/landscape-retaining-wall-nz.webp'],

  // JS logo reference in quote.html (logo.src = '...')
  ["images/Logos/re wall logo WHITE.png",  'images/logos/rewall-logo-white.png'],
];

// ─── ALT TEXT IMPROVEMENTS ───────────────────────────────────────────────────
// Improve vague alt attributes that hurt SEO accessibility
const ALT_REPLACEMENTS = [
  // Gallery project card alt text
  ['alt="MSE Retaining Wall"',              'alt="MSE Mechanically Stabilised Earth Retaining Wall NZ"'],
  ['alt="Steel and Concrete Wall"',         'alt="Steel and Concrete Hybrid Retaining Wall New Zealand"'],
  ['alt="Timber Garden Wall"',              'alt="Timber Garden Retaining Wall New Zealand"'],
  ['alt="Practical Timber Wall"',           'alt="Timber Retaining Wall Installation New Zealand"'],
  ['alt="Multi-Level Timber Wall"',         'alt="Multi-Level Timber Retaining Wall Complex NZ"'],
  ['alt="Premium Residential Timber Wall"', 'alt="Premium Residential Timber Retaining Wall NZ"'],
  ['alt="Interbloc Wall"',                  'alt="Interbloc Concrete Block Retaining Wall NZ"'],
  ['alt="Brick Retaining Wall"',            'alt="Heritage Brick Retaining Wall New Zealand"'],
  ['alt="Stone Retaining Wall"',            'alt="Natural Stone Retaining Wall New Zealand"'],
  ['alt="Landscape Wall"',                  'alt="Landscape Integration Retaining Wall NZ"'],
  // Icon alt text improvements
  ['alt="Gravity (Concrete)"',             'alt="Concrete Gravity Retaining Wall"'],
  ['alt="MSE (Mechanically Stabilized Earth)"', 'alt="MSE Mechanically Stabilised Earth Retaining Wall"'],
  ['alt="Timber"',                          'alt="Timber Retaining Wall"'],
  ['alt="Landscape/Stone"',                 'alt="Landscape and Stone Retaining Wall"'],
  ['alt="Hybrid"',                          'alt="Steel Timber Hybrid Retaining Wall"'],
  // Logo/brand
  ['alt="R:Wall Logo"',                     'alt="ReWall Retaining Wall Specialists Logo"'],
  ['alt="ReWall Logo"',                     'alt="ReWall Retaining Wall Specialists Logo"'],
  ['alt="Nemean Engineering"',              'alt="Nemean Engineering - Structural Engineering Partner"'],
  ['alt="Data Bloc"',                       'alt="Data Bloc - ReWall Planning Suite"'],
  ['alt="Fine Way"',                        'alt="Fineway Earthmovers - Civil Works Partner"'],
  ['alt="Fine Way Earthmovers"',            'alt="Fineway Earthmovers - Civil Works Partner"'],
  ['alt="Fineway Earthmovers"',             'alt="Fineway Earthmovers - Civil Works Partner"'],
];

// ─── HTML FILE LINK REPLACEMENTS ─────────────────────────────────────────────
// Update all internal navigation href links to the new SEO-friendly filenames.
// Use word-boundary-safe patterns: only match when followed by " or '
const LINK_REPLACEMENTS = [
  // Exact href/src references (with quotes)
  ['"about.html"',    '"about-rewall.html"'],
  ["'about.html'",    "'about-rewall.html'"],
  ['"blog.html"',     '"retaining-wall-blog.html"'],
  ["'blog.html'",     "'retaining-wall-blog.html'"],
  ['"gallery.html"',  '"retaining-wall-gallery.html"'],
  ["'gallery.html'",  "'retaining-wall-gallery.html'"],
  ['"quote.html"',    '"retaining-wall-quote.html"'],
  ["'quote.html'",    "'retaining-wall-quote.html'"],
  ['"services.html"', '"retaining-wall-services.html"'],
  ["'services.html'", "'retaining-wall-services.html'"],
];

// ─── APPLY REPLACEMENTS ──────────────────────────────────────────────────────
let totalChanges = 0;

for (const filename of HTML_FILES) {
  const filepath = path.join(BASE, filename);
  if (!fs.existsSync(filepath)) { console.log(`  SKIP (not found): ${filename}`); continue; }

  let content = fs.readFileSync(filepath, 'utf8');
  let fileChanges = 0;
  const log = [];

  const applyReplacements = (list, label) => {
    for (const [from, to] of list) {
      const count = (content.split(from).length - 1);
      if (count > 0) {
        content = content.split(from).join(to);
        log.push(`    [${label}] "${from}" → "${to}" (×${count})`);
        fileChanges += count;
      }
    }
  };

  applyReplacements(IMAGE_REPLACEMENTS, 'IMG SRC');
  applyReplacements(ALT_REPLACEMENTS,   'ALT');
  applyReplacements(LINK_REPLACEMENTS,  'LINK');

  if (fileChanges > 0) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`\n✔ ${filename} — ${fileChanges} replacements`);
    log.forEach(l => console.log(l));
    totalChanges += fileChanges;
  } else {
    console.log(`  (no changes) ${filename}`);
  }
}

console.log(`\n═══ Done: ${totalChanges} total replacements across HTML files. ═══`);
