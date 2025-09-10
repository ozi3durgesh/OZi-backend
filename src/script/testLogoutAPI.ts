// script/testLogoutAPI.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000'; // Adjust port as needed

async function testLogoutAPI() {
  try {
    console.log('🧪 Testing Logout API...\n');

    // First, let's login to get tokens
    console.log('1. Logging in to get tokens...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com', // Replace with valid credentials
      password: 'password123'     // Replace with valid credentials
    });

    if (loginResponse.data.success) {
      const { accessToken, refreshToken } = loginResponse.data.data;
      console.log('✅ Login successful');
      console.log(`Access Token: ${accessToken.substring(0, 50)}...`);
      console.log(`Refresh Token: ${refreshToken.substring(0, 50)}...\n`);

      // Test logout with both tokens
      console.log('2. Testing logout with access and refresh tokens...');
      try {
        const logoutResponse = await axios.post(
          `${BASE_URL}/api/auth/logout`,
          { refreshToken },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (logoutResponse.data.success) {
          console.log('✅ Logout successful');
          console.log('Response:', logoutResponse.data);
        } else {
          console.log('❌ Logout failed:', logoutResponse.data);
        }
      } catch (error: any) {
        console.log('❌ Logout request failed:', error.response?.data || error.message);
      }

      // Test logout all devices
      console.log('\n3. Testing logout all devices...');
      try {
        const logoutAllResponse = await axios.post(
          `${BASE_URL}/api/auth/logout-all`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (logoutAllResponse.data.success) {
          console.log('✅ Logout all successful');
          console.log('Response:', logoutAllResponse.data);
        } else {
          console.log('❌ Logout all failed:', logoutAllResponse.data);
        }
      } catch (error: any) {
        console.log('❌ Logout all request failed:', error.response?.data || error.message);
      }

      // Test using the same token after logout (should fail)
      console.log('\n4. Testing access with revoked token (should fail)...');
      try {
        const protectedResponse = await axios.get(
          `${BASE_URL}/api/auth/profile`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('❌ Token should have been revoked but request succeeded:', protectedResponse.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('✅ Token successfully revoked - access denied as expected');
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLogoutAPI()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export default testLogoutAPI;
