import Head from 'next/head';
import Link from 'next/link';
import Nav from '../components/Nav';
import { useAuth } from '../lib/auth';

export default function Friends() {
  const { user, loading } = useAuth() ?? {};

  return (
    <>
      <Head>
        <title>Friends — A-Z Trivia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="page">
        <Nav active="friends" />

        <main className="main">
          <div className="page-header">
            <h1 className="page-title">Friends</h1>
            <p className="page-sub">Search by username · Send requests · See how your mates rank.</p>
          </div>

          {!loading && !user ? (
            /* ── Not signed in ── */
            <div className="auth-wall">
              <div className="auth-icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" style={{color:'#00d4ff'}}>
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h2>Sign in to connect with friends</h2>
              <p>Choose a username, search for mates, send challenges, and track each other&apos;s scores.</p>
              <Link href="/signin" className="cta-primary">Sign in with Google</Link>
              <Link href="/" className="cta-ghost">Play as guest</Link>
            </div>
          ) : (
            /* ── Signed in: show friends UI ── */
            <>
              <div className="search-row">
                <input className="search-input" placeholder="Search by username…" />
                <button className="search-btn">Search</button>
              </div>
              <div className="friends-list">
                {['rival99', 'trivia_g', 'footballfan'].map(name => (
                  <div className="friend-row" key={name}>
                    <div className="friend-avatar">{name[0].toUpperCase()}</div>
                    <div className="friend-info">
                      <div className="friend-name">{name}</div>
                      <div className="friend-stats">— pts · — wins</div>
                    </div>
                    <button className="challenge-btn">Challenge</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        <style jsx>{`
          .page { min-height: 100vh; background: #070b14; color: #e8eaf0; font-family: 'Inter', system-ui, sans-serif; }
          .main { max-width: 640px; margin: 0 auto; padding: 52px 24px; }

          .page-header { margin-bottom: 40px; }
          .page-title { font-size: 2.8rem; font-weight: 900; letter-spacing: -0.02em; margin: 0 0 10px; }
          .page-sub { font-size: 1.1rem; color: #6b7280; margin: 0; }

          /* ── Auth wall ── */
          .auth-wall {
            display: flex; flex-direction: column; align-items: center;
            text-align: center; gap: 16px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px; padding: 56px 40px;
          }
          .auth-icon { line-height: 1; }
          .auth-wall h2 { font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
          .auth-wall p { font-size: 1.05rem; color: #9ba3b8; max-width: 380px; margin: 0; line-height: 1.65; }
          .cta-primary {
            display: inline-flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #00ff87, #00c853);
            color: #070b14; font-weight: 700; font-size: 1rem;
            padding: 14px 32px; border-radius: 14px; text-decoration: none;
            transition: all 0.2s; margin-top: 8px;
          }
          .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,255,135,0.35); }
          .cta-ghost {
            display: inline-flex; align-items: center; justify-content: center;
            color: #9ba3b8; font-size: 0.95rem; font-weight: 600;
            padding: 10px 24px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1); text-decoration: none;
            transition: all 0.2s;
          }
          .cta-ghost:hover { color: #e8eaf0; border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.04); }

          /* ── Friends UI ── */
          .search-row { display: flex; gap: 10px; margin-bottom: 28px; }
          .search-input {
            flex: 1; padding: 13px 18px;
            background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1);
            border-radius: 12px; color: #e8eaf0; font-size: 1rem; font-family: inherit;
            transition: border-color 0.2s; outline: none;
          }
          .search-input::placeholder { color: #4b5563; }
          .search-input:focus { border-color: rgba(0,212,255,0.4); }
          .search-btn {
            padding: 13px 22px; background: rgba(0,212,255,0.1);
            border: 1px solid rgba(0,212,255,0.2); border-radius: 12px;
            color: #00d4ff; font-weight: 700; font-size: 0.95rem; font-family: inherit;
            cursor: pointer; transition: all 0.2s;
          }
          .search-btn:hover { background: rgba(0,212,255,0.18); }
          .friends-list { display: flex; flex-direction: column; gap: 10px; }
          .friend-row {
            display: flex; align-items: center; gap: 16px;
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 16px 20px;
            transition: border-color 0.2s;
          }
          .friend-row:hover { border-color: rgba(255,255,255,0.14); }
          .friend-avatar {
            width: 44px; height: 44px; border-radius: 50%;
            background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,135,0.1));
            border: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem; font-weight: 800; color: #00d4ff; flex-shrink: 0;
          }
          .friend-info { flex: 1; }
          .friend-name { font-size: 1rem; font-weight: 700; color: #e8eaf0; margin-bottom: 3px; }
          .friend-stats { font-size: 0.88rem; color: #6b7280; }
          .challenge-btn {
            padding: 9px 18px; background: transparent;
            border: 1px solid rgba(0,255,135,0.25); border-radius: 10px;
            color: #00ff87; font-size: 0.9rem; font-weight: 600; font-family: inherit;
            cursor: pointer; transition: all 0.2s;
          }
          .challenge-btn:hover { background: rgba(0,255,135,0.08); }

          @media (max-width: 480px) { .page-title { font-size: 2.2rem; } }
        `}</style>
      </div>
    </>
  );
}
