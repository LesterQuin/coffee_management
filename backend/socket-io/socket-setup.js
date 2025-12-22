import { Server } from 'socket.io';
import http from 'http'
import express from 'express'
import allowedOrigins from '../config/allowed-origins.js'

export const app = express()
export const server = http.createServer(app)

export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});
    console.log("Socket.IO initialized");
io.on('connection', (socket) => {
    console.log("Connected socket");
    console.log("A user connected: ", socket.id);

    socket.on('registerUser', (userId) => {
        users[userId] = socket.id;
    });

    socket.on('disconnect', () => {
        console.log("User disconnected: ", socket.id);
    })
})
