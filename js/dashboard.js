// Dashboard JavaScript - Production Ready
// Remove ES module imports for browser compatibility
// Use global objects from window

class TradingDashboard {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.currentPage = "home";
    this.isBalanceVisible = true;
    this.currentSymbol = "BTC/USD";
    this.watchlist = [];
    this.positions = [];
    this.transactions = [];
    this.notifications = [];
    this.transactionFilter = "all";
    this.transactionSearch = "";
    this.notificationFilter = "all";
    this.notificationSearch = "";
    this.isAdminMode = false;
    this.editableContent = {};
    this.init();
  }

  async init() {
    // Ensure authManager is available. Some pages load it as a module
    // and others expect it to be global. Try to resolve it dynamically.
    if (typeof authManager === "undefined" || !authManager) {
      try {
        const mod = await import("./auth.js");
        if (mod && mod.authManager) {
          window.authManager = mod.authManager;
        }
      } catch (e) {
        console.warn("Could not import ./auth.js (dashboard fallback):", e);
      }
    }

    // Final fallback: try to use supabase helper to read current user/profile
    if (typeof authManager === "undefined" || !authManager) {
      try {
        const sup = await import("./supabase.js");
        if (sup && sup.getCurrentUser) {
          const current = await sup.getCurrentUser();
          if (current && current.user && current.profile) {
            // Create a tiny shim so dashboard can call authManager.getUser()/getProfile()
            window.authManager = {
              isAuthenticated: () => !!current.user,
              getUser: () => current.user,
              getProfile: () => current.profile,
              logout: async () => await sup.signOut(),
            };
          }
        }
      } catch (e) {
        console.warn("Supabase fallback failed:", e);
      }
    }

    // Give authManager a chance to populate session if it exposes checkSession()
    if (authManager && typeof authManager.checkSession === "function") {
      try {
        await authManager.checkSession();
      } catch (e) {
        console.warn("authManager.checkSession() failed or is not ready:", e);
      }
    }

    // Check authentication
    if (
      !authManager ||
      !authManager.isAuthenticated ||
      !authManager.isAuthenticated()
    ) {
      window.location.href = "login.html";
      return;
    }

    this.currentUser = authManager.getUser();
    this.currentProfile = authManager.getProfile();

    // Display name from Supabase profile - will be updated in updateUserInterface()

    if (!this.currentUser || !this.currentProfile) {
      window.location.href = "login.html";
      return;
    }

    this.updateTime();
    this.setupEventListeners();
    showLoading(true);
    await this.loadUserData();
    showLoading(false);
    this.updateUI();
    this.startRealTimeUpdates();

    // Ensure username is updated after everything loads
    setTimeout(() => {
      this.updateUserInterface();
    }, 1000);

    setInterval(() => this.updateTime(), 60000);
  }

  async loadUserData() {
    try {
      // Load user transactions
      const { data: transactions } = await apiClient.getTransactions(
        this.currentUser.id
      );
      this.transactions = transactions || [];

      // Load user trades
      const { data: trades } = await apiClient.getTrades(this.currentUser.id);
      this.positions = (trades || []).filter(
        (trade) => trade.status === "open"
      );

      // Load user notifications
      const { data: notifications } = await apiClient.getNotifications(
        this.currentUser.id
      );
      this.notifications = notifications || [];

      this.updateUserInterface();
    } catch (error) {
      console.error("Failed to load user data:", error);
      showToast("Failed to load user data", "error");
    }
  }

  updateUserInterface() {
    if (!this.currentProfile) {
      console.warn("No user profile available for UI update");
      return;
    }

    // Update username display in header
    const usernameEl = document.getElementById("username");
    if (usernameEl) {
      const displayName =
        this.currentProfile.full_name || this.currentProfile.email || "User";
      usernameEl.textContent = displayName;
      console.log("Updated username display:", displayName);
    }

    // Update greeting with user's name
    const greetingEl = document.getElementById("greeting");
    if (greetingEl) {
      const hour = new Date().getHours();
      let timeGreeting = "Good morning";
      if (hour >= 12 && hour < 18) timeGreeting = "Good afternoon";
      else if (hour >= 18) timeGreeting = "Good evening";

      const userName = this.currentProfile.full_name
        ? this.currentProfile.full_name.split(" ")[0]
        : "there";
      greetingEl.textContent = `${timeGreeting}, ${userName}!`;
    }

    // Update profile modal data
    this.updateProfileModalData();

    // Update notification count
    const unreadCount = this.notifications.filter((n) => !n.read).length;
    const notificationCountEl = document.getElementById("notification-count");
    if (notificationCountEl) {
      notificationCountEl.textContent = unreadCount;
      notificationCountEl.style.display = unreadCount > 0 ? "block" : "none";
    }

    // Update page headers with user name
    this.updatePageHeaders(this.currentPage);

    this.updatePortfolioFromUser();
    this.updateProfileStats();
  }

  updateProfileModalData() {
    // Update profile modal name
    const profileModalNameEl = document.getElementById("profileModalName");
    if (profileModalNameEl) {
      const displayName =
        this.currentProfile.full_name || this.currentProfile.email || "User";
      profileModalNameEl.textContent = displayName;
    }

    // Update profile modal email
    const profileModalEmailEl = document.getElementById("profileModalEmail");
    if (profileModalEmailEl) {
      profileModalEmailEl.textContent =
        this.currentProfile.email || "No email provided";
    }

    // Update profile modal balance
    const profileModalBalanceEl = document.getElementById(
      "profileModalBalance"
    );
    if (profileModalBalanceEl && this.currentProfile.balances) {
      const totalBalance =
        this.currentProfile.balances.USD +
        this.currentProfile.balances.BTC *
          (realTimePrices.getCurrentPrice("BTC/USD") || 43250) +
        this.currentProfile.balances.ETH *
          (realTimePrices.getCurrentPrice("ETH/USD") || 2580);
      profileModalBalanceEl.textContent = formatCurrency(totalBalance);
    }
  }

  updateProfileStats() {
    if (!this.currentProfile) return;

    const totalTrades = this.transactions.filter(
      (t) => t.type === "trade"
    ).length;
    const winningTrades = this.transactions.filter(
      (t) => t.type === "trade" && t.amount > 0
    ).length;
    const winRate =
      totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
    const daysActive = Math.floor(
      (Date.now() - new Date(this.currentProfile.created_at).getTime()) /
        (24 * 60 * 60 * 1000)
    );

    const totalTradesEl = document.getElementById("profileTotalTrades");
    const winRateEl = document.getElementById("profileWinRate");
    const daysActiveEl = document.getElementById("profileDaysActive");

    if (totalTradesEl) totalTradesEl.textContent = totalTrades;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    if (daysActiveEl) daysActiveEl.textContent = daysActive;
  }

  updatePortfolioFromUser() {
    if (!this.currentProfile) return;

    const balances = this.currentProfile.balances || { USD: 0, BTC: 0, ETH: 0 };
    const prices = realTimePrices.getAllPrices();
    const totalValue =
      balances.USD +
      balances.BTC * (prices["BTC/USD"] || 43250) +
      balances.ETH * (prices["ETH/USD"] || 2580);

    const balanceEl = document.getElementById("portfolioBalance");
    const availableEl = document.getElementById("available-balance");

    if (balanceEl && this.isBalanceVisible) {
      balanceEl.textContent = formatCurrency(totalValue);
    }

    if (availableEl) {
      availableEl.textContent = formatCurrency(balances.USD);
    }

    // Calculate today's P&L from trades
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayTrades = this.transactions.filter(
      (t) =>
        t.type === "trade" && new Date(t.created_at).getTime() >= todayStart
    );
    const todayPnL = todayTrades.reduce(
      (sum, trade) => sum + (trade.amount || 0),
      0
    );

    const pnlEl = document.getElementById("pnl-today");
    if (pnlEl) {
      pnlEl.textContent = formatCurrency(todayPnL);
      pnlEl.className = `stat-value ${todayPnL >= 0 ? "positive" : "negative"}`;
    }

    // Calculate margin used from open trades
    const marginUsed = this.positions.reduce(
      (sum, trade) => sum + trade.quantity * trade.entry_price,
      0
    );

    const marginEl = document.getElementById("margin-used");
    if (marginEl) {
      marginEl.textContent = formatCurrency(marginUsed);
    }
  }

  setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const page = e.currentTarget.dataset.page;
        this.navigateToPage(page);
      });
    });

    // Balance visibility toggle
    const balanceToggle = document.getElementById("balanceToggle");
    if (balanceToggle) {
      balanceToggle.addEventListener("click", () =>
        this.toggleBalanceVisibility()
      );
    }

    // Quick actions
    this.setupQuickActions();

    // Trading controls
    this.setupTradingControls();

    // Symbol selector
    this.setupSymbolSelector();

    // Transaction filters
    this.setupTransactionFilters();

    // Profile menu items
    this.setupProfileMenu();

    // Notification handlers
    this.setupNotificationHandlers();

    // Admin mode toggle
    const adminModeBtn = document.getElementById("adminModeBtn");
    if (adminModeBtn) {
      adminModeBtn.addEventListener("click", () => this.toggleAdminMode());
    }
  }

  setupNotificationHandlers() {
    const notificationBtn = document.getElementById("notificationBtn");
    const markAllReadBtn = document.getElementById("markAllRead");

    if (notificationBtn) {
      notificationBtn.addEventListener("click", () => {
        this.navigateToPage("notifications");
      });
    }

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", async () => {
        try {
          await apiClient.markAllNotificationsRead(this.currentUser.id);
          this.notifications = this.notifications.map((n) => ({
            ...n,
            read: true,
          }));
          this.updateUserInterface();
          this.loadNotifications();
          showToast("All notifications marked as read", "success");
        } catch (error) {
          console.error("Mark all read error:", error);
          showToast("Failed to mark notifications as read", "error");
        }
      });
    }
  }

  setupSymbolSelector() {
    const symbolSelector = document.getElementById("symbolSelector");
    if (symbolSelector) {
      symbolSelector.addEventListener("click", () => {
        this.showSymbolModal();
      });
    }

    // Category tabs
    const categoryTabs = document.querySelectorAll(".category-tab");
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const category = tab.getAttribute("data-category");
        this.showSymbolCategory(category);

        categoryTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
      });
    });
  }

  showSymbolModal() {
    const modal = document.getElementById("symbolModal");
    if (modal) {
      modal.classList.add("active");
      this.showSymbolCategory("crypto");
    }
  }

  showSymbolCategory(category) {
    const symbolList = document.getElementById("symbolList");
    if (!symbolList) return;

    const symbols = {
      crypto: [
        { symbol: "BTC/USD", name: "Bitcoin" },
        { symbol: "ETH/USD", name: "Ethereum" },
        { symbol: "LTC/USD", name: "Litecoin" },
        { symbol: "XRP/USD", name: "Ripple" },
        { symbol: "ADA/USD", name: "Cardano" },
        { symbol: "DOT/USD", name: "Polkadot" },
      ],
      forex: [
        { symbol: "EUR/USD", name: "Euro / US Dollar" },
        { symbol: "GBP/USD", name: "British Pound / US Dollar" },
        { symbol: "USD/JPY", name: "US Dollar / Japanese Yen" },
        { symbol: "AUD/USD", name: "Australian Dollar / US Dollar" },
      ],
      stocks: [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "GOOGL", name: "Alphabet Inc." },
        { symbol: "MSFT", name: "Microsoft Corporation" },
        { symbol: "TSLA", name: "Tesla Inc." },
      ],
    };

    const categorySymbols = symbols[category] || [];

    symbolList.innerHTML = categorySymbols
      .map((symbol) => {
        const priceData = realTimePrices.getPriceData(symbol.symbol);
        const price = priceData?.price || 0;
        const changePercent = priceData?.changePercent || 0;

        return `
                <div class="symbol-item" onclick="tradingDashboard.selectSymbol('${
                  symbol.symbol
                }')">
                    <div class="symbol-info">
                        <span class="symbol-name">${symbol.symbol}</span>
                        <span class="symbol-description">${symbol.name}</span>
                    </div>
                    <div class="symbol-price">
                        <span class="price">$${price.toFixed(2)}</span>
                        <span class="change ${
                          changePercent >= 0 ? "positive" : "negative"
                        }">
                            ${
                              changePercent >= 0 ? "+" : ""
                            }${changePercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  selectSymbol(symbol) {
    this.currentSymbol = symbol;

    // Update display
    const currentSymbolEl = document.getElementById("current-symbol");
    if (currentSymbolEl) currentSymbolEl.textContent = symbol;

    this.updateTradingPrices();
    this.closeSymbolModal();
  }

  closeSymbolModal() {
    const modal = document.getElementById("symbolModal");
    if (modal) {
      modal.classList.remove("active");
    }
  }

  updateTradingPrices() {
    const priceData = realTimePrices.getPriceData(this.currentSymbol);
    if (!priceData) return;

    const spread = priceData.price * 0.0002; // 0.02% spread

    const bidPriceEl = document.getElementById("bid-price");
    const askPriceEl = document.getElementById("ask-price");
    const symbolChangeEl = document.getElementById("symbol-change");
    const buyPriceEl = document.querySelector(".buy-price");
    const sellPriceEl = document.querySelector(".sell-price");

    if (bidPriceEl)
      bidPriceEl.textContent = (priceData.price - spread).toFixed(2);
    if (askPriceEl)
      askPriceEl.textContent = (priceData.price + spread).toFixed(2);
    if (buyPriceEl)
      buyPriceEl.textContent = (priceData.price + spread).toFixed(2);
    if (sellPriceEl)
      sellPriceEl.textContent = (priceData.price - spread).toFixed(2);

    if (symbolChangeEl) {
      symbolChangeEl.textContent = `${
        priceData.changePercent >= 0 ? "+" : ""
      }${priceData.changePercent.toFixed(2)}%`;
      symbolChangeEl.className = `price-change ${
        priceData.changePercent >= 0 ? "positive" : "negative"
      }`;
    }
  }

  setupQuickActions() {
    const actions = {
      depositBtn: () => (window.location.href = "deposit.html"),
      withdrawBtn: () => (window.location.href = "withdraw.html"),
      transferBtn: () => this.showTransferModal(),
      historyBtn: () => this.navigateToPage("transactions"),
    };

    Object.entries(actions).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) element.addEventListener("click", handler);
    });
  }

  setupTradingControls() {
    // Enhanced Trade Panel Controls
    this.setupEnhancedTradePanel();

    // Legacy order type buttons (for backward compatibility)
    document.querySelectorAll(".order-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".order-btn")
          .forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
      });
    });

    // Legacy volume buttons (for backward compatibility)
    document.querySelectorAll(".volume-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const volume = e.currentTarget.dataset.volume;
        const volumeInput = document.querySelector(".volume-input");
        if (volumeInput) volumeInput.value = volume;
        document
          .querySelectorAll(".volume-btn")
          .forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
      });
    });

    // Execute trade button
    const executeBtn = document.getElementById("executeTrade");
    if (executeBtn) {
      executeBtn.addEventListener("click", () => this.executeTrade());
    }
  }

  setupEnhancedTradePanel() {
    // Order type selection
    const orderTypeButtons = document.querySelectorAll(".order-type-btn");
    orderTypeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        orderTypeButtons.forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");

        const orderType = e.currentTarget.dataset.type;
        this.handleOrderTypeChange(orderType);
      });
    });

    // Trade direction selection
    const directionButtons = document.querySelectorAll(".direction-btn");
    directionButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        directionButtons.forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");

        const direction = e.currentTarget.dataset.direction;
        this.handleDirectionChange(direction);
      });
    });

    // Volume input and presets
    const volumeInput = document.getElementById("volumeInput");
    const volumePresets = document.querySelectorAll(".volume-preset");

    if (volumeInput) {
      volumeInput.addEventListener("input", () => this.updateOrderSummary());
    }

    volumePresets.forEach((preset) => {
      preset.addEventListener("click", (e) => {
        const volume = e.currentTarget.dataset.volume;
        if (volumeInput) volumeInput.value = volume;
        this.updateOrderSummary();
      });
    });

    // Price input (for limit/stop orders)
    const priceInput = document.getElementById("priceInput");
    if (priceInput) {
      priceInput.addEventListener("input", () => this.updateOrderSummary());
    }

    // Risk management inputs
    const stopLossInput = document.getElementById("stopLossInput");
    const takeProfitInput = document.getElementById("takeProfitInput");

    if (stopLossInput) {
      stopLossInput.addEventListener("input", () => this.validateRiskInputs());
    }

    if (takeProfitInput) {
      takeProfitInput.addEventListener("input", () =>
        this.validateRiskInputs()
      );
    }

    // Execute trade button
    const executeTradeBtn = document.getElementById("executeTradeBtn");
    if (executeTradeBtn) {
      executeTradeBtn.addEventListener("click", () =>
        this.executeEnhancedTrade()
      );
    }

    // Initialize order summary
    this.updateOrderSummary();
  }

  handleOrderTypeChange(orderType) {
    const priceSection = document.getElementById("priceSection");
    const priceInput = document.getElementById("priceInput");

    if (orderType === "market") {
      if (priceSection) priceSection.style.display = "none";
      if (priceInput) priceInput.value = "";
    } else {
      if (priceSection) priceSection.style.display = "block";
      if (priceInput) {
        const currentPrice = realTimePrices.getCurrentPrice(this.currentSymbol);
        priceInput.value = currentPrice.toFixed(2);
      }
    }

    this.updateOrderSummary();
  }

  handleDirectionChange(direction) {
    this.updateOrderSummary();
  }

  updateOrderSummary() {
    const volumeInput = document.getElementById("volumeInput");
    const priceInput = document.getElementById("priceInput");
    const orderTypeButtons = document.querySelectorAll(".order-type-btn");
    const directionButtons = document.querySelectorAll(".direction-btn");

    // Get current values
    const volume = parseFloat(volumeInput?.value) || 0;
    const price = parseFloat(priceInput?.value) || 0;
    const orderType =
      Array.from(orderTypeButtons).find((btn) =>
        btn.classList.contains("active")
      )?.dataset.type || "market";
    const direction =
      Array.from(directionButtons).find((btn) =>
        btn.classList.contains("active")
      )?.dataset.direction || "buy";

    // Update summary display
    const summarySymbol = document.getElementById("summarySymbol");
    const summaryDirection = document.getElementById("summaryDirection");
    const summaryVolume = document.getElementById("summaryVolume");
    const summaryPrice = document.getElementById("summaryPrice");
    const summaryTotal = document.getElementById("summaryTotal");

    if (summarySymbol) summarySymbol.textContent = this.currentSymbol;
    if (summaryDirection)
      summaryDirection.textContent = direction.toUpperCase();
    if (summaryVolume) summaryVolume.textContent = volume.toFixed(4);

    if (orderType === "market") {
      if (summaryPrice) summaryPrice.textContent = "Market";
      const currentPrice = realTimePrices.getCurrentPrice(this.currentSymbol);
      const total = volume * currentPrice;
      if (summaryTotal) summaryTotal.textContent = `$${total.toFixed(2)}`;
    } else {
      if (summaryPrice) summaryPrice.textContent = `$${price.toFixed(2)}`;
      const total = volume * price;
      if (summaryTotal) summaryTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Update execute button state
    const executeBtn = document.getElementById("executeTradeBtn");
    if (executeBtn) {
      executeBtn.disabled =
        volume <= 0 || (orderType !== "market" && price <= 0);
    }
  }

  validateRiskInputs() {
    const stopLossInput = document.getElementById("stopLossInput");
    const takeProfitInput = document.getElementById("takeProfitInput");
    const directionButtons = document.querySelectorAll(".direction-btn");

    const direction =
      Array.from(directionButtons).find((btn) =>
        btn.classList.contains("active")
      )?.dataset.direction || "buy";
    const currentPrice = realTimePrices.getCurrentPrice(this.currentSymbol);

    if (stopLossInput && stopLossInput.value) {
      const stopLoss = parseFloat(stopLossInput.value);
      if (direction === "buy" && stopLoss >= currentPrice) {
        stopLossInput.classList.add("error");
        showToast(
          "Stop loss should be below current price for buy orders",
          "warning"
        );
      } else if (direction === "sell" && stopLoss <= currentPrice) {
        stopLossInput.classList.add("error");
        showToast(
          "Stop loss should be above current price for sell orders",
          "warning"
        );
      } else {
        stopLossInput.classList.remove("error");
      }
    }

    if (takeProfitInput && takeProfitInput.value) {
      const takeProfit = parseFloat(takeProfitInput.value);
      if (direction === "buy" && takeProfit <= currentPrice) {
        takeProfitInput.classList.add("error");
        showToast(
          "Take profit should be above current price for buy orders",
          "warning"
        );
      } else if (direction === "sell" && takeProfit >= currentPrice) {
        takeProfitInput.classList.add("error");
        showToast(
          "Take profit should be below current price for sell orders",
          "warning"
        );
      } else {
        takeProfitInput.classList.remove("error");
      }
    }
  }

  setupTransactionFilters() {
    // Enhanced transaction filter tabs
    const transactionFilterTabs = document.querySelectorAll(
      "#transactionsPage .filter-tab"
    );
    transactionFilterTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        transactionFilterTabs.forEach((t) => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.transactionFilter = e.currentTarget.dataset.filter;
        this.applyTransactionFilters();
      });
    });

    // Enhanced transaction search
    const transactionSearchInput = document.getElementById("transactionSearch");
    if (transactionSearchInput) {
      transactionSearchInput.addEventListener("input", (e) => {
        this.transactionSearch = e.target.value.toLowerCase();
        this.applyTransactionFilters();
      });
    }

    // Enhanced notification filter tabs
    const notificationFilterTabs = document.querySelectorAll(
      "#notificationsPage .filter-tab"
    );
    notificationFilterTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        notificationFilterTabs.forEach((t) => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.notificationFilter = e.currentTarget.dataset.filter;
        this.applyNotificationFilters();
      });
    });

    // Enhanced notification search
    const notificationSearchInput =
      document.getElementById("notificationSearch");
    if (notificationSearchInput) {
      notificationSearchInput.addEventListener("input", (e) => {
        this.notificationSearch = e.target.value.toLowerCase();
        this.applyNotificationFilters();
      });
    }

    // Enhanced notification actions
    this.setupNotificationActions();
  }

  setupNotificationActions() {
    // Mark all notifications as read
    const markAllReadBtn = document.getElementById("markAllRead");
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", async () => {
        try {
          await apiClient.markAllNotificationsRead(this.currentUser.id);
          this.notifications = this.notifications.map((n) => ({
            ...n,
            read: true,
          }));
          this.updateUserInterface();
          this.loadNotifications();
          showToast("All notifications marked as read", "success");
        } catch (error) {
          console.error("Mark all read error:", error);
          showToast("Failed to mark notifications as read", "error");
        }
      });
    }

    // Clear all notifications
    const clearAllBtn = document.getElementById("clearAllNotifications");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to clear all notifications?")) {
          try {
            await apiClient.clearAllNotifications(this.currentUser.id);
            this.notifications = [];
            this.updateUserInterface();
            this.loadNotifications();
            showToast("All notifications cleared", "success");
          } catch (error) {
            console.error("Clear all notifications error:", error);
            showToast("Failed to clear notifications", "error");
          }
        }
      });
    }
  }

  setupProfileMenu() {
    const menuItems = {
      personalInfo: () => (window.location.href = "settings.html"),
      security: () => (window.location.href = "settings.html"),
      verification: () => showToast("Verification coming soon", "info"),
      notifications: () => (window.location.href = "settings.html"),
      language: () => showToast("Language settings coming soon", "info"),
      currency: () => showToast("Currency settings coming soon", "info"),
      help: () => showToast("Help center coming soon", "info"),
      contact: () => showToast("Contact support coming soon", "info"),
      terms: () => showToast("Terms & conditions coming soon", "info"),
      logout: () => this.logout(),
    };

    Object.entries(menuItems).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) element.addEventListener("click", handler);
    });
  }

  navigateToPage(page) {
    // Hide all pages
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));

    // Show selected page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.add("active");
    }

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.page === page) {
        item.classList.add("active");
      }
    });

    this.currentPage = page;

    // Update page headers with user name
    this.updatePageHeaders(page);

    // Load page-specific data
    switch (page) {
      case "trading":
        this.updateTradingPrices();
        break;
      case "transactions":
        this.loadTransactions();
        break;
      case "notifications":
        this.loadNotifications();
        break;
    }
  }

  updatePageHeaders(page) {
    if (!this.currentProfile) return;

    const userName = this.currentProfile.full_name || "User";

    switch (page) {
      case "transactions":
        const transactionsHeader = document.querySelector(
          "#transactionsPage .page-header h2"
        );
        if (transactionsHeader) {
          transactionsHeader.textContent = `${userName}'s Transactions`;
        }
        break;
      case "notifications":
        const notificationsHeader = document.querySelector(
          "#notificationsPage .page-header h2"
        );
        if (notificationsHeader) {
          notificationsHeader.textContent = `${userName}'s Notifications`;
        }
        break;
      case "support":
        const supportHeader = document.querySelector(
          "#supportPage .page-header h2"
        );
        if (supportHeader) {
          supportHeader.textContent = `${userName}'s Live Payments`;
        }
        break;
    }
  }

  updateWatchlist() {
    const symbols = ["BTC/USD", "ETH/USD", "EUR/USD", "GBP/USD", "AAPL"];

    this.watchlist = symbols.map((symbol) => {
      const priceData = realTimePrices.getPriceData(symbol);
      return {
        symbol,
        name: this.getSymbolName(symbol),
        price: priceData?.price || 0,
        change: priceData?.change || 0,
        changePercent: priceData?.changePercent || 0,
      };
    });

    this.renderWatchlist();
  }

  getSymbolName(symbol) {
    const names = {
      "BTC/USD": "Bitcoin",
      "ETH/USD": "Ethereum",
      "EUR/USD": "Euro / US Dollar",
      "GBP/USD": "British Pound / US Dollar",
      AAPL: "Apple Inc.",
    };
    return names[symbol] || symbol;
  }

  updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Update greeting
    const hour = now.getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 18) greeting = "Good afternoon";
    else if (hour >= 18) greeting = "Good evening";

    const greetingElement = document.getElementById("greeting");
    if (greetingElement) {
      greetingElement.textContent = greeting;
    }
  }

  toggleBalanceVisibility() {
    this.isBalanceVisible = !this.isBalanceVisible;
    const balanceElement = document.getElementById("portfolioBalance");
    const toggleIcon = document.querySelector("#balanceToggle i");

    if (balanceElement && toggleIcon) {
      if (this.isBalanceVisible) {
        this.updatePortfolioFromUser();
        toggleIcon.className = "fas fa-eye";
      } else {
        balanceElement.textContent = "****";
        toggleIcon.className = "fas fa-eye-slash";
      }
    }
  }

  updateUI() {
    this.updateWatchlist();
    this.updatePositions();
    this.updateRecentActivity();
  }

  updatePositions() {
    this.renderPositions();
  }

  renderWatchlist() {
    const container = document.getElementById("watchlistContainer");
    if (!container) return;

    container.innerHTML = this.watchlist
      .map(
        (item) => `
            <div class="watchlist-item">
                <div class="watchlist-symbol">
                    <div class="symbol-name">${item.symbol}</div>
                    <div class="symbol-description">${item.name}</div>
                </div>
                <div class="watchlist-price">
                    <div class="price">${item.price.toFixed(2)}</div>
                    <div class="price-change ${
                      item.changePercent >= 0 ? "positive" : "negative"
                    }">
                        ${
                          item.changePercent >= 0 ? "+" : ""
                        }${item.changePercent.toFixed(2)}%
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  renderPositions() {
    const container = document.getElementById("positionsList");
    const countElement = document.getElementById("positionCount");

    if (!container) return;

    if (countElement) {
      countElement.textContent = this.positions.length;
    }

    if (this.positions.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No open positions. Start trading to see your positions here.</div>';
      return;
    }

    container.innerHTML = this.positions
      .map((position) => {
        const currentPrice = realTimePrices.getCurrentPrice(position.symbol);
        const pnl = this.calculateTradePnL(position, currentPrice);
        const pnlPercent =
          (pnl / (position.entry_price * position.quantity)) * 100;

        return `
                <div class="position-item">
                    <div class="position-info">
                        <div class="position-symbol">${
                          position.symbol
                        } ${position.side.toUpperCase()}</div>
                        <div class="position-details">${
                          position.quantity
                        } • $${position.entry_price.toFixed(2)}</div>
                    </div>
                    <div class="position-pnl">
                        <div class="pnl-amount ${
                          pnl >= 0 ? "positive" : "negative"
                        }">
                            ${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}
                        </div>
                        <div class="pnl-percentage">${
                          pnlPercent >= 0 ? "+" : ""
                        }${pnlPercent.toFixed(2)}%</div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  calculateTradePnL(trade, currentPrice) {
    const priceDiff =
      trade.side === "buy"
        ? currentPrice - trade.entry_price
        : trade.entry_price - currentPrice;

    return priceDiff * trade.quantity;
  }

  updateRecentActivity() {
    const container = document.getElementById("recentActivity");
    if (!container) return;

    const recentTransactions = this.transactions.slice(0, 5);

    if (recentTransactions.length === 0) {
      container.innerHTML = '<div class="empty-state">No recent activity</div>';
      return;
    }

    container.innerHTML = recentTransactions
      .map(
        (transaction) => `
            <div class="activity-item">
                <div class="activity-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(
                      transaction.type
                    )}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${
                      transaction.note || transaction.type
                    }</div>
                    <div class="activity-subtitle">${getRelativeTime(
                      new Date(transaction.created_at).getTime()
                    )}</div>
                </div>
                <div class="activity-amount ${
                  this.isPositiveTransaction(transaction.type)
                    ? "positive"
                    : "negative"
                }">
                    ${
                      this.isPositiveTransaction(transaction.type) ? "+" : "-"
                    }${formatCurrency(transaction.amount)}
                </div>
            </div>
        `
      )
      .join("");
  }

  isPositiveTransaction(type) {
    return ["deposit", "interest", "bonus"].includes(type);
  }

  loadTransactions() {
    const container = document.getElementById("transactionsList");
    if (!container) return;

    if (this.transactions.length === 0) {
      this.showTransactionEmptyState();
      return;
    }

    // Apply filters and render
    this.renderEnhancedTransactions();
    this.updateTransactionSummary();
  }

  renderEnhancedTransactions() {
    const container = document.getElementById("transactionsList");
    if (!container) return;

    let filteredTransactions = this.transactions;

    // Apply filters
    if (this.transactionFilter !== "all") {
      filteredTransactions = filteredTransactions.filter((t) => {
        switch (this.transactionFilter) {
          case "deposits":
            return t.type === "deposit";
          case "withdrawals":
            return t.type === "withdrawal";
          case "trades":
            return t.type === "trade";
          case "transfers":
            return t.type === "transfer";
          default:
            return true;
        }
      });
    }

    // Apply search
    if (this.transactionSearch && this.transactionSearch.trim() !== "") {
      filteredTransactions = filteredTransactions.filter((t) => {
        const note = (t.note || "").toLowerCase();
        const type = (t.type || "").toLowerCase();
        const amount = (t.amount || "").toString().toLowerCase();
        const status = (t.status || "").toLowerCase();
        return (
          note.includes(this.transactionSearch) ||
          type.includes(this.transactionSearch) ||
          amount.includes(this.transactionSearch) ||
          status.includes(this.transactionSearch)
        );
      });
    }

    if (filteredTransactions.length === 0) {
      this.showTransactionEmptyState();
      return;
    }

    container.innerHTML = filteredTransactions
      .map(
        (transaction) => `
            <div class="transaction-card fade-in">
                <div class="transaction-card-header">
                    <div class="transaction-icon ${transaction.type}">
                        <i class="fas fa-${this.getTransactionIcon(
                          transaction.type
                        )}"></i>
                    </div>
                    <div class="transaction-main-info">
                        <div class="transaction-title">${
                          transaction.note || transaction.type
                        }</div>
                        <div class="transaction-subtitle">
                            <span>${getRelativeTime(
                              new Date(transaction.created_at).getTime()
                            )}</span>
                            <span class="status-badge ${transaction.status.toLowerCase()}">${
          transaction.status
        }</span>
                        </div>
                    </div>
                    <div class="transaction-amount">
                        <div class="transaction-amount-main ${
                          this.isPositiveTransaction(transaction.type)
                            ? "positive"
                            : "negative"
                        }">
                            ${
                              this.isPositiveTransaction(transaction.type)
                                ? "+"
                                : "-"
                            }${formatCurrency(transaction.amount)}
                        </div>
                        <div class="transaction-amount-secondary">${
                          transaction.currency || "USD"
                        }</div>
                    </div>
                </div>
                <div class="transaction-card-footer">
                    <div class="transaction-status">
                        <span>Type: ${transaction.type}</span>
                        <span>ID: ${transaction.id?.slice(0, 8) || "N/A"}</span>
                    </div>
                    <div class="transaction-time">${new Date(
                      transaction.created_at
                    ).toLocaleDateString()}</div>
                </div>
            </div>
        `
      )
      .join("");
  }

  showTransactionEmptyState() {
    const container = document.getElementById("transactionsList");
    if (!container) return;

    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No transactions found</h3>
                <p>${
                  this.transactionFilter !== "all"
                    ? "Try changing your filter"
                    : "Start trading to see your transactions here"
                }</p>
            </div>
        `;
  }

  updateTransactionSummary() {
    const totalTransactions = this.transactions.length;
    const totalVolume = this.transactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const monthlyTransactions = this.transactions.filter((t) => {
      const transactionDate = new Date(t.created_at);
      const now = new Date();
      return (
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      );
    });
    const monthlyVolume = monthlyTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );

    const totalTransactionsEl = document.getElementById("totalTransactions");
    const totalVolumeEl = document.getElementById("totalVolume");
    const monthlyVolumeEl = document.getElementById("monthlyVolume");

    if (totalTransactionsEl)
      totalTransactionsEl.textContent = totalTransactions;
    if (totalVolumeEl) totalVolumeEl.textContent = formatCurrency(totalVolume);
    if (monthlyVolumeEl)
      monthlyVolumeEl.textContent = formatCurrency(monthlyVolume);
  }

  loadNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    if (this.notifications.length === 0) {
      this.showNotificationEmptyState();
      return;
    }

    // Apply filters and render
    this.renderEnhancedNotifications();
    this.updateNotificationSummary();
  }

  renderEnhancedNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    let filteredNotifications = this.notifications;

    // Apply filters
    if (this.notificationFilter !== "all") {
      filteredNotifications = filteredNotifications.filter((n) => {
        switch (this.notificationFilter) {
          case "unread":
            return !n.read;
          case "info":
            return n.type === "info";
          case "success":
            return n.type === "success";
          case "warning":
            return n.type === "warning";
          case "error":
            return n.type === "error";
          default:
            return true;
        }
      });
    }

    // Apply search
    if (this.notificationSearch && this.notificationSearch.trim() !== "") {
      filteredNotifications = filteredNotifications.filter((n) => {
        const title = (n.title || "").toLowerCase();
        const body = (n.body || "").toLowerCase();
        const type = (n.type || "").toLowerCase();
        return (
          title.includes(this.notificationSearch) ||
          body.includes(this.notificationSearch) ||
          type.includes(this.notificationSearch)
        );
      });
    }

    if (filteredNotifications.length === 0) {
      this.showNotificationEmptyState();
      return;
    }

    container.innerHTML = filteredNotifications
      .map(
        (notification) => `
            <div class="notification-card ${
              !notification.read ? "unread" : ""
            } fade-in" onclick="tradingDashboard.markNotificationAsRead('${
          notification.id
        }')">
                <div class="notification-card-header">
                    <div class="notification-icon ${
                      notification.type || "info"
                    }">
                        <i class="fas fa-${this.getNotificationIcon(
                          notification.type
                        )}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${
                          notification.title
                        }</div>
                        <div class="notification-message">${
                          notification.body
                        }</div>
                    </div>
                </div>
                <div class="notification-card-footer">
                    <div class="notification-time">${getRelativeTime(
                      new Date(notification.created_at).getTime()
                    )}</div>
                    <div class="notification-actions">
                        <button class="notification-action-btn" onclick="event.stopPropagation(); tradingDashboard.deleteNotification('${
                          notification.id
                        }')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="notification-action-btn" onclick="event.stopPropagation(); tradingDashboard.archiveNotification('${
                          notification.id
                        }')">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  showNotificationEmptyState() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>No notifications found</h3>
                <p>${
                  this.notificationFilter !== "all"
                    ? "Try changing your filter"
                    : "You're all caught up!"
                }</p>
            </div>
        `;
  }

  updateNotificationSummary() {
    const totalNotifications = this.notifications.length;
    const unreadNotifications = this.notifications.filter(
      (n) => !n.read
    ).length;
    const weeklyNotifications = this.notifications.filter((n) => {
      const notificationDate = new Date(n.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return notificationDate >= weekAgo;
    }).length;

    const totalNotificationsEl = document.getElementById("totalNotifications");
    const unreadNotificationsEl = document.getElementById(
      "unreadNotifications"
    );
    const weeklyNotificationsEl = document.getElementById(
      "weeklyNotifications"
    );

    if (totalNotificationsEl)
      totalNotificationsEl.textContent = totalNotifications;
    if (unreadNotificationsEl)
      unreadNotificationsEl.textContent = unreadNotifications;
    if (weeklyNotificationsEl)
      weeklyNotificationsEl.textContent = weeklyNotifications;
  }

  async markNotificationAsRead(notificationId) {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      const notification = this.notifications.find(
        (n) => n.id === notificationId
      );
      if (notification) {
        notification.read = true;
      }
      this.updateUserInterface();
      this.loadNotifications();
      showToast("Notification marked as read", "success");
    } catch (error) {
      console.error("Mark notification as read error:", error);
      showToast("Failed to mark notification as read", "error");
    }
  }

  async deleteNotification(notificationId) {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      await apiClient.deleteNotification(notificationId);
      this.notifications = this.notifications.filter(
        (n) => n.id !== notificationId
      );
      this.updateUserInterface();
      this.loadNotifications();
      showToast("Notification deleted", "success");
    } catch (error) {
      console.error("Delete notification error:", error);
      showToast("Failed to delete notification", "error");
    }
  }

  async archiveNotification(notificationId) {
    try {
      await apiClient.archiveNotification(notificationId);
      this.notifications = this.notifications.filter(
        (n) => n.id !== notificationId
      );
      this.updateUserInterface();
      this.loadNotifications();
      showToast("Notification archived", "success");
    } catch (error) {
      console.error("Archive notification error:", error);
      showToast("Failed to archive notification", "error");
    }
  }

  filterTransactions(filter) {
    let filteredTransactions = this.transactions;

    if (filter !== "all") {
      filteredTransactions = this.transactions.filter((t) => {
        switch (filter) {
          case "deposits":
            return t.type === "deposit";
          case "withdrawals":
            return t.type === "withdrawal";
          case "trades":
            return t.type === "trade";
          default:
            return true;
        }
      });
    }

    const container = document.getElementById("transactionsList");
    if (!container) return;

    if (filteredTransactions.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No transactions found for this filter</div>';
      return;
    }

    container.innerHTML = filteredTransactions
      .map(
        (transaction) => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(
                      transaction.type
                    )}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${
                      transaction.note || transaction.type
                    }</div>
                    <div class="transaction-subtitle">${getRelativeTime(
                      new Date(transaction.created_at).getTime()
                    )} • ${transaction.status}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount-primary ${
                      this.isPositiveTransaction(transaction.type)
                        ? "positive"
                        : "negative"
                    }">
                        ${
                          this.isPositiveTransaction(transaction.type)
                            ? "+"
                            : "-"
                        }${formatCurrency(transaction.amount)}
                    </div>
                    <div class="amount-secondary">${transaction.status}</div>
                </div>
            </div>
        `
      )
      .join("");
  }

  applyTransactionFilters() {
    let filteredTransactions = this.transactions;

    // Filter by type
    if (this.transactionFilter !== "all") {
      filteredTransactions = filteredTransactions.filter((t) => {
        switch (this.transactionFilter) {
          case "deposits":
            return t.type === "deposit";
          case "withdrawals":
            return t.type === "withdrawal";
          case "trades":
            return t.type === "trade";
          default:
            return true;
        }
      });
    }

    // Filter by search text
    if (this.transactionSearch && this.transactionSearch.trim() !== "") {
      filteredTransactions = filteredTransactions.filter((t) => {
        const note = (t.note || "").toLowerCase();
        const type = (t.type || "").toLowerCase();
        return (
          note.includes(this.transactionSearch) ||
          type.includes(this.transactionSearch)
        );
      });
    }

    const container = document.getElementById("transactionsList");
    if (!container) return;

    if (filteredTransactions.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No transactions found</div>';
      return;
    }

    container.innerHTML = filteredTransactions
      .map(
        (transaction) => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(
                      transaction.type
                    )}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${
                      transaction.note || transaction.type
                    }</div>
                    <div class="transaction-subtitle">${getRelativeTime(
                      new Date(transaction.created_at).getTime()
                    )} • ${transaction.status}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount-primary ${
                      this.isPositiveTransaction(transaction.type)
                        ? "positive"
                        : "negative"
                    }">
                        ${
                          this.isPositiveTransaction(transaction.type)
                            ? "+"
                            : "-"
                        }${formatCurrency(transaction.amount)}
                    </div>
                    <div class="amount-secondary">${transaction.status}</div>
                </div>
            </div>
        `
      )
      .join("");
  }

  async executeTrade() {
    const orderType = document.querySelector(".order-btn.active");
    const volumeInput = document.querySelector(".volume-input");

    if (!orderType || !volumeInput) {
      showToast("Please select order type and volume", "error");
      return;
    }

    const side = orderType.classList.contains("buy") ? "buy" : "sell";
    const quantity = parseFloat(volumeInput.value);
    const currentPrice = realTimePrices.getCurrentPrice(this.currentSymbol);

    if (!quantity || quantity <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }

    // Check if user has sufficient balance
    const balances = this.currentProfile.balances || { USD: 0 };
    const tradeValue = quantity * currentPrice;

    if (side === "buy" && tradeValue > balances.USD) {
      showToast("Insufficient USD balance", "error");
      return;
    }

    try {
      showLoading(true);

      const trade = {
        user_id: this.currentUser.id,
        symbol: this.currentSymbol,
        side: side,
        quantity: quantity,
        entry_price: currentPrice,
        status: "open",
        opened_at: new Date().toISOString(),
      };

      const { data, error } = await apiClient.createTrade(trade);

      if (error) {
        throw new Error(error.message);
      }

      // Create transaction record
      const transaction = {
        user_id: this.currentUser.id,
        type: "trade",
        amount: quantity * currentPrice,
        currency: "USD",
        status: "completed",
        note: `${side.toUpperCase()} ${quantity} ${
          this.currentSymbol
        } at $${currentPrice.toFixed(2)}`,
      };

      await apiClient.createTransaction(transaction);

      // Update user balance
      const newBalances = { ...balances };
      if (side === "buy") {
        newBalances.USD -= tradeValue;
      }

      await apiClient.updateUser(this.currentUser.id, {
        balances: newBalances,
      });
      this.currentProfile.balances = newBalances;

      showToast(
        `${side.toUpperCase()} order executed successfully!`,
        "success"
      );

      // Reload data
      await this.loadUserData();
      this.updateUI();
    } catch (error) {
      console.error("Trade execution error:", error);
      showToast("Failed to execute trade", "error");
    } finally {
      showLoading(false);
    }
  }

  async executeEnhancedTrade() {
    const volumeInput = document.getElementById("volumeInput");
    const priceInput = document.getElementById("priceInput");
    const orderTypeButtons = document.querySelectorAll(".order-type-btn");
    const directionButtons = document.querySelectorAll(".direction-btn");
    const stopLossInput = document.getElementById("stopLossInput");
    const takeProfitInput = document.getElementById("takeProfitInput");

    if (!volumeInput || !volumeInput.value) {
      showToast("Please enter a volume", "error");
      return;
    }

    const volume = parseFloat(volumeInput.value);
    if (volume <= 0) {
      showToast("Please enter a valid volume", "error");
      return;
    }

    const orderType =
      Array.from(orderTypeButtons).find((btn) =>
        btn.classList.contains("active")
      )?.dataset.type || "market";
    const direction =
      Array.from(directionButtons).find((btn) =>
        btn.classList.contains("active")
      )?.dataset.direction || "buy";
    const price = parseFloat(priceInput?.value) || 0;
    const stopLoss = parseFloat(stopLossInput?.value) || null;
    const takeProfit = parseFloat(takeProfitInput?.value) || null;

    // Validate price for limit/stop orders
    if (orderType !== "market" && (!price || price <= 0)) {
      showToast("Please enter a valid price for limit/stop orders", "error");
      return;
    }

    // Get execution price
    const executionPrice =
      orderType === "market"
        ? realTimePrices.getCurrentPrice(this.currentSymbol)
        : price;
    const tradeValue = volume * executionPrice;

    // Check balance
    const balances = this.currentProfile.balances || { USD: 0 };
    if (direction === "buy" && tradeValue > balances.USD) {
      showToast("Insufficient USD balance", "error");
      return;
    }

    try {
      showLoading(true);

      // Create trade record
      const trade = {
        user_id: this.currentUser.id,
        symbol: this.currentSymbol,
        side: direction,
        quantity: volume,
        entry_price: executionPrice,
        order_type: orderType,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        status: "open",
        opened_at: new Date().toISOString(),
      };

      const { data, error } = await apiClient.createTrade(trade);

      if (error) {
        throw new Error(error.message);
      }

      // Create transaction record
      const transaction = {
        user_id: this.currentUser.id,
        type: "trade",
        amount: tradeValue,
        currency: "USD",
        status: "completed",
        note: `${direction.toUpperCase()} ${volume} ${
          this.currentSymbol
        } at $${executionPrice.toFixed(2)} (${orderType} order)`,
      };

      await apiClient.createTransaction(transaction);

      // Update user balance
      const newBalances = { ...balances };
      if (direction === "buy") {
        newBalances.USD -= tradeValue;
      }

      await apiClient.updateUser(this.currentUser.id, {
        balances: newBalances,
      });
      this.currentProfile.balances = newBalances;

      showToast(
        `${direction.toUpperCase()} ${orderType} order executed successfully!`,
        "success"
      );

      // Reset form
      if (volumeInput) volumeInput.value = "";
      if (priceInput) priceInput.value = "";
      if (stopLossInput) stopLossInput.value = "";
      if (takeProfitInput) takeProfitInput.value = "";

      // Reload data
      await this.loadUserData();
      this.updateUI();
      this.updateOrderSummary();
    } catch (error) {
      console.error("Enhanced trade execution error:", error);
      showToast("Failed to execute trade", "error");
    } finally {
      showLoading(false);
    }
  }

  showTransferModal() {
    showToast("Transfer feature coming soon", "info");
  }

  async logout() {
    if (confirm("Are you sure you want to logout?")) {
      try {
        await authManager.logout();
        window.location.href = "login.html";
      } catch (error) {
        console.error("Logout error:", error);
        showToast("Failed to logout", "error");
      }
    }
  }

  // Setup real-time synchronization for user data
  async setupUserSync() {
    try {
      // Setup real-time listeners for user-specific data
      await Promise.all([
        this.setupUserProfileSync(),
        this.setupUserTransactionSync(),
        this.setupUserTradeSync(),
        this.setupUserNotificationSync(),
        this.setupUserBalanceSync(),
      ]);

      console.log("User real-time sync activated");
    } catch (error) {
      console.error("Error setting up user sync:", error);
    }
  }

  // Setup user profile synchronization
  async setupUserProfileSync() {
    const profileSubscription = supabase
      .channel(`user-profile-${this.currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${this.currentUser.id}`,
        },
        (payload) => {
          this.handleProfileChange(payload);
        }
      )
      .subscribe();

    this.realTimeListeners = this.realTimeListeners || {};
    this.realTimeListeners.profile = profileSubscription;
  }

  // Setup user transaction synchronization
  async setupUserTransactionSync() {
    const transactionSubscription = supabase
      .channel(`user-transactions-${this.currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${this.currentUser.id}`,
        },
        (payload) => {
          this.handleTransactionChange(payload);
        }
      )
      .subscribe();

    this.realTimeListeners.transactions = transactionSubscription;
  }

  // Setup user trade synchronization
  async setupUserTradeSync() {
    const tradeSubscription = supabase
      .channel(`user-trades-${this.currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
          filter: `user_id=eq.${this.currentUser.id}`,
        },
        (payload) => {
          this.handleTradeChange(payload);
        }
      )
      .subscribe();

    this.realTimeListeners.trades = tradeSubscription;
  }

  // Setup user notification synchronization
  async setupUserNotificationSync() {
    const notificationSubscription = supabase
      .channel(`user-notifications-${this.currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${this.currentUser.id}`,
        },
        (payload) => {
          this.handleNotificationChange(payload);
        }
      )
      .subscribe();

    this.realTimeListeners.notifications = notificationSubscription;
  }

  // Setup user balance synchronization
  async setupUserBalanceSync() {
    const balanceSubscription = supabase
      .channel(`user-balance-${this.currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${this.currentUser.id}`,
        },
        (payload) => {
          this.handleBalanceChange(payload);
        }
      )
      .subscribe();

    this.realTimeListeners.balance = balanceSubscription;
  }

  // Handle profile changes
  async handleProfileChange(payload) {
    const { eventType, new: newRecord } = payload;

    if (eventType === "UPDATE") {
      this.currentProfile = { ...this.currentProfile, ...newRecord };
      this.updateUserInterface();

      // Show notification for important changes
      if (newRecord.balance !== this.currentProfile.balance) {
        showToast("Balance updated", "info");
      }

      console.log("Profile updated:", newRecord);
    }
  }

  // Handle transaction changes
  async handleTransactionChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case "INSERT":
        this.transactions.unshift(newRecord);
        this.updateUserInterface();
        showToast("New transaction added", "info");
        break;
      case "UPDATE":
        const index = this.transactions.findIndex((t) => t.id === newRecord.id);
        if (index !== -1) {
          this.transactions[index] = newRecord;
          this.updateUserInterface();
        }
        break;
      case "DELETE":
        this.transactions = this.transactions.filter(
          (t) => t.id !== oldRecord.id
        );
        this.updateUserInterface();
        break;
    }

    // Update transaction page if currently viewing
    if (this.currentPage === "transactions") {
      this.loadTransactions();
    }

    console.log("Transaction updated:", newRecord);
  }

  // Handle trade changes
  async handleTradeChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case "INSERT":
        if (newRecord.status === "open") {
          this.positions.unshift(newRecord);
        }
        this.updateUserInterface();
        showToast("New trade added", "info");
        break;
      case "UPDATE":
        const index = this.positions.findIndex((t) => t.id === newRecord.id);
        if (newRecord.status === "open") {
          if (index !== -1) {
            this.positions[index] = newRecord;
          } else {
            this.positions.unshift(newRecord);
          }
        } else if (newRecord.status === "closed" && index !== -1) {
          this.positions.splice(index, 1);
        }
        this.updateUserInterface();
        break;
      case "DELETE":
        this.positions = this.positions.filter((t) => t.id !== oldRecord.id);
        this.updateUserInterface();
        break;
    }

    // Update trading page if currently viewing
    if (this.currentPage === "trading") {
      this.updatePositions();
    }

    console.log("Trade updated:", newRecord);
  }

  // Handle notification changes
  async handleNotificationChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case "INSERT":
        this.notifications.unshift(newRecord);
        this.updateUserInterface();
        showToast("New notification received", "info");
        break;
      case "UPDATE":
        const index = this.notifications.findIndex(
          (n) => n.id === newRecord.id
        );
        if (index !== -1) {
          this.notifications[index] = newRecord;
          this.updateUserInterface();
        }
        break;
      case "DELETE":
        this.notifications = this.notifications.filter(
          (n) => n.id !== oldRecord.id
        );
        this.updateUserInterface();
        break;
    }

    // Update notification page if currently viewing
    if (this.currentPage === "notifications") {
      this.loadNotifications();
    }

    console.log("Notification updated:", newRecord);
  }

  // Handle balance changes
  async handleBalanceChange(payload) {
    const { new: newRecord } = payload;

    if (newRecord.balance !== this.currentProfile.balance) {
      this.currentProfile.balance = newRecord.balance;
      this.updateUserInterface();
      this.updatePortfolioFromUser();

      // Show balance change notification
      const change = newRecord.balance - this.currentProfile.balance;
      showToast(
        `Balance ${change >= 0 ? "increased" : "decreased"} by $${Math.abs(
          change
        ).toFixed(2)}`,
        change >= 0 ? "success" : "warning"
      );

      console.log("Balance updated:", newRecord.balance);
    }
  }

  // Sync methods for manual refresh
  async syncUserData() {
    try {
      showToast("Syncing data...", "info");
      await this.loadUserData();
      showToast("Data synchronized successfully", "success");
    } catch (error) {
      console.error("Sync error:", error);
      showToast("Failed to sync data", "error");
    }
  }

  // Cleanup real-time listeners
  cleanupListeners() {
    if (this.realTimeListeners) {
      Object.values(this.realTimeListeners).forEach((listener) => {
        if (listener) {
          supabase.removeChannel(listener);
        }
      });
      this.realTimeListeners = {};
    }
  }

  // Enhanced logout with cleanup
  async logout() {
    if (confirm("Are you sure you want to logout?")) {
      try {
        // Cleanup listeners before logout
        this.cleanupListeners();

        await authManager.logout();
        window.location.href = "login.html";
      } catch (error) {
        console.error("Logout error:", error);
        showToast("Failed to logout", "error");
      }
    }
  }

  // Admin Mode Methods
  toggleAdminMode() {
    this.isAdminMode = !this.isAdminMode;
    const btn = document.getElementById("adminModeBtn");
    if (btn) {
      btn.classList.toggle("active", this.isAdminMode);
      btn.innerHTML = this.isAdminMode
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-cog"></i>';
    }
    if (this.isAdminMode) {
      this.enterAdminMode();
    } else {
      this.exitAdminMode();
    }
  }

  enterAdminMode() {
    // Load saved content
    this.loadEditableContent();
    // Add edit buttons to sections
    this.addEditButtons();
    // Add admin panel
    this.showAdminPanel();
    showToast("Admin mode activated", "info");
  }

  exitAdminMode() {
    this.removeEditButtons();
    this.hideAdminPanel();
    showToast("Admin mode deactivated", "info");
  }

  addEditButtons() {
    // For each page, add edit buttons to editable elements
    const editableSelectors = {
      homePage: [
        ".portfolio-card h2",
        ".section-card h3",
        ".quick-actions .action-btn span",
      ],
      tradingPage: [".trading-header h4", ".positions-section h3"],
      transactionsPage: [".page-header h2"],
      notificationsPage: [".page-header h2"],
      supportPage: [
        ".support-hero h2",
        ".support-hero p",
        ".support-card h3",
        ".support-card p",
      ],
    };

    Object.keys(editableSelectors).forEach((pageId) => {
      const page = document.getElementById(pageId);
      if (!page) return;
      editableSelectors[pageId].forEach((selector) => {
        const elements = page.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el.querySelector(".edit-btn")) return; // Already has edit btn
          const editBtn = document.createElement("button");
          editBtn.className = "edit-btn";
          editBtn.innerHTML = '<i class="fas fa-edit"></i>';
          editBtn.onclick = () => this.startEditing(el);
          el.style.position = "relative";
          el.appendChild(editBtn);
        });
      });
    });
  }

  removeEditButtons() {
    document.querySelectorAll(".edit-btn").forEach((btn) => btn.remove());
  }

  startEditing(element) {
    const originalText = element.textContent.replace(/Edit$/, "").trim();
    element.contentEditable = true;
    element.classList.add("editing");
    element.focus();

    // Add save/cancel buttons
    const controls = document.createElement("div");
    controls.className = "edit-controls";
    controls.innerHTML = `
            <button class="save-btn"><i class="fas fa-check"></i></button>
            <button class="cancel-btn"><i class="fas fa-times"></i></button>
        `;
    element.appendChild(controls);

    controls.querySelector(".save-btn").onclick = () =>
      this.saveEdit(element, originalText);
    controls.querySelector(".cancel-btn").onclick = () =>
      this.cancelEdit(element, originalText);
  }

  saveEdit(element, originalText) {
    const newText = element.textContent.replace(/SaveCancel$/, "").trim();
    element.contentEditable = false;
    element.classList.remove("editing");
    element.querySelector(".edit-controls").remove();

    // Save to storage
    const key = this.getContentKey(element);
    this.editableContent[key] = newText;
    localStorage.setItem(
      "dashboardContent",
      JSON.stringify(this.editableContent)
    );

    showToast("Content saved", "success");
  }

  cancelEdit(element, originalText) {
    element.textContent = originalText;
    element.contentEditable = false;
    element.classList.remove("editing");
    element.querySelector(".edit-controls").remove();
  }

  getContentKey(element) {
    // Generate unique key based on page and element
    const page = element.closest(".page");
    const pageId = page ? page.id : "unknown";
    const index = Array.from(page.querySelectorAll("*")).indexOf(element);
    return `${pageId}_${index}`;
  }

  loadEditableContent() {
    const saved = localStorage.getItem("dashboardContent");
    if (saved) {
      this.editableContent = JSON.parse(saved);
      // Apply saved content
      Object.keys(this.editableContent).forEach((key) => {
        const [pageId, index] = key.split("_");
        const page = document.getElementById(pageId);
        if (page) {
          const elements = page.querySelectorAll("*");
          if (elements[index]) {
            elements[index].textContent = this.editableContent[key];
          }
        }
      });
    }
  }

  showAdminPanel() {
    // Add a floating admin panel
    const panel = document.createElement("div");
    panel.id = "adminPanel";
    panel.className = "admin-panel";
    panel.innerHTML = `
            <h4>Admin Quick Access</h4>
            <button onclick="window.location.href='admin.html'">Admin Dashboard</button>
            <button onclick="window.location.href='admin-users.html'">Manage Users</button>
            <button onclick="window.location.href='admin-transactions.html'">Transactions</button>
            <button onclick="window.location.href='admin-withdrawals.html'">Withdrawals</button>
            <button onclick="window.location.href='admin-trades.html'">Trades</button>
            <button onclick="window.location.href='admin-logs.html'">Logs</button>
            <button onclick="window.location.href='admin-broadcast.html'">Broadcast</button>
        `;
    document.body.appendChild(panel);
  }

  hideAdminPanel() {
    const panel = document.getElementById("adminPanel");
    if (panel) panel.remove();
  }

  getTransactionIcon(type) {
    const icons = {
      deposit: "arrow-down",
      withdrawal: "arrow-up",
      trade: "chart-line",
      transfer: "exchange-alt",
    };
    return icons[type] || "circle";
  }

  getNotificationIcon(type) {
    const icons = {
      info: "info-circle",
      success: "check-circle",
      warning: "exclamation-triangle",
      danger: "exclamation-circle",
    };
    return icons[type] || "bell";
  }
}

window.TradingDashboard = TradingDashboard;
new TradingDashboard();

// Initialize the dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.tradingDashboard = new TradingDashboard();
});

// Make available globally
window.closeSymbolModal = function () {
  window.tradingDashboard.closeSymbolModal();
};
