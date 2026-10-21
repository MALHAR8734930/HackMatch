import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/use-auth';
import { Toaster } from './components/ui/sonner';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ParticipantRegister from './pages/ParticipantRegister';
import HackathonSetup from './pages/HackathonSetup';
import TeamFormation from './pages/TeamFormation';
import Dashboard from './pages/Dashboard';
import TeamDetails from './pages/TeamDetails';
import MethodologyPage from './pages/MethodologyPage';
import AboutPage from './pages/AboutPage';
import DashboardLayout from './components/DashboardLayout';
import ParticipantsList from './pages/ParticipantsList';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) return null;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<ParticipantRegister />} />
      <Route path="/methodology" element={<MethodologyPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hackathon" element={<HackathonSetup />} />
        <Route path="/teams" element={<TeamFormation />} />
        <Route path="/teams/:teamId" element={<TeamDetails />} />
        <Route path="/participants" element={<ParticipantsList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
