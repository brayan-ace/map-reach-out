import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { searchLeads, type Lead, type SearchResult } from "@/lib/leads.functions";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Sun, Moon, UserCircle2, FolderOpen } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Search,
  MessageCircle,
  Phone,
  Star,
  Loader2,
  Globe2,
  RefreshCw,
  Bookmark,
  Sparkles,
  Eye,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lead Finder — Businesses without a website" },
      {
        name: "description",
        content:
          "Find local businesses on Google Maps that don't have a website yet, then reach out via WhatsApp in one tap.",
      },
    ],
  }),
});

const DEFAULT_MESSAGE = `Hi, I'm Jordan 👋

I came across [Business Name] online and noticed you don't have a website yet.

Having one would:

✅ Make new customers trust you instantly before they even call

✅ Keep your business working 24/7 even when you're closed

I actually went ahead and built one for you already.

If you can give me 5 minutes, I'd love to show you what it looks like.

If you like it — great, we can talk.

If you don't — no hard feelings, you'll never hear from me again. 🤝`;

const SEEN_KEY = "leadfinder.seen.v1";
const SAVED_KEY = "leadfinder.saved.v1";

type SavedSearch = {
  id: string;
  name: string;
  location: string;
  keyword: string;
  radius: number;
  savedAt: number;
};

