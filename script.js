// ============================================
// AXON AI SHORTENER - MAIN SCRIPT
// Complete URL Shortener with Earning System
// ============================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForDemo",
    authDomain: "axon-shortener.firebaseapp.com",
    databaseURL: "https://axon-shortener-default-rtdb.firebaseio.com",
    projectId: "axon-shortener",
    storageBucket: "axon-shortener.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch (e) {
    console.log('Firebase not configured - using local storage mode');
}

// ============================================
// LOCAL STORAGE DATABASE (Fallback)
// ============================================
const LocalDB = {
    getUsers: () => JSON.parse(localStorage.getItem('axon_users') || '[]'),
    saveUsers: (users) => localStorage.setItem('axon_users', JSON.stringify(users)),
    
    getLinks: () => JSON.parse(localStorage.getItem('axon_links') || '[]'),
    saveLinks: (links) => localStorage.setItem('axon_links', JSON.stringify(links)),
    
    getWithdrawals: () => JSON.parse(localStorage.getItem('axon_withdrawals') || '[]'),
    saveWithdrawals: (withdrawals) => localStorage.setItem('axon_withdrawals', JSON.stringify(withdrawals)),
    
    getStats: () => JSON.parse(localStorage.getItem('axon_stats') || '{"totalLinks": 0, "totalClicks": 0, "totalUsers": 0}'),
    saveStats: (stats) => localStorage.setItem('axon_stats', JSON.stringify(stats)),
    
    getCurrentUser: () => JSON.parse(localStorage.getItem('axon_current_user') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('axon_current_user', JSON.stringify(user)),
    
    getSettings: () => JSON.parse(localStorage.getItem('axon_settings') || '{"cpmRate": 82, "minWithdrawal": 100}'),
    saveSettings: (settings) => localStorage.setItem('axon_settings', JSON.stringify(settings))
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const msgEl = overlay.querySelector('p');
        if (msgEl) msgEl.textContent = message;
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('show');
}

// ============================================
// THEME TOGGLE
// ============================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('axon_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('axon_theme', newTheme);
            themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
function registerUser(firstName, lastName, email, phone, upiId, password) {
    const users = LocalDB.getUsers();
    
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already registered!' };
    }
    
    const newUser = {
        id: generateId(),
        firstName,
        lastName,
        email,
        phone,
        upiId,
        password,
        balance: 0,
        totalEarnings: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    users.push(newUser);
    LocalDB.saveUsers(users);
    
    // Update stats
    const stats = LocalDB.getStats();
    stats.totalUsers++;
    LocalDB.saveStats(stats);
    
    return { success: true, message: 'Account created successfully!', user: newUser };
}

function loginUser(email, password) {
    const users = LocalDB.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return { success: false, message: 'Invalid email or password!' };
    }
    
    if (user.status === 'banned') {
        return { success: false, message: 'Your account has been banned!' };
    }
    
    LocalDB.setCurrentUser(user);
    return { success: true, message: 'Login successful!', user };
}

function logoutUser() {
    LocalDB.setCurrentUser(null);
    window.location.href = 'index.html';
}

function updateUser(userId, updates) {
    const users = LocalDB.getUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        LocalDB.saveUsers(users);
        
        // Update current user if it's the same user
        const currentUser = LocalDB.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            LocalDB.setCurrentUser(users[index]);
        }
        return { success: true, user: users[index] };
    }
    return { success: false, message: 'User not found!' };
}

function changePassword(userId, currentPassword, newPassword) {
    const users = LocalDB.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return { success: false, message: 'User not found!' };
    }
    
    if (user.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect!' };
    }
    
    user.password = newPassword;
    LocalDB.saveUsers(users);
    
    return { success: true, message: 'Password changed successfully!' };
}

function resetPassword(email, newPassword) {
    const users = LocalDB.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return { success: false, message: 'Email not found!' };
    }
    
    user.password = newPassword;
    LocalDB.saveUsers(users);
    
    return { success: true, message: 'Password reset successfully!' };
}

