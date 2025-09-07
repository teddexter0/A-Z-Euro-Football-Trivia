import { Server } from 'socket.io';

const gameRooms = new Map();
const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket.io already running');
  } else {
    console.log('Starting Socket.io server...');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('join-room', (data) => {
        try {
          const { roomId, playerName } = data;
          
          if (!gameRooms.has(roomId)) {
            gameRooms.set(roomId, {
              players: {},
              scores: {},
              currentLetter: 'A',
              currentLetterIndex: 0,
              usedPlayers: [],
              roundAnswers: {},
              timer: 30,
              isActive: false,
              gameMode: 'legacy',
              winner: null,
              timerInterval: null // Track timer instance
            });
          }
          
          const room = gameRooms.get(roomId);
          room.players[playerName] = { id: socket.id };
          if (!room.scores[playerName]) {
            room.scores[playerName] = 0;
          }
          
          socket.join(roomId);
          io.to(roomId).emit('game-state-update', room);
          
          console.log(`Room ${roomId} now has ${Object.keys(room.players).length} players`);
        } catch (error) {
          console.error('Error in join-room:', error);
        }
      });

      socket.on('start-game', ({ roomId }) => {
        try {
          const room = gameRooms.get(roomId);
          if (room && !room.isActive) {
            // Clear any existing timer first
            if (room.timerInterval) {
              clearInterval(room.timerInterval);
              room.timerInterval = null;
            }
            
            room.isActive = true;
            room.timer = 30;
            room.roundAnswers = {};
            
            startTimer(io, roomId);
            io.to(roomId).emit('game-state-update', room);
            console.log(`Game started in room ${roomId}`);
          }
        } catch (error) {
          console.error('Error in start-game:', error);
        }
      });

      socket.on('submit-answer', ({ roomId, playerName, answer, isValid, points }) => {
        try {
          const room = gameRooms.get(roomId);
          if (!room || !room.isActive) return;
          
          room.roundAnswers[playerName] = { answer, isValid, points: isValid ? points : 0 };
          
          // Check if all players submitted
          const totalPlayers = Object.keys(room.players).length;
          const submittedPlayers = Object.keys(room.roundAnswers).length;
          
          io.to(roomId).emit('player-answered', { playerName, answered: true });
          
          if (submittedPlayers >= totalPlayers) {
            completeRound(io, roomId);
          }
        } catch (error) {
          console.error('Error in submit-answer:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove player from all rooms
        for (const [roomId, room] of gameRooms.entries()) {
          for (const [playerName, playerData] of Object.entries(room.players)) {
            if (playerData.id === socket.id) {
              delete room.players[playerName];
              
              // Notify remaining players
              io.to(roomId).emit('player-left', { playerName });
              
              // If room becomes empty or has only 1 player, end game
              if (Object.keys(room.players).length <= 1) {
                if (room.timerInterval) {
                  clearInterval(room.timerInterval);
                }
                io.to(roomId).emit('game-ended', { reason: 'Not enough players' });
                gameRooms.delete(roomId);
                console.log(`Room ${roomId} deleted - not enough players`);
              } else {
                io.to(roomId).emit('game-state-update', room);
              }
              break;
            }
          }
        }
      });
    });

    function startTimer(io, roomId) {
      const room = gameRooms.get(roomId);
      if (!room) return;
      
      // Clear any existing timer first
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
      }
      
      console.log(`Starting timer for room ${roomId} at ${room.timer} seconds`);
      
      room.timerInterval = setInterval(() => {
        const currentRoom = gameRooms.get(roomId);
        if (!currentRoom || !currentRoom.isActive) {
          clearInterval(room.timerInterval);
          return;
        }
        
        currentRoom.timer--;
        io.to(roomId).emit('timer-update', { timer: currentRoom.timer });
        
        console.log(`Room ${roomId} timer: ${currentRoom.timer}s`);
        
        if (currentRoom.timer <= 0) {
          clearInterval(currentRoom.timerInterval);
          currentRoom.timerInterval = null;
          completeRound(io, roomId);
        }
      }, 1000);
    }

    function completeRound(io, roomId) {
      const room = gameRooms.get(roomId);
      if (!room) return;
      
      // Ensure timer is stopped
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      
      console.log(`Completing round ${room.currentLetter} in room ${roomId}`);
      
      // Calculate scores
      const validAnswers = Object.entries(room.roundAnswers).filter(([_, data]) => data.isValid);
      const points = LETTER_SCORES[room.currentLetter];
      
      // Award points (split if multiple correct answers)
      if (validAnswers.length > 0) {
        const pointsPerPlayer = Math.floor(points / validAnswers.length);
        validAnswers.forEach(([playerName]) => {
          room.scores[playerName] += pointsPerPlayer;
        });
        
        // Add used players to prevent reuse
        validAnswers.forEach(([_, data]) => {
          if (data.answer && !room.usedPlayers.includes(data.answer.toLowerCase())) {
            room.usedPlayers.push(data.answer.toLowerCase());
          }
        });
      }
      
      room.isActive = false;
      
      // Send round results
      io.to(roomId).emit('round-complete', {
        answers: room.roundAnswers,
        scores: room.scores,
        usedPlayers: room.usedPlayers
      });
      
      console.log(`Round ${room.currentLetter} completed in room ${roomId}`);
      
      // Auto-advance to next letter after 3 seconds
      setTimeout(() => {
        const currentRoom = gameRooms.get(roomId);
        if (!currentRoom) return;
        
        if (currentRoom.currentLetterIndex >= 25) {
          // Game complete
          const winner = Object.entries(currentRoom.scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
          currentRoom.winner = winner;
          io.to(roomId).emit('game-complete', { winner, scores: currentRoom.scores });
          console.log(`Game completed in room ${roomId}, winner: ${winner}`);
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
          
          startTimer(io, roomId);
          console.log(`Started round ${currentRoom.currentLetter} in room ${roomId}`);
        }
      }, 3000);
    }
  }
  res.end();
};

export default SocketHandler;