import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import apiClient from '../../services/api';

interface Props {
  user: User;
  onLogout: () => void;
}

const SuperAdminPanel: React.FC<Props> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await apiClient.getAllUsers();
        setUsers(list as User[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleRole = async (u: User) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await apiClient.setUserRole(u.id, nextRole);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: nextRole } : x));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nie udało się zmienić roli');
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Ładowanie...</div>;

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Panel Super Admina</h1>
        <div className="admin-info">
          <span>Witaj, {user.username}!</span>
          <button onClick={onLogout} className="logout-button">Wyloguj</button>
        </div>
      </header>

      <div className="admin-content">
        <h2>Użytkownicy</h2>
        <div className="users-list">
          {users.map(u => (
            <div key={u.id} className="user-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, border: '1px solid #eee', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <strong>{u.username}</strong> ({u.email || 'brak email'}) — rola: {u.role}{u.is_superuser ? ' (superuser)' : ''}
              </div>
              {!u.is_superuser && (
                <button className="send-button" onClick={() => toggleRole(u)}>
                  {u.role === 'admin' ? 'Zdejmij admina' : 'Nadaj admina'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
