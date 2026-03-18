/**
 * MEGA STORE - Home Page JavaScript
 * Handles banner slider, app loading, drawer menu, and theme toggles
 */

// ===== Drawer Menu =====
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const menuBtn = document.getElementById('menuBtn');

function openDrawer() {
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

menuBtn.addEventListener('click', openDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// ===== Theme Toggles =====
const darkModeToggle = document.getElementById('darkModeToggle');
const nightModeToggle = document.getElementById('nightModeToggle');

function updateThemeIcons() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const darkIcon = darkModeToggle.querySelector('.fa-toggle-off, .fa-toggle-on');
    const nightIcon = nightModeToggle.querySelector('.fa-toggle-off, .fa-toggle-on');
    
    if (currentTheme === 'dark') {
        darkIcon.className = 'fas fa-toggle-on';
        darkIcon.style.color = 'var(--primary)';
        nightIcon.className = 'fas fa-toggle-off';
        nightIcon.style.color = 'var(--text-tertiary)';
    } else if (currentTheme === 'night') {
        darkIcon.className = 'fas fa-toggle-off';
        darkIcon.style.color = 'var(--text-tertiary)';
        nightIcon.className = 'fas fa-toggle-on';
        nightIcon.style.color = 'var(--primary)';
    } else {
        darkIcon.className = 'fas fa-toggle-off';
        darkIcon.style.color = 'var(--text-tertiary)';
        nightIcon.className = 'fas fa-toggle-off';
        nightIcon.style.color = 'var(--text-tertiary)';
    }
}

darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    updateThemeIcons();
});

nightModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'night') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'night');
        localStorage.setItem('theme', 'night');
    }
    updateThemeIcons();
});

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
}
updateThemeIcons();

// ===== Logout =====
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const user = auth.currentUser;
        if (user) {
            await database.ref('users/' + user.uid).update({ isOnline: false });
        }
        await auth.signOut();
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ===== Banner Slider =====
let currentBanner = 0;
let bannerInterval;

function loadBanners() {
    database.ref('banners').on('value', (snapshot) => {
        const banners = snapshot.val();
        const container = document.getElementById('bannerContainer');
        const dotsContainer = document.getElementById('bannerDots');
        
        if (!banners) {
            container.innerHTML = '';
            dotsContainer.innerHTML = '';
            return;
        }
        
        const bannerArray = Object.entries(banners).map(([id, data]) => ({ id, ...data }));
        
        container.innerHTML = bannerArray.map(banner => `
            <a href="${banner.link || '#'}" class="banner-slide">
                <img src="${banner.image}" alt="Banner" loading="lazy">
            </a>
        `).join('');
        
        dotsContainer.innerHTML = bannerArray.map((_, index) => `
            <div class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
        `).join('');
        
        // Add click handlers to dots
        dotsContainer.querySelectorAll('.banner-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                currentBanner = parseInt(dot.dataset.index);
                updateBanner();
            });
        });
        
        // Start auto-slide
        startBannerSlider();
    });
}

function updateBanner() {
    const container = document.getElementById('bannerContainer');
    const dots = document.querySelectorAll('.banner-dot');
    
    container.style.transform = `translateX(-${currentBanner * 100}%)`;
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentBanner);
    });
}

function startBannerSlider() {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const totalBanners = document.querySelectorAll('.banner-slide').length;
        currentBanner = (currentBanner + 1) % totalBanners;
        updateBanner();
    }, 5000);
}

// Pause slider on hover
document.getElementById('bannerSlider')?.addEventListener('mouseenter', () => {
    clearInterval(bannerInterval);
});

document.getElementById('bannerSlider')?.addEventListener('mouseleave', startBannerSlider);

// ===== App Cards =====
function createAppCard(app, appId) {
    const rating = app.rating || 0;
    const ratingCount = app.ratingCount || 0;
    const downloads = app.downloads || 0;
    
    return `
        <a href="download.html?id=${appId}" class="app-card">
            <img src="${app.icon}" alt="${app.name}" class="app-icon" loading="lazy">
            <div class="app-info">
                <h3 class="app-name">${app.name}</h3>
                <p class="app-developer">${app.developer}</p>
                <div class="app-meta">
                    <span class="app-rating">
                        <i class="fas fa-star"></i>
                        ${rating.toFixed(1)}
                    </span>
                    <span>${formatNumber(downloads)} downloads</span>
                </div>
            </div>
        </a>
    `;
}

// ===== Load Apps by Category =====
function loadAppsByCategory(category, containerId, limit = 6) {
    const container = document.getElementById(containerId);
    
    database.ref('apps').orderByChild('category').equalTo(category).limitToLast(limit).on('value', (snapshot) => {
        const apps = snapshot.val();
        
        if (!apps) {
            container.innerHTML = '<p class="text-secondary" style="text-align: center; padding: var(--spacing-lg);">No apps found</p>';
            return;
        }
        
        const appArray = Object.entries(apps).reverse().map(([id, data]) => ({ id, ...data }));
        container.innerHTML = appArray.map(app => createAppCard(app, app.id)).join('');
    });
}

// ===== Search Input =====
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }
});

// ===== Load User Data =====
async function loadUserData() {
    const user = await checkAuthState(true);
    if (!user) return;
    
    const userData = await getCurrentUserData();
    if (userData) {
        document.getElementById('drawerUsername').textContent = userData.username || 'User';
        document.getElementById('drawerEmail').textContent = user.email;
        document.getElementById('drawerAvatar').src = userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username || 'User')}&background=1a73e8&color=fff`;
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadBanners();
    loadAppsByCategory('new', 'newUploads');
    loadAppsByCategory('trending', 'trendingApps');
    loadAppsByCategory('mostliked', 'mostLiked');
    loadAppsByCategory('editing', 'editingApps');
});
