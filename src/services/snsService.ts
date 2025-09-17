import AWS from "aws-sdk";

const sns = new AWS.SNS({ region: process.env.AWS_REGION });

export async function registerOrUpdateDevice(
  platformApplicationArn: string,
  deviceToken: string,
  existingEndpointArn?: string
): Promise<string> {
  if (existingEndpointArn) {
    // Update existing endpoint
    await sns
      .setEndpointAttributes({
        EndpointArn: existingEndpointArn,
        Attributes: {
          Token: deviceToken,
          Enabled: "true",
        },
      })
      .promise();

    return existingEndpointArn;
  } else {
    // Create new endpoint
    const result = await sns
      .createPlatformEndpoint({
        PlatformApplicationArn: platformApplicationArn,
        Token: deviceToken,
      })
      .promise();

    return result.EndpointArn!;
  }
}

export async function sendPushNotification(
  endpointArn: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  const message = {
    default: body,
    GCM: JSON.stringify({
      notification: { title, body },
      data,
    }),
    APNS: JSON.stringify({
      aps: { alert: { title, body }, sound: "default" },
      data,
    }),
  };

  await sns
    .publish({
      TargetArn: endpointArn,
      MessageStructure: "json",
      Message: JSON.stringify(message),
    })
    .promise();
}
