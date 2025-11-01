import { Request, Response, NextFunction } from 'express';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

// Helper to get client IP
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim())
    : req.socket.remoteAddress || req.ip || 'unknown';
  return ip || 'unknown';
};

// Helper to sanitize sensitive data from request
const sanitizeRequest = (req: Request): any => {
  const headers = { ...req.headers };
  
  // Remove sensitive headers
  delete headers.authorization;
  delete headers.cookie;
  
  return {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
    params: req.params,
    body: req.body,
    headers: headers,
  };
};

// Helper to sanitize response (limit size to prevent huge logs)
const sanitizeResponse = (data: any): any => {
  if (!data) return null;
  
  // Limit response size (max 50KB)
  const jsonString = JSON.stringify(data);
  if (jsonString.length > 50000) {
    return {
      _truncated: true,
      _size: jsonString.length,
      _message: 'Response too large, truncated'
    };
  }
  
  return data;
};

export const userTimelineMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip health check, debug endpoints, and static files
  if (
    req.path === '/health' ||
    req.path === '/debug/jwt' ||
    req.path.startsWith('/uploads/') ||
    req.path.match(/\.(jpg|jpeg|png|gif|ico|svg|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    next();
    return;
  }

  const startTime = Date.now();
  const requestData = sanitizeRequest(req);
  const ip = getClientIp(req);
  const userId = req.user?.id || null;

  // Store original methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalEnd = res.end.bind(res);
  const originalStatus = res.status.bind(res);

  let responseData: any = null;
  let statusCode = res.statusCode || 200;
  let responseSent = false;

  // Override res.status to track status code
  res.status = function (code: number): Response {
    statusCode = code;
    return originalStatus(code);
  };

  // Override res.json
  res.json = function (body: any): Response {
    if (!responseSent) {
      responseData = sanitizeResponse(body);
      statusCode = res.statusCode || statusCode || 200;
      responseSent = true;
    }
    return originalJson(body);
  };

  // Override res.send
  res.send = function (body: any): Response {
    if (!responseSent) {
      // Try to parse as JSON, otherwise keep as string (truncated)
      try {
        if (typeof body === 'string' && body.trim().startsWith('{')) {
          const parsed = JSON.parse(body);
          responseData = sanitizeResponse(parsed);
        } else if (typeof body === 'object') {
          responseData = sanitizeResponse(body);
        } else {
          // Plain string response
          if (body && body.length > 50000) {
            responseData = {
              _truncated: true,
              _size: body.length,
              _message: 'Response too large, truncated'
            };
          } else {
            responseData = body || null;
          }
        }
      } catch {
        // Not JSON, truncate if too long
        if (typeof body === 'string' && body.length > 50000) {
          responseData = {
            _truncated: true,
            _size: body.length,
            _message: 'Response too large, truncated'
          };
        } else {
          responseData = body || null;
        }
      }
      statusCode = res.statusCode || statusCode || 200;
      responseSent = true;
    }
    return originalSend(body);
  };

  // Override res.end
  res.end = function (chunk?: any, encoding?: any): Response {
    if (!responseSent && chunk) {
      try {
        if (Buffer.isBuffer(chunk)) {
          const text = chunk.toString('utf-8');
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            const parsed = JSON.parse(text);
            responseData = sanitizeResponse(parsed);
          } else {
            responseData = text.length > 50000 ? {
              _truncated: true,
              _size: text.length,
              _message: 'Response too large, truncated'
            } : text;
          }
        } else if (typeof chunk === 'string') {
          if (chunk.trim().startsWith('{') || chunk.trim().startsWith('[')) {
            const parsed = JSON.parse(chunk);
            responseData = sanitizeResponse(parsed);
          } else {
            responseData = chunk.length > 50000 ? {
              _truncated: true,
              _size: chunk.length,
              _message: 'Response too large, truncated'
            } : chunk;
          }
        } else {
          responseData = sanitizeResponse(chunk);
        }
        responseSent = true;
      } catch {
        // Not JSON, keep as is or truncate
        if (typeof chunk === 'string' && chunk.length > 50000) {
          responseData = {
            _truncated: true,
            _size: chunk.length,
            _message: 'Response too large, truncated'
          };
        } else {
          responseData = chunk || null;
        }
        responseSent = true;
      }
    }
    statusCode = res.statusCode || statusCode || 200;
    return originalEnd(chunk, encoding);
  };

  // Log on finish - capture final status code
  res.on('finish', async () => {
    try {
      // Ensure we have the final status code
      const finalStatusCode = res.statusCode || statusCode || 200;
      
      // If no response data was captured and response was sent, try to capture it from response
      if (!responseData && res.statusCode) {
        // Response was sent but we didn't capture it - log empty response
        responseData = null;
      }

      const responsePayload = {
        statusCode: finalStatusCode,
        body: responseData,
        duration: Date.now() - startTime,
      };

      // Insert into database asynchronously (don't block response)
      await sequelize.query(
        `INSERT INTO user_timeline (user_id, req, res, ip) VALUES (?, ?, ?, ?)`,
        {
          replacements: [
            userId,
            JSON.stringify(requestData),
            JSON.stringify(responsePayload),
            ip,
          ],
          type: QueryTypes.INSERT,
        }
      );
    } catch (error) {
      // Silently fail - don't break the API if logging fails
      console.error('Error logging to user_timeline:', error);
    }
  });

  // Also capture on close event for edge cases
  res.on('close', async () => {
    // If response finished without triggering 'finish', still try to log
    if (!res.headersSent) {
      try {
        const responsePayload = {
          statusCode: res.statusCode || statusCode || 200,
          body: responseData || null,
          duration: Date.now() - startTime,
          _closed: true,
        };

        await sequelize.query(
          `INSERT INTO user_timeline (user_id, req, res, ip) VALUES (?, ?, ?, ?)`,
          {
            replacements: [
              userId,
              JSON.stringify(requestData),
              JSON.stringify(responsePayload),
              ip,
            ],
            type: QueryTypes.INSERT,
          }
        );
      } catch (error) {
        // Silently fail
      }
    }
  });

  next();
};

