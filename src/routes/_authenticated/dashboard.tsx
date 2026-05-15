import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type SavedSearch,
  fetchSavedSearches,
  loadSavedCache,
} from "@/lib/user-data";
import {
  Search,
  MapPin,
  Bookmark,
  ArrowRight,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Eye,
  Globe2,
  Activity,
  Clock,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — Lead Finder" },
      { name: "description", content: "Your lead generation control center." },
    ],
  }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [quickLocation, setQuickLocation] = useState("");
  const [quickKeyword, setQuickKeyword] = useState("");

  useEffect(() => {
    if (!user) return;
    setSaved(loadSavedCache(user.uid));
    fetchSavedSearches(user.uid).then(setSaved).catch(() => {});
  }, [user]);

  const stats = useMemo(() => {
    const totalLeads = saved.reduce((sum, s) => sum + (s.result?.withoutWebsite ?? 0), 0);
    const totalScanned = saved.reduce((sum, s) => sum + (s.result?.totalScanned ?? 0), 0);
    const cities = new Set(saved.map((s) => s.location.split(",")[0].trim().toLowerCase())).size;
    return { totalLeads, totalScanned, cities, savedCount: saved.length };
  }, [saved]);

  const recent = saved.slice(0, 5);

  const onQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLocation.trim()) return;
    const params = new URLSearchParams({
      location: quickLocation,
      keyword: quickKeyword,
    });
    navigate({ to: "/search", search: { q: params.toString() } as never });
  };

  const greeting = greetByHour();

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10 animate-rise">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {greeting}
          </p>
          <h1 className="mt-2 font-display text-[2.5rem] sm:text-5xl lg:text-6xl leading-[0.95] text-foreground">
            Welcome back,{" "}
            <span className="italic text-gradient">
              {(user?.displayName?.split(" ")[0]) || "lead hunter"}.
            </span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xl">
            Your premium control center for finding businesses without a website.
          </p>
        </div>
        <Link
          to="/search"
          className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <Search className="h-4 w-4" />
          Start a new search
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Stats bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatTile
          icon={TrendingUp}
          label="Leads found"
          value={stats.totalLeads}
          accent
          delay={0}
        />
        <StatTile icon={Globe2} label="Businesses scanned" value={stats.totalScanned} delay={60} />
        <StatTile icon={MapPin} label="Cities explored" value={stats.cities} delay={120} />
        <StatTile icon={Bookmark} label="Saved searches" value={stats.savedCount} delay={180} />
      </div>

      {/* Main bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Quick search hero */}
        <div
          className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 lg:p-8 animate-rise"
          style={{
            background: "var(--gradient-card)",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div className="absolute inset-0 map-bg opacity-30 pointer-events-none" />
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 pointer-events-none"
            style={{ background: "var(--gradient-primary)", filter: "blur(80px)" }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Quick search
            </div>
            <h2 className="mt-4 font-display text-3xl lg:text-4xl text-foreground leading-tight">
              Find leads in any city
              <br />
              <span className="italic text-gradient">in under a minute.</span>
            </h2>

            <form onSubmit={onQuickSearch} className="mt-6 grid sm:grid-cols-[1fr_1fr_auto] gap-2.5">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  placeholder="City, e.g. Lisbon"
                  className="h-12 w-full rounded-xl bg-background/50 backdrop-blur border border-border/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-glow transition-colors"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={quickKeyword}
                  onChange={(e) => setQuickKeyword(e.target.value)}
                  placeholder="Type (optional)"
                  className="h-12 w-full rounded-xl bg-background/50 backdrop-blur border border-border/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-glow transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!quickLocation.trim()}
                className="h-12 px-6 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-transform hover:scale-[1.02]"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-full border border-border/50 bg-background/30">
                Restaurants near me
              </span>
              <span className="px-2.5 py-1 rounded-full border border-border/50 bg-background/30">
                Salons in Berlin
              </span>
              <span className="px-2.5 py-1 rounded-full border border-border/50 bg-background/30">
                Plumbers · 25km
              </span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          className="rounded-3xl p-6 animate-rise card-premium"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <h3 className="font-display text-xl text-foreground">How it works</h3>
          </div>
          <ol className="mt-5 space-y-4">
            {[
              { n: "01", t: "Choose a city + radius", d: "Up to 100 km coverage." },
              { n: "02", t: "We scan Google Maps", d: "Filter to no-website businesses." },
              { n: "03", t: "Pitch on WhatsApp", d: "One tap, personalized message." },
            ].map((step, i) => (
              <li key={step.n} className="flex gap-4 animate-rise" style={{ animationDelay: `${100 + i * 60}ms` }}>
                <span
                  className="font-display text-2xl leading-none italic text-gradient shrink-0"
                  style={{ minWidth: "2.2rem" }}
                >
                  {step.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.t}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Recent / saved searches */}
        <div
          className="lg:col-span-2 rounded-3xl p-6 animate-rise card-premium"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-accent" />
              <h3 className="font-display text-xl text-foreground">Recent searches</h3>
            </div>
            <Link
              to="/saved"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border/60 p-8 text-center">
              <div className="mx-auto h-10 w-10 rounded-full grid place-items-center bg-background/40 mb-3">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No saved searches yet. Run a search and bookmark it to see it here.
              </p>
              <Link
                to="/search"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Start your first search <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {recent.map((s, i) => (
                <li
                  key={s.id}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-background/40 border border-transparent hover:border-border/60 animate-rise"
                  style={{ animationDelay: `${150 + i * 50}ms` }}
                >
                  <div
                    className="h-9 w-9 rounded-lg grid place-items-center text-primary-foreground shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.location} · {s.radius}km
                      {s.keyword ? ` · ${s.keyword}` : ""}
                    </p>
                  </div>
                  {s.result && (
                    <span
                      className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider"
                      style={{
                        background: "color-mix(in oklab, var(--accent) 14%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {s.result.withoutWebsite} leads
                    </span>
                  )}
                  <Link
                    to="/saved"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-background/60"
                    aria-label="Open saved search"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Outreach tip card */}
        <div
          className="rounded-3xl p-6 animate-rise relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, oklch(0.32 0.18 165 / 0.4), oklch(0.18 0.06 270 / 0.6))",
            border: "1px solid color-mix(in oklab, var(--accent) 30%, transparent)",
            boxShadow: "var(--shadow-card)",
            animationDelay: "180ms",
          }}
        >
          <Sparkles className="absolute -top-2 -right-2 h-20 w-20 text-accent/15" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-background/30 backdrop-blur border border-accent/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
              <MessageCircle className="h-3 w-3" /> Pro tip
            </div>
            <h3 className="mt-4 font-display text-xl text-foreground leading-tight">
              The first message wins the deal.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Personalize your WhatsApp template in your profile — mention what they're missing
              without a website, then offer to send a 5-minute preview.
            </p>
            <Link
              to="/profile"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
            >
              Customize template <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Activity */}
        <div
          className="lg:col-span-3 rounded-3xl p-6 animate-rise card-premium"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <h3 className="font-display text-xl text-foreground">Activity overview</h3>
            </div>
          </div>
          {saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet — run your first search to see analytics.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActivityRow
                label="Best hit rate"
                value={
                  bestRate(saved)
                    ? `${bestRate(saved)!.rate}%`
                    : "—"
                }
                sub={bestRate(saved)?.label ?? "Run a search"}
              />
              <ActivityRow
                label="Avg leads / search"
                value={
                  saved.length > 0
                    ? Math.round(stats.totalLeads / Math.max(1, saved.filter((s) => s.result).length)).toString()
                    : "—"
                }
                sub="Across all saved"
              />
              <ActivityRow
                label="Latest search"
                value={recent[0]?.name ?? "—"}
                sub={recent[0] ? new Date(recent[0].savedAt).toLocaleDateString() : "Nothing yet"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
  delay = 0,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: number | string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 animate-rise"
      style={{
        background: accent ? "var(--gradient-card)" : "var(--gradient-card)",
        border: accent
          ? "1px solid color-mix(in oklab, var(--primary) 35%, transparent)"
          : "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)",
        boxShadow: accent ? "var(--shadow-glow)" : "var(--shadow-soft)",
        animationDelay: `${delay}ms`,
      }}
    >
      {accent && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}
      <div className="relative flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon
          className="h-4 w-4"
          style={{ color: accent ? "oklch(0.85 0.16 285)" : "var(--accent)" }}
        />
      </div>
      <p className="relative mt-3 font-display text-4xl text-foreground tabular-nums leading-none">
        {value}
      </p>
    </div>
  );
}

function ActivityRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl text-foreground truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
    </div>
  );
}

function greetByHour() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function bestRate(saved: SavedSearch[]) {
  let best: { label: string; rate: number } | null = null;
  for (const s of saved) {
    if (!s.result || s.result.totalScanned === 0) continue;
    const rate = Math.round((s.result.withoutWebsite / s.result.totalScanned) * 100);
    if (!best || rate > best.rate) best = { label: s.name, rate };
  }
  return best;
}
