import { AuthContext } from "@/context/AuthContext";
import { AppRole } from "@/lib/types";
import { Redirect, Slot, useSegments } from "expo-router";
import { useContext, useMemo } from "react";

function requiredRoleForRoute(routeSegment?: string): AppRole | null {
  if (!routeSegment) return null;
  if (routeSegment === "profile") return null;
  if (routeSegment === "doner" || routeSegment === "donation") return "donor";
  if (routeSegment === "ngo") return "ngo";
  if (routeSegment === "volunteer") return "volunteer";
  if (routeSegment === "admin") return "admin";
  return null;
}

export default function DashboardLayout() {
  const segments = useSegments();
  const { user, userRoles, activeRole, ngoSession } = useContext(AuthContext);

  const topDashboardSegment = useMemo(() => {
    const index = (segments as string[]).indexOf("(dashboard)");
    if (index === -1) return undefined;
    return segments[index + 1] as string | undefined;
  }, [segments]);

  const requiredRole = requiredRoleForRoute(topDashboardSegment);

  if (!requiredRole) {
    // Shared pages like profile still require an authenticated user or NGO session.
    if (!user && !ngoSession) return <Redirect href="/(auth)/login" />;
    return <Slot />;
  }

  if (requiredRole === "ngo") {
    if (activeRole !== "ngo") return <Redirect href="/(onboarding)/role-select" />;
    if (!ngoSession) return <Redirect href="/(auth)/ngo-login" />;
    return <Slot />;
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  const roleMatch =
    activeRole === requiredRole || userRoles.includes(requiredRole) || user.role === requiredRole;
  if (!roleMatch) return <Redirect href="/(onboarding)/role-select" />;

  return <Slot />;
}
