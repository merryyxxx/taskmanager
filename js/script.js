// Main JavaScript File for TechConsult Pro Website
// Implements interactive elements, form validation, and responsive design

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initMobileNavigation();
    initInteractiveElements();
    initFormValidation();
    initScrollAnimations();
    initCounterAnimations();
    initFloatingCards();
});

// Mobile Navigation Toggle
function initMobileNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            hamburger.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// Interactive 3D Elements and Hover Effects
function initInteractiveElements() {
    // Interactive CTA buttons with 3D effect
    const ctaPrimary = document.getElementById('ctaPrimary');
    const ctaSecondary = document.getElementById('ctaSecondary');
    
    if (ctaPrimary) {
        ctaPrimary.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
            this.style.boxShadow = '0 10px 25px rgba(255,107,107,0.8)';
        });
        
        ctaPrimary.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(255,107,107,0.4)';
        });
    }
    
    if (ctaSecondary) {
        ctaSecondary.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.05)';
            this.style.boxShadow = '0 10px 25px rgba(255,255,255,0.3)';
        });
        
        ctaSecondary.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'none';
        });
    }
    
    // Interactive feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) rotateY(5deg)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateY(0deg)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
        
        // Add click interaction
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-15px) rotateY(5deg)';
            }, 150);
        });
    });
    
    // Logo 3D interaction
    const logo3d = document.getElementById('logo3d');
    if (logo3d) {
        logo3d.addEventListener('mouseenter', function() {
            const cube = this.querySelector('.cube');
            cube.style.animationPlayState = 'paused';
            cube.style.transform = 'rotateX(45deg) rotateY(45deg) scale(1.1)';
        });
        
        logo3d.addEventListener('mouseleave', function() {
            const cube = this.querySelector('.cube');
            cube.style.animationPlayState = 'running';
            cube.style.transform = '';
        });
    }
}

// Floating Cards Interactive Animation
function initFloatingCards() {
    const cards = ['card1', 'card2', 'card3'];
    
    cards.forEach((cardId, index) => {
        const card = document.getElementById(cardId);
        if (card) {
            // Add click interaction for floating cards
            card.addEventListener('click', function() {
                // Create ripple effect
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(255,255,255,0.6)';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.left = '50%';
                ripple.style.top = '50%';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.marginLeft = '-10px';
                ripple.style.marginTop = '-10px';
                
                this.appendChild(ripple);
                
                // Remove ripple after animation
                setTimeout(() => {
                    ripple.remove();
                }, 600);
                
                // Card bounce effect
                this.style.transform = 'translateY(-30px) scale(1.1)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 300);
            });
            
            // Random position adjustment for more dynamic feel
            setInterval(() => {
                if (!card.matches(':hover')) {
                    const randomX = Math.random() * 20 - 10;
                    const randomY = Math.random() * 20 - 10;
                    card.style.transform = `translate(${randomX}px, ${randomY}px)`;
                    
                    setTimeout(() => {
                        if (!card.matches(':hover')) {
                            card.style.transform = '';
                        }
                    }, 2000);
                }
            }, 5000 + index * 1000);
        }
    });
    
    // Add ripple animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Form Validation and Interactive Features
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        // Real-time validation
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearError(this);
                // Real-time validation for better UX
                if (this.value.length > 0) {
                    validateField(this);
                }
            });
        });
        
        // Form submission with enhanced validation
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = true;
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (isValid) {
                showSuccessMessage(form);
                // Simulate form submission
                simulateFormSubmission(form);
            } else {
                // Scroll to first error
                const firstError = form.querySelector('.error-message');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
}

// Enhanced Field Validation
function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldName = field.name || field.id;
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous errors
    clearError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        errorMessage = `${getFieldLabel(field)} is required.`;
        isValid = false;
    }
    
    // Specific field validations
    if (value && isValid) {
        switch (fieldType) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errorMessage = 'Please enter a valid email address.';
                    isValid = false;
                }
                break;
                
            case 'tel':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                    errorMessage = 'Please enter a valid phone number.';
                    isValid = false;
                }
                break;
                
            case 'number':
                if (field.min && parseInt(value) < parseInt(field.min)) {
                    errorMessage = `Value must be at least ${field.min}.`;
                    isValid = false;
                } else if (field.max && parseInt(value) > parseInt(field.max)) {
                    errorMessage = `Value must be no more than ${field.max}.`;
                    isValid = false;
                }
                break;
        }
        
        // Name validation
        if (fieldName.toLowerCase().includes('name') && value.length < 2) {
            errorMessage = 'Name must be at least 2 characters long.';
            isValid = false;
        }
        
        // Age validation
        if (fieldName.toLowerCase().includes('age')) {
            const age = parseInt(value);
            if (age < 13 || age > 120) {
                errorMessage = 'Please enter a valid age (13-120).';
                isValid = false;
            }
        }
    }
    
    if (!isValid) {
        showError(field, errorMessage);
        field.style.borderColor = '#e74c3c';
        field.style.boxShadow = '0 0 0 3px rgba(231,76,60,0.1)';
    } else {
        field.style.borderColor = '#27ae60';
        field.style.boxShadow = '0 0 0 3px rgba(39,174,96,0.1)';
    }
    
    return isValid;
}

// Helper Functions for Form Validation
function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name || 'This field';
}

