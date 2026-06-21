import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', socket.id);

      // Get existing users in room and send to the new user
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const usersInRoom = Array.from(room).filter(id => id !== socket.id);
        socket.emit('existing-users', usersInRoom);
      }
    });

    socket.on('offer', (payload: { target: string; caller: string; sdp: any }) => {
      io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload: { target: string; caller: string; sdp: any }) => {
      io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload: { target: string; caller: string; candidate: any }) => {
      io.to(payload.target).emit('ice-candidate', payload);
    });

    socket.on('chat-message', (payload: { roomId: string; message: string; senderId: string }) => {
      // Broadcast to everyone else in the room
      socket.to(payload.roomId).emit('chat-message', payload);
    });

    socket.on('disconnecting', () => {
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-disconnected', socket.id);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  httpServer.listen(Number(port), '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
