const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ── 1. onUserCreated ────────────────────────────────────────────────────────
// Fires when a new Google Sign-In user is created.
// Creates their /users/{uid} doc with default stats.
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, displayName, email, photoURL } = user;

  const defaultStats = {
    totalPoints: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    football: { played: 0, won: 0, points: 0 },
    nba:      { played: 0, won: 0, points: 0 },
    wwe:      { played: 0, won: 0, points: 0 },
    music:    { played: 0, won: 0, points: 0 },
    f1:       { played: 0, won: 0, points: 0 },
    movies:   { played: 0, won: 0, points: 0 },
  };

  await db.doc(`users/${uid}`).set({
    uid,
    displayName: displayName || '',
    email: email || '',
    photoURL: photoURL || '',
    username: '',          // user must choose a unique username after sign-up
    usernameLower: '',
    usernameLastChanged: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    stats: defaultStats,
  });

  functions.logger.info(`Created user doc for ${uid} (${email})`);
});

// ── 2. updateLeaderboard ────────────────────────────────────────────────────
// Fires whenever /users/{uid} is written.
// Syncs the denormalised /leaderboard/{uid} doc for fast leaderboard queries.
exports.updateLeaderboard = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const { uid } = context.params;

    // Document was deleted — remove from leaderboard
    if (!change.after.exists) {
      await db.doc(`leaderboard/${uid}`).delete();
      return;
    }

    const data = change.after.data();
    const stats = data.stats || {};

    await db.doc(`leaderboard/${uid}`).set({
      uid,
      username: data.username || '',
      photoURL: data.photoURL || '',
      totalPoints: stats.totalPoints || 0,
      gamesWon: stats.gamesWon || 0,
      gamesPlayed: stats.gamesPlayed || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

// ── 3. cleanupUsername ──────────────────────────────────────────────────────
// Fires when /users/{uid} is updated.
// If username changed: deletes the old /usernames/{old} doc and creates the new one.
exports.cleanupUsername = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const { uid } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    const oldUsernameLower = (before.usernameLower || '').trim();
    const newUsernameLower = (after.usernameLower || '').trim();

    if (!newUsernameLower || oldUsernameLower === newUsernameLower) return;

    const batch = db.batch();

    // Delete the old username reservation (if it existed)
    if (oldUsernameLower) {
      batch.delete(db.doc(`usernames/${oldUsernameLower}`));
    }

    // Create the new username reservation
    batch.set(db.doc(`usernames/${newUsernameLower}`), {
      uid,
      username: after.username || after.usernameLower,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    functions.logger.info(`Username changed: ${oldUsernameLower} → ${newUsernameLower} for ${uid}`);
  });