// ============================================
// URL SHORTENER FUNCTIONS
// ============================================
function createShortLink(originalUrl, userId = null) {
    const links = LocalDB.getLinks();
    const shortCode = generateShortCode();
    
    const newLink = {
        id: generateId(),
        shortCode,
        originalUrl,
        userId,
        clicks: 0,
        earnings: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    links.push(newLink);
    LocalDB.saveLinks(links);
    
    // Update stats
    const stats = LocalDB.getStats();
    stats.totalLinks++;
    LocalDB.saveStats(stats);
    
    return { success: true, link: newLink };
}

function getShortLinkUrl(shortCode) {
    return `${window.location.origin}/go.html?code=${shortCode}`;
}

function recordClick(shortCode) {
    const links = LocalDB.getLinks();
    const link = links.find(l => l.shortCode === shortCode);
    
    if (link && link.status === 'active') {
        link.clicks++;
        
        // Calculate earnings
        const settings = LocalDB.getSettings();
        const earningsPerClick = settings.cpmRate / 1000;
        link.earnings += earningsPerClick;
        
        LocalDB.saveLinks(links);
        
        // Update user's earnings if link belongs to a user
        if (link.userId) {
            const users = LocalDB.getUsers();
            const user = users.find(u => u.id === link.userId);
            if (user) {
                user.balance += earningsPerClick;
                user.totalEarnings += earningsPerClick;
                LocalDB.saveUsers(users);
            }
        }
        
        // Update stats
        const stats = LocalDB.getStats();
        stats.totalClicks++;
        LocalDB.saveStats(stats);
        
        return { success: true, link };
    }
    return { success: false, message: 'Link not found or inactive!' };
}

function getUserLinks(userId) {
    const links = LocalDB.getLinks();
    return links.filter(l => l.userId === userId).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
}

function deleteLink(linkId, userId) {
    const links = LocalDB.getLinks();
    const index = links.findIndex(l => l.id === linkId && l.userId === userId);
    
    if (index !== -1) {
        links.splice(index, 1);
        LocalDB.saveLinks(links);
        return { success: true, message: 'Link deleted successfully!' };
    }
    return { success: false, message: 'Link not found!' };
}

// ============================================
// WITHDRAWAL FUNCTIONS
// ============================================
function requestWithdrawal(userId, amount) {
    const users = LocalDB.getUsers();
    const user = users.find(u => u.id === userId);
    const settings = LocalDB.getSettings();
    
    if (!user) {
        return { success: false, message: 'User not found!' };
    }
    
    if (user.balance < settings.minWithdrawal) {
        return { success: false, message: `Minimum withdrawal amount is ₹${settings.minWithdrawal}` };
    }
    
    if (amount > user.balance) {
        return { success: false, message: 'Insufficient balance!' };
    }
    
    const withdrawals = LocalDB.getWithdrawals();
    const newWithdrawal = {
        id: generateId(),
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        upiId: user.upiId,
        amount,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        processedAt: null
    };
    
    withdrawals.push(newWithdrawal);
    LocalDB.saveWithdrawals(withdrawals);
    
    // Deduct from balance
    user.balance -= amount;
    LocalDB.saveUsers(users);
    
    return { success: true, message: 'Withdrawal request submitted!' };
}

function getUserWithdrawals(userId) {
    const withdrawals = LocalDB.getWithdrawals();
    return withdrawals.filter(w => w.userId === userId).sort((a, b) => 
        new Date(b.requestedAt) - new Date(a.requestedAt)
    );
}

// ============================================
// PAGE INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initMobileMenu();
    initFAQ();
    updateNavForAuth();
    initPageSpecific();
});

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        }
    });
}

function updateNavForAuth() {
    const currentUser = LocalDB.getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (signupBtn) signupBtn.classList.add('hidden');
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.addEventListener('click', logoutUser);
        }
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signupBtn) signupBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

function initPageSpecific() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        initHomePage();
    } else if (path.includes('shortener.html')) {
        initShortenerPage();
    } else if (path.includes('dashboard.html')) {
        initDashboardPage();
    } else if (path.includes('login.html')) {
        initLoginPage();
    } else if (path.includes('signup.html')) {
        initSignupPage();
    } else if (path.includes('withdraw.html')) {
        initWithdrawPage();
    } else if (path.includes('profile.html')) {
        initProfilePage();
    } else if (path.includes('forgot-password.html')) {
        initForgotPasswordPage();
    }
}

