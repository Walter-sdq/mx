// Utility functions

// Date formatting
export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  if (diff < month) return `${Math.floor(diff / week)}w ago`;
  if (diff < year) return `${Math.floor(diff / month)}mo ago`;
  return `${Math.floor(diff / year)}y ago`;
}

// Number formatting
export function formatCurrency(amount, currency = 'USD', decimals = 2) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return formatter.format(amount);
}

export function formatNumber(value, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatPercent(value, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

export function formatCompactNumber(value) {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  });

  return formatter.format(value);
}

// Validation functions
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function checkPasswordStrength(password) {
  if (!password) return { score: 0, text: '', class: '' };

  let score = 0;
  let feedback = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  const strength = {
    0: { text: 'Very Weak', class: 'very-weak' },
    1: { text: 'Weak', class: 'weak' },
    2: { text: 'Fair', class: 'fair' },
    3: { text: 'Good', class: 'good' },
    4: { text: 'Strong', class: 'strong' },
    5: { text: 'Very Strong', class: 'very-strong' }
  };

  return {
    score: score,
    text: strength[score].text,
    class: strength[score].class,
    feedback: feedback
  };
}

// Theme management
// utils.js



// Set the theme (dark or light)
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('Top-Margin _theme', theme);

  // Update theme toggle icons
  const themeToggles = document.querySelectorAll('.theme-toggle i');
  themeToggles.forEach(icon => {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  });

  // Optional: Update TradingView widget if exists
  if (window.TradingView && window.tradingViewWidget) {
    tradingViewWidget.changeTheme(theme);
  }
}

// Get the current theme from localStorage or system preference
export function getTheme() {
  return localStorage.getItem('Top-Margin _theme') ||
         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

// Toggle between dark and light theme
export function toggleTheme() {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}

// Setup theme toggle button(s)
function setupThemeToggle() {
  const themeToggleButtons = document.querySelectorAll('.theme-toggle');
  themeToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      toggleTheme();
    });
  });
}


// Toast notifications
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 5000) {
  try {
    const container = getToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    const timeout = setTimeout(() => {
      removeToast(toast);
    }, duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
      clearTimeout(timeout);
      removeToast(toast);
    });

    return toast;
  } catch (error) {
    console.error('Error showing toast:', error);
    // Fallback to console.log if DOM manipulation fails
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

function removeToast(toast) {
  if (toast && toast.parentNode) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      toast.parentNode.removeChild(toast);
    }, 300);
  }
}

// Loading overlay
export function showLoading(show = true) {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay && show) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
  }

  if (overlay) {
    overlay.classList.toggle('active', show);
  }
}

// Show loading state on a specific element
export function showElementLoading(elementId, message = 'Loading...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    element.disabled = true;
  }
}

// Hide loading state from a specific element
export function hideElementLoading(elementId, originalText = 'Submit') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = originalText;
    element.disabled = false;
  }
}

// Modal management
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById('modal-overlay');

  if (modal) {
    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) {
    modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Debounce function
export function debounce(func, wait) {
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

// Generate unique ID
export function generateId() {
  return crypto.randomUUID();
}

// CSV export
export function exportToCSV(data, filename) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      let value = row[header] || '';
      if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }
      return value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = getTheme();
  setTheme(savedTheme);
  // Setup theme toggles
  const themeToggles = document.querySelectorAll('.theme-toggle');
  themeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const newTheme = toggleTheme();
      document.documentElement.setAttribute('data-theme', newTheme);
    });
  });
});

// Make functions available globally for backward compatibility
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatTime = formatTime;
window.getRelativeTime = getRelativeTime;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatPercent = formatPercent;
window.formatCompactNumber = formatCompactNumber;
window.isValidEmail = isValidEmail;
window.checkPasswordStrength = checkPasswordStrength;
window.setTheme = setTheme;
window.getTheme = getTheme;
window.toggleTheme = toggleTheme;
window.showToast = showToast;
window.showLoading = showLoading;
window.showElementLoading = showElementLoading;
window.hideElementLoading = hideElementLoading;
window.openModal = openModal;
window.closeModal = closeModal;
window.debounce = debounce;
window.generateId = generateId;
window.exportToCSV = exportToCSV;
