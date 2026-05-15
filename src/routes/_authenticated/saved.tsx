import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type SavedSearch,
  fetchSavedSearches,
  loadSavedCache,
  persistCache,
  deleteSavedSearch as deleteSavedSearchRemote,
} from "@/lib/user-data";
import {
  Bookmark,
  MapPin,
  Search,
  Trash2,
  RefreshCw,
  MessageCircle,
  Phone,
  Star,
  Globe2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import type { Lead } from "@/lib/leads.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved searches — Lead Finder" },
      { name: "description", content: "All your saved searches and their stored leads." },
    ],
  }),
});

function SavedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setItems(loadSavedCache(user.uid));
    fetchSavedSearches(user.uid).then(setItems).catch(() => {});
  }, [user]);

  const remove = (id: string) => {
    if (!user) return;
    if (!window.confirm("Delete this saved search?")) return;
    const next = items.filter((s) => s.id !== id);
    setItems(next);
    persistCache(user.uid, next);
    deleteSavedSearchRemote(user.uid, id).catch(() => {});
  };

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Library</p>
          <h1 className="mt-2 font-display text-[2.25rem] sm:text-5xl text-foreground leading-[0.95]">
            Saved <span className="italic text-gradient">searches.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Every saved search keeps a snapshot of its leads — open it any time,
            no need to re-scan.
          </p>
        </div>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <Search className="h-4 w-4" />
          New search
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl p-12 text-center card-premium animate-rise">
          <div className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-background/40 mb-4">
            <Bookmark className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-display text-2xl text-foreground">Nothing saved yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Run a search and tap <span className="text-foreground font-medium">Save</span> to store
            the full lead list here.
          </p>
          <Link
            to="/search"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Start your first search <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((s, i) => {
            const open = openId === s.id;
            return (
              <div
                key={s.id}
                className="rounded-2xl card-premium overflow-hidden animate-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <button
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  <div
                    className="h-11 w-11 rounded-xl grid place-items-center text-primary-foreground shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg text-foreground truncate leading-tight">
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {s.location} · {s.radius}km
                      {s.keyword ? ` · ${s.keyword}` : ""} ·{" "}
                      {new Date(s.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {s.result && (
                    <span
                      className="hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider"
                      style={{
                        background: "color-mix(in oklab, var(--accent) 15%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {s.result.withoutWebsite} leads
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(s.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Delete saved search"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>

                {open && s.result && (
                  <div className="border-t border-border/50 px-5 py-5 animate-rise">
                    {s.result.leads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No leads in this snapshot.</p>
                    ) : (
                      <div className="grid gap-2.5">
                        {s.result.leads.map((lead) => (
                          <SavedLeadRow key={lead.id} lead={lead} />
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <Link
                        to="/search"
                        search={{ q: `location=${encodeURIComponent(s.location)}&keyword=${encodeURIComponent(s.keyword)}` } as never}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Re-run this search
                      </Link>
                    </div>
                  </div>
                )}

                {open && !s.result && (
                  <div className="border-t border-border/50 px-5 py-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      No snapshot stored. Re-run to populate leads.
                    </p>
                    <Link
                      to="/search"
                      search={{ q: `location=${encodeURIComponent(s.location)}&keyword=${encodeURIComponent(s.keyword)}` } as never}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      Run search <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildWhatsAppLink(phone: string | null, businessName: string) {
  const text = `Hi, I noticed ${businessName} doesn't have a website yet — I'd love to show you what I built for you.`;
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/[^\d]/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

function SavedLeadRow({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{lead.name}</p>
          {lead.rating !== null && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-accent text-accent" />
              {lead.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.address}</p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          {lead.phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          ) : (
            <span className="opacity-60">no phone</span>
          )}
          <a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
            <Globe2 className="h-3 w-3" /> Maps
          </a>
        </div>
      </div>
      <Button
        asChild={!!lead.phone}
        size="sm"
        className="h-9 border-0 font-medium shrink-0"
        style={{
          background: lead.phone ? "var(--gradient-primary)" : undefined,
          boxShadow: lead.phone ? "var(--shadow-soft)" : undefined,
        }}
        disabled={!lead.phone}
      >
        {lead.phone ? (
          <a href={buildWhatsAppLink(lead.phone, lead.name)} target="_blank" rel="noreferrer">
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            WhatsApp
          </a>
        ) : (
          <span><MessageCircle className="h-3.5 w-3.5 mr-1.5" />No phone</span>
        )}
      </Button>
    </div>
  );
}
