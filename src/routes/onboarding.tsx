import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { completeOnboarding, getOnboardingStatus } from "@/lib/user-data";
import { getFirebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  MapPin,
  MessageCircle,
  Search,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Target,
  Globe2,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Welcome — Lead Finder" },
      { name: "description", content: "Set up your Lead Finder workspace in under a minute." },
    ],
  }),
});

const ROLES = [
  { id: "freelancer", label: "Solo freelancer", icon: Rocket },
  { id: "agency", label: "Web agency", icon: Target },
  { id: "marketer", label: "Marketer / SDR", icon: MessageCircle },
  { id: "other", label: "Just exploring", icon: Sparkles },
];

const GOALS = [
  { id: "clients", label: "Land more web design clients" },
  { id: "leads", label: "Build a steady lead pipeline" },
  { id: "outreach", label: "Automate cold outreach" },
  { id: "research", label: "Market research" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [region, setRegion] = useState("");
  const [signature, setSignature] = useState("");

  // Auth gate + skip if already onboarded
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setDisplayName(user.displayName ?? "");
    (async () => {
      const status = await getOnboardingStatus(user.uid);
      if (status.completed) {
        navigate({ to: "/" });
        return;
      }
      setChecking(false);
    })();
  }, [user, loading, navigate]);

  const totalSteps = 4;

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (displayName && displayName !== user.displayName) {
        try { await updateProfile(getFirebaseAuth().currentUser!, { displayName }); } catch { /* ignore */ }
      }
      await completeOnboarding(user.uid, {
        displayName,
        role,
        goal,
        region,
        signature,
      });
      navigate({ to: "/" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="orb float-slow" style={{ width: 520, height: 520, top: -160, left: -120, background: "radial-gradient(circle, oklch(0.62 0.22 275 / 0.55), transparent 60%)" }} />
      <div className="orb float-slow" style={{ width: 480, height: 480, bottom: -160, right: -120, background: "radial-gradient(circle, oklch(0.7 0.18 195 / 0.45), transparent 60%)", animationDelay: "-4s" }} />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Brand */}
        <div className="flex items-center gap-2.5 justify-center mb-8 animate-rise">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold tracking-tight text-foreground text-lg">Lead Finder</span>
        </div>

        {/* Progress */}
        <div className="mb-8 animate-rise" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step + 1} of {totalSteps}</span>
            <span className="tabular-nums">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-background/40 overflow-hidden border border-border/40">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%`, background: "var(--gradient-primary)" }}
            />
          </div>
        </div>

        <Card className="glass p-6 sm:p-8 border-0 animate-rise" style={{ boxShadow: "var(--shadow-card)", animationDelay: "120ms" }}>
          {step === 0 && (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-accent" />
                Welcome aboard
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="text-foreground">Hey{displayName ? `, ${displayName.split(" ")[0]}` : ""}</span>{" "}
                <span className="text-gradient">— let's set you up.</span>
              </h1>
              <p className="text-muted-foreground">
                Lead Finder scans Google Maps for businesses without a website and lets you pitch them on
                WhatsApp in a single tap. Two minutes of setup and you're ready to ship outreach.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Search, t: "Scan any city", d: "Pull live business data from Google Maps." },
                  { icon: Globe2, t: "No-website filter", d: "Only see businesses worth pitching." },
                  { icon: MessageCircle, t: "WhatsApp in one tap", d: "Personalized message ready to send." },
                ].map((f) => (
                  <div key={f.t} className="rounded-xl border border-border/60 bg-background/30 p-3">
                    <f.icon className="w-4 h-4 text-accent mb-2" />
                    <p className="font-semibold text-sm text-foreground">{f.t}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.d}</p>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="dn" className="text-xs uppercase tracking-wider text-muted-foreground">
                  What should we call you?
                </Label>
                <Input
                  id="dn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2 h-11 bg-background/40 border-border/60"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                What best describes you?
              </h2>
              <p className="text-muted-foreground">We'll tailor a few defaults based on this.</p>
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
                        active
                          ? "border-primary/70 bg-primary/10 shadow-[var(--shadow-glow)]"
                          : "border-border/60 bg-background/30 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: active ? "var(--gradient-primary)" : "color-mix(in oklab, var(--background) 50%, transparent)" }}>
                          <Icon className={`w-4 h-4 ${active ? "text-primary-foreground" : "text-foreground"}`} />
                        </div>
                        <span className="font-semibold text-foreground">{r.label}</span>
                        {active && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                What's your main goal?
              </h2>
              <p className="text-muted-foreground">Pick the outcome that matters most right now.</p>
              <div className="grid gap-2 pt-2">
                {GOALS.map((g) => {
                  const active = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`flex items-center justify-between text-left rounded-xl border px-4 py-3 transition-all ${
                        active
                          ? "border-primary/70 bg-primary/10"
                          : "border-border/60 bg-background/30 hover:border-primary/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">{g.label}</span>
                      {active ? (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2">
                <Label htmlFor="region" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Primary city or region you'll target <span className="normal-case text-muted-foreground/70">(optional)</span>
                </Label>
                <div className="relative mt-2">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Lisbon, Portugal"
                    className="pl-9 h-11 bg-background/40 border-border/60"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Almost there.
              </h2>
              <p className="text-muted-foreground">
                Add a short signature so your WhatsApp pitches feel personal. You can change this anytime in Profile.
              </p>
              <div>
                <Label htmlFor="sig" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Your signature
                </Label>
                <Textarea
                  id="sig"
                  rows={4}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={`— ${displayName || "Your name"}\nWeb designer · ${region || "Your city"}`}
                  className="mt-2 bg-background/40 border-border/60 font-mono text-[13px]"
                />
              </div>
              <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">You're all set</p>
                <ul className="text-sm text-foreground space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Your data syncs to your account automatically.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Saved searches keep their full results.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Sign in anywhere — your work follows you.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0 || saving}
              className="h-11 bg-background/40 border-border/60"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            {step < totalSteps - 1 ? (
              <Button
                type="button"
                onClick={next}
                disabled={(step === 1 && !role) || (step === 2 && !goal)}
                className="h-11 px-6 border-0 font-semibold"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={finish}
                disabled={saving}
                className="h-11 px-6 border-0 font-semibold"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Enter Lead Finder <Rocket className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground/70 mt-6">
          You can update everything later from your profile.
        </p>
      </div>
    </div>
  );
}
