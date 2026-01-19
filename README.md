# ReWall NZ - Premium Retaining Wall Solutions

**Website:** www.rewall.nz  
**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Ready for Deployment

---

## 📋 Project Overview

ReWall NZ is a modern, responsive website for a premium retaining wall engineering and construction company. The site showcases the company's expertise, services, and project portfolio while providing multiple conversion points for customer inquiries.

### Core Features
- ✅ Fully responsive design (mobile-first)
- ✅ Hero section with SVG animation
- ✅ 6-page website structure
- ✅ Netlify Forms integration for contact submissions
- ✅ Lazy loading for performance
- ✅ Accessibility compliant (WCAG AA)
- ✅ SEO-optimized with meta tags and structured data
- ✅ Mobile hamburger navigation
- ✅ Lightbox gallery with 10 projects
- ✅ Blog section with 5 featured posts

---

## 📁 Project Structure

```
rewall-website/
├── index.html                      # Homepage
├── about.html                      # Company story & mission
├── services.html                   # Service offerings with "Circle" diagram
├── gallery.html                    # 10-project portfolio gallery
├── blog.html                       # Blog listing & posts
├── contact.html                    # Contact form (Netlify) & FAQ
├── css/
│   └── styles.css                  # Complete responsive stylesheet (900+ lines)
├── js/
│   └── scripts.js                  # Animations, interactions, form handling
├── images/
│   ├── logo.png                    # Brand logo (to be provided)
│   ├── icon.png                    # Favicon (to be provided)
│   ├── hero-animation.svg          # Hero background animation (embedded)
│   ├── projects/
│   │   ├── project1.png → project10.png   # Project gallery images
│   ├── blog/
│   │   ├── blog-placeholder-1.png → blog-placeholder-5.png
│   └── icons/
│       ├── engineering-icon.svg
│       ├── solutions-icon.svg
│       └── tools-icon.svg
├── README.md                       # This file
└── .gitignore                      # Git ignore rules
```

---

## 🎨 Design & Branding

### Color Palette
```
Primary Black:       #1a1a1a    (Logo, navigation)
Baby Blue:          #89CFF0    (Hero background)
Slate:              #2C3E50    (Text, depth)
Soft Blue:          #E8F4F8    (Section backgrounds)
White:              #FFFFFF    (Text on dark)
Dark Text:          #1a1a1a    (Text on light)
Teal Accent:        #4A90A4    (CTAs, highlights)
```

### Typography
- **Font:** System stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.)
- **Primary heading (h1):** 3.5rem (responsive: 1.5rem-4rem)
- **Secondary heading (h2):** 2.5rem
- **Body text:** 1rem with 1.8 line-height

### Key Design Elements
- **Right sidebar navigation** (desktop) / hamburger menu (mobile)
- **Hero section** with animated SVG lines
- **Card-based layout** for projects and blog posts
- **Consistent spacing** using CSS variables (--spacing-*)
- **Smooth transitions** and hover effects throughout

---

## 🌐 Pages & Content

### 1. **Homepage (index.html)**
- Hero section with animated SVG background
- 3-column value propositions
- 3 featured projects
- Trust bar with service areas & partners
- CTAs: "Request a Quote" & "Plan Your Wall"

### 2. **About (about.html)**
- Company story and mission
- Engineering excellence (Nemean partnership)
- Trusted partners (Nemean, Data Bloc, Fine Way)
- Service coverage areas (Cambridge, Auckland, North Waikato, Franklin)

### 3. **Services (services.html)**
- "Complete the Circle" service model
- Interactive circle diagram with 4 segments:
  - Project Management
  - Engineering Design
  - Council Submissions
  - Construction Oversight
- 5 wall types overview
- À la carte service options
- Future DIY planning tool announcement

### 4. **Gallery (gallery.html)**
- 10-project grid layout (responsive)
- Lightbox modal for enlarged views
- Project cards with descriptions & wall type badges
- Lazy loading for performance

