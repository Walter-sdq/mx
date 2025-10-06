import { supabase } from './supabase.js';

class ApiClient {
  constructor() {
    this.supabase = supabase;
  }
  
  // Users
  async getUsers() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data: data || [], error };
  }
  
  async getUserById(id) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }
  
  async updateUser(id, updates) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  async deleteUser(id) {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    return { error };
  }
  
  // Transactions
  async getTransactions(userId = null) {
    let query = this.supabase
      .from('transactions')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    // Flatten the data structure
    const transactions = (data || []).map(transaction => ({
      ...transaction,
      user_email: transaction.profiles?.email,
      user_name: transaction.profiles?.full_name
    }));
    
    return { data: data || [], error };
  }
  
  async createTransaction(transaction) {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    return { data, error };
  }
  
  // Trades
  async getTrades(userId = null) {
    let query = this.supabase
      .from('trades')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .order('opened_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    // Flatten the data structure
    const trades = (data || []).map(trade => ({
      ...trade,
      user_email: trade.profiles?.email,
      user_name: trade.profiles?.full_name
    }));
    
    return { data: data || [], error };
  }
  
  async createTrade(trade) {
    const { data, error } = await this.supabase
      .from('trades')
      .insert(trade)
      .select()
      .single();
    
    return { data, error };
  }
  
  async updateTrade(id, updates) {
    const { data, error } = await this.supabase
      .from('trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  async deleteTrade(id) {
    const { error } = await this.supabase
      .from('trades')
      .delete()
      .eq('id', id);
    
    return { error };
  }
  
  // Withdrawals
  async getWithdrawals(userId = null) {
    let query = this.supabase
      .from('withdrawals')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    // Flatten the data structure
    const withdrawals = (data || []).map(withdrawal => ({
      ...withdrawal,
      user_email: withdrawal.profiles?.email,
      user_name: withdrawal.profiles?.full_name
    }));
    
    return { data: data || [], error };
  }
  
  async createWithdrawal(withdrawal) {
    const { data, error } = await this.supabase
      .from('withdrawals')
      .insert(withdrawal)
      .select()
      .single();
    
    return { data, error };
  }
  
  async updateWithdrawal(id, updates) {
    const { data, error } = await this.supabase
      .from('withdrawals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  // Notifications
  async getNotifications(userId = null) {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    return { data: data || [], error };
  }
  
  async createNotification(notification) {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    return { data, error };
  }
  
  async markNotificationRead(id) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  async markAllNotificationsRead(userId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .select();
    
    return { data, error };
  }
  
  // Real-time price data
  async getPrices() {
    const { data, error } = await this.supabase
      .from('prices')
      .select('*')
      .order('updated_at', { ascending: false });
    
    return { data: data || [], error };
  }
  
  async updatePrice(symbol, priceData) {
    const { data, error } = await this.supabase
      .from('prices')
      .upsert({
        symbol,
        price: priceData.price,
        change_24h: priceData.change,
        change_percent_24h: priceData.changePercent,
        volume_24h: priceData.volume,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    return { data, error };
  }
}

export const apiClient = new ApiClient();