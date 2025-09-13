import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './config/database';
import { autoInitializeRBAC } from './config/autoInit';
import http from 'http';
import { Server } from 'socket.io';
import { socketManager } from './utils/socketManager';

dotenv.config();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    
    // Initialize RBAC system with updated permissions
    await autoInitializeRBAC();
    
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    socketManager.init(io);

    io.on("connection", (socket) => {
      console.log("🔌 Client connected:", socket.id);

      // 📌 Picker joins their own room
      socket.on("join_picker", (pickerId: number) => {
        const roomName = `picker_${pickerId}`;
        socket.join(roomName);
        console.log(`✅ Picker ${pickerId} joined room ${roomName}`);
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
