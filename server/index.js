const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'active', timestamp: new Date() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Track users in rooms
// Room ID -> Array of User Objects { socketId, userId, name }
const roomUsers = new Map();
// Socket ID -> Room ID
const socketToRoom = new Map();
// Socket ID -> User Info
const socketToUser = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket Connected] Socket ID: ${socket.id}`);

  // 1. Join Room
  socket.on('join-room', ({ roomId, userId, userName }) => {
    console.log(`[Join Room] Room: ${roomId}, User: ${userId} (${userName}), Socket: ${socket.id}`);

    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);
    
    const userInfo = { socketId: socket.id, userId, name: userName || 'Anonymous' };
    socketToUser.set(socket.id, userInfo);

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }
    
    // Add user if they aren't already in list
    const currentUsers = roomUsers.get(roomId);
    if (!currentUsers.some(u => u.socketId === socket.id)) {
      currentUsers.push(userInfo);
    }

    // Get list of other users in the room
    const otherUsers = currentUsers.filter(u => u.socketId !== socket.id);

    // Send the list of existing users to the newly joined user
    socket.emit('all-users', otherUsers);

    // Notify other users in the room that a new user has joined
    socket.to(roomId).emit('user-joined', userInfo);
  });

  // 2. Relay Offer
  socket.on('offer', ({ targetSocketId, offer, senderId, senderName }) => {
    console.log(`[SDP Offer] Relay from socket ${socket.id} to target ${targetSocketId}`);
    io.to(targetSocketId).emit('offer', {
      senderSocketId: socket.id,
      senderId,
      senderName,
      offer
    });
  });

  // 3. Relay Answer
  socket.on('answer', ({ targetSocketId, answer }) => {
    console.log(`[SDP Answer] Relay from socket ${socket.id} to target ${targetSocketId}`);
    io.to(targetSocketId).emit('answer', {
      senderSocketId: socket.id,
      answer
    });
  });

  // 4. Relay ICE Candidate
  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    // console.log(`[ICE Candidate] Relay from socket ${socket.id} to target ${targetSocketId}`);
    io.to(targetSocketId).emit('ice-candidate', {
      senderSocketId: socket.id,
      candidate
    });
  });

  // 5. Send Chat Message
  socket.on('send-message', ({ roomId, message, senderId, senderName, timestamp }) => {
    console.log(`[Chat Message] Room: ${roomId}, Sender: ${senderName}`);
    io.to(roomId).emit('receive-message', {
      message,
      senderId,
      senderName,
      timestamp
    });
  });

  // 6. Handle Controls State (Mute/Video toggles)
  socket.on('toggle-media', ({ roomId, type, enabled }) => {
    console.log(`[Media Toggle] Socket: ${socket.id}, Type: ${type}, Enabled: ${enabled}`);
    socket.to(roomId).emit('peer-media-toggled', {
      socketId: socket.id,
      type,
      enabled
    });
  });

  // 7. Whiteboard Syncing
  socket.on('draw', ({ roomId, data }) => {
    socket.to(roomId).emit('draw', data);
  });

  socket.on('clear-board', ({ roomId }) => {
    socket.to(roomId).emit('clear-board');
  });

  // 8. Disconnection
  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    const userInfo = socketToUser.get(socket.id);

    console.log(`[Socket Disconnected] Socket ID: ${socket.id}, Room: ${roomId}, User: ${userInfo?.name}`);

    if (roomId) {
      const users = roomUsers.get(roomId) || [];
      const updatedUsers = users.filter(u => u.socketId !== socket.id);
      
      if (updatedUsers.length === 0) {
        roomUsers.delete(roomId);
      } else {
        roomUsers.set(roomId, updatedUsers);
      }

      // Notify others that this user left
      socket.to(roomId).emit('user-left', socket.id);
    }

    socketToRoom.delete(socket.id);
    socketToUser.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`=========================================`);
});
