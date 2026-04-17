# Tic-Tac-Toe Nakama: Server-Authoritative Multiplayer

A production-ready, real-time multiplayer Tic-Tac-Toe game built with a Nakama authoritative server and a React frontend. The system is designed to handle real-time state synchronization, matchmaking, and player persistence.

## 🎮 Live Game Link

* **Vercel Hosted:** [https://lila-backend-assignment.vercel.app/](https://lila-backend-assignment.vercel.app/)

## 🏗️ Tech Stack & Infrastructure

* **Backend:** Nakama Runtime (TypeScript) running in Docker
* **Frontend:** React + TypeScript (Vercel)
* **Reverse Proxy:** Nginx handling SSL termination and WebSocket upgrades
* **Security:** SSL/TLS enabled via Certbot / Let's Encrypt for all backend traffic
* **DNS:** DuckDNS (`lila-ttt-game.duckdns.org`) pointing to a DigitalOcean Droplet

## 🚀 Current Deployment State

* ✅ **Mobile to Mobile:** Fully functional
* ✅ **Edge browser to Edge browser in PC:** Fully functional
* ✅ **Mobile to Desktop (Edge browser):** Fully functional
* ⚠️ **Desktop Chrome:** Connection issues persist due to strict browser security policies present in Chrome (Look at workaround below)

## 🌐 Desktop Chrome Troubleshooting

Despite a valid SSL configuration on the server, Desktop Chrome’s internal security engine may intercept the WebSocket (`wss://`) upgrade when connecting from a different origin to a dynamic DNS provider.

### To enable gameplay on Desktop Chrome

1. Click the **Padlock** icon in the URL bar and open **Site Settings**.
2. Change **Insecure content** to **Allow**.

### Alternative "Nuclear" Fix (IF CHROME STILL BLOCKS REQUEST EVEN AFTER ALLOWING INSECURE CONTENT)

1. Navigate to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Enable the flag.
3. Add:
   `https://lila-ttt-game.duckdns.org`
4. Relaunch Chrome.

## 🛠️ Project Features

* **Authoritative Match Logic:** All game state and move validations are handled server-side to prevent cheating
* **Real-time Matchmaking:** Automatic 1v1 pairing
* **Resilience:** 15-second grace period for player reconnection before forfeit
* **Global Leaderboard:** Win/Loss tracking using Nakama's native leaderboard system

## 💻 Local Development

### 1. Build the Module

```bash
cd Server
npm install
npm run build
```

If module errors occur:

```bash
npx rollup -c --bundleConfigAsCjs
```

### 2. Launch Infrastructure

```bash
docker compose up -d
```

* **Nakama API:** `7350`
* **Console:** `7351` (Login: `admin / password`)

### 3. Start Frontend

```bash
cd ttt-frontend
npm start
```

## 🧪 How to Test

1. Open the live link on two devices (for example, Phone + Desktop Edge).
2. Enter a nickname and click **Play**.
3. The server pairs both instances into a single authoritative match room.
4. Observe real-time state broadcasts as moves are validated and applied.

## 📌 Summary

This project demonstrates production-style multiplayer backend engineering using Nakama, Docker, Nginx, SSL, and a modern React frontend with real-time synchronization.
