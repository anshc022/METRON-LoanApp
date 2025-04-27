import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { AdminDashboard } from './components/dashboard/admin/AdminDashboard';
import { AgentDashboard } from './components/dashboard/agent/AgentDashboard';
import { authService } from './services/authService';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        const isValid = await authService.initializeAuth();
        setIsAuthenticated(isValid);
      } finally {
        setIsAuthChecked(true);
      }
    };
    initializeAuthState();
  }, []);

  const getDashboardComponent = () => {
    const userRole = authService.getUserRole();
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'agent':
        return <Navigate to="/agent/dashboard" replace />;
      default:
        return <Navigate to="/login" />;
    }
  };

  if (!isAuthChecked) {
    return <div>Loading...</div>; // You can replace this with a proper loading spinner
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          } />
          <Route path="/signup" element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Signup />
            )
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={getDashboardComponent()} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              isAuthenticated && authService.getUserRole() === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Agent routes */}
          <Route
            path="/agent/*"
            element={
              isAuthenticated && authService.getUserRole() === 'agent' ? (
                <AgentDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all other routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
