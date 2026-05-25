export interface User {
    id: number;
    username?: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role?: string;
    roles: string[];
    isActive: boolean;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message?: string;
}
