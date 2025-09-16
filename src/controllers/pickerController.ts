import { Request, Response } from "express";
import User from "../models/User";
import UserDevice from "../models/userDevice";
import { registerOrUpdateDevice } from "../services/snsService";

export async function registerDevice(req: Request, res: Response): Promise<void> {
  try {
    const { userId, deviceToken } = req.body;

    if (!userId || !deviceToken) {
      res.status(400).json({ success: false, error: "Missing fields" });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    let userDevice = await UserDevice.findOne({ where: { userId, deviceToken } });

    const endpointArn = await registerOrUpdateDevice(
      process.env.AWS_PLATFORM_APPLICATION_ARN!,
      deviceToken,
      userDevice?.snsEndpointArn
    );

    if (userDevice) {
      userDevice.snsEndpointArn = endpointArn;
      await userDevice.save();
    } else {
      userDevice = await UserDevice.create({ userId, deviceToken, snsEndpointArn: endpointArn });
    }

    res.json({ success: true, endpointArn });
  } catch (err) {
    console.error("Error registering device:", err);
    res.status(500).json({ success: false, error: "Failed to register device" });
  }
}
