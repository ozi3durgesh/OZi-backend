"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SealGenerator = void 0;
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
class SealGenerator {
    static SEAL_PREFIX = 'OZI';
    static HASH_ALGORITHM = 'sha256';
    static SEAL_LENGTH = 16;
    static generateSeal() {
        const timestamp = Date.now();
        const nonce = (0, uuid_1.v4)().replace(/-/g, '').substring(0, 8);
        const randomBytes = crypto_1.default.randomBytes(this.SEAL_LENGTH).toString('hex');
        const sealNumber = `${this.SEAL_PREFIX}-${timestamp.toString(36)}-${nonce}-${randomBytes}`;
        const hash = crypto_1.default
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
    static verifySeal(sealNumber, expectedHash) {
        try {
            const calculatedHash = crypto_1.default
                .createHash(this.HASH_ALGORITHM)
                .update(sealNumber + process.env.SEAL_SECRET || 'default-secret')
                .digest('hex');
            return calculatedHash === expectedHash;
        }
        catch (error) {
            console.error('Error verifying seal:', error);
            return false;
        }
    }
    static generateBatch(count) {
        const seals = [];
        for (let i = 0; i < count; i++) {
            seals.push(this.generateSeal());
        }
        return seals;
    }
    static parseSeal(sealNumber) {
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
        }
        catch (error) {
            console.error('Error parsing seal number:', error);
            return null;
        }
    }
    static isExpired(sealNumber) {
        const parsed = this.parseSeal(sealNumber);
        if (!parsed) {
            return true;
        }
        const now = Date.now();
        const age = now - parsed.timestamp;
        const maxAge = 24 * 60 * 60 * 1000;
        return age > maxAge;
    }
    static generateCustomSeal(customPrefix) {
        const timestamp = Date.now();
        const nonce = (0, uuid_1.v4)().replace(/-/g, '').substring(0, 8);
        const randomBytes = crypto_1.default.randomBytes(this.SEAL_LENGTH).toString('hex');
        const sealNumber = `${customPrefix}-${timestamp.toString(36)}-${nonce}-${randomBytes}`;
        const hash = crypto_1.default
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
exports.SealGenerator = SealGenerator;
