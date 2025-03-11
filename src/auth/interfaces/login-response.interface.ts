export interface UserResponse {
    id: number;
    username: string;
    personId: number;
    fullName: string;
    role: string;
}

export interface LoginResponse {
    access_token: string;
    user: UserResponse;
}