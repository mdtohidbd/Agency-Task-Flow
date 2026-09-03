import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SyncProvider } from './contexts/SyncContext';

import { LoginPage } from './pages/LoginPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { TeamBoardPage } from './pages/TeamBoardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectResourcesPage } from './pages/ProjectResourcesPage';
import { LeadsPage } from './pages/LeadsPage';
import { ProfileOptionsPage } from './pages/ProfileOptionsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/tasks" replace />} />
              <Route path="/tasks" element={<MyTasksPage />} />
              <Route path="/team" element={<TeamBoardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/resources" element={<ProjectResourcesPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/profile" element={<ProfileOptionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
