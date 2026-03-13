import fs from 'fs';
import path from 'path';

// ── Genre key → JSON key mapping ──────────────────────────────────────────────
const MUSIC_GENRE_MAP = {
  hiphop: 'Hip-Hop',
  pop: 'Pop',
  rock: 'Rock',
  rnb: 'R&B/Soul',
  edm: 'Electronic/EDM',
  latin: 'Latin',
  country: 'Country',
  kpop: 'K-Pop',
  afrobeats: 'Afrobeats',
};

// ── WWE era key → JSON key mapping ────────────────────────────────────────────
const WWE_ERA_MAP = {
  golden: 'Golden Era (1980s)',
  attitude: 'Attitude Era (1990s)',
  ruthless: 'Ruthless Aggression (2000s)',
  pg: 'PG Era (2008-2014)',
  modern: 'Modern (2015-present)',
};

function readJson(filename) {
  const filePath = path.join(process.cwd(), 'data', 'players', filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function dedup(arr) {
  return [...new Set(arr)].sort();
}

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { mode } = req.query;
  if (!mode) return res.status(400).json({ error: 'mode param required' });

  try {
    const players = resolvePlayers(mode);
    if (players === null) return res.status(400).json({ error: `Unknown mode: ${mode}` });
    console.log(`[players/${mode}] returning ${players.length} entries`);
    res.status(200).json(players);
  } catch (err) {
    console.error('players API error:', err);
    res.status(500).json({ error: 'Failed to fetch players', details: err.message });
  }
}

function resolvePlayers(mode) {
  const [type, ...rest] = mode.split('-');

  // ── Football ──────────────────────────────────────────────────────────────
  if (type === 'football' || type === 'icons' || type === 'legacy' || type === 'modern') {
    const db = readJson('refined-database.json');
    if (!db) return null;

    let dbKey;
    if (type === 'football') {
      // football-icons, football-modern
      dbKey = rest[0] === 'icons' || rest[0] === 'legacy' ? 'icons' : 'modern';
    } else {
      dbKey = type === 'legacy' ? 'icons' : type;
    }

    const all = [];
    Object.values(db).forEach(team => {
      if (team[dbKey] && Array.isArray(team[dbKey])) all.push(...team[dbKey]);
    });
    return dedup(all);
  }

  // ── NBA ───────────────────────────────────────────────────────────────────
  if (type === 'nba') {
    const db = readJson('nba.json');
    if (!db) return null;
    const era = rest[0]; // 'legends' | 'modern'
    const all = [];
    Object.values(db).forEach(team => {
      if (era) {
        if (team[era] && Array.isArray(team[era])) all.push(...team[era]);
      } else {
        // no era = all
        ['legends', 'modern'].forEach(k => { if (team[k]) all.push(...team[k]); });
      }
    });
    return dedup(all);
  }

  // ── WWE ───────────────────────────────────────────────────────────────────
  if (type === 'wwe') {
    const db = readJson('wwe.json');
    if (!db) return null;
    const eraKey = rest[0]; // 'golden'|'attitude'|'ruthless'|'pg'|'modern'|'all'|undefined

    if (!eraKey || eraKey === 'all') {
      return dedup(Object.values(db).flat());
    }
    const eraLabel = WWE_ERA_MAP[eraKey];
    if (!eraLabel || !db[eraLabel]) return null;
    return dedup(db[eraLabel]);
  }

  // ── Music ─────────────────────────────────────────────────────────────────
  if (type === 'music') {
    const db = readJson('music.json');
    if (!db) return null;
    const genreKey = rest[0]; // e.g. 'hiphop', 'pop'
    const eraKey = rest[1];   // 'classic' | 'modern' | undefined

    if (!genreKey || genreKey === 'all') {
      // All genres, all eras
      const all = [];
      Object.values(db).forEach(genre => {
        ['classic', 'modern'].forEach(k => { if (genre[k]) all.push(...genre[k]); });
      });
      return dedup(all);
    }

    const genreLabel = MUSIC_GENRE_MAP[genreKey];
    if (!genreLabel || !db[genreLabel]) return null;

    if (!eraKey) {
      // All eras of this genre
      const all = [];
      ['classic', 'modern'].forEach(k => { if (db[genreLabel][k]) all.push(...db[genreLabel][k]); });
      return dedup(all);
    }

    if (!db[genreLabel][eraKey]) return null;
    return dedup(db[genreLabel][eraKey]);
  }

  // ── F1 ────────────────────────────────────────────────────────────────────
  if (type === 'f1') {
    const db = readJson('f1.json');
    if (!db) return null;
    const era = rest[0]; // 'legends' | 'modern'
    const all = [];
    Object.values(db).forEach(team => {
      if (era) {
        if (team[era] && Array.isArray(team[era])) all.push(...team[era]);
      } else {
        ['legends', 'modern'].forEach(k => { if (team[k]) all.push(...team[k]); });
      }
    });
    return dedup(all);
  }

  // ── Movies ────────────────────────────────────────────────────────────────
  if (type === 'movies') {
    const db = readJson('movies.json');
    if (!db) return null;
    const era = rest[0]; // 'classic' | 'modern'
    const all = [];
    Object.values(db).forEach(cat => {
      if (era) {
        if (cat[era] && Array.isArray(cat[era])) all.push(...cat[era]);
      } else {
        ['classic', 'modern'].forEach(k => { if (cat[k]) all.push(...cat[k]); });
      }
    });
    return dedup(all);
  }

  return null;
}
