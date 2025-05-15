/* ==== server.js ==== */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {}; // { socketId: { time, name, submitted, victories, totalTime } }
let currentRound = 1;
const maxRounds = 5;
let roundInProgress = false;

function allPlayersSubmitted() {
  return Object.values(players).every((p) => p.submitted);
}

function resetPlayerStatus() {
  for (const id in players) {
    players[id].time = 0;
    players[id].submitted = false;
    players[id].ready = false;
  }
}

function startNextRound() {
  roundInProgress = true;
  resetPlayerStatus();
  io.emit('startRound', { currentRound });
}

function allPlayersReady() {
  return Object.values(players).every(p => p.ready);
}

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);
  players[socket.id] = { time: 0, name: `Jogador ${socket.id.substring(0, 5)}`, submitted: false, victories: 0, totalTime: 300, ready: false };

  io.emit('updateScoreboard', getScoreboard());

  socket.on('setName', (name) => {
    if (players[socket.id]) {
      players[socket.id].name = name;
      io.emit('updateScoreboard', getScoreboard());
    }
  });

  socket.on('submitTime', (elapsedTime) => {
    if (players[socket.id] && !players[socket.id].submitted && roundInProgress) {
      players[socket.id].time = elapsedTime;
      players[socket.id].submitted = true;
      players[socket.id].totalTime = Math.max(0, players[socket.id].totalTime - elapsedTime);

      if (allPlayersSubmitted()) {
        roundInProgress = false;
        let winnerId = null;
        let maxTime = -1;

        for (const id in players) {
          if (players[id].time > maxTime) {
            maxTime = players[id].time;
            winnerId = id;
          }
        }

        if (winnerId && players[winnerId]) {
          players[winnerId].victories += 1;
        }

        io.emit('roundResult', {
          winner: winnerId,
          winnerName: players[winnerId]?.name || 'Desconhecido',
          time: maxTime,
          timeLeft: players[winnerId]?.totalTime || 0,
          currentRound,
          players: getScoreboard()
        });

        currentRound++;

        if (currentRound > maxRounds || Object.values(players).every(p => p.totalTime <= 0)) {
          io.emit('gameOver', {
            players: getScoreboard()
          });
        }
      }
    }
  });

  socket.on('nextRound', () => {
    if (!roundInProgress) {
      startNextRound();
    }
  });

  socket.on('newGame', () => {
    currentRound = 1;
    roundInProgress = false;
    for (const id in players) {
      players[id].victories = 0;
      players[id].totalTime = 300;
      players[id].time = 0;
      players[id].submitted = false;
    }
    io.emit('updateScoreboard', getScoreboard());
    io.emit('startRound', { currentRound });
  });

  socket.on('playerReady', () => {
    if (players[socket.id]) {
      players[socket.id].ready = true;
      if (allPlayersReady()) {
        startNextRound();
      }
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updateScoreboard', getScoreboard());
    console.log('Jogador saiu:', socket.id);
  });
});

function getScoreboard() {
  return Object.fromEntries(Object.entries(players).map(([id, p]) => [id, {
    name: p.name,
    victories: p.victories,
    totalTime: p.totalTime.toFixed(2)
  }]));
}

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
