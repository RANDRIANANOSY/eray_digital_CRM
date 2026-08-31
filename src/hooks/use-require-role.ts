import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { getRole } from "@/lib/api/auth-storage";
import type { UserRole } from "@/lib/api/types";

/**
 * Client-side guard mirroring the backend's role checks (e.g. ROLE_MANAGER
 * on /api/users/*). The API still enforces this independently — this only
 * spares the user a confusing "Accès refusé" toast for pages they can't use.
 */
export function useRequireRole(allowed: UserRole[]): boolean {
  const navigate = useNavigate();
  const role = getRole() as UserRole | null;
  const isAllowed = role !== null && allowed.includes(role);

  useEffect(() => {
    if (!isAllowed) {
      toast.error("Accès refusé", {
        description: "Cette page est réservée aux managers et administrateurs.",
      });
      navigate("/", { replace: true });
    }
  }, [isAllowed, navigate]);

  return isAllowed;
}
