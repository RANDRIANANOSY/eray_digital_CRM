import { http } from "./http";
import type { MeUpdatePayload, UserDto } from "./types";

export const meApi = {
  get: () => http.get<UserDto>("/api/me"),
  update: (payload: MeUpdatePayload) => http.patch<UserDto>("/api/me", payload),
};
