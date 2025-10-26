import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import AdminPanel from './components/AdminPanel/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel/SuperAdminPanel';
import UserPanel from './components/UserPanel/UserPanel';
import ProfileCompletion from './components/ProfileCompletion/ProfileCompletion';
import { User, LoginCredentials, AuthState } from './types';
import apiClient from './services/api';
import './App.css';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Sprawdź czy użytkownik jest już zalogowany przy ładowaniu aplikacji
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Upewnij się, że mamy ciasteczko CSRF zanim wykonamy POST-y
        try {
          await apiClient.getCSRF();
        } catch {}

        const userData = await apiClient.getCurrentUser() as User;
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Zapewnij CSRF cookie przed POST /login
      try {
        await apiClient.getCSRF();
      } catch {}

      const response = await apiClient.login(credentials.username, credentials.password) as any;
      
      if (response.success) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        // Po zalogowaniu przejdź na główną ścieżkę, aby trafić do właściwego panelu
        try { window.history.replaceState(null, '', '/'); } catch {}
        try { window.dispatchEvent(new Event('popstate')); } catch {}
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      alert(error instanceof Error ? error.message : 'Błąd logowania');
    }
  };

  const handleDiscordLogin = async () => {
    try {
      // Otwórz popup do backendu (Discord OAuth start)
      const w = 520, h = 720;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(
        'http://localhost:3001/api/oauth/login/discord/',
        'discord_oauth',
        `width=${w},height=${h},left=${left},top=${top}`
      );
      if (!popup) return;

      // Po zamknięciu popupu sprawdź sesję
      const timer = window.setInterval(async () => {
        if (popup.closed) {
          window.clearInterval(timer);
          try {
            const userData = await apiClient.getCurrentUser() as User;
            setAuthState({ user: userData, isAuthenticated: true, isLoading: false });
            // Po zalogowaniu przez Discord też ustaw przekierowanie na /, aby trafić do właściwego panelu
            try { window.history.replaceState(null, '', '/'); } catch {}
            try { window.dispatchEvent(new Event('popstate')); } catch {}
          } catch {
            // brak zalogowania
          }
        }
      }, 700);
    } catch (e) {
      console.error('Discord login error:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const handleProfileComplete = async (data: { first_name: string; last_name: string; index: string; section: string }) => {
    try {
      await apiClient.completeProfile(data);
      const me = await apiClient.getCurrentUser() as User;
      setAuthState({ user: me, isAuthenticated: true, isLoading: false });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nie udało się zapisać profilu');
    }
  };

  // Pokazuj loading podczas sprawdzania autentykacji
  if (authState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Ładowanie...
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin}
        onDiscordLogin={handleDiscordLogin}
        isLoading={authState.isLoading}
      />
    );
  }

  return (
    <Router>
      <div className="App">
        {authState.user && authState.user.require_profile_completion && (
          <ProfileCompletion onComplete={handleProfileComplete} />
        )}
        <Routes>
          <Route 
            path="/" 
            element={
              authState.user?.is_superuser
                ? <Navigate to="/super" replace />
                : authState.user?.role === 'admin' 
                  ? <Navigate to="/admin" replace />
                  : <Navigate to="/user" replace />
            } 
          />
          <Route 
            path="/admin" 
            element={
              authState.user?.role === 'admin' && !authState.user?.is_superuser
                ? <AdminPanel user={authState.user} onLogout={handleLogout} />
                : authState.user?.is_superuser
                  ? <Navigate to="/super" replace />
                  : <Navigate to="/user" replace />
            } 
          />
          <Route 
            path="/super" 
            element={
              authState.user?.is_superuser 
                ? <SuperAdminPanel user={authState.user} onLogout={handleLogout} />
                : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/user" 
            element={
              (authState.user?.role === 'user' || authState.user?.role === 'admin')
                ? <UserPanel user={authState.user} onLogout={handleLogout} />
                : <Navigate to="/admin" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
