# Top-Margin  Trading Platform

A comprehensive, production-ready trading platform built with modern web technologies. Features real-time price simulation, secure authentication, role-based access control, and both user and admin dashboards.

## 🚀 Features

### Core Functionality
- **Multi-Asset Trading**: Support for cryptocurrencies, forex pairs, and stocks
- **Real-Time Price Engine**: Realistic market simulation with random walk algorithm
- **Secure Authentication**: Password hashing with role-based access control
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-Time Updates**: Live price feeds and portfolio tracking

### User Dashboard
- **Portfolio Management**: Balance tracking across multiple currencies
- **Trading Interface**: Buy/sell orders with stop-loss and take-profit options
- **Transaction History**: Comprehensive transaction tracking with filtering
- **Notifications**: Real-time alerts and system notifications
- **Profile Management**: User settings and preferences

### Admin Dashboard
- **User Management**: Create, edit, and manage user accounts
- **Withdrawal Processing**: Review and approve withdrawal requests
- **Trade Monitoring**: Oversee all trading activity with force-close capabilities
- **Analytics**: KPI tracking and growth charts
- **Broadcast System**: Send notifications to users

### Technical Features
- **Switchable Data Layer**: Choose between LokiJS (browser) or NeDB (Node.js)
- **Chart.js Integration**: Professional trading charts and analytics
- **CSV Export**: Transaction and data export functionality
- **Theme Support**: Dark/light mode with persistent preferences
- **Mobile Responsive**: Optimized for all device sizes

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3 (Custom CSS with CSS Variables), Vanilla JavaScript (ES6 modules)
- **Charts**: Chart.js for real-time trading charts
- **Icons**: Font Awesome
- **Database Options**:
  - **Browser-only**: LokiJS with IndexedDB persistence
  - **Node.js**: NeDB with Express server
- **Authentication**: 
  - Browser: PBKDF2 password hashing with localStorage sessions
  - Node.js: bcrypt with JWT HTTP-only cookies

## 📁 Project Structure

```
/
├── index.html              # Landing page
├── login.html              # User login
├── signup.html             # User registration
├── dashboard.html          # User dashboard
├── admin.html              # Admin dashboard
├── css/
│   ├── base.css           # Global styles and utilities
│   ├── landing.css        # Landing page styles
│   ├── dashboard.css      # Dashboard styles
│   └── admin.css          # Admin-specific styles
├── js/
│   ├── config.js          # Configuration and constants
│   ├── utils.js           # Utility functions
│   ├── db.loki.js         # LokiJS database implementation
│   ├── db.api.js          # API client for NeDB mode
│   ├── auth.js            # Authentication module
│   ├── prices.js          # Price engine and simulation
│   ├── charts.js          # Chart.js helpers
│   ├── landing.js         # Landing page functionality
│   ├── dashboard.js       # User dashboard logic
│   └── admin.js           # Admin dashboard logic
├── img/
│   └── logo.svg           # Application logo
└── README.md
```

## 🚀 Getting Started

### Browser-Only Mode (LokiJS)

1. **Serve the files statically**:
   ```bash
   # Using Node.js http-server
   npx http-server .
   
   # Using Python
   python -m http.server 8000
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Open your browser** and navigate to `http://localhost:8000`

### Node.js Mode (NeDB)

1. **Install dependencies**:
   ```bash
   npm init -y
   npm install express cors cookie-parser jsonwebtoken bcrypt nedb-promises
   ```

2. **Update configuration**:
   - Edit `js/config.js` and set `DATA_LAYER = 'nedb'`

3. **Create server structure**:
   ```bash
   mkdir -p server/routes
   mkdir -p data
   ```

