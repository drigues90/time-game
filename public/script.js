
/* ==== public/script.js ==== */
const socket = io();

let timer = 0;
let startTime = 0;
let running = false;
let interval = null;
let submitted = false;

const nameInput = document.getElementById('name');
const setNameBtn = document.getElementById('setName');
const timerDisplay = document.getElementById('timer');
const toggleBtn = document.getElementById('toggle');
const nextRoundBtn = document.getElementById('nextRound');
const newGameBtn = document.getElementById('newGame');
const result = document.getElementById('result');
const winnerInfo = document.getElementById('winnerInfo');
const roundInfo = document.getElementById('roundInfo');
const scoreboard = document.getElementById('scoreboard');

setNameBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (name) {
    socket.emit('setName', name);
    setNameBtn.disabled = true;
    nameInput.disabled = true;
  }
};

toggleBtn.onclick = () => {
  if (!running && !submitted) {
    socket.emit('playerReady');
    toggleBtn.disabled = true; // desativa botão até início da rodada
  } else if (running && !submitted) {
    clearInterval(interval);
    running = false;
    submitted = true;
    socket.emit('submitTime', timer);
    toggleBtn.disabled = true;
  }
};

nextRoundBtn.onclick = () => {
  socket.emit('nextRound');
};

newGameBtn.onclick = () => {
  socket.emit('newGame');
  toggleBtn.disabled = false;
};

socket.on('startRound', ({ currentRound }) => {
  timer = 0;
  running = true;
  submitted = false;
  startTime = Date.now();
  interval = setInterval(() => {
    timer = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = timer.toFixed(2);
  }, 10);

  toggleBtn.disabled = false;
  result.textContent = '';
  winnerInfo.textContent = '';
  roundInfo.textContent = `Rodada: ${currentRound} / 5`;
});

socket.on('roundResult', ({ winner, winnerName, time, timeLeft, currentRound, players }) => {
  const isWinner = socket.id === winner;
  result.textContent = isWinner
    ? `Você venceu a rodada com ${time.toFixed(2)}s!`
    : `${winnerName} venceu esta rodada.`;

  winnerInfo.textContent = `Vencedor da rodada: ${winnerName}\nTempo consumido: ${time.toFixed(2)}s`;
  roundInfo.textContent = `Rodada: ${currentRound} / 5`;

  updateScoreboard(players);
});

socket.on('updateScoreboard', (players) => {
  updateScoreboard(players);
});

socket.on('gameOver', ({ players }) => {
  result.textContent = 'Jogo finalizado!';
  winnerInfo.textContent = '';
  roundInfo.textContent = 'Rodadas completas';
  updateScoreboard(players);
});

function updateScoreboard(players) {
  scoreboard.innerHTML = '<h3>Placar:</h3>';
  const list = document.createElement('ul');
  for (const id in players) {
    const item = document.createElement('li');
	if(players[id].name == nameInput.value.trim()){
		item.textContent = `${players[id].name}: ${players[id].victories} vitória(s), Tempo restante: ${players[id].totalTime}s`;
	}else{
		item.textContent = `${players[id].name}: ${players[id].victories} vitória(s)`;
	}
	
	list.appendChild(item);
  }
  scoreboard.appendChild(list);
}
