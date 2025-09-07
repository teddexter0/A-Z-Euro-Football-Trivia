import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [gameMode, setGameMode] = useState('modern');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsCreating(true);
    
    try {
      const newRoomId = generateRoomId();
      
      // Store game settings
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('gameMode', gameMode);
      
      // Navigate to game room
      router.push(`/game/${newRoomId}?mode=${gameMode}&player=${encodeURIComponent(playerName.trim())}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    setIsJoining(true);
    
    try {
      // Store game settings
      sessionStorage.setItem('playerName', playerName.trim());
      
      // Navigate to game room
      router.push(`/game/${roomId.toUpperCase()}?player=${encodeURIComponent(playerName.trim())}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <Head>
        <title>A-Z Football Game</title>
        <meta name="description" content="Real-time multiplayer A-Z football player game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="home-container">
        <div className="hero-section">
          <h1 className="title">⚽ A-Z Football Game</h1>
          <p className="subtitle">
            Test your football knowledge in this fast-paced multiplayer game!
            Name players from A to Z and compete with friends.
          </p>
        </div>

        <div className="game-modes">
          <h2>Choose Your Era</h2>
          <div className="mode-selector">
            <div 
              className={`mode-card ${gameMode === 'icons' ? 'selected' : ''}`}
              onClick={() => setGameMode('icons')}
            >
              <div className="mode-icon">🏆</div>
              <h3>Icons Mode</h3>
              <p>Legendary players from 1990-2014</p>
              <div className="mode-examples">
                Messi, Ronaldinho, Henry, Zidane...
              </div>
            </div>
            
            <div 
              className={`mode-card ${gameMode === 'modern' ? 'selected' : ''}`}
              onClick={() => setGameMode('modern')}
            >
              <div className="mode-icon">⚡</div>
              <h3>Modern Mode</h3>
              <p>Current stars from 2015-present</p>
              <div className="mode-examples">
                Mbappé, Haaland, Bellingham, Vini Jr...
              </div>
            </div>
          </div>
        </div>

        <div className="main-form">
          <div className="form-card">
            <h2>Enter Your Details</h2>
            
            <div className="input-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
            </div>

            <div className="action-buttons">
              <button 
                className="create-btn"
                onClick={handleCreateRoom}
                disabled={isCreating || !playerName.trim()}
              >
                {isCreating ? '🎮 Creating...' : '🎮 Create New Game'}
              </button>
              
              <div className="divider">
                <span>OR</span>
              </div>

              <div className="input-group">
                <label htmlFor="roomId">Room ID</label>
                <input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID..."
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <button 
                className="join-btn"
                onClick={handleJoinRoom}
                disabled={isJoining || !playerName.trim() || !roomId.trim()}
              >
                {isJoining ? '🚀 Joining...' : '🚀 Join Game'}
              </button>
            </div>
          </div>
        </div>

        <div className="how-to-play">
          <h2>How to Play</h2>
          <div className="rules-grid">
            <div className="rule-card">
              <div className="rule-number">1</div>
              <h3>Take Turns</h3>
              <p>Players name football players starting with each letter A-Z</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-number">2</div>
              <h3>Beat the Timer</h3>
              <p>You have 30 seconds per letter. Think fast!</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-number">3</div>
              <h3>Score Points</h3>
              <p>Harder letters = more points. Z is worth 10 points!</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-number">4</div>
              <h3>No Repeats</h3>
              <p>Each player name can only be used once per game</p>
            </div>
          </div>
        </div>

        <div className="features">
          <h2>Game Features</h2>
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">🌍</span>
              <span>Real-time multiplayer</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Smart spell-checking</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Fast-paced gameplay</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🏆</span>
              <span>Scrabble-style scoring</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📱</span>
              <span>Mobile-friendly</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎮</span>
              <span>Multiple game modes</span>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>Built with Next.js & Socket.io | © 2024 A-Z Football Game</p>
          <div className="footer-links">
            <span>Coming Soon: NBA Players, WWE Superstars, Music Artists & More!</span>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .hero-section {
          text-align: center;
          color: white;
          margin-bottom: 40px;
          padding: 40px 0;
        }

        .title {
          font-size: 3.5rem;
          font-weight: bold;
          margin-bottom: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .subtitle {
          font-size: 1.3rem;
          max-width: 600px;
          margin: 0 auto;
          opacity: 0.9;
          line-height: 1.6;
        }

        .game-modes {
          max-width: 800px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .game-modes h2 {
          color: white;
          font-size: 2rem;
          margin-bottom: 25px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .mode-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .mode-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid transparent;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .mode-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .mode-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .mode-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .mode-card h3 {
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .mode-card p {
          margin-bottom: 15px;
          opacity: 0.8;
        }

        .mode-examples {
          font-size: 0.9rem;
          font-style: italic;
          opacity: 0.7;
        }

        .main-form {
          max-width: 500px;
          margin: 0 auto 50px;
        }

        .form-card {
          background: white;
          border-radius: 20px;
          padding: 35px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .form-card h2 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 1.8rem;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-weight: 600;
        }

        .input-group input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 1.1rem;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }

        .input-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .create-btn, .join-btn {
          padding: 15px 25px;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .create-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .create-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .join-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .join-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
        }

        .create-btn:disabled, .join-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .divider {
          text-align: center;
          color: #666;
          font-weight: 600;
          position: relative;
          margin: 10px 0;
        }

        .divider::before, .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #ddd;
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .how-to-play {
          max-width: 900px;
          margin: 0 auto 50px;
          text-align: center;
        }

        .how-to-play h2 {
          color: white;
          font-size: 2rem;
          margin-bottom: 30px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .rule-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .rule-card:hover {
          transform: translateY(-5px);
        }

        .rule-number {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
          margin: 0 auto 15px;
        }

        .rule-card h3 {
          color: #333;
          margin-bottom: 10px;
          font-size: 1.2rem;
        }

        .rule-card p {
          color: #666;
          line-height: 1.5;
        }

        .features {
          max-width: 800px;
          margin: 0 auto 50px;
          text-align: center;
        }

        .features h2 {
          color: white;
          font-size: 2rem;
          margin-bottom: 30px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .features-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .feature {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 10px;
          padding: 20px;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 0.3s ease;
        }

        .feature:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.15);
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .footer {
          text-align: center;
          color: white;
          opacity: 0.8;
          margin-top: 50px;
          padding: 30px;
        }

        .footer-links {
          margin-top: 10px;
          font-size: 0.9rem;
          color: #ffd700;
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.1rem;
          }
          
          .mode-selector {
            grid-template-columns: 1fr;
          }
          
          .rules-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
          
          .features-list {
            grid-template-columns: 1fr;
          }
          
          .form-card {
            padding: 25px;
          }
        }

        @media (max-width: 480px) {
          .home-container {
            padding: 10px;
          }
          
          .title {
            font-size: 2rem;
          }
          
          .hero-section {
            padding: 20px 0;
          }
        }
      `}</style>
    </>
  );
}