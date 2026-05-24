const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameSession = require('./GameSession');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '..')));

const rooms = new Map();
const userToRoom = new Map();
const QUESTION_TIMEOUT = 30000;

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function fetchQuestions() {
  try {
    const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No questions available');
    }

    return data.results.map(q => {
      const decodedQuestion = decodeHtml(q.question);
      const correct = decodeHtml(q.correct_answer);
      const incorrect = q.incorrect_answers.map(a => decodeHtml(a));
      const answers = [correct, ...incorrect].sort(() => Math.random() - 0.5);

      return {
        question: decodedQuestion,
        answers,
        correct,
        category: q.category
      };
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}

function decodeHtml(html) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'"
  };
  return html.replace(/&[^;]+;/g, match => entities[match] || match);
}

io.on('connection', (socket) => {
  socket.on('create-room', async (playerName, callback) => {
    try {
      const roomCode = generateRoomCode();
      const questions = await fetchQuestions();
      const session = new GameSession(roomCode);

      rooms.set(roomCode, session);
      userToRoom.set(socket.id, roomCode);

      socket.join(roomCode);
      const players = session.addPlayer(socket.id, playerName);

      io.to(roomCode).emit('players-updated', players);
      io.to(roomCode).emit('host-changed', session.host);

      callback({ success: true, roomCode });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('join-room', (roomCode, playerName, callback) => {
    if (!rooms.has(roomCode)) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const session = rooms.get(roomCode);

    if (session.gameState !== 'lobby') {
      callback({ success: false, error: 'Game already in progress' });
      return;
    }

    if (session.players.size >= 20) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    userToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    const players = session.addPlayer(socket.id, playerName);

    io.to(roomCode).emit('players-updated', players);
    callback({ success: true, roomCode });
  });

  socket.on('start-game', async (callback) => {
    const roomCode = userToRoom.get(socket.id);
    if (!roomCode || !rooms.has(roomCode)) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const session = rooms.get(roomCode);

    if (session.host !== socket.id) {
      callback({ success: false, error: 'Only host can start game' });
      return;
    }

    try {
      const questions = await fetchQuestions();
      session.setQuestions(questions);

      const question = session.startGame();
      io.to(roomCode).emit('game-started', question);

      scheduleQuestionTimeout(roomCode);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('answer-question', (answerIndex, callback) => {
    const roomCode = userToRoom.get(socket.id);
    if (!roomCode || !rooms.has(roomCode)) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const session = rooms.get(roomCode);
    if (session.gameState !== 'playing') {
      callback({ success: false, error: 'No active question' });
      return;
    }

    session.recordAnswer(socket.id, answerIndex);
    io.to(roomCode).emit('player-answered', socket.id);

    if (session.allPlayersAnswered()) {
      clearQuestionTimeout(roomCode);
      revealAnswer(roomCode);
    }

    callback({ success: true });
  });

  socket.on('disconnect', () => {
    const roomCode = userToRoom.get(socket.id);
    if (roomCode && rooms.has(roomCode)) {
      const session = rooms.get(roomCode);
      session.removePlayer(socket.id);

      io.to(roomCode).emit('players-updated', session.getPlayersList());
      io.to(roomCode).emit('host-changed', session.host);

      if (session.isEmpty()) {
        rooms.delete(roomCode);
      }
    }
    userToRoom.delete(socket.id);
  });
});

const questionTimeouts = new Map();

function scheduleQuestionTimeout(roomCode) {
  clearQuestionTimeout(roomCode);

  const timeout = setTimeout(() => {
    if (rooms.has(roomCode)) {
      revealAnswer(roomCode);
    }
  }, QUESTION_TIMEOUT);

  questionTimeouts.set(roomCode, timeout);
}

function clearQuestionTimeout(roomCode) {
  if (questionTimeouts.has(roomCode)) {
    clearTimeout(questionTimeouts.get(roomCode));
    questionTimeouts.delete(roomCode);
  }
}

function revealAnswer(roomCode) {
  if (!rooms.has(roomCode)) return;

  const session = rooms.get(roomCode);
  const result = session.getCorrectAnswer();

  io.to(roomCode).emit('answer-revealed', result);

  setTimeout(() => {
    const nextQuestion = session.nextQuestion();

    if (nextQuestion) {
      io.to(roomCode).emit('question', nextQuestion);
      scheduleQuestionTimeout(roomCode);
    } else {
      const leaderboard = session.getLeaderboard();
      io.to(roomCode).emit('game-finished', leaderboard);
      clearQuestionTimeout(roomCode);
    }
  }, 3000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Multiplayer Trivia Server running on http://localhost:${PORT}`);
});
