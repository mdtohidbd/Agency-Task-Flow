# AgencySync — Agency Task Flow

AgencySync is a fullstack project and task management platform built for creative agencies. It combines a tactile notepad-style UX with robust team collaboration features, covering projects, tasks, leads, resources, finance, and team management.

---

## 🏗️ Architecture & Project Structure

```
Agency-Task-Flow/
├── backend/                        # ⚙️ Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/            # Route handlers (Auth, Tasks, Projects, Resources, Finance, Leads, Team)
│   │   ├── middlewares/            # JWT auth & error handling
│   │   ├── routes/v1/              # RESTful API endpoints (/api/v1/*)
│   │   ├── db/                     # JSON persistent DataStore (lowdb-style) + auto-seed
│   │   ├── types/                  # Shared TypeScript interfaces & API contracts
│   │   └── index.ts                # Express server entry — Port 5000
│   ├── data/                       # Auto-saved JSON database (db.json)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # 🎨 React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/             # Reusable UI (Layout, Tasks, Projects, Finance, Leads, Admin, Editor)
│   │   ├── contexts/               # Auth, Theme (Light/Dark/Sepia), Sync contexts
│   │   ├── pages/                  # Application screens (see list below)
│   │   ├── services/               # Typed API client → /api/v1/
│   │   ├── utils/                  # storageManager, helpers
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── App.tsx                 # Client-side router
│   │   └── main.tsx                # Entry point — Port 5173
│   ├── tailwind.config.js          # Design tokens
│   ├── vite.config.ts              # Vite proxy → backend
│   └── package.json
│
├── stitch reference/               # 📐 Original screen references & design specs
├── DESIGN.md                       # Design system documentation
├── package.json                    # Root task runner (concurrently)
└── README.md
```

---

## ⚡ Quick Start

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/v1 |

---

## 📱 Application Screens & Features

| # | Route | Feature |
|---|---|---|
| 1 | `/login` | **Auth** — Teammate selector with PIN/password drawer; add new teammates with custom roles |
| 2 | `/tasks` | **Today's Focus** — Live date header, handwritten task checklist, priority ink strokes (High/Normal/Low), strike-through animations |
| 3 | `/team` | **Team Board** — Filter by teammate or project, grouped To Do / Done columns |
| 4 | `/projects` | **Projects Hub** — Completion meters, resource links, task checklists |
| 5 | `/projects/:id` | **Project Detail** — Deliverables, resources, team members, settings |
| 6 | `/resources` | **Resource Explorer** — File browser with badges (PDF, DOCX, Figma, etc.) |
| 7 | `/leads` | **Lead Pipeline** — CRM-style lead tracking with status flow |
| 8 | `/finance` | **Finance Tracker** — Income/expense ledger with project allocation |
| 9 | `/admin` | **Admin Panel** — Team management, roles, permissions |
| 10 | `/profile` | **Profile & Options** — Avatar editor, role updater, privacy preferences |
| 11 | `/settings` | **Settings & Diagnostics** — Theme switcher (Light/Dark/Sepia), DB capacity meter, force sync, DB reset |

---

## 🛠️ Individual Commands

| Command | Action |
|---|---|
| `npm run dev` | Runs backend + frontend concurrently with live reload |
| `npm run dev:backend` | Backend only — Port 5000 |
| `npm run dev:frontend` | Frontend only — Port 5173 |
| `npm run build` | Production build for both backend and frontend |
| `npm run type-check` | TypeScript type checking across both projects |
| `npm run install:all` | Installs dependencies in root, backend, and frontend |

---

## ✅ Recently Completed

### Sprint — Sept 20–21, 2026
- **Lead Management** — Full CRM pipeline with lead creation, status tracking, and detail modal
- **Finance Module** — Income/expense entries with project allocation and ledger view
- **Project Deliverables** — Milestone-based deliverable tracking with completion states
- **Resource Preview** — Modal viewer for attached files and links
- **Project Settings** — Edit project metadata, status, and team assignments
- **Admin Panel** — Team member management with role-based permissions
- **Storage Manager** — Database capacity monitoring and management modal
- **Team Member System** — Add, edit, remove teammates with avatar and role configuration
- **MongoDB Resource Monitoring** — Backend health diagnostics with DB connection stats
- **Rich Text Editor** — TipTap-powered description editor on project details

---

## 🔜 Next Up

### Global Search
- Unified search overlay (keyboard shortcut: `Cmd/Ctrl + K`)
- Searches across: **Tasks**, **Projects**, **Leads**, **Team Members**, **Resources**
- Live fuzzy-match results with category grouping
- Recent searches / quick actions

### Notification System
- In-app notification center (bell icon in top bar)
- Event-driven alerts: task assignments, project updates, lead status changes, deadline reminders
- Read/unread state management with badge counters
- Notification preferences per user (opt-in/out per category)

---

## 🔧 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | JSON flat-file store (lowdb-style), with MongoDB diagnostics |
| Auth | JWT (access tokens), bcrypt password hashing |
| Rich Text | TipTap + ProseMirror |
| Deployment | Local dev (concurrent) |
