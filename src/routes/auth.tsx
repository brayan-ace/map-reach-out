import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb, googleProvider, humanizeAuthError, isInIframe } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Sparkles, Search, MapPin, MessageCircle, CheckCircle2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Lead Finder" },
      { name: "description", content: "Sign in or create your Lead Finder account." },
    ],
  }),
});

type Mode = "login" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient orbs */}
      <div className="orb float-slow" style={{ width: 520, height: 520, top: -120, left: -120, background: "var(--gradient-primary)" }} />
      <div className="orb float-slow" style={{ width: 460, height: 460, bottom: -160, right: -120, background: "var(--gradient-accent)", animationDelay: "-4s" }} />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4 md:p-8">
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 glass shadow-[var(--shadow-card)]">
          {/* Desktop sliding layout */}
          <div className="relative hidden md:block" style={{ height: 640 }}>
            {/* Sliding visual panel */}
            <div
              className="absolute inset-y-0 w-1/2 transition-transform duration-[600ms] ease-[cubic-bezier(0.7,0,0.2,1)] z-20"
              style={{
                transform: mode === "login" ? "translateX(100%)" : "translateX(0%)",
              }}
            >
              <BrandingPanel mode={mode} onSwitch={() => setMode(mode === "login" ? "signup" : "login")} />
            </div>

            {/* Login form (left) */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 transition-opacity duration-500"
              style={{ opacity: mode === "login" ? 1 : 0, pointerEvents: mode === "login" ? "auto" : "none" }}
            >
              <LoginForm key={mode === "login" ? "login-active" : "login-idle"} active={mode === "login"} />
            </div>

            {/* Signup form (right) */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 transition-opacity duration-500"
              style={{ opacity: mode === "signup" ? 1 : 0, pointerEvents: mode === "signup" ? "auto" : "none" }}
            >
              <SignupForm key={mode === "signup" ? "signup-active" : "signup-idle"} active={mode === "signup"} />
            </div>
          </div>

          {/* Mobile stacked */}
          <div className="md:hidden">
            <div className="p-6">
              <BrandingPanel mode={mode} onSwitch={() => setMode(mode === "login" ? "signup" : "login")} compact />
            </div>
            <div className="border-t border-white/10 p-6">
              <div
                className="transition-all duration-500"
                style={{
                  transform: `translateY(${mode === "login" ? "0" : "-8px"})`,
                }}
              >
                {mode === "login" ? <LoginForm active /> : <SignupForm active />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandingPanel({ mode, onSwitch, compact }: { mode: Mode; onSwitch: () => void; compact?: boolean }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-none p-10 text-white flex flex-col justify-between"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-primary)", mixBlendMode: "overlay" }} />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Lead Finder
        </div>
        <h2 className={`mt-6 font-display font-bold tracking-tight ${compact ? "text-2xl" : "text-4xl"}`}>
          Find businesses without a website. <span className="text-gradient">Win the deal.</span>
        </h2>
        {!compact && (
          <p className="mt-4 max-w-sm text-sm text-white/75">
            Scan any city, surface local businesses missing a web presence, and pitch them on WhatsApp in one tap.
          </p>
        )}
      </div>

      {!compact && (
        <ul className="relative space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2"><Search className="mt-0.5 h-4 w-4 shrink-0" /> Smart search across categories & areas</li>
          <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 100km radius, deduped, ranked leads</li>
          <li className="flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> One-tap personalized WhatsApp outreach</li>
        </ul>
      )}

      <div className="relative">
        <p className="text-sm text-white/70">
          {mode === "login" ? "New here?" : "Already have an account?"}
        </p>
        <button
          onClick={onSwitch}
          className="mt-2 inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          {mode === "login" ? "Create an account" : "Sign in instead"}
        </button>
      </div>
    </div>
  );
}

function FormShell({ title, subtitle, children, active }: { title: string; subtitle: string; children: React.ReactNode; active: boolean }) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-8 py-10 md:px-12">
      <div className={active ? "animate-rise" : ""}>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

async function upsertUserDoc(uid: string, data: Record<string, unknown>, isNew: boolean) {
  const ref = doc(getDb(), "users", uid);
  if (isNew) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true });
  } else {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...data, lastLoginAt: serverTimestamp() });
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
    }
  }
}

