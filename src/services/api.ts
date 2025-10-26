const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Ważne dla sesji Django
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

  // Użytkownicy
  async getUsers() {
    return this.request('/users/');
  }

  // Dokumenty
  async uploadDocument(formData: FormData) {
    return this.request('/documents/upload/', {
      method: 'POST',
      headers: {}, // Nie ustawiaj Content-Type dla FormData
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
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