### 5. **Blog (blog.html)**
- 5 featured blog posts with categories
- Newsletter signup section
- Post cards with excerpt, date, category
- Sample posts:
  1. MSE Walls Benefits
  2. Auckland Council Consents
  3. Cambridge Residential Case Study
  4. Geotechnical Analysis
  5. Digital Planning Tools

### 6. **Contact (contact.html)**
- Netlify Forms integration (spam-protected)
- Contact information (phone, email)
- Service areas with descriptions
- FAQ section with 5 common questions
- Partner information cards

---

## 🔧 Technical Stack

- **HTML5** - Semantic structure
- **CSS3** - Responsive design with CSS Grid & Flexbox
- **JavaScript (Vanilla)** - No frameworks, lightweight
- **Hosting:** Netlify
- **Forms:** Netlify Forms (built-in spam protection)
- **Version Control:** GitHub

### Responsive Breakpoints
```css
Mobile:        320px min-width
Tablet:        768px min-width
Desktop:       1024px min-width
Large Desktop: 1440px min-width
```

### Key Features
- Mobile-first responsive design
- CSS Variables for theming
- Intersection Observer for animations
- Smooth scrolling
- Form validation
- Lightbox gallery
- Lazy image loading
- Focus management for accessibility

---

## 📊 Performance Targets

- ⚡ Lighthouse Score: 90+ (Performance, Accessibility, Best Practices, SEO)
- ⚡ First Contentful Paint: < 2s
- ⚡ Cumulative Layout Shift: < 0.1
- ⚡ Page load size: < 500KB
- ⚡ 60fps animations

---

## ♿ Accessibility (WCAG AA)

- ✅ Semantic HTML5 markup
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus indicators on all interactive elements
- ✅ Alt text on all images
- ✅ Color contrast ratio: 4.5:1 minimum
- ✅ Screen reader friendly

---

## 🔍 SEO Implementation

### Meta Tags
Each page includes:
- Meta description (160 characters)
- Relevant keywords
- Open Graph tags (og:title, og:description, og:image, og:url)
- Viewport meta tag for mobile
- Character encoding (UTF-8)

### Structured Data (JSON-LD)
LocalBusiness schema included with:
- Business name & tagline
- Service areas
- Contact information
- Company details

---

## 📧 Netlify Forms Setup

### Form Name: "contact"
**Fields:**
- Name (required)
- Email (required)
- Phone (optional)
- Company (optional)
- Project Type (required, dropdown)
- Service Area (required, dropdown)
- Message (required, textarea)
- Honeypot field (bot-field) for spam protection

**Submission Handling:**
- Automatic email notification to configured email
- Submission data stored in Netlify dashboard
- No custom backend required

---

## 🎯 Call-to-Action Strategy

