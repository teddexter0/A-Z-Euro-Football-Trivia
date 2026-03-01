
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { mode } = req.query;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (!mode || !['icons', 'legacy', 'modern'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Use "icons" or "modern"' });
  }

  // 'legacy' is kept as a backwards-compatible alias for 'icons'
  const dbKey = mode === 'legacy' ? 'icons' : mode;

  try {
    // Read the refined database
    const filePath = path.join(process.cwd(), 'data', 'players', 'refined-database.json');

    if (!fs.existsSync(filePath)) {
      console.error('Database file not found:', filePath);
      return res.status(500).json({ error: 'Player database not found' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const database = JSON.parse(fileContent);

    // Extract players for the requested mode from all clubs
    const allPlayers = [];

    Object.values(database).forEach(team => {
      if (team[dbKey] && Array.isArray(team[dbKey])) {
        allPlayers.push(...team[dbKey]);
      }
    });
    
    // Remove duplicates and sort
    const uniquePlayers = [...new Set(allPlayers)].sort();
    
    console.log(`Returning ${uniquePlayers.length} unique players for ${dbKey} mode`);
    
    res.status(200).json(uniquePlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players data', details: error.message });
  }
}