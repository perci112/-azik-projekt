import React, { useState, useEffect } from 'react';
import { User, DocumentAssignment, EditableField } from '../../types';
import './UserPanel.css';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<DocumentAssignment | null>(null);
  const [fieldValues, setFieldValues] = useState<{ [fieldId: number]: string }>({});

  // Symulowane dane - tylko dokumenty przypisane przez admina
  useEffect(() => {
    // W rzeczywistej aplikacji pobierałbyś to z API na podstawie user.id
    const mockAssignments: DocumentAssignment[] = [
      {
        id: 1,
        document: 1,
        document_name: 'Dokument przesłany przez administratora.docx',
        user: user.id,
        user_username: user.username,
        status: 'pending',
        assigned_at: new Date('2025-01-20').toISOString(),
        field_values: [],
        editable_fields: [],
      }
    ];
    
    // Filtruj tylko te dokumenty które są przypisane do tego konkretnego użytkownika
    const userAssignments = mockAssignments.filter(assignment => assignment.user === user.id);
    setAssignments(userAssignments);
  }, [user.id]);

  // Pola do wypełnienia dla dokumentów przesłanych przez admina
  const getFieldsForDocument = (documentId: number): EditableField[] => {
    // W rzeczywistej aplikacji te pola by pochodziły z API na podstawie dokumentu
    const fieldsMap: { [key: number]: EditableField[] } = {
      1: [
        {
          id: 1,
          field_id: 'field1',
          label: 'Imię i nazwisko',
          placeholder: 'Wprowadź swoje imię i nazwisko',
          field_type: 'text',
          position_start: 0,
          position_end: 0,
          original_value: '',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          field_id: 'field2',
          label: 'Adres email',
          placeholder: 'Wprowadź swój email',
          field_type: 'email',
          position_start: 0,
          position_end: 0,
          original_value: '',
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          field_id: 'field3',
          label: 'Numer telefonu',
          placeholder: 'Wprowadź numer telefonu',
          field_type: 'text',
          position_start: 0,
          position_end: 0,
          original_value: '',
          created_at: new Date().toISOString(),
        },
      ],
    };
    return fieldsMap[documentId] || [];
  };

  const getDocumentName = (documentId: number): string => {
    // W rzeczywistej aplikacji nazwa dokumentu by pochodziła z API
    const names: { [key: number]: string } = {
      1: 'Dokument przesłany przez administratora.docx',
    };
    return names[documentId] || `Dokument ${documentId}`;
  };

  const handleFieldChange = (fieldId: number, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = () => {
    if (!selectedAssignment) return;

    // Convert field_values array to object for consistency
    const currentFieldValues: { [fieldId: number]: string } = selectedAssignment.field_values.reduce((acc, fv) => ({
      ...acc,
      [fv.field]: fv.value
    }), {});

    const updatedAssignment = {
      ...selectedAssignment,
      field_values: Object.entries({ ...currentFieldValues, ...fieldValues }).map(([fieldId, value]) => ({
        id: parseInt(fieldId),
        field: parseInt(fieldId),
        field_label: '',
        field_type: 'text',
        value: value as string,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      status: 'in_progress' as const,
    };

    setAssignments(assignments.map(assignment =>
      assignment.id === selectedAssignment.id ? updatedAssignment : assignment
    ));

    setSelectedAssignment(updatedAssignment);
    alert('Zmiany zostały zapisane');
  };

  const handleSubmit = () => {
    if (!selectedAssignment) return;

    const fields = getFieldsForDocument(selectedAssignment.document);
    const currentFieldValues: { [fieldId: number]: string } = selectedAssignment.field_values.reduce((acc, fv) => ({
      ...acc,
      [fv.field]: fv.value
    }), {});
    
    const allFieldsFilled = fields.every(field => 
      fieldValues[field.id] || currentFieldValues[field.id]
    );

    if (!allFieldsFilled) {
      alert('Wypełnij wszystkie pola przed wysłaniem');
      return;
    }

    const updatedAssignment = {
      ...selectedAssignment,
      field_values: Object.entries({ ...currentFieldValues, ...fieldValues }).map(([fieldId, value]) => ({
        id: parseInt(fieldId),
        field: parseInt(fieldId),
        field_label: '',
        field_type: 'text',
        value: value as string,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
    };

    setAssignments(assignments.map(assignment =>
      assignment.id === selectedAssignment.id ? updatedAssignment : assignment
    ));

    setSelectedAssignment(null);
    setFieldValues({});
    alert('Dokument został wysłany pomyślnie!');
  };

  const startEditing = (assignment: DocumentAssignment) => {
    setSelectedAssignment(assignment);
    // Convert field_values array to object for form state
    const fieldValuesObj = assignment.field_values.reduce((acc, fv) => ({
      ...acc,
      [fv.field]: fv.value
    }), {});
    setFieldValues(fieldValuesObj);
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
                    <h3>{getDocumentName(assignment.document)}</h3>
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
                    <p><strong>Wypełnione pola:</strong> {assignment.field_values.length} / {getFieldsForDocument(assignment.document).length}</p>
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
              <h2>Wypełnianie: {getDocumentName(selectedAssignment.document)}</h2>
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
                {getFieldsForDocument(selectedAssignment.document).map(field => {
                  // Get current value from field_values array
                  const currentValue = selectedAssignment.field_values.find(fv => fv.field === field.id);
                  return (
                    <div key={field.id} className="form-field">
                      <label htmlFor={field.id.toString()}>{field.label}:</label>
                      <input
                        type={field.field_type}
                        id={field.id.toString()}
                        placeholder={field.placeholder}
                        value={fieldValues[field.id] || currentValue?.value || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
