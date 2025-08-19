import { Request, Response } from 'express';
import { AssignRiderRequest, ConfirmHandoverRequest, ApiResponse } from '../types';
export declare class HandoverController {
    private lmsIntegration;
    constructor();
    assignRider(req: Request<{}, {}, AssignRiderRequest>, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    confirmHandover(req: Request<{}, {}, ConfirmHandoverRequest>, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    updateHandoverStatus(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    retryLMSSync(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    getHandoverDetails(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    getAvailableRiders(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    getLMSSyncStatus(req: Request, res: Response<ApiResponse>): Promise<Response<ApiResponse<any>, Record<string, any>>>;
    private syncWithLMS;
    private updateLMSStatus;
    private isValidStatusTransition;
}
