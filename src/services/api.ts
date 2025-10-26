const API_BASE_URL = 'http://localhost:3001/api';

// Pomocnicza funkcja do pobrania ciasteczka (np. CSRF)
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async ensureCsrfCookie(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/auth/csrf/`, { credentials: 'include' });
    } catch {
      // ignore
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isUnsafeMethod = (options.method || 'GET').toUpperCase() !== 'GET' && (options.method || 'GET').toUpperCase() !== 'HEAD';
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers = new Headers(options.headers);

    // Dla JSON ustaw Content-Type; dla FormData NIE ustawiamy go ręcznie
    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // CSRF dla metod modyfikujących
    if (isUnsafeMethod) {
      // jeśli brak csrftoken, spróbuj pobrać
      if (!getCookie('csrftoken')) {
        await this.ensureCsrfCookie();
      }
      const csrftoken = getCookie('csrftoken');
      if (csrftoken) {
        headers.set('X-CSRFToken', csrftoken);
      }
      if (!headers.has('X-Requested-With')) {
        headers.set('X-Requested-With', 'XMLHttpRequest');
      }
    }

    const config: RequestInit = {
      credentials: 'include', // Sesje Django
      headers,
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Autentykacja
  async getCSRF() {
    // Pobranie ciasteczka CSRF (ustawiane przez backend)
    return this.request('/auth/csrf/');
  }

  async login(username: string, password: string) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout/', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/current-user/');
  }

  async completeProfile(data: { first_name: string; last_name: string; index: string; section: string }) {
    return this.request('/auth/complete-profile/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Użytkownicy
  async getUsers() {
    return this.request('/users/');
  }

  // Super admin
  async getAllUsers() {
    return this.request('/users/all/');
  }

  async setUserRole(userId: number, role: 'admin' | 'user') {
    return this.request(`/users/${userId}/set-role/`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  // Dokumenty
  async uploadDocument(formData: FormData) {
    // UWAGA: request wykryje FormData i nie ustawi Content-Type
    return this.request('/documents/upload/', {
      method: 'POST',
      body: formData,
    });
  }

  async getAdminDocuments() {
    return this.request('/documents/admin/');
  }

  async createField(fieldData: any) {
    return this.request('/documents/create-field/', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
  }

  async deleteField(fieldId: number) {
    return this.request(`/documents/fields/${fieldId}/`, {
      method: 'DELETE',
    });
  }

  async reprocessDocument(documentId: number) {
    return this.request(`/documents/${documentId}/reprocess/`, {
      method: 'POST',
    });
  }

  async deleteDocument(documentId: number) {
    return this.request(`/documents/${documentId}/`, {
      method: 'DELETE',
    });
  }

  async assignDocument(documentId: number, userIds: number[]) {
    return this.request('/documents/assign/', {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, user_ids: userIds }),
    });
  }

  // Przypisania
  async getUserAssignments() {
    return this.request('/assignments/user/');
  }

  async getCompletedAssignments() {
    return this.request('/assignments/completed/');
  }

  async submitFieldValues(assignmentId: number, fieldValues: { [key: string]: string }) {
    return this.request('/assignments/submit-values/', {
      method: 'POST',
      body: JSON.stringify({
        assignment_id: assignmentId,
        field_values: fieldValues,
      }),
    });
  }

  async completeAssignment(assignmentId: number) {
    return this.request(`/assignments/${assignmentId}/complete/`, {
      method: 'POST',
    });
  }

  // Pobieranie wygenerowanego DOCX (binarnie)
  async fetchAssignmentDocx(assignmentId: number): Promise<{ blob: Blob; filename: string }>{
    const url = `${this.baseURL}/assignments/${assignmentId}/download-docx/`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP error! status: ${res.status}`);
    }
    const cd = res.headers.get('Content-Disposition') || '';
    let filename = `assignment_${assignmentId}.docx`;
    const match = cd.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2]);
    }
    const blob = await res.blob();
    return { blob, filename };
  }

  // ZIP wszystkich ukończonych (opcjonalnie ograniczonych do dokumentu)
  async fetchCompletedZip(documentId?: number): Promise<{ blob: Blob; filename: string }> {
    const url = new URL(`${this.baseURL}/assignments/completed/download-zip/`);
    if (typeof documentId === 'number') url.searchParams.set('document_id', String(documentId));
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP error! status: ${res.status}`);
    }
    const cd = res.headers.get('Content-Disposition') || '';
    let filename = `completed_assignments.zip`;
    const match = cd.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i);
    if (match) filename = decodeURIComponent(match[1] || match[2]);
    const blob = await res.blob();
    return { blob, filename };
  }

  async deleteAssignment(assignmentId: number) {
    return this.request(`/assignments/${assignmentId}/`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
