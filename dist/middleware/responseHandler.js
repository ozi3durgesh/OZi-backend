"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
class ResponseHandler {
    static success(res, data, statusCode = 200) {
        const response = {
            statusCode,
            success: true,
            data,
            error: null,
        };
        return res.status(statusCode).json(response);
    }
    static error(res, error, statusCode = 400) {
        const response = {
            statusCode,
            success: false,
            error,
        };
        return res.status(statusCode).json(response);
    }
}
exports.ResponseHandler = ResponseHandler;
