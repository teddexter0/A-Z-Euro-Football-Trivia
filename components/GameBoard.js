import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Fuse from 'fuse.js';

// Scrabble-style letter scoring
const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const GameBoard = ({ roomId, playerName, gameMode = 'modern' }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    currentLetter: 'A',
    currentLetterIndex: 0,
    players: {},
    scores: {},
    usedPlayers: [],
    roundAnswers: {},
    timer: 30,
    isActive: false,
    gameMode: gameMode,
    winner: null
  });
  
  const [playerInput, setPlayerInput] = useState('');
  const [playerDatabase, setPlayerDatabase] = useState([]);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const timerRef = useRef(null);
  const fuseRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      await fetch('/api/socketio');
      const newSocket = io();
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.emit('join-room', { roomId, playerName });
      
      newSocket.on('game-state-update', (state) => {
        console.log('Game state updated:', state);
        setGameState(prevState => ({
          ...prevState,
          ...state
        }));
      });

      newSocket.on('timer-update', (data) => {
        console.log('Timer update received:', data.timer);
        setGameState(prevState => ({
          ...prevState,
          timer: data.timer
        }));
      });

      newSocket.on('new-round', (data) => {
        console.log('New round started:', data);
        setGameState(prev => ({
          ...prev,
          currentLetter: data.letter,
          currentLetterIndex: data.letterIndex,
          roundAnswers: {},
          timer: 30,
          isActive: true
        }));
        setSubmitted(false);
        setPlayerInput('');
        setMessage('');
      });

      newSocket.on('player-answered', (data) => {
        console.log(`${data.playerName} submitted an answer`);
      });

      newSocket.on('round-complete', (results) => {
        console.log('Round complete:', results);
        setGameState(prev => ({
          ...prev,
          scores: results.scores,
          usedPlayers: results.usedPlayers || [],
          roundAnswers: results.answers,
          isActive: false
        }));
        
        const playerResults = results.answers[playerName];
        if (playerResults && playerResults.isValid) {
          setMessage(`✅ "${playerResults.answer}" is correct! +${playerResults.points} points`);
        } else if (playerResults && playerResults.answer) {
          setMessage(`❌ "${playerResults.answer}" was not found or already used`);
        } else {
          setMessage('⏰ Time\'s up! No answer submitted');
        }
      });

      newSocket.on('game-complete', (data) => {
        setGameState(prev => ({
          ...prev,
          winner: data.winner,
          isActive: false
        }));
      });

      newSocket.on('player-left', (data) => {
        setMessage(`🚪 Player ${data.playerName} left the game`);
      });

      newSocket.on('game-ended', (data) => {
        setMessage(`🛑 Game ended: ${data.reason}`);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      });

      return () => newSocket.close();
    };
    
    initSocket();
  }, [roomId, playerName]);

  // Load player database based on game mode
  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        const mode = gameMode === 'icons' ? 'legacy' : gameMode;
        const response = await fetch(`/api/players/${mode}`);
        const data = await response.json();
        
        setPlayerDatabase(data);
        
        fuseRef.current = new Fuse(data, {
          threshold: 0.3,
          distance: 100,
          includeScore: true
        });
      } catch (error) {
        console.error('Failed to load player data:', error);
      }
    };

    loadPlayerData();
  }, [gameMode]);

  const handleStartGame = () => {
    console.log('=== START BUTTON CLICKED ===');
    console.log('Socket available:', !!socket);
    console.log('Room ID:', roomId);
    
    if (socket) {
      console.log('Emitting start-game event');
      socket.emit('start-game', { roomId });
      
      // Optimistically update UI
      setGameState(prev => ({
        ...prev,
        isActive: true,
        timer: 30,
        roundAnswers: {}
      }));
    } else {
      console.log('ERROR: Socket not available');
      setMessage('Connection error - please refresh the page');
    }
  };

  const handleSubmitAnswer = () => {
    if (submitted) return;
    
    setSubmitted(true);
    
    const isValidAnswer = validatePlayerName(playerInput, gameState.currentLetter);
    
    if (socket) {
      socket.emit('submit-answer', {
        roomId,
        playerName,
        answer: playerInput.trim(),
        isValid: isValidAnswer.valid,
        matchedPlayer: isValidAnswer.matchedPlayer,
        points: isValidAnswer.valid ? LETTER_SCORES[gameState.currentLetter] : 0
      });
    }
  };

  const validatePlayerName = (input, letter) => {
    if (!input.trim()) return { valid: false, matchedPlayer: null };
    
    const trimmedInput = input.trim();
    
    if (gameState.usedPlayers && gameState.usedPlayers.includes(trimmedInput.toLowerCase())) {
      return { valid: false, matchedPlayer: null, reason: 'already_used' };
    }
    
    if (!trimmedInput.toLowerCase().startsWith(letter.toLowerCase())) {
      return { valid: false, matchedPlayer: null, reason: 'wrong_letter' };
    }
    
    const results = fuseRef.current ? fuseRef.current.search(trimmedInput) : [];
    
    if (results.length > 0 && results[0].score < 0.3) {
      const matchedPlayer = results[0].item;
      
      if (gameState.usedPlayers && gameState.usedPlayers.includes(matchedPlayer.toLowerCase())) {
        return { valid: false, matchedPlayer: null, reason: 'already_used' };
      }
      
      return { valid: true, matchedPlayer };
    }
    
    return { valid: false, matchedPlayer: null, reason: 'not_found' };
  };

  const handleInputChange = (e) => {
    if (!submitted) {
      setPlayerInput(e.target.value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !submitted && gameState.isActive) {
      handleSubmitAnswer();
    }
  };

  const getPlayersList = () => {
    return Object.entries(gameState.players).map(([name, data]) => (
      <div key={name} className={`player-card ${name === playerName ? 'current-player' : ''}`}>
        <div className="player-name">{name}</div>
        <div className="player-score">{gameState.scores[name] || 0} points</div>
        <div className="player-status">
          {gameState.roundAnswers[name] ? 
            `✅ ${gameState.roundAnswers[name].answer}` : 
            (gameState.isActive ? '⏳ Thinking...' : '⏸️ Waiting')
          }
        </div>
      </div>
    ));
  };

  if (gameState.winner) {
    return (
      <div className="game-complete">
        <h1>🎉 Game Complete! 🎉</h1>
        <h2>Winner: {gameState.winner}</h2>
        <div className="final-scores">
          <h3>Final Scores:</h3>
          {Object.entries(gameState.scores)
            .sort(([,a], [,b]) => b - a)
            .map(([player, score]) => (
              <div key={player} className={`score-item ${player === gameState.winner ? 'winner' : ''}`}>
                {player}: {score} points
              </div>
            ))}
        </div>
        <button onClick={() => window.location.reload()} className="play-again-btn">
          Play Again
        </button>
      </div>
    );
  }

  const showStartButton = Object.keys(gameState.players).length >= 2 && !gameState.isActive && !gameState.winner;

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>A-Z Football Game</h1>
        <div className="game-info">
          <span className="game-mode">
            Mode: {gameMode === 'icons' || gameMode === 'legacy' ? '🏆 Icons (1990-2014)' : '⚡ Modern (2015+)'}
          </span>
          <span className="room-id">Room: {roomId}</span>
        </div>
      </div>

      <div className="game-content">
        <div className="letter-section">
          <div className="current-letter">
            <h2>Letter: {gameState.currentLetter}</h2>
            <div className="letter-progress">
              {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter, index) => (
                <span 
                  key={letter} 
                  className={`letter ${index < gameState.currentLetterIndex ? 'completed' : ''} ${index === gameState.currentLetterIndex ? 'current' : ''}`}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
          
          {gameState.isActive && (
            <div className="timer">
              <div className="timer-circle">
                <span className="timer-text">{gameState.timer}s</span>
              </div>
              <div className="timer-bar">
                <div 
                  className="timer-fill" 
                  style={{ width: `${(gameState.timer / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="input-section">
          {showStartButton && (
            <button 
              onClick={handleStartGame}
              className="start-game-btn"
              style={{ 
                padding: '15px 30px', 
                background: '#10b981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px',
                marginBottom: '20px',
                width: '100%',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🚀 Start Game
            </button>
          )}
          
          <div className="input-container">
            <input
              type="text"
              value={playerInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Enter a football player starting with ${gameState.currentLetter}...`}
              disabled={!gameState.isActive || submitted}
              className={`player-input ${submitted ? 'submitted' : ''}`}
              autoFocus
            />
            <button 
              onClick={handleSubmitAnswer}
              disabled={!gameState.isActive || submitted || !playerInput.trim()}
              className="submit-btn"
            >
              {submitted ? '✅ Submitted' : 'Submit'}
            </button>
          </div>
          
          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <div className="scoring-info">
            <span>Letter {gameState.currentLetter} = {LETTER_SCORES[gameState.currentLetter]} points</span>
          </div>
        </div>

        <div className="players-section">
          <h3>Players ({Object.keys(gameState.players).length})</h3>
          <div className="players-grid">
            {getPlayersList()}
          </div>
        </div>

        {Object.keys(gameState.roundAnswers).length > 0 && !gameState.isActive && (
          <div className="round-results">
            <h3>Round Results - Letter {gameState.currentLetter}</h3>
            <div className="results-grid">
              {Object.entries(gameState.roundAnswers).map(([player, result]) => (
                <div key={player} className={`result-card ${result.isValid ? 'valid' : 'invalid'}`}>
                  <div className="result-player">{player}</div>
                  <div className="result-answer">{result.answer || 'No answer'}</div>
                  <div className="result-points">
                    {result.isValid ? `+${result.points} pts` : '0 pts'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState.usedPlayers && gameState.usedPlayers.length > 0 && (
          <div className="used-players">
            <h4>Used Players ({gameState.usedPlayers.length})</h4>
            <div className="used-players-list">
              {gameState.usedPlayers.map((player, index) => (
                <span key={index} className="used-player-tag">
                  {player}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="game-controls">
        <button 
          onClick={() => window.location.href = '/'}
          className="leave-game-btn"
        >
          Leave Game
        </button>
      </div>
    </div>
  );
};

export default GameBoard;