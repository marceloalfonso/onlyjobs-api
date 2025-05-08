import { Server } from 'socket.io';
import { FastifyTypedInstance } from '../types';

export default function setupSocketIO(app: FastifyTypedInstance) {
  const httpServer = app.server;

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_user_room', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined personal room`);
    });

    socket.on('leave_user_room', (userId) => {
      socket.leave(`user:${userId}`);
      console.log(`User ${userId} left personal room`);
    });

    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`Client ${socket.id} joined chat ${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`Client ${socket.id} left chat ${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('WebSocket server running!');

  return io;
}
