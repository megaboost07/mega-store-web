// MEGA STORE - User Panel Main JavaScript
// Common functions and utilities

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format Number
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format Date
function formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Truncate Text
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Require login - redirects to login if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        const currentUrl = window.location.href;
        window.location.href = `login-account.html?redirect=${encodeURIComponent(currentUrl)}`;
        return false;
    }
    return true;
}

// Share content
async function shareContent(title, text, url) {
    const shareData = {
        title: title,
        text: text,
        url: url || window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return true;
        } catch (err) {
            console.log('Share cancelled');
            return false;
        }
    } else {
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(url || window.location.href);
            showToast('Link copied to clipboard!');
            return true;
        } catch (err) {
            showToast('Failed to copy link', 'error');
            return false;
        }
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
        return true;
    } catch (err) {
        showToast('Failed to copy', 'error');
        return false;
    }
}

// Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Apply saved theme on all pages
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Initialize lazy loading
    lazyLoadImages();

    // Add active class to current nav item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            item.classList.add('active');
        }
    });
});

// Handle online/offline status
window.addEventListener('online', () => {
    showToast('You are back online!');
});

window.addEventListener('offline', () => {
    showToast('You are offline. Some features may not work.', 'error');
});

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}
