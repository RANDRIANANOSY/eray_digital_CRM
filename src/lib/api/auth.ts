import { http } from "./http";
import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  UserDto,
} from "./types";

export const authApi = {
  login: (payload: LoginPayload) => http.post<LoginResult>("/api/auth/login", payload),
  register: (payload: RegisterPayload) => http.post<UserDto>("/api/auth/register", payload),
  logout: () => http.post<null>("/api/auth/logout"),
  requestPasswordReset: (email: string) => http.post<null>("/api/auth/password-reset", { email }),
  confirmPasswordReset: (token: string, password: string) =>
    http.post<null>("/api/auth/password-reset/confirm", { token, password }),
  changePassword: (payload: ChangePasswordPayload) => http.patch<null>("/api/me/password", payload),
};
