export const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const calculateTimerColor = (timeLeft, totalTime) => {
  const percentage = timeLeft / totalTime;
  if (percentage > 0.6) return '#48bb78'; // Green
  if (percentage > 0.3) return '#fd9801'; // Orange
  return '#e53e3e'; // Red
};

export const formatPlayerStats = (player, gameState) => {
  const totalRounds = gameState.currentLetterIndex;
  const playerAnswers = gameState.roundHistory?.filter(round => 
    round.answers[player]?.valid
  ) || [];
  
  return {
    correctAnswers: playerAnswers.length,
    accuracy: totalRounds > 0 ? (playerAnswers.length / totalRounds * 100).toFixed(1) : 0,
    averageResponseTime: 0, // Could implement timing tracking
    bestLetters: playerAnswers.map(round => round.letter).slice(0, 3)
  };
};

export const getGameModeInfo = (mode) => {
  const modes = {
    legacy: {
      name: 'Legacy',
      description: 'Legendary players from 1990-2014',
      icon: '🏆',
      era: '1990-2014',
      examples: ['Messi', 'Ronaldinho', 'Henry', 'Zidane']
    },
    modern: {
      name: 'Modern',
      description: 'Current stars from 2015-present',
      icon: '⚡',
      era: '2015+',
      examples: ['Mbappé', 'Haaland', 'Bellingham', 'Vini Jr']
    }
  };
  
  return modes[mode] || modes.modern;
};