import React, { useState } from 'react';

interface Props {
  onComplete: (data: { first_name: string; last_name: string; index: string; section: string }) => Promise<void>;
}

const ProfileCompletion: React.FC<Props> = ({ onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [index, setIndex] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onComplete({ first_name: firstName, last_name: lastName, index, section });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
      <h2>Uzupełnij profil</h2>
      <p>Wpisz podstawowe dane, wymagane przy pierwszym logowaniu.</p>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Imię</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Nazwisko</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Index</label>
          <input value={index} onChange={e => setIndex(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Sekcja</label>
          <input value={section} onChange={e => setSection(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </form>
    </div>
  );
};

export default ProfileCompletion;
