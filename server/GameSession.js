class GameSession {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = new Map(); // playerId -> { name, score, answered }
    this.host = null;
    this.gameState = 'lobby'; // lobby, playing, finished
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.questionStartTime = null;
    this.playerAnswers = new Map(); // playerId -> answer
  }

  addPlayer(playerId, playerName) {
    this.players.set(playerId, {
      name: playerName,
      score: 0,
      answered: false
    });
    if (!this.host) {
      this.host = playerId;
    }
    return this.getPlayersList();
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (this.host === playerId) {
      this.host = this.players.keys().next().value || null;
    }
    return this.getPlayersList();
  }

  setQuestions(questions) {
    this.questions = questions;
  }

  startGame() {
    this.gameState = 'playing';
    this.currentQuestionIndex = 0;
    this.playerAnswers.clear();
    this.resetPlayerAnswered();
    return this.getCurrentQuestion();
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.gameState = 'finished';
      return null;
    }
    return {
      ...this.questions[this.currentQuestionIndex],
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.questions.length
    };
  }

  recordAnswer(playerId, answerIndex) {
    if (this.players.has(playerId)) {
      this.playerAnswers.set(playerId, answerIndex);
      const player = this.players.get(playerId);
      player.answered = true;

      const correct = this.questions[this.currentQuestionIndex];
      const correctIndex = correct.answers.indexOf(correct.correct);

      if (answerIndex === correctIndex) {
        player.score += 10;
      }
    }
  }

  allPlayersAnswered() {
    return Array.from(this.players.values()).every(p => p.answered);
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.playerAnswers.clear();
    this.resetPlayerAnswered();
    return this.getCurrentQuestion();
  }

  resetPlayerAnswered() {
    this.players.forEach(player => {
      player.answered = false;
    });
  }

  getPlayersList() {
    return Array.from(this.players.entries()).map(([id, player]) => ({
      id,
      name: player.name,
      score: player.score,
      answered: player.answered
    }));
  }

  getLeaderboard() {
    return Array.from(this.players.entries())
      .map(([id, player]) => ({
        id,
        name: player.name,
        score: player.score
      }))
      .sort((a, b) => b.score - a.score);
  }

  getCorrectAnswer() {
    const question = this.questions[this.currentQuestionIndex];
    return {
      correct: question.correct,
      correctIndex: question.answers.indexOf(question.correct),
      playerAnswers: this.getPlayerAnswers()
    };
  }

  getPlayerAnswers() {
    const answers = {};
    this.playerAnswers.forEach((answerIndex, playerId) => {
      if (this.players.has(playerId)) {
        const question = this.questions[this.currentQuestionIndex];
        answers[playerId] = {
          playerName: this.players.get(playerId).name,
          answerIndex,
          answer: question.answers[answerIndex],
          correct: question.answers[answerIndex] === question.correct
        };
      }
    });
    return answers;
  }

  isEmpty() {
    return this.players.size === 0;
  }
}

module.exports = GameSession;
