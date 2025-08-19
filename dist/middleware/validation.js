"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                for (const [field, rule] of Object.entries(schema.body)) {
                    const value = req.body[field];
                    if (rule.required && (value === undefined || value === null || value === '')) {
                        res.status(400).json({
                            statusCode: 400,
                            success: false,
                            error: `${field} is required`
                        });
                        return;
                    }
                    if (value !== undefined && value !== null) {
                        if (rule.type === 'number' && typeof value !== 'number') {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} must be a number`
                            });
                            return;
                        }
                        if (rule.type === 'string' && typeof value !== 'string') {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} must be a string`
                            });
                            return;
                        }
                        if (rule.type === 'array' && !Array.isArray(value)) {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} must be an array`
                            });
                            return;
                        }
                        if (rule.enum && !rule.enum.includes(value)) {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} must be one of: ${rule.enum.join(', ')}`
                            });
                            return;
                        }
                        if (rule.min !== undefined && value < rule.min) {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} must be at least ${rule.min}`
                            });
                            return;
                        }
                        if (rule.max !== undefined && value > rule.max) {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} must be at most ${rule.max}`
                            });
                            return;
                        }
                    }
                }
            }
            if (schema.params) {
                for (const [field, rule] of Object.entries(schema.params)) {
                    const value = req.params[field];
                    if (rule.required && !value) {
                        res.status(400).json({
                            statusCode: 400,
                            success: false,
                            error: `${field} parameter is required`
                        });
                        return;
                    }
                    if (rule.type === 'number' && value) {
                        const numValue = parseInt(value);
                        if (isNaN(numValue)) {
                            res.status(400).json({
                                statusCode: 400,
                                success: false,
                                error: `${field} parameter must be a number`
                            });
                            return;
                        }
                        req.params[field] = numValue;
                    }
                }
            }
            next();
        }
        catch (error) {
            console.error('Validation error:', error);
            res.status(500).json({
                statusCode: 500,
                success: false,
                error: 'Validation failed'
            });
            return;
        }
    };
};
exports.validateRequest = validateRequest;
