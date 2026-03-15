import Head from 'next/head';
import Link from 'next/link';

export default function Friends() {
  return (
    <>
      <Head>
        <title>Friends — A-Z Trivia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="page">
        <nav className="nav">
          <Link href="/" className="nav-logo">A–Z</Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Play
            </Link>
            <Link href="/leaderboard" className="nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h2v-5zm4-7H9v12h2V7zm4 3h-2v9h2v-9zm4-6h-2v15h2V4z"/></svg>
              Leaderboard
            </Link>
            <Link href="/friends" className="nav-link nav-link--active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              Friends
            </Link>
          </div>
          <Link href="/signin" className="signin-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V21h19.2v-1.8c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            Sign In
          </Link>
        </nav>

        <main className="main">
          <h1 className="page-title">👥 Friends</h1>
          <p className="page-sub">Search by username · Send requests · See how your mates rank.</p>

          <div className="coming-card">
            <div className="coming-icon">🔒</div>
            <h2>Sign-in required</h2>
            <p>
              Once you&apos;re signed in with Google and have chosen a <strong>unique username</strong>, you can
              search for friends, send requests, and see each other&apos;s stats.
            </p>

            <div className="rules-box">
              <div className="rules-title">Username rules</div>
              <ul className="rules-list">
                <li><span className="rule-check">✓</span> 3–20 characters</li>
                <li><span className="rule-check">✓</span> Letters, numbers, underscores, hyphens only</li>
                <li><span className="rule-check">✓</span> No spaces</li>
                <li><span className="rule-check">✓</span> Case-insensitive uniqueness (no two players can have the same letters)</li>
                <li><span className="rule-cross">✗</span> Can only change username once every <strong>30 days</strong></li>
              </ul>
            </div>

            <div className="coming-steps">
              <div className="step">1. Sign in with Google</div>
              <div className="step">2. Choose your unique username</div>
              <div className="step">3. Search for a friend&apos;s username</div>
              <div className="step">4. Send a friend request — they accept and you&apos;re connected</div>
              <div className="step">5. See their recent scores and challenge them to a game</div>
            </div>

            <Link href="/" className="play-btn">Play now →</Link>
          </div>

          {/* Preview of the friends list UI */}
          <h2 className="preview-title">Preview</h2>
          <div className="search-preview">
            <input className="search-input" placeholder="Search username…" disabled />
            <button className="search-btn" disabled>Search</button>
          </div>
          <div className="friends-list">
            {['rival99', 'trivia_g', 'footballfan'].map(name => (
              <div className="friend-row" key={name}>
                <div className="friend-avatar">?</div>
                <div className="friend-info">
                  <div className="friend-name">{name}</div>
                  <div className="friend-stats">— pts · — wins</div>
                </div>
                <button className="challenge-btn" disabled>Challenge</button>
              </div>
            ))}
          </div>
        </main>

        <style jsx>{`
          .page { min-height: 100vh; background: #070b14; color: #e8eaf0; font-family: 'Inter', system-ui, sans-serif; }
          .nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .nav-logo { font-size: 1.4rem; font-weight: 900; background: linear-gradient(135deg,#00ff87,#00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-decoration: none; }
          .nav-links { display: flex; gap: 8px; }
          .nav-link { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-decoration: none; color: #9ba3b8; border: 1px solid transparent; transition: all 0.2s; }
          .nav-link:hover { color: #e8eaf0; background: rgba(255,255,255,0.05); }
          .nav-link--active { color: #00d4ff; border-color: rgba(0,212,255,0.25); background: rgba(0,212,255,0.07); }
          .signin-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-decoration: none; color: #e8eaf0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); transition: all 0.2s; white-space: nowrap; }
          .signin-btn:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); }
          .main { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
          .page-title { font-size: 2.2rem; font-weight: 900; margin: 0 0 8px; }
          .page-sub { color: #6b7280; margin: 0 0 40px; }
          .coming-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 36px 32px; text-align: center; margin-bottom: 48px; }
          .coming-icon { font-size: 3rem; margin-bottom: 16px; }
          .coming-card h2 { font-size: 1.4rem; font-weight: 800; margin: 0 0 12px; }
          .coming-card p { color: #9ba3b8; line-height: 1.6; margin: 0 0 20px; }
          .coming-card strong { color: #00ff87; }
          .rules-box { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; text-align: left; }
          .rules-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
          .rules-list { list-style: none; margin: 0; padding: 0; }
          .rules-list li { font-size: 0.88rem; color: #9ba3b8; padding: 4px 0; display: flex; align-items: center; gap: 8px; }
          .rule-check { color: #00ff87; font-weight: 700; flex-shrink: 0; }
          .rule-cross { color: #f59e0b; font-weight: 700; flex-shrink: 0; }
          .coming-steps { text-align: left; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
          .step { color: #9ba3b8; font-size: 0.88rem; padding: 5px 0; }
          .play-btn { display: inline-block; background: linear-gradient(135deg,#00ff87,#00c853); color: #070b14; font-weight: 700; font-size: 0.95rem; padding: 12px 28px; border-radius: 12px; text-decoration: none; transition: all 0.2s; }
          .play-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,255,135,0.3); }
          .preview-title { font-size: 1.1rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 16px; }
          .search-preview { display: flex; gap: 8px; margin-bottom: 20px; }
          .search-input { flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; color: #6b7280; font-size: 0.95rem; cursor: not-allowed; }
          .search-btn { padding: 12px 20px; background: rgba(0,255,135,0.1); border: 1px solid rgba(0,255,135,0.2); border-radius: 12px; color: #6b7280; font-weight: 600; font-size: 0.9rem; cursor: not-allowed; }
          .friends-list { display: flex; flex-direction: column; gap: 10px; }
          .friend-row { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 18px; }
          .friend-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #4b5563; flex-shrink: 0; }
          .friend-info { flex: 1; }
          .friend-name { font-weight: 700; color: #9ba3b8; margin-bottom: 2px; }
          .friend-stats { font-size: 0.8rem; color: #4b5563; font-style: italic; }
          .challenge-btn { padding: 8px 16px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #4b5563; font-size: 0.82rem; font-weight: 600; cursor: not-allowed; }
        `}</style>
      </div>
    </>
  );
}
