<<<<<<< HEAD
# trivia-quiz-game
A terminal-inspired web-based trivia quiz game
=======
# Terminal Trivia Quiz Game

A minimalist, terminal-inspired web-based trivia quiz game. Answer general knowledge questions through a chat-like command-line interface.

## Features

- 🎮 Command-line interface with `/start`, `/end`, `/score`, etc.
- 🎯 10 random trivia questions per game from Open Trivia Database
- 📊 Real-time scoring and accuracy tracking
- 🎨 Dark terminal UI with syntax highlighting colors
- 📱 Responsive design for desktop and mobile
- ⚡ No backend required - runs entirely in the browser

## Commands

- `/start` - Begin a new trivia game
- `/end` - End the current game and see final score
- `/score` - View current game statistics
- `/answer <number>` - Answer question with option number (1-4)
- `/a <number>` - Shorthand for `/answer`
- `/skip` - Skip the current question
- `/help` - Display all available commands

## How to Play

1. Type `/start` to begin a new game
2. Read the question and available options
3. Type `/answer 1` (or 2, 3, 4) to submit your answer
4. Get immediate feedback with the correct answer
5. View your final score with `/score` or at game end
6. Type `/start` again to play another round

## Scoring

- **10 points** per correct answer
- Final score = (Correct Answers × 10)
- Accuracy percentage calculated as: (Correct / Total) × 100

## Technology Stack

- **HTML5** - Structure
- **CSS3** - Terminal-style design
- **Vanilla JavaScript** - Game logic
- **Open Trivia Database API** - Question source

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository

```bash
# Initialize git in the project directory
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Terminal Trivia Game"

# Create a new repository on GitHub (https://github.com/new)
# Then push to GitHub (replace username and repo-name)
git remote add origin https://github.com/your-username/trivia-quiz-game.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment", select:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
4. Click **Save**

Your game will be live at: `https://your-username.github.io/trivia-quiz-game/`

### Step 3: Update Repository Settings (Optional)

Add these details to your GitHub repo:
- **Description**: "A terminal-inspired web-based trivia quiz game"
- **Homepage**: `https://your-username.github.io/trivia-quiz-game/`

## Local Testing

Simply open `index.html` in your web browser. No build process or server required.

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Or just open in browser
open index.html
```

## File Structure

```
trivia-quiz-game/
├── index.html      # Main HTML structure
├── style.css       # Terminal UI styling
├── game.js         # Game logic and command handling
└── README.md       # This file
```

## API Information

This game uses the **Open Trivia Database** (free API):
- Endpoint: `https://opentdb.com/api.php`
- No API key required
- Provides 5 random questions per game session
- Questions include: Multiple choice, True/False, various categories

## Customization

### Change Question Count
In `game.js`, modify the API URL in `fetchQuestions()`:
```javascript
// Change 10 to desired number
const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
```

### Add Question Categories
```javascript
// Add category parameter (see Open Trivia DB for category codes)
const response = await fetch('https://opentdb.com/api.php?amount=5&category=9&type=multiple');
```

### Adjust Scoring
In `game.js`, change the points in `answerQuestion()`:
```javascript
this.score += 10;  // Change 10 to different point value
```

## Known Limitations

- Internet connection required for trivia questions
- Questions are English only (default API language)
- No user authentication or persistent game history
- No difficulty selection (random mix of difficulties)

## Future Enhancements

- [ ] Difficulty selection
- [ ] Category selection
- [ ] Leaderboard
- [ ] Local storage for game history
- [ ] Difficulty-based scoring
- [ ] Timed questions
- [ ] Multiplayer mode

## License

This project is open source and available under the MIT License.

## Credits

- Trivia questions provided by [Open Trivia Database](https://opentdb.com/)
- Terminal theme inspired by GitHub's dark mode
>>>>>>> d859a39 (Initial commit: Terminal Trivia Quiz Game)
