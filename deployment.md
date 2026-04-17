# Deployment Guide: Nakama Tic-Tac-Toe

This document outlines the deployment architecture and step-by-step procedures for deploying both the React frontend and the Nakama/PostgreSQL backend.

## 🏗 Architecture Overview

* **Frontend:** React application hosted on **Vercel**.
* **Backend:** Nakama Game Server with custom TypeScript match logic and PostgreSQL, hosted on a **DigitalOcean Droplet**.
* **Server IP:** `droplet-ip`

---

## 🌐 1. Frontend Deployment (Vercel)

The frontend is continuously deployed via Vercel. 

### Environment Variables
Ensure the following environment variables are set in your Vercel project dashboard under **Settings > Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `REACT_APP_NAKAMA_HOST` |`droplet IP` | The public IP of the DigitalOcean droplet. |
| `REACT_APP_NAKAMA_PORT` | `7350` | Default Nakama client port. |
| `REACT_APP_NAKAMA_SSL` | `false` | Must be explicitly set to the string "false" due to current backend SSL limitations. |

Once variables are set, pushing to your main branch will trigger a Vercel build and deploy.

---

## 🖥 2. Backend Deployment (DigitalOcean)

The backend requires manual provisioning and building on the remote server.

### Prerequisites Installation
SSH into the DigitalOcean droplet to set up the base environment.

```bash
ssh root@droplet-ip
```
- install docker, docker compose
- clone the git repo
- cd server
- Run `npx rollup -c --BuildAsCjs` to build main.js file for nakama to use
- Allow incoming request through ports 7350 & 7351 on firewall 
- Run `docker compose up -d` to bring up nakama container

### NOTES:
Browser Security (Mixed Content)
Because the frontend is HTTPS (Vercel) and the backend is HTTP (IP Address), Chrome may block requests with net::ERR_SSL_PROTOCOL_ERROR or show "Provisional headers are shown".

Mobile: Currently unsupported due to strict mobile browser security.

Chrome (Desktop) Workaround:

Go to chrome://flags/#unsafely-treat-insecure-origin-as-secure

Enable the flag.

Add http://YOUR_DROPLET_IP:7350 to the list.

Relaunch Chrome.

Edge: Usually works by simply selecting "Allow insecure content" in site settings.
