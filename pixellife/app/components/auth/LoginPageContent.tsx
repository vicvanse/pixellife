"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type BootStage = 0 | 1 | 2 | 3;

interface HudBit {
  id: string;
  label: string;
  side: "tl" | "tr" | "bl" | "br";
  delay: number;
}

type AuthLanguage = "PT" | "EN" | "JP" | "ES" | "FR" | "DE" | "IT" | "RU" | "ZH" | "KO";

const validLanguages: AuthLanguage[] = ["PT", "EN", "JP", "ES", "FR", "DE", "IT", "RU", "ZH", "KO"];

// Helper function to detect browser language and map to auth language codes
function getDefaultLanguage(): AuthLanguage {
  if (typeof window === 'undefined') return 'EN';
  
  // Check localStorage first
  const saved = localStorage.getItem('authLanguage') as AuthLanguage;
  if (saved && validLanguages.includes(saved)) {
    return saved;
  }
  
  // Detect browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  // Map browser language codes to auth language codes
  const langMap: Record<string, AuthLanguage> = {
    'pt': 'PT',
    'en': 'EN',
    'ja': 'JP',
    'es': 'ES',
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT',
    'ru': 'RU',
    'zh': 'ZH',
    'ko': 'KO',
  };
  
  return langMap[langCode] || 'EN';
}

