import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import AdminPanel from './components/AdminPanel/AdminPanel';
import UserPanel from './components/UserPanel/UserPanel';
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
      const response = await apiClient.login(credentials.username, credentials.password) as any;
      
      if (response.success) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
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
        isLoading={authState.isLoading}
      />
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              authState.user?.role === 'admin' 
                ? <Navigate to="/admin" replace />
                : <Navigate to="/user" replace />
            } 
          />
          <Route 
            path="/admin" 
            element={
              authState.user?.role === 'admin' 
                ? <AdminPanel user={authState.user} onLogout={handleLogout} />
                : <Navigate to="/user" replace />
            } 
          />
          <Route 
            path="/user" 
            element={
              authState.user?.role === 'user' 
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
