import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateProfile, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { getFirebaseAuth, getDb } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
  KeyRound,
  Loader2,
  Sparkles,
  MapPin,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile & Settings — Lead Finder" }],
  }),
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState("Jordan");
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    (async () => {
      try {
        const snap = await getDoc(doc(getDb(), "users", user.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, any>;
          if (d.phone) setPhone(d.phone);
          if (d.signature) setSignature(d.signature);
        }
      } catch {}
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const initials =
    (displayName || user.email || "?")
      .split(/\s+|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  const handleSave = async () => {
    setSavedMsg("");
    setSaving(true);
    try {
      if (displayName !== (user.displayName ?? "")) {
        await updateProfile(user, { displayName });
      }
      const ref = doc(getDb(), "users", user.uid);
      const snap = await getDoc(ref);
      const payload = {
        uid: user.uid,
        name: displayName,
        email: user.email ?? "",
        phone,
        signature,
        updatedAt: serverTimestamp(),
      };
      if (snap.exists()) await updateDoc(ref, payload);
      else await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(""), 2200);
    } catch (e) {
      setSavedMsg("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetMsg("");
    if (!user.email) return;
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), user.email);
      setResetMsg("Reset link sent.");
    } catch {
      setResetMsg("Could not send link.");
    }
  };

  const handleVerify = async () => {
    setVerifyMsg("");
    try {
      await sendEmailVerification(user, {
        url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
      });
      setVerifyMsg("Verification link sent.");
    } catch {
      setVerifyMsg("Could not send verification.");
    }
  };

  const clearLocalData = () => {
    if (!confirm("Clear all locally saved searches and seen-leads data?")) return;
    try {
      localStorage.removeItem("leadfinder.seen.v1");
      localStorage.removeItem("leadfinder.saved.v1");
    } catch {}
    setSavedMsg("Local data cleared");
    setTimeout(() => setSavedMsg(""), 2200);
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="orb float-slow" style={{ width: 480, height: 480, top: -160, left: -120, background: "var(--gradient-primary)" }} />
      <div className="orb float-slow" style={{ width: 420, height: 420, bottom: -160, right: -120, background: "var(--gradient-accent)", animationDelay: "-4s" }} />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to leads
          </Link>
          <button
            onClick={() => logout().then(() => navigate({ to: "/auth" }))}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        {/* Header card */}
        <Card className="glass border-0 p-6 md:p-8 animate-rise" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-5">
            <div
              className="relative w-20 h-20 rounded-2xl grid place-items-center text-2xl font-bold text-primary-foreground shrink-0"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="absolute inset-0 w-full h-full rounded-2xl object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground truncate">
                {displayName || "Set up your profile"}
              </h1>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
                {user.emailVerified ? (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/40 text-amber-500">
                    Unverified
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Profile section */}
        <Card className="glass border-0 mt-5 p-6 animate-rise" style={{ animationDelay: "60ms" }}>
          <SectionHeader icon={<UserIcon className="w-4 h-4" />} title="Profile" sub="How you appear in WhatsApp messages and across the app." />
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div className="space-y-1.5">
              <Label htmlFor="dn" className="text-xs uppercase tracking-wider text-muted-foreground">Display name</Label>
              <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 bg-background/40 border-border/60" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph" className="text-xs uppercase tracking-wider text-muted-foreground">Phone (optional)</Label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" className="h-11 pl-9 bg-background/40 border-border/60" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="sig" className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp signature</Label>
              <Input id="sig" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Jordan" className="h-11 bg-background/40 border-border/60" />
              <p className="text-xs text-muted-foreground">Used in your default outreach template.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-6 border-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </Button>
            {savedMsg && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
                <CheckCircle2 className="w-4 h-4" /> {savedMsg}
              </span>
            )}
          </div>
        </Card>

        {/* Appearance */}
        <Card className="glass border-0 mt-5 p-6 animate-rise" style={{ animationDelay: "120ms" }}>
          <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="Appearance" sub="Choose how Lead Finder looks." />
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <ThemeOption active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="w-4 h-4" />} label="Dark" hint="Recommended at night" />
            <ThemeOption active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="w-4 h-4" />} label="Light" hint="Bright and airy" />
          </div>
        </Card>

        {/* Security */}
        <Card className="glass border-0 mt-5 p-6 animate-rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader icon={<ShieldCheck className="w-4 h-4" />} title="Security" sub="Manage password and email verification." />
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={handlePasswordReset} className="h-11 bg-background/40 border-border/60 justify-start">
              <KeyRound className="w-4 h-4 mr-2" /> Send password reset link
            </Button>
            <Button variant="outline" onClick={handleVerify} disabled={user.emailVerified} className="h-11 bg-background/40 border-border/60 justify-start">
              <ShieldCheck className="w-4 h-4 mr-2" />
              {user.emailVerified ? "Email verified" : "Resend verification email"}
            </Button>
          </div>
          {(resetMsg || verifyMsg) && (
            <p className="mt-3 text-sm text-emerald-500 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {resetMsg || verifyMsg}
            </p>
          )}
        </Card>

        {/* Data */}
        <Card className="glass border-0 mt-5 p-6 animate-rise" style={{ animationDelay: "240ms" }}>
          <SectionHeader icon={<MapPin className="w-4 h-4" />} title="Data" sub="Manage your local cache of saved searches and seen leads." />
          <div className="mt-5">
            <Button variant="outline" onClick={clearLocalData} className="h-11 bg-background/40 border-border/60 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Clear local saved searches
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground/70 mt-10">
          Account ID: <span className="tabular-nums">{user.uid.slice(0, 8)}…</span>
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg grid place-items-center text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>
        {icon}
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function ThemeOption({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all ${
        active
          ? "border-primary/60 bg-background/60 shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
          : "border-border/60 bg-background/30 hover:bg-background/50 hover:border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg grid place-items-center bg-background/60 text-foreground">{icon}</span>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        {active && (
          <Badge className="text-[10px] uppercase tracking-wider border-0" style={{ background: "var(--gradient-primary)" }}>
            Active
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{hint}</p>
    </button>
  );
}
