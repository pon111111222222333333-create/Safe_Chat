const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store online users
const onlineUsers = new Set();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Send current online users to the new client
    socket.emit('online-users', Array.from(onlineUsers));

    // Handle user joining
    socket.on('user-joined', (data) => {
        onlineUsers.add(data.username);
        socket.broadcast.emit('user-joined', data);
        io.emit('online-users', Array.from(onlineUsers));
    });

    // Handle messages
    socket.on('send-message', (data) => {
        socket.broadcast.emit('new-message', data);
    });

    // Handle voice channel events
    socket.on('voice-joined', (data) => {
        socket.broadcast.emit('voice-user-joined', data);
    });

    socket.on('voice-left', (data) => {
        socket.broadcast.emit('voice-user-left', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Note: In a real app, you'd need to track which username belongs to which socket
        onlineUsers.forEach(user => {
            // This is a simplified approach - you'd need proper user-socket mapping
            socket.broadcast.emit('user-left', { username: user });
        });
        onlineUsers.clear();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});