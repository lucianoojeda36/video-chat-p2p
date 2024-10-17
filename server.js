const express = require('express');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Create an HTTP server from the Express instance
const server = http.createServer(app);

// Initialize Socket.io server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
  },
});

// Initialize the Peer.js server with debug mode enabled
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

// Use Peer.js middleware
app.use('/peerjs', peerServer);

// Serve static files from the "public" folder
app.use(express.static('public'));

// Main route that redirects to a new room with a unique ID
app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`); // Generate a new room ID and redirect to it
});

// Route to render a room based on the room ID
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

// Handle Socket.io connections
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    // Notify other users in the room that a new user has connected
    socket.to(roomId).emit('user-connected', userId);

    // Handle chat messages
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message, userName); // Broadcast message to the room
    });
  });
});

// Start the server on a specified port or default to 3030
server.listen(process.env.PORT || 3030, () => {
  console.log(`Server is running on port ${process.env.PORT || 3030}`);
});
