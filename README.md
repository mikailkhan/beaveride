<div align="center">

# 🦫 BeaverIDE

**The browser-based collaborative IDE engineered for speed.**  
Code together. Run together. Build the future together.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📖 Overview

BeaverIDE is a **VS Code × Google Docs** experience delivered entirely in the browser. It merges the professional capabilities of a desktop IDE with the frictionless real-time collaboration of a document editor — no local installs, no environment setup, no merge conflicts.

> **Status:** Active development — frontend UI complete, backend in progress.

---

## 🗂 Project Structure

```
beaveride/
├── client/          # React/Vite frontend application
│   ├── src/
│   │   ├── assets/          # Images, logos, and static assets
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # Button, Card, Input, Avatar, etc.
│   │   │   ├── editor/      # Monaco editor + terminal panel
│   │   │   └── layout/      # Header, Footer, PageContainer
│   │   ├── pages/           # Route-level page components
│   │   │   ├── Home/
│   │   │   ├── About/
│   │   │   ├── Contact/
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── Dashboard/
│   │   │   └── EditorRoom/
│   │   ├── services/        # Mock API services (auth, rooms, editor)
│   │   ├── store/           # Zustand global state (auth, rooms)
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Utility helpers (cn, etc.)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/          # Backend (in progress)
├── AI/              # UI design mockups & stitch-ui references
└── README.md
```

---

## ✨ Features

| Feature | Status |
|---|---|
| Responsive marketing homepage | ✅ Complete |
| About, Contact pages | ✅ Complete |
| Authentication (Login / Register) | ✅ UI complete (mock) |
| User dashboard & project listing | ✅ UI complete (mock) |
| Monaco-powered collaborative editor | ✅ UI complete (mock) |
| Shared terminal / code execution | ✅ UI complete (mock) |
| Real-time multiplayer collaboration | 🔧 Backend in progress |
| Cloud code execution engine | 🔧 Backend in progress |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Install & Run (Client)

```bash
# 1. Navigate to the client directory
cd client

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Available Scripts

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Type-check (tsc) and bundle for production
npm run preview   # Preview the production build locally
npm run lint      # Run oxlint for fast code linting
```

---

## 🛠 Tech Stack

### Frontend (`client/`)

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (custom `@theme` design system) |
| Routing | React Router DOM v7 |
| State management | Zustand v5 |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Icons | Lucide React, Material Symbols |
| Linter | Oxlint |

### Backend (`server/`) — In Progress

Planned technologies: Node.js, WebSockets (for real-time CRDT sync), a cloud sandbox execution engine.

---

## 🎨 Design System

BeaverIDE uses a **custom Material Design 3–inspired token system** defined in `client/src/index.css` via Tailwind v4's `@theme` block. Key tokens:

- **Primary** — `#a53c00` (brand brown-orange)
- **Primary Container** — `#f66317` (brand accent orange)
- **Tertiary** — `#2c59bc` (complementary blue)
- **Typography** — Geist (display/headlines) · Inter (body/labels) · JetBrains Mono (code)

All design mockups live in `AI/stitch-ui/` and serve as the pixel-perfect reference for each page.

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

All public pages share a common `Header` + `Footer` layout rendered once via React Router's nested layout route (`AppLayout`).

---

## 🔐 Authentication

Authentication is currently **mocked** via `src/services/mocks/mockAuthService.ts`. Protected routes redirect to `/login` using a `ProtectedRoute` wrapper in `App.tsx`. The backend implementation will replace the mock service with real JWT-based auth.

**Test credentials (mock):**
```
Email:    test@example.com
Password: any value
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

Please follow conventional commits and ensure `npm run build` passes before opening a PR.

---

## 📜 License

This project is private and proprietary. All rights reserved.

---

<div align="center">

Built with ❤️ by the BeaverIDE team.

</div>
