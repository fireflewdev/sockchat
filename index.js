const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const colors = ["#ffadad", "#9bf6ff", "#fdffb6", "#caffbf", "#ffd6a5", "#a0c4ff", "#ffc6ff", "#bdb2ff", "#eff7f6", "#b2f7ef"];

var currentColor = 0;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');

});

io.on('connection', async (socket) => {
    const sockets = await io.fetchSockets();
    var usedColors = [];

    for (const s of sockets) {
        const c = s.handshake.query.color;
        if (!usedColors.includes(c)) {
            usedColors += s.handshake.query.color;
        }
    }

    console.log(usedColors);

    socket.handshake.query.color = currentColor;

    for (var i = 0; i < colors.length; i++) {
        var c = (i + currentColor) % colors.length;
        if (!usedColors.includes(c)) {
            socket.handshake.query.color = c;
            currentColor = c;
            break;
        }
    }

    currentColor = (currentColor + 1) % colors.length;

    socket.handshake.query.username = `Anonymous-${socket.id}`;

    const color = colors[socket.handshake.query.color];

    socket.emit('update name', socket.handshake.query.username, color);
    socket.broadcast.emit('new connection', socket.handshake.query.username, color);

    socket.on('chat message', (msg) => {
        io.emit('chat message', socket.handshake.query.username, msg, color);
    });

    socket.on('disconnect', () => {
        io.emit('disconnection', socket.handshake.query.username, color);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
