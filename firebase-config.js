/**
 * MEGA STORE - Firebase Configuration
 * Shared across all pages
 */

const firebaseConfig = {
    apiKey: "AIzaSyDGXCCIcc27B63_wJRXkv9r_e-1CaxPMvE",
    authDomain: "swb-project-92ac0.firebaseapp.com",
    databaseURL: "https://swb-project-92ac0-default-rtdb.firebaseio.com",
    projectId: "swb-project-92ac0",
    storageBucket: "swb-project-92ac0.firebasestorage.app",
    messagingSenderId: "990131286731",
    appId: "1:990131286731:web:8bdaf5fd2661269ee9e14e",
    measurementId: "G-J8QE2NJY5W"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Auth state listener - redirect if not logged in (for protected pages)
function checkAuthState(redirectToLogin = true) {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else if (redirectToLogin) {
                window.location.href = 'login-account.html';
            } else {
                resolve(null);
            }
        });
    });
}

// Get current user data
async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    const snapshot = await database.ref('users/' + user.uid).once('value');
    return snapshot.val();
}

// Format number (e.g., 1000 -> 1K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toggle loading state
function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}
