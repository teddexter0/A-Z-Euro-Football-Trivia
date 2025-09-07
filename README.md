# A-Z Football Game

A real-time multiplayer web game where players compete to name football players from A-Z, inspired by classic playground games but with modern web technology.

## Game Overview

Players take turns naming football players whose names start with consecutive letters of the alphabet. Think fast - you only have 30 seconds per letter!

## Features

### Core Gameplay
- **Real-time Multiplayer**: 2-6 players per game room
- **Two Game Modes**: 
  - Icons Mode (1990-2014): Legends like Messi, Henry, Zidane
  - Modern Mode (2015+): Current stars like Mbappé, Haaland, Bellingham
- **Smart Spell Checking**: Fuzzy matching handles minor spelling errors
- **No Repeats**: Each player can only be used once per game
- **Timer Pressure**: 30 seconds to think and type

### Scoring System
- **Scrabble-style Points**: Rare letters give more points
  - Common letters (A, E, I, O, U): 1 point
  - Medium letters (D, G, L, N, R, S, T): 2 points
  - Harder letters (B, C, F, H, M, P, V, W, Y): 3 points
  - Rare letters (J, K, Q, X, Z): 5-10 points
- **Bonus Points**: Quick answers get time bonuses

### Technical Features
- **Mobile Responsive**: Works perfectly on phones and tablets
- **Real-time Sync**: Instant updates across all devices
- **Player Database**: 1000+ football players with fuzzy search
- **Room System**: Private games with shareable codes

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Socket.io
- **Database**: JSON-based player database
- **Search**: Fuse.js for fuzzy string matching
- **Deployment**: Vercel-ready

## Quick Start

```bash
# Clone the repository
git clone https://github.com/teddexter0/A-Z-Euro-Football-Trivia
cd az-football-game

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## How to Play

1. **Create or Join Game**: Enter your name and create a new room or join with a code
2. **Choose Mode**: Select Icons (legends) or Modern (current players)
3. **Race Through A-Z**: Name players starting with each letter
4. **Beat the Clock**: 30 seconds per letter - think fast!
5. **Score Points**: Harder letters and quick answers = more points
6. **Win the Game**: Player with most points by letter Z wins!

## Game Modes

### Icons Mode (1990-2014)
Play with football legends from the golden era:
- Zinedine Zidane, Thierry Henry, Ronaldinho
- Francesco Totti, Andrea Pirlo, Steven Gerrard
- And many more legendary players

### Modern Mode (2015+)
Current football superstars:
- Kylian Mbappé, Erling Haaland, Jude Bellingham
- Pedri, Gavi, João Félix
- Today's biggest names in football

## Development

### Project Structure
```
az-football-game/
├── pages/                 # Next.js pages
├── components/            # React components
├── lib/                   # Game logic and utilities
├── data/                  # Player databases
├── styles/                # CSS and styling
└── public/                # Static assets
```

### Key Components
- `GameBoard.js`: Main game interface
- `PlayerInput.js`: Handles player name input with validation
- `ScoreBoard.js`: Real-time score tracking
- `Timer.js`: Visual countdown timer

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Football player data compiled from various public sources
- Inspired by classic playground alphabet games
- Built with modern web technologies for seamless multiplayer experience