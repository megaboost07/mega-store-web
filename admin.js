/**
 * ============================================
 * AXON AI SHORTENER - ADMIN JAVASCRIPT
 * ============================================
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBQnUabSu6WGbq1te-hBEAYPZdOO93_Mfk",
    authDomain: "mega-store-2025.firebaseapp.com",
    databaseURL: "https://mega-store-2025-default-rtdb.firebaseio.com",
    projectId: "mega-store-2025",
    storageBucket: "mega-store-2025.firebasestorage.app",
    messagingSenderId: "190838364165",
    appId: "1:190838364165:web:43a969b7b852777061e46c",
    measurementId: "G-CZR2N1HF9K"
};

// Initialize Firebase
let firebaseApp;
let database;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// ============================================
// ADMIN CONFIGURATION
// ============================================
const ADMIN_PASSWORD = 'admin123'; // Change this in production!

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateShortCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getTimestamp() {
    return new Date().toISOString();
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// LOADING OVERLAY
// ============================================
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const content = overlay.querySelector('.loading-content p');
        if (content) content.textContent = message;
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// ============================================
// THEME TOGGLE
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('axonTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('axonTheme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    }
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================
function initAdminAuth() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginOverlay = document.getElementById('adminLoginOverlay');
    const adminNavbar = document.getElementById('adminNavbar');
    const adminContent = document.getElementById('adminContent');
    
    // Check if already logged in as admin
    const isAdminLoggedIn = sessionStorage.getItem('axonAdminLoggedIn') === 'true';
    
    if (isAdminLoggedIn) {
        showAdminPanel();
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const password = document.getElementById('adminPassword').value;
            
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('axonAdminLoggedIn', 'true');
                showAdminPanel();
                showNotification('Welcome to Admin Panel!', 'success');
            } else {
                showNotification('Invalid password', 'error');
            }
        });
    }
    
    // Admin logout
    const adminLogout = document.getElementById('adminLogout');
    if (adminLogout) {
        adminLogout.addEventListener('click', () => {
            sessionStorage.removeItem('axonAdminLoggedIn');
            location.reload();
        });
    }
}

function showAdminPanel() {
    const adminLoginOverlay = document.getElementById('adminLoginOverlay');
    const adminNavbar = document.getElementById('adminNavbar');
    const adminContent = document.getElementById('adminContent');
    
    if (adminLoginOverlay) adminLoginOverlay.style.display = 'none';
    if (adminNavbar) adminNavbar.style.display = 'block';
    if (adminContent) adminContent.style.display = 'grid';
    
    // Load dashboard data
    loadDashboardStats();
    loadUsers();
    loadLinks();
    loadWithdrawals();
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    const sections = document.querySelectorAll('.admin-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionName = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`${sectionName}Section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Refresh data based on section
            switch (sectionName) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'links':
                    loadLinks();
                    break;
                case 'withdrawals':
                    loadWithdrawals();
                    break;
            }
        });
    });
    
    // Refresh buttons
    const refreshDashboard = document.getElementById('refreshDashboard');
    const refreshUsers = document.getElementById('refreshUsers');
    const refreshLinks = document.getElementById('refreshLinks');
    const refreshWithdrawals = document.getElementById('refreshWithdrawals');
    
    if (refreshDashboard) refreshDashboard.addEventListener('click', loadDashboardStats);
    if (refreshUsers) refreshUsers.addEventListener('click', loadUsers);
    if (refreshLinks) refreshLinks.addEventListener('click', loadLinks);
    if (refreshWithdrawals) refreshWithdrawals.addEventListener('click', loadWithdrawals);
}

// ============================================
// DASHBOARD STATS
// ============================================
function loadDashboardStats() {
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    const links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    const withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
    
    const totalUsers = users.length;
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalEarnings = users.reduce((sum, user) => sum + (user.totalEarnings || 0), 0);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
    const totalWithdrawn = withdrawals
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + w.amount, 0);
    
    // Today's stats
    const today = new Date().toDateString();
    const todayUsers = users.filter(u => new Date(u.createdAt).toDateString() === today).length;
    const todayLinks = links.filter(l => new Date(l.createdAt).toDateString() === today).length;
    const todayClicks = links.filter(l => l.lastClick && new Date(l.lastClick).toDateString() === today)
        .reduce((sum, link) => sum + 1, 0);
    
    // Update display
    document.getElementById('adminTotalUsers').textContent = formatNumber(totalUsers);
    document.getElementById('adminTotalLinks').textContent = formatNumber(totalLinks);
    document.getElementById('adminTotalClicks').textContent = formatNumber(totalClicks);
    document.getElementById('adminTotalEarnings').textContent = '₹' + formatCurrency(totalEarnings);
    document.getElementById('adminPendingWithdrawals').textContent = pendingWithdrawals;
    document.getElementById('todayUsers').textContent = todayUsers;
    document.getElementById('todayLinks').textContent = todayLinks;
    document.getElementById('todayClicks').textContent = todayClicks;
    document.getElementById('totalWithdrawn').textContent = '₹' + formatCurrency(totalWithdrawn);
    
    // Update badge
    const badge = document.getElementById('pendingWithdrawalsBadge');
    if (badge) {
        if (pendingWithdrawals > 0) {
            badge.textContent = pendingWithdrawals;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ============================================
// USERS MANAGEMENT
// ============================================
function loadUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    const emptyUsers = document.getElementById('emptyUsers');
    
    if (!usersTableBody) return;
    
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    
    if (users.length === 0) {
        if (emptyUsers) emptyUsers.style.display = 'block';
        usersTableBody.innerHTML = '';
        return;
    }
    
    if (emptyUsers) emptyUsers.style.display = 'none';
    
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id.substring(0, 8)}...</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.totalLinks || 0}</td>
            <td>${formatNumber(user.totalClicks || 0)}</td>
            <td>₹${formatCurrency(user.totalEarnings || 0)}</td>
            <td>
                <span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">
                    ${user.status || 'active'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-${user.status === 'active' ? 'danger' : 'success'} btn-xs" onclick="toggleUserStatus('${user.id}')">
                        <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="btn btn-primary btn-xs" onclick="viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function toggleUserStatus(userId) {
    let users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        const newStatus = users[userIndex].status === 'active' ? 'banned' : 'active';
        users[userIndex].status = newStatus;
        localStorage.setItem('axonUsers', JSON.stringify(users));
        
        // Update in Firebase
        if (database) {
            database.ref(`users/${userId}`).update({ status: newStatus });
        }
        
        showNotification(`User ${newStatus === 'banned' ? 'banned' : 'activated'} successfully`, 'success');
        loadUsers();
    }
}

function viewUserDetails(userId) {
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (user) {
        alert(`User Details:
        
Name: ${user.firstName} ${user.lastName}
Email: ${user.email}
Phone: ${user.phone}
UPI ID: ${user.upiId}
Balance: ₹${formatCurrency(user.balance || 0)}
Total Earnings: ₹${formatCurrency(user.totalEarnings || 0)}
Total Clicks: ${formatNumber(user.totalClicks || 0)}
Status: ${user.status || 'active'}
Joined: ${new Date(user.createdAt).toLocaleDateString()}`);
    }
}

// ============================================
// LINKS MANAGEMENT
// ============================================
function loadLinks() {
    const linksTableBody = document.getElementById('linksTableBody');
    const emptyLinks = document.getElementById('emptyLinks');
    
    if (!linksTableBody) return;
    
    const links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    
    if (links.length === 0) {
        if (emptyLinks) emptyLinks.style.display = 'block';
        linksTableBody.innerHTML = '';
        return;
    }
    
    if (emptyLinks) emptyLinks.style.display = 'none';
    
    linksTableBody.innerHTML = links.map(link => {
        const user = users.find(u => u.id === link.userId);
        return `
        <tr>
            <td><code>${link.shortCode}</code></td>
            <td title="${link.originalUrl}">${link.originalUrl.substring(0, 40)}...</td>
            <td>${user ? user.email : 'Guest'}</td>
            <td>${formatNumber(link.clicks || 0)}</td>
            <td>₹${formatCurrency(link.earnings || 0)}</td>
            <td>${new Date(link.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-danger btn-xs" onclick="deleteLink('${link.shortCode}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    <a href="${link.originalUrl}" target="_blank" class="btn btn-secondary btn-xs">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </td>
        </tr>
    `}).join('');
}

function deleteLink(shortCode) {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    let links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    links = links.filter(l => l.shortCode !== shortCode);
    localStorage.setItem('axonLinks', JSON.stringify(links));
    
    // Delete from Firebase
    if (database) {
        database.ref(`links/${shortCode}`).remove();
    }
    
    showNotification('Link deleted successfully', 'success');
    loadLinks();
}

// ============================================
// WITHDRAWALS MANAGEMENT
// ============================================
function loadWithdrawals() {
    const pendingWithdrawalsBody = document.getElementById('pendingWithdrawalsBody');
    const allWithdrawalsBody = document.getElementById('allWithdrawalsBody');
    const emptyPending = document.getElementById('emptyPending');
    const emptyAllWithdrawals = document.getElementById('emptyAllWithdrawals');
    
    if (!pendingWithdrawalsBody || !allWithdrawalsBody) return;
    
    const withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
    const allWithdrawals = withdrawals.reverse();
    
    // Pending withdrawals
    if (pendingWithdrawals.length === 0) {
        if (emptyPending) emptyPending.style.display = 'block';
        pendingWithdrawalsBody.innerHTML = '';
    } else {
        if (emptyPending) emptyPending.style.display = 'none';
        pendingWithdrawalsBody.innerHTML = pendingWithdrawals.map(w => {
            const user = users.find(u => u.id === w.userId);
            return `
            <tr>
                <td>${new Date(w.requestedAt).toLocaleDateString()}</td>
                <td>${user ? user.email : w.userId}</td>
                <td>${w.upiId}</td>
                <td>₹${formatCurrency(w.amount)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-success btn-xs" onclick="approveWithdrawal('${w.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger btn-xs" onclick="rejectWithdrawal('${w.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }
    
    // All withdrawals
    if (allWithdrawals.length === 0) {
        if (emptyAllWithdrawals) emptyAllWithdrawals.style.display = 'block';
        allWithdrawalsBody.innerHTML = '';
    } else {
        if (emptyAllWithdrawals) emptyAllWithdrawals.style.display = 'none';
        allWithdrawalsBody.innerHTML = allWithdrawals.map(w => {
            const user = users.find(u => u.id === w.userId);
            return `
            <tr>
                <td>${new Date(w.requestedAt).toLocaleDateString()}</td>
                <td>${user ? user.email : w.userId}</td>
                <td>${w.upiId}</td>
                <td>₹${formatCurrency(w.amount)}</td>
                <td>
                    <span class="badge badge-${w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}">
                        ${w.status}
                    </span>
                </td>
                <td>${w.processedAt ? new Date(w.processedAt).toLocaleDateString() : '-'}</td>
            </tr>
        `}).join('');
    }
}

function approveWithdrawal(withdrawalId) {
    let withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
    const withdrawalIndex = withdrawals.findIndex(w => w.id === withdrawalId);
    
    if (withdrawalIndex !== -1) {
        withdrawals[withdrawalIndex].status = 'approved';
        withdrawals[withdrawalIndex].processedAt = getTimestamp();
        localStorage.setItem('axonWithdrawals', JSON.stringify(withdrawals));
        
        // Update in Firebase
        if (database) {
            database.ref(`withdrawals/${withdrawalId}`).update({
                status: 'approved',
                processedAt: getTimestamp()
            });
        }
        
        showNotification('Withdrawal approved successfully', 'success');
        loadWithdrawals();
        loadDashboardStats();
    }
}

function rejectWithdrawal(withdrawalId) {
    if (!confirm('Are you sure you want to reject this withdrawal? The amount will be refunded to the user.')) return;
    
    let withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
    const withdrawalIndex = withdrawals.findIndex(w => w.id === withdrawalId);
    
    if (withdrawalIndex !== -1) {
        const withdrawal = withdrawals[withdrawalIndex];
        withdrawal.status = 'rejected';
        withdrawal.processedAt = getTimestamp();
        localStorage.setItem('axonWithdrawals', JSON.stringify(withdrawals));
        
        // Refund amount to user
        let users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === withdrawal.userId);
        if (userIndex !== -1) {
            users[userIndex].balance += withdrawal.amount;
            users[userIndex].totalWithdrawn -= withdrawal.amount;
            localStorage.setItem('axonUsers', JSON.stringify(users));
        }
        
        // Update in Firebase
        if (database) {
            database.ref(`withdrawals/${withdrawalId}`).update({
                status: 'rejected',
                processedAt: getTimestamp()
            });
            database.ref(`users/${withdrawal.userId}`).update({
                balance: firebase.database.ServerValue.increment(withdrawal.amount),
                totalWithdrawn: firebase.database.ServerValue.increment(-withdrawal.amount)
            });
        }
        
        showNotification('Withdrawal rejected and amount refunded', 'success');
        loadWithdrawals();
        loadDashboardStats();
    }
}

// ============================================
// SETTINGS
// ============================================
function initSettings() {
    const cpmSettingsForm = document.getElementById('cpmSettingsForm');
    const adminSettingsForm = document.getElementById('adminSettingsForm');
    
    if (cpmSettingsForm) {
        cpmSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const cpmRate = document.getElementById('cpmRate').value;
            const minWithdrawal = document.getElementById('minWithdrawal').value;
            
            localStorage.setItem('axonCPM', cpmRate);
            localStorage.setItem('axonMinWithdrawal', minWithdrawal);
            
            showNotification('Settings saved successfully', 'success');
        });
    }
    
    if (adminSettingsForm) {
        adminSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('newAdminPassword').value;
            const confirmPassword = document.getElementById('confirmAdminPassword').value;
            
            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // In a real app, this would update the password on the server
            showNotification('Password updated successfully', 'success');
            document.getElementById('newAdminPassword').value = '';
            document.getElementById('confirmAdminPassword').value = '';
        });
    }
}

// ============================================
// DANGER ZONE FUNCTIONS
// ============================================
function clearAllData() {
    if (!confirm('WARNING: This will delete ALL data including users, links, and withdrawals. This action CANNOT be undone. Are you sure?')) return;
    
    if (!confirm('Are you absolutely sure? Type "DELETE" to confirm.')) return;
    
    localStorage.removeItem('axonUsers');
    localStorage.removeItem('axonLinks');
    localStorage.removeItem('axonWithdrawals');
    localStorage.removeItem('axonContacts');
    
    // Clear Firebase data (in production, this would require proper authentication)
    if (database) {
        database.ref().remove();
    }
    
    showNotification('All data cleared', 'success');
    loadDashboardStats();
    loadUsers();
    loadLinks();
    loadWithdrawals();
}

function toggleMaintenance() {
    const isMaintenance = localStorage.getItem('axonMaintenance') === 'true';
    localStorage.setItem('axonMaintenance', !isMaintenance);
    showNotification(`Maintenance mode ${!isMaintenance ? 'enabled' : 'disabled'}`, 'success');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initAdminAuth();
    initNavigation();
    initSettings();
});

// Export functions for global access
window.toggleUserStatus = toggleUserStatus;
window.viewUserDetails = viewUserDetails;
window.deleteLink = deleteLink;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.clearAllData = clearAllData;
window.toggleMaintenance = toggleMaintenance;
window.showNotification = showNotification;
