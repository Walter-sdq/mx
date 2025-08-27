// Chart.js helpers and configurations

// Default chart configuration
export const defaultChartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: false
    },
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
      grid: {
        display: false
      },
      ticks: {
        color: '#666666',
        maxTicksLimit: 6
      }
    },
    y: {
      display: true,
      position: 'right',
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: '#666666',
        callback: function(value) {
          return '$' + value.toLocaleString();
        }
      }
    }
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 4
    },
    line: {
      borderWidth: 2,
      tension: 0.1
    }
  }
};

// Create line chart
export function createLineChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'line',
    data: {
      datasets: [{
        data: data,
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        ...options.dataset
      }]
    },
    options: {
      ...defaultChartConfig,
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

// Create candlestick chart (using line chart as approximation)
export function createCandlestickChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'line',
    data: {
      datasets: [{
        data: data,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false,
        ...options.dataset
      }]
    },
    options: {
      ...defaultChartConfig,
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

// Create area chart
export function createAreaChart(canvas, data, options = {}) {
  return createLineChart(canvas, data, {
    ...options,
    dataset: {
      fill: true,
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      ...options.dataset
    }
  });
}

// Create portfolio chart
export function createPortfolioChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'line',
    data: {
      datasets: [{
        label: 'Portfolio Value',
        data: data,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        borderWidth: 3,
        tension: 0.2
      }]
    },
    options: {
      ...defaultChartConfig,
      plugins: {
        ...defaultChartConfig.plugins,
        tooltip: {
          ...defaultChartConfig.plugins.tooltip,
          callbacks: {
            title: function(context) {
              return new Date(context[0].parsed.x).toLocaleDateString();
            },
            label: function(context) {
              return `Portfolio: $${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

// Create mini chart (for hero section, cards, etc.)
export function createMiniChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'line',
    data: {
      datasets: [{
        data: data,
        borderColor: options.color || '#2196f3',
        backgroundColor: options.backgroundColor || 'rgba(33, 150, 243, 0.1)',
        fill: true,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        point: { radius: 0 }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

// Create bar chart
export function createBarChart(canvas, data, labels, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
        borderColor: '#2196f3',
        borderWidth: 1,
        borderRadius: 4,
        ...options.dataset
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#333333',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#666666' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: '#666666' }
        }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

// Create doughnut chart
export function createDoughnutChart(canvas, data, labels, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const colors = [
    '#2196f3', '#4caf50', '#ff9800', '#f44336', 
    '#9c27b0', '#00bcd4', '#ffeb3b', '#795548'
  ];
  
  const config = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        ...options.dataset
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#666666',
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#333333',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${percentage}%`;
            }
          }
        }
      },
      cutout: '60%',
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

// Update chart data
export function updateChartData(chart, newData) {
  if (!chart || !chart.data) return;
  
  chart.data.datasets[0].data = newData;
  chart.update('none'); // No animation for real-time updates
}

// Add data point to chart
export function addDataPoint(chart, dataPoint) {
  if (!chart || !chart.data) return;
  
  const dataset = chart.data.datasets[0];
  dataset.data.push(dataPoint);
  
  // Keep only last N points for performance
  const maxPoints = 100;
  if (dataset.data.length > maxPoints) {
    dataset.data.shift();
  }
  
  chart.update('none');
}

// Generate sample data for charts
export function generateSampleData(points = 50, baseValue = 100, volatility = 0.1) {
  const data = [];
  let value = baseValue;
  const now = Date.now();
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i) * 60000; // 1 minute intervals
    const change = (Math.random() - 0.5) * 2 * volatility * value;
    value = Math.max(value + change, value * 0.1); // Prevent negative values
    
    data.push({
      x: timestamp,
      y: value
    });
  }
  
  return data;
}

// Generate portfolio data
export function generatePortfolioData(days = 30) {
  const data = [];
  let value = 24567.89; // Starting portfolio value
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily intervals
    const change = (Math.random() - 0.45) * 0.05 * value; // Slight upward bias
    value = Math.max(value + change, value * 0.5);
    
    data.push({
      x: timestamp,
      y: Math.round(value * 100) / 100
    });
  }
  
  return data;
}

// Chart theme utilities
export function getChartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  
  return {
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    textColor: isDark ? '#e5e5e5' : '#333333',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderColor: isDark ? '#404040' : '#e0e0e0'
  };
}

// Apply theme to chart
export function applyChartTheme(chart) {
  const theme = getChartTheme();
  
  if (chart.options.scales) {
    if (chart.options.scales.x) {
      chart.options.scales.x.ticks.color = theme.textColor;
      chart.options.scales.x.grid.color = theme.gridColor;
    }
    if (chart.options.scales.y) {
      chart.options.scales.y.ticks.color = theme.textColor;
      chart.options.scales.y.grid.color = theme.gridColor;
    }
  }
  
  if (chart.options.plugins && chart.options.plugins.legend) {
    chart.options.plugins.legend.labels.color = theme.textColor;
  }
  
  chart.update();
}

// Listen for theme changes and update charts
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        // Update all Chart.js instances
        Chart.instances.forEach((chart) => {
          applyChartTheme(chart);
        });
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
});