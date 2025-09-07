import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { mode } = req.query;
  
  if (!mode || !['legacy', 'modern'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Use "legacy" or "modern"' });
  }
  
  try {
    // Read the refined database
    const filePath = path.join(process.cwd(), 'data', 'players', 'refined-database.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const database = JSON.parse(fileContent);
    
    // Extract players for the requested mode from all teams
    const allPlayers = [];
    
    Object.values(database).forEach(team => {
      if (team[mode]) {
        allPlayers.push(...team[mode]);
      }
    });
    
    res.status(200).json(allPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players data' });
  }
}