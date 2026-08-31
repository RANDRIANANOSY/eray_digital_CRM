import { http } from "./http";
import type { UserDto, UserInvitePayload, UserStatus, UserUpdatePayload } from "./types";

export const usersApi = {
  list: () => http.get<UserDto[]>("/api/users"),
  invite: (payload: UserInvitePayload) => http.post<UserDto>("/api/users/invite", payload),
  update: (id: number, payload: UserUpdatePayload) =>
    http.put<UserDto>(`/api/users/${id}`, payload),
  setStatus: (id: number, status: UserStatus) =>
    http.patch<UserDto>(`/api/users/${id}/status`, { status }),
};
