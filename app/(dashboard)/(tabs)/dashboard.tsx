import { AuthContext } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { useContext } from "react";
import AdminDashboard from "../admin";
import DonorDashboard from "../doner";
import NgoDashboard from "../ngo";
import VolunteerDashboard from "../volunteer";

export default function RoleDashboardTab() {
  const { activeRole, ngoSession, user } = useContext(AuthContext);

  if (activeRole === "ngo") {
    if (!ngoSession) return <Redirect href="/(auth)/ngo-login" />;
    return <NgoDashboard />;
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (activeRole === "admin") return <AdminDashboard />;
  if (activeRole === "volunteer") return <VolunteerDashboard />;
  return <DonorDashboard />;
}

