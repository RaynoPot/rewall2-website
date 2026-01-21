// ===================================
// REWALL NZ - MAIN JAVASCRIPT FILE
// Animations, interactions, and functionality
// ===================================

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
// FORM HANDLING
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('form[name="contact"]');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            // Let Netlify handle the form submission
            // This is just for validation feedback if needed
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
            }
        });
    }
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
            stage.addEventListener('click', function() {
                // Toggle selection in custom mode
                if (currentServiceMode === 'custom') {
                    const stageNum = parseInt(this.getAttribute('data-stage'));
                    if (selectedStages.has(stageNum)) {
                        selectedStages.delete(stageNum);
                    } else {
                        selectedStages.add(stageNum);
                    }
                    this.classList.toggle('selected');
                    
                    // Show popup when stages are selected in Mix & Match mode
                    if (selectedStages.size > 0) {
                        const selectedCount = selectedStages.size;
                        const stageNames = getSelectedStageNames();
                        showServicePopup(`Mix & Match - ${selectedCount} Stage${selectedCount !== 1 ? 's' : ''}`, stageNames);
                    }
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
});

function selectServiceMode(mode) {
    currentServiceMode = mode;
    const buttons = document.querySelectorAll('.service-option-btn');
    const journeyStages = document.querySelectorAll('.journey-stage');
    const modeDisplay = document.getElementById('service-mode-display');
    const descEl = document.getElementById('stage-description');
    
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
        // Select all stages
        selectedStages = new Set([1, 2, 3, 4, 5, 6]);
        journeyStages.forEach(stage => {
            stage.classList.add('selected');
            // Check all checkboxes
            const checkbox = stage.querySelector('.stage-checkbox-input');
            if (checkbox) checkbox.checked = true;
        });
        if (modeDisplay) modeDisplay.textContent = '✓ Complete Journey';
        if (descEl) descEl.textContent = 'You\'re getting all stages handled by ReWall. Hover over any stage to see details.';
        
        // Enable Request Quote button
        enableRequestQuoteButton();
        
        // Show popup for Complete Package
        setTimeout(() => {
            showServicePopup('Complete Package - All 6 Stages');
        }, 300);
    } else {
        // Custom mode - clear selections
        selectedStages = new Set();
        journeyStages.forEach(stage => {
            stage.classList.remove('selected');
            // Uncheck all checkboxes
            const checkbox = stage.querySelector('.stage-checkbox-input');
            if (checkbox) checkbox.checked = false;
        });
        if (modeDisplay) modeDisplay.textContent = '🎯 Mix & Match';
        if (descEl) descEl.textContent = 'Click the checkboxes next to stages to select the services you need. Select at least one service to continue.';
        
        // Disable Request Quote button
        disableRequestQuoteButton();
    }
    
    console.log('Service mode:', mode, 'Selected stages:', Array.from(selectedStages));
}

function updateStageSelection() {
    // Get all checked checkboxes
    const checkedBoxes = document.querySelectorAll('.stage-checkbox-input:checked');
    selectedStages = new Set();
    
    checkedBoxes.forEach(checkbox => {
        const stage = parseInt(checkbox.getAttribute('data-stage'));
        selectedStages.add(stage);
        
        // Mark the stage as selected
        const stageElement = document.querySelector(`.journey-stage[data-stage="${stage}"]`);
        if (stageElement) {
            stageElement.classList.add('selected');
        }
    });
    
    // Uncheck unchecked stages
    document.querySelectorAll('.stage-checkbox-input:not(:checked)').forEach(checkbox => {
        const stage = parseInt(checkbox.getAttribute('data-stage'));
        const stageElement = document.querySelector(`.journey-stage[data-stage="${stage}"]`);
        if (stageElement) {
            stageElement.classList.remove('selected');
        }
    });
    
    // Update button state
    if (selectedStages.size > 0) {
        enableRequestQuoteButton();
        updateSelectionMessage();
    } else {
        disableRequestQuoteButton();
        clearSelectionMessage();
    }
    
    console.log('Selected stages:', Array.from(selectedStages));
}

function enableRequestQuoteButton() {
    const btn = document.getElementById('request-quote-btn');
    if (btn) {
        btn.disabled = false;
        btn.style.backgroundColor = 'var(--teal-accent)';
        btn.style.color = 'var(--white)';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

function disableRequestQuoteButton() {
    const btn = document.getElementById('request-quote-btn');
    if (btn) {
        btn.disabled = true;
        btn.style.backgroundColor = 'var(--light-gray)';
        btn.style.color = '#999';
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
}

function updateSelectionMessage() {
    const msgEl = document.getElementById('selection-message');
    if (msgEl) {
        const count = selectedStages.size;
        const total = 6;
        const percent = Math.round((count / total) * 100);
        
        if (count === total) {
            msgEl.textContent = '✓ All stages selected! Ready to request a quote.';
            msgEl.style.color = '#7CB342';
        } else if (count === 1) {
            msgEl.textContent = `${count} stage selected (${percent}% of full package)`;
            msgEl.style.color = 'var(--slate)';
        } else {
            msgEl.textContent = `${count} stages selected (${percent}% of full package)`;
            msgEl.style.color = 'var(--slate)';
        }
    }
}

function clearSelectionMessage() {
    const msgEl = document.getElementById('selection-message');
    if (msgEl) {
        msgEl.textContent = 'Select at least one service to enable the quote request button';
        msgEl.style.color = '#999';
    }
}

function handleQuoteRequest() {
    if (selectedStages.size > 0) {
        const stageNames = getSelectedStageNames();
        const summary = stageNames.join(', ');
        
        // Show popup with selected services
        showServicePopup('Your Selected Services', summary);
    }
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
