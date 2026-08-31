import { useState, FormEvent, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import {
  User,
  Briefcase,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/eray.jpg";
import { useRegister } from "@/hooks/api/useAuth";
import { ApiError } from "@/lib/api";

export default function Signup() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Password Strength Meter Logic ---
  const strengthScore = useMemo(() => {
    let score = 0;
    if (password.length === 0) return 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthDetails = useMemo(() => {
    const configs = [
      { text: "8 caractères minimum", color: "bg-slate-200" },
      { text: "Faible", color: "bg-red-500" },
      { text: "Moyen", color: "bg-amber-500" },
      { text: "Bon", color: "bg-yellow-500" },
      { text: "Excellent", color: "bg-emerald-500" },
    ];
    return configs[strengthScore];
  }, [strengthScore]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Veuillez saisir une adresse email valide.");
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

    if (!termsAccepted) {
      setError(
        "Vous devez accepter les conditions d'utilisation et la politique de confidentialité.",
      );
      return;
    }

    try {
      const user = await registerMutation.mutateAsync({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password,
        company: trimmedCompany || null,
      });

      setSuccess("Compte créé avec succès ! Redirection vers la page de connexion…");
      toast.success("Compte créé !", {
        description: `Bienvenue ${user.fullName}. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.`,
      });

      setTimeout(() => navigate("/login"), 1800);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Une erreur est survenue lors de l'inscription.";
      setError(message);
      toast.error("Inscription impossible", { description: message });
    }
  };

  const isLoading = registerMutation.isPending;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-100 dark:bg-slate-950 transition-colors duration-500 font-sans">
      {/* Outer Split Card Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-card rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[620px] border border-slate-100 dark:border-border/20">
        {/* LEFT PANEL - Gradient Blue with Logo & Decorative Cloud Wave */}
        <div className="relative w-full md:w-5/12 bg-gradient-to-br from-[#0052D4] via-[#4364F7] to-[#6FB1FC] p-8 md:p-10 text-white flex flex-col justify-between items-center text-center overflow-hidden min-h-[260px] md:min-h-[620px]">
          {/* Background circles for soft ambient glow */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          {/* Top Welcome Title */}
          <div className="z-10 w-full pt-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/95 font-display">
              Rejoignez
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
              Créez votre compte et développez votre activité commerciale en toute simplicité.
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
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-card">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-display mb-1">
                Créer un compte
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Remplissez les informations ci-dessous pour vous inscrire
              </p>
            </div>

            {/* Feedback panels */}
            {error && (
              <div className="bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-semibold mb-4 border-l-4 border-l-red-600 text-left flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-400 px-4 py-3 rounded-xl text-xs font-semibold mb-4 border-l-4 border-l-green-600 text-left flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="firstName"
                    className="block font-medium text-xs text-foreground/80 pl-1"
                  >
                    Prénom
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="firstName"
                      placeholder="Jean"
                      required
                      autoFocus
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-border/40 rounded-xl text-sm bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="lastName"
                    className="block font-medium text-xs text-foreground/80 pl-1"
                  >
                    Nom
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    placeholder="Dupont"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-border/40 rounded-xl text-sm bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="company"
                  className="block font-medium text-xs text-foreground/80 pl-1"
                >
                  Entreprise
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    id="company"
                    placeholder="Nom de votre entreprise"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-border/40 rounded-xl text-sm bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block font-medium text-xs text-foreground/80 pl-1"
                >
                  Email professionnel
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    placeholder="exemple@entreprise.fr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-border/40 rounded-xl text-sm bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-slate-100/70 dark:bg-muted/30 rounded-xl px-3 py-2">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                <span>Votre compte sera créé avec le rôle Commercial par défaut.</span>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block font-medium text-xs text-foreground/80 pl-1"
                >
                  Mot de passe
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-border/40 rounded-xl text-sm bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1 pl-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            index <= strengthScore
                              ? strengthDetails.color
                              : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold tracking-wide">
                      Force : {strengthDetails.text}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirmPassword"
                  className="block font-medium text-xs text-foreground/80 pl-1"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-border/40 rounded-xl text-sm bg-slate-50/50 dark:bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors pt-1 select-none">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 border-slate-300 rounded accent-primary cursor-pointer shrink-0"
                />
                <span>
                  J'accepte les{" "}
                  <a href="#" className="text-primary font-semibold hover:underline">
                    conditions d'utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="#" className="text-primary font-semibold hover:underline">
                    confidentialité
                  </a>
                </span>
              </label>

              {/* Action Pill Buttons matching template design */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-[#0052D4] to-[#4364F7] text-white rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:brightness-105 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      <span>Création…</span>
                    </>
                  ) : (
                    <span>S'inscrire</span>
                  )}
                </button>

                <Link
                  to="/login"
                  className="py-3 px-5 border-2 border-slate-200 dark:border-border/40 text-foreground hover:border-primary hover:text-primary rounded-full text-sm font-semibold text-center transition-all duration-200 active:scale-[0.98]"
                >
                  Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
