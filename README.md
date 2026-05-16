# WebRTC Video Chat Application

## Description
This is a production-ready, multi-peer video chat application built with Next.js, TypeScript, and WebRTC. It features a custom WebSocket signaling server to manage the complete WebRTC connection lifecycle (offers, answers, ICE candidates) without relying on external real-time databases or third-party signaling services. 

The application uses a mesh topology, allowing up to 4 participants to connect directly to each other peer-to-peer, minimizing server load for media streaming. It also features a dynamic, responsive UI with real-time text chat, media controls, and status indicators.

## Features Implemented
- **WebRTC Peer-to-Peer Connections**: Direct media streaming between clients with low latency.
- **Custom Signaling Server**: Integrated Socket.IO server running alongside Next.js for managing room joins, offers, answers, and ICE candidates.
- **Mesh Topology**: Supports multi-user video calls (up to 4 peers recommended) where everyone connects directly to everyone else.
- **Real-Time Text Chat**: Built-in chat panel for participants to exchange messages during the call.
- **Media Controls**: Easily toggle the camera on/off and mute/unmute the microphone.
- **Graceful Disconnects**: UI dynamically updates and removes peers when they leave the room or close their browser.
- **Responsive UI**: Beautiful, dark-themed UI built with Tailwind CSS.
- **Dockerized**: Containerized using Docker and Docker Compose for easy setup, deployment, and testing.

## Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for containerized deployment)

## Setup Instructions

### 1. Clone the repository
Ensure you have the project files in your local directory.

### 2. Environment Variables
Create a `.env.example` (or copy it to `.env` for local non-Docker development) with the following content:
```env
PORT=3000
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
```

## How to Run the Project

### Option A: Using Docker (Recommended)
This project is configured to run out-of-the-box using Docker Compose.

1. Ensure Docker is running.
2. In the root directory of the project, run:
   ```bash
   docker-compose up --build -d
   ```
3. The application will be accessible at `http://localhost:3000`. The container also includes a healthcheck that queries `/api/health`.

### Option B: Local Development
If you prefer to run the application locally without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (this runs the custom `server.ts` with Next.js):
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

## Usage
1. Open the application at `http://localhost:3000`.
2. Click the **"Create New Room"** button. This will generate a unique room ID and redirect you to the room page.
3. Your browser will prompt you for camera and microphone permissions. Click **Allow**.
4. To invite others, simply **copy the URL** from your browser's address bar and share it with up to 3 other people.
5. Once they open the link, they will automatically join your room and the peer-to-peer connections will establish.
6. Use the controls at the bottom to toggle your mic/camera, or the red button to hang up and leave the room.
7. Use the right-hand panel to send text messages to everyone in the room.

## License
MIT License
