"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMSIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class LMSIntegration {
    axiosInstance;
    config;
    retryQueue = new Map();
    constructor(config) {
        this.config = config;
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.apiKey,
            },
        });
        this.axiosInstance.interceptors.request.use((config) => {
            if (config.data) {
                config.headers['X-Signature'] = this.generateSignature(config.data);
                config.headers['X-Timestamp'] = Date.now().toString();
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status >= 500) {
                return this.handleRetry(error);
            }
            return Promise.reject(error);
        });
    }
    async createShipment(shipmentData) {
        try {
            const response = await this.axiosInstance.post('/shipments', shipmentData);
            return {
                success: true,
                data: response.data,
                statusCode: response.status,
                lmsReference: response.data.reference || response.data.id,
            };
        }
        catch (error) {
            return this.handleError(error, 'createShipment');
        }
    }
    async updateShipmentStatus(lmsReference, status, additionalData) {
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
        }
        catch (error) {
            return this.handleError(error, 'updateShipmentStatus');
        }
    }
    async generateManifest(shipmentIds) {
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
        }
        catch (error) {
            return this.handleError(error, 'generateManifest');
        }
    }
    async getShipment(lmsReference) {
        try {
            const response = await this.axiosInstance.get(`/shipments/${lmsReference}`);
            return {
                success: true,
                data: response.data,
                statusCode: response.status,
                lmsReference,
            };
        }
        catch (error) {
            return this.handleError(error, 'getShipment');
        }
    }
    async retryOperation(operationId) {
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
        return {
            success: false,
            error: 'Retry operation not implemented',
            statusCode: 501,
        };
    }
    getRetryQueueStatus() {
        return Array.from(this.retryQueue.entries()).map(([operationId, info]) => ({
            operationId,
            attempts: info.attempts,
            lastRetry: info.lastRetry,
        }));
    }
    clearRetryQueue() {
        this.retryQueue.clear();
    }
    generateSignature(data) {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const timestamp = Date.now().toString();
        const message = `${dataString}${timestamp}${this.config.apiKey}`;
        return crypto_1.default
            .createHash('sha256')
            .update(message)
            .digest('hex');
    }
    async handleRetry(error) {
        const config = error.config;
        const operationId = this.generateOperationId(config);
        if (!this.retryQueue.has(operationId)) {
            this.retryQueue.set(operationId, { attempts: 0, lastRetry: new Date() });
        }
        const retryInfo = this.retryQueue.get(operationId);
        if (retryInfo.attempts < this.config.retryAttempts) {
            retryInfo.attempts++;
            retryInfo.lastRetry = new Date();
            const delay = this.config.retryDelay * Math.pow(2, retryInfo.attempts - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.axiosInstance.request(config);
        }
        else {
            this.retryQueue.delete(operationId);
            throw error;
        }
    }
    handleError(error, operation) {
        console.error(`LMS ${operation} error:`, error);
        if (error.response) {
            return {
                success: false,
                error: error.response.data?.message || error.message || 'LMS operation failed',
                statusCode: error.response.status,
            };
        }
        else if (error.request) {
            return {
                success: false,
                error: 'No response from LMS',
                statusCode: 0,
            };
        }
        else {
            return {
                success: false,
                error: error.message || 'LMS operation failed',
                statusCode: 500,
            };
        }
    }
    generateOperationId(config) {
        const { method, url, data } = config;
        const dataHash = data ? crypto_1.default.createHash('md5').update(JSON.stringify(data)).digest('hex') : '';
        return `${method}_${url}_${dataHash}`;
    }
    async healthCheck() {
        try {
            const response = await this.axiosInstance.get('/health');
            return response.status === 200;
        }
        catch (error) {
            console.error('LMS health check failed:', error);
            return false;
        }
    }
    async getSystemStatus() {
        try {
            const response = await this.axiosInstance.get('/system/status');
            return {
                success: true,
                data: response.data,
                statusCode: response.status,
            };
        }
        catch (error) {
            return this.handleError(error, 'getSystemStatus');
        }
    }
}
exports.LMSIntegration = LMSIntegration;
