import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CreationPage from './pages/creation/CreationPage';
import GamePage from './pages/GamePage';
import SettlementPage from './pages/SettlementPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/creation" element={
          <PrivateRoute>
            <CreationPage />
          </PrivateRoute>
        } />
        <Route path="/game" element={
          <PrivateRoute>
            <GamePage />
          </PrivateRoute>
        } />
        <Route path="/settlement" element={
          <PrivateRoute>
            <SettlementPage />
          </PrivateRoute>
        } />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
