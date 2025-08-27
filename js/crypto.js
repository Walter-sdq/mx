// PBKDF2 Password Hashing Utilities (Web Crypto API)
window.CryptoUtils = class {
  static async generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  static async hashPassword(password, salt = null, iterations = 100000) {
    if (!salt) {
      salt = await this.generateSalt();
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    
    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: iterations,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const hashArray = new Uint8Array(hashBuffer);
    const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    
    return {
      salt,
      hash,
      iterations,
      algorithm: 'PBKDF2-SHA256'
    };
  }
  
  static async verifyPassword(password, storedHash) {
    const { salt, hash, iterations } = storedHash;
    const computed = await this.hashPassword(password, salt, iterations);
    return computed.hash === hash;
  }
  
  static generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Fallback for older browsers
window.generateSimpleHash = function(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};