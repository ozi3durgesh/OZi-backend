import { Response } from 'express';
import { ApiResponse } from '../types';

export class ResponseHandler {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      statusCode,
      success: true,
      data,
      error: null,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, error: string, statusCode: number = 400): Response {
    const response: ApiResponse = {
      statusCode,
      success: false,
      error,
    };
    return res.status(statusCode).json(response);
  }
}