// Translations
const translations = {
  PT: {
    email: "Email",
    password: "Senha",
    rememberMe: "Manter sessão",
    enter: "ENTER",
    creating: "PROCESSING...",
    createAccount: "Criar conta",
    alternative: "Alternativo",
    magicLink: "MAGIC LINK",
    google: "Google",
    apple: "Apple",
    sobre: "SOBRE",
    privacidade: "PRIVACIDADE",
    termos: "TERMOS",
    community: "COMMUNITY",
    fillEmailPassword: "Por favor, preencha email e senha",
    fillEmail: "Por favor, insira seu email",
    emailPasswordError: "Email ou senha incorretos",
    magicLinkError: "Erro ao enviar link de acesso",
    googleError: "Erro ao fazer login com Google",
    appleError: "Erro ao fazer login com Apple",
    lifeManagement: "LIFE MANAGEMENT • SESSION GATE",
  },
  EN: {
    email: "Email",
    password: "Password",
    rememberMe: "Remember me",
    enter: "ENTER",
    creating: "PROCESSING...",
    createAccount: "Create account",
    alternative: "Alternative",
    magicLink: "MAGIC LINK",
    google: "Google",
    apple: "Apple",
    sobre: "ABOUT",
    privacidade: "PRIVACY",
    termos: "TERMS",
    community: "COMMUNITY",
    fillEmailPassword: "Please fill in email and password",
    fillEmail: "Please enter your email",
    emailPasswordError: "Incorrect email or password",
    magicLinkError: "Error sending access link",
    googleError: "Error signing in with Google",
    appleError: "Error signing in with Apple",
    lifeManagement: "LIFE MANAGEMENT • SESSION GATE",
  },
  JP: {
    email: "メール",
    password: "パスワード",
    rememberMe: "ログイン状態を保持",
    enter: "ENTER",
    creating: "処理中...",
    createAccount: "アカウント作成",
    alternative: "代替",
    magicLink: "マジックリンク",
    google: "Google",
    apple: "Apple",
    sobre: "について",
    privacidade: "プライバシー",
    termos: "利用規約",
    community: "コミュニティ",
    fillEmailPassword: "メールとパスワードを入力してください",
    fillEmail: "メールアドレスを入力してください",
    emailPasswordError: "メールまたはパスワードが正しくありません",
    magicLinkError: "アクセスリンクの送信エラー",
    googleError: "Googleでのサインインエラー",
    appleError: "Appleでのサインインエラー",
    lifeManagement: "ライフマネジメント • セッションゲート",
  },
  ES: {
    email: "Correo",
    password: "Contraseña",
    rememberMe: "Recordarme",
    enter: "ENTRAR",
    creating: "PROCESANDO...",
    createAccount: "Crear cuenta",
    alternative: "Alternativo",
    magicLink: "ENLACE MÁGICO",
    google: "Google",
    apple: "Apple",
    sobre: "ACERCA DE",
    privacidade: "PRIVACIDAD",
    termos: "TÉRMINOS",
    community: "COMUNIDAD",
    fillEmailPassword: "Por favor, complete correo y contraseña",
    fillEmail: "Por favor, ingrese su correo",
    emailPasswordError: "Correo o contraseña incorrectos",
    magicLinkError: "Error al enviar enlace de acceso",
    googleError: "Error al iniciar sesión con Google",
    appleError: "Error al iniciar sesión con Apple",
    lifeManagement: "GESTIÓN DE VIDA • PUERTA DE SESIÓN",
  },
  FR: {
    email: "Email",
    password: "Mot de passe",
    rememberMe: "Se souvenir de moi",
    enter: "ENTRER",
    creating: "TRAITEMENT...",
    createAccount: "Créer un compte",
    alternative: "Alternatif",
    magicLink: "LIEN MAGIQUE",
    google: "Google",
    apple: "Apple",
    sobre: "À PROPOS",
    privacidade: "CONFIDENTIALITÉ",
    termos: "TERMES",
    community: "COMMUNAUTÉ",
    fillEmailPassword: "Veuillez remplir l'email et le mot de passe",
    fillEmail: "Veuillez entrer votre email",
    emailPasswordError: "Email ou mot de passe incorrect",
    magicLinkError: "Erreur lors de l'envoi du lien d'accès",
    googleError: "Erreur de connexion avec Google",
    appleError: "Erreur de connexion avec Apple",
    lifeManagement: "GESTION DE VIE • PORTE DE SESSION",
  },
  DE: {
    email: "E-Mail",
    password: "Passwort",
    rememberMe: "Angemeldet bleiben",
    enter: "EINGABE",
    creating: "VERARBEITUNG...",
    createAccount: "Konto erstellen",
    alternative: "Alternativ",
    magicLink: "MAGISCHER LINK",
    google: "Google",
    apple: "Apple",
    sobre: "ÜBER",
    privacidade: "DATENSCHUTZ",
    termos: "BEDINGUNGEN",
    community: "GEMEINSCHAFT",
    fillEmailPassword: "Bitte E-Mail und Passwort ausfüllen",
    fillEmail: "Bitte geben Sie Ihre E-Mail ein",
    emailPasswordError: "E-Mail oder Passwort falsch",
    magicLinkError: "Fehler beim Senden des Zugangslinks",
    googleError: "Fehler bei der Anmeldung mit Google",
    appleError: "Fehler bei der Anmeldung mit Apple",
    lifeManagement: "LEBENSVERWALTUNG • SESSIONSTOR",
  },
  IT: {
    email: "Email",
    password: "Password",
    rememberMe: "Ricordami",
    enter: "INVIA",
    creating: "ELABORAZIONE...",
    createAccount: "Crea account",
    alternative: "Alternativo",
    magicLink: "LINK MAGICO",
    google: "Google",
    apple: "Apple",
    sobre: "CHI SIAMO",
    privacidade: "PRIVACY",
    termos: "TERMINI",
    community: "COMUNITÀ",
    fillEmailPassword: "Si prega di compilare email e password",
    fillEmail: "Si prega di inserire la tua email",
    emailPasswordError: "Email o password errati",
    magicLinkError: "Errore nell'invio del link di accesso",
    googleError: "Errore nell'accesso con Google",
    appleError: "Errore nell'accesso con Apple",
    lifeManagement: "GESTIONE VITA • PORTA SESSIONE",
  },
  RU: {
    email: "Эл. почта",
    password: "Пароль",
    rememberMe: "Запомнить меня",
    enter: "ВОЙТИ",
    creating: "ОБРАБОТКА...",
    createAccount: "Создать аккаунт",
    alternative: "Альтернатива",
    magicLink: "МАГИЧЕСКАЯ ССЫЛКА",
    google: "Google",
    apple: "Apple",
    sobre: "О НАС",
    privacidade: "КОНФИДЕНЦИАЛЬНОСТЬ",
    termos: "УСЛОВИЯ",
    community: "СООБЩЕСТВО",
    fillEmailPassword: "Пожалуйста, заполните email и пароль",
    fillEmail: "Пожалуйста, введите ваш email",
    emailPasswordError: "Неверный email или пароль",
    magicLinkError: "Ошибка отправки ссылки доступа",
    googleError: "Ошибка входа через Google",
    appleError: "Ошибка входа через Apple",
    lifeManagement: "УПРАВЛЕНИЕ ЖИЗНЬЮ • СЕССИОННЫЙ ШЛЮЗ",
  },
  ZH: {
    email: "电子邮件",
    password: "密码",
    rememberMe: "记住我",
    enter: "进入",
    creating: "处理中...",
    createAccount: "创建账户",
    alternative: "替代",
    magicLink: "魔法链接",
    google: "Google",
    apple: "Apple",
    sobre: "关于",
    privacidade: "隐私",
    termos: "条款",
    community: "社区",
    fillEmailPassword: "请填写电子邮件和密码",
    fillEmail: "请输入您的电子邮件",
    emailPasswordError: "电子邮件或密码错误",
    magicLinkError: "发送访问链接错误",
    googleError: "使用Google登录时出错",
    appleError: "使用Apple登录时出错",
    lifeManagement: "生活管理 • 会话门",
  },
  KO: {
    email: "이메일",
    password: "비밀번호",
    rememberMe: "로그인 상태 유지",
    enter: "입장",
    creating: "처리 중...",
    createAccount: "계정 만들기",
    alternative: "대안",
    magicLink: "매직 링크",
    google: "Google",
    apple: "Apple",
    sobre: "정보",
    privacidade: "개인정보",
    termos: "약관",
    community: "커뮤니티",
    fillEmailPassword: "이메일과 비밀번호를 입력하세요",
    fillEmail: "이메일을 입력하세요",
    emailPasswordError: "이메일 또는 비밀번호가 올바르지 않습니다",
    magicLinkError: "액세스 링크 전송 오류",
    googleError: "Google 로그인 오류",
    appleError: "Apple 로그인 오류",
    lifeManagement: "생활 관리 • 세션 게이트",
  },
};

