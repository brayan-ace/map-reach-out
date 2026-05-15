import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getOnboardingStatus } from "@/lib/user-data";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    getOnboardingStatus(user.uid)
      .then((s) => {
        if (!s.completed) navigate({ to: "/onboarding" });
      })
      .catch(() => {})
      .finally(() => setCheckingOnboarding(false));
  }, [user, loading, navigate]);

  if (loading || !user || checkingOnboarding) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
