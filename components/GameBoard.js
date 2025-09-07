import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Fuse from 'fuse.js';

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
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fuseRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        console.log('🔌 Connecting to Socket.io...');
        setConnectionStatus('connecting');
        setMessage('🔌 Connecting to server...');
        
        // Initialize Socket.io endpoint
        await fetch('/api/socketio');
        
        // Create socket
        const newSocket = io({
          path: '/api/socketio',
          transports: ['polling', 'websocket'],
          timeout: 20000,
          forceNew: true,
          autoConnect: true
        });
        
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('✅ Connected:', newSocket.id);
          setConnectionStatus('connected');
          setSocket(newSocket);
          setMessage('✅ Connected! Joining room...');
          
          // Join room
          newSocket.emit('join-room', { roomId, playerName });
        });

        newSocket.on('connection-confirmed', () => {
          console.log('✅ Connection confirmed');
          setMessage('🎯 Ready to play!');
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('join-confirmed', (data) => {
          console.log('✅ Joined room:', data);
          setMessage(`🏠 Joined room! Players: ${data.playersCount}`);
          setTimeout(() => setMessage(''), 3000);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          setConnectionStatus('error');
          setMessage('❌ Connection failed. Try refreshing.');
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected:', reason);
          setConnectionStatus('disconnected');
          setMessage('🔌 Disconnected. Reconnecting...');
        });
        
        newSocket.on('game-state-update', (state) => {
          console.log('🎮 Game state:', state);
          setGameState(prevState => ({ ...prevState, ...state }));
        });

        newSocket.on('game-started', () => {
          console.log('🎮 Game started!');
          setMessage('🎮 Game started! GO!');
          setSubmitted(false);
          setPlayerInput('');
          setTimeout(() => setMessage(''), 2000);
        });

        newSocket.on('timer-update', (data) => {
          setGameState(prev => ({ ...prev, timer: data.timer }));
        });

        newSocket.on('new-round', (data) => {
          console.log('🔄 New round:', data.letter);
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
          setMessage(`🎯 Letter ${data.letter}!`);
          setTimeout(() => setMessage(''), 2000);
        });

        newSocket.on('round-complete', (results) => {
          console.log('🏁 Round complete');
          setGameState(prev => ({
            ...prev,
            scores: results.scores,
            usedPlayers: results.usedPlayers || [],
            roundAnswers: results.answers,
            isActive: false
          }));
          
          const playerResults = results.answers[playerName];
          if (playerResults?.isValid) {
            setMessage(`✅ "${playerResults.answer}" correct! +${playerResults.points} pts`);
          } else if (playerResults?.answer) {
            setMessage(`❌ "${playerResults.answer}" - invalid`);
          } else {
            setMessage('⏰ Time up!');
          }
        });

        newSocket.on('game-complete', (data) => {
          console.log('🏆 Game complete:', data.winner);
          setGameState(prev => ({ ...prev, winner: data.winner, isActive: false }));
        });

        newSocket.on('error-message', (data) => {
          setMessage(`❌ ${data.message}`);
          setTimeout(() => setMessage(''), 5000);
        });

        newSocket.on('player-left', (data) => {
          setMessage(`👋 ${data.playerName} left`);
          setTimeout(() => setMessage(''), 3000);
        });

      } catch (error) {
        console.error('❌ Socket init failed:', error);
        setConnectionStatus('error');
        setMessage('❌ Failed to connect');
      }
    };
    
    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId, playerName]);

  // Load player database
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setIsLoading(true);
        console.log(`📊 Loading ${gameMode} players...`);
        
        const mode = gameMode === 'icons' ? 'legacy' : 'modern';
        const response = await fetch(`/api/players/${mode}`);
        
        if (!response.ok) {
          throw new Error(`Failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} players`);
        
        fuseRef.current = new Fuse(data, {
          threshold: 0.3,
          distance: 100,
          includeScore: true
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to load players:', error);
        setMessage('❌ Failed to load players');
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, [gameMode]);

  const handleStartGame = () => {
    if (!socket || connectionStatus !== 'connected') {
      setMessage('❌ Not connected!');
      return;
    }
    
    console.log('🚀 Starting game...');
    socket.emit('start-game', { roomId });
    setMessage('🎮 Starting...');
  };

  const handleSubmitAnswer = () => {
    if (submitted || !socket || !gameState.isActive) return;
    
    const answer = playerInput.trim();
    if (!answer) return;
    
    setSubmitted(true);
    const validation = validatePlayer(answer, gameState.currentLetter);
    
    socket.emit('submit-answer', {
      roomId,
      playerName,
      answer,
      isValid: validation.valid,
      matchedPlayer: validation.matchedPlayer,
      points: validation.valid ? LETTER_SCORES[gameState.currentLetter] : 0
    });
    
    setMessage(validation.valid ? `✅ "${answer}"` : `❌ "${answer}" - invalid`);
  };

  const validatePlayer = (input, letter) => {
    if (!input.toLowerCase().startsWith(letter.toLowerCase())) {
      return { valid: false, reason: 'wrong_letter' };
    }
    
    if (gameState.usedPlayers?.includes(input.toLowerCase())) {
      return { valid: false, reason: 'used' };
    }
    
    if (fuseRef.current) {
      const results = fuseRef.current.search(input);
      if (results.length > 0 && results[0].score < 0.3) {
        return { valid: true, matchedPlayer: results[0].item };
      }
    }
    
    return { valid: false, reason: 'not_found' };
  };

  // Loading screen
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            width: '50px', height: '50px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>🎮 Loading Game...</h2>
          <p>Loading {gameMode} players...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (connectionStatus === 'error') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h2>🚫 Connection Error</h2>
          <p>Cannot connect to game server</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '15px 30px', borderRadius: '10px', 
              fontSize: '1.1rem', cursor: 'pointer', marginTop: '20px'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Game complete
  if (gameState.winner) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>🎉 Game Complete!</h1>
          <h2 style={{ color: '#667eea', margin: '0 0 30px 0' }}>🏆 Winner: {gameState.winner}</h2>
          
          <div style={{ margin: '30px 0' }}>
            {Object.entries(gameState.scores)
              .sort(([,a], [,b]) => b - a)
              .map(([player, score], index) => (
                <div key={player} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  margin: '5px 0',
                  borderRadius: '8px',
                  background: player === gameState.winner ? '#d1fae5' : '#f8fafc'
                }}>
                  <span>#{index + 1} {player}</span>
                  <span>{score} pts</span>
                </div>
              ))}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#10b981', color: 'white', border: 'none',
                padding: '15px 25px', borderRadius: '10px', cursor: 'pointer'
              }}
            >
              🎮 Play Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                background: '#667eea', color: 'white', border: 'none',
                padding: '15px 25px', borderRadius: '10px', cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showStartButton = Object.keys(gameState.players).length >= 1 && !gameState.isActive;
  const playerCount = Object.keys(gameState.players).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', color: 'white', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0' }}>⚽ A-Z Football Game</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span>Mode: {gameMode === 'icons' ? '🏆 Icons' : '⚡ Modern'}</span>
            <span>Room: {roomId}</span>
            <span>Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🟡 Connecting'}</span>
          </div>
        </div>

        {/* Letter Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '4rem', color: '#667eea', margin: '0 0 20px 0' }}>
            Letter: {gameState.currentLetter}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter, index) => (
              <span key={letter} style={{
                width: '30px', height: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '5px', fontSize: '12px', fontWeight: 'bold',
                background: index < gameState.currentLetterIndex ? '#10b981' :
                           index === gameState.currentLetterIndex ? '#667eea' : '#f1f5f9',
                color: index <= gameState.currentLetterIndex ? 'white' : '#94a3b8'
              }}>
                {letter}
              </span>
            ))}
          </div>
          
          {gameState.isActive && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: '#ef4444', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                {gameState.timer}s
              </div>
              <div style={{ flex: 1, maxWidth: '300px', height: '10px', background: '#f1f5f9', borderRadius: '5px' }}>
                <div style={{
                  height: '100%',
                  background: '#10b981',
                  width: `${(gameState.timer / 30) * 100}%`,
                  borderRadius: '5px',
                  transition: 'width 1s linear'
                }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          {showStartButton && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>🎮 Ready to Play!</h3>
              <p>{playerCount} player{playerCount !== 1 ? 's' : ''} in room</p>
              <button 
                onClick={handleStartGame}
                disabled={connectionStatus !== 'connected'}
                style={{
                  padding: '15px 30px',
                  background: connectionStatus === 'connected' ? '#10b981' : '#94a3b8',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '1.2rem', cursor: 'pointer', width: '100%', maxWidth: '300px'
                }}
              >
                🚀 Start Game ({playerCount} players)
              </button>
            </div>
          )}
          
          {gameState.isActive && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  placeholder={`Enter player starting with ${gameState.currentLetter}...`}
                  disabled={submitted}
                  style={{
                    flex: 1, padding: '15px', border: '2px solid #e2e8f0',
                    borderRadius: '10px', fontSize: '1.1rem',
                    background: submitted ? '#f0fdf4' : 'white'
                  }}
                />
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={submitted || !playerInput.trim()}
                  style={{
                    padding: '15px 25px',
                    background: submitted ? '#10b981' : (!playerInput.trim() ? '#94a3b8' : '#667eea'),
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', minWidth: '100px'
                  }}
                >
                  {submitted ? '✅ Sent' : 'Submit'}
                </button>
              </div>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                🎯 Letter {gameState.currentLetter} = {LETTER_SCORES[gameState.currentLetter]} points
              </div>
            </div>
          )}
          
          {message && (
            <div style={{
              padding: '15px', borderRadius: '10px', marginTop: '15px',
              background: message.includes('✅') ? '#d1fae5' : 
                         message.includes('❌') ? '#fecaca' : '#dbeafe',
              color: message.includes('✅') ? '#065f46' : 
                     message.includes('❌') ? '#7f1d1d' : '#1e40af',
              fontWeight: 'bold'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Players Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3>👥 Players ({playerCount})</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {Object.entries(gameState.players).map(([name]) => (
              <div key={name} style={{
                padding: '15px',
                borderRadius: '10px',
                background: name === playerName ? '#dbeafe' : '#f8fafc',
                border: `2px solid ${name === playerName ? '#667eea' : '#e2e8f0'}`
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {name} {name === playerName && '(YOU)'}
                </div>
                <div style={{ color: '#667eea', fontWeight: 'bold', marginBottom: '5px' }}>
                  {gameState.scores[name] || 0} points
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {gameState.roundAnswers[name] ? 
                    `✅ ${gameState.roundAnswers[name].answer}` : 
                    (gameState.isActive ? '⏳ Thinking...' : '⏸️ Ready')
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round Results */}
        {Object.keys(gameState.roundAnswers).length > 0 && !gameState.isActive && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3>🏁 Round Results - Letter {gameState.currentLetter}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {Object.entries(gameState.roundAnswers).map(([player, result]) => (
                <div key={player} style={{
                  padding: '15px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  background: result.isValid ? '#d1fae5' : '#fecaca',
                  border: `2px solid ${result.isValid ? '#10b981' : '#ef4444'}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{player}</div>
                  <div style={{ marginBottom: '5px' }}>{result.answer || 'No answer'}</div>
                  <div style={{ fontWeight: 'bold', color: result.isValid ? '#059669' : '#dc2626' }}>
                    {result.isValid ? `+${result.points} pts` : '0 pts'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Stats */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4>📊 Game Stats</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2rem' }}>👥</div>
              <div style={{ fontWeight: 'bold' }}>{playerCount}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Players</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>🎯</div>
              <div style={{ fontWeight: 'bold' }}>{gameState.currentLetterIndex + 1}/26</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Letters</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>⚽</div>
              <div style={{ fontWeight: 'bold' }}>{gameState.usedPlayers?.length || 0}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Used</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem' }}>📈</div>
              <div style={{ fontWeight: 'bold' }}>{Math.round(((gameState.currentLetterIndex + 1) / 26) * 100)}%</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Complete</div>
            </div>
          </div>
        </div>

        {/* Used Players */}
        {gameState.usedPlayers && gameState.usedPlayers.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4>⚽ Used Players ({gameState.usedPlayers.length})</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {gameState.usedPlayers.slice(-10).map((player, index) => (
                <span key={index} style={{
                  background: '#f1f5f9',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  {player}
                </span>
              ))}
              {gameState.usedPlayers.length > 10 && (
                <span style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.9rem'
                }}>
                  +{gameState.usedPlayers.length - 10} more...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setMessage('📋 Link copied!');
                setTimeout(() => setMessage(''), 3000);
              }}
              style={{
                padding: '12px 20px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🔗 Share
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GameBoard;