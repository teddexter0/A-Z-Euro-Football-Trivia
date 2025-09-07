import { Server } from 'socket.io';

const gameRooms = new Map();
const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

// Helper function to normalize player names
const normalizePlayerName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Enhanced server-side validation
const validateAnswerOnServer = (input, letter, usedPlayers) => {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    return { valid: false, reason: 'empty' };
  }
  
  if (!trimmedInput.toLowerCase().startsWith(letter.toLowerCase())) {
    return { valid: false, reason: 'wrong_letter' };
  }
  
  const normalizedInput = normalizePlayerName(trimmedInput);
  
  // Enhanced duplicate checking
  const isAlreadyUsed = usedPlayers?.some(usedPlayer => {
    const normalizedUsed = normalizePlayerName(usedPlayer);
    
    // Exact match
    if (normalizedUsed === normalizedInput) return true;
    
    // Word-level conflict detection (Henry vs Thierry Henry)
    if (normalizedUsed.length > 3 && normalizedInput.length > 3) {
      const words1 = normalizedUsed.split(' ');
      const words2 = normalizedInput.split(' ');
      
      // If any significant word appears in both, consider it a conflict
      return words1.some(word1 => 
        words2.some(word2 => 
          word1.length > 2 && word2.length > 2 && 
          (word1.includes(word2) || word2.includes(word1))
        )
      );
    }
    
    return false;
  });
  
  if (isAlreadyUsed) {
    return { valid: false, reason: 'already_used' };
  }
  
  // Basic server-side player validation
  // This is a simplified check - in production you'd load the full database
  const commonPlayerNames = [
    'thierry henry', 'henry', 'sol campbell', 'campbell', 'wilshere', 'jack wilshere',
    'maldini', 'paolo maldini', 'pires', 'robert pires', 'vidic', 'nemanja vidic',
    'ibrahimovic', 'zlatan ibrahimovic', 'park', 'ji sung park', 'eze', 'eberechi eze',
    // Add more as needed...
  ];
  
  const normalizedCommonNames = commonPlayerNames.map(name => normalizePlayerName(name));
  
  const isValidPlayer = normalizedCommonNames.some(playerName => {
    const playerWords = playerName.split(' ');
    const inputWords = normalizedInput.split(' ');
    
    // Check if input matches any part of known player names
    return playerWords.some(word => inputWords.includes(word)) ||
           inputWords.some(word => playerWords.includes(word)) ||
           playerName.includes(normalizedInput) ||
           normalizedInput.includes(playerName);
  });
  
  return { valid: isValidPlayer, matchedPlayer: trimmedInput };
};

