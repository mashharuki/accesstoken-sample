export interface ErrorResponse {
  error: string;
  details?: unknown;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ProtectedResponse {
  message: string;
  user: {
    id: string;
    username: string;
  };
  timestamp: number;
}
