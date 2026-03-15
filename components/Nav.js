import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/auth';

// active: 'play' | 'leaderboard' | 'friends'
export default function Nav({ active }) {
  const { user, loading } = useAuth() ?? {};

  return (
    <nav className="az-nav">
      <Link href="/" className="az-nav-logo">A–Z</Link>

      <div className="az-nav-links">
        <Link href="/" className={`az-nav-link${active === 'play' ? ' az-nav-link--active' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Play
        </Link>
        <Link href="/leaderboard" className={`az-nav-link${active === 'leaderboard' ? ' az-nav-link--active' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h2v-5zm4-7H9v12h2V7zm4 3h-2v9h2v-9zm4-6h-2v15h2V4z"/></svg>
          Leaderboard
        </Link>
        <Link href="/friends" className={`az-nav-link${active === 'friends' ? ' az-nav-link--active' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          Friends
        </Link>
      </div>

      <div className="az-nav-auth">
        {!loading && (
          user ? (
            <div className="az-nav-user">
              {user.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} className="az-nav-avatar" alt="" referrerPolicy="no-referrer" />
              )}
              <span className="az-nav-name">{user.displayName?.split(' ')[0]}</span>
              <button className="az-signout-btn" onClick={() => signOut(auth)}>Sign out</button>
            </div>
          ) : (
            <Link href="/signin" className="az-signin-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V21h19.2v-1.8c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              Sign In
            </Link>
          )
        )}
      </div>

      <style jsx global>{`
        .az-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: relative; z-index: 2;
        }
        .az-nav-logo {
          font-size: 1.3rem; font-weight: 900;
          background: linear-gradient(135deg,#00ff87,#00d4ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; text-decoration: none; flex-shrink: 0;
        }
        .az-nav-links { display: flex; gap: 6px; }
        .az-nav-link {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 20px; font-size: 0.83rem;
          font-weight: 600; text-decoration: none; color: #9ba3b8;
          border: 1px solid transparent; transition: all 0.2s;
        }
        .az-nav-link:hover { color: #e8eaf0; background: rgba(255,255,255,0.05); }
        .az-nav-link--active {
          color: #00d4ff; border-color: rgba(0,212,255,0.25);
          background: rgba(0,212,255,0.07);
        }
        .az-nav-auth { display: flex; align-items: center; flex-shrink: 0; }
        .az-signin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 20px; font-size: 0.83rem;
          font-weight: 700; text-decoration: none; color: #e8eaf0;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
          transition: all 0.2s;
        }
        .az-signin-btn:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); }
        .az-nav-user { display: flex; align-items: center; gap: 10px; }
        .az-nav-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px solid rgba(0,212,255,0.4); object-fit: cover;
        }
        .az-nav-name { font-size: 0.85rem; font-weight: 600; color: #e8eaf0; }
        .az-signout-btn {
          padding: 6px 12px; border-radius: 16px; font-size: 0.78rem;
          font-weight: 600; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12); color: #9ba3b8;
          cursor: pointer; transition: all 0.2s;
        }
        .az-signout-btn:hover { background: rgba(255,80,80,0.12); border-color: rgba(255,80,80,0.3); color: #ff7070; }
      `}</style>
    </nav>
  );
}
