// pages/api/socketio.js - VERCEL OPTIMIZED VERSION
import { Server } from 'socket.io';

// In-memory storage for Vercel (will reset on function restart)
let gameRooms = new Map();
let io = null;

const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('♻️ Socket.io already running');
    res.end();
    return;
  }

  console.log('🚀 Starting Socket.io server on Vercel...');
  
  // Configure Socket.io for Vercel
  io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Force polling transport for Vercel compatibility
    transports: ['polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    allowRequest: (req, callback) => {
      callback(null, true);
    }
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    // Send immediate connection confirmation
    socket.emit('connection-status', { 
      status: 'connected', 
      message: 'Connected to Vercel server',
      transport: socket.conn.transport.name 
    });

    socket.on('join-room', (data) => {
      try {
        const { roomId, playerName } = data;
        console.log(`👤 ${playerName} joining room ${roomId}`);
        
        // Create room if doesn't exist
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
            createdAt: Date.now(),
            lastActivity: Date.now()
          });
          console.log(`🏠 Created room: ${roomId}`);
        }
        
        const room = gameRooms.get(roomId);
        room.players[playerName] = { 
          id: socket.id, 
          joinedAt: Date.now(),
          lastSeen: Date.now()
        };
        
        if (!room.scores[playerName]) {
          room.scores[playerName] = 0;
        }
        
        room.lastActivity = Date.now();
        
        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.playerName = playerName;
        
        // Send immediate confirmation
        socket.emit('join-confirmed', {
          roomId,
          playerName,
          playersCount: Object.keys(room.players).length
        });
        
        // Broadcast updated game state
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
        
        // Reset game state
        room.isActive = true;
        room.timer = 30;
        room.roundAnswers = {};
        room.currentLetter = 'A';
        room.currentLetterIndex = 0;
        room.lastActivity = Date.now();
        
        console.log(`✅ Game started in ${roomId} with ${playerCount} players`);
        
        // Notify all players
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
        
        // Start timer with setInterval (works on Vercel)
        startGameTimer(roomId);
        
      } catch (error) {
        console.error('❌ Error starting game:', error);
        socket.emit('error-message', { message: 'Failed to start game' });
      }
    });

    socket.on('submit-answer', ({ roomId, playerName, answer, isValid, points }) => {
      try {
        const room = gameRooms.get(roomId);
        if (!room || !room.isActive) {
          socket.emit('error-message', { message: 'Game not active' });
          return;
        }
        
        console.log(`📝 ${playerName} submitted: "${answer}" (valid: ${isValid})`);
        
        room.roundAnswers[playerName] = { 
          answer, 
          isValid, 
          points: isValid ? points : 0,
          submittedAt: Date.now()
        };
        
        room.lastActivity = Date.now();
        
        // Check if all players submitted
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
      console.log(`👋 Client disconnected: ${socket.id} (${reason})`);
      handlePlayerDisconnect(socket);
    });

    socket.on('ping-room', ({ roomId }) => {
      const room = gameRooms.get(roomId);
      if (room) {
        room.lastActivity = Date.now();
        socket.emit('pong-room', { status: 'alive' });
      }
    });
  });

  // Timer function for Vercel
  function startGameTimer(roomId) {
    const room = gameRooms.get(roomId);
    if (!room || !room.isActive) return;
    
    console.log(`⏰ Starting timer for room ${roomId}`);
    
    const timerInterval = setInterval(() => {
      const currentRoom = gameRooms.get(roomId);
      if (!currentRoom || !currentRoom.isActive) {
        clearInterval(timerInterval);
        return;
      }
      
      currentRoom.timer--;
      currentRoom.lastActivity = Date.now();
      
      // Broadcast timer update
      io.to(roomId).emit('timer-update', { timer: currentRoom.timer });
      
      if (currentRoom.timer <= 0) {
        clearInterval(timerInterval);
        completeRound(roomId);
      }
    }, 1000);
    
    // Store interval reference
    room.timerInterval = timerInterval;
  }

  function completeRound(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    // Stop timer
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    
    console.log(`🏁 Completing round ${room.currentLetter} in room ${roomId}`);
    
    // Calculate scores
    const validAnswers = Object.entries(room.roundAnswers).filter(([_, data]) => data.isValid);
    const points = LETTER_SCORES[room.currentLetter];
    
    // Award points
    if (validAnswers.length > 0) {
      const pointsPerPlayer = Math.floor(points / validAnswers.length);
      validAnswers.forEach(([playerName]) => {
        room.scores[playerName] += pointsPerPlayer;
      });
      
      // Track used players
      validAnswers.forEach(([_, data]) => {
        if (data.answer && !room.usedPlayers.includes(data.answer.toLowerCase())) {
          room.usedPlayers.push(data.answer.toLowerCase());
        }
      });
    }
    
    room.isActive = false;
    room.lastActivity = Date.now();
    
    // Send round results
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
        currentRoom.lastActivity = Date.now();
        
        io.to(roomId).emit('new-round', { 
          letter: currentRoom.currentLetter, 
          letterIndex: currentRoom.currentLetterIndex 
        });
        
        startGameTimer(roomId);
        console.log(`🔄 Started round ${currentRoom.currentLetter} in room ${roomId}`);
      }
    }, 3000);
  }

  function handlePlayerDisconnect(socket) {
    const { currentRoom, playerName } = socket;
    if (!currentRoom || !playerName) return;
    
    const room = gameRooms.get(currentRoom);
    if (!room) return;
    
    delete room.players[playerName];
    room.lastActivity = Date.now();
    
    io.to(currentRoom).emit('player-left', { playerName });
    
    if (Object.keys(room.players).length === 0) {
      // Clean up empty room
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

  // Cleanup old rooms (memory management for Vercel)
  setInterval(() => {
    const now = Date.now();
    const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [roomId, room] of gameRooms.entries()) {
      if (now - room.lastActivity > ROOM_TIMEOUT) {
        if (room.timerInterval) {
          clearInterval(room.timerInterval);
        }
        gameRooms.delete(roomId);
        console.log(`🧹 Cleaned up inactive room: ${roomId}`);
      }
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  console.log('✅ Socket.io server initialized for Vercel');
  res.end();
};

export default SocketHandler;

// Export config for Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};