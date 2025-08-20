export interface SealNumber {
    sealNumber: string;
    hash: string;
    timestamp: number;
    nonce: string;
}
export declare class SealGenerator {
    private static readonly SEAL_PREFIX;
    private static readonly HASH_ALGORITHM;
    private static readonly SEAL_LENGTH;
    static generateSeal(): SealNumber;
    static verifySeal(sealNumber: string, expectedHash: string): boolean;
    static generateBatch(count: number): SealNumber[];
    static parseSeal(sealNumber: string): {
        prefix: string;
        timestamp: number;
        nonce: string;
        randomPart: string;
    } | null;
    static isExpired(sealNumber: string): boolean;
    static generateCustomSeal(customPrefix: string): SealNumber;
}
