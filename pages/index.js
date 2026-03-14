import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// ── Game type configs ─────────────────────────────────────────────────────────
const GAME_TYPES = [
  { id: 'football', label: '⚽ Football',  emoji: '⚽' },
  { id: 'nba',      label: '🏀 NBA',       emoji: '🏀' },
  { id: 'wwe',      label: '🤼 WWE',       emoji: '🤼' },
  { id: 'music',    label: '🎵 Music',     emoji: '🎵' },
  { id: 'f1',       label: '🏎️ F1',        emoji: '🏎️' },
  { id: 'movies',   label: '🎬 Movies',    emoji: '🎬' },
];

const SUB_MODES = {
  football: [
    { id: 'icons',  label: '🏆 Icons',  desc: 'Retired Legends · pre-2015', examples: 'Ronaldinho · Henry · Zidane · R9 · Pirlo' },
    { id: 'modern', label: '⚡ Modern', desc: 'Stars · 2015 – Present',      examples: 'Mbappé · Haaland · Bellingham · Vini Jr' },
  ],
  nba: [
    { id: 'legends', label: '🏆 Legends', desc: 'All-Time Greats · pre-2015', examples: 'Jordan · Kobe · Shaq · Magic · Bird' },
    { id: 'modern',  label: '⚡ Modern',  desc: 'Stars · 2015 – Present',     examples: 'LeBron · Curry · Giannis · Durant · Luka' },
  ],
  wwe: [
    { id: 'all',      label: '🌎 All Eras',    desc: 'Every era combined',             examples: 'Hogan · Rock · Austin · Cena · Reigns' },
    { id: 'golden',   label: '👑 Golden Era',   desc: '1980s — Hulkamania & beyond',    examples: 'Hogan · Macho Man · Andre the Giant' },
    { id: 'attitude', label: '🔥 Attitude Era', desc: '1990s — Attitude Revolution',   examples: 'Stone Cold · The Rock · Mankind' },
    { id: 'ruthless', label: '⚡ Ruthless Agg', desc: '2000s — Ruthless Aggression',   examples: 'Cena · Batista · Edge · Randy Orton' },
    { id: 'pg',       label: '🛡️ PG Era',       desc: '2008–2014 — PG Era',            examples: 'Punk · Bryan · Shield · Rhodes' },
    { id: 'modern',   label: '🚀 Modern',        desc: '2015–present — New Era',        examples: 'Reigns · Rollins · Becky Lynch · Sami' },
  ],
  music: [
    { id: 'hiphop',    label: '🎤 Hip-Hop',      desc: 'Classic & modern rap',        examples: 'Biggie · Jay-Z · Kendrick · Drake' },
    { id: 'pop',       label: '🌟 Pop',           desc: 'Classic & modern pop',        examples: 'Michael Jackson · Madonna · Taylor' },
    { id: 'rock',      label: '🎸 Rock',          desc: 'Classic & modern rock',       examples: 'Freddie Mercury · Bowie · Foo Fighters' },
    { id: 'rnb',       label: '🎶 R&B/Soul',      desc: 'R&B, soul, neo-soul',         examples: 'Beyoncé · Marvin Gaye · Usher · SZA' },
    { id: 'edm',       label: '🎛️ EDM',           desc: 'Electronic & dance music',    examples: 'Daft Punk · Tiësto · Martin Garrix' },
    { id: 'latin',     label: '💃 Latin',         desc: 'Latin pop & reggaeton',       examples: 'Bad Bunny · J Balvin · Shakira' },
    { id: 'country',   label: '🤠 Country',       desc: 'Country & americana',         examples: 'Johnny Cash · Dolly · Taylor Swift' },
    { id: 'kpop',      label: '✨ K-Pop',          desc: 'Korean pop artists & groups', examples: 'BTS · Blackpink · EXO · Stray Kids' },
    { id: 'afrobeats', label: '🥁 Afrobeats',     desc: 'Afrobeats & afropop',         examples: 'Burna Boy · Wizkid · Davido · Tyla' },
  ],
  f1: [
    { id: 'legends', label: '🏆 Legends', desc: 'All-Time Champions · pre-2015', examples: 'Senna · Schumacher · Prost · Lauda' },
    { id: 'modern',  label: '⚡ Modern',  desc: 'Current Grid · 2015 – Present', examples: 'Hamilton · Verstappen · Leclerc · Norris' },
  ],
  movies: [
    { id: 'classic', label: '🎞️ Classic', desc: 'Golden Age · pre-1990',         examples: 'Brando · Hepburn · Bogart · Monroe' },
    { id: 'modern',  label: '⚡ Modern',  desc: 'Contemporary Stars · 1990–Now', examples: 'DiCaprio · Jolie · Hanks · Lawrence' },
  ],
};

