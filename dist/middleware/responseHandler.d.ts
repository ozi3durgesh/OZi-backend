import { Response } from 'express';
export declare class ResponseHandler {
    static success<T>(res: Response, data: T, statusCode?: number): Response;
    static error(res: Response, error: string, statusCode?: number): Response;
}
