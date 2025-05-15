/* ==== public/script.js ==== */

const socket = io();
let playerTotalTime = 10; // declare no topo

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

socket.on('startRound', ({ currentRound, totalTime  }) => {
  playerTotalTime = totalTime;
  timer = 0;
  running = true;
  submitted = false;
  startTime = Date.now();
  interval = setInterval(() => {
    timer = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = timer.toFixed(2);

    if ((playerTotalTime - timer) <= 0) {
      clearInterval(interval);
      running = false;
      timer = playerTotalTime; // limita o tempo
      timerDisplay.textContent = timer.toFixed(2);
      if (!submitted) {
        submitted = true;
        socket.emit('submitTime', timer);
      }
    }
  }, 
  10);

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

socket.on('gameOver', ({ players , roundHistory  }) => {
  result.textContent = 'Jogo finalizado!';
  winnerInfo.textContent = '';
  roundInfo.textContent = 'Rodadas completas';
  updateScoreboard(players);
  showFinalResults(roundHistory);
});

socket.on('gameReset', () => {
  document.getElementById('finalResults').style.display = 'none';
  result.textContent = '';
  winnerInfo.textContent = '';
  roundInfo.textContent = 'Rodada: 1 / 5';
  timerDisplay.textContent = '0.00';
  submitted = false;
  running = false;
  timer = 0;
  startTime = 0;
  toggleBtn.disabled = false;
  newGameBtn.disabled = false;
});

function updateScoreboard(players) {
  scoreboard.innerHTML = '<h3>Placar:</h3>';
  const list = document.createElement('ul');
  for (const id in players) {
    const item = document.createElement('li');
	if(players[id].name == nameInput.value.trim()){
		item.textContent = `${players[id].name}:` + `🏆`.repeat(players[id].victories) + 
    `Tempo restante: ${players[id].totalTime}s`;
	}else{
		item.textContent = `${players[id].name}:` + `🏆`.repeat(players[id].victories);
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

function showFinalResults(roundHistory) {
  const container = document.getElementById('history');
  const finalResults = document.getElementById('finalResults');
  finalResults.style.display = 'block';
  container.innerHTML = '';

  roundHistory.forEach(({ round, results }) => {
    const section = document.createElement('section');
    section.classList.add('round-summary');
    const title = document.createElement('h3');
    title.textContent = `Rodada ${round}`;
    section.appendChild(title);

    const list = document.createElement('ul');
    results.forEach(({ name, time, winner }) => {
      const li = document.createElement('li');
      li.textContent = `${name} - ${time}s`;
      if (winner) li.classList.add('winner');
      list.appendChild(li);
    });

    section.appendChild(list);
    container.appendChild(section);
  });

  // const audio = document.getElementById('victorySound');
  // if (audio) audio.play();
}

