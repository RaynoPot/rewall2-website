/**
 * SEO Image Rename & WebP Conversion Script for ReWall Website
 * 
 * This script:
 * 1. Converts all project photos and animation images to WebP format
 * 2. Renames all images to SEO-friendly descriptive filenames
 * 3. Copies logos with new clean filenames (logos keep original format)
 * 4. Creates new lowercase directory structure (project-photos, logos)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'images');

// Ensure output directories exist
const dirs = [
  path.join(BASE, 'project-photos'),
  path.join(BASE, 'logos'),
];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ─── CONVERSION JOBS ────────────────────────────────────────────────────────
// Format: { src: relative-to-images/, dest: relative-to-images/, webp: true/false }

const jobs = [
  // ── Animation / Wall-type icons (JFIF → WebP) ───────────────────────────
  { src: 'Block Animation.jfif',             dest: 'block-retaining-wall-animation.webp',           webp: true },
  { src: 'Concrete Animation.jfif',          dest: 'concrete-gravity-wall-animation.webp',           webp: true },
  { src: 'Steel and Timber Animation.jfif',  dest: 'steel-timber-hybrid-wall-animation.webp',        webp: true },
  { src: 'Timber Animation.jfif',            dest: 'timber-retaining-wall-animation.webp',           webp: true },

  // ── Project Photos (→ WebP, descriptive SEO names, NZ location) ─────────
  { src: 'Project Photos/MSC.JPG',                  dest: 'project-photos/mechanically-stabilised-earth-wall-nz.webp',    webp: true },
  { src: 'Project Photos/MSC 1.JPG',                dest: 'project-photos/mse-retaining-wall-construction-nz.webp',       webp: true },
  { src: 'Project Photos/Timber 1.jpeg',            dest: 'project-photos/timber-retaining-wall-residential-auckland.webp', webp: true },
  { src: 'Project Photos/Timber 2.jpeg',            dest: 'project-photos/premium-timber-retaining-wall-complex-nz.webp', webp: true },
  { src: 'Project Photos/Timber 3.jpg',             dest: 'project-photos/timber-garden-retaining-wall-nz.webp',          webp: true },
  { src: 'Project Photos/Timber 4.jpg',             dest: 'project-photos/timber-retaining-wall-installation-nz.webp',    webp: true },
  { src: 'Project Photos/Timber 5.jpg',             dest: 'project-photos/multi-level-timber-retaining-wall-nz.webp',     webp: true },
  { src: 'Project Photos/Timber 6.jpg',             dest: 'project-photos/timber-retaining-wall-premium-finish-nz.webp',  webp: true },
  { src: 'Project Photos/Timber.jpeg',              dest: 'project-photos/timber-retaining-wall-nz.webp',                  webp: true },
  { src: 'Project Photos/Steel and concrete.jpg',   dest: 'project-photos/steel-concrete-retaining-wall-nz.webp',         webp: true },
  { src: 'Project Photos/Steel and concrete 1.jpg', dest: 'project-photos/steel-concrete-hybrid-retaining-wall-nz.webp',  webp: true },
  { src: 'Project Photos/Stone.png',                dest: 'project-photos/natural-stone-retaining-wall-nz.webp',          webp: true },
  { src: 'Project Photos/Interbloc.jpg',            dest: 'project-photos/interbloc-concrete-block-wall-nz.webp',         webp: true },
  { src: 'Project Photos/Brick.jpg',                dest: 'project-photos/heritage-brick-retaining-wall-nz.webp',         webp: true },
  { src: 'Project Photos/Landscape 1.jpg',          dest: 'project-photos/landscape-retaining-wall-nz.webp',              webp: true },

  // ── Logos (copy with clean SEO names, keep original format) ─────────────
  { src: 'Logos/1.Nemean.jpg',              dest: 'logos/nemean-engineering-logo.jpg',         webp: false },
  { src: 'Logos/2.data bloc.png',           dest: 'logos/data-bloc-logo.png',                  webp: false },
  { src: 'Logos/3.Fineway.png',             dest: 'logos/fineway-earthmovers-logo.png',         webp: false },
  { src: 'Logos/re wall logo (1).png',      dest: 'logos/rewall-logo.png',                     webp: false },
  { src: 'Logos/re wall logo WHITE.png',    dest: 'logos/rewall-logo-white.png',               webp: false },
];

// ─── PROCESS JOBS ────────────────────────────────────────────────────────────
(async () => {
  let success = 0;
  let failed = 0;

  for (const job of jobs) {
    const srcPath  = path.join(BASE, job.src);
    const destPath = path.join(BASE, job.dest);

    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠  SKIP (not found): ${job.src}`);
      failed++;
      continue;
    }

    try {
      if (job.webp) {
        await sharp(srcPath)
          .webp({ quality: 82 })  // 82% = excellent quality with significant size savings
          .toFile(destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      const srcSize  = Math.round(fs.statSync(srcPath).size  / 1024);
      const destSize = Math.round(fs.statSync(destPath).size / 1024);
      const saving   = job.webp ? ` (${srcSize}KB → ${destSize}KB)` : ` (copied, ${destSize}KB)`;
      console.log(`  ✔  ${job.src.padEnd(45)} → ${job.dest}${saving}`);
      success++;
    } catch (err) {
      console.error(`  ✖  FAILED: ${job.src} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
  console.log('Old files have been kept — delete them manually once you verify the site.');
})();
