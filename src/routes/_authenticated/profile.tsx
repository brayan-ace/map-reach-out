import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateProfile, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon, Mail, Phone, ShieldCheck, Sun, Moon,
  CheckCircle2, KeyRound, Loader2, Sparkles, MapPin, Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile & Settings — Lead Finder" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState("Jordan");
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");

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

  if (!user) return null;

  const initials =
    (displayName || user.email || "?").split(/\s+|@/).filter(Boolean).slice(0, 2)
      .map((w) => w[0]).join("").toUpperCase() || "?";

  const handleSave = async () => {
    setSavedMsg(""); setSaving(true);
    try {
      if (displayName !== (user.displayName ?? "")) await updateProfile(user, { displayName });
      const ref = doc(getDb(), "users", user.uid);
      const snap = await getDoc(ref);
      const payload = { uid: user.uid, name: displayName, email: user.email ?? "", phone, signature, updatedAt: serverTimestamp() };
      if (snap.exists()) await updateDoc(ref, payload);
      else await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(""), 2200);
    } catch { setSavedMsg("Could not save"); }
    finally { setSaving(false); }
  };

  const handlePasswordReset = async () => {
    setResetMsg("");
    if (!user.email) return;
    try { await sendPasswordResetEmail(getFirebaseAuth(), user.email); setResetMsg("Reset link sent."); }
    catch { setResetMsg("Could not send link."); }
  };

  const handleVerify = async () => {
    setVerifyMsg("");
    try {
      await sendEmailVerification(user, { url: typeof window !== "undefined" ? window.location.origin : "https://example.com" });
      setVerifyMsg("Verification link sent.");
    } catch { setVerifyMsg("Could not send verification."); }
  };

  const clearLocalData = () => {
    if (!confirm("Clear all locally saved searches and seen-leads data?")) return;
    try { localStorage.removeItem("leadfinder.seen.v1"); localStorage.removeItem("leadfinder.saved.v1"); } catch {}
    setSavedMsg("Local data cleared");
    setTimeout(() => setSavedMsg(""), 2200);
  };

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1100px] mx-auto pb-24">
      <div className="mb-8 animate-rise">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Account</p>
        <h1 className="mt-2 font-display text-[2.25rem] sm:text-5xl text-foreground leading-[0.95]">
          Profile & <span className="italic text-gradient">settings.</span>
        </h1>
      </div>

      {/* Header */}
      <div className="rounded-3xl p-6 md:p-8 card-premium animate-rise">
        <div className="flex items-center gap-5">
          <div
            className="relative w-20 h-20 rounded-2xl grid place-items-center text-2xl font-semibold text-primary-foreground shrink-0 overflow-hidden"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            {user.photoURL ? <img src={user.photoURL} alt="" className="absolute inset-0 w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl md:text-3xl text-foreground truncate">
              {displayName || "Set up your profile"}
            </h2>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-2 mt-1 flex-wrap">
              <Mail className="w-3.5 h-3.5" />{user.email}
              {user.emailVerified ? (
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/40 text-amber-500">Unverified</Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="rounded-3xl mt-5 p-6 card-premium animate-rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader icon={<UserIcon className="w-4 h-4" />} title="Profile" sub="How you appear in WhatsApp messages." />
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <Field label="Display name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 bg-background/40 border-border/60" /></Field>
          <Field label="Phone (optional)">
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" className="h-11 pl-9 bg-background/40 border-border/60" />
            </div>
          </Field>
          <div className="md:col-span-2">
            <Field label="WhatsApp signature">
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Jordan" className="h-11 bg-background/40 border-border/60" />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="h-11 px-6 border-0" style={{ background: "var(--gradient-primary)" }}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save changes
          </Button>
          {savedMsg && <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 className="w-4 h-4" />{savedMsg}</span>}
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-3xl mt-5 p-6 card-premium animate-rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="Appearance" sub="Choose how Lead Finder looks." />
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <ThemeOption active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="w-4 h-4" />} label="Dark" hint="Recommended at night" />
          <ThemeOption active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="w-4 h-4" />} label="Light" hint="Bright and airy" />
        </div>
      </div>

      {/* Security */}
      <div className="rounded-3xl mt-5 p-6 card-premium animate-rise" style={{ animationDelay: "180ms" }}>
        <SectionHeader icon={<ShieldCheck className="w-4 h-4" />} title="Security" sub="Manage password and email verification." />
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <Button variant="outline" onClick={handlePasswordReset} className="h-11 bg-background/40 border-border/60 justify-start">
            <KeyRound className="w-4 h-4 mr-2" />Send password reset link
          </Button>
          <Button variant="outline" onClick={handleVerify} disabled={user.emailVerified} className="h-11 bg-background/40 border-border/60 justify-start">
            <ShieldCheck className="w-4 h-4 mr-2" />{user.emailVerified ? "Email verified" : "Resend verification email"}
          </Button>
        </div>
        {(resetMsg || verifyMsg) && (
          <p className="mt-3 text-sm text-emerald-400 inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{resetMsg || verifyMsg}</p>
        )}
      </div>

      {/* Data */}
      <div className="rounded-3xl mt-5 p-6 card-premium animate-rise" style={{ animationDelay: "240ms" }}>
        <SectionHeader icon={<MapPin className="w-4 h-4" />} title="Data" sub="Manage your local cache." />
        <div className="mt-5">
          <Button variant="outline" onClick={clearLocalData} className="h-11 bg-background/40 border-border/60 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />Clear local saved searches
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground/70 mt-10">
        Account ID: <span className="tabular-nums">{user.uid.slice(0, 8)}…</span>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl grid place-items-center text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>{icon}</div>
      <div>
        <h2 className="font-display text-xl text-foreground leading-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function ThemeOption({ active, onClick, icon, label, hint }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; hint: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all ${active
        ? "border-primary/60 bg-background/60 shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
        : "border-border/60 bg-background/30 hover:bg-background/50 hover:border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg grid place-items-center bg-background/60 text-foreground">{icon}</span>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        {active && <Badge className="text-[10px] uppercase tracking-wider border-0" style={{ background: "var(--gradient-primary)" }}>Active</Badge>}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{hint}</p>
    </button>
  );
}