4. **Start the server**:
   ```bash
   node server/server.js
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 👤 Default Accounts

The application comes with pre-seeded accounts for testing:

### Admin Account
- **Email**: `admin@Top-Margin .dev`
- **Password**: `Admin@1234`
- **Role**: Administrator

### User Accounts
- **Email**: `sarah@Top-Margin .dev`
- **Password**: `User@1234`
- **Role**: User

- **Email**: `marcus@Top-Margin .dev`
- **Password**: `User@1234`
- **Role**: User

## 🎯 Key Features Explained

### Price Engine
- **Realistic Simulation**: Uses random walk with drift for price movements
- **Multiple Timeframes**: 1H, 4H, 1D, 1W chart intervals
- **Volume Simulation**: Realistic trading volume generation
- **Persistence**: Price history saved in localStorage/database

### Trading System
- **Order Types**: Market and limit orders
- **Risk Management**: Stop-loss and take-profit options
- **Real-time P&L**: Live profit/loss calculation
- **Transaction Tracking**: Complete audit trail

### Security Features
- **Password Hashing**: Secure password storage
- **Session Management**: Secure session handling
- **Role-based Access**: User and admin role separation
- **Input Validation**: Comprehensive form validation

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Adapted layouts for tablets
- **Desktop Enhancement**: Full-featured desktop experience
- **Touch-Friendly**: Large touch targets and gestures

## 🔧 Configuration

### Data Layer Toggle
Edit `js/config.js` to switch between data layers:

```javascript
export const DATA_LAYER = 'lokijs'; // or 'nedb'
```

### Trading Limits
Customize trading limits in `js/config.js`:

```javascript
export const APP_CONFIG = {
  MIN_DEPOSIT: 10.00,
  MIN_WITHDRAW: 10.00,
  MIN_BTC_TRADE: 0.001,
  TRADING_FEE_PERCENT: 0.3,
  // ... other settings
};
```

### Theme Configuration
The application supports both light and dark themes with CSS custom properties for easy customization.

## 📊 Admin Features

### User Management
- Create new user accounts
- Edit user information and roles
- Adjust user balances with audit trail
- Delete user accounts

### Withdrawal Management
- Review withdrawal requests
- Approve or deny withdrawals
- Add admin notes
- Mark withdrawals as paid

### Trade Oversight
- Monitor all trading activity
- Force close positions
- Delete trades
- View real-time P&L

### Analytics Dashboard
- User growth charts
- Trading volume analytics
- KPI tracking
- System activity monitoring

## 🔒 Security Considerations

**⚠️ Important**: This is a demonstration application. For production use:

1. **Use HTTPS**: Always serve over secure connections
2. **Server-side Authentication**: Implement proper server-side session management
3. **Database Security**: Use production-grade databases with proper security
4. **Input Sanitization**: Implement comprehensive input validation
5. **Rate Limiting**: Add rate limiting for API endpoints
6. **Audit Logging**: Implement comprehensive audit trails

## 🎨 Customization

### Styling
The application uses CSS custom properties for easy theming:

```css
:root {
  --primary-500: #2196f3;
  --success-500: #4caf50;
  --error-500: #f44336;
  /* ... other variables */
}
```

### Adding New Assets
Add new trading symbols in `js/config.js`:

```javascript
SYMBOLS: {
  crypto: [
    { symbol: 'NEW/USD', name: 'New Coin', decimals: 2 }
  ]
}
```

## 📱 Mobile Experience

The application is fully responsive with:
- **Touch-optimized interface**
- **Swipe gestures** for navigation
- **Mobile-specific layouts**
- **Optimized performance** for mobile devices

## 🚀 Performance

- **Lazy loading** for images and components
- **Efficient DOM updates** with minimal reflows
- **Optimized animations** using CSS transforms
- **Memory management** for real-time data
- **Debounced inputs** for search and filters

## 📈 Future Enhancements

- **WebSocket integration** for real-time data
- **Progressive Web App** features
- **Advanced charting** with technical indicators
- **Social trading** features
- **Multi-language support**
- **Advanced order types**

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Adding comprehensive tests
- Implementing proper error handling
- Adding logging and monitoring
- Enhancing security measures
- Adding API documentation

## 📄 License

This project is for demonstration purposes. Please ensure compliance with financial regulations in your jurisdiction before using in production.

---

**Risk Warning**: This is a demonstration trading platform. Trading involves substantial risk and may result in loss of capital. This application should not be used for actual trading without proper licensing and regulatory compliance.