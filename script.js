// ===== GLOBAL VARIABLES =====
const API_KEY = 'cb9f4574ddaa01601cb5fcca3f1fdadb8a5ef433';
const API_ENDPOINT = 'https://api-ssl.bitly.com/v4/shorten';

let currentShortUrl = '';
let isDarkMode = false;

// ===== DOM ELEMENTS =====
const urlForm = document.getElementById('urlForm');
const longUrlInput = document.getElementById('longUrl');
const customAliasInput = document.getElementById('customAlias');
const shortenBtn = document.getElementById('shortenBtn');
const btnContent = shortenBtn.querySelector('.btn-content');
const btnLoading = document.getElementById('btnLoading');
const urlValidation = document.getElementById('urlValidation');
const errorContainer = document.getElementById('errorContainer');

const resultsSection = document.getElementById('results');
const resultCard = document.getElementById('resultCard');
const shortUrlLink = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');

const qrBtn = document.getElementById('qrBtn');
const shareBtn = document.getElementById('shareBtn');
const statsBtn = document.getElementById('statsBtn');
const qrContainer = document.getElementById('qrContainer');
const qrCodeDiv = document.getElementById('qrCode');

const shareModal = document.getElementById('shareModal');
const shareModalClose = document.getElementById('shareModalClose');
const themeToggle = document.getElementById('themeToggle');

// ===== THEME MANAGEMENT =====
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const currentHour = new Date().getHours();
    const isNightTime = currentHour < 6 || currentHour > 18;
    
    if (savedTheme) {
        isDarkMode = savedTheme === 'dark';
    } else {
        isDarkMode = isNightTime;
    }
    
    applyTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Add theme transition effect
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
    
    // Add click animation
    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 150);
}

// ===== URL VALIDATION =====
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function validateUrlInput() {
    const url = longUrlInput.value.trim();
    
    if (!url) {
        urlValidation.textContent = '';
        urlValidation.className = 'input-validation';
        return;
    }
    
    if (isValidUrl(url)) {
        urlValidation.textContent = '✓ Valid URL';
        urlValidation.className = 'input-validation valid';
    } else {
        urlValidation.textContent = '✗ Invalid URL format';
        urlValidation.className = 'input-validation invalid';
    }
}

// ===== ERROR HANDLING =====
function showError(message) {
    errorContainer.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;
    errorContainer.classList.add('show');
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorContainer.classList.remove('show');
    setTimeout(() => {
        errorContainer.innerHTML = '';
    }, 300);
}

// ===== LOADING STATES =====
function setLoadingState(loading) {
    if (loading) {
        shortenBtn.classList.add('loading');
        shortenBtn.disabled = true;
        longUrlInput.disabled = true;
        customAliasInput.disabled = true;
    } else {
        shortenBtn.classList.remove('loading');
        shortenBtn.disabled = false;
        longUrlInput.disabled = false;
        customAliasInput.disabled = false;
    }
}

