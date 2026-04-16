import React, { useState } from 'react';
import * as nakamajs from '@heroiclabs/nakama-js';


const CLIENT = new nakamajs.Client(
  process.env.REACT_APP_NAKAMA_KEY || "defaultkey",
  process.env.REACT_APP_NAKAMA_HOST || "localhost",
  process.env.REACT_APP_NAKAMA_PORT || "7350",
  process.env.REACT_APP_NAKAMA_SSL === "true"
);

type Board = string[];

interface GameState {
  board: Board;
  marks: Record<string, string>;
  players: string[];
  currentTurn: string;
  winner: string | null;
  gameOver: boolean;
}

export default function App() {
  const [session, setSession] = useState<nakamajs.Session | null>(null);
  const [socket, setSocket] = useState<nakamajs.Socket | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('Enter your nickname to start');
  const [myUserId, setMyUserId] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const login = async () => {
    if (!nickname) return;
    const storageKey = 'nk_device_id' + nickname;
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
      deviceId = nickname + "_" + crypto.randomUUID();
      localStorage.setItem(storageKey, deviceId);
    }
    const sess = await CLIENT.authenticateDevice(deviceId, true, nickname);
    setSession(sess);
    setMyUserId(sess.user_id!);

    const useSSL = process.env.REACT_APP_NAKAMA_SSL === "true";
    const sock = CLIENT.createSocket(useSSL, false);
    await sock.connect(sess, false);

    sock.onmatchdata = (data) => {
      const decoded = JSON.parse(new TextDecoder().decode(data.data));
      if (decoded.type === 'game_start' || decoded.type === 'game_update') {
        setGameState(decoded.state);
        if(decoded.state.gameOver){
          setStatus('Match Finished!!');
        }
      }
      if (decoded.type === 'player_disconnected') {
        setStatus('Opponent left the game!');
      }
    };

    sock.onmatchmakermatched = async (matched) => {
      setStatus('Opponent found');
      try {
        const match = await sock.joinMatch(matched.match_id);
        setMatchId(match.match_id);        
      }
      catch (e) {
        console.error('Error: ', e);
        setStatus('Error: ' + JSON.stringify(e));
      }
    };

    setSocket(sock);
    setStatus('Logged in as ' + nickname + '. Finding a match...');
    await sock.addMatchmaker('*', 2, 2);
  };

  const makeMove = async (position: number) => {
    if (!socket || !matchId || !gameState) return;
    if (gameState.gameOver) return;
    if (gameState.currentTurn !== myUserId) return;
    if (gameState.board[position] !== '') return;

    await socket.sendMatchState(matchId, 1, JSON.stringify({ type: 'move', position }));
  };

  const fetchLeaderboard = async () => {
    if (!session) return;
    const result = await CLIENT.rpc(session, "get_leaderboard", {});
    const data = (result.payload as any ?? []);
    setLeaderboard(data);
    setShowLeaderboard(true);
  }

  const playAgain = async () => {
    if(!socket) return;
    setGameState(null);
    setMatchId(null);
    setStatus("Finding a new match....");
    await socket.addMatchmaker('*', 2, 2);    
  };

  const isMyTurn = gameState?.currentTurn === myUserId;
  const myMark = gameState?.marks ? gameState.marks[myUserId] : '';

  if (!session) {
    return (
      <div style={styles.container}>
        <h1>Tic Tac Toe</h1>
        <input
          style={styles.input}
          placeholder="Enter nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
        />
        <button style={styles.button} onClick={login}>Play</button>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div style={styles.container}>
        <h1>🏆 Leaderboard</h1>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Wins</th>
              <th style={styles.th}>Losses</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr key={i}>
                <td style={styles.td}>{i + 1}</td>
                <td style={styles.td}>{entry.username}</td>
                <td style={styles.td}>{entry.wins}</td>
                <td style={styles.td}>{entry.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={styles.button} onClick={() => setShowLeaderboard(false)}>Back</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Tic Tac Toe</h1>
      <p>{status}</p>      
      {gameState && (
        <>
          <p>{isMyTurn ? '🟢 Your turn (' + myMark + ')' : "⏳ Opponent's turn"}</p>
          {gameState.gameOver && (
            <>
              <h2>{gameState.winner === myUserId ? '🏆 You Win!' : gameState.winner ? '😞 You Lose!' : "🤝 It's a Draw!"}</h2>
              <div style={{display: 'flex', gap:10, marginTop:10}}>
                <button style={styles.button} onClick={playAgain}>🔄 Play Again</button>
                <button style={styles.secondaryButton} onClick={fetchLeaderboard}>🏆 Leaderboard</button>
              </div>
            </>
          )}
          <div style={styles.board}>
            {gameState.board.map((cell, i) => (
              <div key={i} style={styles.cell} onClick={() => makeMove(i)}>
                {cell}
              </div>
            ))}
          </div>
        </>
      )}
      {!gameState && matchId && <p>Waiting for opponent to join...</p>}
      {!matchId && <p>🔍 Searching for opponent...</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif', padding: 20 },
  input: { padding: 10, fontSize: 16, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc', width: 200 },
  button: { padding: '10px 30px', fontSize: 16, borderRadius: 6, background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: 8, marginTop: 20 },
  cell: { width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 'bold', background: '#f0f0f0', borderRadius: 8, cursor: 'pointer' },
  table: { borderCollapse: 'collapse', marginBottom: 20, width: '100%', maxWidth: 400 },
th: { background: '#4CAF50', color: 'white', padding: '10px 20px', textAlign: 'left' },
td: { padding: '8px 20px', borderBottom: '1px solid #ddd' },
secondaryButton: { padding: '10px 30px', fontSize: 16, borderRadius: 6, background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' },
};
