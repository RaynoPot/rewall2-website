// ===================================
// REWALL NZ - MAIN JAVASCRIPT FILE
// Animations, interactions, and functionality
// ===================================

// ===================================
// RATE LIMITER - Prevent form abuse
// ===================================
const RateLimiter = {
    getActionHistory(action) {
        try {
            const data = localStorage.getItem(`rateLimit_${action}`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    setActionHistory(action, history) {
        try {
            localStorage.setItem(`rateLimit_${action}`, JSON.stringify(history));
        } catch (e) {
            console.warn('Could not save rate limit history');
        }
    },
    
    cleanHistory(history, windowMs) {
        const now = Date.now();
        return history.filter(timestamp => now - timestamp < windowMs);
    },
    
    isAllowed(action, maxAttempts, windowMs) {
        let history = this.getActionHistory(action);
        history = this.cleanHistory(history, windowMs);
        return history.length < maxAttempts;
    },
    
    recordAction(action, windowMs) {
        let history = this.getActionHistory(action);
        history = this.cleanHistory(history, windowMs);
        history.push(Date.now());
        this.setActionHistory(action, history);
    },
    
    formatTimeRemaining(ms) {
        const minutes = Math.ceil(ms / 60000);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        const hours = Math.ceil(minutes / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    },
    
    getTimeUntilReset(action, windowMs) {
        let history = this.getActionHistory(action);
        if (history.length === 0) return 0;
        const oldest = Math.min(...history);
        return Math.max(0, oldest + windowMs - Date.now());
    }
};

// Rate limits for contact forms
const CONTACT_RATE_LIMITS = {
    contactForm: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },  // 5 submissions per hour
    designPortalNotify: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }  // 3 per hour
};

// Design Portal Modal Functions
function openDesignPortal() {
    const modal = document.getElementById('design-portal-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDesignPortal() {
    const modal = document.getElementById('design-portal-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('design-portal-modal');
    if (modal && event.target === modal) {
        closeDesignPortal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDesignPortal();
    }
});

// Mobile Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.querySelector('nav.sidebar');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            sidebar.classList.toggle('active');
        });

        // Close menu when a link is clicked
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                sidebar.classList.remove('active');
            });
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (sidebar && hamburger) {
            const isClickInsideSidebar = sidebar.contains(event.target);

            const isClickOnHamburger = hamburger.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnHamburger && sidebar.classList.contains('active')) {
                hamburger.classList.remove('active');
                sidebar.classList.remove('active');
            }
        }
    });
});

// ===================================
// LIGHTBOX FUNCTIONALITY
// ===================================

function openLightbox(imageSrc, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (lightbox) {
        lightboxImage.src = imageSrc;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('active');

        // Close on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeLightbox();
            }
        });
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
    }
}

// Close lightbox when clicking outside image
document.addEventListener('click', function(event) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && event.target === lightbox) {
        closeLightbox();
    }
});

// ===================================
// BLOG MODAL FUNCTIONALITY
// ===================================

function openBlogPost(postId) {
    const modal = document.getElementById(postId + '-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        window.scrollTo(0, 0); // Scroll to top of page
    }
}

function closeBlogPost(postId) {
    const modal = document.getElementById(postId + '-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scroll
    }
}

// Close blog modal when clicking outside the content
document.addEventListener('click', function(event) {
    // Check if click is on any blog modal background
    if (event.target.classList && event.target.classList.contains('blog-modal')) {
        const postId = event.target.id.replace('-modal', '');
        closeBlogPost(postId);
    }
});

// Close blog modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Find and close any active blog modal
        const activeModals = document.querySelectorAll('.blog-modal.active');
        activeModals.forEach(modal => {
            const postId = modal.id.replace('-modal', '');
            closeBlogPost(postId);
        });
    }
});

// ===================================
// SVG ANIMATION - HERO SECTION
// ===================================

function animateSVGLines() {
    const lines = document.querySelectorAll('svg.animation line');
    
    lines.forEach((line, index) => {
        // Generate random rotation for each line
        const randomRotation = Math.random() * 40 - 20; // -20 to 20 degrees
        line.style.setProperty('--rotation', randomRotation + 'deg');
    });
}