// ===== API INTEGRATION =====
async function shortenUrl(longUrl, customAlias = '') {
    const requestBody = {
        long_url: longUrl,
        domain: 'bit.ly'
    };
    
    if (customAlias) {
        requestBody.custom_bitlinks = [customAlias];
    }
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return {
            success: true,
            shortUrl: data.link,
            longUrl: data.long_url,
            id: data.id
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== FORM SUBMISSION =====
async function handleFormSubmit(e) {
    e.preventDefault();
    hideError();
    
    const longUrl = longUrlInput.value.trim();
    const customAlias = customAliasInput.value.trim();
    
    if (!longUrl) {
        showError('Please enter a URL to shorten');
        longUrlInput.focus();
        return;
    }
    
    if (!isValidUrl(longUrl)) {
        showError('Please enter a valid URL (include http:// or https://)');
        longUrlInput.focus();
        return;
    }
    
    setLoadingState(true);
    
    try {
        const result = await shortenUrl(longUrl, customAlias);
        
        if (result.success) {
            currentShortUrl = result.shortUrl;
            displayResult(result.shortUrl, longUrl);
            
            // Add success sound effect (optional)
            playSuccessSound();
            
            // Animate to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
            
        } else {
            showError(`Failed to shorten URL: ${result.error}`);
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
        console.error('Shortening error:', error);
    } finally {
        setLoadingState(false);
    }
}

// ===== RESULT DISPLAY =====
function displayResult(shortUrl, longUrl) {
    shortUrlLink.href = shortUrl;
    shortUrlLink.textContent = shortUrl;
    
    // Show results section with animation
    resultsSection.classList.add('show');
    
    // Generate QR code automatically
    generateQRCode(shortUrl);
    
    // Update stats (simulate)
    updateStats();
    
    // Reset form
    setTimeout(() => {
        urlForm.reset();
        urlValidation.textContent = '';
        urlValidation.className = 'input-validation';
    }, 1000);
}

// ===== QR CODE GENERATION =====
function generateQRCode(url) {
    // Clear previous QR code
    qrCodeDiv.innerHTML = '';

    // Create a canvas element for QR code
    const canvas = document.createElement('canvas');
    qrCodeDiv.appendChild(canvas);

    // Dynamically load QRCode library if not loaded
    if (typeof QRCode === 'undefined' || typeof QRCode.toCanvas !== 'function') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
        script.onload = function () {
            QRCode.toCanvas(canvas, url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            }, function (error) {
                if (error) {
                    console.error('QR Code generation failed:', error);
                    qrCodeDiv.innerHTML = '<p style="color: #ef4444;">Failed to generate QR code</p>';
                }
            });
        };
        script.onerror = function () {
            qrCodeDiv.innerHTML = '<p style="color: #ef4444;">Failed to load QR Code library</p>';
        };
        document.head.appendChild(script);
        return;
    }

    // Generate new QR code
    QRCode.toCanvas(canvas, url, {
        width: 200,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
    }, function (error) {
        if (error) {
            console.error('QR Code generation failed:', error);
            qrCodeDiv.innerHTML = '<p style="color: #ef4444;">Failed to generate QR code</p>';
        }
    });
}

// ===== CLIPBOARD FUNCTIONALITY =====
async function copyToClipboard() {
    if (!currentShortUrl) return;
    
    try {
        await navigator.clipboard.writeText(currentShortUrl);
        
        // Update button state
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
        copyBtn.classList.add('copied');
        
        // Play copy sound
        playClickSound();
        
        setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            copyBtn.classList.remove('copied');
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy:', error);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentShortUrl;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i><span>Copy</span>';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (fallbackError) {
            showError('Failed to copy URL. Please copy manually.');
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// ===== QR CODE TOGGLE =====
function toggleQRCode() {
    if (qrContainer.classList.contains('show')) {
        qrContainer.classList.remove('show');
        qrBtn.innerHTML = '<i class="fas fa-qrcode"></i><span>Show QR</span>';
    } else {
        qrContainer.classList.add('show');
        qrBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Hide QR</span>';
    }
    
    // Add button animation
    qrBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        qrBtn.style.transform = '';
    }, 150);
}

// ===== SOCIAL SHARING =====
function openShareModal() {
    shareModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Add modal animation
    shareModal.style.animation = 'none';
    setTimeout(() => {
        shareModal.style.animation = '';
    }, 100);
}

function closeShareModal() {
    shareModal.classList.remove('show');
    document.body.style.overflow = '';
}

function shareOnPlatform(platform) {
    if (!currentShortUrl) return;
    
    const shareText = `Check out this link: ${currentShortUrl}`;
    const shareUrl = encodeURIComponent(currentShortUrl);
    const shareTextEncoded = encodeURIComponent(shareText);
    
    let url;
    
    switch (platform) {
        case 'twitter':
            url = `https://twitter.com/intent/tweet?text=${shareTextEncoded}`;
            break;
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
            break;
        case 'linkedin':
            url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
            break;
        case 'whatsapp':
            url = `https://wa.me/?text=${shareTextEncoded}`;
            break;
        case 'email':
            url = `mailto:?subject=Check out this link&body=${shareTextEncoded}`;
            break;
        default:
            return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    closeShareModal();
    
    // Play click sound
    playClickSound();
}

// ===== STATS ANIMATION =====
function updateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const current = parseInt(stat.textContent);
        const increment = target / 100;
        
        if (current < target) {
            stat.textContent = Math.ceil(current + increment);
            setTimeout(() => updateStats(), 20);
        }
    });
}

