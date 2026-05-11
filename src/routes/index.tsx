import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { searchLeads, type Lead, type SearchResult } from "@/lib/leads.functions";
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

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <header className="container mx-auto px-4 pt-12 pb-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">Lead Finder</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
          Find businesses<br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            without a website.
          </span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
          Search any city and radius on Google Maps. We surface only the businesses that don't have a
          website yet — ready for you to pitch on WhatsApp in one tap.
        </p>
      </header>

      <main className="container mx-auto px-4 pb-24 max-w-5xl">
        <Card
          className="p-6 md:p-8 border-border/60 backdrop-blur"
          style={{ background: "color-mix(in oklab, var(--card) 80%, transparent)", boxShadow: "var(--shadow-card)" }}
        >
          <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="loc">City / Location</Label>
              <Input
                id="loc"
                placeholder="e.g. Lisbon, Portugal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kw">Business type (optional)</Label>
              <Input
                id="kw"
                placeholder="leave blank for all businesses"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Search radius</Label>
                <span className="text-sm text-muted-foreground">{radius} km</span>
              </div>
              <Slider
                value={[radius]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v) => setRadius(v[0] ?? 10)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="msg">WhatsApp message template</Label>
              <Textarea
                id="msg"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="text-accent">[Business Name]</code> to insert the business name automatically.
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending || !location.trim()}
                className="flex-1 text-base"
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
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </form>
        </Card>

        {savedSearches.length > 0 && (
          <Card
            className="mt-6 p-5 border-border/60"
            style={{ background: "color-mix(in oklab, var(--card) 80%, transparent)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Saved searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((s) => (
                <div
                  key={s.id}
                  className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 pl-3 pr-1 py-1 text-sm hover:border-primary/60 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => loadSavedSearch(s)}
                    className="text-foreground"
                  >
                    {s.name}
                    <span className="ml-2 text-xs text-muted-foreground">{s.radius}km</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSaved(s.id)}
                    className="ml-1 p-1 rounded-full text-muted-foreground hover:text-destructive"
                    aria-label="Remove saved search"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
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
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{result.withoutWebsite} leads found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scanned {result.totalScanned} businesses near {result.locationLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <Badge className="text-sm" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="w-3 h-3 mr-1" />
              {newCount} new
            </Badge>
          )}
          <Badge variant="secondary" className="text-sm">
            {result.totalScanned > 0
              ? Math.round((result.withoutWebsite / result.totalScanned) * 100)
              : 0}
            % without website
          </Badge>
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No leads without a website were found in this area. Try widening the radius or changing the
          business type.
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              message={message}
              isNew={!previouslySeen[lead.id]}
              firstSeenAt={previouslySeen[lead.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
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
  return (
    <Card
      className="p-5 border-border/60 hover:border-primary/60 transition-colors"
      style={{
        background: "color-mix(in oklab, var(--card) 90%, transparent)",
        borderColor: isNew ? "color-mix(in oklab, var(--primary) 60%, transparent)" : undefined,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg text-foreground truncate">{lead.name}</h3>
            {isNew ? (
              <Badge className="text-xs" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="w-3 h-3 mr-1" /> New
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-xs"
                title={firstSeenAt ? `First seen ${new Date(firstSeenAt).toLocaleDateString()}` : undefined}
              >
                <Eye className="w-3 h-3 mr-1" /> Seen before
              </Badge>
            )}
            {lead.rating !== null && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                {lead.rating.toFixed(1)} ({lead.userRatingCount ?? 0})
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">{lead.address}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {lead.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {lead.phone}
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
        <div className="flex md:flex-col gap-2 md:w-44 shrink-0">
          <Button
            asChild
            className="w-full"
            style={{ background: "var(--gradient-primary)" }}
            disabled={!lead.phone}
          >
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
