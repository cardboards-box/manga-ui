export interface AuthResponse {
    error?: string;
    user?: AuthUser;
    token?: string;
}

export interface AuthUser {
    nickname: string;
    avatar: string;
    id: string;
    email: string;
    roles: string[];
    settings?: string;
}