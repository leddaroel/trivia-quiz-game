class MultiplayerTrivia {
  constructor() {
    this.socket = io(window.location.hostname + ':3000');
    this.roomCode = null;
    this.playerName = null;
    this.players = [];
    this.currentQuestion = null;
    this.hasAnswered = false;

    this.elements = {
      lobbyScreen: document.getElementById('lobbyScreen'),
      waitingScreen: document.getElementById('waitingScreen'),
      gameScreen: document.getElementById('gameScreen'),
      gameOverScreen: document.getElementById('gameOverScreen'),

      playerNameInput: document.getElementById('playerNameInput'),
      roomCodeInput: document.getElementById('roomCodeInput'),
      createRoomBtn: document.getElementById('createRoomBtn'),
      joinRoomBtn: document.getElementById('joinRoomBtn'),
      lobbyError: document.getElementById('lobbyError'),

      displayRoomCode: document.getElementById('displayRoomCode'),
      playersList: document.getElementById('playersList'),
      playerCount: document.getElementById('playerCount'),
      hostIndicator: document.getElementById('hostIndicator'),
      startGameBtn: document.getElementById('startGameBtn'),
      leaveRoomBtn: document.getElementById('leaveRoomBtn'),
      chatBox: document.getElementById('chatBox'),

      questionProgress: document.getElementById('questionProgress'),
      scoresBoard: document.getElementById('scoresBoard'),
      gameChat: document.getElementById('gameChat'),
      answerInput: document.getElementById('answerInput'),
      questionDisplay: document.getElementById('questionDisplay'),

      leaderboard: document.getElementById('leaderboard'),
      playAgainBtn: document.getElementById('playAgainBtn'),
      exitGameBtn: document.getElementById('exitGameBtn'),
    };

    this.setupEventListeners();
    this.setupSocketListeners();
  }

  setupEventListeners() {
    this.elements.createRoomBtn.addEventListener('click', () => this.createRoom());
    this.elements.joinRoomBtn.addEventListener('click', () => this.joinRoom());
    this.elements.startGameBtn.addEventListener('click', () => this.startGame());
    this.elements.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
    this.elements.answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitAnswer();
    });
    this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
    this.elements.exitGameBtn.addEventListener('click', () => this.exitGame());

    this.elements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.elements.playerNameInput.value) {
        this.elements.createRoomBtn.click();
      }
    });

    this.elements.roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.elements.roomCodeInput.value) {
        this.elements.joinRoomBtn.click();
      }
    });
  }

  setupSocketListeners() {
    this.socket.on('players-updated', (players) => {
      this.players = players;
      this.updatePlayersList();
    });

    this.socket.on('host-changed', (hostId) => {
      this.updateHostIndicator(hostId);
    });

    this.socket.on('game-started', (question) => {
      this.showScreen('gameScreen');
      this.displayQuestion(question);
      this.hasAnswered = false;
      this.elements.answerInput.disabled = false;
      this.elements.answerInput.focus();
    });

    this.socket.on('question', (question) => {
      this.displayQuestion(question);
      this.hasAnswered = false;
      this.elements.answerInput.disabled = false;
      this.elements.answerInput.value = '';
      this.elements.answerInput.focus();
    });

    this.socket.on('player-answered', (playerId) => {
      const player = this.players.find(p => p.id === playerId);
      if (player) {
        player.answered = true;
        this.updatePlayersList();
        this.updateScoresBoard();
      }
    });

    this.socket.on('answer-revealed', (result) => {
      this.revealAnswer(result);
    });

    this.socket.on('game-finished', (leaderboard) => {
      this.showGameOver(leaderboard);
    });

    this.socket.on('disconnect', () => {
      this.elements.lobbyError.textContent = 'Disconnected from server';
    });

    this.socket.on('connect_error', (error) => {
      this.elements.lobbyError.textContent = `Connection error: ${error.message}`;
    });
  }

  createRoom() {
    const name = this.elements.playerNameInput.value.trim();
    if (!name) {
      this.elements.lobbyError.textContent = 'Please enter your name';
      return;
    }

    this.playerName = name;
    this.elements.lobbyError.textContent = '';

    this.socket.emit('create-room', name, (response) => {
      if (response.success) {
        this.roomCode = response.roomCode;
        this.elements.displayRoomCode.textContent = this.roomCode;
        this.showScreen('waitingScreen');
      } else {
        this.elements.lobbyError.textContent = `Error: ${response.error}`;
      }
    });
  }

  joinRoom() {
    const name = this.elements.playerNameInput.value.trim();
    const roomCode = this.elements.roomCodeInput.value.trim();

    if (!name) {
      this.elements.lobbyError.textContent = 'Please enter your name';
      return;
    }

    if (!roomCode) {
      this.elements.lobbyError.textContent = 'Please enter room code';
      return;
    }

    this.playerName = name;
    this.elements.lobbyError.textContent = '';

    this.socket.emit('join-room', roomCode, name, (response) => {
      if (response.success) {
        this.roomCode = roomCode;
        this.elements.displayRoomCode.textContent = roomCode;
        this.showScreen('waitingScreen');
      } else {
        this.elements.lobbyError.textContent = `Error: ${response.error}`;
      }
    });
  }

  startGame() {
    this.socket.emit('start-game', (response) => {
      if (!response.success) {
        this.log('Bot', `Error: ${response.error}`, 'error');
      }
    });
  }

  leaveRoom() {
    this.socket.disconnect();
    this.showScreen('lobbyScreen');
    this.roomCode = null;
    this.playerName = null;
  }

  submitAnswer() {
    if (this.hasAnswered || !this.currentQuestion) return;

    const answerText = this.elements.answerInput.value.trim();
    const answerIndex = parseInt(answerText) - 1;

    if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= this.currentQuestion.answers.length) {
      this.log('Bot', `Invalid answer. Enter 1-${this.currentQuestion.answers.length}`, 'error');
      return;
    }

    this.hasAnswered = true;
    this.elements.answerInput.disabled = true;

    this.socket.emit('answer-question', answerIndex, (response) => {
      if (response.success) {
        this.log('User', `Answer ${answerIndex + 1}: ${this.currentQuestion.answers[answerIndex]}`, 'user');
      } else {
        this.log('Bot', `Error: ${response.error}`, 'error');
        this.hasAnswered = false;
        this.elements.answerInput.disabled = false;
      }
    });
  }

  playAgain() {
    this.leaveRoom();
    this.showScreen('lobbyScreen');
    this.elements.playerNameInput.value = '';
    this.elements.roomCodeInput.value = '';
  }

  exitGame() {
    this.playAgain();
  }

  displayQuestion(question) {
    this.currentQuestion = question;
    this.elements.questionProgress.textContent = `Question ${question.questionNumber}/${question.totalQuestions}`;
    this.elements.questionDisplay.innerHTML = '';

    const questionMsg = document.createElement('div');
    questionMsg.className = 'message question';
    questionMsg.textContent = question.question;
    this.elements.questionDisplay.appendChild(questionMsg);

    const optionsMsg = document.createElement('div');
    optionsMsg.className = 'message options';
    let optionsText = 'Options:\n';
    question.answers.forEach((answer, index) => {
      optionsText += `${index + 1}. ${answer}\n`;
    });
    optionsMsg.textContent = optionsText.trim();
    this.elements.questionDisplay.appendChild(optionsMsg);

    const helpMsg = document.createElement('div');
    helpMsg.className = 'message system';
    helpMsg.textContent = `Enter your answer (1-${question.answers.length})`;
    this.elements.questionDisplay.appendChild(helpMsg);

    this.updateScoresBoard();
  }

  revealAnswer(result) {
    this.elements.answerInput.disabled = true;

    const correctMsg = document.createElement('div');
    correctMsg.className = 'message success';
    correctMsg.textContent = `✅ Correct answer: ${result.correct}`;
    this.elements.questionDisplay.appendChild(correctMsg);

    const resultsMsg = document.createElement('div');
    resultsMsg.className = 'message bot';
    let resultsText = 'Results:\n';
    Object.values(result.playerAnswers).forEach(pa => {
      const status = pa.correct ? '✅' : '❌';
      resultsText += `${status} ${pa.playerName}: ${pa.answer}\n`;
    });
    resultsMsg.textContent = resultsText.trim();
    this.elements.questionDisplay.appendChild(resultsMsg);

    this.updateScoresBoard();
  }

  updatePlayersList() {
    this.elements.playerCount.textContent = this.players.length;
    this.elements.playersList.innerHTML = '';

    const isHost = this.socket.id === this.players.find(p => p.id === this.socket.id)?.id;

    this.players.forEach(player => {
      const playerEl = document.createElement('div');
      playerEl.className = `player-item ${player.id === this.players[0]?.id ? 'host' : ''}`;

      const nameEl = document.createElement('span');
      nameEl.className = 'player-name';
      nameEl.textContent = player.name;

      const scoreEl = document.createElement('span');
      scoreEl.className = 'player-score';
      scoreEl.textContent = player.score;

      playerEl.appendChild(nameEl);
      playerEl.appendChild(scoreEl);
      this.elements.playersList.appendChild(playerEl);
    });
  }

  updateScoresBoard() {
    this.elements.scoresBoard.innerHTML = '';

    const sorted = [...this.players].sort((a, b) => b.score - a.score);

    sorted.forEach((player, index) => {
      const scoreEl = document.createElement('div');
      scoreEl.className = 'score-item';

      const nameEl = document.createElement('span');
      nameEl.className = 'score-name';
      nameEl.textContent = `${index + 1}. ${player.name}`;

      const scoreVal = document.createElement('span');
      scoreVal.className = 'score-value';
      scoreVal.textContent = player.score;

      if (player.answered) {
        const answered = document.createElement('span');
        answered.className = 'score-answered';
        answered.textContent = '✓';
        scoreEl.appendChild(answered);
      }

      scoreEl.appendChild(nameEl);
      scoreEl.appendChild(scoreVal);
      this.elements.scoresBoard.appendChild(scoreEl);
    });
  }

  updateHostIndicator(hostId) {
    if (hostId === this.socket.id) {
      this.elements.startGameBtn.style.display = 'block';
      this.elements.hostIndicator.textContent = 'You are the host';
      this.elements.hostIndicator.classList.remove('hidden');
    } else {
      this.elements.startGameBtn.style.display = 'none';
      this.elements.hostIndicator.classList.add('hidden');
    }
  }

  showGameOver(leaderboard) {
    this.showScreen('gameOverScreen');
    this.elements.leaderboard.innerHTML = '';

    leaderboard.forEach((entry, index) => {
      const entryEl = document.createElement('div');
      entryEl.className = 'leaderboard-entry';

      const rankEl = document.createElement('div');
      rankEl.className = 'leaderboard-rank';
      rankEl.textContent = `#${index + 1}`;

      const infoEl = document.createElement('div');
      infoEl.className = 'leaderboard-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'leaderboard-name';
      nameEl.textContent = entry.name;

      const scoreEl = document.createElement('div');
      scoreEl.className = 'leaderboard-score';
      scoreEl.textContent = `${entry.score} points`;

      infoEl.appendChild(nameEl);
      infoEl.appendChild(scoreEl);
      entryEl.appendChild(rankEl);
      entryEl.appendChild(infoEl);

      this.elements.leaderboard.appendChild(entryEl);
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    this.elements[screenId].classList.add('active');
  }

  log(sender, message, type = 'bot') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    this.elements.chatBox.appendChild(messageEl);
    this.elements.chatBox.scrollTop = this.elements.chatBox.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MultiplayerTrivia();
});