// ============================================
// HOME PAGE
// ============================================
function initHomePage() {
    // Update stats
    const stats = LocalDB.getStats();
    animateValue('totalLinks', 0, stats.totalLinks + 15420, 2000);
    animateValue('totalClicks', 0, stats.totalClicks + 89345, 2000);
    animateValue('totalUsers', 0, stats.totalUsers + 5234, 2000);
    
    // Home shortener
    const homeShortenBtn = document.getElementById('homeShortenBtn');
    const homeUrlInput = document.getElementById('homeUrlInput');
    const homeResult = document.getElementById('homeResult');
    const homeShortLink = document.getElementById('homeShortLink');
    const homeCopyBtn = document.getElementById('homeCopyBtn');
    
    if (homeShortenBtn) {
        homeShortenBtn.addEventListener('click', () => {
            const url = homeUrlInput.value.trim();
            if (!url || !url.startsWith('http')) {
                showNotification('Please enter a valid URL!', 'error');
                return;
            }
            
            showLoading('Creating short link...');
            
            setTimeout(() => {
                const result = createShortLink(url);
                if (result.success) {
                    const shortUrl = getShortLinkUrl(result.link.shortCode);
                    homeShortLink.value = shortUrl;
                    homeResult.classList.add('show');
                    showNotification('Short link created successfully!', 'success');
                }
                hideLoading();
            }, 1000);
        });
    }
    
    if (homeCopyBtn) {
        homeCopyBtn.addEventListener('click', () => {
            homeShortLink.select();
            document.execCommand('copy');
            showNotification('Link copied to clipboard!', 'success');
        });
    }
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// ============================================
// SHORTENER PAGE
// ============================================
function initShortenerPage() {
    const currentUser = LocalDB.getCurrentUser();
    const guestMessage = document.getElementById('guestMessage');
    const recentLinksCard = document.getElementById('recentLinksCard');
    
    if (currentUser) {
        if (guestMessage) guestMessage.style.display = 'none';
        if (recentLinksCard) {
            recentLinksCard.style.display = 'block';
            loadRecentLinks(currentUser.id);
        }
    } else {
        if (guestMessage) guestMessage.style.display = 'block';
        if (recentLinksCard) recentLinksCard.style.display = 'none';
    }
    
    // Shortener form
    const shortenBtn = document.getElementById('shortenBtn');
    const urlInput = document.getElementById('urlInput');
    const resultSection = document.getElementById('resultSection');
    const shortLinkInput = document.getElementById('shortLinkInput');
    const copyBtn = document.getElementById('copyBtn');
    
    if (shortenBtn) {
        shortenBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (!url || !url.startsWith('http')) {
                showNotification('Please enter a valid URL!', 'error');
                return;
            }
            
            showLoading('Creating short link...');
            
            setTimeout(() => {
                const userId = currentUser ? currentUser.id : null;
                const result = createShortLink(url, userId);
                
                if (result.success) {
                    const shortUrl = getShortLinkUrl(result.link.shortCode);
                    shortLinkInput.value = shortUrl;
                    resultSection.classList.add('show');
                    showNotification('Short link created successfully!', 'success');
                    
                    if (currentUser) {
                        loadRecentLinks(currentUser.id);
                    }
                }
                hideLoading();
            }, 1000);
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            shortLinkInput.select();
            document.execCommand('copy');
            showNotification('Link copied to clipboard!', 'success');
        });
    }
    
    // Share buttons
    const shareWhatsapp = document.getElementById('shareWhatsapp');
    const shareFacebook = document.getElementById('shareFacebook');
    const shareTwitter = document.getElementById('shareTwitter');
    const shareTelegram = document.getElementById('shareTelegram');
    
    if (shareWhatsapp) {
        shareWhatsapp.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput.value);
            window.open(`https://wa.me/?text=${url}`, '_blank');
        });
    }
    
    if (shareFacebook) {
        shareFacebook.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput.value);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
    }
    
    if (shareTwitter) {
        shareTwitter.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput.value);
            window.open(`https://twitter.com/intent/tweet?url=${url}`, '_blank');
        });
    }
    
    if (shareTelegram) {
        shareTelegram.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput.value);
            window.open(`https://t.me/share/url?url=${url}`, '_blank');
        });
    }
}

