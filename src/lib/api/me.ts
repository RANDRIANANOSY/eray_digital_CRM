import { http } from "./http";
import type { MeUpdatePayload, UserDto } from "./types";

export const meApi = {
  get: () => http.get<UserDto>("/api/me"),
  update: (payload: MeUpdatePayload) => http.patch<UserDto>("/api/me", payload),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return http.postForm<UserDto>("/api/me/avatar", form);
  },
  removeAvatar: () => http.delete<UserDto>("/api/me/avatar"),
};
