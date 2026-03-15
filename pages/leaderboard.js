import Head from 'next/head';
import Link from 'next/link';

export default function Leaderboard() {
  return (
    <>
      <Head>
        <title>Leaderboard — A-Z Trivia</title>
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
            <Link href="/leaderboard" className="nav-link nav-link--active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h2v-5zm4-7H9v12h2V7zm4 3h-2v9h2v-9zm4-6h-2v15h2V4z"/></svg>
              Leaderboard
            </Link>
            <Link href="/friends" className="nav-link">
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
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-sub">See who&apos;s topping the charts across all categories.</p>

          <div className="coming-card">
            <div className="coming-icon">🔒</div>
            <h2>Sign-in required</h2>
            <p>
              The leaderboard tracks all-time points and wins per player.
              It&apos;s ready in the backend — it just needs <strong>Google Sign-In</strong> to be wired up.
            </p>
            <div className="coming-steps">
              <div className="step">1. Deploy Firebase (see <code>FIREBASE_GEMINI_PROMPT.md</code>)</div>
              <div className="step">2. Add the 6 <code>NEXT_PUBLIC_FIREBASE_*</code> env vars to Koyeb</div>
              <div className="step">3. Choose a username after first sign-in</div>
              <div className="step">4. Every game you play automatically updates your rank</div>
            </div>
            <Link href="/" className="play-btn">Play now →</Link>
          </div>

          {/* Preview of what the leaderboard will look like */}
          <h2 className="preview-title">Preview</h2>
          <div className="lb-table">
            <div className="lb-header">
              <span>#</span><span>Player</span><span>Points</span><span>Wins</span><span>Games</span>
            </div>
            {[
              { rank: 1, name: 'you_soon', pts: '—', wins: '—', games: '—' },
              { rank: 2, name: 'rival99',  pts: '—', wins: '—', games: '—' },
              { rank: 3, name: 'trivia_g', pts: '—', wins: '—', games: '—' },
            ].map(r => (
              <div className="lb-row" key={r.rank}>
                <span className={`rank rank--${r.rank}`}>#{r.rank}</span>
                <span className="lb-name">{r.name}</span>
                <span className="lb-pts">{r.pts}</span>
                <span className="lb-wins">{r.wins}</span>
                <span className="lb-games">{r.games}</span>
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
          .nav-link--active { color: #ffd700; border-color: rgba(255,215,0,0.25); background: rgba(255,215,0,0.07); }
          .signin-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; text-decoration: none; color: #e8eaf0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); transition: all 0.2s; white-space: nowrap; }
          .signin-btn:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); }
          .main { max-width: 700px; margin: 0 auto; padding: 40px 20px; }
          .page-title { font-size: 2.2rem; font-weight: 900; margin: 0 0 8px; }
          .page-sub { color: #6b7280; margin: 0 0 40px; }
          .coming-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 36px 32px; text-align: center; margin-bottom: 48px; }
          .coming-icon { font-size: 3rem; margin-bottom: 16px; }
          .coming-card h2 { font-size: 1.4rem; font-weight: 800; margin: 0 0 12px; }
          .coming-card p { color: #9ba3b8; line-height: 1.6; margin: 0 0 24px; }
          .coming-card strong { color: #00ff87; }
          .coming-steps { text-align: left; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
          .step { color: #9ba3b8; font-size: 0.88rem; padding: 5px 0; }
          .step code { color: #00d4ff; background: rgba(0,212,255,0.1); padding: 1px 6px; border-radius: 4px; font-size: 0.82rem; }
          .play-btn { display: inline-block; background: linear-gradient(135deg,#00ff87,#00c853); color: #070b14; font-weight: 700; font-size: 0.95rem; padding: 12px 28px; border-radius: 12px; text-decoration: none; transition: all 0.2s; }
          .play-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,255,135,0.3); }
          .preview-title { font-size: 1.1rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 16px; }
          .lb-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; }
          .lb-header, .lb-row { display: grid; grid-template-columns: 48px 1fr 80px 60px 60px; align-items: center; padding: 12px 20px; gap: 8px; }
          .lb-header { font-size: 0.75rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .lb-row { border-bottom: 1px solid rgba(255,255,255,0.04); color: #6b7280; font-style: italic; }
          .rank { font-weight: 800; }
          .rank--1 { color: #ffd700; }
          .rank--2 { color: #c0c0c0; }
          .rank--3 { color: #cd7f32; }
          .lb-name { font-weight: 600; color: #9ba3b8; }
          @media (max-width: 500px) { .nav-link span { display: none; } .lb-header, .lb-row { grid-template-columns: 40px 1fr 70px; } .lb-wins, .lb-games { display: none; } .lb-header span:nth-child(4), .lb-header span:nth-child(5) { display: none; } }
        `}</style>
      </div>
    </>
  );
}
