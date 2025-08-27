// Test script for picking wave generation with authentication
import sequelize from '../config/database';
import { Order, User, Role } from '../models';
import { JwtUtils } from '../utils/jwt';

async function testPickingWaveWithAuth() {
  try {
    console.log('🔍 Testing picking wave generation with authentication...');
    
    // Find the admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@company.com' },
      include: [
        {
          association: 'Role',
          include: ['Permissions'],
        }
      ],
      raw: false
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.email}`);
    console.log(`👤 Role: ${adminUser.Role?.name || 'No role assigned'}`);
    
    // Display user permissions
    if (adminUser.Role?.Permissions) {
      console.log(`🔐 Permissions (${adminUser.Role.Permissions.length}):`);
      adminUser.Role.Permissions.forEach((permission: any) => {
        console.log(`   - ${permission.module}:${permission.action}`);
      });
    } else {
      console.log('⚠️  No permissions found for this role');
    }
    
    // Check if user has required permission for picking wave generation
    const requiredPermission = 'picking:assign_manage';
    const hasRequiredPermission = adminUser.Role?.Permissions?.some(
      (p: any) => `${p.module}:${p.action}` === requiredPermission
    );
    
    if (hasRequiredPermission) {
      console.log(`✅ User has required permission: ${requiredPermission}`);
    } else {
      console.log(`❌ User missing required permission: ${requiredPermission}`);
      console.log('⚠️  This will cause a 403 Forbidden response when calling the API');
    }
    
    // Generate JWT token - FIXED: properly await the async method
    const token = await JwtUtils.generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.Role?.name || 'admin'
    });
    
    console.log(`🔑 Generated JWT token: ${token.substring(0, 50)}...`);
    
    // Verify the token contains the correct permissions
    try {
      const decodedToken = JwtUtils.verifyAccessToken(token);
      console.log(`🔍 Token payload:`, {
        userId: decodedToken.userId,
        email: decodedToken.email,
        role: decodedToken.role,
        permissions: decodedToken.permissions
      });
    } catch (error) {
      console.log('❌ Token verification failed:', error);
    }
    
    // Find the latest order
    const latestOrder = await Order.findOne({
      order: [['created_at', 'DESC']],
      raw: true
    });
    
    if (!latestOrder) {
      console.log('❌ No orders found in database');
      return;
    }
    
    console.log(`📦 Found order: ${(latestOrder as any).order_id}`);
    console.log(`📋 Cart data:`, JSON.stringify((latestOrder as any).cart, null, 2));
    
    // Check if cart data exists
    if (!(latestOrder as any).cart) {
      console.log('❌ Cart data is missing from order');
      return;
    }
    
    if (!Array.isArray((latestOrder as any).cart)) {
      console.log('❌ Cart data is not an array');
      return;
    }
    
    console.log(`✅ Cart has ${(latestOrder as any).cart.length} items`);
    
    // Calculate expected total items
    const expectedTotalItems = (latestOrder as any).cart.reduce((sum: number, item: any) => {
      return sum + (item.quantity || 1);
    }, 0);
    
    console.log(`📊 Expected total items: ${expectedTotalItems}`);
    
    // Test the API endpoint using curl command
    console.log('\n🚀 Test the API endpoint with this curl command:');
    console.log(`curl --location 'http://localhost:3000/api/picklist/generate' \\`);
    console.log(`--header 'Content-Type: application/json' \\`);
    console.log(`--header 'Authorization: Bearer ${token}' \\`);
    console.log(`--data '{"orderIds": ["${(latestOrder as any).order_id}"]}'`);
    
    console.log('\n📋 Or test with the order ID from your original request:');
    console.log(`curl --location 'http://localhost:3000/api/picklist/generate' \\`);
    console.log(`--header 'Content-Type: application/json' \\`);
    console.log(`--header 'Authorization: Bearer ${token}' \\`);
    console.log(`--data '{"orderIds": ["ozi17562782801920001"]}'`);
    
    // Test different permission levels
    console.log('\n🔐 Testing different permission levels:');
    console.log('1. picking:assign_manage - Required for /generate endpoint ✅');
    console.log('2. picking:view - Required for viewing picklists ✅');
    console.log('3. picking:execute - Required for scanning and completing picks ✅');
    
    // Check if user has all required permissions
    const allRequiredPermissions = ['picking:assign_manage', 'picking:view', 'picking:execute'];
    const missingPermissions = allRequiredPermissions.filter(required => 
      !adminUser.Role?.Permissions?.some((p: any) => `${p.module}:${p.action}` === required)
    );
    
    if (missingPermissions.length === 0) {
      console.log('✅ User has all required picking permissions');
    } else {
      console.log(`⚠️  User missing permissions: ${missingPermissions.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testPickingWaveWithAuth();
