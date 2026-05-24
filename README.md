# Multiplayer Terminal Trivia Quiz Game

A real-time multiplayer trivia quiz game featuring a terminal-inspired UI. Players can join rooms, answer questions simultaneously, and compete on live leaderboards.

## Features

- 🎮 Real-time multiplayer with WebSocket (Socket.io)
- 🎯 10 random trivia questions per game from Open Trivia Database
- 📊 Live score tracking with real-time leaderboards
- 🚪 Room system with unique codes for easy joining
- 🎨 Terminal-inspired UI with dark theme
- 📱 Responsive design for desktop and mobile
- ⚡ Server-side answer validation and game state management

## Quick Start

### Prerequisites

- Node.js 14+ and npm
- A modern web browser

### Installation & Setup

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/
   - Install the LTS version

2. **Install server dependencies**:
   ```bash
   npm run setup
   # or manually:
   cd server && npm install
   ```

3. **Start the server**:
   ```bash
   npm run start:server
   # or for development with auto-reload:
   npm run dev:server
   ```

4. **Open the game** in your browser:
   - Open http://localhost:3000 in your web browser
   - For local testing, open multiple browser windows/tabs
   - For remote testing, replace `localhost` with your server's IP address

## How to Play

### Creating a Room
1. Enter your player name
2. Click "Create New Game"
3. Share the room code with other players

### Joining a Room
1. Enter your player name
2. Enter the room code
3. Click "Join Game"

### Playing the Game
1. Wait for the host to click "Start Game"
2. Read each question and the available options
3. Enter the option number (1-4) and press Enter
4. See the correct answer and results from all players
5. Watch your score update in real-time
6. Complete all 10 questions
7. View the final leaderboard

## Game Rules

- **30-second timer** per question
- **10 points** per correct answer
- **Auto-advance** to next question when all players answer or timeout occurs
- Host-only game start (prevents random players from starting)
- **Maximum 20 players** per room

## File Structure

```
trivia-quiz-game/
├── index.html          # Main HTML (lobby + game screens)
├── style.css           # Terminal UI styling
├── game.js             # Client-side multiplayer logic (Socket.io)
├── package.json        # Root package scripts
├── server/
│   ├── package.json    # Server dependencies
│   ├── index.js        # Express + Socket.io server
│   └── GameSession.js  # Game room management class
└── README.md           # This file
```

## Architecture

### Frontend
- **HTML**: Responsive screens for lobby, waiting, game, and leaderboard
- **CSS**: Terminal-inspired dark theme with interactive elements
- **JavaScript**: Socket.io client for real-time communication

### Backend
- **Express**: HTTP server for serving frontend and API
- **Socket.io**: Real-time bidirectional communication
- **GameSession**: Manages individual game rooms and player state

## API Events

### Client → Server
- `create-room` - Host creates a new game room
- `join-room` - Player joins an existing room
- `start-game` - Host initiates the game
- `answer-question` - Player submits an answer

### Server → Client
- `players-updated` - Room player list changed
- `host-changed` - Host transferred to another player
- `game-started` - Game begins, first question displayed
- `question` - New question displayed
- `player-answered` - Someone submitted an answer
- `answer-revealed` - Correct answer and results shown
- `game-finished` - Game complete, leaderboard displayed

## Customization

### Change Question Count
In `server/index.js`, modify the API URL in `fetchQuestions()`:
```javascript
// Change 10 to desired number
const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
```

### Adjust Timeout
In `server/index.js`, change `QUESTION_TIMEOUT`:
```javascript
const QUESTION_TIMEOUT = 30000; // milliseconds
```

### Modify Max Players
In `server/index.js`, update the player limit check:
```javascript
if (session.players.size >= 20) {
  // Change 20 to desired max
}
```

### Change Points Per Answer
In `server/GameSession.js`, modify the score in `recordAnswer()`:
```javascript
player.score += 10; // Change 10 to different points
```

## Hosting

### Local Network Testing
1. Find your machine's IP: `ipconfig getifaddr en0` (Mac/Linux)
2. Open `http://YOUR_IP:3000` on other devices

### Public Deployment (Heroku Example)
1. Create a Heroku app: `heroku create your-app-name`
2. Push code: `git push heroku main`
3. Open: `heroku open`

## Troubleshooting

### "Connection refused" error
- Make sure server is running: `npm run start:server`
- Check if port 3000 is available
- For remote connections, ensure firewall allows port 3000

### Players not syncing
- Check browser console for errors (F12)
- Verify Socket.io connection shows in Network tab
- Restart the server

### Questions not loading
- Check internet connection
- Verify Open Trivia API is accessible
- Try refreshing the page

## Known Limitations

- Internet connection required for trivia questions
- Questions are English only
- Maximum 20 players per room (configurable)
- Server must be restarted to clear old rooms

## Future Enhancements

- [ ] Persistent game history/leaderboards
- [ ] Different difficulty levels
- [ ] Category selection
- [ ] Timed rankings (daily/weekly)
- [ ] Player avatars and profiles
- [ ] Chat between players
- [ ] Spectator mode
- [ ] Mobile app versions
- [ ] Database integration for stats

## License

MIT License - feel free to use and modify

## Credits

- Trivia questions: [Open Trivia Database](https://opentdb.com/)
- Terminal theme inspiration: GitHub Dark Mode

