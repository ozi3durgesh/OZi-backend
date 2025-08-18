// utils/sealGenerator.ts
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface SealNumber {
  sealNumber: string;
  hash: string;
  timestamp: number;
  nonce: string;
}

export class SealGenerator {
  private static readonly SEAL_PREFIX = 'OZI';
  private static readonly HASH_ALGORITHM = 'sha256';
  private static readonly SEAL_LENGTH = 16;

  /**
   * Generate a cryptographically secure seal number
   */
  static generateSeal(): SealNumber {
    const timestamp = Date.now();
    const nonce = uuidv4().replace(/-/g, '').substring(0, 8);
    const randomBytes = crypto.randomBytes(this.SEAL_LENGTH).toString('hex');
    
    const sealNumber = `${this.SEAL_PREFIX}-${timestamp.toString(36)}-${nonce}-${randomBytes}`;
    
    // Generate hash for verification
    const hash = crypto
      .createHash(this.HASH_ALGORITHM)
      .update(sealNumber + process.env.SEAL_SECRET || 'default-secret')
      .digest('hex');

    return {
      sealNumber,
      hash,
      timestamp,
      nonce
    };
  }

  /**
   * Verify seal number integrity
   */
  static verifySeal(sealNumber: string, expectedHash: string): boolean {
    try {
      const calculatedHash = crypto
        .createHash(this.HASH_ALGORITHM)
        .update(sealNumber + process.env.SEAL_SECRET || 'default-secret')
        .digest('hex');
      
      return calculatedHash === expectedHash;
    } catch (error) {
      console.error('Error verifying seal:', error);
      return false;
    }
  }

  /**
   * Generate batch of seal numbers
   */
  static generateBatch(count: number): SealNumber[] {
    const seals: SealNumber[] = [];
    
    for (let i = 0; i < count; i++) {
      seals.push(this.generateSeal());
    }
    
    return seals;
  }

  /**
   * Parse seal number components
   */
  static parseSeal(sealNumber: string): {
    prefix: string;
    timestamp: number;
    nonce: string;
    randomPart: string;
  } | null {
    try {
      const parts = sealNumber.split('-');
      if (parts.length !== 4) {
        return null;
      }

      const [prefix, timestampStr, nonce, randomPart] = parts;
      
      if (prefix !== this.SEAL_PREFIX) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 36);
      if (isNaN(timestamp)) {
        return null;
      }

      return {
        prefix,
        timestamp,
        nonce,
        randomPart
      };
    } catch (error) {
      console.error('Error parsing seal number:', error);
      return null;
    }
  }

  /**
   * Check if seal number is expired (older than 24 hours)
   */
  static isExpired(sealNumber: string): boolean {
    const parsed = this.parseSeal(sealNumber);
    if (!parsed) {
      return true;
    }

    const now = Date.now();
    const age = now - parsed.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return age > maxAge;
  }

  /**
   * Generate seal number with custom prefix
   */
  static generateCustomSeal(customPrefix: string): SealNumber {
    const timestamp = Date.now();
    const nonce = uuidv4().replace(/-/g, '').substring(0, 8);
    const randomBytes = crypto.randomBytes(this.SEAL_LENGTH).toString('hex');
    
    const sealNumber = `${customPrefix}-${timestamp.toString(36)}-${nonce}-${randomBytes}`;
    
    const hash = crypto
      .createHash(this.HASH_ALGORITHM)
      .update(sealNumber + process.env.SEAL_SECRET || 'default-secret')
      .digest('hex');

    return {
      sealNumber,
      hash,
      timestamp,
      nonce
    };
  }
}