// For music — era sub-selector
const MUSIC_ERAS = [
  { id: 'classic', label: '🕰️ Classic' },
  { id: 'modern',  label: '⚡ Modern'  },
];

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId]         = useState('');
  const [gameType, setGameType]     = useState('football');
  const [subMode, setSubMode]       = useState('modern');
  const [musicEra, setMusicEra]     = useState('modern');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining]   = useState(false);
  const router = useRouter();

  const fullMode = useMemo(() => {
    if (gameType === 'music') return `music-${subMode}-${musicEra}`;
    return `${gameType}-${subMode}`;
  }, [gameType, subMode, musicEra]);

  const handleTypeChange = (type) => {
    setGameType(type);
    const defaults = { football: 'modern', nba: 'modern', wwe: 'all', music: 'hiphop', f1: 'modern', movies: 'modern' };
    setSubMode(defaults[type] || 'modern');
    setMusicEra('modern');
  };

  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateRoom = async () => {
    if (!playerName.trim()) { alert('Please enter your name'); return; }
    setIsCreating(true);
    try {
      const newRoomId = generateRoomId();
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('gameMode', fullMode);
      router.push(`/game/${newRoomId}?mode=${fullMode}&player=${encodeURIComponent(playerName.trim())}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) { alert('Please enter your name'); return; }
    if (!roomId.trim()) { alert('Please enter a room ID'); return; }
    setIsJoining(true);
    try {
      sessionStorage.setItem('playerName', playerName.trim());
      router.push(`/game/${roomId.toUpperCase()}?player=${encodeURIComponent(playerName.trim())}`);
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const currentSubModes = SUB_MODES[gameType] || [];

  return (
    <>
      <Head>
        <title>A-Z Trivia Challenge — Football · NBA · WWE · Music · F1 · Movies</title>
        <meta name="description" content="Real-time multiplayer A-Z trivia. Name legends from A to Z, beat the clock, crush your mates. Football, NBA, WWE, Music, F1, Movies." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="home-container">

        {/* Navigation */}
        <nav className="top-nav">
          <span className="nav-logo">A–Z</span>
          <div className="nav-links">
            <Link href="/" className="nav-link nav-link--active">🎮 Play</Link>
            <Link href="/leaderboard" className="nav-link">🏆 Leaderboard</Link>
            <Link href="/friends" className="nav-link">👥 Friends</Link>
          </div>
        </nav>

        {/* Animated pitch lines background */}
        <div className="pitch-overlay" aria-hidden="true">
          <div className="pitch-line pitch-center-circle" />
          <div className="pitch-line pitch-halfway" />
          <div className="pitch-line pitch-box-left" />
          <div className="pitch-line pitch-box-right" />
        </div>

        {/* Hero */}
        <header className="hero-section">
          <div className="hero-badge">🏆 A-Z TRIVIA CHALLENGE</div>
          <h1 className="title">
            <span className="title-az">A–Z</span>
            <span className="title-main">Trivia</span>
            <span className="title-sub">CHALLENGE</span>
          </h1>
          <p className="subtitle">
            Name <strong>A to Z</strong> · Beat the clock · Outscore your mates
          </p>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">6</span><span className="stat-label">Categories</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">26</span><span className="stat-label">Rounds</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">30s</span><span className="stat-label">Per Letter</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">2000+</span><span className="stat-label">Names</span></div>
          </div>
        </header>

        {/* Game Type Selector */}
        <section className="section-block">
          <h2 className="section-title"><span className="accent">Choose</span> Your Category</h2>
          <div className="type-selector">
            {GAME_TYPES.map(t => (
              <button
                key={t.id}
                className={`type-btn ${gameType === t.id ? 'type-btn--active' : ''}`}
                onClick={() => handleTypeChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sub-Mode Selector */}
        <section className="section-block">
          <h2 className="section-title"><span className="accent">Choose</span> Your Mode</h2>
          <div className={`mode-selector ${gameType === 'wwe' ? 'mode-selector--wide' : ''} ${gameType === 'music' ? 'mode-selector--music' : ''}`}>
            {currentSubModes.map(m => (
              <div
                key={m.id}
                className={`mode-card ${subMode === m.id ? 'selected' : ''}`}
                onClick={() => setSubMode(m.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSubMode(m.id)}
              >
                <h3>{m.label}</h3>
                <p className="mode-era">{m.desc}</p>
                <div className="mode-examples">{m.examples}</div>
                {subMode === m.id && <div className="mode-selected-indicator">✓ Selected</div>}
              </div>
            ))}
          </div>

          {/* Music Era sub-selector */}
          {gameType === 'music' && (
            <div className="music-era-row">
              <span className="music-era-label">Era:</span>
              {MUSIC_ERAS.map(e => (
                <button
                  key={e.id}
                  className={`era-btn ${musicEra === e.id ? 'era-btn--active' : ''}`}
                  onClick={() => setMusicEra(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Main Form */}
        <section className="section-block form-section">
          <div className="form-card">
            <h2 className="form-title">Ready to Play?</h2>
            <div className="selected-mode-pill">
              {GAME_TYPES.find(t => t.id === gameType)?.emoji}&nbsp;
              {gameType === 'music'
                ? `${currentSubModes.find(m => m.id === subMode)?.label} · ${MUSIC_ERAS.find(e => e.id === musicEra)?.label}`
                : currentSubModes.find(m => m.id === subMode)?.label || subMode}
            </div>

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
              { icon: '🔤', title: 'A to Z', desc: 'Each round is a letter. Name someone from your chosen category whose name starts with that letter.' },
              { icon: '⏱', title: 'Beat the Clock', desc: '30 seconds per letter. Answer before the buzzer.' },
              { icon: '💎', title: 'Score Points', desc: 'Harder letters score more. Q and Z are worth 10 pts — can you find them?' },
              { icon: '🚫', title: 'No Repeats', desc: 'Each name can only be used once across all players. Choose wisely.' },
            ].map(r => (
              <div className="rule-card" key={r.title}>
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
              { icon: '🌍', label: 'Real-time Multiplayer',   desc: 'Play with mates anywhere, instantly' },
              { icon: '🧠', label: 'Smart Fuzzy Matching',    desc: 'Typos forgiven — we know who you mean' },
              { icon: '🎙️', label: '600+ Nicknames',          desc: 'CR7, Dinho, Gazza — all accepted' },
              { icon: '⏸️', label: 'Pause & Resume',          desc: 'Life happens — pick it back up later' },
              { icon: '📊', label: 'Scrabble Scoring',        desc: 'Rare letters = big points. Risk it.' },
              { icon: '📱', label: 'Mobile-Ready',            desc: 'Full experience on any screen size' },
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
          <p>A-Z Trivia Challenge &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>

      <style jsx>{`
        /* ── Top Nav ─────────────────────────────── */
        .top-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 4px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 0;
          position: relative; z-index: 2;
        }
        .nav-logo {
          font-size: 1.3rem; font-weight: 900;
          background: linear-gradient(135deg,#00ff87,#00d4ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-links { display: flex; gap: 6px; }
        .nav-link {
          padding: 7px 13px; border-radius: 20px; font-size: 0.83rem;
          font-weight: 600; text-decoration: none; color: #9ba3b8;
          border: 1px solid transparent; transition: all 0.2s;
        }
        .nav-link:hover { color: #e8eaf0; background: rgba(255,255,255,0.05); }
        .nav-link--active {
          color: #00ff87; border-color: rgba(0,255,135,0.25);
          background: rgba(0,255,135,0.07);
        }

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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 18px 32px;
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
          max-width: 960px;
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

        /* ── Game Type Selector ───────────────────── */
        .type-selector {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        .type-btn {
          padding: 10px 20px;
          border-radius: 30px;
          border: 2px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #9ba3b8;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .type-btn:hover {
          border-color: rgba(0,255,135,0.4);
          color: #e8eaf0;
          background: rgba(0,255,135,0.06);
        }
        .type-btn--active {
          border-color: #00ff87;
          background: rgba(0,255,135,0.12);
          color: #00ff87;
          box-shadow: 0 0 16px rgba(0,255,135,0.15);
        }

        /* ── Mode Cards ──────────────────────────── */
        .mode-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .mode-selector--wide {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .mode-selector--music {
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        }
        .mode-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 22px 18px;
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
          transform: translateY(-3px);
          box-shadow: 0 10px 35px rgba(0,255,135,0.1);
        }
        .mode-card:hover::before { opacity: 1; }
        .mode-card.selected {
          border-color: #00ff87;
          background: rgba(0,255,135,0.07);
          box-shadow: 0 0 0 1px rgba(0,255,135,0.2), 0 10px 35px rgba(0,255,135,0.15);
        }
        .mode-card.selected::before { opacity: 1; }
        .mode-card h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 5px;
        }
        .mode-era {
          font-size: 0.75rem;
          color: #6b7280;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 0 0 10px;
        }
        .mode-examples {
          font-size: 0.82rem;
          color: #9ba3b8;
          font-style: italic;
          line-height: 1.4;
        }
        .mode-selected-indicator {
          margin-top: 12px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #00ff87;
          letter-spacing: 0.05em;
        }

        /* ── Music Era Row ───────────────────────── */
        .music-era-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 18px;
        }
        .music-era-label {
          color: #6b7280;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .era-btn {
          padding: 8px 18px;
          border-radius: 20px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #9ba3b8;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .era-btn:hover {
          border-color: rgba(0,255,135,0.35);
          color: #e8eaf0;
        }
        .era-btn--active {
          border-color: #00ff87;
          background: rgba(0,255,135,0.1);
          color: #00ff87;
        }

        /* ── Selected Mode Pill ──────────────────── */
        .selected-mode-pill {
          text-align: center;
          background: rgba(0,255,135,0.08);
          border: 1px solid rgba(0,255,135,0.2);
          color: #00ff87;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          border-radius: 20px;
          padding: 7px 16px;
          margin-bottom: 22px;
          display: inline-block;
          width: auto;
        }

        /* ── Form Card ───────────────────────────── */
        .form-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 36px 32px;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          text-align: center;
        }
        .form-title {
          text-align: center;
          color: #fff;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .input-group { margin-bottom: 18px; text-align: left; }
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
          .hero-stats { gap: 12px; padding: 12px 16px; }
          .stat-num { font-size: 1.3rem; }
        }
      `}</style>
    </>
  );
}
