export interface UserInfo {
  id: string;
  username: string;
}

export interface JWTPayload {
  sub: string; // user id
  username: string;
  exp: number; // expiration timestamp (seconds)
  iat: number; // issued at timestamp (seconds)
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface RefreshResult {
  accessToken: string;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenError";
  }
}
