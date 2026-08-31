import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { authApi } from "@/lib/api";
import { clearSession, getRole, isAuthenticated } from "@/lib/api/auth-storage";

export function useLogin() {
  return useMutation({ mutationFn: authApi.login });
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email: string) => authApi.requestPasswordReset(email) });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.confirmPasswordReset(token, password),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    authApi.logout().catch(() => undefined);
    clearSession();
    queryClient.clear();
    navigate("/login");
  };
}

/**
 * Redirects to /login (or /) when the current role isn't in `roles`.
 * Presence-of-token is already enforced by the _app layout guard — this
 * only adds role gating for pages like /users.
 */
export function useRequireRole(roles: string[]) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) return;
    const role = getRole();
    if (role && !roles.includes(role)) {
      navigate("/", { replace: true });
    }
  }, [navigate, roles]);
}