function LoginForm({ active }: { active: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setResetMsg("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(humanizeAuthError(err?.code) || "Sign in failed.");
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setError(""); setResetMsg(""); setGoogleBusy(true);
    try {
      const res = await signInWithPopup(getFirebaseAuth(), googleProvider);
      const u = res.user;
      await upsertUserDoc(u.uid, {
        uid: u.uid, name: u.displayName ?? "", email: u.email ?? "", photoURL: u.photoURL ?? "", provider: "google",
      }, false);
      navigate({ to: "/" });
    } catch (err: any) {
      const msg = humanizeAuthError(err?.code);
      if (msg) setError(msg);
    } finally { setGoogleBusy(false); }
  };

  const handleReset = async () => {
    setError(""); setResetMsg("");
    if (!email) { setError("Enter your email above first."); return; }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setResetMsg("Reset link sent — check your inbox.");
    } catch (err: any) {
      setError(humanizeAuthError(err?.code) || "Could not send reset email.");
    }
  };

  return (
    <FormShell title="Welcome back" subtitle="Sign in to continue finding leads." active={active}>
      <form onSubmit={handleLogin} className="space-y-4">
        <Field delay={0} label="Email" htmlFor="login-email">
          <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 focus-glow" />
        </Field>
        <Field delay={50} label="Password" htmlFor="login-password" right={
          <button type="button" onClick={handleReset} className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot password?</button>
        }>
          <div className="relative">
            <Input id="login-password" type={showPw ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10 focus-glow" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {resetMsg && <p className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" />{resetMsg}</p>}

        <div className="animate-rise" style={{ animationDelay: "100ms" }}>
          <Button type="submit" disabled={busy || googleBusy} className="h-11 w-full text-sm font-semibold transition-transform hover:scale-[1.01]" style={{ background: "var(--gradient-primary)" }}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </div>
      </form>

      <Divider />
      <GoogleButton onClick={handleGoogle} busy={googleBusy} disabled={busy} />
    </FormShell>
  );
}

function SignupForm({ active }: { active: boolean }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const strength = scorePassword(password);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      const res = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateProfile(res.user, { displayName: name });
      await upsertUserDoc(res.user.uid, { uid: res.user.uid, name, email, provider: "email" }, true);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(humanizeAuthError(err?.code) || "Sign up failed.");
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setError(""); setGoogleBusy(true);
    try {
      const res = await signInWithPopup(getFirebaseAuth(), googleProvider);
      const u = res.user;
      await upsertUserDoc(u.uid, {
        uid: u.uid, name: u.displayName ?? "", email: u.email ?? "", photoURL: u.photoURL ?? "", provider: "google",
      }, false);
      navigate({ to: "/" });
    } catch (err: any) {
      const msg = humanizeAuthError(err?.code);
      if (msg) setError(msg);
    } finally { setGoogleBusy(false); }
  };

  return (
    <FormShell title="Create your account" subtitle="Start finding website-less businesses today." active={active}>
      <form onSubmit={handleSignup} className="space-y-3.5">
        <Field delay={0} label="Full name" htmlFor="su-name">
          <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} className="h-11 focus-glow" />
        </Field>
        <Field delay={50} label="Email" htmlFor="su-email">
          <Input id="su-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 focus-glow" />
        </Field>
        <Field delay={100} label="Password" htmlFor="su-password">
          <div className="relative">
            <Input id="su-password" type={showPw ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10 focus-glow" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && <StrengthBar strength={strength} />}
        </Field>
        <Field delay={150} label="Confirm password" htmlFor="su-confirm">
          <Input id="su-confirm" type={showPw ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 focus-glow" />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="animate-rise" style={{ animationDelay: "200ms" }}>
          <Button type="submit" disabled={busy || googleBusy} className="h-11 w-full text-sm font-semibold transition-transform hover:scale-[1.01]" style={{ background: "var(--gradient-primary)" }}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </div>
      </form>

      <Divider />
      <GoogleButton onClick={handleGoogle} busy={googleBusy} disabled={busy} />
    </FormShell>
  );
}

function Field({ label, htmlFor, children, right, delay = 0 }: { label: string; htmlFor: string; children: React.ReactNode; right?: React.ReactNode; delay?: number }) {
  return (
    <div className="space-y-1.5 animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</Label>
        {right}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      or
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleButton({ onClick, busy, disabled }: { onClick: () => void; busy: boolean; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] shadow-sm transition-all hover:bg-[#f8f9fa] hover:shadow disabled:opacity-60"
      style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#3c4043]" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.806.54-1.8368.8595-3.0477.8595-2.344 0-4.3282-1.5832-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
          <path d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z" fill="#FBBC05"/>
          <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
        </svg>
      )}
      Continue with Google
    </button>
  );
}

function scorePassword(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(3, s) as 0 | 1 | 2 | 3;
}

function StrengthBar({ strength }: { strength: 0 | 1 | 2 | 3 }) {
  const labels = ["", "Weak", "Medium", "Strong"];
  const colors = ["bg-muted", "bg-destructive", "bg-amber-500", "bg-emerald-500"];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : "bg-muted"}`} />
        ))}
      </div>
      {strength > 0 && <p className="text-[11px] text-muted-foreground">Password strength: {labels[strength]}</p>}
    </div>
  );
}
