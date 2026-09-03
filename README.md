# AgencySync — Minimal Notepad Task Flow (Fullstack)

AgencySync is a minimal, tactile task and project management application for creative teams and agencies. It translates the feeling of writing in a physical notepad into a digital workspace.

---

## 🏗️ Architecture & Project Structure

The codebase is organized into **`frontend/`** and **`backend/`**:

```
stitch_agency_task_flow/
├── backend/                  # ⚙️ BACKEND (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/      # Route controllers (Auth, Tasks, Projects, Resources, System)
│   │   ├── middlewares/      # JWT Auth & Error Handling
│   │   ├── routes/v1/        # API v1 endpoints
│   │   ├── db/               # JSON persistent DataStore & auto-seed
│   │   ├── types/            # Data models & API contracts
│   │   └── index.ts          # Express server entry (Port 5000)
│   ├── data/                 # Auto-saved JSON database (db.json)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # 🎨 FRONTEND (React 18 + TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/       # UI components (Layout, Tasks, Drawer, Modals)
│   │   ├── contexts/         # Auth, Theme (Light/Dark/Sepia), & Sync contexts
│   │   ├── pages/            # 8 complete application screens
│   │   ├── services/         # Typed API client connected to /api/v1/
│   │   ├── styles/           # Notepad Minimal CSS & Hairlines
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Client router
│   │   └── main.tsx          # Client entry point (Port 5173)
│   ├── tailwind.config.js    # Notepad Minimal design tokens
│   ├── vite.config.ts        # Vite proxy configuration
│   └── package.json
│
├── agencysync_notepad/       # 📐 Design System Specs (DESIGN.md)
├── package.json              # 🚀 Root unified task runner (concurrently)
└── README.md
```

---

## ⚡ Quick Start

### 1. Install All Dependencies
From the root directory, run:
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend Simultaneously
```bash
npm run dev
```
- **Frontend URL:** [http://localhost:5173](http://localhost:5173)
- **Backend API URL:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 📱 Application Screens & Features

1. **Teammate Selector & Authentication (`/login`)**
   - Click teammate avatar (Mahim, Touhidul, Alex) with password/PIN drawer.
   - Add new teammates with customized roles.
2. **Today's Focus (`/tasks`)**
   - Live date header, handwritten task checklist, 3px priority ink strokes (High/Normal/Low), strike-through animations.
   - Floating action button (`+`) opening task creation bottom sheet.
3. **Team Board (`/team`)**
   - Filter by teammate or project category, grouped into To Do & Done status columns.
4. **Projects Hub (`/projects` & `/projects/:id`)**
   - Live completion progress meters, attached resources (Figma, Google Docs), and task checklist.
5. **Project Resources Explorer (`/resources`)**
   - File explorer with badges (PDF, JPG, DOCX, ZIP) and quick link cards.
6. **Profile Drawer & Options (`/profile`)**
   - Slide-in navigation drawer, avatar editor, role updater, and privacy preferences.
7. **Settings & Diagnostics (`/settings`)**
   - Real-time **Light**, **Dark**, and **Sepia** theme switcher.
   - Database capacity meter, force sync, and database reset triggers.

---

## 🛠️ Individual Commands

| Command | Action |
|---|---|
| `npm run dev` | Runs both backend & frontend concurrently with live reload |
| `npm run dev:backend` | Runs backend only on port 5000 |
| `npm run dev:frontend` | Runs frontend only on port 5173 |
| `npm run build` | Builds both backend and frontend for production |
| `npm run type-check` | Runs TypeScript type checking across both projects |
