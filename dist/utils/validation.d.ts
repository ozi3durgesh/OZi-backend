export declare class ValidationUtils {
    static validateEmail(email: string): boolean;
    static validatePassword(password: string): {
        isValid: boolean;
        message: string;
    };
}