function loadRecentLinks(userId) {
    const links = getUserLinks(userId);
    const tbody = document.getElementById('recentLinksBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    links.slice(0, 5).forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td title="${link.originalUrl}">${link.originalUrl.substring(0, 30)}...</td>
            <td><a href="${getShortLinkUrl(link.shortCode)}" target="_blank" style="color: var(--primary);">${link.shortCode}</a></td>
            <td>${link.clicks}</td>
            <td>₹${link.earnings.toFixed(2)}</td>
            <td>${new Date(link.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="copyLink('${getShortLinkUrl(link.shortCode)}')">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Link copied!', 'success');
    });
}

// ============================================
// LOGIN PAGE
// ============================================
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe')?.checked;
            
            showLoading('Logging in...');
            
            setTimeout(() => {
                const result = loginUser(email, password);
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    if (rememberMe) {
                        localStorage.setItem('axon_remember_email', email);
                    }
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showNotification(result.message, 'error');
                    hideLoading();
                }
            }, 1000);
        });
    }
    
    // Auto-fill remembered email
    const rememberedEmail = localStorage.getItem('axon_remember_email');
    if (rememberedEmail && document.getElementById('loginEmail')) {
        document.getElementById('loginEmail').value = rememberedEmail;
    }
}

// ============================================
// SIGNUP PAGE
// ============================================
function initSignupPage() {
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('signupEmail').value;
            const phone = document.getElementById('phoneNumber').value;
            const upiId = document.getElementById('upiId').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            showLoading('Creating account...');
            
            setTimeout(() => {
                const result = registerUser(firstName, lastName, email, phone, upiId, password);
                
                if (result.success) {
                    LocalDB.setCurrentUser(result.user);
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showNotification(result.message, 'error');
                    hideLoading();
                }
            }, 1500);
        });
    }
}

// ============================================
// DASHBOARD PAGE
// ============================================
function initDashboardPage() {
    const currentUser = LocalDB.getCurrentUser();
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Update user name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = currentUser.firstName;
    }
    
    // Update stats
    updateDashboardStats(currentUser.id);
    
    // Load links table
    loadDashboardLinks(currentUser.id);
    
    // Refresh button
    const refreshStats = document.getElementById('refreshStats');
    if (refreshStats) {
        refreshStats.addEventListener('click', () => {
            updateDashboardStats(currentUser.id);
            loadDashboardLinks(currentUser.id);
            showNotification('Stats refreshed!', 'success');
        });
    }
}

function updateDashboardStats(userId) {
    const users = LocalDB.getUsers();
    const user = users.find(u => u.id === userId);
    const links = getUserLinks(userId);
    
    if (!user) return;
    
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const totalEarnings = user.totalEarnings;
    const balance = user.balance;
    
    // Update DOM
    const totalLinksEl = document.getElementById('totalLinks');
    const totalClicksEl = document.getElementById('totalClicks');
    const totalEarningsEl = document.getElementById('totalEarnings');
    const withdrawableBalanceEl = document.getElementById('withdrawableBalance');
    const navBalanceEl = document.getElementById('navBalance');
    
    if (totalLinksEl) totalLinksEl.textContent = totalLinks;
    if (totalClicksEl) totalClicksEl.textContent = totalClicks.toLocaleString();
    if (totalEarningsEl) totalEarningsEl.textContent = totalEarnings.toFixed(2);
    if (withdrawableBalanceEl) withdrawableBalanceEl.textContent = balance.toFixed(2);
    if (navBalanceEl) navBalanceEl.textContent = balance.toFixed(2);
}