function showError(field, message) {
    clearError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearError(field) {
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    field.style.borderColor = '#ddd';
    field.style.boxShadow = 'none';
}

function showSuccessMessage(form) {
    // Remove existing success messages
    const existingSuccess = form.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <strong>Success!</strong> Your request has been submitted successfully. 
        We'll get back to you within 24 hours.
    `;
    
    form.insertBefore(successDiv, form.firstChild);
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function simulateFormSubmission(form) {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Simulate API call delay
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            // Reset form after successful submission
            form.reset();
            // Clear all field styling
            const fields = form.querySelectorAll('input, select, textarea');
            fields.forEach(field => {
                field.style.borderColor = '#ddd';
                field.style.boxShadow = 'none';
            });
        }, 2000);
    }
}

// Scroll Animations and Intersection Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special handling for different elements
                if (entry.target.classList.contains('feature-card')) {
                    animateFeatureCard(entry.target);
                } else if (entry.target.classList.contains('stat-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const elementsToAnimate = document.querySelectorAll('.feature-card, .stat-item, .floating-card');
    elementsToAnimate.forEach(el => observer.observe(el));
    
    // Add CSS for scroll animations
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .stat-item, .floating-card {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .feature-card.animate-in, .stat-item.animate-in, .floating-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

function animateFeatureCard(card) {
    // Staggered animation for feature cards
    const delay = Array.from(card.parentNode.children).indexOf(card) * 200;
    setTimeout(() => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.opacity = '1';
    }, delay);
}

// Counter Animation for Statistics
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.textContent;
        const isNumber = /^\d+/.test(target);
        
        if (isNumber) {
            const finalNumber = parseInt(target.match(/\d+/)[0]);
            counter.textContent = '0' + target.replace(/\d+/, '');
            
            // Store original text for animation
            counter.dataset.target = target;
            counter.dataset.finalNumber = finalNumber;
        }
    });
}

function animateCounter(statItem) {
    const counter = statItem.querySelector('.stat-number');
    if (!counter || !counter.dataset.finalNumber) return;
    
    const finalNumber = parseInt(counter.dataset.finalNumber);
    const target = counter.dataset.target;
    const duration = 2000;
    const increment = finalNumber / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= finalNumber) {
            current = finalNumber;
            clearInterval(timer);
        }
        
        counter.textContent = target.replace(/\d+/, Math.floor(current));
    }, 16);
}

// Dynamic Content Loading and Interactive Features
function initDynamicFeatures() {
    // Dynamic content updates
    updatePageContent();
    
    // Interactive elements
    initParallaxEffects();
    initSmoothScrolling();
    
    // Performance monitoring
    monitorPagePerformance();
}

function updatePageContent() {
    // Simulate dynamic content loading
    const currentTime = new Date();
    const timeElements = document.querySelectorAll('.current-time');
    
    timeElements.forEach(element => {
        element.textContent = currentTime.toLocaleString();
    });
    
    // Update year in footer
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(element => {
        element.textContent = currentTime.getFullYear();
    });
}

function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.floating-card');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.2);
            element.style.transform = `translateY(${rate * speed}px)`;
        });
    });
}

function initSmoothScrolling() {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function monitorPagePerformance() {
    // Simple performance monitoring
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Page loaded in ${Math.round(loadTime)}ms`);
        
        // Show performance indicator if page loads slowly
        if (loadTime > 3000) {
            console.warn('Page loading time is above optimal threshold');
        }
    });
}

// Responsive Design JavaScript Implementation
function initResponsiveFeatures() {
    // Handle responsive layout changes
    handleResponsiveLayout();
    
    // Touch events for mobile
    initTouchEvents();
    
    // Orientation change handling
    handleOrientationChange();
}

function handleResponsiveLayout() {
    const handleResize = () => {
        const windowWidth = window.innerWidth;
        const isMobile = windowWidth <= 768;
        const isTablet = windowWidth > 768 && windowWidth <= 1024;
        
        // Adjust layouts based on screen size
        if (isMobile) {
            adjustMobileLayout();
        } else if (isTablet) {
            adjustTabletLayout();
        } else {
            adjustDesktopLayout();
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
}

function adjustMobileLayout() {
    // Mobile-specific adjustments
    const heroText = document.querySelector('.hero-text h2');
    if (heroText) {
        heroText.style.fontSize = '2rem';
    }
    
    // Disable certain animations on mobile for performance
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach(card => {
        card.style.animation = 'none';
        card.style.position = 'static';
        card.style.margin = '1rem 0';
    });
}

function adjustTabletLayout() {
    // Tablet-specific adjustments
    const heroText = document.querySelector('.hero-text h2');
    if (heroText) {
        heroText.style.fontSize = '2.5rem';
    }
}

function adjustDesktopLayout() {
    // Desktop-specific adjustments
    const heroText = document.querySelector('.hero-text h2');
    if (heroText) {
        heroText.style.fontSize = '3rem';
    }
    
    // Re-enable animations on desktop
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.position = 'absolute';
        card.style.animation = `float 3s ease-in-out infinite ${index}s`;
    });
}

function initTouchEvents() {
    // Touch-friendly interactions
    const cards = document.querySelectorAll('.feature-card, .floating-card');
    
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

function handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
        // Delay to allow for orientation change to complete
        setTimeout(() => {
            handleResponsiveLayout();
            // Recalculate floating card positions
            repositionFloatingCards();
        }, 500);
    });
}

function repositionFloatingCards() {
    const cards = document.querySelectorAll('.floating-card');
    cards.forEach((card, index) => {
        // Reset positions for new orientation
        card.style.transform = '';
        setTimeout(() => {
            card.style.opacity = '1';
        }, index * 100);
    });
}

// Initialize all responsive features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initResponsiveFeatures();
    initDynamicFeatures();
});

// Utility Functions
const utils = {
    // Debounce function for performance optimization
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function for scroll events
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Format numbers with commas
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};

// Export functions for use in other files
window.TechConsultPro = {
    initMobileNavigation,
    initFormValidation,
    validateField,
    utils
};