// Initialize SVG animation on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateSVGLines);
} else {
    animateSVGLines();
}

// ===================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe cards and sections
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card, .blog-card, .project-card, .value-card');
    cards.forEach(card => {
        observer.observe(card);
    });
});

// ===================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Only smooth scroll if it's not just "#" and the element exists
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// FORM HANDLING WITH RATE LIMITING
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Contact form rate limiting
    const contactForm = document.querySelector('form[action*="formsubmit.co"]');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const { maxAttempts, windowMs } = CONTACT_RATE_LIMITS.contactForm;
            
            // Check rate limit
            if (!RateLimiter.isAllowed('contactForm', maxAttempts, windowMs)) {
                e.preventDefault();
                const timeRemaining = RateLimiter.formatTimeRemaining(RateLimiter.getTimeUntilReset('contactForm', windowMs));
                alert(`⏳ Submission limit reached.\n\nTo prevent spam, form submissions are limited to ${maxAttempts} per hour.\n\nPlease try again in ${timeRemaining}, or contact us directly:\n📧 info@rewall.nz\n📞 027 394 1127`);
                return false;
            }
            
            // Record the submission
            RateLimiter.recordAction('contactForm', windowMs);
            
            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
            }
        });
    }
    
    // Design Portal notify form rate limiting
    const notifyForms = document.querySelectorAll('.design-portal-notify');
    notifyForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const { maxAttempts, windowMs } = CONTACT_RATE_LIMITS.designPortalNotify;
            
            if (!RateLimiter.isAllowed('designPortalNotify', maxAttempts, windowMs)) {
                e.preventDefault();
                const timeRemaining = RateLimiter.formatTimeRemaining(RateLimiter.getTimeUntilReset('designPortalNotify', windowMs));
                alert(`⏳ You've already signed up for notifications.\n\nPlease try again in ${timeRemaining} if you need to update your email.`);
                return false;
            }
            
            RateLimiter.recordAction('designPortalNotify', windowMs);
        });
    });
});

// ===================================
// LAZY LOADING FOR IMAGES
// ===================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // For images with loading="lazy", browser handles it natively
                // This observer is a backup for additional lazy loading logic
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    // Observe all images
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
    });
} else {
    // Fallback for browsers that don't support IntersectionObserver
    console.log('IntersectionObserver not supported, lazy loading uses native browser support');
}

// ===================================
// UTILITY: ADD ANIMATION ON SCROLL
// ===================================

function animateOnScroll() {
    const elements = document.querySelectorAll('[class*="animate-"]');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                scrollObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(element => {
        scrollObserver.observe(element);
    });
}

document.addEventListener('DOMContentLoaded', animateOnScroll);

// ===================================
// CIRCLE DIAGRAM INTERACTION (SERVICES PAGE)
// ===================================

let currentServiceMode = 'all'; // 'all' or 'custom'
let selectedStages = new Set([1, 2, 3, 4, 5, 6]); // All selected by default

