export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface JwtPayload {
  sub: number;
  email: string;
}
