import React, { useState, useEffect } from 'react';
import { User, DocumentAssignment, EditableField } from '../../types';
import apiClient from '../../services/api';
import './UserPanel.css';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<DocumentAssignment | null>(null);
  // Kluczem jest field_id (string), bo backend oczekuje mapy { field_id: value }
  const [fieldValues, setFieldValues] = useState<{ [fieldId: string]: string }>({});

  // Pobierz przypisania użytkownika z backendu
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await apiClient.getUserAssignments();
        setAssignments(data as DocumentAssignment[]);
      } catch (e) {
        console.error('Błąd pobierania przypisań:', e);
      }
    };
    fetchAssignments();
  }, [user.id]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = async () => {
    if (!selectedAssignment) return;
    try {
      await apiClient.submitFieldValues(selectedAssignment.id, fieldValues);
      // Lokalna aktualizacja statusu i liczby wartości
      const updatedAssignment: DocumentAssignment = {
        ...selectedAssignment,
        status: selectedAssignment.status === 'pending' ? 'in_progress' : selectedAssignment.status,
        // nie mamy świeżych field_values, ale po odświeżeniu/fokusie można pobrać ponownie
      } as DocumentAssignment;
      setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
      setSelectedAssignment(updatedAssignment);
      alert('Zmiany zostały zapisane');
    } catch (e) {
      console.error('Błąd zapisu:', e);
      alert(e instanceof Error ? e.message : 'Nie udało się zapisać zmian');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    // Prosta walidacja: wszystkie pola muszą mieć wartości
    const fields = selectedAssignment.editable_fields || [];
    const currentValuesByFieldId: { [key: string]: string } = {};
    // mapuj istniejące field_values (po polu numericznym) do field_id string
    fields.forEach(f => {
      const fv = selectedAssignment.field_values.find(v => v.field === f.id);
      if (fv) currentValuesByFieldId[f.field_id] = fv.value;
    });

    const allFieldsFilled = fields.every(field => (fieldValues[field.field_id] ?? currentValuesByFieldId[field.field_id])?.toString().length > 0);
    if (!allFieldsFilled) {
      alert('Wypełnij wszystkie pola przed wysłaniem');
      return;
    }

    try {
      // Najpierw zapisz wartości (jeśli są nowe)
      if (Object.keys(fieldValues).length > 0) {
        await apiClient.submitFieldValues(selectedAssignment.id, fieldValues);
      }
      // Oznacz jako ukończone
      await apiClient.completeAssignment(selectedAssignment.id);

      const updatedAssignment: DocumentAssignment = {
        ...selectedAssignment,
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as DocumentAssignment;

      setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
      setSelectedAssignment(null);
      setFieldValues({});
      alert('Dokument został wysłany pomyślnie!');
    } catch (e) {
      console.error('Błąd wysyłania:', e);
      alert(e instanceof Error ? e.message : 'Nie udało się wysłać dokumentu');
    }
  };

  const startEditing = (assignment: DocumentAssignment) => {
    setSelectedAssignment(assignment);
    // Zamapuj istniejące wartości do kluczy field_id (string)
    const map: { [key: string]: string } = {};
    (assignment.editable_fields || []).forEach(f => {
      const fv = assignment.field_values.find(v => v.field === f.id);
      if (fv) map[f.field_id] = fv.value;
    });
    setFieldValues(map);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Oczekuje';
      case 'in_progress': return 'W trakcie';
      case 'completed': return 'Ukończone';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'completed': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="user-panel">
      <header className="user-header">
        <h1>Panel Użytkownika</h1>
        <div className="user-info">
          <span>Witaj, {user.username}!</span>
          {user.role === 'admin' && (
            <button
              onClick={() => { try { window.location.assign('/admin'); } catch {} }}
              className="send-button"
              style={{ marginRight: 8 }}
              title="Wróć do panelu admina"
            >
              ← Panel administratora
            </button>
          )}
          <button onClick={onLogout} className="logout-button">Wyloguj</button>
        </div>
      </header>

      <div className="user-content">
        {!selectedAssignment ? (
          <div className="assignments-section">
            <h2>Twoje dokumenty do wypełnienia</h2>
            
            <div className="assignments-list">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-header">
                    <h3>{assignment.document_name}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(assignment.status) }}
                    >
                      {getStatusText(assignment.status)}
                    </span>
                  </div>
                  
                  <div className="assignment-details">
                    <p><strong>Przydzielono:</strong> {new Date(assignment.assigned_at).toLocaleDateString('pl-PL')}</p>
                    {assignment.completed_at && (
                      <p><strong>Ukończono:</strong> {new Date(assignment.completed_at).toLocaleDateString('pl-PL')}</p>
                    )}
                    <p><strong>Wypełnione pola:</strong> {assignment.field_values.length} / {(assignment.editable_fields || []).length}</p>
                  </div>

                  {assignment.status !== 'completed' && (
                    <button 
                      onClick={() => startEditing(assignment)}
                      className="edit-button"
                    >
                      {assignment.status === 'pending' ? 'Rozpocznij wypełnianie' : 'Kontynuuj wypełnianie'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {assignments.length === 0 && (
              <div className="no-assignments">
                <p>Nie masz jeszcze żadnych dokumentów do wypełnienia.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="document-form">
            <div className="form-header">
              <h2>Wypełnianie: {selectedAssignment.document_name}</h2>
              <button 
                onClick={() => {
                  setSelectedAssignment(null);
                  setFieldValues({});
                }}
                className="back-button"
              >
                ← Powrót do listy
              </button>
            </div>

            <div className="form-content">
              <p className="form-description">
                Wypełnij poniższe pola. Twoje dane zostaną automatycznie wstawione do dokumentu.
              </p>

              <div className="fields-form">
                {(selectedAssignment.editable_fields || []).map((field: EditableField) => {
                  const currentValue = selectedAssignment.field_values.find(fv => fv.field === field.id)?.value || '';
                  const value = fieldValues[field.field_id] ?? currentValue;
                  return (
                    <div key={field.id} className="form-field">
                      <label htmlFor={field.field_id}>{field.label}:</label>
                      <input
                        type={field.field_type}
                        id={field.field_id}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
                        required
                      />
                    </div>
                  );
                })}
              </div>

              <div className="form-actions">
                <button onClick={handleSave} className="save-button">
                  Zapisz zmiany
                </button>
                <button onClick={handleSubmit} className="submit-button">
                  Wyślij dokument
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPanel;
