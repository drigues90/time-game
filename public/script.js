/* ==== public/script.js ==== */

const socket = io();

let timer = 0;
let startTime = 0;
let running = false;
let interval = null;
let submitted = false;
let playerName;

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
  playerName = name;
  if (name) {
    socket.emit('setName', name);
    setNameBtn.disabled = true;
    nameInput.disabled = true;
  }
};

toggleBtn.onclick = () => {
  if (!running && !submitted) {
    console.log(playerName, 'esta pronto');
    // Jogador está pronto para iniciar
    socket.emit('playerReady');
    toggleBtn.disabled = true;
  } else if (running) {
    // Jogador para o cronômetro
    clearInterval(interval);
    running = false;
    submitted = false;
    socket.emit('submitTime', timer);
    toggleBtn.textContent = 'Pronto';
    toggleBtn.disabled = true;
  } else if (!running && !submitted) {
    // Jogador estava esperando para iniciar
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

  timerDisplay.textContent = '0.00';
  result.textContent = '';
  winnerInfo.textContent = '';
  roundInfo.textContent = `Rodada: ${currentRound} / 5`;

  toggleBtn.textContent = 'Parar';
  toggleBtn.disabled = false;
});

socket.on('roundResult', ({ winner, winnerName, time, timeLeft, currentRound, players }) => {
  const isWinner = socket.id === winner;
  result.textContent = isWinner
    ? `Você venceu a rodada com ${time.toFixed(2)}s!`
    : `${winnerName} venceu esta rodada.`;

  winnerInfo.textContent = `Vencedor da rodada: ${winnerName}\nTempo consumido: ${time.toFixed(2)}s`;
  roundInfo.textContent = `Rodada: ${currentRound} / 5`;

  updateScoreboard(players);
  toggleBtn.disabled = false;
});

socket.on('updateScoreboard', (players) => {
  updateScoreboard(players);
});

socket.on('gameOver', ({ players, fullResults  }) => {
  result.textContent = 'Jogo finalizado!';
  winnerInfo.textContent = '';
  roundInfo.textContent = 'Rodadas completas';
  updateScoreboard(players);
  showFinalStats(fullResults);
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

function showFinalStats(results) {
  const container = document.createElement('div');
  container.innerHTML = `<h3>Resumo Final:</h3>`;
  for (const id in results) {
    const player = results[id];
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${player.name}</strong><br>
      Rodadas: ${player.rounds.join(', ')}s<br>
      Tempo total gasto: ${player.totalUsed}s<br>
      Tempo restante: ${player.timeLeft}s
      <hr>
    `;
    container.appendChild(div);
  }
  scoreboard.appendChild(container);
}
