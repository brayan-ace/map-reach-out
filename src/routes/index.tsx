import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { searchLeads, type Lead, type SearchResult } from "@/lib/leads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, MessageCircle, Phone, Star, Loader2, Globe2 } from "lucide-react";

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

const DEFAULT_MESSAGE =
  "hello am i speaking to {business} i saw your business online and noticed you don't yet have a website. Two big advantages: 1) customers can find and trust you 24/7, 2) you can take bookings/orders directly without paying commissions. I went ahead and built you a sample site — if you could spare 5 mins of your time I could show it to you. If you like it great, we proceed. If not you never hear from me again.";

function buildWhatsAppLink(phone: string | null, businessName: string, template: string) {
  const text = template.replaceAll("{business}", businessName);
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
  const [radius, setRadius] = useState(5);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const mutation = useMutation<SearchResult, Error, void>({
    mutationFn: () =>
      fetchLeads({ data: { location, radiusKm: radius, keyword } }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    mutation.mutate();
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
                placeholder="restaurants, hotels, salons…"
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
                max={50}
                step={1}
                onValueChange={(v) => setRadius(v[0] ?? 5)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="msg">WhatsApp message template</Label>
              <Textarea
                id="msg"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="text-accent">{"{business}"}</code> to insert the business name automatically.
              </p>
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending || !location.trim()}
                className="w-full text-base"
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
            </div>
          </form>
        </Card>

        {mutation.isError && (
          <Card className="mt-6 p-4 border-destructive/40 bg-destructive/10">
            <p className="text-sm text-destructive-foreground">
              {mutation.error.message}
            </p>
          </Card>
        )}

        {result?.error && (
          <Card className="mt-6 p-4 border-destructive/40 bg-destructive/10">
            <p className="text-sm text-destructive-foreground">{result.error}</p>
          </Card>
        )}

        {result && !result.error && (
          <Results result={result} message={message} />
        )}
      </main>
    </div>
  );
}

function Results({ result, message }: { result: SearchResult; message: string }) {
  const sorted = useMemo(
    () => [...result.leads].sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0)),
    [result.leads]
  );

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {result.withoutWebsite} leads found
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scanned {result.totalScanned} businesses near {result.locationLabel}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {result.totalScanned > 0
            ? Math.round((result.withoutWebsite / result.totalScanned) * 100)
            : 0}
          % without website
        </Badge>
      </div>

      {sorted.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No leads without a website were found in this area. Try widening the radius or changing the
          business type.
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((lead) => (
            <LeadCard key={lead.id} lead={lead} message={message} />
          ))}
        </div>
      )}
    </section>
  );
}

function LeadCard({ lead, message }: { lead: Lead; message: string }) {
  const wa = buildWhatsAppLink(lead.phone, lead.name, message);
  return (
    <Card
      className="p-5 border-border/60 hover:border-primary/60 transition-colors"
      style={{ background: "color-mix(in oklab, var(--card) 90%, transparent)" }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg text-foreground truncate">{lead.name}</h3>
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
