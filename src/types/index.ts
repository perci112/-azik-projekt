export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface EditableField {
  id: number;
  field_id: string;
  label: string;
  placeholder: string;
  field_type: 'text' | 'email' | 'number' | 'date';
  position_start: number;
  position_end: number;
  original_value: string;
  created_at: string;
}

export interface Document {
  id: number;
  name: string;
  file: string;
  original_content: string;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'sent' | 'completed';
  editable_fields: EditableField[];
  assigned_users_count: number;
}

export interface FieldValue {
  id: number;
  field: number;
  field_label: string;
  field_type: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentAssignment {
  id: number;
  document: number;
  document_name: string;
  user: number;
  user_username: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  field_values: FieldValue[];
  editable_fields: EditableField[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  message: string;
}
