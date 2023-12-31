import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const app = express();
const base = '/'; // Assurez-vous que cela correspond à l'option de base dans votre astro.config.mjs

// Serve the static files from the Astro build
app.use(base, express.static('dist/client/'));
app.use('/scripts', express.static('dist/scripts'));

// Handle SSR for all get requests
app.get('*', ssrHandler);

// Create an HTTP server and configure Socket.io
const server = createServer(app);
const io = new SocketIOServer(server);

let messages = [];

// Socket.io event handling
io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  messages.forEach((message) => {
    socket.emit('chat_message', message);
  });

  socket.on('chat_message', (data) => {
    messages.push(data);
    console.log('message: ' + data);
    // Diffusion du message à tous les clients connectés
    io.emit('chat_message', data);
  });

  // Les autres gestionnaires d'événements...
  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
  });

  socket.on('join', (roomId) => {
    const selectedRoom = io.sockets.adapter.rooms.get(roomId);
    const numberOfClients = selectedRoom ? selectedRoom.size : 0;

    console.log(`Client ${socket.id} requesting to join room ${roomId}`);
    if (numberOfClients < 4) {
      console.log(`Joining room ${roomId} and emitting room_joined socket event`);
      socket.join(roomId);
      socket.to(roomId).emit('new_peer', socket.id); // Notify others in the room
    } else {
      console.log(`Can't join room ${roomId}, emitting full_room socket event`);
      socket.emit('full_room', roomId);
    }
  });

  socket.on('start_call', (roomId) => {
    console.log(`Broadcasting start_call event to peers in room ${roomId}`);
    socket.broadcast.to(roomId).emit('start_call');
  });

  socket.on('webrtc_offer', (data) => {
    console.log(`Received offer from ${socket.id} in room ${data.roomId}`);
    socket.to(data.peerId).emit('webrtc_offer', {
      peerId: socket.id, 
      sdp: data.sdp
    });
  });

  socket.on('webrtc_answer', (data) => {
    console.log(`Received answer from ${socket.id} in room ${data.roomId}`);
    socket.to(data.peerId).emit('webrtc_answer', {
      peerId: socket.id, 
      sdp: data.sdp
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    console.log(`Received ICE candidate from ${socket.id} for room ${data.roomId}`);
    socket.to(data.peerId).emit('webrtc_ice_candidate', {
      peerId: socket.id,
      label: data.label,
      candidate: data.candidate
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
  });
});

// Start the server on the specified port or default to port 8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});