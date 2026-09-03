# AgencySync — Frontend Client

A responsive, tactile **"Notepad Minimal"** task and project management client built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 📁 Directory Structure

```
client/
├── public/
│   └── favicon.svg               # Application brand icon
├── src/
│   ├── components/
│   │   ├── drawer/
│   │   │   └── ProfileSidebarDrawer.tsx   # Slide-in profile drawer
│   │   ├── layout/
│   │   │   ├── TopAppBar.tsx              # Sticky header with avatar & search
│   │   │   ├── BottomNavBar.tsx           # Docked mobile navigation bar
│   │   │   └── ResponsiveContainer.tsx    # Centered mobile-first canvas wrapper
│   │   ├── modals/
│   │   │   ├── AddResourceModal.tsx       # Modal to upload files / quick links
│   │   │   └── AddTeammateModal.tsx       # Modal to add a new teammate
│   │   └── tasks/
│   │       ├── TaskRow.tsx                # Task item with priority stroke & checkbox
│   │       ├── CreateTaskBottomSheet.tsx  # Bottom sheet modal for task creation
│   │       └── DeleteTaskModal.tsx        # Delete confirmation dialog
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Teammate auth state & switcher
│   │   ├── ThemeContext.tsx      # Light, Dark, Sepia themes
│   │   └── SyncContext.tsx       # System health & sync triggers
│   ├── pages/
│   │   ├── LoginPage.tsx         # Teammate avatar tiles & PIN drawer
│   │   ├── MyTasksPage.tsx       # Today's personal focus & FAB button
│   │   ├── TeamBoardPage.tsx     # Teammate filters & status columns
│   │   ├── ProjectsPage.tsx      # Projects overview with progress bars
│   │   ├── ProjectDetailPage.tsx # Project tasks checklist & resources
│   │   ├── ProjectResourcesPage.tsx # Searchable file explorer & quick links
│   │   ├── ProfileOptionsPage.tsx   # Edit name, role, avatar, privacy
│   │   └── SettingsPage.tsx      # Theme selector & DB diagnostics
│   ├── services/
│   │   └── api.ts                # Typed client API client for /api/v1/
│   ├── styles/
│   │   └── index.css             # Tailwind directives & Notepad Minimal tokens
│   ├── types/
│   │   └── index.ts              # Client TypeScript models
│   ├── App.tsx                   # Routes and provider configurations
│   └── main.tsx                  # React DOM entry point
├── .env                          # Environment variables
├── .env.example                  # Environment variables template
├── tailwind.config.js            # Custom colors, fonts (Patrick Hand), spacing
├── vite.config.ts                # Vite config + dev proxy to backend port 5000
└── package.json                  # Client dependencies & scripts
```

---

## 🎨 Design System Tokens

- **Font Family:** `Patrick Hand` across headlines and body text.
- **Hairlines:** 1px rules (`#E3E1DB`) replacing heavy drop shadows.
- **Priority Ink Strokes:** 3px indicators (High: `#C94F4F`, Normal: `#D98C2B`, Low: `#0044C1`, Done: `#C9C7BF`).
- **Themes:** `light` (stationery paper), `dark` (graphite slate), `sepia` (vintage warm paper).

---

## 🏃 Running the Client

```bash
# Start Vite development server (Port 5173)
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```
