// Landing page functionality
import { priceEngine, formatPrice, formatPriceChange } from './prices.js';
import { createMiniChart, generateSampleData } from './charts.js';
import { APP_CONFIG } from './config.js';

class LandingPage {
  constructor() {
    this.heroChart = null;
    this.tickerData = [];
    this.init();
  }
  
  init() {
    this.setupNavigation();
    this.setupHeroChart();
    this.setupMarketTicker();
    this.setupScrollEffects();
    this.setupAnimations();
  }
  
  setupNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    
    // Mobile menu toggle
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }
    
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
          
          // Close mobile menu
          hamburger?.classList.remove('active');
          navMenu?.classList.remove('active');
        }
      });
    });
    
    // Update active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 100;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    });
  }
  
  setupHeroChart() {
    const canvas = document.getElementById('hero-chart');
    if (!canvas) return;
    
    // Generate sample data for BTC
    const data = generateSampleData(50, 42850, 0.02);
    
    this.heroChart = createMiniChart(canvas, data, {
      color: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)'
    });
    
    // Subscribe to BTC price updates
    priceEngine.subscribe('BTC/USD', (priceData) => {
      this.updateHeroPrice(priceData);
    });
  }
  
  updateHeroPrice(priceData) {
    const priceElement = document.getElementById('hero-btc-price');
    const changeElement = document.getElementById('hero-btc-change');
    
    if (priceElement) {
      priceElement.textContent = `$${formatPrice(priceData.price)}`;
    }
    
    if (changeElement) {
      const formatted = formatPriceChange(priceData.change, priceData.changePercent);
      changeElement.textContent = formatted.percent;
      changeElement.className = `change ${formatted.isPositive ? 'positive' : 'negative'}`;
    }
    
    // Update chart
    if (this.heroChart) {
      const newDataPoint = {
        x: priceData.timestamp,
        y: priceData.price
      };
      
      const dataset = this.heroChart.data.datasets[0];
      dataset.data.push(newDataPoint);
      
      // Keep only last 50 points
      if (dataset.data.length > 50) {
        dataset.data.shift();
      }
      
      this.heroChart.update('none');
    }
  }
  
  setupMarketTicker() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;
    
    // Initialize ticker with all symbols
    const allSymbols = [
      ...APP_CONFIG.SYMBOLS.crypto.slice(0, 6),
      ...APP_CONFIG.SYMBOLS.forex.slice(0, 4),
      ...APP_CONFIG.SYMBOLS.stocks.slice(0, 4)
    ];
    
    this.tickerData = allSymbols.map(symbolInfo => ({
      symbol: symbolInfo.symbol,
      name: symbolInfo.name,
      price: priceEngine.getCurrentPrice(symbolInfo.symbol),
      change: 0,
      changePercent: 0
    }));
    
    this.renderTicker();
    
    // Subscribe to price updates for all symbols
    priceEngine.subscribe('all', (priceData) => {
      this.updateTickerPrice(priceData);
    });
  }
  
  renderTicker() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;
    
    const tickerHTML = this.tickerData.map(item => {
      const formatted = formatPriceChange(item.change, item.changePercent);
      
      return `
        <div class="ticker-item">
          <span class="ticker-symbol">${item.symbol}</span>
          <span class="ticker-price">$${formatPrice(item.price, 2)}</span>
          <span class="ticker-change ${formatted.isPositive ? 'positive' : 'negative'}">
            ${formatted.percent}
          </span>
        </div>
      `;
    }).join('');
    
    // Duplicate for seamless scrolling
    tickerContent.innerHTML = tickerHTML + tickerHTML;
  }
  
  updateTickerPrice(priceData) {
    const tickerItem = this.tickerData.find(item => item.symbol === priceData.symbol);
    if (tickerItem) {
      tickerItem.price = priceData.price;
      tickerItem.change = priceData.change;
      tickerItem.changePercent = priceData.changePercent;
      
      // Re-render ticker (throttled)
      if (!this.tickerUpdateTimeout) {
        this.tickerUpdateTimeout = setTimeout(() => {
          this.renderTicker();
          this.tickerUpdateTimeout = null;
        }, 1000);
      }
    }
  }
  
  setupScrollEffects() {
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll(
      '.feature-card, .testimonial-card, .stat-item, .about-content, .about-visual'
    );
    
    animateElements.forEach(el => {
      observer.observe(el);
    });
  }
  
  setupAnimations() {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      .feature-card,
      .testimonial-card,
      .stat-item,
      .about-content,
      .about-visual {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
      }
      
      .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      .feature-card {
        transition-delay: 0.1s;
      }
      
      .feature-card:nth-child(2) {
        transition-delay: 0.2s;
      }
      
      .feature-card:nth-child(3) {
        transition-delay: 0.3s;
      }
      
      .testimonial-card:nth-child(2) {
        transition-delay: 0.1s;
      }
      
      .testimonial-card:nth-child(3) {
        transition-delay: 0.2s;
      }
      
      .stat-item:nth-child(2) {
        transition-delay: 0.1s;
      }
      
      .stat-item:nth-child(3) {
        transition-delay: 0.2s;
      }
    `;
    
    document.head.appendChild(style);
    
    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector('.hero');
      
      if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
      }
    });
  }
}

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
  new LandingPage();
});

// Export for external use
export { LandingPage };