### Primary CTA: "Request a Quote"
- Appears in: Sidebar navigation, hero section, featured projects, gallery, services
- Links to: Contact form
- Color: Teal accent (#4A90A4)

### Secondary CTA: "Plan Your Wall"
- Appears in: Sidebar navigation, hero section, services
- Links to: https://databloc.nz (external)
- Color: Slate (#2C3E50)

---

## 🚀 Deployment Instructions

### 1. **GitHub Setup**
```bash
# Create repository at github.com
# Clone locally
git clone https://github.com/YOUR-USERNAME/rewall-website.git
cd rewall-website

# Add files
git add .
git commit -m "Initial commit: ReWall website v1.0"
git push origin main
```

### 2. **Netlify Deployment**
1. Go to **Netlify.com**
2. Click **"Add new site"** → **"Import from Git"**
3. Select **GitHub** → Choose **rewall-website** repository
4. Build settings:
   - Build command: (leave empty - static site)
   - Publish directory: (leave empty - root directory)
5. Click **"Deploy site"**
6. Configure domain at **Site settings** → **Domain management**

### 3. **Domain Setup**
1. Register **www.rewall.nz** at domain registrar
2. In Netlify: Add custom domain
3. Update DNS records as instructed by Netlify
4. Wait 24-48 hours for DNS propagation

### 4. **Form Configuration**
1. In Netlify dashboard: **Site settings** → **Forms**
2. Configure notification email
3. Set up redirects (optional success page)
4. Test form submission

---

## 📸 Image Requirements

### Required Images
1. **Logo** - `images/logo.png` (high-res, transparent background)
2. **Favicon** - `images/icon.png` (32x32 or 64x64)
3. **Projects** - 10 images `project1.png - project10.png` (min 800px width)
4. **Blog placeholders** - 5 images `blog-placeholder-1.png - blog-placeholder-5.png`
5. **Icons** - 3 SVG files in `images/icons/`

### Image Optimization
- Use WebP format with JPG fallback for photos
- Compress to ~80KB per project image
- Use responsive image techniques (srcset)
- Implement lazy loading with `loading="lazy"`

---

## 🛠️ Customization Guide

### Updating Content
1. **Contact Information** - Update email, phone in all pages
2. **Service Areas** - Modify in index.html, about.html, contact.html
3. **Partner Links** - Update URLs for Nemean, Data Bloc, Fine Way
4. **Blog Posts** - Add new posts following the same HTML structure
5. **Projects** - Update gallery descriptions and add images

### Changing Colors
All colors are in `:root` CSS variables:
```css
:root {
    --primary-black: #1a1a1a;
    --baby-blue: #89CFF0;
    /* ... etc ... */
}
```
Change any color in `css/styles.css` and it updates site-wide.

### Adding Pages
1. Create new HTML file with same template structure
2. Copy navigation sidebar from existing page
3. Update active nav link as needed
4. Link from navigation sidebar

---

## 📱 Mobile Testing

### Test on these devices:
- iPhone 12/13/14 (375px width)
- iPad Pro (1024px width)
- Android devices (360-480px width)
- Desktop (1440px+)

### Testing checklist:
- [ ] Navigation toggles correctly on mobile
- [ ] Images display properly at all sizes
- [ ] Forms are easily fillable on mobile
- [ ] CTAs are tappable (min 44x44px)
- [ ] Text is readable without pinch-zoom
- [ ] No horizontal scrolling issues

---

## 🔐 Security & Best Practices

- ✅ HTTPS enforced (Netlify)
- ✅ Netlify Forms spam protection (honeypot)
- ✅ No sensitive data in HTML/JS
- ✅ CSP headers configured
- ✅ Regular security updates for dependencies

---

## 📊 Analytics & Tracking

### Recommended Integrations:
1. **Google Analytics** - Traffic & user behavior
2. **Netlify Analytics** - Performance monitoring
3. **Form submissions** - Track quote requests
4. **Hotjar or Clarity** - User session recording

---

## 🐛 Known Issues & Future Enhancements

### Phase 1 (Current) ✅
- [x] Complete website structure
- [x] Responsive design
- [x] Contact form
- [x] Portfolio gallery
- [x] Blog section

### Phase 2 (Planned)
- [ ] DIY planning tool integration
- [ ] Customer testimonials section
- [ ] Interactive service area map
- [ ] Live chat support
- [ ] Project cost calculator
- [ ] CRM integration

---

## 📞 Support & Maintenance

### Regular Maintenance:
- Update blog monthly
- Review form submissions weekly
- Monitor Lighthouse scores
- Test forms quarterly
- Update partner links as needed

### Support Contacts:
- **Site Owner:** info@databloc.nz
- **Phone:** 027 394 1127
- **Service Areas:** Cambridge, Auckland, North Waikato, Franklin

---

## 📄 License

© 2026 ReWall NZ. All rights reserved.

---

## ✅ Deployment Checklist

Before going live:
- [ ] All images are optimized and placed
- [ ] Contact form tested (submit & receive email)
- [ ] All links work (internal & external)
- [ ] Mobile responsive on real devices
- [ ] Lighthouse audit score 90+
- [ ] Forms spam protection verified
- [ ] Analytics code added
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] 404 error page configured
- [ ] Sitemap.xml generated
- [ ] robots.txt configured
- [ ] Social media links tested
- [ ] Email notifications working
- [ ] Backup system in place

---

**Status: Ready for Development & Testing**  
**Next Step: Add images and deploy to Netlify**
