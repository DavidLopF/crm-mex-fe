/** Tipos para el módulo de autenticación */

export interface LoginDto {
  email: string;
  password: string;
}

/** Tokens que devuelve el servidor dentro de data.auth */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/** Respuesta completa del login (data) */
export interface LoginResponse {
  auth: AuthTokens;
  fullName: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken: string;
}

/** POST /api/auth/forgot-password */
export interface ForgotPasswordDto {
  email: string;
}

/** POST /api/auth/reset-password */
export interface ResetPasswordDto {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}
