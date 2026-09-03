# AgencySync — Backend API Server

A modular, lightweight RESTful API server built with **Node.js**, **Express**, and **TypeScript**.

---

## 📁 Directory Structure

```
server/
├── data/
│   └── db.json               # Auto-persisted database file
├── src/
│   ├── controllers/
│   │   ├── authController.ts     # Teammate login, registration, & JWT session
│   │   ├── userController.ts     # Teammate profiles & updates
│   │   ├── taskController.ts     # Task CRUD, status toggling, filters
│   │   ├── projectController.ts  # Project tracking & progress calculations
│   │   ├── resourceController.ts # File attachments & quick links
│   │   └── systemController.ts   # System health, sync & DB optimization
│   ├── db/
│   │   └── store.ts          # JSON DataStore with seed data & query methods
│   ├── middlewares/
│   │   ├── authMiddleware.ts # JWT authentication & user injection
│   │   └── errorHandler.ts   # Global standardized error handling
│   ├── routes/
│   │   └── v1/
│   │       └── index.ts      # Consolidated /api/v1/ router
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces (User, Task, Project, etc.)
│   └── index.ts              # Express application entry point
├── .env                      # Environment variables
├── .env.example              # Environment variables template
├── package.json              # Server dependencies & scripts
└── tsconfig.json             # TypeScript configuration
```

---

## 🚀 API Endpoints (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Log in with teammate ID / PIN |
| `POST` | `/api/v1/auth/register` | Register a new teammate |
| `GET` | `/api/v1/auth/me` | Fetch active authenticated session |
| `GET` | `/api/v1/users` | List all workspace teammates |
| `GET` | `/api/v1/users/:id` | Get specific teammate details |
| `PATCH`| `/api/v1/users/:id` | Update teammate name, role, avatar, theme |
| `GET` | `/api/v1/tasks` | Get tasks (filter by `assigneeId`, `projectId`, `today`) |
| `POST` | `/api/v1/tasks` | Create a new task with priority & due date |
| `PATCH`| `/api/v1/tasks/:id` | Update task title, status (toggle check), priority |
| `DELETE`| `/api/v1/tasks/:id` | Soft-delete a task |
| `GET` | `/api/v1/projects` | List all projects with progress percentage |
| `GET` | `/api/v1/projects/:id` | Get project details with attached tasks & resources |
| `POST` | `/api/v1/projects` | Create a new project |
| `GET` | `/api/v1/resources` | List files and quick links |
| `POST` | `/api/v1/resources` | Attach a new file or link |
| `GET` | `/api/v1/system/health` | Get DB capacity % and sync timestamps |
| `POST` | `/api/v1/system/sync` | Trigger force synchronization |
| `POST` | `/api/v1/system/optimize` | Optimize database storage |
| `POST` | `/api/v1/system/reset` | Reset database back to default initial seed |

---

## 🏃 Running the Server

```bash
# Start development server with live reload (Port 5000)
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```
