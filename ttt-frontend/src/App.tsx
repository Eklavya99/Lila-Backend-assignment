import React, { useState, useMemo } from 'react';
import * as nakamajs from '@heroiclabs/nakama-js';
import './App.css'; // Assuming your global dark CSS is here

const CLIENT = new nakamajs.Client(
    process.env.REACT_APP_NAKAMA_KEY || "defaultkey",

    process.env.REACT_APP_NAKAMA_HOST || "168.144.27.183",

    process.env.REACT_APP_NAKAMA_PORT || "7350",

    process.env.REACT_APP_NAKAMA_SSL === "false"
);

// Matches your backend's toSerializable() output
interface GameState {
    board: string[];
    marks: Record<string, string>;
    players: string[];
    currentTurn: string;
    winner: string | null;
    gameOver: boolean;
    disconnectionTicks: Record<string, number>;
}

// Purely visual helper to know which squares to paint green
const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
function getVisualWinningLine(board: string[]) {
    for (const [a, b, c] of WINNING_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return [a, b, c];
        }
    }
    return null;
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
        setStatus('Connecting to server...');

        const storageKey = 'nk_device_id_' + nickname;
        let deviceId = localStorage.getItem(storageKey);
        if (!deviceId) {
            deviceId = nickname + "_" + crypto.randomUUID();
            localStorage.setItem(storageKey, deviceId);
        }

        try {
            const sess = await CLIENT.authenticateDevice(deviceId, true, nickname);
            setSession(sess);
            setMyUserId(sess.user_id!);

            
            const sock = CLIENT.createSocket(false, false);
            await sock.connect(sess, false);

            sock.onmatchdata = (data) => {
                const decoded = JSON.parse(new TextDecoder().decode(data.data));

                if (decoded.type === 'game_start' || decoded.type === 'game_update') {
                    setGameState(decoded.state);
                    setStatus('Match in progress');
                    if (decoded.state.gameOver) {
                        setStatus('Match Finished!!');
                    }
                }

                if (decoded.type === 'player_disconnected') {
                    // Setting the exact 15-second warning message you requested
                    setStatus('Opponent left. If they do not reconnect within 15 seconds, the match will end.');
                }
            };

            sock.onmatchmakermatched = async (matched) => {
                setStatus('Opponent found! Joining...');
                try {
                    const match = await sock.joinMatch(matched.match_id);
                    setMatchId(match.match_id);
                } catch (e) {
                    console.error('Error joining match: ', e);
                    setStatus('Error joining match: ' + JSON.stringify(e));
                }
            };

            setSocket(sock);
            setStatus('Logged in as ' + nickname + '. Finding a match...');
            await sock.addMatchmaker('*', 2, 2);

        } catch (error: any) {
            console.error("Login Error:", error);
            if (error?.status === 409 || error?.message?.includes('409') || error?.message?.includes('in use')) {
                setStatus(`Nickname "${nickname}" is already taken! Try another.`);
                localStorage.removeItem(storageKey);
            } else if (error?.message?.includes('Failed to fetch')) {
                setStatus("Server offline or unreachable. Check your connection!");
            } else {
                setStatus("Login failed: " + (error?.message || "Unknown error"));
            }
        }
    };

    const makeMove = async (position: number) => {
        if (!socket || !matchId) return;
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
        if (!socket) return;
        setGameState(null);
        setMatchId(null);
        setStatus("Finding a new match....");
        await socket.addMatchmaker('*', 2, 2);
    };

    const isMyTurn = gameState?.currentTurn === myUserId;
    const myMark = gameState?.marks ? gameState.marks[myUserId] : '';

    const winningLine = useMemo(() => {
        if (!gameState || !gameState.gameOver) return null;
        return getVisualWinningLine(gameState.board);
    }, [gameState]);

    // --- VIEW: LOGIN ---
    if (!session) {
        return (
            <main className="app">
                <section className="game-card">
                    <h1 className="title">Tic Tac Toe</h1>
                    <p className="status" style={{ color: status.includes('taken') || status.includes('offline') ? '#ef4444' : '#cbd5e1' }}>
                        {status}
                    </p>
                    <input
                        className="input-field"
                        placeholder="Enter nickname"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && login()}
                    />
                    <button className="reset-btn" onClick={login}>Play</button>
                </section>
            </main>
        );
    }

    // --- VIEW: LEADERBOARD ---
    if (showLeaderboard) {
        return (
            <main className="app">
                <section className="game-card" style={{ width: 'min(500px, 100%)' }}>
                    <h1 className="title">🏆 Leaderboard</h1>
                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Wins</th>
                                <th>Losses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{entry.username}</td>
                                    <td>{entry.wins}</td>
                                    <td>{entry.losses}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="reset-btn secondary-btn" onClick={() => setShowLeaderboard(false)}>
                        Back to Game
                    </button>
                </section>
            </main>
        );
    }

    // --- VIEW: GAME BOARD ---
    return (
        <main className="app">
            <section className="game-card">
                <h1 className="title">Tic Tac Toe</h1>
                <p className="status" style={{ color: status.includes('Opponent left') ? '#f59e0b' : '#cbd5e1' }}>
                    {status}
                </p>

                {gameState && (
                    <>
                        {/* Removed the "Opponent's turn" text if the game is over */}
                        {!gameState.gameOver && (
                            <p className="status" style={{ marginTop: 0, fontWeight: isMyTurn ? 'bold' : 'normal', color: isMyTurn ? '#22c55e' : '#cbd5e1' }}>
                                {isMyTurn ? `🟢 Your turn (${myMark})` : `⏳ Opponent's turn`}
                            </p>
                        )}

                        {gameState.gameOver && (
                            <h2 style={{ textAlign: 'center', margin: '10px 0', color: gameState.winner === myUserId ? '#22c55e' : '#f8fafc' }}>
                                {gameState.winner === myUserId ? '🏆 You Win!' : gameState.winner ? '😞 You Lose!' : "🤝 It's a Draw!"}
                            </h2>
                        )}

                        <div className="board">
                            {gameState.board.map((cell, i) => {
                                const isWinningCell = winningLine?.includes(i);
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`square ${isWinningCell ? "winning" : ""}`}
                                        onClick={() => makeMove(i)}
                                        // We disable the button purely for UI/UX so it doesn't look clickable when full
                                        disabled={cell !== '' || gameState.gameOver}
                                    >
                                        {cell}
                                    </button>
                                );
                            })}
                        </div>

                        {gameState.gameOver && (
                            <div className="btn-group">
                                <button className="reset-btn" onClick={playAgain}>🔄 Play Again</button>
                                <button className="reset-btn secondary-btn" onClick={fetchLeaderboard}>🏆 Leaderboard</button>
                            </div>
                        )}
                    </>
                )}

                {!gameState && matchId && <p className="status">Waiting for opponent to join...</p>}
            </section>
        </main>
    );
}
