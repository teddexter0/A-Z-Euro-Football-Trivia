import Fuse from 'fuse.js';

export class PlayerMatcher {
  constructor(players) {
    this.fuse = new Fuse(players, {
      threshold: 0.55,
      distance: 200,
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      keys: [
        { name: 'name', weight: 1.0 }
      ]
    });
  }

  findMatch(input) {
    if (!input || input.length < 2) {
      return { found: false, match: null, similarity: 0 };
    }

    const results = this.fuse.search(input);

    if (results.length > 0) {
      const bestMatch = results[0];
      const similarity = 1 - bestMatch.score;

      return {
        found: similarity >= 0.7,
        match: bestMatch.item,
        similarity: similarity,
        allMatches: results.map(r => ({
          player: r.item,
          similarity: 1 - r.score
        }))
      };
    }

    return { found: false, match: null, similarity: 0 };
  }
}

export const normalizePlayerName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getFirstLetter = (name) => {
  const normalized = normalizePlayerName(name);
  return normalized.charAt(0).toUpperCase();
};

// ── Levenshtein helpers ───────────────────────────────────────────────────────

/**
 * Classic dynamic-programming Levenshtein distance between two strings.
 */
export function levenshteinDistance(a, b) {
  const m = a.length, n = b.length;
  // Build (m+1) x (n+1) grid initialised with base cases
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * How many edits to allow for a given input length:
 * 1 edit per 4 chars, minimum 1.
 * e.g. "Ronaldo" (7) → 1 edit, "Lewandowsky" (11) → 2 edits
 */
export function editTolerance(str) {
  return Math.max(1, Math.floor(str.length / 4));
}

/**
 * Returns true if `normalizedInput` fuzzy-matches any word in `normalizedName`.
 *
 * Three passes (any one passing = match accepted):
 *   1. Exact prefix   — "ron"    matches "ronaldo" in "cristiano ronaldo"
 *   2. Full-word edit — "neymar" with tol=1 matches "neymarr" typed by user
 *   3. Prefix edit    — "benzem" (len≥4) with small tol matches "benzema"
 */
export function wordFuzzyMatch(normalizedName, normalizedInput) {
  // 0. Full-name exact/near-exact match (handles "Ariana Grande" typed in full)
  if (normalizedName === normalizedInput) return true;
  if (normalizedInput.includes(' ')) {
    // Typed multiple words: accept if it's a close match for the whole name
    const fullTol = Math.max(2, Math.floor(normalizedInput.length / 5));
    if (levenshteinDistance(normalizedName, normalizedInput) <= fullTol) return true;
    // Or if input is a contiguous substring of the name (handles partial multi-word)
    if (normalizedName.includes(normalizedInput)) return true;
  }

  const words = normalizedName.split(' ');
  const tol = editTolerance(normalizedInput);

  return words.some(word => {
    // 1. Exact prefix (zero-cost short inputs)
    if (word.startsWith(normalizedInput)) return true;

    // 2. Full-word Levenshtein — handles transpositions, double letters, etc.
    if (levenshteinDistance(word, normalizedInput) <= tol) return true;

    // 3. Prefix Levenshtein — user typed most of a long surname (≥ 4 chars)
    if (normalizedInput.length >= 4) {
      const prefixTol = Math.max(1, Math.floor(normalizedInput.length / 5));
      const wordPrefix = word.slice(0, normalizedInput.length);
      if (levenshteinDistance(wordPrefix, normalizedInput) <= prefixTol) return true;
    }

    return false;
  });
}