export function LoginPageContent() {
  const { user, loading: authLoading, loginEmail, loginPassword, loginGoogle, loginApple } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootStage, setBootStage] = useState<BootStage>(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<"google" | "apple" | "magic" | null>(null);
  const [language, setLanguage] = useState<AuthLanguage>(() => {
    if (typeof window !== 'undefined') {
      return getDefaultLanguage();
    }
    return 'EN';
  });

  const t = translations[language];

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('authLanguage') as AuthLanguage;
    if (saved && validLanguages.includes(saved)) {
      setLanguage(saved);
    } else {
      const defaultLang = getDefaultLanguage();
      setLanguage(defaultLang);
      localStorage.setItem('authLanguage', defaultLang);
    }
  }, []);

  // Handle language change and persist to localStorage
  const handleLanguageChange = (lang: AuthLanguage) => {
    setLanguage(lang);
    localStorage.setItem('authLanguage', lang);
  };

  // Boot sequence - elementos aparecendo progressivamente
  useEffect(() => {
    const t1 = window.setTimeout(() => setBootStage(1), 350);
    const t2 = window.setTimeout(() => setBootStage(2), 900);
    const t3 = window.setTimeout(() => setBootStage(3), 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/display");
    }
  }, [user, authLoading, router]);

  // HUD elements nos cantos (atualizar label se rememberMe estiver ativo)
  const hudBits: HudBit[] = useMemo(
    () => [
      { id: "hud-1", label: rememberMe ? "AUTH / PERSIST" : "AUTH / HANDSHAKE", side: "tl", delay: 0.55 },
      { id: "hud-2", label: "SYNC / STANDBY", side: "br", delay: 1.05 },
      { id: "hud-3", label: "ENCRYPT / OK", side: "tr", delay: 1.45 },
      { id: "hud-4", label: rememberMe ? "SESSION / PERSIST" : "CACHE / READY", side: "bl", delay: 1.85 },
    ],
    [rememberMe]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

      if (!email.trim() || !password.trim()) {
      setError(t.fillEmailPassword);
        return;
      }

      setIsLoading(true);
      const { error: authError } = await loginPassword(email.trim(), password, rememberMe);
      setIsLoading(false);

      if (authError) {
      setError(authError.message || t.emailPasswordError);
      }
      // loginPassword já faz redirecionamento automático se bem-sucedido
  };

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    setError(null);
    setIsOAuthLoading(provider);
    try {
      const { error: authError } = provider === "google" 
        ? await loginGoogle(rememberMe)
        : await loginApple(rememberMe);
      if (authError) {
        setError(authError.message || (provider === "google" ? t.googleError : t.appleError));
      }
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    if (!email.trim()) {
      setError(t.fillEmail);
      return;
    }

    setIsOAuthLoading("magic");
    try {
      const { error: authError } = await loginEmail(email.trim(), rememberMe);
      if (authError) {
        setError(authError.message || t.magicLinkError);
      } else {
        router.push("/auth/verify-email");
      }
    } finally {
      setIsOAuthLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#F1F1F1]">
        <p className="text-sm tracking-widest">INITIALIZING...</p>
      </div>
    );
  }

  if (user) {
    return null; // Redirecionando...
  }

  return (
    <main className="min-h-[100svh] w-full bg-[#0a0a0a] text-[#F1F1F1] relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_35%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0)_55%),radial-gradient(55%_60%_at_15%_85%,rgba(255,255,255,0.035)_0%,rgba(0,0,0,0)_60%),radial-gradient(55%_60%_at_85%_85%,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0)_60%),linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.85))]" />

        {/* Soft geometric slabs */}
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: bootStage >= 1 ? 1 : 0 }}
        >
          <div className="slab slab-a" />
          <div className="slab slab-b" />
          <div className="slab slab-c" />
        </div>

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-[0.12]" />

        {/* Procedural noise */}
        <NoiseOverlay />

        {/* Subtle fog / bloom */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-700"
          style={{ opacity: bootStage >= 2 ? 0.7 : 0 }}
        >
          <div className="fogLayer" />
        </div>

        {/* HUD chips */}
        <div className="absolute inset-0 pointer-events-none">
          {hudBits.map((bit) => (
            <HUDChip
              key={bit.id}
              label={bit.label}
              side={bit.side}
              delay={bit.delay}
              visible={bootStage >= 2}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[100svh] w-full items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <div className="flex flex-col items-center justify-center">
            {/* Center "Dollars" composition */}
            <div
              className="relative flex items-center justify-center mb-6"
              style={{ 
                width: 420, 
                height: 420, 
                maxWidth: "min(92vw, 420px)", 
                maxHeight: "min(92vw, 420px)",
                minWidth: "280px",
                minHeight: "280px",
                marginTop: "clamp(5vh, 10vh, 80px)"
              }}
            >
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full ringOuter" />

              {/* Inner ring */}
              <div className="absolute inset-[18px] rounded-full ringInner" />

              {/* Living "Detroit" loading ring */}
              <div
                className="absolute inset-[74px] rounded-full transition-opacity duration-700"
                style={{ opacity: bootStage >= 1 ? 1 : 0 }}
              >
                <LivingRing />
              </div>

              {/* Wordmark */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 px-4"
                style={{ opacity: bootStage >= 1 ? 1 : 0 }}
              >
                <DottedWordmark text="PIXEL LIFE" />
                <div className="mt-3 text-[10px] sm:text-xs tracking-[0.34em] text-[#F1F1F1]/70">
                  {t.lifeManagement}
                </div>
              </div>
            </div>

            {/* Login controls */}
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
              {/* Email input */}
              <div
                className="mb-3 transition-opacity duration-700"
                style={{ opacity: bootStage >= 2 ? 1 : 0 }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder={t.email}
                  required
                  className="w-full bg-transparent px-4 py-3.5 sm:py-3 outline-none text-sm tracking-[0.06em] text-white placeholder:text-white/35"
                  style={{
                    border: "1px solid rgba(241,241,241,0.22)",
                    borderRadius: "999px",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.5) inset",
                    minHeight: "44px",
                  }}
                />
              </div>

              {/* Password input */}
                <div
                  className="mb-3 transition-opacity duration-700"
                  style={{ opacity: bootStage >= 2 ? 1 : 0 }}
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                  placeholder={t.password}
                    required
                    className="w-full bg-transparent px-4 py-3.5 sm:py-3 outline-none text-sm tracking-[0.06em] text-white placeholder:text-white/35"
                    style={{
                      border: "1px solid rgba(241,241,241,0.22)",
                      borderRadius: "999px",
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.5) inset",
                      minHeight: "44px",
                    }}
                  />
                </div>

              {/* Remember Me Toggle and Create Account Link */}
              <div
                className="mb-3 flex items-center justify-between transition-opacity duration-700"
                style={{ opacity: bootStage >= 2 ? 1 : 0 }}
              >
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-[10px] sm:text-xs tracking-widest text-white/60 hover:text-white/80 transition-colors"
                  style={{ 
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="transition-colors flex-shrink-0"
                    style={{ 
                      opacity: rememberMe ? 0.9 : 0.4,
                      color: rememberMe ? "#F1F1F1" : "rgba(241,241,241,0.4)"
                    }}
                  >
                    {rememberMe ? (
                      <path
                        d="M8 1C4.7 1 2 3.7 2 7c0 3.3 2.7 6 6 6s6-2.7 6-6c0-3.3-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm-2-4l1.5 1.5 3-3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <circle
                        cx="8"
                        cy="8"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    )}
                  </svg>
                  <span>{t.rememberMe}</span>
                </button>
                <a
                  href="/auth/register"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/auth/register");
                  }}
                  className="text-[10px] sm:text-xs tracking-widest text-white/55 hover:text-white/75 transition-colors underline"
                  style={{
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t.createAccount}
                </a>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-3 text-xs tracking-widest text-[#F1F1F1]/70 text-center">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || bootStage < 3}
                className="w-full py-3.5 sm:py-3 text-sm tracking-[0.18em] font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  border: "1px solid rgba(241,241,241,0.30)",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.06)",
                  color: "#F1F1F1",
                  opacity: bootStage >= 3 ? 1 : 0,
                  transition: "opacity 700ms",
                  minHeight: "44px",
                }}
              >
                {isLoading ? t.creating : t.enter}
              </button>

              {/* Alternative divider */}
              <div
                className="mt-6 mb-4 flex items-center gap-3 transition-opacity duration-700"
                style={{ opacity: bootStage >= 3 ? 1 : 0 }}
              >
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] tracking-widest text-white/30 uppercase">{t.alternative}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* OAuth Buttons - Google and Apple side by side */}
              <div
                className="mb-2.5 flex gap-2 transition-opacity duration-700"
                style={{ opacity: bootStage >= 3 ? 1 : 0 }}
              >
                {/* Google Button - 50% */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={isOAuthLoading !== null || bootStage < 3}
                  className="flex-1 py-2.5 sm:py-2 text-[10px] sm:text-xs tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 oauthButton"
                  style={{
                    border: "1px solid rgba(241,241,241,0.20)",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    color: "#F1F1F1",
                    backdropFilter: "blur(2px)",
                    minHeight: "40px",
                  }}
                >
                  <GoogleIcon />
                  <span className="hidden sm:inline">{isOAuthLoading === "google" ? t.creating : t.google}</span>
                  <span className="sm:hidden">{isOAuthLoading === "google" ? "..." : "G"}</span>
                </button>

                {/* Apple Button - 50% */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("apple")}
                  disabled={isOAuthLoading !== null || bootStage < 3}
                  className="flex-1 py-2.5 sm:py-2 text-[10px] sm:text-xs tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 oauthButton"
                  style={{
                    border: "1px solid rgba(241,241,241,0.20)",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    color: "#F1F1F1",
                    backdropFilter: "blur(2px)",
                    minHeight: "40px",
                  }}
                >
                  <AppleIcon />
                  <span className="hidden sm:inline">{isOAuthLoading === "apple" ? t.creating : t.apple}</span>
                  <span className="sm:hidden">{isOAuthLoading === "apple" ? "..." : "A"}</span>
                </button>
              </div>

              {/* Magic Link Button - 50% centered */}
              <div
                className="mb-4 flex justify-center transition-opacity duration-700"
                style={{ opacity: bootStage >= 3 ? 1 : 0 }}
              >
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={isOAuthLoading !== null || bootStage < 3}
                  className="w-1/2 py-2.5 sm:py-2 text-[10px] sm:text-xs tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 oauthButton"
                  style={{
                    border: "1px solid rgba(241,241,241,0.20)",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    color: "#F1F1F1",
                    backdropFilter: "blur(2px)",
                    minHeight: "40px",
                  }}
                >
                  <span>{isOAuthLoading === "magic" ? t.creating : t.magicLink}</span>
                </button>
              </div>

              {/* Footer */}
              <div
                className="mt-4 flex items-center justify-center transition-opacity duration-700"
                style={{ opacity: bootStage >= 3 ? 1 : 0 }}
              >
                <div
                  className="px-3 py-1.5 text-xs tracking-[0.18em] text-white/70"
                  style={{
                    border: "1px solid rgba(241,241,241,0.15)",
                    borderRadius: "6px",
                    background: "rgba(0,0,0,0.40)",
                  }}
                >
                  PROJECT PIXEL LIFE
                </div>
              </div>

              {/* Build ID */}
              <div className="mt-2 text-center text-[11px] tracking-[0.12em] text-white/25">
                build: {stablePseudoId()}
              </div>
            </form>

            {/* Language Selector - All languages (moved up, between build and hood) */}
            <div
              className="mt-1 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/55 transition-opacity duration-700 flex-wrap"
              style={{ opacity: bootStage >= 3 ? 1 : 0 }}
            >
              {(["PT", "EN", "JP", "ES", "FR", "DE", "IT", "RU", "ZH", "KO"] as const).map((lang, index) => (
                <span key={lang}>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`tracking-widest transition-colors ${
                      language === lang ? "text-white/90" : "text-white/40 hover:text-white/60"
                    }`}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {lang}
                  </button>
                  {index < 9 && <span className="text-white/25 mx-1">|</span>}
                </span>
              ))}
            </div>

            {/* Hood cinza - SOBRE | PRIVACIDADE | TERMOS | COMMUNITY */}
            <div
              className="mt-3 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm transition-opacity duration-700"
              style={{ opacity: bootStage >= 3 ? 1 : 0 }}
            >
              <a className="hover:underline" href="/about" style={{ color: "#000000", textDecorationColor: "#000000" }}>
                {t.sobre}
              </a>
              <span style={{ color: "#000000" }}>|</span>
              <a className="hover:underline" href="/privacy" style={{ color: "#000000", textDecorationColor: "#000000" }}>
                {t.privacidade}
              </a>
              <span style={{ color: "#000000" }}>|</span>
              <a className="hover:underline" href="/terms" style={{ color: "#000000", textDecorationColor: "#000000" }}>
                {t.termos}
              </a>
              <span style={{ color: "#000000" }}>|</span>
              <a className="hover:underline" href="/community" style={{ color: "#000000", textDecorationColor: "#000000" }}>
                {t.community}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .scanlines {
          background-image: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.08) 1px,
            rgba(0, 0, 0, 0) 3px,
            rgba(0, 0, 0, 0) 6px
          );
          animation: scanShift 7s linear infinite;
        }

        @keyframes scanShift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(28px);
          }
        }

        .fogLayer {
          position: absolute;
          inset: -10%;
          background: radial-gradient(800px 420px at 30% 25%, rgba(255, 255, 255, 0.08), transparent 62%),
            radial-gradient(760px 520px at 75% 70%, rgba(255, 255, 255, 0.06), transparent 64%),
            radial-gradient(620px 420px at 55% 55%, rgba(255, 255, 255, 0.04), transparent 68%);
          filter: blur(1px);
          animation: fogFloat 8.5s ease-in-out infinite;
          opacity: 0.75;
        }

        @keyframes fogFloat {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.65;
          }
          50% {
            transform: translateY(-8px) translateX(10px);
            opacity: 0.85;
          }
        }

        .ringOuter {
          border: 5px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
          opacity: 0.92;
        }

        .ringInner {
          border: 2px solid rgba(255, 255, 255, 0.42);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 0 80px rgba(255, 255, 255, 0.04);
          opacity: 0.85;
        }

        .slab {
          position: absolute;
          inset: -20%;
          opacity: 0.16;
          filter: blur(0.2px);
          mix-blend-mode: screen;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
          transform: rotate(0deg);
          animation: slabDrift 10s ease-in-out infinite;
        }

        .slab-a {
          transform: rotate(24deg) translateX(-8%) translateY(-2%);
        }

        .slab-b {
          opacity: 0.10;
          transform: rotate(-18deg) translateX(10%) translateY(8%);
          animation-duration: 12s;
        }

        .slab-c {
          opacity: 0.08;
          transform: rotate(8deg) translateX(14%) translateY(-10%);
          animation-duration: 14s;
        }

        @keyframes slabDrift {
          0%,
          100% {
            filter: blur(0.2px);
            opacity: inherit;
          }
          50% {
            filter: blur(0.6px);
          }
        }

        .oauthButton:hover:not(:disabled) {
          border-color: rgba(241, 241, 241, 0.35) !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .oauthButton:active:not(:disabled) {
          transform: scale(0.99);
        }
      `}</style>
    </main>
  );
}

// Living Ring Component
function LivingRing() {
  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="0.55" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
        </defs>
        {/* Base faint circle */}
        <circle
          cx="50"
          cy="50"
          r="34"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="8"
          fill="none"
        />
        {/* Segmented arc ring */}
        <g className="ringSpin">
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke="url(#ringGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="24 10"
            className="ringPulse"
          />
          {/* Inner thin ring */}
          <circle
            cx="50"
            cy="50"
            r="26"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="10 6"
            className="ringWobble"
          />
        </g>
      </svg>
      <style jsx>{`
        .ringSpin {
          transform-origin: 50% 50%;
          animation: spin 3.2s linear infinite;
        }

        .ringPulse {
          animation: pulse 2.6s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.10));
        }

        .ringWobble {
          transform-origin: 50% 50%;
          animation: wobble 2.2s ease-in-out infinite;
          opacity: 0.85;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.55;
            stroke-dasharray: 24 10;
          }
          50% {
            opacity: 0.92;
            stroke-dasharray: 28 8;
          }
        }

        @keyframes wobble {
          0%,
          100% {
            transform: rotate(-2deg) scale(1);
          }
          50% {
            transform: rotate(2deg) scale(1.01);
          }
        }
      `}</style>
    </div>
  );
}

// Dotted Wordmark Component
function DottedWordmark({ text }: { text: string }) {
  return (
    <div className="relative inline-block select-none">
      <div className="text-4xl font-semibold tracking-[0.32em] text-white/0">{text}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="wordDots text-4xl font-semibold tracking-[0.32em]">{text}</div>
      </div>
      <style jsx>{`
        .wordDots {
          color: rgba(255, 255, 255, 0.92);
          background-image: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.95) 1.2px,
            rgba(0, 0, 0, 0) 1.4px
          );
          background-size: 7px 7px;
          background-position: 0 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.08));
          animation: shimmer 6.2s ease-in-out infinite;
          font-size: clamp(1.5rem, 8vw, 2.25rem);
        }

        @keyframes shimmer {
          0%,
          100% {
            background-position: 0 0;
            opacity: 0.82;
          }
          50% {
            background-position: 18px 10px;
            opacity: 0.98;
          }
        }

        @media (max-width: 640px) {
          .wordDots {
            font-size: 1.5rem;
            letter-spacing: 0.2em;
          }
        }
      `}</style>
    </div>
  );
}

// Noise Overlay Component
function NoiseOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-overlay">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.32 0"
          />
        </filter>
        <rect width="100" height="100" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

// HUD Chip Component
function HUDChip({
  label,
  side,
  delay,
  visible,
}: {
  label: string;
  side: "tl" | "tr" | "bl" | "br";
  delay: number;
  visible: boolean;
}) {
  const positionClasses = {
    tl: "top-6 left-6",
    tr: "top-6 right-6",
    bl: "bottom-6 left-6",
    br: "bottom-6 right-6",
  };

  return (
    <div
      className={`absolute inline-flex gap-2.5 items-center hudChip ${positionClasses[side]}`}
      style={{
        animationDelay: `${delay}s, ${delay + 5.2}s`,
        opacity: visible ? 1 : 0,
      }}
    >
      <span className="hudDot" />
      {label}
      <style jsx>{`
        .hudChip {
          color: rgba(255, 255, 255, 0.60);
          font: 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
            "Courier New", monospace;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 10px 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(2px);
          opacity: 0;
          transform: translateY(8px);
          animation: chipIn 900ms ease forwards, chipOut 900ms ease forwards;
        }

        .hudDot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.60);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.12);
        }

        @keyframes chipIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes chipOut {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-6px);
          }
        }

        @media (max-width: 880px) {
          .hudChip {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// Google Icon Component (monochrome)
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity: 0.9 }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

// Apple Icon Component (monochrome)
function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ opacity: 0.9 }}
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// Stable pseudo ID (like drrr.com)
function stablePseudoId(): string {
  if (typeof window === "undefined") return "local";

  // @ts-ignore
  if (!window.__pl_id) {
    // @ts-ignore
    window.__pl_id =
      Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }

  // @ts-ignore
  return String(window.__pl_id).slice(0, 28);
}
