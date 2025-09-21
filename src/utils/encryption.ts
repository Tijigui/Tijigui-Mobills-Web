/**
 * Encryption utilities for sensitive financial data
 * Uses browser's native Web Crypto API for security
 */

// Generate a key from password using PBKDF2
const generateKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Generate random salt
const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

// Generate random IV
const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(12));
};

// Convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Encrypt data
export const encryptData = async (data: any, password?: string): Promise<string> => {
  try {
    const jsonData = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonData);

    // Use default password if not provided (for basic obfuscation)
    const encryptionPassword = password || 'mobills-default-key-2024';
    
    const salt = generateSalt();
    const iv = generateIV();
    const key = await generateKey(encryptionPassword, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine salt, iv, and encrypted data
    const combined = {
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      data: arrayBufferToBase64(encrypted),
      timestamp: Date.now()
    };

    return btoa(JSON.stringify(combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to base64 encoding if crypto fails
    return btoa(JSON.stringify(data));
  }
};

// Decrypt data
export const decryptData = async <T>(encryptedData: string, password?: string): Promise<T | null> => {
  try {
    const encryptionPassword = password || 'mobills-default-key-2024';
    
    // Try to parse as encrypted format first
    let combined;
    try {
      combined = JSON.parse(atob(encryptedData));
    } catch {
      // Fallback: try to decode as simple base64
      try {
        const decoded = atob(encryptedData);
        return JSON.parse(decoded);
      } catch {
        return null;
      }
    }

    if (!combined.salt || !combined.iv || !combined.data) {
      // Legacy format, try simple base64 decode
      const decoded = atob(encryptedData);
      return JSON.parse(decoded);
    }

    const salt = new Uint8Array(base64ToArrayBuffer(combined.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(combined.iv));
    const data = base64ToArrayBuffer(combined.data);

    const key = await generateKey(encryptionPassword, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const jsonData = decoder.decode(decrypted);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Try fallback decode
    try {
      const decoded = atob(encryptedData);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
};

// Check if Web Crypto API is available
export const isCryptoAvailable = (): boolean => {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues === 'function';
};

// Secure localStorage wrapper
export class SecureStorage {
  private password?: string;

  constructor(password?: string) {
    this.password = password;
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      const encrypted = await encryptData(value, this.password);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('SecureStorage setItem failed:', error);
      // Fallback to regular storage
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      return await decryptData<T>(stored, this.password);
    } catch (error) {
      console.error('SecureStorage getItem failed:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

// Export default instance
export const secureStorage = new SecureStorage();

// Utility to hash sensitive data (for comparison without storing plaintext)
export const hashData = async (data: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    console.error('Hashing failed:', error);
    // Simple fallback hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
};