import React, { useState } from 'react';
import { LoginCredentials } from '../../types';
import './Login.css';

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  isLoading: boolean;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(credentials);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Logowanie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Hasło:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        <div className="demo-accounts">
          <p><strong>Dostępne konta:</strong></p>
          <div className="account-list">
            <div className="account-group">
              <p><strong>Administrator:</strong></p>
              <p>Login: admin | Hasło: admin123</p>
            </div>
            <div className="account-group">
              <p><strong>Użytkownicy:</strong></p>
              <p>user1, user2, user3</p>
              <p>jan.kowalski, anna.nowak, piotr.wisniewski</p>
              <p><strong>Hasło dla wszystkich:</strong> user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
