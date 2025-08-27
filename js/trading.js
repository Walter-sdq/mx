// Trading Interface and Chart Management
import { state } from './state.js';
import { SessionManager } from './session.js';
import { priceEngine } from './prices.js';
import { showToast, formatCurrency, formatDateTime } from './utils.js';

export class TradingInterface {
  constructor() {
    this.currentSymbol = 'BTC/USD';
    this.currentTimeframe = '1H';
    this.currentSide = 'buy';
    this.currentOrderType = 'market';
    this.chart = null;
    this.openTrades = [];
    
    this.init();
  }
  
  init() {
    this.setupAssetTabs();
    this.setupSymbolSelector();
    this.setupTimeframes();
    this.setupOrderPanel();
    this.setupChart();
    this.loadOpenTrades();
    this.startRealTimeUpdates();
  }
  
  setupAssetTabs() {
    const assetTabs = document.querySelectorAll('.asset-tab');
    assetTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const asset = tab.getAttribute('data-asset');
        this.switchAssetType(asset);
        
        // Update active state
        assetTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }
  
  setupSymbolSelector() {
    const symbolSelect = document.getElementById('symbol-select');
    if (symbolSelect) {
      symbolSelect.addEventListener('change', () => {
        this.currentSymbol = symbolSelect.value;
        this.updateTradingInterface();
      });
    }
  }
  