document.addEventListener('DOMContentLoaded', function() {
    const circleSegments = document.querySelectorAll('.circle-segment');
    const journeyStages = document.querySelectorAll('.journey-stage');
    const stageCheckboxes = document.querySelectorAll('.stage-checkbox');
    const requestQuoteBtn = document.getElementById('request-quote-btn');
    
    // Initialize page with Complete Package selected (all checkboxes checked)
    if (currentServiceMode === 'all') {
        stageCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        journeyStages.forEach(stage => {
            stage.classList.add('selected');
        });
        if (requestQuoteBtn) {
            requestQuoteBtn.classList.remove('disabled');
            requestQuoteBtn.disabled = false;
        }
    }
    
    // Function to update Request Quote button state
    function updateRequestQuoteButton() {
        const checkedBoxes = document.querySelectorAll('.stage-checkbox:checked');
        if (requestQuoteBtn) {
            if (checkedBoxes.length > 0) {
                requestQuoteBtn.classList.remove('disabled');
                requestQuoteBtn.disabled = false;
            } else {
                requestQuoteBtn.classList.add('disabled');
                requestQuoteBtn.disabled = true;
            }
        }
    }
    
    // Handle checkbox changes
    if (stageCheckboxes.length > 0) {
        stageCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation();
                const stageNum = parseInt(this.getAttribute('data-stage'));
                const stageElement = this.closest('.journey-stage');
                
                if (this.checked) {
                    selectedStages.add(stageNum);
                    stageElement.classList.add('selected');
                } else {
                    selectedStages.delete(stageNum);
                    stageElement.classList.remove('selected');
                }
                
                updateRequestQuoteButton();
                
                // Update mode if all boxes are checked
                if (selectedStages.size === 6) {
                    currentServiceMode = 'all';
                } else if (selectedStages.size > 0) {
                    currentServiceMode = 'custom';
                }
                
                console.log('Selected stages:', Array.from(selectedStages));
            });
        });
    }
    
    // Request Quote button click handler
    if (requestQuoteBtn) {
        requestQuoteBtn.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                const selectedCount = selectedStages.size;
                const stageNames = getSelectedStageNames();
                alert(`Request Quote - You've selected ${selectedCount} stage(s):\\n${stageNames}\\n\\nYou'll be redirected to the contact form.`);
                // Optionally redirect to contact page
                // window.location.href = 'contact.html';
            }
        });
    }
    
    if (circleSegments.length > 0) {
        circleSegments.forEach(segment => {
            segment.addEventListener('click', function() {
                // Remove active class from all segments
                circleSegments.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked segment
                this.classList.add('active');
                
                // Optional: log which service was selected
                const service = this.getAttribute('data-service');
                console.log('Selected service:', service);
            });

            // Activate first segment on page load
            if (segment === circleSegments[0]) {
                segment.classList.add('active');
            }
        });
    }

    // Journey circle interactive stages
    if (journeyStages.length > 0) {
        journeyStages.forEach(stage => {
            stage.addEventListener('click', function(e) {
                // Don't toggle if clicking on checkbox
                if (e.target.classList.contains('stage-checkbox')) {
                    return;
                }
                
                // Toggle checkbox when clicking on stage
                const checkbox = this.querySelector('.stage-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
                
                updateJourneyInfo(this);
            });

            stage.addEventListener('mouseenter', function() {
                updateJourneyInfo(this);
            });
        });

        // Update center info on first load
        if (journeyStages.length > 0) {
            updateJourneyInfo(journeyStages[0]);
        }
    }
    
    // Initialize button state
    updateRequestQuoteButton();
});

function selectServiceMode(mode) {
    currentServiceMode = mode;
    const buttons = document.querySelectorAll('.service-option-btn');
    const journeyStages = document.querySelectorAll('.journey-stage');
    const stageCheckboxes = document.querySelectorAll('.stage-checkbox');
    const modeDisplay = document.getElementById('service-mode-display');
    const descEl = document.getElementById('stage-description');
    const requestQuoteBtn = document.getElementById('request-quote-btn');
    
    // Update button states
    buttons.forEach(btn => {
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reset or maintain selections
    if (mode === 'all') {
        // Select all stages and check all checkboxes
        selectedStages = new Set([1, 2, 3, 4, 5, 6]);
        journeyStages.forEach(stage => {
            stage.classList.add('selected');
        });
        stageCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        if (modeDisplay) modeDisplay.textContent = '✓ Complete Journey';
        if (descEl) descEl.textContent = 'You\'re getting all stages handled by ReWall. Hover over any stage to see details.';
        
        // Enable Request Quote button
        if (requestQuoteBtn) {
            requestQuoteBtn.classList.remove('disabled');
            requestQuoteBtn.disabled = false;
        }
        
        // Show popup for Complete Package
        setTimeout(() => {
            showServicePopup('Complete Package - All 6 Stages');
        }, 300);
    } else {
        // Custom mode - clear all selections and uncheck all
        selectedStages = new Set();
        journeyStages.forEach(stage => {
            stage.classList.remove('selected');
        });
        stageCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (modeDisplay) modeDisplay.textContent = '🎯 Mix & Match';
        if (descEl) descEl.textContent = 'Click stages or checkboxes to select the services you need. The button will activate once you make a selection.';
        
        // Disable Request Quote button
        if (requestQuoteBtn) {
            requestQuoteBtn.classList.add('disabled');
            requestQuoteBtn.disabled = true;
        }
    }
    
    console.log('Service mode:', mode, 'Selected stages:', Array.from(selectedStages));
}

function updateJourneyInfo(stageElement) {
    const title = stageElement.getAttribute('data-title');
    const description = stageElement.getAttribute('data-description');
    const stageNum = stageElement.getAttribute('data-stage');
    
    // Update center info
    const titleEl = document.getElementById('stage-title');
    const descEl = document.getElementById('stage-description');
    
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;

    // Update active state (but only for hover, not click if in custom mode)
    const allStages = document.querySelectorAll('.journey-stage');
    allStages.forEach(s => {
        if (currentServiceMode === 'all') {
            s.classList.remove('active');
        }
    });
    if (currentServiceMode === 'all') {
        stageElement.classList.add('active');
    }
    
    console.log('Journey stage:', stageNum, title);
}

// ===================================
// CTA BUTTON INTERACTIONS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Add ripple effect to buttons on click
    const buttons = document.querySelectorAll('button, .btn, input[type="submit"]');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Optional: Add any click-specific behavior here
            console.log('Button clicked:', this.textContent);
        });

        button.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
    });
});

