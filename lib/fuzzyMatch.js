import Fuse from 'fuse.js';

export class PlayerMatcher {
  constructor(players) {
    this.fuse = new Fuse(players, {
      threshold: 0.3, // 70% similarity required
      distance: 100,
      includeScore: true,
      minMatchCharLength: 2,
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
      const similarity = 1 - bestMatch.score; // Convert to similarity percentage
      
      return {
        found: similarity >= 0.7, // 70% similarity threshold
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
    .replace(/[^a-z\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const getFirstLetter = (name) => {
  const normalized = normalizePlayerName(name);
  return normalized.charAt(0).toUpperCase();
};