# Deployment Guide: Nakama Tic-Tac-Toe (SSL Enabled)

This document outlines the production-ready deployment architecture and procedures for the React frontend and the Nakama/PostgreSQL backend.

## 🏗 Architecture Overview

* **Frontend:** React application hosted on Vercel with automatic HTTPS
* **Backend:** Nakama Game Server + PostgreSQL hosted on a DigitalOcean Droplet
* **Reverse Proxy:** Nginx acting as an SSL terminator and WebSocket proxy
* **Domain & SSL:** DuckDNS (`lila-ttt-game.duckdns.org`) with Let's Encrypt SSL certificates

## 🌐 1. Frontend Deployment (Vercel)

The frontend connects to the backend via a secure domain. Ensure your Vercel environment variables are updated to point to the secure URL.

### Environment Variables

| Variable                | Value                       | Description                                      |
| ----------------------- | --------------------------- | ------------------------------------------------ |
| `REACT_APP_NAKAMA_HOST` | `lila-ttt-game.duckdns.org` | Secure DuckDNS domain                            |
| `REACT_APP_NAKAMA_PORT` | `443`                       | Standard HTTPS/WSS port handled by Nginx         |
| `REACT_APP_NAKAMA_SSL`  | `true`                      | Enables secure `https://` and `wss://` protocols |

## 🖥 2. Backend Deployment (DigitalOcean)

### A. Environment Provisioning

* Install Docker
* Install Docker Compose
* Install Node.js (v18+)
* Install Nginx
* Configure DuckDNS to point to the Droplet public IP

### B. Building & Running Nakama

```bash
# Navigate to server directory
cd Server

# Build the TypeScript module
npm install
npm run build

# Fallback if needed
npx rollup -c --bundleConfigAsCjs

# Start containers
docker compose up -d
```

### C. Nginx & SSL Configuration

Nginx bridges the public internet to the Docker container.

#### Nginx Site Configuration

Create a site config in:

```bash
/etc/nginx/sites-available/nakama
```

Requirements:

* `proxy_pass` to `http://127.0.0.1:7350`
* Set `Upgrade` and `Connection` headers for WebSocket support
* Enable the site and reload Nginx

#### Certbot SSL Provisioning

```bash
certbot --nginx -d lila-ttt-game.duckdns.org
```

#### Firewall

```bash
ufw allow 'Nginx Full'
```

## ⚠️ Browser Security & Troubleshooting

SSL support enables compatibility across most modern browsers.

### ✅ Supported Environments

* Mobile Browsers (iOS / Android): Fully functional
* Desktop Edge: Fully functional
* Desktop Chrome (Incognito): Usually functional

### 🛑 Chrome (Desktop) Mixed Content Quirk

Some versions of Desktop Chrome may still mark the WebSocket upgrade (`wss://`) as **Provisional** because a dynamic DNS provider is being used.

#### Chrome Workaround

1. Open:
   `https://lila-backend-assignment.vercel.app/`
2. Click the Padlock icon in the URL bar.
3. Open **Site Settings**.
4. Set **Insecure content** to **Allow**.

#### Alternative Flag Method

1. Open:
   `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Enable the flag.
3. Add:
   `https://lila-ttt-game.duckdns.org`
4. Relaunch Chrome.

## 🧪 Verification

To confirm the deployment is production ready:

* **Secure Handshake:** Browser shows a valid SSL certificate
* **Authoritative Logic:** Moves validated and broadcast by server
* **Graceful Disconnect:** Verify 15-second forfeit timer using:

```bash
docker compose logs -f nakama
```

## 📌 Summary

This deployment provides a secure, production-style multiplayer architecture using Vercel, DigitalOcean, Docker, PostgreSQL, Nginx, Certbot, and Nakama authoritative matches.