function loadDashboardLinks(userId) {
    const links = getUserLinks(userId);
    const tbody = document.getElementById('linksTableBody');
    const emptyState = document.getElementById('emptyLinksState');
    
    if (!tbody) return;
    
    if (links.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    tbody.innerHTML = '';
    
    links.forEach(link => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="${getShortLinkUrl(link.shortCode)}" target="_blank" style="color: var(--primary); font-weight: 600;">${link.shortCode}</a></td>
            <td title="${link.originalUrl}">${link.originalUrl.substring(0, 40)}...</td>
            <td>${link.clicks.toLocaleString()}</td>
            <td>₹${link.earnings.toFixed(2)}</td>
            <td>${new Date(link.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="copyLink('${getShortLinkUrl(link.shortCode)}')">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUserLink('${link.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteUserLink(linkId) {
    const currentUser = LocalDB.getCurrentUser();
    if (!currentUser) return;
    
    if (confirm('Are you sure you want to delete this link?')) {
        const result = deleteLink(linkId, currentUser.id);
        if (result.success) {
            showNotification(result.message, 'success');
            loadDashboardLinks(currentUser.id);
            updateDashboardStats(currentUser.id);
        } else {
            showNotification(result.message, 'error');
        }
    }
}

// ============================================
// WITHDRAW PAGE
// ============================================
function initWithdrawPage() {
    const currentUser = LocalDB.getCurrentUser();
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Update balance display
    const balanceAmount = document.getElementById('balanceAmount');
    const availableBalance = document.getElementById('availableBalance');
    const upiDisplay = document.getElementById('upiDisplay');
    const settings = LocalDB.getSettings();
    
    if (balanceAmount) balanceAmount.textContent = currentUser.balance.toFixed(2);
    if (availableBalance) availableBalance.textContent = currentUser.balance.toFixed(2);
    if (upiDisplay) upiDisplay.textContent = currentUser.upiId;
    
    // Min withdrawal display
    const minWithdrawalEl = document.getElementById('minWithdrawal');
    if (minWithdrawalEl) minWithdrawalEl.textContent = settings.minWithdrawal;
    
    // Withdrawal form
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            
            if (amount < settings.minWithdrawal) {
                showNotification(`Minimum withdrawal is ₹${settings.minWithdrawal}`, 'error');
                return;
            }
            
            if (amount > currentUser.balance) {
                showNotification('Insufficient balance!', 'error');
                return;
            }
            
            showLoading('Processing withdrawal...');
            
            setTimeout(() => {
                const result = requestWithdrawal(currentUser.id, amount);
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showNotification(result.message, 'error');
                    hideLoading();
                }
            }, 1500);
        });
    }
    
    // Load withdrawal history
    loadWithdrawalHistory(currentUser.id);
}

function loadWithdrawalHistory(userId) {
    const withdrawals = getUserWithdrawals(userId);
    const tbody = document.getElementById('withdrawalHistoryBody');
    const emptyHistory = document.getElementById('emptyWithdrawalHistory');
    
    if (!tbody) return;
    
    if (withdrawals.length === 0) {
        if (emptyHistory) emptyHistory.style.display = 'block';
        return;
    }
    
    if (emptyHistory) emptyHistory.style.display = 'none';
    tbody.innerHTML = '';
    
    withdrawals.forEach(w => {
        const row = document.createElement('tr');
        const statusClass = w.status === 'completed' ? 'badge-success' : 
                           w.status === 'pending' ? 'badge-warning' : 'badge-danger';
        row.innerHTML = `
            <td>${new Date(w.requestedAt).toLocaleDateString()}</td>
            <td>₹${w.amount.toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${w.status}</span></td>
            <td>${w.processedAt ? new Date(w.processedAt).toLocaleDateString() : '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// PROFILE PAGE
// ============================================
function initProfilePage() {
    const currentUser = LocalDB.getCurrentUser();
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Fill profile info
    document.getElementById('profileName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileUsername').textContent = currentUser.email.split('@')[0];
    document.getElementById('memberSince').textContent = new Date(currentUser.createdAt).toLocaleDateString();
    
    // Fill form
    document.getElementById('editFirstName').value = currentUser.firstName;
    document.getElementById('editLastName').value = currentUser.lastName;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editPhone').value = currentUser.phone;
    document.getElementById('editUpiId').value = currentUser.upiId;
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updates = {
                firstName: document.getElementById('editFirstName').value,
                lastName: document.getElementById('editLastName').value,
                phone: document.getElementById('editPhone').value,
                upiId: document.getElementById('editUpiId').value
            };
            
            showLoading('Updating profile...');
            
            setTimeout(() => {
                const result = updateUser(currentUser.id, updates);
                
                if (result.success) {
                    showNotification('Profile updated successfully!', 'success');
                    document.getElementById('profileName').textContent = `${updates.firstName} ${updates.lastName}`;
                } else {
                    showNotification(result.message, 'error');
                }
                hideLoading();
            }, 1000);
        });
    }
    
    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                showNotification('New passwords do not match!', 'error');
                return;
            }
            
            showLoading('Changing password...');
            
            setTimeout(() => {
                const result = changePassword(currentUser.id, currentPassword, newPassword);
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    passwordForm.reset();
                } else {
                    showNotification(result.message, 'error');
                }
                hideLoading();
            }, 1000);
        });
    }
}

// ============================================
// FORGOT PASSWORD PAGE
// ============================================
function initForgotPasswordPage() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const resetForm = document.getElementById('resetPasswordForm');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    
    let resetEmail = '';
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value;
            const users = LocalDB.getUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                showNotification('Email not found!', 'error');
                return;
            }
            
            resetEmail = email;
            if (userEmailDisplay) userEmailDisplay.textContent = email;
            
            // Show step 2
            if (step1) step1.style.display = 'none';
            if (step2) step2.style.display = 'block';
            
            showNotification('Email verified! Set your new password.', 'success');
        });
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('newResetPassword').value;
            const confirmPassword = document.getElementById('confirmResetPassword').value;
            
            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            showLoading('Resetting password...');
            
            setTimeout(() => {
                const result = resetPassword(resetEmail, newPassword);
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    showNotification(result.message, 'error');
                    hideLoading();
                }
            }, 1000);
        });
    }
}

// ============================================
// REDIRECT PAGE (go.html)
// ============================================
function initRedirectPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const shortCode = urlParams.get('code');
    const targetUrl = urlParams.get('url');
    
    if (!shortCode && !targetUrl) {
        showNotification('Invalid link!', 'error');
        return;
    }
    
    // Record click
    if (shortCode) {
        recordClick(shortCode);
    }
    
    // Get the original URL
    let originalUrl = targetUrl;
    if (shortCode) {
        const links = LocalDB.getLinks();
        const link = links.find(l => l.shortCode === shortCode);
        if (link) {
            originalUrl = link.originalUrl;
        }
    }
    
    // Store for final redirect
    if (originalUrl) {
        localStorage.setItem('axon_final_url', originalUrl);
    }
    
    // Start redirect chain
    startRedirectChain();
}

function startRedirectChain() {
    const pages = ['Short1.html', 'Short2.html', 'Short3.html', 'Short4.html', 'Short5.html', 'Short6.html', 'finallink.html'];
    let currentPage = parseInt(localStorage.getItem('axon_redirect_step') || '0');
    
    if (currentPage < pages.length) {
        localStorage.setItem('axon_redirect_step', (currentPage + 1).toString());
        
        // Add countdown before redirect
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            let seconds = 5;
            countdownEl.textContent = seconds;
            
            const timer = setInterval(() => {
                seconds--;
                countdownEl.textContent = seconds;
                
                if (seconds <= 0) {
                    clearInterval(timer);
                    window.location.href = pages[currentPage];
                }
            }, 1000);
        } else {
            setTimeout(() => {
                window.location.href = pages[currentPage];
            }, 5000);
        }
    }
}

// ============================================
// EXPORT FUNCTIONS FOR GLOBAL ACCESS
// ============================================
window.LocalDB = LocalDB;
window.showNotification = showNotification;
window.copyLink = copyLink;
window.deleteUserLink = deleteUserLink;
