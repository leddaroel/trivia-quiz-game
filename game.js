class TriviaGame {
    constructor() {
        this.chatBox = document.getElementById('chatBox');
        this.commandInput = document.getElementById('commandInput');
        this.gameState = 'idle'; // idle, playing, answered
        this.score = 0;
        this.currentQuestion = null;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.gameQuestions = [];
        this.currentQuestionIndex = 0;
        this.setupEventListeners();
        this.log('System', 'Welcome to Terminal Trivia! Type /help for available commands.', 'system');
    }

    setupEventListeners() {
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCommand(this.commandInput.value.trim());
                this.commandInput.value = '';
            }
        });
    }

    handleCommand(input) {
        if (!input) return;

        this.log('User', input, 'user');

        const parts = input.split(' ');
        const command = parts[0].toLowerCase();

        switch (command) {
            case '/start':
                this.startGame();
                break;
            case '/end':
                this.endGame();
                break;
            case '/score':
                this.showScore();
                break;
            case '/help':
                this.showHelp();
                break;
            case '/answer':
            case '/a':
                this.answerQuestion(parts.slice(1).join(' '));
                break;
            case '/skip':
                this.skipQuestion();
                break;
            default:
                this.log('Bot', `Unknown command: ${command}. Type /help for available commands.`, 'error');
        }
    }

    async startGame() {
        if (this.gameState === 'playing') {
            this.log('Bot', 'Game already in progress. Type /end to stop.', 'error');
            return;
        }

        this.log('Bot', 'Loading trivia questions...', 'system');
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.currentQuestionIndex = 0;

        try {
            await this.fetchQuestions();
            this.gameState = 'playing';
            this.log('Bot', `🎮 Game Started! You have ${this.gameQuestions.length} questions.`, 'success');
            this.nextQuestion();
        } catch (error) {
            this.log('Bot', `Error starting game: ${error.message}`, 'error');
            this.gameState = 'idle';
        }
    }

    async fetchQuestions() {
        // Using Open Trivia Database API
        const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
        const data = await response.json();

        if (data.results.length === 0) {
            throw new Error('No questions available');
        }

        this.gameQuestions = data.results.map(q => ({
            question: this.decodeHtml(q.question),
            correct: this.decodeHtml(q.correct_answer),
            incorrect: q.incorrect_answers.map(a => this.decodeHtml(a)),
            category: q.category
        }));

        // Shuffle answers for each question
        this.gameQuestions.forEach(q => {
            q.answers = [q.correct, ...q.incorrect].sort(() => Math.random() - 0.5);
        });
    }

    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    nextQuestion() {
        if (this.currentQuestionIndex >= this.gameQuestions.length) {
            this.endGame();
            return;
        }

        this.currentQuestion = this.gameQuestions[this.currentQuestionIndex];
        this.gameState = 'playing';
        this.questionsAnswered++;

        const questionNum = this.currentQuestionIndex + 1;
        const totalQuestions = this.gameQuestions.length;

        this.log('Bot', `[${questionNum}/${totalQuestions}] ${this.currentQuestion.question}`, 'question');

        let optionsText = 'Options:\n';
        this.currentQuestion.answers.forEach((answer, index) => {
            optionsText += `  ${index + 1}. ${answer}\n`;
        });

        this.log('Bot', optionsText.trim(), 'options');
        this.log('Bot', `Type /answer <number> or /a <number> to answer. Type /skip to skip.`, 'system');
    }

    answerQuestion(answer) {
        if (this.gameState !== 'playing' || !this.currentQuestion) {
            this.log('Bot', 'No question active. Type /start to begin.', 'error');
            return;
        }

        const answerIndex = parseInt(answer) - 1;
        if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= this.currentQuestion.answers.length) {
            this.log('Bot', 'Invalid answer. Please enter a number between 1 and ' + this.currentQuestion.answers.length, 'error');
            return;
        }

        const selectedAnswer = this.currentQuestion.answers[answerIndex];
        const isCorrect = selectedAnswer === this.currentQuestion.correct;

        if (isCorrect) {
            this.correctAnswers++;
            this.score += 10;
            this.log('Bot', `✅ Correct! The answer was: ${this.currentQuestion.correct}`, 'success');
        } else {
            this.log('Bot', `❌ Wrong! The correct answer was: ${this.currentQuestion.correct}`, 'error');
        }

        this.currentQuestionIndex++;
        this.gameState = 'answered';

        setTimeout(() => {
            this.nextQuestion();
        }, 2000);
    }

    skipQuestion() {
        if (this.gameState !== 'playing' || !this.currentQuestion) {
            this.log('Bot', 'No question active. Type /start to begin.', 'error');
            return;
        }

        this.log('Bot', `⏭️  Skipped! The correct answer was: ${this.currentQuestion.correct}`, 'system');
        this.currentQuestionIndex++;
        this.gameState = 'answered';

        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    showScore() {
        if (this.questionsAnswered === 0) {
            this.log('Bot', 'No game in progress. Type /start to play.', 'error');
            return;
        }

        const accuracy = this.questionsAnswered > 0 ? Math.round((this.correctAnswers / this.questionsAnswered) * 100) : 0;
        const scoreBoard = `
📊 SCORE BOARD
──────────────────
Total Questions: ${this.questionsAnswered}
Correct Answers: ${this.correctAnswers}
Accuracy: ${accuracy}%
Score: ${this.score}
──────────────────`;

        this.log('Bot', scoreBoard.trim(), 'bot');
    }

    endGame() {
        if (this.gameState === 'idle' && this.questionsAnswered === 0) {
            this.log('Bot', 'No game in progress.', 'error');
            return;
        }

        const accuracy = this.questionsAnswered > 0 ? Math.round((this.correctAnswers / this.questionsAnswered) * 100) : 0;
        const endMessage = `
🏁 GAME OVER
──────────────────
Questions Answered: ${this.questionsAnswered}
Correct Answers: ${this.correctAnswers}
Accuracy: ${accuracy}%
Final Score: ${this.score}
──────────────────
Type /start to play again!`;

        this.log('Bot', endMessage.trim(), 'success');
        this.gameState = 'idle';
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
    }

    showHelp() {
        const help = `
📋 AVAILABLE COMMANDS
──────────────────
/start          - Start a new game
/end            - End current game
/score          - Show current score
/answer <num>   - Answer with option number (1-4)
/a <num>        - Shorthand for /answer
/skip           - Skip current question
/help           - Show this help message
──────────────────`;

        this.log('Bot', help.trim(), 'bot');
    }

    log(sender, message, type = 'bot') {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        this.chatBox.appendChild(messageEl);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TriviaGame();
});
