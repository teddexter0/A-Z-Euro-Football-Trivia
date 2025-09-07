import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import GameBoard from '../../components/GameBoard';

export default function GameRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState('modern');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      // Get player name and game mode from URL params or session storage
      const urlPlayerName = router.query.player;
      const urlGameMode = router.query.mode;
      
      const storedPlayerName = typeof window !== 'undefined' ? sessionStorage.getItem('playerName') : null;
      const storedGameMode = typeof window !== 'undefined' ? sessionStorage.getItem('gameMode') : null;
      
      const finalPlayerName = urlPlayerName || storedPlayerName;
      const finalGameMode = urlGameMode || storedGameMode || 'modern';
      
      if (!finalPlayerName) {
        // Redirect to home if no player name
        router.push('/');
        return;
      }
      
      setPlayerName(finalPlayerName);
      setGameMode(finalGameMode);
      setIsLoading(false);
      
      // Update session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('playerName', finalPlayerName);
        sessionStorage.setItem('gameMode', finalGameMode);
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Joining game room...</p>
        </div>
        
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: 'Segoe UI', sans-serif;
          }
          
          .loading-spinner {
            text-align: center;
          }
          
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          p {
            font-size: 1.2rem;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>A-Z Football Game - Room {roomId}</title>
        <meta name="description" content={`Playing A-Z Football Game in room ${roomId}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="game-room-container">
        <GameBoard 
          roomId={roomId}
          playerName={playerName}
          gameMode={gameMode}
        />
        
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
          }
        `}</style>
      </div>
    </>
  );
}