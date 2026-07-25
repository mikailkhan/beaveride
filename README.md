<div align="center">

# 🦫 BeaverIDE

**The browser-based collaborative IDE engineered for speed.**  
Code together. Run together. Build the future together.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📖 Overview

BeaverIDE is a **VS Code × Google Docs** experience delivered entirely in the browser. It merges the professional capabilities of a desktop IDE with the frictionless real-time collaboration of a document editor — no local installs, no environment setup, no merge conflicts.

> **Status:** Active development — full-stack complete, Phase 10 (refactor & security audit) in progress.

---

## 🗂 Project Structure

```
beaveride/
├── client/                 # React 19 / Vite frontend application
│   ├── src/
│   │   ├── assets/         # Images, logos, and static assets
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Button, Card, Input, Avatar, etc.
│   │   │   ├── editor/     # Monaco editor, TerminalPanel, ChatPanel, FileExplorer
│   │   │   └── layout/     # Header, Footer, PageContainer, DashboardLayout
│   │   ├── hooks/          # Custom React hooks (useYjsSync, useFileBinding, useRoomSocket)
│   │   ├── pages/          # Home, Dashboard, EditorRoom, Login, Register, About, Contact
│   │   ├── services/       # API services (apiClient, authService, roomService, fileService)
│   │   ├── store/          # Zustand global state (authStore, roomStore, fileStore)
│   │   ├── types/          # TypeScript schemas
│   │   └── utils/          # Shared utilities (fileUtils, cn)
├── server/                 # Node.js / Express / Socket.IO backend
│   ├── src/
│   │   ├── config/         # Environment variable validation (Zod)
│   │   ├── controllers/    # authController, roomController, fileController, healthController
│   │   ├── db/             # PostgreSQL client & Drizzle ORM schema definitions
│   │   ├── middleware/     # authMiddleware, errorMiddleware, rateLimitMiddleware
│   │   ├── repositories/   # userRepository, roomRepository, fileRepository, chatRepository
│   │   ├── services/       # authService, roomService, fileService, executorService
│   │   ├── sockets/        # Socket.IO handlers (/room namespace, docStore, activityStore)
│   │   └── utils/          # filePathUtils, math, etc.
├── AI/                     # Context docs, design system specs, and phase roadmap
└── README.md
```

---

## ✨ Features

| Feature | Status |
|---|---|
| Responsive marketing homepage & informational pages | ✅ Complete |
| Authentication (Login / Register / Profile / Password Change) | ✅ Complete (JWT) |
| User dashboard & project listing (Owned, Shared, Archived, Trash) | ✅ Complete |
| VS Code–style file tree explorer & multi-tab editor | ✅ Complete |
| Monaco-powered CRDT collaborative editor (Yjs) | ✅ Complete |
| Multiplayer presence, live cursors & awareness scoping | ✅ Complete |
| Real-time chat & memory-backed room activity feed | ✅ Complete |
| Dual execution contexts (collaborative global & private local) | ✅ Complete |
| Isolated Docker container execution sandbox (JS, Python, Go) | ✅ Complete |

---

## 🚀 Getting Started

### Prerequisites

- **Docker Desktop** running (for PostgreSQL database and code execution sandbox)
- **Node.js** v20 or later
- **npm** v10 or later

### Quickstart with Docker Compose

The fastest way to spin up the full stack (PostgreSQL + Express API Server + React Frontend):

```bash
# 1. Clone repository and start all services via Docker Compose
docker compose up

# 2. Client will be available at http://localhost:5173
# 3. Server API will be available at http://localhost:3000
```

---

## 🛠 Tech Stack

### Frontend (`client/`)

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (custom `@theme` design system) |
| State management | Zustand |
| Real-time Collab | Yjs + Socket.IO Client |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Terminal | xterm.js (`@xterm/xterm`) |

### Backend (`server/`)

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Real-time | Socket.IO + Yjs CRDT synchronization |
| Database | PostgreSQL 17 + Drizzle ORM |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` |
| Code Execution | Docker (`dockerode` isolated containers) |
| Validation | Zod |

---

## 🎨 Design System

BeaverIDE uses a **custom Material Design 3–inspired token system** defined in `client/src/index.css` via Tailwind v4's `@theme` block. Key tokens:

- **Primary** — `#a53c00` (brand brown-orange)
- **Primary Container** — `#f66317` (brand accent orange)
- **Tertiary** — `#2c59bc` (complementary blue)
- **Typography** — Geist (display/headlines) · Inter (body/labels) · JetBrains Mono (code)

---

## 📄 Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/about` | About | Public |
| `/contact` | Contact | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | 🔒 Auth required |
| `/room/:roomId` | Editor Room | 🔒 Auth required |

---

## 🔐 Authentication & Security

- **Authentication**: User accounts authenticate via JSON Web Tokens (JWT) signed using HMAC-SHA256 (`HS256`).
- **Sandboxed Execution**: Code execution runs inside un-networked (`NetworkMode: 'none'`), read-only root filesystem Docker containers with strict memory limits (128MB/256MB), CPU limits, PID limits, and dropped Linux capabilities.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

---

## 📜 License

This project is private and proprietary. All rights reserved.

---

<div align="center">

Built with ❤️ by the BeaverIDE team.

</div>
