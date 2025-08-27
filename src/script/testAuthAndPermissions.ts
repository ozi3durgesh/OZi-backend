// Test script for authentication and permissions system
import sequelize from '../config/database';
import { User, Role, Permission, RolePermission } from '../models';
import { JwtUtils } from '../utils/jwt';

async function testAuthAndPermissions() {
  try {
    console.log('🔐 Testing Authentication and Permissions System...\n');
    
    // Test 1: Check if admin user exists and has proper role
    console.log('1️⃣ Testing Admin User Setup...');
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
      console.log('❌ Admin user not found. Please run the registration script first.');
      return;
    }
    
    console.log(`✅ Admin user found: ${adminUser.email}`);
    console.log(`👤 Role: ${adminUser.Role?.name || 'No role assigned'}`);
    
    if (!adminUser.Role) {
      console.log('❌ Admin user has no role assigned');
      return;
    }
    
    // Test 2: Check admin permissions
    console.log('\n2️⃣ Testing Admin Permissions...');
    const adminPermissions = adminUser.Role.Permissions || [];
    console.log(`📋 Admin has ${adminPermissions.length} permissions`);
    
    if (adminPermissions.length === 0) {
      console.log('❌ Admin user has no permissions');
      return;
    }
    
    // Check for key permissions
    const keyPermissions = [
      'picking:assign_manage',
      'picking:view', 
      'picking:execute',
      'users_roles:manage'
    ];
    
    keyPermissions.forEach(permission => {
      const hasPermission = adminPermissions.some(p => `${p.module}:${p.action}` === permission);
      console.log(`${hasPermission ? '✅' : '❌'} ${permission}`);
    });
    
    // Test 3: JWT Token Generation and Verification
    console.log('\n3️⃣ Testing JWT Token System...');
    try {
      const token = await JwtUtils.generateAccessToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.Role.name
      });
      
      console.log('✅ JWT token generated successfully');
      console.log(`🔑 Token preview: ${token.substring(0, 50)}...`);
      
      // Verify the token
      const decodedToken = JwtUtils.verifyAccessToken(token);
      console.log('✅ JWT token verified successfully');
      console.log('🔍 Token payload:', {
        userId: decodedToken.userId,
        email: decodedToken.email,
        role: decodedToken.role,
        permissionsCount: decodedToken.permissions?.length || 0
      });
      
      // Test 4: Permission Check Simulation
      console.log('\n4️⃣ Testing Permission Check Simulation...');
      const requiredPermission = 'picking:assign_manage';
      const hasRequiredPermission = decodedToken.permissions?.includes(requiredPermission);
      
      if (hasRequiredPermission) {
        console.log(`✅ User has required permission: ${requiredPermission}`);
        console.log('✅ This user can access /api/picklist/generate endpoint');
      } else {
        console.log(`❌ User missing required permission: ${requiredPermission}`);
        console.log('❌ This user will get 403 Forbidden when accessing /api/picklist/generate');
      }
      
      // Test 5: Role Hierarchy Test
      console.log('\n5️⃣ Testing Role Hierarchy...');
      const allRoles = await Role.findAll({
        include: [{
          model: Permission,
          through: { attributes: [] }, // Don't include junction table attributes
          as: 'Permissions'
        }],
        raw: false
      });
      
      console.log(`📊 Found ${allRoles.length} roles in system:`);
      allRoles.forEach(role => {
        const permissionCount = (role as any).Permissions?.length || 0;
        console.log(`   - ${role.name}: ${permissionCount} permissions`);
      });
      
      // Test 6: Database Schema Validation
      console.log('\n6️⃣ Testing Database Schema...');
      const permissionCount = await Permission.count();
      const rolePermissionCount = await RolePermission.count();
      
      console.log(`📊 Total permissions: ${permissionCount}`);
      console.log(`📊 Total role-permission mappings: ${rolePermissionCount}`);
      
      if (permissionCount > 0 && rolePermissionCount > 0) {
        console.log('✅ Database schema is properly set up');
      } else {
        console.log('❌ Database schema may be incomplete');
      }
      
      // Test 7: API Endpoint Permission Requirements
      console.log('\n7️⃣ API Endpoint Permission Requirements...');
      console.log('📋 Picking Routes:');
      console.log('   POST /generate → requires: picking:assign_manage');
      console.log('   GET /assign → requires: picking:assign_manage');
      console.log('   POST /:waveId/start → requires: picking:execute');
      console.log('   GET /:waveId/items → requires: picking:view');
      console.log('   POST /:waveId/scan → requires: picking:execute');
      
      console.log('\n📋 Test Commands:');
      console.log('🔑 Generate token and test API:');
      console.log(`curl --location 'http://localhost:3000/api/picklist/generate' \\`);
      console.log(`--header 'Content-Type: application/json' \\`);
      console.log(`--header 'Authorization: Bearer ${token}' \\`);
      console.log(`--data '{"orderIds": ["test_order_id"]}'`);
      
    } catch (error) {
      console.log('❌ JWT token test failed:', error);
    }
    
    console.log('\n🎉 Authentication and Permissions Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testAuthAndPermissions();
