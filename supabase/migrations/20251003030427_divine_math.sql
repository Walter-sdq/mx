/*
  # Seed Demo Data for Trading Platform

  1. Demo Users
    - Admin user
    - Regular users with different balances and activity

  2. Sample Transactions
    - Deposits, withdrawals, trades
    - Different statuses and amounts

  3. Sample Trades
    - Open and closed positions
    - Different symbols and P&L

  4. Sample Notifications
    - Welcome messages, trade alerts, system notifications

  5. Price Data
    - Initial price data for major symbols
*/

-- Insert demo users (profiles will be created via auth signup)
-- This is handled by the auth.users table and profile creation triggers

-- Insert sample transactions
INSERT INTO transactions (user_id, type, amount, currency, status, payment_method, note, created_at) VALUES
  -- We'll use placeholder UUIDs that will be replaced with real user IDs
  ('00000000-0000-0000-0000-000000000001', 'deposit', 1000.00, 'USD', 'completed', 'bank_transfer', 'Initial deposit', now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', 'deposit', 500.00, 'USD', 'completed', 'credit_card', 'Additional funding', now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000001', 'trade', 250.00, 'USD', 'completed', null, 'BTC/USD trade settlement', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000002', 'deposit', 2000.00, 'USD', 'completed', 'crypto', 'Bitcoin deposit', now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000002', 'withdrawal', 300.00, 'USD', 'pending', 'bank_transfer', 'Profit withdrawal', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample trades
INSERT INTO trades (user_id, symbol, type, amount, entry_price, exit_price, pnl, status, opened_at, closed_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BTC/USD', 'buy', 0.01, 42000.00, 43250.00, 12.50, 'closed', now() - interval '4 days', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', 'ETH/USD', 'buy', 0.5, 2500.00, null, 40.00, 'open', now() - interval '2 days', null),
  ('00000000-0000-0000-0000-000000000002', 'BTC/USD', 'sell', 0.005, 43500.00, 43250.00, -1.25, 'closed', now() - interval '1 day', now() - interval '12 hours'),
  ('00000000-0000-0000-0000-000000000002', 'EUR/USD', 'buy', 1000.00, 1.0850, null, 6.00, 'open', now() - interval '6 hours', null)
ON CONFLICT DO NOTHING;

-- Insert sample withdrawals
INSERT INTO withdrawals (user_id, amount, currency, method, address_or_account, status, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 500.00, 'USD', 'bank_transfer', 'Chase Bank ****1234', 'completed', now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000002', 300.00, 'USD', 'crypto', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'pending', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001', 150.00, 'USD', 'paypal', 'sarah.chen@email.com', 'approved', now() - interval '3 days')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, body, type, read, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Welcome to Top-Margin Trading!', 'Your account has been successfully created. Start trading today!', 'welcome', true, now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', 'Trade Executed', 'Your BTC/USD buy order has been executed at $42,000.00', 'trade', true, now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000001', 'Deposit Confirmed', 'Your deposit of $500.00 has been confirmed and added to your account.', 'deposit', false, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000002', 'Welcome to Top-Margin Trading!', 'Your account has been successfully created. Start trading today!', 'welcome', true, now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000002', 'Withdrawal Pending', 'Your withdrawal request of $300.00 is being processed.', 'withdrawal', false, now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- Insert initial price data
INSERT INTO prices (symbol, price, change_24h, change_percent_24h, volume_24h, updated_at) VALUES
  ('BTC/USD', 43250.00, 1050.00, 2.49, 2100000000, now()),
  ('ETH/USD', 2580.00, 31.50, 1.24, 1200000000, now()),
  ('LTC/USD', 78.50, -2.30, -2.85, 450000000, now()),
  ('XRP/USD', 0.6234, 0.0156, 2.56, 890000000, now()),
  ('ADA/USD', 0.4567, -0.0123, -2.62, 340000000, now()),
  ('DOT/USD', 12.34, 0.45, 3.78, 180000000, now()),
  ('EUR/USD', 1.0856, -0.0012, -0.11, 5600000000, now()),
  ('GBP/USD', 1.2734, 0.0034, 0.27, 3400000000, now()),
  ('USD/JPY', 148.25, -0.85, -0.57, 4200000000, now()),
  ('AUD/USD', 0.6823, 0.0045, 0.66, 1800000000, now()),
  ('AAPL', 185.23, 1.65, 0.90, 45000000, now()),
  ('GOOGL', 142.56, -2.34, -1.61, 28000000, now()),
  ('MSFT', 378.90, 3.45, 0.92, 32000000, now()),
  ('AMZN', 153.45, -1.23, -0.79, 38000000, now()),
  ('TSLA', 234.67, -3.45, -1.45, 85000000, now()),
  ('NVDA', 498.12, 12.34, 2.54, 42000000, now())
ON CONFLICT (symbol) DO UPDATE SET
  price = EXCLUDED.price,
  change_24h = EXCLUDED.change_24h,
  change_percent_24h = EXCLUDED.change_percent_24h,
  volume_24h = EXCLUDED.volume_24h,
  updated_at = EXCLUDED.updated_at;

-- Insert sample support tickets
INSERT INTO support_tickets (user_id, subject, category, priority, status, message, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Unable to withdraw funds', 'withdrawals', 'high', 'open', 'I am trying to withdraw $500 but the transaction keeps failing. Please help.', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000002', 'Question about trading fees', 'trading', 'low', 'resolved', 'What are the trading fees for cryptocurrency pairs?', now() - interval '5 days')
ON CONFLICT DO NOTHING;