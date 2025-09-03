// API client for Supabase operations
import { supabase } from './supabase.js';

class ApiClient {
  constructor() {
    this.baseUrl = '/api';
  }
  
  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data: data || [], error };
  }
  
  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }
  
  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  async deleteUser(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    return { error };
  }
  
  // Transactions
  async getTransactions(userId = null) {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    return { data: data || [], error };
  }
  
  async createTransaction(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    return { data, error };
  }
  
  // Trades
  async getTrades(userId = null) {
    let query = supabase
      .from('trades')
      .select('*')
      .order('opened_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    return { data: data || [], error };
  }
  
  async createTrade(trade) {
    const { data, error } = await supabase
      .from('trades')
      .insert(trade)
      .select()
      .single();
    
    return { data, error };
  }
  
  async updateTrade(id, updates) {
    const { data, error } = await supabase
      .from('trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  async deleteTrade(id) {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);
    
    return { error };
  }
  
  // Withdrawals
  async getWithdrawals(userId = null) {
    let query = supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    return { data: data || [], error };
  }
  
  async createWithdrawal(withdrawal) {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert(withdrawal)
      .select()
      .single();
    
    return { data, error };
  }
  
  async updateWithdrawal(id, updates) {
    const { data, error } = await supabase
      .from('withdrawals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  // Notifications
  async getNotifications(userId = null) {
    let query = supabase
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
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    return { data, error };
  }
  
  async markNotificationRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
  
  async markAllNotificationsRead(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .select();
    
    return { data, error };
  }
}

export const apiClient = new ApiClient();