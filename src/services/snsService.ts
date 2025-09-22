import AWS from "aws-sdk";

// Initialize AWS SNS with comprehensive logging
const sns = new AWS.SNS({ 
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Log AWS configuration on startup
console.log('🔧 AWS SNS Configuration:');
console.log(`   - Region: ${process.env.AWS_REGION}`);
console.log(`   - Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not Set'}`);
console.log(`   - Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not Set'}`);
console.log(`   - Platform Application ARN: ${process.env.AWS_PLATFORM_APPLICATION_ARN}`);

export async function registerOrUpdateDevice(
  platformApplicationArn: string,
  deviceToken: string,
  existingEndpointArn?: string
): Promise<string> {
  console.log('📱 RegisterOrUpdateDevice called:');
  console.log(`   - Platform ARN: ${platformApplicationArn}`);
  console.log(`   - Device Token: ${deviceToken ? `${deviceToken.substring(0, 20)}...` : 'Not provided'}`);
  console.log(`   - Existing Endpoint ARN: ${existingEndpointArn || 'None'}`);

  try {
    if (existingEndpointArn) {
      console.log('🔄 Updating existing endpoint...');
      // Update existing endpoint
      const updateResult = await sns
        .setEndpointAttributes({
          EndpointArn: existingEndpointArn,
          Attributes: {
            Token: deviceToken,
            Enabled: "true",
          },
        })
        .promise();

      console.log('✅ Endpoint updated successfully:', updateResult);
      return existingEndpointArn;
    } else {
      console.log('🆕 Creating new endpoint...');
      // Create new endpoint
      const result = await sns
        .createPlatformEndpoint({
          PlatformApplicationArn: platformApplicationArn,
          Token: deviceToken,
        })
        .promise();

      console.log('✅ New endpoint created successfully:', result);
      return result.EndpointArn!;
    }
  } catch (error: any) {
    console.error('❌ Error in registerOrUpdateDevice:', error);
    console.error('   - Error Code:', error.code);
    console.error('   - Error Message:', error.message);
    console.error('   - Error Status Code:', error.statusCode);
    throw error;
  }
}

export async function sendPushNotification(
  endpointArn: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  console.log('📨 SendPushNotification called:');
  console.log(`   - Endpoint ARN: ${endpointArn}`);
  console.log(`   - Title: ${title}`);
  console.log(`   - Body: ${body}`);
  console.log(`   - Data:`, data);

  // Validate inputs
  if (!endpointArn) {
    console.error('❌ Error: endpointArn is required');
    throw new Error('Endpoint ARN is required');
  }

  if (!title || !body) {
    console.error('❌ Error: title and body are required');
    throw new Error('Title and body are required');
  }

  const message = {
    default: body,
    GCM: JSON.stringify({
      notification: { title, body },
      data: {
        route: data.route || "/waves", // Default route for wave assignments
        orderId: data.orderId || "",
        waveId: data.waveId || "",
        ...data // Include any additional custom data
      },
    }),
    APNS: JSON.stringify({
      aps: { alert: { title, body }, sound: "default" },
      data: {
        route: data.route || "/waves", // Default route for wave assignments
        orderId: data.orderId || "",
        waveId: data.waveId || "",
        ...data // Include any additional custom data
      },
    }),
  };

  console.log('📋 Message payload:', JSON.stringify(message, null, 2));

  try {
    const publishParams = {
      TargetArn: endpointArn,
      MessageStructure: "json",
      Message: JSON.stringify(message),
    };

    console.log('📡 Publishing to SNS with params:', JSON.stringify(publishParams, null, 2));

    const result = await sns.publish(publishParams).promise();
    
    console.log('✅ Push notification sent successfully!');
    console.log('   - Message ID:', result.MessageId);
    console.log('   - Response:', result);
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    console.error('   - Error Code:', error.code);
    console.error('   - Error Message:', error.message);
    console.error('   - Error Status Code:', error.statusCode);
    console.error('   - Error Request ID:', error.requestId);
    
    // Log additional debugging info
    if (error.code === 'InvalidParameter') {
      console.error('   - This usually means the endpoint ARN is invalid or the device token is expired');
    } else if (error.code === 'EndpointDisabled') {
      console.error('   - The endpoint has been disabled, device may have uninstalled the app');
    } else if (error.code === 'PlatformApplicationDisabled') {
      console.error('   - The platform application has been disabled');
    }
    
    throw error;
  }
}
