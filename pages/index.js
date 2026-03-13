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
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('gameMode', gameMode);
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
      sessionStorage.setItem('playerName', playerName.trim());
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
        <title>A-Z Football Trivia — Test Your Knowledge</title>
        <meta name="description" content="Real-time multiplayer A-Z football player trivia. Name legends from A to Z, beat the clock, crush your mates." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="home-container">

        {/* Animated pitch lines background */}
        <div className="pitch-overlay" aria-hidden="true">
          <div className="pitch-line pitch-center-circle" />
          <div className="pitch-line pitch-halfway" />
          <div className="pitch-line pitch-box-left" />
          <div className="pitch-line pitch-box-right" />
        </div>

        {/* Hero */}
        <header className="hero-section">
          <div className="hero-badge">⚽ EURO FOOTBALL TRIVIA</div>
          <h1 className="title">
            <span className="title-az">A–Z</span>
            <span className="title-main">Football</span>
            <span className="title-sub">CHALLENGE</span>
          </h1>
          <p className="subtitle">
            Name players from <strong>A to Z</strong> · Beat the clock · Outscore your mates
          </p>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">1000+</span><span className="stat-label">Players</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">26</span><span className="stat-label">Rounds</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">30s</span><span className="stat-label">Per Letter</span></div>
          </div>
        </header>

        {/* Mode Selector */}
        <section className="section-block">
          <h2 className="section-title"><span className="accent">Choose</span> Your Era</h2>
          <div className="mode-selector">
            <div
              className={`mode-card ${gameMode === 'icons' ? 'selected' : ''}`}
              onClick={() => setGameMode('icons')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setGameMode('icons')}
            >
              <div className="mode-badge icons-badge">CLASSIC</div>
              <div className="mode-icon">🏆</div>
              <h3>Icons Mode</h3>
              <p className="mode-era">Retired Legends · pre-2015</p>
              <div className="mode-examples">Ronaldinho · Henry · Zidane · Ronaldo R9 · Pirlo</div>
              {gameMode === 'icons' && <div className="mode-selected-indicator">✓ Selected</div>}
            </div>

            <div
              className={`mode-card ${gameMode === 'modern' ? 'selected' : ''}`}
              onClick={() => setGameMode('modern')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setGameMode('modern')}
            >
              <div className="mode-badge modern-badge">CURRENT</div>
              <div className="mode-icon">⚡</div>
              <h3>Modern Mode</h3>
              <p className="mode-era">Stars · 2015 – Present</p>
              <div className="mode-examples">Mbappé · Haaland · Bellingham · Vini Jr · Pedri</div>
              {gameMode === 'modern' && <div className="mode-selected-indicator">✓ Selected</div>}
            </div>
          </div>
        </section>

        {/* Main Form */}
        <section className="section-block form-section">
          <div className="form-card">
            <h2 className="form-title">Ready to Play?</h2>

            <div className="input-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                autoComplete="off"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCreateRoom}
              disabled={isCreating || !playerName.trim()}
            >
              {isCreating ? <span className="btn-spinner" /> : '🎮'} {isCreating ? 'Creating Room…' : 'Create New Game'}
            </button>

            <div className="divider"><span>or join a room</span></div>

            <div className="join-row">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                placeholder="Room ID (e.g. AB12CD)"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                className="room-input"
                autoComplete="off"
              />
              <button
                className="btn btn-secondary"
                onClick={handleJoinRoom}
                disabled={isJoining || !playerName.trim() || !roomId.trim()}
              >
                {isJoining ? <span className="btn-spinner" /> : '🚀'} {isJoining ? 'Joining…' : 'Join'}
              </button>
            </div>
          </div>
        </section>

        {/* How to Play */}
        <section className="section-block">
          <h2 className="section-title">How to <span className="accent">Play</span></h2>
          <div className="rules-grid">
            {[
              { num: 'A', icon: '🔤', title: 'A to Z', desc: 'Each round is a letter. Name a real player whose name starts with that letter.' },
              { num: 'B', icon: '⏱', title: 'Beat the Clock', desc: '30 seconds per letter. The faster you answer, the more impressive you look.' },
              { num: 'C', icon: '💎', title: 'Score Points', desc: 'Harder letters score more. Q and Z are worth 10 pts — can you find them?' },
              { num: 'D', icon: '🚫', title: 'No Repeats', desc: 'Each player name can only be used once. Choose wisely.' },
            ].map(r => (
              <div className="rule-card" key={r.num}>
                <div className="rule-icon">{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="section-block">
          <h2 className="section-title"><span className="accent">Features</span></h2>
          <div className="features-grid">
            {[
              { icon: '🌍', label: 'Real-time Multiplayer', desc: 'Play with mates anywhere, instantly' },
              { icon: '🧠', label: 'Smart Fuzzy Matching', desc: 'Typos forgiven — we know who you mean' },
              { icon: '🎙️', label: '600+ Nicknames', desc: 'CR7, Dinho, Gazza — all accepted' },
              { icon: '⏸️', label: 'Pause & Resume', desc: 'Life happens — pick it back up later' },
              { icon: '📊', label: 'Scrabble Scoring', desc: 'Rare letters = big points. Risk it.' },
              { icon: '📱', label: 'Mobile-Ready', desc: 'Full experience on any screen size' },
            ].map(f => (
              <div className="feature-card" key={f.label}>
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <div className="feature-label">{f.label}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring Reference */}
        <section className="section-block">
          <h2 className="section-title">Letter <span className="accent">Values</span></h2>
          <div className="scoring-grid">
            {Object.entries({
              A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
              N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10
            }).map(([l, v]) => (
              <div
                key={l}
                className={`score-tile ${v >= 8 ? 'score-rare' : v >= 4 ? 'score-hard' : v >= 3 ? 'score-mid' : 'score-easy'}`}
              >
                <span className="score-letter">{l}</span>
                <span className="score-value">{v}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          <p>A-Z Euro Football Trivia &copy; {new Date().getFullYear()}</p>
          <p className="footer-coming">🔜 Coming soon: NBA · WWE · Music Artists</p>
        </footer>
      </div>

      <style jsx>{`
        /* ── Root ────────────────────────────────── */
        .home-container {
          min-height: 100vh;
          background: #070b14;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,255,135,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(0,200,255,0.06) 0%, transparent 60%);
          padding: 20px 16px 60px;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          color: #e8eaf0;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Pitch Background Lines ──────────────── */
        .pitch-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .pitch-line {
          position: absolute;
          border: 1px solid rgba(255,255,255,0.025);
        }
        .pitch-halfway {
          top: 0; bottom: 0; left: 50%;
          width: 1px;
        }
        .pitch-center-circle {
          width: 180px; height: 180px;
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        .pitch-box-left {
          top: 25%; bottom: 25%;
          left: 0; width: 18%;
          border-left: none;
        }
        .pitch-box-right {
          top: 25%; bottom: 25%;
          right: 0; width: 18%;
          border-right: none;
        }

        /* ── Hero ────────────────────────────────── */
        .hero-section {
          text-align: center;
          padding: 60px 0 50px;
          position: relative;
          z-index: 1;
          max-width: 700px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(0,255,135,0.1);
          border: 1px solid rgba(0,255,135,0.3);
          color: #00ff87;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          padding: 6px 16px;
          border-radius: 20px;
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        .title {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          margin: 0 0 20px;
          line-height: 1;
        }
        .title-az {
          font-size: clamp(3.5rem, 12vw, 7rem);
          font-weight: 900;
          background: linear-gradient(135deg, #00ff87 0%, #00d4ff 50%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          filter: drop-shadow(0 0 30px rgba(0,255,135,0.4));
        }
        .title-main {
          font-size: clamp(2rem, 7vw, 4.5rem);
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .title-sub {
          font-size: clamp(1rem, 3vw, 1.6rem);
          font-weight: 600;
          color: #ffd700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          color: #9ba3b8;
          line-height: 1.6;
          max-width: 480px;
          margin: 0 auto 32px;
        }
        .subtitle strong { color: #00ff87; }
        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 18px 32px;
          display: inline-flex;
        }
        .stat { text-align: center; }
        .stat-num {
          display: block;
          font-size: 1.6rem;
          font-weight: 800;
          color: #00ff87;
          line-height: 1;
        }
        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: rgba(255,255,255,0.1);
        }

        /* ── Section Block ───────────────────────── */
        .section-block {
          max-width: 900px;
          margin: 0 auto 56px;
          position: relative;
          z-index: 1;
        }
        .form-section { max-width: 500px; }
        .section-title {
          text-align: center;
          font-size: clamp(1.4rem, 4vw, 2rem);
          font-weight: 800;
          color: #e8eaf0;
          margin-bottom: 28px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .accent { color: #00ff87; }

        /* ── Mode Cards ──────────────────────────── */
        .mode-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .mode-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px 24px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
          overflow: hidden;
        }
        .mode-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(0,255,135,0.06) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .mode-card:hover {
          border-color: rgba(0,255,135,0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,255,135,0.1);
        }
        .mode-card:hover::before { opacity: 1; }
        .mode-card.selected {
          border-color: #00ff87;
          background: rgba(0,255,135,0.07);
          box-shadow: 0 0 0 1px rgba(0,255,135,0.2), 0 12px 40px rgba(0,255,135,0.15);
        }
        .mode-card.selected::before { opacity: 1; }
        .mode-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 4px 10px;
          border-radius: 10px;
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .icons-badge {
          background: rgba(255,215,0,0.15);
          color: #ffd700;
          border: 1px solid rgba(255,215,0,0.3);
        }
        .modern-badge {
          background: rgba(0,200,255,0.15);
          color: #00d4ff;
          border: 1px solid rgba(0,200,255,0.3);
        }
        .mode-icon { font-size: 2.8rem; margin-bottom: 10px; }
        .mode-card h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 6px;
        }
        .mode-era {
          font-size: 0.8rem;
          color: #6b7280;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .mode-examples {
          font-size: 0.85rem;
          color: #9ba3b8;
          font-style: italic;
        }
        .mode-selected-indicator {
          margin-top: 14px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #00ff87;
          letter-spacing: 0.05em;
        }

        /* ── Form Card ───────────────────────────── */
        .form-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 36px 32px;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .form-title {
          text-align: center;
          color: #fff;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 28px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .input-group { margin-bottom: 18px; }
        .input-group label {
          display: block;
          margin-bottom: 7px;
          color: #9ba3b8;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .input-group input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-size: 1rem;
          color: #e8eaf0;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .input-group input::placeholder { color: #4b5563; }
        .input-group input:focus {
          outline: none;
          border-color: #00ff87;
          box-shadow: 0 0 0 3px rgba(0,255,135,0.12);
          background: rgba(0,255,135,0.04);
        }

        /* ── Buttons ─────────────────────────────── */
        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 15px 20px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .btn-primary {
          background: linear-gradient(135deg, #00ff87 0%, #00c853 100%);
          color: #070b14;
          margin-bottom: 6px;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,255,135,0.35);
        }
        .btn-secondary {
          background: linear-gradient(135deg, #00d4ff 0%, #0080ff 100%);
          color: #fff;
          flex-shrink: 0;
          width: auto;
          padding: 14px 22px;
        }
        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,212,255,0.3);
        }
        .btn-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: rgba(0,0,0,0.7);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* ── Divider ─────────────────────────────── */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #374151;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 20px 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .divider span { white-space: nowrap; }

        /* ── Join Row ────────────────────────────── */
        .join-row {
          display: flex;
          gap: 10px;
        }
        .room-input {
          flex: 1;
          padding: 14px 16px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          color: #e8eaf0;
          letter-spacing: 0.15em;
          transition: all 0.2s;
        }
        .room-input::placeholder {
          color: #4b5563;
          font-weight: 400;
          letter-spacing: 0;
        }
        .room-input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 0 3px rgba(0,212,255,0.12);
          background: rgba(0,212,255,0.04);
        }

        /* ── Rules ───────────────────────────────── */
        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 16px;
        }
        .rule-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 24px 20px;
          transition: all 0.2s;
        }
        .rule-card:hover {
          border-color: rgba(0,255,135,0.2);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .rule-icon { font-size: 2rem; margin-bottom: 12px; }
        .rule-card h3 {
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rule-card p {
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        /* ── Features ────────────────────────────── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }
        .feature-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 18px 20px;
          transition: all 0.2s;
        }
        .feature-card:hover {
          border-color: rgba(0,255,135,0.2);
          background: rgba(0,255,135,0.04);
        }
        .feature-icon { font-size: 1.8rem; flex-shrink: 0; }
        .feature-label {
          font-weight: 700;
          color: #e8eaf0;
          font-size: 0.95rem;
          margin-bottom: 2px;
        }
        .feature-desc { color: #6b7280; font-size: 0.82rem; }

        /* ── Scoring Tiles ───────────────────────── */
        .scoring-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
          gap: 8px;
        }
        .score-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 10px 4px;
          border: 1px solid transparent;
          transition: transform 0.15s;
        }
        .score-tile:hover { transform: scale(1.1); }
        .score-letter {
          font-weight: 900;
          font-size: 1.1rem;
          line-height: 1;
        }
        .score-value {
          font-size: 0.7rem;
          font-weight: 700;
          margin-top: 3px;
          opacity: 0.85;
        }
        .score-easy {
          background: rgba(107,114,128,0.2);
          border-color: rgba(107,114,128,0.2);
          color: #9ba3b8;
        }
        .score-mid {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.25);
          color: #93c5fd;
        }
        .score-hard {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.25);
          color: #c084fc;
        }
        .score-rare {
          background: rgba(255,215,0,0.15);
          border-color: rgba(255,215,0,0.35);
          color: #ffd700;
          box-shadow: 0 0 12px rgba(255,215,0,0.15);
        }

        /* ── Footer ──────────────────────────────── */
        .footer {
          text-align: center;
          color: #374151;
          font-size: 0.85rem;
          padding-top: 20px;
          position: relative;
          z-index: 1;
        }
        .footer-coming {
          margin-top: 6px;
          color: #ffd700;
          font-size: 0.8rem;
        }

        /* ── Animations ──────────────────────────── */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Responsive ──────────────────────────── */
        @media (max-width: 600px) {
          .form-card { padding: 24px 18px; }
          .hero-section { padding: 40px 0 36px; }
          .hero-stats { padding: 14px 20px; gap: 16px; }
          .join-row { flex-direction: column; }
          .btn-secondary { width: 100%; }
          .scoring-grid { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); }
        }
      `}</style>
    </>
  );
}
