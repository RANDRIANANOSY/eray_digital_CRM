import { useState, FormEvent } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { Eye, EyeOff, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/eray.jpg";
import { useConfirmPasswordReset } from "@/hooks/api/useAuth";
import { ApiError } from "@/lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const confirmMutation = useConfirmPasswordReset();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Lien de réinitialisation invalide.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await confirmMutation.mutateAsync({ token, password });
      setDone(true);
      toast.success("Mot de passe mis à jour !");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Une erreur est survenue.";
      setError(message);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-[#f4f6fa] to-[#e9edf5] dark:from-[#0c0f1d] dark:to-[#171a2c] transition-colors duration-500">
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] rounded-full filter blur-[130px] opacity-35 bg-primary/20 dark:bg-primary/10 animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-[-25%] right-[-15%] w-[600px] h-[600px] rounded-full filter blur-[130px] opacity-35 bg-violet/25 dark:bg-violet/10 animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-[420px] z-10">
        <div className="bg-white/80 dark:bg-card/75 backdrop-blur-xl border border-white/50 dark:border-border/10 rounded-[32px] px-8 pt-10 pb-8 shadow-float text-center">
          <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-border/40 shadow-sm">
            <img src={logoUrl} alt="Eray Logo" className="h-16 w-16 object-contain" />
          </div>

          <h1 className="text-[28px] font-bold text-foreground font-display tracking-tight leading-none mb-2">
            Nouveau mot de passe
          </h1>

          {done ? (
            <>
              <p className="text-muted-foreground text-[14px] mb-8 font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                Votre mot de passe a été mis à jour.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3.5 bg-primary text-white border-0 rounded-xl text-[15px] font-semibold hover:bg-[#4338ca] transition-all"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-[14px] mb-8 font-medium">
                Choisissez un nouveau mot de passe pour votre compte.
              </p>

              {error && (
                <div className="bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-semibold mb-5 border-l-4 border-l-red-600 text-left flex items-start gap-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block font-medium text-xs text-foreground/80 pl-1"
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block font-medium text-xs text-foreground/80 pl-1"
                  >
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={confirmMutation.isPending}
                  className="w-full py-3.5 bg-primary text-white border-0 rounded-xl text-[15px] font-semibold cursor-pointer transition-all mt-2 hover:bg-[#4338ca] hover:shadow-float shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {confirmMutation.isPending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-bold hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
