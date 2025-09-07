import { Server } from 'socket.io';

const gameRooms = new Map();
const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const SocketHandler = (req, res) => {
  console.log('🚀 Socket.io API called:', req.method, req.url);

  if (res.socket.server.io) {
    console.log('✅ Socket.io already running');
    res.end();
    return;
  }

  console.log('🔄 Starting Socket.io server...');
  
  
const io = new Server(res.socket.server, {
  path: '/api/socketio',
  addTrailingSlash: false,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling'], // ONLY polling
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  allowRequest: (req, callback) => {
    callback(null, true);
  }
});

  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('✅ Player connected:', socket.id);
    
    socket.emit('connection-confirmed', { 
      status: 'connected',
      id: socket.id,
      message: 'Connected successfully!' 
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
            winner: null
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
          points: isValid ? points : 0 
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
  });

  function startTimer(roomId) {
    const room = gameRooms.get(roomId);
    if (!room || !room.isActive) return;
    
    console.log(`⏰ Starting timer for room ${roomId}`);
    
    const interval = setInterval(() => {
      const currentRoom = gameRooms.get(roomId);
      if (!currentRoom || !currentRoom.isActive) {
        clearInterval(interval);
        return;
      }
      
      currentRoom.timer--;
      io.to(roomId).emit('timer-update', { timer: currentRoom.timer });
      
      if (currentRoom.timer <= 0) {
        clearInterval(interval);
        completeRound(roomId);
      }
    }, 1000);
    
    room.timerInterval = interval;
  }

  function completeRound(roomId) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    
    console.log(`🏁 Completing round ${room.currentLetter} in room ${roomId}`);
    
    // Calculate scores
    const validAnswers = Object.entries(room.roundAnswers).filter(([, data]) => data.isValid);
    const points = LETTER_SCORES[room.currentLetter];
    
    if (validAnswers.length > 0) {
      const pointsPerPlayer = Math.floor(points / validAnswers.length);
      validAnswers.forEach(([playerName]) => {
        room.scores[playerName] += pointsPerPlayer;
      });
      
      validAnswers.forEach(([, data]) => {
        if (data.answer && !room.usedPlayers.includes(data.answer.toLowerCase())) {
          room.usedPlayers.push(data.answer.toLowerCase());
        }
      });
    }
    
    room.isActive = false;
    
    io.to(roomId).emit('round-complete', {
      answers: room.roundAnswers,
      scores: room.scores,
      usedPlayers: room.usedPlayers
    });
    
    // Next round
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
        
        io.to(roomId).emit('new-round', { 
          letter: currentRoom.currentLetter, 
          letterIndex: currentRoom.currentLetterIndex 
        });
        
        startTimer(roomId);
        console.log(`🔄 Started round ${currentRoom.currentLetter} in room ${roomId}`);
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

  console.log('✅ Socket.io server initialized successfully');
  res.end();
};

export default SocketHandler;