import Head from 'next/head';
import Link from 'next/link';
import Nav from '../components/Nav';
import { useAuth } from './_app';

export default function Leaderboard() {
  const { user, loading } = useAuth() ?? {};

  return (
    <>
      <Head>
        <title>Leaderboard — A-Z Trivia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="page">
        <Nav active="leaderboard" />

        <main className="main">
          <div className="page-header">
            <h1 className="page-title">Leaderboard</h1>
            <p className="page-sub">All-time rankings across every category.</p>
          </div>

          {!loading && !user ? (
            /* ── Not signed in ── */
            <div className="auth-wall">
              <div className="auth-trophy">🏆</div>
              <h2>Sign in to see your ranking</h2>
              <p>Every game you play adds to your all-time score and win count. See where you stand globally.</p>
              <Link href="/signin" className="cta-primary">Sign in with Google</Link>
              <Link href="/" className="cta-ghost">Play as guest</Link>
            </div>
          ) : (
            /* ── Signed in: show table (populated by Cloud Functions) ── */
            <div className="lb-table">
              <div className="lb-header">
                <span>#</span>
                <span>Player</span>
                <span>Points</span>
                <span>Wins</span>
                <span>Games</span>
              </div>
              {[
                { rank: 1, name: user?.displayName?.split(' ')[0] || 'You', pts: '—', wins: '—', games: '—' },
                { rank: 2, name: 'rival99',  pts: '—', wins: '—', games: '—' },
                { rank: 3, name: 'trivia_g', pts: '—', wins: '—', games: '—' },
              ].map(r => (
                <div className="lb-row" key={r.rank}>
                  <span className={`rank rank--${r.rank}`}>#{r.rank}</span>
                  <span className="lb-name">{r.name}</span>
                  <span className="lb-cell">{r.pts}</span>
                  <span className="lb-cell">{r.wins}</span>
                  <span className="lb-cell">{r.games}</span>
                </div>
              ))}
            </div>
          )}
        </main>

        <style jsx>{`
          .page { min-height: 100vh; background: #070b14; color: #e8eaf0; font-family: 'Inter', system-ui, sans-serif; }
          .main { max-width: 720px; margin: 0 auto; padding: 52px 24px; }

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
          .auth-trophy { font-size: 3.5rem; line-height: 1; }
          .auth-wall h2 { font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
          .auth-wall p { font-size: 1.05rem; color: #9ba3b8; max-width: 400px; margin: 0; line-height: 1.65; }
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

          /* ── Table ── */
          .lb-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
          .lb-header, .lb-row { display: grid; grid-template-columns: 52px 1fr 90px 70px 70px; align-items: center; padding: 14px 24px; gap: 8px; }
          .lb-header { font-size: 0.78rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .lb-row { border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 1rem; }
          .lb-row:last-child { border-bottom: none; }
          .rank { font-size: 1rem; font-weight: 800; }
          .rank--1 { color: #ffd700; }
          .rank--2 { color: #c0c0c0; }
          .rank--3 { color: #cd7f32; }
          .lb-name { font-weight: 600; color: #e8eaf0; }
          .lb-cell { color: #6b7280; font-style: italic; }

          @media (max-width: 520px) {
            .page-title { font-size: 2.2rem; }
            .lb-header, .lb-row { grid-template-columns: 44px 1fr 80px; padding: 12px 16px; }
            .lb-header span:nth-child(4), .lb-header span:nth-child(5),
            .lb-row span:nth-child(4), .lb-row span:nth-child(5) { display: none; }
          }
        `}</style>
      </div>
    </>
  );
}
