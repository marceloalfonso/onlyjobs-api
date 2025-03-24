import { Server } from 'socket.io';
import { FastifyTypedInstance } from '../types';

export function setupSocketIO(app: FastifyTypedInstance) {
  const httpServer = app.server;

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('ping', (data) => {
      console.log('ping', data);
      socket.emit('pong', 'pong');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('WebSocket server running!');

  return io;
}