  setupTimeframes() {
    const timeframeBtns = document.querySelectorAll('.timeframe-btn');
    timeframeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const timeframe = btn.getAttribute('data-timeframe');
        this.currentTimeframe = timeframe;
        this.updateChart();
        
        // Update active state
        timeframeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  
  setupOrderPanel() {
    // Trade side tabs
    const tradeTabs = document.querySelectorAll('.trade-tab');
    tradeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const side = tab.getAttribute('data-side');
        this.currentSide = side;
        this.updateOrderPanel();
        
        // Update active state
        tradeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
    
    // Order type selector
    const orderTypeSelect = document.getElementById('order-type');
    if (orderTypeSelect) {
      orderTypeSelect.addEventListener('change', () => {
        this.currentOrderType = orderTypeSelect.value;
        this.updateOrderPanel();
      });
    }
    
    // Quantity input
    const quantityInput = document.getElementById('trade-quantity');
    if (quantityInput) {
      quantityInput.addEventListener('input', () => {
        this.updateTradeSummary();
      });
    }
    
    // Execute trade button
    const executeBtn = document.getElementById('execute-trade-btn');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        this.executeTrade();
      });
    }
  }
  
  setupChart() {
    const canvas = document.getElementById('trading-chart');
    if (!canvas) return;
    
    if (window.Chart && FEATURES.USE_EXTERNAL_CHART_LIB) {
      this.initChartJS(canvas);
    } else {
      this.initVanillaChart(canvas);
    }
  }
  
  initChartJS(canvas) {
    const ctx = canvas.getContext('2d');
    const history = priceEngine.getPriceHistory(this.currentSymbol, this.currentTimeframe);
    const data = history.map(h => ({ x: h.timestamp, y: h.price }));
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          data: data,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#333333',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context) {
                return new Date(context[0].parsed.x).toLocaleString();
              },
              label: function(context) {
                return `$${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            display: true,
            grid: { display: false },
            ticks: { color: '#666666', maxTicksLimit: 6 }
          },
          y: {
            display: true,
            position: 'right',
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: '#666666',
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
  
  initVanillaChart(canvas) {
    // Vanilla candlestick implementation
    const ctx = canvas.getContext('2d');
    const history = priceEngine.getPriceHistory(this.currentSymbol, this.currentTimeframe);
    
    this.chart = {
      canvas,
      ctx,
      data: history,
      render: () => this.renderVanillaChart()
    };
    
    this.renderVanillaChart();
  }
  
  renderVanillaChart() {
    if (!this.chart || !this.chart.ctx) return;
    
    const { ctx, canvas, data } = this.chart;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    // Calculate price range
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw price line
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = (width / (data.length - 1)) * index;
      const y = height - ((point.price - minPrice) / priceRange) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw current price line
    if (data.length > 0) {
      const currentPrice = data[data.length - 1].price;
      const y = height - ((currentPrice - minPrice) / priceRange) * height;
      
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price label
      ctx.fillStyle = '#4caf50';
      ctx.font = '12px Inter';
      ctx.fillText(`$${currentPrice.toFixed(2)}`, width - 80, y - 5);
    }
  }
  
  switchAssetType(assetType) {
    const symbolSelect = document.getElementById('symbol-select');
    if (!symbolSelect) return;
    
    // Clear current options
    symbolSelect.innerHTML = '';
    
    // Add new options based on asset type
    const symbols = {
      crypto: [
        { symbol: 'BTC/USD', name: 'Bitcoin' },
        { symbol: 'ETH/USD', name: 'Ethereum' },
        { symbol: 'LTC/USD', name: 'Litecoin' },
        { symbol: 'XRP/USD', name: 'Ripple' }
      ],
      forex: [
        { symbol: 'EUR/USD', name: 'Euro / US Dollar' },
        { symbol: 'GBP/USD', name: 'British Pound / US Dollar' },
        { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen' },
        { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar' }
      ],
      stocks: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' }
      ]
    };
    
    symbols[assetType].forEach(symbolInfo => {
      const option = document.createElement('option');
      option.value = symbolInfo.symbol;
      option.textContent = symbolInfo.symbol;
      symbolSelect.appendChild(option);
    });
    
    // Update current symbol and interface
    this.currentSymbol = symbols[assetType][0].symbol;
    this.updateTradingInterface();
  }
  
  updateTradingInterface() {
    this.updatePriceDisplay();
    this.updateChart();
    this.updateOrderPanel();
    this.updateTradeSummary();
  }
  
  updatePriceDisplay() {
    const currentPrice = priceEngine.getCurrentPrice(this.currentSymbol);
    const stats = priceEngine.getMarketStats(this.currentSymbol);
    
    // Update current price
    const symbolEl = document.getElementById('current-symbol');
    const priceEl = document.getElementById('current-price');
    const changeEl = document.getElementById('current-change');
    
    if (symbolEl) symbolEl.textContent = this.currentSymbol;
    if (priceEl) priceEl.textContent = `$${currentPrice.toFixed(2)}`;
    
    if (changeEl && stats) {
      const changePercent = ((stats.close - stats.open) / stats.open) * 100;
      changeEl.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
      changeEl.className = `change ${changePercent >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Update market stats
    if (stats) {
      const highEl = document.getElementById('price-high');
      const lowEl = document.getElementById('price-low');
      const volumeEl = document.getElementById('price-volume');
      
      if (highEl) highEl.textContent = `$${stats.high.toFixed(2)}`;
      if (lowEl) lowEl.textContent = `$${stats.low.toFixed(2)}`;
      if (volumeEl) volumeEl.textContent = `$${(stats.volume / 1000000).toFixed(1)}M`;
    }
  }
  
  updateChart() {
    if (this.chart && this.chart.render) {
      // Vanilla chart
      this.chart.data = priceEngine.getPriceHistory(this.currentSymbol, this.currentTimeframe);
      this.chart.render();
    } else if (this.chart && this.chart.data) {
      // Chart.js
      const history = priceEngine.getPriceHistory(this.currentSymbol, this.currentTimeframe);
      const data = history.map(h => ({ x: h.timestamp, y: h.price }));
      
      this.chart.data.datasets[0].data = data;
      this.chart.update('none');
    }
  }
  
  updateOrderPanel() {
    const executeBtn = document.getElementById('execute-trade-btn');
    if (executeBtn) {
      const symbolBase = this.currentSymbol.split('/')[0];
      executeBtn.className = `execute-btn ${this.currentSide}-btn`;
      executeBtn.innerHTML = `
        <i class="fas fa-arrow-${this.currentSide === 'buy' ? 'up' : 'down'}"></i>
        ${this.currentSide.toUpperCase()} ${symbolBase}
      `;
    }
    
    // Show/hide limit price field
    const limitPriceGroup = document.getElementById('limit-price-group');
    if (limitPriceGroup) {
      limitPriceGroup.style.display = this.currentOrderType === 'limit' ? 'block' : 'none';
    }
  }
  
  updateTradeSummary() {
    const quantityInput = document.getElementById('trade-quantity');
    const limitPriceInput = document.getElementById('limit-price');
    
    if (!quantityInput) return;
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const currentPrice = priceEngine.getCurrentPrice(this.currentSymbol);
    const price = this.currentOrderType === 'limit' 
      ? parseFloat(limitPriceInput?.value) || currentPrice 
      : currentPrice;
    
    const estimatedCost = quantity * price;
    const fee = estimatedCost * 0.003; // 0.3% fee
    const total = estimatedCost + fee;
    
    // Update summary display
    const estimatedCostEl = document.getElementById('estimated-cost');
    const tradingFeeEl = document.getElementById('trading-fee');
    const totalCostEl = document.getElementById('total-cost');
    
    if (estimatedCostEl) estimatedCostEl.textContent = formatCurrency(estimatedCost);
    if (tradingFeeEl) tradingFeeEl.textContent = formatCurrency(fee);
    if (totalCostEl) totalCostEl.textContent = formatCurrency(total);
  }
  
  async executeTrade() {
    const session = SessionManager.getSession();
    if (!session) return;
    
    const quantityInput = document.getElementById('trade-quantity');
    const limitPriceInput = document.getElementById('limit-price');
    const stopLossInput = document.getElementById('stop-loss');
    const takeProfitInput = document.getElementById('take-profit');
    const executeBtn = document.getElementById('execute-trade-btn');
    
    if (!quantityInput || !executeBtn) return;
    
    const quantity = parseFloat(quantityInput.value);
    const currentPrice = priceEngine.getCurrentPrice(this.currentSymbol);
    const price = this.currentOrderType === 'limit' 
      ? parseFloat(limitPriceInput?.value) || currentPrice 
      : currentPrice;
    
    // Validation
    if (!quantity || quantity <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }
    
    const user = state.getUserById(session.userId);
    if (!user) return;
    
    const estimatedCost = quantity * price;
    const fee = estimatedCost * 0.003;
    const totalCost = estimatedCost + fee;
    
    if (totalCost > user.balances.USD) {
      showToast('Insufficient balance', 'error');
      return;
    }
    
    try {
      executeBtn.disabled = true;
      executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Executing...';
      
      // Create trade
      const trade = {
        _id: state.generateId(),
        userId: session.userId,
        symbol: this.currentSymbol,
        side: this.currentSide,
        type: this.currentOrderType,
        qty: quantity,
        entryPrice: price,
        stopLoss: parseFloat(stopLossInput?.value) || null,
        takeProfit: parseFloat(takeProfitInput?.value) || null,
        status: 'open',
        openedAt: Date.now()
      };
      
      state.addTrade(trade);
      
      // Create transaction
      const transaction = {
        _id: state.generateId(),
        userId: session.userId,
        type: 'trade',
        amount: quantity,
        currency: this.currentSymbol.split('/')[0],
        status: 'completed',
        note: `${this.currentSide.toUpperCase()} ${quantity} ${this.currentSymbol} at $${price.toFixed(2)}`,
        createdAt: Date.now(),
        meta: { tradeId: trade._id, side: this.currentSide, price }
      };
      
      state.addTransaction(transaction);
      
      // Update user balance
      const newBalance = user.balances.USD - totalCost;
      state.updateUser(session.userId, {
        balances: { ...user.balances, USD: newBalance }
      });
      
      // Refresh displays
      this.loadOpenTrades();
      
      showToast(`${this.currentSide.toUpperCase()} order executed successfully!`, 'success');
      
      // Reset form
      quantityInput.value = '';
      if (limitPriceInput) limitPriceInput.value = '';
      if (stopLossInput) stopLossInput.value = '';
      if (takeProfitInput) takeProfitInput.value = '';
      
      this.updateTradeSummary();
      
    } catch (error) {
      console.error('Trade execution error:', error);
      showToast('Trade execution failed', 'error');
    } finally {
      executeBtn.disabled = false;
      this.updateOrderPanel();
    }
  }
  
  loadOpenTrades() {
    const session = SessionManager.getSession();
    if (!session) return;
    
    this.openTrades = state.getTrades(session.userId).filter(trade => trade.status === 'open');
    this.renderOpenTrades();
  }
  
  renderOpenTrades() {
    const tbody = document.getElementById('open-trades-tbody');
    const countEl = document.getElementById('open-trades-count');
    
    if (countEl) {
      countEl.textContent = `${this.openTrades.length} position${this.openTrades.length !== 1 ? 's' : ''}`;
    }
    
    if (!tbody) return;
    
    if (this.openTrades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No open positions</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.openTrades.map(trade => {
      const currentPrice = priceEngine.getCurrentPrice(trade.symbol);
      const pnl = this.calculatePnL(trade, currentPrice);
      const pnlClass = pnl >= 0 ? 'positive' : 'negative';
      
      return `
        <tr>
          <td>${trade.symbol}</td>
          <td>
            <span class="text-capitalize ${trade.side === 'buy' ? 'text-success' : 'text-error'}">
              ${trade.side}
            </span>
          </td>
          <td>${trade.qty}</td>
          <td>$${trade.entryPrice.toFixed(2)}</td>
          <td>$${currentPrice.toFixed(2)}</td>
          <td class="pnl ${pnlClass}">$${Math.abs(pnl).toFixed(2)}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn" onclick="trading.closeTrade('${trade._id}')">
                Close
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  async closeTrade(tradeId) {
    const trade = this.openTrades.find(t => t._id === tradeId);
    if (!trade) return;
    
    const currentPrice = priceEngine.getCurrentPrice(trade.symbol);
    const pnl = this.calculatePnL(trade, currentPrice);
    
    // Update trade
    state.updateTrade(tradeId, {
      status: 'closed',
      closePrice: currentPrice,
      pnl: pnl,
      closedAt: Date.now()
    });
    
    // Create closing transaction
    const transaction = {
      _id: state.generateId(),
      userId: trade.userId,
      type: 'trade',
      amount: Math.abs(pnl),
      currency: 'USD',
      status: 'completed',
      note: `Closed ${trade.side.toUpperCase()} ${trade.qty} ${trade.symbol} - P&L: ${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}`,
      createdAt: Date.now(),
      meta: { tradeId, closePrice: currentPrice, pnl }
    };
    
    state.addTransaction(transaction);
    
    // Update user balance
    const user = state.getUserById(trade.userId);
    if (user) {
      const newBalance = user.balances.USD + pnl;
      state.updateUser(trade.userId, {
        balances: { ...user.balances, USD: newBalance }
      });
    }
    
    // Refresh displays
    this.loadOpenTrades();
    
    const pnlText = pnl >= 0 ? `profit of $${pnl.toFixed(2)}` : `loss of $${Math.abs(pnl).toFixed(2)}`;
    showToast(`Trade closed with ${pnlText}`, pnl >= 0 ? 'success' : 'warning');
  }
  
  calculatePnL(trade, currentPrice) {
    const priceDiff = trade.side === 'buy' 
      ? currentPrice - trade.entryPrice 
      : trade.entryPrice - currentPrice;
    
    return priceDiff * trade.qty;
  }
  
  startRealTimeUpdates() {
    // Subscribe to price updates
    priceEngine.subscribe(this.currentSymbol, (priceData) => {
      this.updatePriceDisplay();
      this.updateChart();
      this.updateOpenTradesPnL();
    });
    
    // Update open trades P&L every few seconds
    setInterval(() => {
      this.updateOpenTradesPnL();
    }, 3000);
  }
  
  updateOpenTradesPnL() {
    this.openTrades.forEach(trade => {
      const currentPrice = priceEngine.getCurrentPrice(trade.symbol);
      trade.currentPnL = this.calculatePnL(trade, currentPrice);
    });
    
    this.renderOpenTrades();
  }
}

// Global trading interface instance
let trading;

// Initialize trading interface when on trading page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('trading-page')) {
    trading = new TradingInterface();
    window.trading = trading; // Make available for onclick handlers
  }
});

export { TradingInterface };