export default function SocketHandler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (res.socket.server.io) {
    console.log('✅ Socket.io already running');
    res.end();
    return;
  }

  console.log('🚀 Starting Socket.io server for Railway...');
  
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false
    },
    transports: ['polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: false,
    serveClient: false
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('✅ Player connected:', socket.id);
    
    socket.emit('connection-confirmed', { 
      status: 'connected',
      id: socket.id,
      message: 'Connected to Railway!'
    });

    socket.on('join-room', (data) => {
      try {
        const { roomId, playerName } = data;
        console.log(`👤 ${playerName} joining room ${roomId}`);
        
        if (!gameRooms.has(roomId)) {
          gameRooms.set(roomId, {
            id: roomId,
            players: {},
            scores: {},
            currentLetter: 'A',
            currentLetterIndex: 0,
            usedPlayers: [],
            roundAnswers: {},
            timer: 30,
            isActive: false,
            gameMode: 'modern',
            winner: null,
            timerInterval: null
          });
          console.log(`🏠 Created room: ${roomId}`);
        }
        
        const room = gameRooms.get(roomId);
        room.players[playerName] = { id: socket.id };
        
        if (!room.scores[playerName]) {
          room.scores[playerName] = 0;
        }
        
        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.playerName = playerName;
        
        socket.emit('join-confirmed', {
          roomId,
          playerName,
          playersCount: Object.keys(room.players).length
        });
        
        io.to(roomId).emit('game-state-update', {
          players: room.players,
          scores: room.scores,
          currentLetter: room.currentLetter,
          currentLetterIndex: room.currentLetterIndex,
          usedPlayers: room.usedPlayers,
          roundAnswers: room.roundAnswers,
          timer: room.timer,
          isActive: room.isActive,
          gameMode: room.gameMode,
          winner: room.winner
        });
        
        console.log(`📊 Room ${roomId}: ${Object.keys(room.players).length} players`);
        
      } catch (error) {
        console.error('❌ Error in join-room:', error);
        socket.emit('error-message', { message: 'Failed to join room' });
      }
    });

    socket.on('start-game', ({ roomId }) => {
      try {
        console.log(`🎮 Starting game in room: ${roomId}`);
        const room = gameRooms.get(roomId);
        
        if (!room) {
          socket.emit('error-message', { message: 'Room not found' });
          return;
        }
        
        if (room.isActive) {
          socket.emit('error-message', { message: 'Game already active' });
          return;
        }
        
        const playerCount = Object.keys(room.players).length;
        if (playerCount < 1) {
          socket.emit('error-message', { message: 'Need at least 1 player' });
          return;
        }
        
        // Reset game
        room.isActive = true;
        room.timer = 30;
        room.roundAnswers = {};
        room.currentLetter = 'A';
        room.currentLetterIndex = 0;
        room.usedPlayers = []; // Reset used players
        
        console.log(`✅ Game started in ${roomId} with ${playerCount} players`);
        
        io.to(roomId).emit('game-started', {
          message: 'Game started!',
          currentLetter: room.currentLetter,
          timer: room.timer
        });
        
        io.to(roomId).emit('game-state-update', {
          players: room.players,
          scores: room.scores,
          currentLetter: room.currentLetter,
          currentLetterIndex: room.currentLetterIndex,
          usedPlayers: room.usedPlayers,
          roundAnswers: room.roundAnswers,
          timer: room.timer,
          isActive: room.isActive,
          gameMode: room.gameMode,
          winner: room.winner
        });
        
        // Start timer
        startTimer(roomId);
        
      } catch (error) {
        console.error('❌ Error starting game:', error);
        socket.emit('error-message', { message: 'Failed to start game' });
      }
    });

    // Enhanced submit-answer handler with server-side validation
    socket.on('submit-answer', ({ roomId, playerName, answer, isValid, points, matchedPlayer }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room || !room.isActive) {
          socket.emit('error-message', { message: 'Game not active' });
          return;
        }
        
        // Server-side validation to prevent cheating and ensure consistency
        const serverValidation = validateAnswerOnServer(answer, room.currentLetter, room.usedPlayers);
        const finalIsValid = isValid && serverValidation.valid;
        
        console.log(`📝 ${playerName} submitted: "${answer}"`);
        console.log(`   Client validation: ${isValid}`);
        console.log(`   Server validation: ${serverValidation.valid} (reason: ${serverValidation.reason || 'valid'})`);
        console.log(`   Final result: ${finalIsValid}`);
        
        room.roundAnswers[playerName] = { 
          answer, 
          isValid: finalIsValid, 
          points: finalIsValid ? points : 0,
          matchedPlayer: serverValidation.matchedPlayer || matchedPlayer
        };
        
        const totalPlayers = Object.keys(room.players).length;
        const submittedPlayers = Object.keys(room.roundAnswers).length;
        
        io.to(roomId).emit('player-answered', { playerName, answered: true });
        
        if (submittedPlayers >= totalPlayers) {
          completeRound(roomId);
        }
        
      } catch (error) {
        console.error('❌ Error submitting answer:', error);
        socket.emit('error-message', { message: 'Failed to submit answer' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`👋 Player disconnected: ${socket.id} (${reason})`);
      handleDisconnect(socket);
    });

    function startTimer(roomId) {
      const room = gameRooms.get(roomId);
      if (!room || !room.isActive) return;
      
      // Clear any existing timer
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
      }
      
      console.log(`⏰ Starting timer for room ${roomId}`);
      
      room.timerInterval = setInterval(() => {
        const currentRoom = gameRooms.get(roomId);
        if (!currentRoom || !currentRoom.isActive) {
          clearInterval(room.timerInterval);
          return;
        }
        
        currentRoom.timer--;
        io.to(roomId).emit('timer-update', { timer: currentRoom.timer });
        
        if (currentRoom.timer <= 0) {
          clearInterval(currentRoom.timerInterval);
          completeRound(roomId);
        }
      }, 1000);
    }

    // Enhanced completeRound function with better duplicate prevention
    function completeRound(roomId) {
      const room = gameRooms.get(roomId);
      if (!room) return;
      
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      
      console.log(`🏁 Completing round ${room.currentLetter} in room ${roomId}`);
      
      // Get valid answers
      const validAnswers = Object.entries(room.roundAnswers).filter(([, data]) => data.isValid);
      const points = LETTER_SCORES[room.currentLetter];
      
      console.log(`📊 Round ${room.currentLetter} results:`, {
        totalAnswers: Object.keys(room.roundAnswers).length,
        validAnswers: validAnswers.length,
        answers: room.roundAnswers
      });
      
      if (validAnswers.length > 0) {
        const pointsPerPlayer = Math.floor(points / validAnswers.length);
        validAnswers.forEach(([playerName]) => {
          room.scores[playerName] += pointsPerPlayer;
        });
        
        // Enhanced used players tracking with conflict prevention
        validAnswers.forEach(([, data]) => {
          if (data.answer) {
            const normalizedAnswer = normalizePlayerName(data.answer);
            
            // Check if this normalized answer conflicts with existing ones
            const wouldConflict = room.usedPlayers.some(usedPlayer => {
              const normalizedUsed = normalizePlayerName(usedPlayer);
              
              // Exact match
              if (normalizedUsed === normalizedAnswer) return true;
              
              // Word-level conflict detection
              if (normalizedUsed.length > 3 && normalizedAnswer.length > 3) {
                const words1 = normalizedUsed.split(' ');
                const words2 = normalizedAnswer.split(' ');
                
                return words1.some(word1 => 
                  words2.some(word2 => 
                    word1.length > 2 && word2.length > 2 && 
                    (word1.includes(word2) || word2.includes(word1))
                  )
                );
              }
              
              return false;
            });
            
            if (!wouldConflict) {
              room.usedPlayers.push(normalizedAnswer);
              console.log(`✅ Added to used players: "${normalizedAnswer}"`);
            } else {
              console.log(`⚠️ Skipped adding "${normalizedAnswer}" - conflicts with existing player`);
            }
          }
        });
      }
      
      room.isActive = false;
      
      console.log(`📤 Sending round results for room ${roomId}`);
      io.to(roomId).emit('round-complete', {
        answers: room.roundAnswers,
        scores: room.scores,
        usedPlayers: room.usedPlayers
      });
      
      // Auto-advance to next round
      setTimeout(() => {
        const currentRoom = gameRooms.get(roomId);
        if (!currentRoom) return;
        
        if (currentRoom.currentLetterIndex >= 25) {
          // Game complete
          const winner = Object.entries(currentRoom.scores)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
          currentRoom.winner = winner;
          
          io.to(roomId).emit('game-complete', { 
            winner, 
            scores: currentRoom.scores 
          });
          
          console.log(`🏆 Game completed in ${roomId}, winner: ${winner}`);
        } else {
          // Next letter
          currentRoom.currentLetterIndex++;
          currentRoom.currentLetter = String.fromCharCode(65 + currentRoom.currentLetterIndex);
          currentRoom.roundAnswers = {};
          currentRoom.timer = 30;
          currentRoom.isActive = true;
          
          console.log(`🔄 Starting round ${currentRoom.currentLetter} in room ${roomId}`);
          
          io.to(roomId).emit('new-round', { 
            letter: currentRoom.currentLetter, 
            letterIndex: currentRoom.currentLetterIndex 
          });
          
          startTimer(roomId);
        }
      }, 3000);
    }

    function handleDisconnect(socket) {
      const { currentRoom, playerName } = socket;
      if (!currentRoom || !playerName) return;
      
      const room = gameRooms.get(currentRoom);
      if (!room) return;
      
      delete room.players[playerName];
      
      io.to(currentRoom).emit('player-left', { playerName });
      
      if (Object.keys(room.players).length === 0) {
        if (room.timerInterval) {
          clearInterval(room.timerInterval);
        }
        gameRooms.delete(currentRoom);
        console.log(`🗑️ Deleted empty room: ${currentRoom}`);
      } else {
        io.to(currentRoom).emit('game-state-update', {
          players: room.players,
          scores: room.scores,
          currentLetter: room.currentLetter,
          currentLetterIndex: room.currentLetterIndex,
          usedPlayers: room.usedPlayers,
          roundAnswers: room.roundAnswers,
          timer: room.timer,
          isActive: room.isActive,
          gameMode: room.gameMode,
          winner: room.winner
        });
      }
    }
  });

  console.log('✅ Socket.io server initialized successfully for Railway');
  res.end();
}