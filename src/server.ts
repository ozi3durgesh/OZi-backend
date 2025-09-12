import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './config/database';
import http from 'http';
import { Server } from 'socket.io';
import { io as ClientIO } from "socket.io-client";
dotenv.config();
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await connectDatabase();
    const server = http.createServer(app);
        const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });
     io.on("connection", (socket) => {
      console.log(":electric_plug: Client connected:", socket.id);
      socket.on("disconnect", () => {
        console.log(":x: Client disconnected:", socket.id);
      });
    });
     app.locals.io = io;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
      // client self-test
      const testSocket = ClientIO(`http://localhost:${PORT}`);
      testSocket.on("connect", () => {
      console.log(":test_tube: Self-test client connected:", testSocket.id);
      });
      testSocket.on("delivery_assigned", (data) => {
      console.log(":test_tube: Self-test client received:", data);
      });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
startServer();