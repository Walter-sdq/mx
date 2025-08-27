// Transaction Management and Filtering
import { state } from './state.js';
import { SessionManager } from './session.js';
import { formatDateTime, formatCurrency, getRelativeTime, exportToCSV, debounce } from './utils.js';

export class TransactionManager {
  constructor() {
    this.transactions = [];
    this.filteredTransactions = [];
    this.currentFilter = 'all';
    this.currentPage = 1;
    this.itemsPerPage = 20;
    
    this.init();
  }
  
  init() {
    this.loadTransactions();
    this.setupFilters();
    this.setupSearch();
    this.setupPagination();
    this.setupExport();
    this.renderTransactions();
  }
  
  loadTransactions() {
    const session = SessionManager.getSession();
    if (!session) return;
    
    this.transactions = state.getTransactions(session.userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    this.filteredTransactions = [...this.transactions];
  }
  
  setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');
        this.applyFilter(filter);
        
        // Update active state
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }
  
  setupSearch() {
    const searchInput = document.getElementById('transaction-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.searchTransactions(e.target.value);
      }, 300));
    }
  }
  
  setupPagination() {
    // Pagination will be rendered dynamically
  }
  
  setupExport() {
    const exportBtn = document.getElementById('export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportTransactions();
      });
    }
  }
  
  applyFilter(filter) {
    this.currentFilter = filter;
    
    if (filter === 'all') {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter(t => t.type === filter);
    }
    
    this.currentPage = 1;
    this.renderTransactions();
    this.renderPagination();
  }
  
  searchTransactions(query) {
    if (!query.trim()) {
      this.applyFilter(this.currentFilter);
      return;
    }
    
    const searchTerm = query.toLowerCase();
    this.filteredTransactions = this.transactions.filter(transaction => 
      transaction.type.toLowerCase().includes(searchTerm) ||
      transaction.currency.toLowerCase().includes(searchTerm) ||
      transaction.status.toLowerCase().includes(searchTerm) ||
      (transaction.note && transaction.note.toLowerCase().includes(searchTerm)) ||
      formatCurrency(transaction.amount).toLowerCase().includes(searchTerm)
    );
    
    this.currentPage = 1;
    this.renderTransactions();
    this.renderPagination();
  }
  
  renderTransactions() {
    const tbody = document.getElementById('transactions-tbody');
    if (!tbody) return;
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);
    
    if (pageTransactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No transactions found</td></tr>';
      return;
    }
    
    tbody.innerHTML = pageTransactions.map(transaction => {
      const isPositive = ['deposit', 'interest', 'bonus'].includes(transaction.type);
      const amountClass = isPositive ? 'positive' : 'negative';
      const amountPrefix = isPositive ? '+' : '-';
      
      return `
        <tr class="u-transaction-row" data-id="${transaction._id}">
          <td>
            <div class="c-transaction-date">
              <span class="date">${formatDateTime(transaction.createdAt)}</span>
              <span class="time">${getRelativeTime(transaction.createdAt)}</span>
            </div>
          </td>
          <td>
            <div class="c-transaction-type">
              <div class="type-icon ${transaction.type}">
                <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
              </div>
              <span class="type-text">${this.getTransactionTitle(transaction.type)}</span>
            </div>
          </td>
          <td class="c-transaction-amount ${amountClass}">
            ${amountPrefix}${formatCurrency(transaction.amount)}
          </td>
          <td class="c-transaction-currency">${transaction.currency}</td>
          <td>
            <span class="status-badge ${transaction.status}">${transaction.status}</span>
          </td>
          <td class="c-transaction-note">${transaction.note || '-'}</td>
        </tr>
      `;
    }).join('');
  }
  
  renderPagination() {
    const paginationEl = document.getElementById('transactions-pagination');
    if (!paginationEl) return;
    
    const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
              onclick="transactionManager.goToPage(${this.currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="transactionManager.goToPage(${i})">
          ${i}
        </button>
      `;
    }
    
    // Next button
    paginationHTML += `
      <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
              onclick="transactionManager.goToPage(${this.currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
    
    paginationEl.innerHTML = paginationHTML;
  }
  
  goToPage(page) {
    const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    this.renderTransactions();
    this.renderPagination();
  }
  
  exportTransactions() {
    if (this.filteredTransactions.length === 0) {
      showToast('No transactions to export', 'warning');
      return;
    }
    
    const exportData = this.filteredTransactions.map(transaction => ({
      Date: formatDateTime(transaction.createdAt),
      Type: transaction.type,
      Amount: transaction.amount,
      Currency: transaction.currency,
      Status: transaction.status,
      Note: transaction.note || ''
    }));
    
    exportToCSV(exportData, `maxprofit-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Transactions exported successfully', 'success');
  }
  
  getTransactionIcon(type) {
    const icons = {
      deposit: 'plus',
      withdraw: 'minus',
      trade: 'exchange-alt',
      fee: 'receipt',
      interest: 'percentage',
      bonus: 'gift'
    };
    
    return icons[type] || 'circle';
  }
  
  getTransactionTitle(type) {
    const titles = {
      deposit: 'Deposit',
      withdraw: 'Withdrawal',
      trade: 'Trade',
      fee: 'Fee',
      interest: 'Interest',
      bonus: 'Bonus'
    };
    
    return titles[type] || 'Transaction';
  }
  
  refresh() {
    this.loadTransactions();
    this.applyFilter(this.currentFilter);
  }
}

// Global transaction manager instance
let transactionManager;

// Initialize when on transactions page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('transactions-page')) {
    transactionManager = new TransactionManager();
    window.transactionManager = transactionManager; // Make available for onclick handlers
  }
});

export { TransactionManager };