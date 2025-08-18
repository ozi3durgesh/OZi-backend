// utils/lmsIntegration.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';
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

export class LMSIntegration {
  private axiosInstance: AxiosInstance;
  private config: LMSIntegrationConfig;
  private retryQueue: Map<string, { attempts: number; lastRetry: Date }> = new Map();

  constructor(config: LMSIntegrationConfig) {
    this.config = config;
    
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });

    // Add request interceptor for signing
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (config.data) {
          config.headers['X-Signature'] = this.generateSignature(config.data);
          config.headers['X-Timestamp'] = Date.now().toString();
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status >= 500) {
          // Server error, implement retry logic
          return this.handleRetry(error);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create shipment in LMS
   */
  async createShipment(shipmentData: ShipmentData): Promise<LMSResponse> {
    try {
      const response = await this.axiosInstance.post('/shipments', shipmentData);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        lmsReference: response.data.reference || response.data.id,
      };
    } catch (error: any) {
      return this.handleError(error, 'createShipment');
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    lmsReference: string,
    status: string,
    additionalData?: any
  ): Promise<LMSResponse> {
    try {
      const response = await this.axiosInstance.put(`/shipments/${lmsReference}/status`, {
        status,
        ...additionalData,
      });
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        lmsReference,
      };
    } catch (error: any) {
      return this.handleError(error, 'updateShipmentStatus');
    }
  }

  /**
   * Generate manifest
   */
  async generateManifest(shipmentIds: string[]): Promise<LMSResponse> {
    try {
      const response = await this.axiosInstance.post('/manifests', {
        shipmentIds,
        generatedAt: new Date().toISOString(),
      });
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        lmsReference: response.data.manifestNumber,
      };
    } catch (error: any) {
      return this.handleError(error, 'generateManifest');
    }
  }

  /**
   * Get shipment details
   */
  async getShipment(lmsReference: string): Promise<LMSResponse> {
    try {
      const response = await this.axiosInstance.get(`/shipments/${lmsReference}`);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        lmsReference,
      };
    } catch (error: any) {
      return this.handleError(error, 'getShipment');
    }
  }

  /**
   * Retry failed LMS operations
   */
  async retryOperation(operationId: string): Promise<LMSResponse> {
    const retryInfo = this.retryQueue.get(operationId);
    
    if (!retryInfo) {
      return {
        success: false,
        error: 'Operation not found in retry queue',
        statusCode: 404,
      };
    }

    if (retryInfo.attempts >= this.config.retryAttempts) {
      this.retryQueue.delete(operationId);
      return {
        success: false,
        error: 'Max retry attempts exceeded',
        statusCode: 429,
      };
    }

    // Implement retry logic based on operation type
    // This would typically involve looking up the operation details
    // and re-executing it
    
    return {
      success: false,
      error: 'Retry operation not implemented',
      statusCode: 501,
    };
  }

  /**
   * Get retry queue status
   */
  getRetryQueueStatus(): Array<{ operationId: string; attempts: number; lastRetry: Date }> {
    return Array.from(this.retryQueue.entries()).map(([operationId, info]) => ({
      operationId,
      attempts: info.attempts,
      lastRetry: info.lastRetry,
    }));
  }

  /**
   * Clear retry queue
   */
  clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  /**
   * Generate request signature for security
   */
  private generateSignature(data: any): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const timestamp = Date.now().toString();
    const message = `${dataString}${timestamp}${this.config.apiKey}`;
    
    return crypto
      .createHash('sha256')
      .update(message)
      .digest('hex');
  }

  /**
   * Handle retry logic for failed requests
   */
  private async handleRetry(error: any): Promise<AxiosResponse> {
    const config = error.config;
    const operationId = this.generateOperationId(config);
    
    if (!this.retryQueue.has(operationId)) {
      this.retryQueue.set(operationId, { attempts: 0, lastRetry: new Date() });
    }
    
    const retryInfo = this.retryQueue.get(operationId)!;
    
    if (retryInfo.attempts < this.config.retryAttempts) {
      retryInfo.attempts++;
      retryInfo.lastRetry = new Date();
      
      // Exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, retryInfo.attempts - 1);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return this.axiosInstance.request(config);
    } else {
      // Max retries exceeded, remove from queue
      this.retryQueue.delete(operationId);
      throw error;
    }
  }

  /**
   * Handle errors and format response
   */
  private handleError(error: any, operation: string): LMSResponse {
    console.error(`LMS ${operation} error:`, error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || error.message || 'LMS operation failed',
        statusCode: error.response.status,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'No response from LMS',
        statusCode: 0,
      };
    } else {
      return {
        success: false,
        error: error.message || 'LMS operation failed',
        statusCode: 500,
      };
    }
  }

  /**
   * Generate unique operation ID for retry tracking
   */
  private generateOperationId(config: any): string {
    const { method, url, data } = config;
    const dataHash = data ? crypto.createHash('md5').update(JSON.stringify(data)).digest('hex') : '';
    return `${method}_${url}_${dataHash}`;
  }

  /**
   * Health check for LMS connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('LMS health check failed:', error);
      return false;
    }
  }

  /**
   * Get LMS system status
   */
  async getSystemStatus(): Promise<LMSResponse> {
    try {
      const response = await this.axiosInstance.get('/system/status');
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return this.handleError(error, 'getSystemStatus');
    }
  }
}
