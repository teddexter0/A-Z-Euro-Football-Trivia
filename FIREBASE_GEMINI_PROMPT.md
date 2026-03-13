# Gemini Firebase Prompt

Copy and paste the block below into Gemini (or any AI assistant) to generate the complete Firebase setup for the A-Z Trivia app.

---

```
I'm building a real-time multiplayer trivia web app called "A-Z Trivia Challenge" (Next.js 15, Node.js backend, Socket.io). I need you to generate:

1. Complete Firestore database schema (collections & document shapes)
2. Firestore Security Rules
3. Firebase Auth setup instructions (Google Sign-In)
4. Required Firestore composite indexes
5. A Cloud Functions file (index.js) for any server-side triggers needed

## App overview
- 6 game categories: Football, NBA, WWE, Music, F1, Movies
- Real-time multiplayer rooms (Socket.io handles live gameplay — Firebase is for persistence & social)
- Players authenticate via Google Sign-In, then choose a unique username (separate from their Google display name)
- Leaderboard tracks all-time points and game wins per user
- Friends system: send/accept friend requests, see friends' leaderboard

## Collections & document shapes needed

### /users/{uid}
{
  uid: string,                // Firebase Auth UID
  displayName: string,        // from Google profile
  email: string,
  photoURL: string,           // Google profile photo
  username: string,           // unique, user-chosen (3-20 chars, a-z0-9_-)
  usernameLower: string,      // lowercase version for uniqueness check
  usernameLastChanged: Timestamp,
  createdAt: Timestamp,
  lastSeen: Timestamp,
  stats: {
    totalPoints: number,
    gamesPlayed: number,
    gamesWon: number,
    // per-category stats
    football: { played: number, won: number, points: number },
    nba:      { played: number, won: number, points: number },
    wwe:      { played: number, won: number, points: number },
    music:    { played: number, won: number, points: number },
    f1:       { played: number, won: number, points: number },
    movies:   { played: number, won: number, points: number },
  }
}

### /usernames/{usernameLower}
{
  uid: string,        // owner's UID
  username: string,   // original-cased username
  createdAt: Timestamp
}
// This collection enforces uniqueness — one doc per username

### /leaderboard/{uid}
{
  uid: string,
  username: string,
  photoURL: string,
  totalPoints: number,
  gamesWon: number,
  gamesPlayed: number,
  updatedAt: Timestamp
}
// Denormalized copy for fast leaderboard queries

### /friends/{uid}/friendsList/{friendUid}
{
  uid: string,           // the friend's UID
  username: string,
  photoURL: string,
  status: 'pending' | 'accepted',
  direction: 'incoming' | 'outgoing',  // relative to this user
  since: Timestamp
}

### /friendRequests/{requestId}
{
  from: string,          // sender UID
  to: string,            // recipient UID
  fromUsername: string,
  toUsername: string,
  status: 'pending' | 'accepted' | 'declined',
  createdAt: Timestamp,
  updatedAt: Timestamp
}

### /gameHistory/{gameId}
{
  roomId: string,
  gameMode: string,        // e.g. "football-modern", "nba-legends"
  players: string[],       // array of UIDs
  scores: { [uid]: number },
  winner: string,          // UID of winner
  playedAt: Timestamp,
  duration: number         // seconds
}

## Security Rules requirements
- Users can only read/write their own /users/{uid} document
- /usernames/{usernameLower} can be created by authenticated users, but only if the document doesn't exist yet (to enforce uniqueness) and the uid matches their auth UID
- Username changes: only allow if usernameLastChanged is more than 30 days ago
- /leaderboard is readable by all authenticated users, writable only via Cloud Functions (or by the owning user but validate fields)
- /friends subcollection: readable only by the owner (uid matches auth)
- /friendRequests: readable by sender or recipient only
- /gameHistory: readable by any player listed in the players array

## Cloud Functions needed
1. onUserCreated(auth trigger): when a new user signs up, create their /users/{uid} doc with default stats
2. updateLeaderboard(Firestore trigger): when /users/{uid}/stats changes, sync to /leaderboard/{uid}
3. cleanupUsername(Firestore trigger): when a user changes username, delete the old /usernames/{old} doc and create /usernames/{new}

## Firebase Auth
- Enable Google Sign-In provider only (for now)
- Add authorized domains: localhost, the production Koyeb domain
- Explain the consent/scopes needed: profile, email

## Firestore Indexes needed
- /leaderboard: totalPoints DESC (for global leaderboard)
- /leaderboard: gamesWon DESC (for wins leaderboard)
- /friendRequests: to ASC + status ASC + createdAt DESC (for incoming requests)
- /friendRequests: from ASC + status ASC + createdAt DESC (for outgoing requests)
- /gameHistory: players array-contains + playedAt DESC (for per-user history)

## Environment variables I'll need (for Next.js .env.local and Koyeb)
List all NEXT_PUBLIC_FIREBASE_* variables needed.

Please generate:
1. firestore.rules (complete, production-ready)
2. firestore.indexes.json
3. functions/index.js (Cloud Functions, Node 18)
4. A step-by-step setup checklist (Firebase console clicks)
5. The 6 NEXT_PUBLIC_FIREBASE_* env var names and where to find each value
```
