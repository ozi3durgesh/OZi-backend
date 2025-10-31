import { Server } from "socket.io";

class SocketManager {
  private io: Server | null = null;

  public init(io: Server) {
    this.io = io;
  }

  public getIO(): Server {
    if (!this.io) throw new Error("Socket.IO not initialized!");
    return this.io;
  }

  // Emit globally
  public emit(event: string, data: any) {
    if (!this.io) return;
    console.log(`📡 [WEBSOCKET] Emitting globally:`, {
      event,
      data: JSON.stringify(data, null, 2),
      timestamp: new Date().toISOString()
    });
    this.io.emit(event, data);
  }

  // Emit to a specific socket
  public emitToSocket(socketId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(socketId).emit(event, data);
  }

  // Emit to a specific room (picker in this case)
  public emitToPicker(pickerId: number, event: string, data: any) {
    if (!this.io) return;
    const roomName = `picker_${pickerId}`;
    console.log(`📡 [WEBSOCKET] Emitting to room ${roomName}:`, {
      event,
      data: JSON.stringify(data, null, 2),
      timestamp: new Date().toISOString()
    });
    this.io.to(roomName).emit(event, data);
  }
}

export const socketManager = new SocketManager();
