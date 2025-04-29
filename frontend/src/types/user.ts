export interface FrontendUser {
    id: number;
    name: string;
    email: string;
  }
  
  export interface LoginResponse {
    token: string;
    user: FrontendUser;
  }