function loadSeen(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveSeen(seen: Record<string, number>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}
function loadSaved(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function persistSaved(list: SavedSearch[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

function buildWhatsAppLink(phone: string | null, businessName: string, template: string) {
  const text = template
    .replaceAll("[Business Name]", businessName)
    .replaceAll("{business}", businessName);
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/[^\d]/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  const fetchLeads = useServerFn(searchLeads);
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [radius, setRadius] = useState(10);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  // Snapshot of "seen" taken right before each search, so the current
  // results can highlight what's actually new vs. previously-seen.
  const [seenSnapshot, setSeenSnapshot] = useState<Record<string, number>>({});

  useEffect(() => {
    setSeen(loadSeen());
    setSavedSearches(loadSaved());
  }, []);

  const mutation = useMutation<SearchResult, Error, void>({
    mutationFn: () => fetchLeads({ data: { location, radiusKm: radius, keyword } }),
    onSuccess: (data) => {
      // Mark all returned leads as seen (after we've snapshotted previous state).
      const next = { ...loadSeen() };
      const now = Date.now();
      for (const l of data.leads) {
        if (!next[l.id]) next[l.id] = now;
      }
      saveSeen(next);
      setSeen(next);
    },
  });

  const runSearch = () => {
    if (!location.trim()) return;
    setSeenSnapshot(loadSeen());
    mutation.mutate();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const saveCurrent = () => {
    if (!location.trim()) return;
    const name =
      window.prompt(
        "Name this saved search",
        keyword ? `${keyword} in ${location}` : `${location} (${radius}km)`,
      ) ?? "";
    if (!name.trim()) return;
    const entry: SavedSearch = {
      id: crypto.randomUUID(),
      name: name.trim(),
      location,
      keyword,
      radius,
      savedAt: Date.now(),
    };
    const next = [entry, ...savedSearches];
    persistSaved(next);
    setSavedSearches(next);
  };

  const loadSavedSearch = (s: SavedSearch) => {
    setLocation(s.location);
    setKeyword(s.keyword);
    setRadius(s.radius);
    setTimeout(runSearch, 0);
  };

  const deleteSaved = (id: string) => {
    const next = savedSearches.filter((s) => s.id !== id);
    persistSaved(next);
    setSavedSearches(next);
  };

  const result = mutation.data;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Ambient orbs */}
      <div
        className="orb float-slow"
        style={{
          width: 520,
          height: 520,
          top: -160,
          left: -120,
          background: "radial-gradient(circle, oklch(0.62 0.22 275 / 0.55), transparent 60%)",
        }}
      />
      <div
        className="orb float-slow"
        style={{
          width: 480,
          height: 480,
          top: 120,
          right: -160,
          background: "radial-gradient(circle, oklch(0.7 0.18 195 / 0.45), transparent 60%)",
          animationDelay: "-4s",
        }}
      />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Top nav */}
      <div className="relative z-10 container mx-auto px-4 max-w-6xl pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold tracking-tight text-foreground text-[15px]">
            Lead Finder
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live Google Maps data
          </span>
          <ThemeToggleBtn />
          {user && (
            <>
              <span className="hidden md:inline text-xs text-muted-foreground max-w-[160px] truncate">
                {user.displayName || user.email}
              </span>
              <button
                onClick={() => logout().then(() => navigate({ to: "/auth" }))}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      <header className="relative z-10 container mx-auto px-4 pt-14 pb-10 max-w-6xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6 animate-rise">
          <Sparkles className="w-3 h-3 text-accent" />
          Built for solo web designers & agencies
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] animate-rise">
          <span className="text-foreground">Find businesses</span>
          <br />
          <span className="text-gradient">without a website.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-rise" style={{ animationDelay: "60ms" }}>
          Scan any city on Google Maps, surface only the businesses that don't have a website yet,
          and pitch them on WhatsApp in a single tap.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground animate-rise" style={{ animationDelay: "120ms" }}>
          {[
            { k: "1", v: "Enter a city & radius" },
            { k: "2", v: "We filter to no-website leads" },
            { k: "3", v: "WhatsApp them in one tap" },
          ].map((s) => (
            <div key={s.k} className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                {s.k}
              </span>
              {s.v}
            </div>
          ))}
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 pb-24 max-w-6xl">
        <Card
          className="glass p-6 md:p-8 border-0 animate-rise"
          style={{ boxShadow: "var(--shadow-card)", animationDelay: "180ms" }}
        >
          <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="loc" className="text-xs uppercase tracking-wider text-muted-foreground">
                City / Location
              </Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="loc"
                  placeholder="e.g. Lisbon, Portugal"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="pl-9 h-11 bg-background/40 border-border/60 focus-visible:ring-primary/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kw" className="text-xs uppercase tracking-wider text-muted-foreground">
                Business type <span className="normal-case text-muted-foreground/70">(optional)</span>
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="kw"
                  placeholder="leave blank for all businesses"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9 h-11 bg-background/40 border-border/60 focus-visible:ring-primary/50"
                />
              </div>
            </div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Search radius
                </Label>
                <span
                  className="text-sm font-semibold tabular-nums px-2.5 py-0.5 rounded-md border border-border/60 bg-background/40"
                >
                  {radius} km
                </span>
              </div>
              <Slider
                value={[radius]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v) => setRadius(v[0] ?? 10)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/70 tabular-nums">
                <span>1km</span><span>25</span><span>50</span><span>75</span><span>100km</span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="msg" className="text-xs uppercase tracking-wider text-muted-foreground">
                WhatsApp message template
              </Label>
              <Textarea
                id="msg"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-background/40 border-border/60 focus-visible:ring-primary/50 font-mono text-[13px] leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="text-accent px-1 py-0.5 rounded bg-accent/10">[Business Name]</code> to insert the business name automatically.
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending || !location.trim()}
                className="flex-1 h-12 text-base font-semibold border-0"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching Google Maps…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find leads
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={runSearch}
                disabled={mutation.isPending || !location.trim()}
                title="Re-run this search and highlight new businesses"
                className="h-12 bg-background/40 border-border/60 hover:bg-background/60"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${mutation.isPending ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={saveCurrent}
                disabled={!location.trim()}
                className="h-12 bg-background/40 border-border/60 hover:bg-background/60"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </form>
        </Card>

        {savedSearches.length > 0 && (
          <Card className="glass mt-6 p-5 border-0 animate-rise">
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="w-4 h-4 text-accent" />
              <h3 className="font-display font-semibold text-foreground">Saved searches</h3>
              <span className="text-xs text-muted-foreground">({savedSearches.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((s) => (
                <div
                  key={s.id}
                  className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 pl-3 pr-1 py-1 text-sm hover:border-primary/60 hover:bg-background/60 transition-all"
                >
                  <button type="button" onClick={() => loadSavedSearch(s)} className="text-foreground">
                    {s.name}
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">{s.radius}km</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSaved(s.id)}
                    className="ml-1 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Remove saved search"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {mutation.isPending && !result && (
          <Card className="glass mt-6 p-8 border-0 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px shimmer" />
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Scanning Google Maps for businesses…</span>
            </div>
          </Card>
        )}

        {mutation.isError && (
          <Card className="mt-6 p-4 border-destructive/40 bg-destructive/10">
            <p className="text-sm text-destructive-foreground">{mutation.error.message}</p>
          </Card>
        )}

        {result?.error && (
          <Card className="mt-6 p-4 border-destructive/40 bg-destructive/10">
            <p className="text-sm text-destructive-foreground">{result.error}</p>
          </Card>
        )}

        {result && !result.error && (
          <Results
            result={result}
            message={message}
            previouslySeen={seenSnapshot}
            onRefresh={runSearch}
            refreshing={mutation.isPending}
          />
        )}

        <footer className="mt-20 text-center text-xs text-muted-foreground/70">
          Powered by Google Maps · Lead Finder
        </footer>
      </main>
    </div>
  );
}

function Results({
  result,
  message,
  previouslySeen,
  onRefresh,
  refreshing,
}: {
  result: SearchResult;
  message: string;
  previouslySeen: Record<string, number>;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const sorted = useMemo(() => {
    const list = [...result.leads];
    list.sort((a, b) => {
      const aNew = previouslySeen[a.id] ? 1 : 0;
      const bNew = previouslySeen[b.id] ? 1 : 0;
      if (aNew !== bNew) return aNew - bNew; // new first (0 before 1)
      return (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0);
    });
    return list;
  }, [result.leads, previouslySeen]);

  const newCount = sorted.filter((l) => !previouslySeen[l.id]).length;

  return (
    <section className="mt-10 animate-rise">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Leads" value={result.withoutWebsite} accent />
        <StatCard label="Scanned" value={result.totalScanned} />
        <StatCard
          label="Conversion"
          value={`${
            result.totalScanned > 0
              ? Math.round((result.withoutWebsite / result.totalScanned) * 100)
              : 0
          }%`}
        />
        <StatCard label="New this run" value={newCount} highlight={newCount > 0} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Leads near <span className="text-gradient">{result.locationLabel.split(",")[0]}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{result.locationLabel}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
          className="bg-background/40 border-border/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="glass p-12 text-center border-0">
          <div className="mx-auto w-12 h-12 rounded-full bg-background/40 grid place-items-center mb-3">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No leads without a website were found in this area. Try widening the radius or changing the
            business type.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sorted.map((lead, i) => (
            <div key={lead.id} className="animate-rise" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              <LeadCard
                lead={lead}
                message={message}
                isNew={!previouslySeen[lead.id]}
                firstSeenAt={previouslySeen[lead.id]}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card
      className="glass p-4 border-0 relative overflow-hidden"
      style={
        accent
          ? { boxShadow: "var(--shadow-glow)" }
          : highlight
            ? { borderColor: "color-mix(in oklab, var(--accent) 50%, transparent)" }
            : undefined
      }
    >
      {accent && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}
      <p className="relative text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="relative font-display text-3xl font-bold text-foreground tabular-nums mt-1">
        {value}
      </p>
    </Card>
  );
}

function formatType(t?: string) {
  if (!t) return "";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function LeadCard({
  lead,
  message,
  isNew,
  firstSeenAt,
}: {
  lead: Lead;
  message: string;
  isNew: boolean;
  firstSeenAt?: number;
}) {
  const wa = buildWhatsAppLink(lead.phone, lead.name, message);
  const initials = lead.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const primaryType = lead.types?.find((t) => !["point_of_interest", "establishment"].includes(t));

  return (
    <Card
      className="group relative p-5 border border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
      style={{
        background: "color-mix(in oklab, var(--card) 75%, transparent)",
        backdropFilter: "blur(12px)",
        boxShadow: "var(--shadow-soft)",
        borderColor: isNew ? "color-mix(in oklab, var(--primary) 50%, transparent)" : undefined,
      }}
    >
      {isNew && (
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0 flex-1 flex gap-4">
          <div
            className="hidden sm:grid w-12 h-12 rounded-xl place-items-center text-sm font-bold text-primary-foreground shrink-0"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-lg text-foreground truncate">
                {lead.name}
              </h3>
              {isNew ? (
                <Badge
                  className="text-[10px] uppercase tracking-wider border-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles className="w-3 h-3 mr-1" /> New
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider"
                  title={
                    firstSeenAt
                      ? `First seen ${new Date(firstSeenAt).toLocaleDateString()}`
                      : undefined
                  }
                >
                  <Eye className="w-3 h-3 mr-1" /> Seen
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
              {lead.rating !== null && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{lead.rating.toFixed(1)}</span>
                  <span className="text-xs">({lead.userRatingCount ?? 0})</span>
                </span>
              )}
              {primaryType && (
                <span className="text-xs px-2 py-0.5 rounded-md border border-border/60 bg-background/40">
                  {formatType(primaryType)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 truncate">{lead.address}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {lead.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="tabular-nums">{lead.phone}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 opacity-60">
                  <Phone className="w-3 h-3" />
                  no phone listed
                </span>
              )}
              <a
                href={lead.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe2 className="w-3 h-3" />
                View on Maps
              </a>
            </div>
          </div>
        </div>
        <div className="flex md:flex-col gap-2 md:w-44 shrink-0">
          <Button
            asChild={!!lead.phone}
            className="w-full h-11 border-0 font-semibold"
            style={{
              background: lead.phone ? "var(--gradient-primary)" : undefined,
              boxShadow: lead.phone ? "var(--shadow-glow)" : undefined,
            }}
            disabled={!lead.phone}
          >
            {lead.phone ? (
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </a>
            ) : (
              <span>
                <MessageCircle className="w-4 h-4 mr-2" />
                No phone
              </span>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ThemeToggleBtn() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/30 text-foreground backdrop-blur transition-all hover:bg-background/50 hover:scale-105"
    >
      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}
