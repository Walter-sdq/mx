// Email Verification System
import { state } from './state.js';
import { showToast, generateId } from './utils.js';

export class EmailVerificationManager {
  static generateVerificationToken() {
    return generateId() + Date.now().toString(36);
  }
  
  static async sendVerificationEmail(email, token) {
    // Simulate email sending (in production, this would call a real email service)
    console.log(`Verification email sent to ${email} with token: ${token}`);
    
    // Store verification token
    const verificationData = {
      email,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      verified: false
    };
    
    const verifications = state.get('maxprofit_verifications', []);
    verifications.push(verificationData);
    state.set('maxprofit_verifications', verifications);
    
    return { success: true, token };
  }
  
  static verifyEmail(token) {
    const verifications = state.get('maxprofit_verifications', []);
    const verification = verifications.find(v => v.token === token && !v.verified);
    
    if (!verification) {
      return { success: false, message: 'Invalid or expired verification token' };
    }
    
    if (Date.now() > verification.expiresAt) {
      return { success: false, message: 'Verification token has expired' };
    }
    
    // Mark as verified
    verification.verified = true;
    verification.verifiedAt = Date.now();
    state.set('maxprofit_verifications', verifications);
    
    // Update user verification status
    const user = state.getUserByEmail(verification.email);
    if (user) {
      state.updateUser(user._id, { emailVerified: true });
    }
    
    return { success: true, email: verification.email };
  }
  
  static isEmailVerified(email) {
    const verifications = state.get('maxprofit_verifications', []);
    return verifications.some(v => v.email === email && v.verified);
  }
  
  static async resendVerification(email) {
    const user = state.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    if (user.emailVerified) {
      return { success: false, message: 'Email is already verified' };
    }
    
    const token = this.generateVerificationToken();
    return await this.sendVerificationEmail(email, token);
  }
}