// ===================================
// RESPONSIVE SIDEBAR ADJUSTMENT
// ===================================

window.addEventListener('resize', function() {
    const sidebar = document.querySelector('nav.sidebar');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 1024) {
        // On desktop, sidebar should be visible
        if (sidebar) sidebar.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    }
});

// ===================================
// ACCESSIBILITY IMPROVEMENTS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Ensure all links have proper focus states
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('focus', function() {
            this.style.outline = '2px solid #4A90A4';
            this.style.outlineOffset = '2px';
        });

        link.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });

    // Ensure buttons are accessible with keyboard
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});

// ===================================
// PERFORMANCE MONITORING
// ===================================

if (window.performance && window.performance.timing) {
    window.addEventListener('load', function() {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time:', pageLoadTime, 'ms');
    });
}

// ===================================
// COOKIE/CONSENT NOTICE (OPTIONAL)
// ===================================

function checkCookieConsent() {
    // This is where you'd add cookie consent logic if needed
    // For now, just log that the function is available
    console.log('Cookie consent check - implement as needed');
}

// ===================================
// ERROR LOGGING (OPTIONAL)
// ===================================

window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.message, event.filename, event.lineno);
});

// ===================================
// LOG INITIALIZATION
// ===================================

// ===================================
// SERVICE SELECTION POPUP
// ===================================

function showServicePopup(title, details = '') {
    const popup = document.getElementById('service-popup');
    const summary = document.getElementById('popup-selection-summary');
    
    if (popup && summary) {
        if (details) {
            summary.innerHTML = `<strong>${title}</strong><br><small>${details}</small>`;
        } else {
            summary.textContent = title;
        }
        popup.classList.add('active');
    }
}

function closeServicePopup() {
    const popup = document.getElementById('service-popup');
    if (popup) {
        popup.classList.remove('active');
    }
}

function getSelectedStageNames() {
    const stageNames = {
        1: 'Site Planning',
        2: 'Engineering Design',
        3: 'Cost Estimate',
        4: 'Council Consent',
        5: 'Construction',
        6: 'Final Sign-Off'
    };
    
    const selected = Array.from(selectedStages)
        .sort((a, b) => a - b)
        .map(num => stageNames[num])
        .join(', ');
    
    return `Selected services: ${selected}`;
}

// Close popup when clicking outside of it
document.addEventListener('click', function(event) {
    const popup = document.getElementById('service-popup');
    if (popup && event.target === popup) {
        closeServicePopup();
    }
});

// Close popup on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeServicePopup();
    }
});

console.log('ReWall NZ Website - Initialized Successfully');
console.log('Version: 1.0');
console.log('Last Updated: January 2026');
