import React, { useState, useRef, useEffect } from 'react';
import mammoth from 'mammoth';
import { Document, EditableField, User } from '../../types';
import apiClient from '../../services/api';
import './AdminPanel.css';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [assignedDocuments, setAssignedDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pobierz użytkowników i dokumenty przy ładowaniu komponentu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, documentsData] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getAdminDocuments()
        ]);
        setUsers(usersData as User[]);
        setDocuments(documentsData as Document[]);
      } catch (error) {
        console.error('Błąd pobierania danych:', error);
        alert('Błąd pobierania danych z serwera');
      }
    };

    fetchData();
  }, []);

  // Symulowane wypełnione dokumenty - w rzeczywistej aplikacji to by było z API
  const completedDocuments = [
    {
      id: 'completed-1',
      documentName: 'Formularz osobowy.docx',
      userName: 'jan.kowalski',
      userEmail: 'jan.kowalski@example.com',
      completedAt: new Date('2025-01-20'),
      fieldValues: {
        'name': 'Jan Kowalski',
        'email': 'jan.kowalski@example.com',
        'birthdate': '1990-05-15'
      }
    },
    {
      id: 'completed-2',
      documentName: 'Umowa zlecenie.docx',
      userName: 'anna.nowak',
      userEmail: 'anna.nowak@example.com',
      completedAt: new Date('2025-01-19'),
      fieldValues: {
        'company': 'ABC Sp. z o.o.',
        'nip': '123-456-78-90'
      }
    }
  ];

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      const newDocument = await apiClient.uploadDocument(formData) as Document;
      setDocuments([...documents, newDocument]);
      setSelectedDocument(newDocument);
      
      alert('Dokument został pomyślnie wgrany!');
    } catch (error) {
      console.error('Błąd podczas przetwarzania pliku:', error);
      alert(error instanceof Error ? error.message : 'Błąd podczas przetwarzania pliku Word');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectedDocument || selection.toString().trim() === '') return;

    const selectedText = selection.toString().trim();
    const fieldLabel = prompt('Podaj etykietę dla tego pola:', selectedText);
    if (!fieldLabel) return;

    const fieldType = prompt('Typ pola (text/email/number/date):', 'text') as 'text' | 'email' | 'number' | 'date';
    
    const newField: EditableField = {
      id: Date.now(),
      field_id: `field_${Date.now()}`,
      label: fieldLabel,
      placeholder: `Wprowadź ${fieldLabel.toLowerCase()}`,
      field_type: fieldType || 'text',
      position_start: 0,
      position_end: selectedText.length,
      original_value: selectedText,
      created_at: new Date().toISOString(),
    };

    const updatedDocument = {
      ...selectedDocument,
      editable_fields: [...selectedDocument.editable_fields, newField],
    };

    setSelectedDocument(updatedDocument);
    setDocuments(documents.map(doc => 
      doc.id === selectedDocument.id ? updatedDocument : doc
    ));

    selection.removeAllRanges();
  };

  const handleSendDocument = () => {
    if (!selectedDocument || selectedUsers.length === 0) {
      alert('Wybierz dokument i użytkowników');
      return;
    }

    const updatedDocument = {
      ...selectedDocument,
      assignedUsers: selectedUsers,
      status: 'sent' as const,
    };

    setDocuments(documents.map(doc => 
      doc.id === selectedDocument.id ? updatedDocument : doc
    ));
    
    alert(`Dokument wysłany do ${selectedUsers.length} użytkowników`);
    setSelectedUsers([]);
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
                  onClick={() => setSelectedDocument(doc)}
                >
                  <h3>{doc.name}</h3>
                  <p>Status: {doc.status}</p>
                  <p>Pola do edycji: {doc.editable_fields?.length || 0}</p>
                  <p>Przypisani użytkownicy: {doc.assigned_users_count || 0}</p>
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
              <button onClick={handleTextSelection} className="add-field-button">
                Dodaj pole z zaznaczonego tekstu
              </button>
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
                    <div key={field.id} className="field-item">
                      <strong>{field.label}</strong> ({field.field_type})
                      <p>Placeholder: {field.placeholder}</p>
                      <p>Wartość: {field.original_value}</p>
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
          <div className="completed-documents-list">
            {completedDocuments.map(doc => (
              <div key={doc.id} className="completed-document-item">
                <h3>{doc.documentName}</h3>
                <p>Użytkownik: {doc.userName} ({doc.userEmail})</p>
                <p>Data wypełnienia: {doc.completedAt?.toLocaleString()}</p>
                <div className="field-values">
                  {Object.entries(doc.fieldValues).map(([key, value]) => (
                    <div key={key} className="field-value-item">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
