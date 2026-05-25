export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN' | 'CONTENT_ADMIN';
  avatarUrl?: string;
  is2faEnabled?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  requires2FA?: boolean;
}

export interface LoginPayload {
  email: string;
  password?: string;
  otp?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR';
}
