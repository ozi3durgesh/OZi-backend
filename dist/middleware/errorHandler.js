"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const responseHandler_1 = require("./responseHandler");
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError') {
        return responseHandler_1.ResponseHandler.error(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
        return responseHandler_1.ResponseHandler.error(res, 'Token expired', 401);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return responseHandler_1.ResponseHandler.error(res, 'Email already exists', 409);
    }
    if (error.name === 'SequelizeValidationError') {
        return responseHandler_1.ResponseHandler.error(res, 'Validation error', 400);
    }
    return responseHandler_1.ResponseHandler.error(res, 'Internal server error', 500);
};
exports.errorHandler = errorHandler;
