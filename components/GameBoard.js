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
  const [connectionStatus, setConnectionStatus] = useState('connecting');
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
  const [isLoading, setIsLoading] = useState(true);
  
  const fuseRef = useRef(null);

  // Initialize socket connection with better error handling
  useEffect(() => {
    const initSocket = async () => {
      try {
        console.log('🔌 Initializing socket connection...');
        setConnectionStatus('connecting');
        
        // Initialize Socket.io server first
        await fetch('/api/socketio');
        
        // Create socket with Vercel-compatible configuration
        const newSocket = io({
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
          upgrade: true,
          timeout: 20000,
          forceNew: true
        });
        
        newSocket.on('connect', () => {
          console.log('✅ Socket connected successfully:', newSocket.id);
          setConnectionStatus('connected');
          setSocket(newSocket);
          
          // Join room after connection
          console.log(`🚪 Joining room ${roomId} as ${playerName}`);
          newSocket.emit('join-room', { roomId, playerName });
        });

        newSocket.on('connection-confirmed', (data) => {
          console.log('✅ Connection confirmed:', data);
          setMessage(`✅ Joined room successfully! Players: ${data.playersCount}`);
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          setConnectionStatus('error');
          setMessage('❌ Connection failed. Please refresh the page.');
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          setConnectionStatus('disconnected');
          setMessage('🔌 Connection lost. Trying to reconnect...');
        });
        
        newSocket.on('game-state-update', (state) => {
          console.log('🎮 Game state updated:', state);
          setGameState(prevState => ({
            ...prevState,
            ...state
          }));
        });

        newSocket.on('game-started', (data) => {
          console.log('🎮 Game started:', data);
          setMessage('🎮 Game started! Good luck!');
          setSubmitted(false);
          setPlayerInput('');
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('timer-update', (data) => {
          setGameState(prevState => ({
            ...prevState,
            timer: data.timer
          }));
        });

        newSocket.on('new-round', (data) => {
          console.log('🔄 New round started:', data);
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
          setMessage(`🎯 Letter ${data.letter} - GO!`);
          setTimeout(() => setMessage(''), 2000);
        });

        newSocket.on('round-complete', (results) => {
          console.log('🏁 Round complete:', results);
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
          console.log('🏆 Game completed:', data);
          setGameState(prev => ({
            ...prev,
            winner: data.winner,
            isActive: false
          }));
        });

        newSocket.on('error-message', (data) => {
          setMessage(`❌ ${data.message}`);
          setTimeout(() => setMessage(''), 5000);
        });

        newSocket.on('player-left', (data) => {
          setMessage(`👋 ${data.playerName} left the game`);
          setTimeout(() => setMessage(''), 3000);
        });

        return () => {
          console.log('🧹 Cleaning up socket connection');
          newSocket.close();
        };
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        setConnectionStatus('error');
        setMessage('❌ Failed to connect. Please refresh the page.');
      }
    };
    
    initSocket();
  }, [roomId, playerName]);

  // Load player database with better error handling
  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        setIsLoading(true);
        console.log(`📊 Loading player data for mode: ${gameMode}`);
        
        const mode = gameMode === 'icons' ? 'legacy' : 'modern';
        const response = await fetch(`/api/players/${mode}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} players for ${mode} mode`);
        
        setPlayerDatabase(data);
        
        // Initialize fuzzy search
        fuseRef.current = new Fuse(data, {
          threshold: 0.4, // More lenient matching
          distance: 100,
          includeScore: true,
          minMatchCharLength: 2
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to load player data:', error);
        setMessage('❌ Failed to load player database');
        setIsLoading(false);
      }
    };

    loadPlayerData();
  }, [gameMode]);

  const handleStartGame = () => {
    console.log('🎮 START BUTTON CLICKED');
    console.log('Socket available:', !!socket);
    console.log('Connection status:', connectionStatus);
    console.log('Room ID:', roomId);
    
    if (!socket || connectionStatus !== 'connected') {
      setMessage('❌ Not connected to server. Please refresh the page.');
      return;
    }
    
    console.log('🚀 Emitting start-game event');
    socket.emit('start-game', { roomId });
    
    // Show immediate feedback
    setMessage('🎮 Starting game...');
  };

  const handleSubmitAnswer = () => {
    if (submitted || !socket) return;
    
    setSubmitted(true);
    
    const validation = validatePlayerName(playerInput, gameState.currentLetter);
    
    console.log('📝 Submitting answer:', {
      answer: playerInput.trim(),
      isValid: validation.valid,
      reason: validation.reason,
      matchedPlayer: validation.matchedPlayer
    });
    
    socket.emit('submit-answer', {
      roomId,
      playerName,
      answer: playerInput.trim(),
      isValid: validation.valid,
      matchedPlayer: validation.matchedPlayer,
      points: validation.valid ? LETTER_SCORES[gameState.currentLetter] : 0
    });
    
    // Show immediate feedback
    if (validation.valid) {
      setMessage(`✅ Submitted: "${playerInput.trim()}"`);
    } else {
      const reason = validation.reason === 'already_used' ? 'already used' : 
                   validation.reason === 'wrong_letter' ? 'wrong starting letter' : 'not found';
      setMessage(`❌ "${playerInput.trim()}" - ${reason}`);
    }
  };

  const validatePlayerName = (input, letter) => {
    if (!input.trim()) return { valid: false, matchedPlayer: null, reason: 'empty' };
    
    const trimmedInput = input.trim();
    
    // Check if already used
    if (gameState.usedPlayers && gameState.usedPlayers.includes(trimmedInput.toLowerCase())) {
      return { valid: false, matchedPlayer: null, reason: 'already_used' };
    }
    
    // Check starting letter
    if (!trimmedInput.toLowerCase().startsWith(letter.toLowerCase())) {
      return { valid: false, matchedPlayer: null, reason: 'wrong_letter' };
    }
    
    // Use fuzzy search
    if (fuseRef.current) {
      const results = fuseRef.current.search(trimmedInput);
      
      if (results.length > 0 && results[0].score < 0.4) {
        const matchedPlayer = results[0].item;
        
        // Double-check if matched player was already used
        if (gameState.usedPlayers && gameState.usedPlayers.includes(matchedPlayer.toLowerCase())) {
          return { valid: false, matchedPlayer: null, reason: 'already_used' };
        }
        
        return { valid: true, matchedPlayer };
      }
    }
    
    return { valid: false, matchedPlayer: null, reason: 'not_found' };
  };

  const handleInputChange = (e) => {
    if (!submitted) {
      setPlayerInput(e.target.value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !submitted && gameState.isActive && playerInput.trim()) {
      handleSubmitAnswer();
    }
  };

  const copyGameLink = () => {
    const gameUrl = window.location.href;
    navigator.clipboard.writeText(gameUrl).then(() => {
      setMessage('📋 Game link copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    }).catch(() => {
      setMessage('❌ Failed to copy link');
      setTimeout(() => setMessage(''), 3000);
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="game-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>🎮 Loading Game</h2>
          <p>Preparing your football adventure...</p>
          <div className="loading-details">
            <p>• Loading player database</p>
            <p>• Connecting to game server</p>
            <p>• Setting up {gameMode === 'icons' ? 'Icons' : 'Modern'} mode</p>
          </div>
        </div>
      </div>
    );
  }

  // Show connection error
  if (connectionStatus === 'error') {
    return (
      <div className="game-board">
        <div className="error-state">
          <h2>🚫 Connection Error</h2>
          <p>Unable to connect to the game server.</p>
          <div className="error-details">
            <p>This might be because:</p>
            <ul>
              <li>The server is temporarily down</li>
              <li>Your internet connection is unstable</li>
              <li>Firewall is blocking the connection</li>
            </ul>
          </div>
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Game complete screen
  if (gameState.winner) {
    return (
      <div className="game-board">
        <div className="game-complete">
          <h1>🎉 Game Complete! 🎉</h1>
          <div className="winner-announcement">
            <h2>🏆 Winner: {gameState.winner}</h2>
            <div className="confetti">🎊 🎈 🎊 🎈 🎊</div>
          </div>
          
          <div className="final-scores">
            <h3>📊 Final Scores</h3>
            <div className="scores-list">
              {Object.entries(gameState.scores)
                .sort(([,a], [,b]) => b - a)
                .map(([player, score], index) => (
                  <div key={player} className={`score-item ${player === gameState.winner ? 'winner' : ''} position-${index + 1}`}>
                    <span className="position">#{index + 1}</span>
                    <span className="player-name">{player}</span>
                    <span className="score">{score} pts</span>
                    {index === 0 && <span className="trophy">🥇</span>}
                    {index === 1 && <span className="trophy">🥈</span>}
                    {index === 2 && <span className="trophy">🥉</span>}
                  </div>
                ))}
            </div>
          </div>
          
          <div className="game-stats-final">
            <h4>🎯 Game Statistics</h4>
            <div className="stats-final">
              <div className="stat">
                <span>Total Players:</span>
                <span>{Object.keys(gameState.players).length}</span>
              </div>
              <div className="stat">
                <span>Letters Completed:</span>
                <span>26/26 (100%)</span>
              </div>
              <div className="stat">
                <span>Players Used:</span>
                <span>{gameState.usedPlayers?.length || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="final-actions">
            <button onClick={() => window.location.reload()} className="play-again-btn">
              🎮 Play Again
            </button>
            <button onClick={() => window.location.href = '/'} className="home-btn">
              🏠 Home
            </button>
            <button onClick={copyGameLink} className="share-final-btn">
              📱 Share Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getPlayersList = () => {
    return Object.entries(gameState.players).map(([name, data]) => (
      <div key={name} className={`player-card ${name === playerName ? 'current-player' : ''}`}>
        <div className="player-header">
          <div className="player-name">{name}</div>
          {name === playerName && <span className="you-badge">YOU</span>}
        </div>
        <div className="player-score">{gameState.scores[name] || 0} points</div>
        <div className="player-status">
          {gameState.roundAnswers[name] ? 
            `✅ ${gameState.roundAnswers[name].answer}` : 
            (gameState.isActive ? '⏳ Thinking...' : '⏸️ Ready')
          }
        </div>
      </div>
    ));
  };

  // Main game interface
  const showStartButton = Object.keys(gameState.players).length >= 1 && !gameState.isActive && !gameState.winner;
  const playerCount = Object.keys(gameState.players).length;

  return (
    <div className="game-board">
      {/* Game Header */}
      <div className="game-header">
        <h1>⚽ A-Z Football Game</h1>
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Mode:</span>
            <span className="info-value">
              {gameMode === 'icons' || gameMode === 'legacy' ? '🏆 Icons (1990-2014)' : '⚡ Modern (2015+)'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Room:</span>
            <span className="info-value">{roomId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected' ? '🟢 Connected' : 
               connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="game-content">
        {/* Letter Section */}
        <div className="letter-section">
          <div className="current-letter">
            <h2>Letter: {gameState.currentLetter}</h2>
            <div className="letter-info">
              <span>Round {gameState.currentLetterIndex + 1} of 26</span>
              <span>Worth {LETTER_SCORES[gameState.currentLetter]} points</span>
            </div>
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
              <div className={`timer-circle ${gameState.timer <= 10 ? 'urgent' : ''}`}>
                <span className="timer-text">{gameState.timer}s</span>
              </div>
              <div className="timer-bar">
                <div 
                  className={`timer-fill ${gameState.timer <= 10 ? 'urgent' : ''}`}
                  style={{ width: `${(gameState.timer / 30) * 100}%` }}
                ></div>
              </div>
              <div className="timer-label">Time Remaining</div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="input-section">
          {showStartButton && (
            <div className="start-section">
              <div className="ready-players">
                <h3>🎮 Ready to Play!</h3>
                <p>{playerCount} player{playerCount !== 1 ? 's' : ''} in room</p>
              </div>
              <button 
                onClick={handleStartGame}
                className="start-game-btn"
                disabled={connectionStatus !== 'connected'}
              >
                {connectionStatus === 'connected' ? 
                  `🚀 Start Game (${playerCount} players)` : 
                  '🔌 Connecting...'}
              </button>
            </div>
          )}
          
          {gameState.isActive && (
            <div className="input-container">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={playerInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={`Enter a ${gameMode === 'icons' ? 'legendary' : 'modern'} player starting with ${gameState.currentLetter}...`}
                  disabled={submitted}
                  className={`player-input ${submitted ? 'submitted' : ''}`}
                  autoFocus
                  autoComplete="off"
                />
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={submitted || !playerInput.trim()}
                  className="submit-btn"
                >
                  {submitted ? '✅ Submitted' : '📝 Submit'}
                </button>
              </div>
              
              <div className="input-hints">
                <div className="hint">
                  💡 Tip: {gameMode === 'icons' ? 'Think of legends like Messi, Ronaldinho, Henry...' : 'Think of current stars like Mbappé, Haaland, Bellingham...'}
                </div>
                <div className="scoring-info">
                  🎯 Letter {gameState.currentLetter} = {LETTER_SCORES[gameState.currentLetter]} points
                </div>
              </div>
            </div>
          )}
          
          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Players Section */}
        <div className="players-section">
          <h3>👥 Players ({playerCount})</h3>
          <div className="players-grid">
            {getPlayersList()}
          </div>
        </div>

        {/* Round Results */}
        {Object.keys(gameState.roundAnswers).length > 0 && !gameState.isActive && (
          <div className="round-results">
            <h3>🏁 Round Results - Letter {gameState.currentLetter}</h3>
            <div className="results-grid">
              {Object.entries(gameState.roundAnswers).map(([player, result]) => (
                <div key={player} className={`result-card ${result.isValid ? 'valid' : 'invalid'}`}>
                  <div className="result-player">{player}</div>
                  <div className="result-answer">{result.answer || 'No answer'}</div>
                  <div className="result-points">
                    {result.isValid ? `+${result.points} pts` : '0 pts'}
                  </div>
                  {result.isValid && <div className="result-icon">🎉</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Statistics */}
        <div className="game-stats">
          <h4>📊 Game Progress</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <span className="stat-value">{playerCount}</span>
                <span className="stat-label">Players</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <span className="stat-value">{gameState.currentLetterIndex + 1}/26</span>
                <span className="stat-label">Letters</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⚽</div>
              <div className="stat-info">
                <span className="stat-value">{gameState.usedPlayers?.length || 0}</span>
                <span className="stat-label">Players Used</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <span className="stat-value">{Math.round(((gameState.currentLetterIndex + 1) / 26) * 100)}%</span>
                <span className="stat-label">Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Used Players */}
        {gameState.usedPlayers && gameState.usedPlayers.length > 0 && (
          <div className="used-players">
            <h4>⚽ Used Players ({gameState.usedPlayers.length})</h4>
            <div className="used-players-list">
              {gameState.usedPlayers.slice(-15).map((player, index) => (
                <span key={index} className="used-player-tag">
                  {player}
                </span>
              ))}
              {gameState.usedPlayers.length > 15 && (
                <span className="used-player-tag more">
                  +{gameState.usedPlayers.length - 15} more...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        <div className="control-buttons">
          <button onClick={copyGameLink} className="share-btn">
            🔗 Share Game
          </button>
          <button onClick={() => window.location.reload()} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={() => window.location.href = '/'} className="home-btn">
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;