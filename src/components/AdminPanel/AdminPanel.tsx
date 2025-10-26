import React, { useState, useRef, useEffect } from 'react';
import { Document, EditableField, User, DocumentAssignment } from '../../types';
import apiClient from '../../services/api';
import './AdminPanel.css';
import { saveAs } from 'file-saver';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [completedAssignments, setCompletedAssignments] = useState<DocumentAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pobierz użytkowników i dokumenty przy ładowaniu komponentu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, documentsData, completed] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getAdminDocuments(),
          apiClient.getCompletedAssignments()
        ]);
        setUsers(usersData as User[]);
        setDocuments(documentsData as Document[]);
        setCompletedAssignments(completed as DocumentAssignment[]);
      } catch (error) {
        console.error('Błąd pobierania danych:', error);
        alert('Błąd pobierania danych z serwera');
      }
    };

    fetchData();
  }, []);

  // helpery niewykorzystane zostały usunięte

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      const newDocument = await apiClient.uploadDocument(formData) as Document;
      setDocuments(prev => [...prev, newDocument]);
      setSelectedDocument(newDocument);
      
      alert('Dokument został pomyślnie wgrany!');
    } catch (error) {
      console.error('Błąd podczas przetwarzania pliku:', error);
      alert(error instanceof Error ? error.message : 'Błąd podczas przetwarzania pliku Word');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || !selectedDocument || selection.toString().trim() === '') return;

    const selectedText = selection.toString().trim();
    const fieldLabel = prompt('Podaj etykietę dla tego pola:', selectedText);
    if (!fieldLabel) return;
    try {
      const payload = {
        document_id: selectedDocument.id,
        field_id: `field_${Date.now()}`,
        label: fieldLabel,
        placeholder: `Wprowadź ${fieldLabel.toLowerCase()}`,
        field_type: 'text',
        position_start: 0,
        position_end: selectedText.length,
        original_value: selectedText,
      } as any;

      const createdField = await apiClient.createField(payload) as EditableField;

      const updatedDocument: Document = {
        ...selectedDocument,
        editable_fields: [...(selectedDocument.editable_fields || []), createdField],
      };

      setSelectedDocument(updatedDocument);
      setDocuments(prev => prev.map(doc => doc.id === selectedDocument.id ? updatedDocument : doc));
    } catch (e) {
      console.error('Błąd tworzenia pola:', e);
      alert(e instanceof Error ? e.message : 'Nie udało się utworzyć pola');
    } finally {
      selection.removeAllRanges();
    }
  };

  const handleSendDocument = async () => {
    if (!selectedDocument || selectedUsers.length === 0) {
      alert('Wybierz dokument i użytkowników');
      return;
    }

    try {
      await apiClient.assignDocument(selectedDocument.id, selectedUsers);

      const updatedDocument: Document = {
        ...selectedDocument,
        status: 'sent',
      } as Document;

      setDocuments(prev => prev.map(doc => doc.id === selectedDocument.id ? updatedDocument : doc));
      setSelectedDocument(updatedDocument);

      alert(`Dokument wysłany do ${selectedUsers.length} użytkowników`);
      setSelectedUsers([]);
    } catch (e) {
      console.error('Błąd podczas wysyłania dokumentu:', e);
      alert(e instanceof Error ? e.message : 'Nie udało się przypisać dokumentu');
    }
  };

  const handleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Panel Administratora</h1>
        <div className="admin-info">
          <span>Witaj, {user.username}!</span>
          <button
            onClick={() => { try { window.location.assign('/user'); } catch {} }}
            className="send-button"
            style={{ marginRight: 8 }}
            title="Przejdź do panelu użytkownika (moje przypisania)"
          >
            Moje dokumenty (wypełnianie)
          </button>
          <button onClick={onLogout} className="logout-button">Wyloguj</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="upload-section">
          <h2>Wgraj dokument Word</h2>
          <input
            type="file"
            accept=".docx,.doc"
            onChange={handleFileUpload}
            ref={fileInputRef}
            disabled={isUploading}
          />
          {isUploading && <p>Przetwarzanie pliku...</p>}
        </div>

        {documents.length > 0 && (
          <div className="documents-section">
            <h2>Dokumenty</h2>
            <div className="documents-list">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                >
                  <div onClick={() => setSelectedDocument(doc)} style={{ cursor: 'pointer' }}>
                    <h3>{doc.name}</h3>
                    <p>Status: {doc.status}</p>
                    <p>Pola do edycji: {doc.editable_fields?.length || 0}</p>
                    <p>Przypisani użytkownicy: {doc.assigned_users_count || 0}</p>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      className="logout-button"
                      onClick={async () => {
                        if (!window.confirm('Usunąć ten dokument? Spowoduje to usunięcie przypisań i wygenerowanych plików.')) return;
                        try {
                          await apiClient.deleteDocument(doc.id);
                          setDocuments(prev => prev.filter(d => d.id !== doc.id));
                          if (selectedDocument?.id === doc.id) {
                            setSelectedDocument(null);
                          }
                        } catch (e) {
                          console.error('Błąd usuwania dokumentu:', e);
                          alert(e instanceof Error ? e.message : 'Nie udało się usunąć dokumentu');
                        }
                      }}
                    >
                      Usuń dokument
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDocument && (
          <div className="document-editor">
            <h2>Edycja dokumentu: {selectedDocument.name}</h2>
            
            <div className="document-content">
              <h3>Zawartość dokumentu</h3>
              <p className="selection-instruction">
                Zaznacz tekst myszką, który ma być edytowalny przez użytkowników, 
                a następnie kliknij przycisk "Dodaj pole".
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <button onClick={handleTextSelection} className="add-field-button">
                  Dodaj pole z zaznaczonego tekstu
                </button>
                <button
                  onClick={async () => {
                    if (!selectedDocument) return;
                    try {
                      const updated = await apiClient.reprocessDocument(selectedDocument.id) as Document;
                      setSelectedDocument(updated);
                      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
                    } catch (e) {
                      console.error('Błąd odświeżania zawartości:', e);
                      alert(e instanceof Error ? e.message : 'Nie udało się odświeżyć zawartości');
                    }
                  }}
                  className="add-field-button"
                >
                  Odśwież zawartość z pliku
                </button>
              </div>
              <div 
                className="document-preview"
                dangerouslySetInnerHTML={{ __html: selectedDocument.original_content }}
              />
            </div>

            {selectedDocument.editable_fields && selectedDocument.editable_fields.length > 0 && (
              <div className="fields-section">
                <h3>Pola do edycji</h3>
                <div className="fields-list">
                  {selectedDocument.editable_fields.map((field: EditableField) => (
                    <div key={field.id} className="field-item" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{field.label}</strong>
                        <p>Placeholder: {field.placeholder}</p>
                        <p>Wartość: {field.original_value}</p>
                      </div>
                      <button
                        className="logout-button"
                        onClick={async () => {
                          if (!window.confirm('Usunąć to pole?')) return;
                          try {
                            await apiClient.deleteField(field.id);
                            const updatedDoc: Document = {
                              ...selectedDocument,
                              editable_fields: selectedDocument.editable_fields.filter(f => f.id !== field.id),
                            };
                            setSelectedDocument(updatedDoc);
                            setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
                          } catch (e) {
                            console.error('Błąd usuwania pola:', e);
                            alert(e instanceof Error ? e.message : 'Nie udało się usunąć pola');
                          }
                        }}
                        title="Usuń pole"
                      >
                        Usuń
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="users-section">
              <h3>Wybierz użytkowników</h3>
              <div className="users-list">
                {users.map(user => (
                  <label key={user.id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                    />
                    {user.username} ({user.email})
                  </label>
                ))}
              </div>
              
              {selectedDocument.editable_fields && selectedDocument.editable_fields.length > 0 && selectedUsers.length > 0 && (
                <button onClick={handleSendDocument} className="send-button">
                  Wyślij dokument do wybranych użytkowników
                </button>
              )}
            </div>
          </div>
        )}

        <div className="completed-documents-section">
          <h2>Wypełnione dokumenty</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              className="send-button"
              onClick={async () => {
                try {
                  const { blob, filename } = await apiClient.fetchCompletedZip();
                  saveAs(blob, filename);
                } catch (e) {
                  console.error('Błąd pobierania ZIP:', e);
                  alert(e instanceof Error ? e.message : 'Nie udało się pobrać ZIPa');
                }
              }}
            >
              Pobierz wszystkie (ZIP)
            </button>
            {selectedDocument && (
              <button
                className="send-button"
                onClick={async () => {
                  try {
                    const { blob, filename } = await apiClient.fetchCompletedZip(selectedDocument.id);
                    saveAs(blob, filename);
                  } catch (e) {
                    console.error('Błąd pobierania ZIP:', e);
                    alert(e instanceof Error ? e.message : 'Nie udało się pobrać ZIPa');
                  }
                }}
              >
                Pobierz ZIP dla tego dokumentu
              </button>
            )}
          </div>
          <div className="completed-documents-list">
            {completedAssignments.length === 0 && (
              <p>Brak ukończonych przypisań.</p>
            )}
            {completedAssignments.map(ass => (
              <div key={ass.id} className="completed-document-item">
                <h3>{ass.document_name}</h3>
                <p>Użytkownik: {ass.user_username}</p>
                {ass.completed_at && (
                  <p>Ukończono: {new Date(ass.completed_at).toLocaleString()}</p>
                )}
                <button
                  onClick={async () => {
                    try {
                      const { blob, filename } = await apiClient.fetchAssignmentDocx(ass.id);
                      saveAs(blob, filename);
                    } catch (e) {
                      console.error('Błąd pobierania pliku:', e);
                      alert(e instanceof Error ? e.message : 'Nie udało się pobrać pliku');
                    }
                  }}
                  className="send-button"
                >
                  Pobierz DOCX
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Usunąć to wypełnione przypisanie i jego pliki?')) return;
                    try {
                      await apiClient.deleteAssignment(ass.id);
                      setCompletedAssignments(prev => prev.filter(a => a.id !== ass.id));
                    } catch (e) {
                      console.error('Błąd usuwania przypisania:', e);
                      alert(e instanceof Error ? e.message : 'Nie udało się usunąć przypisania');
                    }
                  }}
                  className="logout-button"
                  style={{ marginLeft: 8 }}
                >
                  Usuń
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
