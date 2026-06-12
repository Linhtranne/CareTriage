export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN' | 'CONTENT_ADMIN';
  roles?: string[];
  avatarUrl?: string;
  is2faEnabled?: boolean;
}

export interface UserProfile extends Omit<User, 'role'> {
  role?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  specialization?: string;
  hospitalName?: string;
  experienceYears?: number | string;
  degrees?: string;
  bio?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  insuranceNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  twoFactorEmail?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
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
