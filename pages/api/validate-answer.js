import Anthropic from '@anthropic-ai/sdk';

// Ordered from most-specific (full key) to least-specific (base key)
const CATEGORY_LABELS = {
  // Football
  'football-modern': 'active professional football / soccer player (career 2015–present)',
  'football-icons':  'retired football / soccer legend (career pre-2015)',
  'football':        'professional football / soccer player',
  // NBA
  'nba-modern':  'current or recent NBA basketball player (2015–present)',
  'nba-legends': 'classic NBA basketball legend (pre-2015)',
  'nba':         'NBA basketball player',
  // WWE
  'wwe-golden':   'WWE wrestler from the Golden Era (1980s)',
  'wwe-attitude': 'WWE wrestler from the Attitude Era (1990s)',
  'wwe-ruthless': 'WWE wrestler from the Ruthless Aggression Era (2000s)',
  'wwe-pg':       'WWE wrestler from the PG Era (2008–2014)',
  'wwe-modern':   'WWE wrestler from the modern era (2015–present)',
  'wwe-all':      'WWE wrestler / superstar (any era)',
  'wwe':          'WWE wrestler / superstar',
  // Music — strict genre enforcement
  'music-hiphop':    'hip-hop or rap artist — REJECT pop, rock, R&B artists who are not primarily rappers',
  'music-pop':       'mainstream pop artist primarily known for pop music — REJECT rappers (e.g. Eminem, Drake, Kanye), rock artists, country artists, even if they have pop crossover songs',
  'music-rock':      'rock musician or band — REJECT rappers, pure pop artists, country artists',
  'music-rnb':       'R&B or soul artist — REJECT pure pop, rap, or rock artists',
  'music-edm':       'electronic / EDM artist or DJ — REJECT non-electronic artists',
  'music-latin':     'Latin pop or reggaeton artist — REJECT English-language pop or rap artists who are not primarily Latin music artists',
  'music-country':   'country or americana music artist — REJECT pop, rap, R&B artists',
  'music-kpop':      'K-Pop artist or group from South Korea — REJECT non-Korean artists',
  'music-afrobeats': 'afrobeats or afropop artist — REJECT non-African artists',
  'music':           'music artist',
  // F1
  'f1-legends': 'classic Formula 1 champion or driver (pre-2015)',
  'f1-modern':  'current Formula 1 driver (2015–present)',
  'f1':         'Formula 1 driver',
  // Movies
  'movies-classic': 'classic-era actor/actress primarily known for films before 1990',
  'movies-modern':  'contemporary actor/actress primarily known for films from 1990 onwards',
  'movies':         'movie actor or actress',
};

function getCategoryLabel(gameMode) {
  if (!gameMode) return 'sports or entertainment figure';
  const parts = gameMode.split('-');
  // Try type-subMode key first (e.g. 'music-pop' from 'music-pop-modern')
  if (parts.length >= 2) {
    const key2 = `${parts[0]}-${parts[1]}`;
    if (CATEGORY_LABELS[key2]) return CATEGORY_LABELS[key2];
  }
  // Fall back to base type
  return CATEGORY_LABELS[parts[0]] || 'sports or entertainment figure';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { input, letter, gameMode, candidates } = req.body;

  if (!input || !letter) return res.status(400).json({ error: 'Missing fields' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Claude API not configured' });
  }

  const categoryLabel = getCategoryLabel(gameMode);
  const candidateBlock = (candidates || [])
    .map(c => `  - "${c.name}" (match confidence: ${Math.round((1 - c.score) * 100)}%)`)
    .join('\n');

  const prompt = `You are the strict answer validator for an A-Z trivia game.
Category: ${categoryLabel}.

The player typed: "${input}"
Required starting letter: ${letter.toUpperCase()}

Top database candidates:
${candidateBlock || '  (none found by local search)'}

Task: Is "${input}" a valid ${categoryLabel} whose name starts with the letter "${letter.toUpperCase()}"?

Rules:
- Accept common nicknames, alternate spellings, partial names (surname only if unambiguous)
- Accept missing accents (e.g. "Modric" for "Modrić", "Fabregas" for "Fàbregas")
- Accept typos within ~2 characters (e.g. "Lewandowsky" for "Lewandowski")
- "isPartial" = true when spelling is noticeably off but clearly the right person (deserves half points)
- STRICTLY reject anyone who does not primarily belong to the exact category described — genre crossover does NOT make an artist valid (e.g. Eminem is a rapper, NOT a pop artist; reject for pop category)
- Reject if the name genuinely doesn't belong to a ${categoryLabel}
- Reject if starting letter doesn't match

Reply ONLY with valid JSON (no markdown fences):
{"valid": true, "matchedName": "Exact canonical name", "isPartial": false}
or
{"valid": false, "matchedName": null, "isPartial": false}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    // Strip any accidental markdown fences
    const cleaned = text.replace(/```(?:json)?/gi, '').trim();
    const result = JSON.parse(cleaned);

    // Basic sanity: ensure the returned name starts with the right letter
    if (result.valid && result.matchedName) {
      const firstChar = result.matchedName.trim()[0]?.toUpperCase();
      if (firstChar !== letter.toUpperCase()) {
        return res.json({ valid: false, matchedName: null, isPartial: false });
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('Claude validation error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
