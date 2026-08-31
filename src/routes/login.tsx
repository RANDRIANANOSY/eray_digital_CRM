import { useState, FormEvent } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/eray.jpg";
import { useLogin, useRequestPasswordReset } from "@/hooks/api/useAuth";
import { saveSession } from "@/lib/api/auth-storage";
import { ApiError } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useLogin();
  const resetMutation = useRequestPasswordReset();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    searchParams.get("expired") ? "Votre session a expiré. Merci de vous reconnecter." : "",
  );

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Demo1234!");
    toast.success("Champs pré-remplis !", {
      description: `Identifiants pour ${demoEmail} ajoutés. Cliquez sur Se connecter.`,
      duration: 2000,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    try {
      const { token, role, user } = await loginMutation.mutateAsync({
        email: trimmedEmail,
        password: trimmedPassword,
        remember,
      });

      saveSession(token, role, user.fullName, remember);

      toast.success("Connexion réussie !", {
        description: `Bienvenue, ${user.fullName} !`,
      });

      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.status === 429
            ? "Trop de tentatives. Merci de réessayer dans quelques minutes."
            : err.message
          : "Une erreur est survenue. Veuillez réessayer.";
      setError(message);
      toast.error("Erreur de connexion", { description: message });
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await resetMutation.mutateAsync(forgotEmail.trim());
      toast.success("E-mail envoyé", {
        description: "Si cette adresse existe, un lien de réinitialisation a été envoyé.",
      });
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-100 dark:bg-slate-950 transition-colors duration-500 font-sans">
      {/* Outer Split Card Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-card rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px] border border-slate-100 dark:border-border/20">
        {/* LEFT PANEL - Gradient Blue with Logo & Decorative Cloud Wave */}
        <div className="relative w-full md:w-5/12 bg-gradient-to-br from-[#0052D4] via-[#4364F7] to-[#6FB1FC] p-8 md:p-10 text-white flex flex-col justify-between items-center text-center overflow-hidden min-h-[260px] md:min-h-[580px]">
          {/* Background circles for soft ambient glow */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          {/* Top Welcome Title */}
          <div className="z-10 w-full pt-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/95 font-display">
              Bienvenue sur
            </h2>
          </div>

          {/* Center Logo & Brand Info */}
          <div className="z-10 flex flex-col items-center my-auto py-6">
            <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mb-5 p-2.5 transition-transform duration-300 hover:scale-105">
              <img src={logoUrl} alt="Eray Logo" className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 font-display">
              Eray CRM
            </h1>
            <p className="text-xs md:text-sm text-blue-100 leading-relaxed max-w-xs font-medium">
              Votre espace de gestion commerciale & relation client tout-en-un.
            </p>
          </div>

          {/* Footer note in left panel */}
          <div className="z-10 text-[11px] text-blue-200/80 font-medium">Version MVP 1.0</div>

          {/* SVG Cloud Wave Divider for Desktop (Right edge of left panel) */}
          <div className="hidden md:block absolute top-0 bottom-0 -right-1 w-16 h-full pointer-events-none z-20">
            <svg
              className="h-full w-full text-white dark:text-card fill-current"
              viewBox="0 0 100 800"
              preserveAspectRatio="none"
            >
              <path
                d="M100,0 L0,0 C50,60 70,120 30,180 C80,240 60,320 20,380 C70,440 80,520 30,580 C80,640 50,720 0,800 L100,800 Z"
                className="opacity-30 fill-blue-300"
              />
              <path d="M100,0 L20,0 C65,70 80,140 40,200 C85,260 70,340 35,400 C80,460 85,540 40,600 C85,660 60,740 20,800 L100,800 Z" />
            </svg>
          </div>

          {/* SVG Cloud Wave Divider for Mobile (Bottom edge of top blue banner) */}
          <div className="block md:hidden absolute bottom-0 left-0 right-0 h-10 w-full pointer-events-none z-20 translate-y-[1px]">
            <svg
              className="w-full h-full text-white dark:text-card fill-current"
              viewBox="0 0 800 100"
              preserveAspectRatio="none"
            >
              <path d="M0,0 Q200,80 400,30 Q600,90 800,10 L800,100 L0,100 Z" />
            </svg>
          </div>
        </div>

        {/* RIGHT PANEL - Form Container */}
        <div className="w-full md:w-7/12 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white dark:bg-card">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-display mb-1.5">
                Connexion
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Veuillez saisir vos identifiants pour accéder à votre compte
              </p>
            </div>

            {/* Error panel */}
            {error && (
              <div className="bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-semibold mb-6 border-l-4 border-l-red-600 text-left flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block font-medium text-xs text-foreground/80 pl-1"
                >
                  Adresse email
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    placeholder="exemple@entreprise.fr"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-border/40 rounded-xl text-[15px] bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block font-medium text-xs text-foreground/80 pl-1"
                >
                  Mot de passe
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 dark:border-border/40 rounded-xl text-[15px] bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs my-2 pt-1 flex-wrap gap-2">
                <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 border-slate-300 rounded accent-primary cursor-pointer"
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-primary hover:text-blue-700 font-semibold transition-colors hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Pill buttons matching template design */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-[#0052D4] to-[#4364F7] text-white rounded-full text-[15px] font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:brightness-105 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Connexion…</span>
                    </>
                  ) : (
                    <span>Se connecter</span>
                  )}
                </button>

                <Link
                  to="/signup"
                  className="py-3 px-6 border-2 border-slate-200 dark:border-border/40 text-foreground hover:border-primary hover:text-primary rounded-full text-[15px] font-semibold text-center transition-all duration-200 active:scale-[0.98]"
                >
                  S'inscrire
                </Link>
              </div>
            </form>

            {/* Quick login credentials picker */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-border/30 text-left">
              <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Comptes de test (Sélection rapide)
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin@eray.com")}
                  className="p-2.5 border border-slate-200 dark:border-border/30 rounded-xl hover:bg-slate-50 dark:hover:bg-muted/30 text-left transition-all text-xs"
                >
                  <div className="font-semibold text-foreground truncate">AE (Admin)</div>
                  <div className="text-[10px] text-muted-foreground truncate">admin@eray.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("yanis@eray.com")}
                  className="p-2.5 border border-slate-200 dark:border-border/30 rounded-xl hover:bg-slate-50 dark:hover:bg-muted/30 text-left transition-all text-xs"
                >
                  <div className="font-semibold text-foreground truncate">YM (Commercial)</div>
                  <div className="text-[10px] text-muted-foreground truncate">yanis@eray.com</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleForgotPassword}>
            <DialogHeader>
              <DialogTitle>Mot de passe oublié</DialogTitle>
              <DialogDescription>
                Indiquez votre adresse e-mail, nous vous enverrons un lien de réinitialisation.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label
                htmlFor="forgot-email"
                className="block font-medium text-xs text-foreground/80 mb-1.5"
              >
                Email
              </label>
              <input
                type="email"
                id="forgot-email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={resetMutation.isPending} className="w-full">
                {resetMutation.isPending ? "Envoi en cours…" : "Envoyer le lien"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
