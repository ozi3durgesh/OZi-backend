import { LMSIntegrationConfig } from '../types';
export interface LMSRequest {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    headers?: Record<string, string>;
}
export interface LMSResponse {
    success: boolean;
    data?: any;
    error?: string;
    statusCode: number;
    lmsReference?: string;
}
export interface ShipmentData {
    trackingNumber: string;
    manifestNumber: string;
    origin: string;
    destination: string;
    items: Array<{
        sku: string;
        quantity: number;
        description: string;
    }>;
    specialInstructions?: string;
    expectedDelivery?: Date;
}
export declare class LMSIntegration {
    private axiosInstance;
    private config;
    private retryQueue;
    constructor(config: LMSIntegrationConfig);
    createShipment(shipmentData: ShipmentData): Promise<LMSResponse>;
    updateShipmentStatus(lmsReference: string, status: string, additionalData?: any): Promise<LMSResponse>;
    generateManifest(shipmentIds: string[]): Promise<LMSResponse>;
    getShipment(lmsReference: string): Promise<LMSResponse>;
    retryOperation(operationId: string): Promise<LMSResponse>;
    getRetryQueueStatus(): Array<{
        operationId: string;
        attempts: number;
        lastRetry: Date;
    }>;
    clearRetryQueue(): void;
    private generateSignature;
    private handleRetry;
    private handleError;
    private generateOperationId;
    healthCheck(): Promise<boolean>;
    getSystemStatus(): Promise<LMSResponse>;
}
