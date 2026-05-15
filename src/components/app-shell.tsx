import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  UserCircle2,
  LogOut,
  Sun,
  Moon,
  MapPin,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Find leads", icon: Search },
  { to: "/saved", label: "Saved searches", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Ambient layers */}
      <div
        className="orb float-slow"
        style={{
          width: 540, height: 540, top: -180, left: -140,
          background: "radial-gradient(circle, oklch(0.55 0.22 285 / 0.55), transparent 60%)",
        }}
      />
      <div
        className="orb float-slow"
        style={{
          width: 460, height: 460, top: 200, right: -160,
          background: "radial-gradient(circle, oklch(0.78 0.16 200 / 0.4), transparent 60%)",
          animationDelay: "-5s",
        }}
      />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="noise" />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-[260px] shrink-0 flex-col px-5 py-6 border-r border-border/40 backdrop-blur-xl bg-background/40">
          <Brand />
          <nav className="mt-10 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all"
                  style={{
                    background: active ? "var(--gradient-card)" : "transparent",
                    color: active ? "var(--foreground)" : "color-mix(in oklab, var(--foreground) 65%, transparent)",
                    border: active ? "1px solid color-mix(in oklab, var(--primary) 30%, transparent)" : "1px solid transparent",
                    boxShadow: active ? "var(--shadow-soft)" : undefined,
                  }}
                >
                  {active && (
                    <span
                      className="absolute -left-[1px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full"
                      style={{ background: "var(--gradient-primary)" }}
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  <span className="font-medium tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: "var(--gradient-card)", border: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)" }}
            >
              <Sparkles className="absolute -top-2 -right-2 h-12 w-12 text-accent/20" />
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live data</p>
              <p className="mt-1 font-display text-lg leading-tight text-foreground">
                Google Maps,<br />in real time.
              </p>
            </div>

            <UserPill user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggle} />
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-xl bg-background/60 border-b border-border/40">
          <Brand compact />
          <div className="flex items-center gap-2">
            <ThemeBtn theme={theme} onClick={toggle} />
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-background/40"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-[80%] max-w-[320px] bg-background/95 backdrop-blur-xl border-l border-border/60 p-6 flex flex-col animate-rise">
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border/60"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((item) => {
                  const active = path === item.to || path.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm"
                      style={{
                        background: active ? "var(--gradient-card)" : "transparent",
                        color: active ? "var(--foreground)" : "color-mix(in oklab, var(--foreground) 65%, transparent)",
                        border: active ? "1px solid color-mix(in oklab, var(--primary) 30%, transparent)" : "1px solid transparent",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto">
                <UserPill user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggle} />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <div
        className="h-9 w-9 rounded-xl grid place-items-center relative"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        <MapPin className="h-4 w-4 text-primary-foreground" />
        <span className="absolute inset-0 rounded-xl pulse-ring" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-lg text-foreground tracking-tight">Lead Finder</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Premium</p>
        </div>
      )}
      {compact && (
        <p className="font-display text-base text-foreground tracking-tight">Lead Finder</p>
      )}
    </Link>
  );
}

function ThemeBtn({ theme, onClick }: { theme: "dark" | "light"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-background/40 transition-colors hover:bg-background/60"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function UserPill({
  user,
  onLogout,
  theme,
  toggleTheme,
}: {
  user: ReturnType<typeof useAuth>["user"];
  onLogout: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  if (!user) return null;
  return (
    <div className="rounded-2xl p-3 flex items-center gap-3 card-premium">
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-border" />
      ) : (
        <div
          className="h-9 w-9 rounded-full grid place-items-center text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          {(user.displayName || user.email || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {user.displayName || user.email}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onLogout}
          aria-label="Sign out"
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
