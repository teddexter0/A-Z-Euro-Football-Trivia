import Head from 'next/head';
import Link from 'next/link';

export default function SignIn() {
  return (
    <>
      <Head>
        <title>Sign In — A-Z Trivia</title>
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
            <Link href="/friends" className="nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              Friends
            </Link>
          </div>
        </nav>

        <main className="main">
          <div className="signin-card">
            <div className="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V21h19.2v-1.8c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            </div>
            <h1>Sign in to A-Z Trivia</h1>
            <p>
              Sign in to save your scores, climb the leaderboard, and challenge friends.
            </p>

            <button className="google-btn" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
              <span className="coming-tag">Coming soon</span>
            </button>

            <div className="setup-note">
              <div className="setup-title">Setup required</div>
              <div className="setup-steps">
                <div className="step">1. Deploy Firebase (see <code>FIREBASE_GEMINI_PROMPT.md</code>)</div>
                <div className="step">2. Add the 6 <code>NEXT_PUBLIC_FIREBASE_*</code> env vars to Koyeb</div>
                <div className="step">3. Google Sign-In will activate automatically</div>
              </div>
            </div>

            <Link href="/" className="play-btn">Play without account →</Link>
          </div>
        </main>

        <style jsx>{`
          .page { min-height: 100vh; background: #070b14; color: #e8eaf0; font-family: 'Inter', system-ui, sans-serif; }
          .nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .nav-logo { font-size: 1.4rem; font-weight: 900; background: linear-gradient(135deg,#00ff87,#00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-decoration: none; }
          .nav-links { display: flex; gap: 8px; }
          .nav-link { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-decoration: none; color: #9ba3b8; border: 1px solid transparent; transition: all 0.2s; }
          .nav-link:hover { color: #e8eaf0; background: rgba(255,255,255,0.05); }
          .main { display: flex; justify-content: center; align-items: flex-start; padding: 60px 20px; }
          .signin-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 24px; padding: 48px 40px; text-align: center; max-width: 420px; width: 100%; }
          .card-icon { color: #00d4ff; margin-bottom: 20px; }
          .signin-card h1 { font-size: 1.6rem; font-weight: 900; margin: 0 0 12px; }
          .signin-card p { color: #9ba3b8; line-height: 1.6; margin: 0 0 32px; font-size: 0.95rem; }
          .google-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px 20px; border-radius: 14px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); color: #9ba3b8; font-size: 0.95rem; font-weight: 600; cursor: not-allowed; margin-bottom: 28px; position: relative; }
          .coming-tag { background: rgba(255,200,50,0.15); color: #ffc832; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
          .setup-note { text-align: left; background: rgba(0,0,0,0.2); border-radius: 14px; padding: 18px 20px; margin-bottom: 28px; }
          .setup-title { font-size: 0.75rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
          .setup-steps { display: flex; flex-direction: column; gap: 6px; }
          .step { color: #9ba3b8; font-size: 0.87rem; }
          .step code { color: #00d4ff; background: rgba(0,212,255,0.1); padding: 1px 6px; border-radius: 4px; font-size: 0.82rem; }
          .play-btn { display: inline-block; background: linear-gradient(135deg,#00ff87,#00c853); color: #070b14; font-weight: 700; font-size: 0.95rem; padding: 12px 28px; border-radius: 12px; text-decoration: none; transition: all 0.2s; }
          .play-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,255,135,0.3); }
        `}</style>
      </div>
    </>
  );
}