function animateStatsOnScroll() {
    const statsSection = document.querySelector('.stats-section');
    const rect = statsSection.getBoundingClientRect();
    
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            animateNumber(stat, 0, target, 2000);
        });
        
        window.removeEventListener('scroll', animateStatsOnScroll);
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== SOUND EFFECTS =====
function playSuccessSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DvvmUSBjtv1+vEfDYELX+5zs6KOgkXZ7nq4JxODgtLoMfru2EQBDRt1qLEdjYSLKfe2OJ6OQkTb9Tsrm4cCkJ9q7hNSRMOV4/jqHGnF0Jjhh2lXOvF');
        audio.volume = 0.1;
        audio.play().catch(() => {}); // Ignore errors if sound fails
    } catch (error) {
        // Silently handle sound errors
    }
}

function playClickSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt551NEAxQp+PwtmQcBjiK2/LMeSsFJHfH8N2QQAoUXrTp67BTFApGn+Drv2QSBjxu2OvEfjYELX7AzM+KOgkXaLfn45dODgoToMXzvmETBDRt1qPEdzYTLKje2OJ6OQkTb9Tsrm4cCkN9q7dNSRMOV4/jqHGnFkJjhx2lXO');
        audio.volume = 0.05;
        audio.play().catch(() => {});
    } catch (error) {
        // Silently handle sound errors
    }
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    navMenu.classList.toggle('mobile-open');
    mobileMenuBtn.classList.toggle('active');
}

// ===== SMOOTH SCROLLING FOR NAVIGATION =====
function handleNavClick(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href');
    
    if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
}

// ===== PARTICLES ANIMATION =====
function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        animation: particleFloat ${Math.random() * 3 + 2}s linear infinite;
    `;
    
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = window.innerHeight + 'px';
    
    document.querySelector('.particles').appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 5000);
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();
    
    // Form submission
    urlForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time URL validation
    longUrlInput.addEventListener('input', validateUrlInput);
    longUrlInput.addEventListener('paste', () => {
        setTimeout(validateUrlInput, 100);
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Copy functionality
    copyBtn.addEventListener('click', copyToClipboard);
    
    // QR code toggle
    qrBtn.addEventListener('click', toggleQRCode);
    
    // Share functionality
    shareBtn.addEventListener('click', openShareModal);
    shareModalClose.addEventListener('click', closeShareModal);
    
    // Share modal backdrop click
    shareModal.addEventListener('click', function(e) {
        if (e.target === shareModal) {
            closeShareModal();
        }
    });
    
    // Social sharing buttons
    document.querySelectorAll('.share-social-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            shareOnPlatform(platform);
        });
    });
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Stats animation on scroll
    window.addEventListener('scroll', animateStatsOnScroll);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (document.activeElement === longUrlInput || document.activeElement === customAliasInput) {
                handleFormSubmit(new Event('submit'));
            }
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            closeShareModal();
        }
        
        // Ctrl/Cmd + D to toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    // Create particles periodically
    setInterval(createParticle, 300);
    
    // Auto-focus on URL input
    longUrlInput.focus();
    
    // Add loading animation to page
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', function() {
    // Adjust particles container
    const particles = document.querySelector('.particles');
    if (particles) {
        particles.style.width = window.innerWidth + 'px';
        particles.style.height = window.innerHeight + 'px';
    }
});

// ===== OFFLINE DETECTION =====
window.addEventListener('online', function() {
    hideError();
    showSuccessMessage('Connection restored!');
});

window.addEventListener('offline', function() {
    showError('No internet connection. Please check your network.');
});

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    successDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--gradient-success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}

// ===== CSS ANIMATIONS FOR JS ELEMENTS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .mobile-open {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-card);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 16px 16px;
        padding: 1rem;
        gap: 0.5rem;
    }
    
    .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
`;
document.head.appendChild(style);

console.log('🎉 Enhanced URL Shortener loaded successfully!');
console.log('💡 Features: Dark Mode, QR Codes, Animations, Social Sharing');
console.log('⚡ API: Bitly Integration Ready');