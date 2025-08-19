import { Request, Response } from 'express';
import { StartPackingRequest, VerifyItemRequest, CompletePackingRequest, ApiResponse } from '../types';
export declare class PackingController {
    private photoProcessor;
    constructor();
    startPacking(req: Request<{}, {}, StartPackingRequest>, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    verifyItem(req: Request<{}, {}, VerifyItemRequest>, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    completePacking(req: Request<{}, {}, CompletePackingRequest>, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    getJobStatus(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    getJobsAwaitingHandover(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    getSLAStatus(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    reassignJob(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    private generateJobNumber;
    private calculateEstimatedDuration;
    private updateJobProgress;
    private calculateSLAStatus;
}
