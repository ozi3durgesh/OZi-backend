"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
async function testFullRegistration() {
    try {
        console.log('Testing full registration flow...\n');
        await (0, database_1.connectDatabase)();
        console.log('✅ Database connection established');
        const roles = await models_1.Role.findAll();
        console.log(`Available roles: ${roles.map(r => r.name).join(', ')}`);
        const totalUsers = await models_1.User.count();
        console.log(`Total users: ${totalUsers}`);
        console.log('\n=== Testing Registration Flow ===');
        const email = 'fulltest@example.com';
        const password = 'Password123';
        const roleName = 'wh_staff_1';
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            console.log('❌ User already exists');
            return;
        }
        const role = await models_1.Role.findOne({ where: { name: roleName } });
        if (!role) {
            console.log('❌ Role not found');
            return;
        }
        console.log(`✅ Role found: ${role.name} (ID: ${role.id})`);
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        console.log('✅ Password hashed');
        const user = await models_1.User.create({
            email,
            password: hashedPassword,
            roleId: role.id,
            isActive: true,
            availabilityStatus: 'available'
        });
        console.log('✅ User created:', { id: user.id, email: user.email, roleId: user.roleId });
        try {
            const accessToken = await jwt_1.JwtUtils.generateAccessToken(user);
            console.log('✅ Access token generated');
            const refreshToken = await jwt_1.JwtUtils.generateRefreshToken(user);
            console.log('✅ Refresh token generated');
        }
        catch (jwtError) {
            console.error('❌ JWT generation failed:', jwtError);
        }
        try {
            const userWithRole = await models_1.User.findByPk(user.id, {
                include: [
                    {
                        association: 'Role',
                        include: ['Permissions'],
                    }
                ],
                attributes: ['id', 'email', 'roleId', 'isActive', 'availabilityStatus', 'createdAt']
            });
            console.log('✅ User with role retrieved');
            console.log('Role:', userWithRole?.Role?.name);
            console.log('Permissions count:', userWithRole?.Role?.Permissions?.length || 0);
        }
        catch (assocError) {
            console.error('❌ Association query failed:', assocError);
        }
        await user.destroy();
        console.log('✅ Test user cleaned up');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}
testFullRegistration()
    .then(() => {
    console.log('Full registration test completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Full registration test failed:', error);
    process.exit(1);
});
