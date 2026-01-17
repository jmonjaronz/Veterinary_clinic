export interface UserResponse {
    id: number;
    username: string;
    personId: number;
    fullName: string;
    role: string;
}

export interface CompanyResponse {
    id: number;
    name: string;
    ruc: string;
    email: string;
    phone: string;
    address: string;
}

export interface LoginResponse {
    access_token: string;
    user: UserResponse;
    company: CompanyResponse;
}