import Anthropic from '@anthropic-ai/sdk';

const CATEGORY_LABELS = {
  football: 'football player (soccer)',
  nba:      'NBA basketball player',
  wwe:      'WWE wrestler / superstar',
  music:    'music artist / musician',
  f1:       'Formula 1 driver',
  movies:   'movie actor / actress',
};

function getCategoryLabel(gameMode) {
  const type = (gameMode || 'football').split('-')[0];
  return CATEGORY_LABELS[type] || 'sports or entertainment figure';
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

  const prompt = `You are the answer validator for an A-Z trivia game. Category: ${categoryLabel}.

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
