# TicTacToe Nakama

Realtime multiplayer Tic-Tac-Toe built with a Nakama authoritative server and a React frontend.
### TEST IT: `https://lila-backend-assignment.vercel.app/`

<img width="2559" height="1376" alt="image" src="https://github.com/user-attachments/assets/4cd7f29f-a319-4b12-8044-eae1e84ea8c5" />


### Tech Stack

- Backend: Nakama runtime module written in TypeScript
- Match logic: authoritative server-side match handler
- Frontend: React + TypeScript (`create-react-app`)
- Realtime transport: Nakama socket + matchmaker
- Local infra: Docker Compose (Nakama + Postgres)

### Project Structure

- `Server/` - Nakama runtime module source, build config, and Docker Compose file
- `ttt-frontend/` - React client app


### Features

- Device-based authentication with nickname support
- Automatic 1v1 matchmaking
- Authoritative move validation on the server
- Realtime game state sync (`game_start`, `game_update`)
- Disconnect grace period (15 seconds) before forfeit
- Win/loss tracking in Nakama leaderboard
- Leaderboard view in frontend

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (or Docker Engine + Compose)

## Quick Start (Local Development)

### 1) Build the Nakama runtime module

```bash
cd Server
npm install
npm run build
```

This generates `Server/build/main.js`, which Nakama loads as the runtime module. If npm run build doesnt work and gives module error run:
```bash
npx rollup -c --BuildAsCjs
```

### 2) Start Nakama + Postgres

```bash
cd Server
docker compose up -d
```

Default exposed ports:

- `7350` - Nakama API
- `7351` - Nakama console
- `7349` - Nakama gRPC
- `5432` - Postgres

### 3) Start the frontend

```bash
cd ttt-frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Frontend Environment Variables

Configure these in `ttt-frontend/.env`:

```env
REACT_APP_NAKAMA_KEY=defaultkey
REACT_APP_NAKAMA_HOST=localhost
REACT_APP_NAKAMA_PORT=7350
REACT_APP_NAKAMA_SSL=false
```

Notes:

- The app currently falls back to a hardcoded host if `REACT_APP_NAKAMA_HOST` is not set.
- For local Docker-based development, set host to `localhost`.

### How It Works

1. Player enters nickname and authenticates via `authenticateDevice`.
2. Client joins matchmaker (`min=2`, `max=2`).
3. Nakama `matchmakerMatched` creates a `tic-tac-toe` match.
4. Match handler manages player joins, turns, moves, and disconnect handling.
5. Server broadcasts game state updates to both players.
6. On game over, server writes win/loss records to `tictactoe_wins` leaderboard.


### Development Tips

- Rebuild server module after backend changes:

```bash
cd Server
npm run build
```

- Restart Nakama after rebuilding module:

```bash
cd Server
docker compose restart nakama
```

- Stop local services:

```bash
cd Server
docker compose down
```

# Deployment Notes
### ⚠️ Known Limitation: SSL and Browser Security

Currently, the backend is deployed without SSL/TLS encryption (HTTP/WS only). Due to strict modern browser security policies regarding Mixed Content, please note the following limitations:

* **Mobile Browsers:** Will actively block the application from sending network requests to the backend. The app will not function on mobile in its current state.
* **Desktop Browsers:** To test or play the game on desktop, you must manually allow "Insecure content" for this site within your browser's site settings. 

**Note on SSL Implementation:**
An attempt was previously made to secure the DigitalOcean backend using an Nginx reverse proxy, DuckDNS, and Certbot. However, this configuration was rolled back due to persistent errors regarding WebSocket (`wss://`) connection upgrades. Therefore, SSL implementation remains pending.

- use `https://lila-backend-assignment.vercel.app/` link to visit the deployed site
- Click on the padlock icon near the URL & select site settings (For chrome) <img width="889" height="548" alt="image" src="https://github.com/user-attachments/assets/cb0a924f-6355-4a68-bfed-aade91f5fc2b" />
- A new window opens opens, Scroll down till you see Insecure Content change it from Blocked(default) to Allow.
- <img width="2526" height="1186" alt="image" src="https://github.com/user-attachments/assets/487921be-c934-4f56-99ef-2fe29bce0660" />
- For Edge: Click on the lock icon next to URL and select Permissions for this site & Allow on insecure sites. <img width="938" height="610" alt="image" src="https://github.com/user-attachments/assets/c9ecbf16-5193-482e-8260-62d581e95317" />

## Additional notes on Chrome:
### 🛑 Troubleshooting: Browser Security & "Provisional Headers"

In some cases, the application may fail to connect to the backend server with an error message such as **"Server offline or unreachable"** or **"Failed to fetch,"** particularly when using Google Chrome.

#### Understanding "Provisional headers are shown"
When inspecting the **Network** tab in Chrome DevTools, you may see the message **"Provisional headers are shown."** This is a specific signal indicating that the request never actually left the browser. Chrome’s internal security engine intercepted the request before it could hit the network wire. This failure does not mean the DigitalOcean server is down; rather, it means the browser blocked the request because it was deemed "unsafe" under Mixed Content policies.

#### The "Nuclear" Fix for Chrome Development
To bypass these security blockades during testing or development without a full SSL setup, you can instruct Chrome's core engine to treat the backend IP as a trusted origin.

1.  Navigate to the following address in Chrome:
    `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2.  Set the dropdown menu to **Enabled**.
3.  In the text box provided, paste the backend URL:
    `http://168.144.27.183:7350`
4.  **Relaunch Chrome** for the changes to take effect.

This configuration tells the browser to treat this specific HTTP origin as if it were secure, preventing the internal security engine from intercepting the API calls.

## How test on browser:
- Open the deployed link `https://lila-backend-assignment.vercel.app/` in two tabs side by side
- Allow insecure content from site settings as mentioned
- Choose a fresh nickname, submit and PLAY!

