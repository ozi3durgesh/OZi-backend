import { Request, Response, NextFunction } from 'express';
import { UniversalLog } from '../models';
import sequelize from '../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    wallet_balance?: number;
  };
}

interface LogData {
  url: string;
  method: string;
  req: any;
  res: any;
  status_code: number;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  execution_time_ms: number;
  created_at: number;
  endpoint_name?: string;
  module?: string;
  error_message?: string;
  request_size_bytes?: number;
  response_size_bytes?: number;
}

export class UniversalLogger {
  /**
   * Middleware to log all API requests and responses
   */
  static async logRequest(req: AuthRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    let responseBody: any = null;
    let statusCode: number = 200;
    let errorMessage: string | undefined;

    // Override res.send to capture response body
    res.send = function(body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Override res.json to capture response body
    res.json = function(body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Override res.status to capture status code
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    // Capture response when it finishes
    res.on('finish', async () => {
      try {
        const executionTime = Date.now() - startTime;
        
        // Extract endpoint name and module from URL
        const urlParts = req.originalUrl.split('/').filter(Boolean);
        const module = urlParts[1] || 'unknown'; // e.g., 'customer', 'admin', 'auth'
        const endpointName = UniversalLogger.getEndpointName(req.originalUrl, req.method);

        // Prepare request data
        const requestData = {
          body: req.body,
          query: req.query,
          params: req.params,
          headers: UniversalLogger.sanitizeHeaders(req.headers),
          method: req.method,
          url: req.originalUrl
        };

        // Prepare response data
        const responseData = {
          body: responseBody,
          status: statusCode,
          headers: res.getHeaders()
        };

        // Calculate sizes
        const requestSize = JSON.stringify(requestData).length;
        const responseSize = responseBody ? JSON.stringify(responseBody).length : 0;

        const logData: LogData = {
          url: req.originalUrl,
          method: req.method,
          req: requestData,
          res: responseData,
          status_code: statusCode,
          user_id: req.user?.id,
          ip_address: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
          user_agent: req.get('User-Agent'),
          execution_time_ms: executionTime,
          created_at: Math.floor(Date.now() / 1000),
          endpoint_name: endpointName,
          module: module,
          error_message: errorMessage,
          request_size_bytes: requestSize,
          response_size_bytes: responseSize
        };

        // Log to database (non-blocking)
        UniversalLogger.saveLog(logData).catch(err => {
          console.error('Failed to save universal log:', err);
        });

      } catch (error) {
        console.error('Error in universal logging middleware:', error);
      }
    });

    // Handle errors
    res.on('error', (error) => {
      errorMessage = error.message;
    });

    next();
  }

  /**
   * Save log data to database
   */
  private static async saveLog(logData: LogData): Promise<void> {
    try {
      await UniversalLog.create(logData);
    } catch (error) {
      console.error('Failed to create universal log entry:', error);
      throw error;
    }
  }

  /**
   * Extract human-readable endpoint name from URL
   */
  static getEndpointName(url: string, method: string): string {
    const urlParts = url.split('/').filter(Boolean);
    
    // Remove API version and module prefix
    if (urlParts[0] === 'api' && urlParts[1]?.startsWith('v')) {
      urlParts.splice(0, 2);
    }
    
    // Remove module name (first part after api/v1)
    if (urlParts.length > 0) {
      urlParts.splice(0, 1);
    }
    
    // Convert remaining parts to readable format
    if (urlParts.length === 0) {
      return 'root';
    }
    
    // Handle common patterns
    const endpoint = urlParts.join('_');
    
    // Convert to readable format
    return endpoint
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/_+/g, '_');
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  static sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Get logs with filtering and pagination
   */
  static async getLogs(options: {
    page?: number;
    limit?: number;
    module?: string;
    endpoint_name?: string;
    status_code?: number;
    user_id?: number;
    start_date?: number;
    end_date?: number;
    method?: string;
  } = {}) {
    const {
      page = 1,
      limit = 50,
      module,
      endpoint_name,
      status_code,
      user_id,
      start_date,
      end_date,
      method
    } = options;

    const offset = (page - 1) * limit;
    const where: any = {};

    if (module) where.module = module;
    if (endpoint_name) where.endpoint_name = endpoint_name;
    if (status_code) where.status_code = status_code;
    if (user_id) where.user_id = user_id;
    if (method) where.method = method;
    
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.$gte = start_date;
      if (end_date) where.created_at.$lte = end_date;
    }

    const { count, rows } = await UniversalLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get log statistics
   */
  static async getLogStats(options: {
    start_date?: number;
    end_date?: number;
    module?: string;
  } = {}) {
    const { start_date, end_date, module } = options;
    const where: any = {};

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.$gte = start_date;
      if (end_date) where.created_at.$lte = end_date;
    }
    
    if (module) where.module = module;

    const stats = await UniversalLog.findAll({
      where,
      attributes: [
        'status_code',
        'method',
        'module',
        'endpoint_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('execution_time_ms')), 'avg_execution_time'],
        [sequelize.fn('MAX', sequelize.col('execution_time_ms')), 'max_execution_time'],
        [sequelize.fn('MIN', sequelize.col('execution_time_ms')), 'min_execution_time']
      ],
      group: ['status_code', 'method', 'module', 'endpoint_name'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    return stats;
  }
}

export default UniversalLogger;
